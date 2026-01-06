"""
Teknokul Video Generator - Google Cloud Run Service
Video üretir ve Supabase Storage'a yükler
"""

import os
import json
import time
import base64
import httpx
import tempfile
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(
    title="Teknokul Video Generator",
    description="AI-powered video solution generator",
    version="1.0.1"
)

# Environment variables
API_SECRET = os.getenv("API_SECRET", "")
TEKNOKUL_API_BASE = os.getenv("TEKNOKUL_API_BASE", "https://teknokul.com.tr")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# Teknokul renkleri
TEKNOKUL_PURPLE = "#8B5CF6"
TEKNOKUL_ORANGE = "#F97316"
TEKNOKUL_DARK = "#1E1B4B"

class VideoRequest(BaseModel):
    question_id: str
    question_text: str
    options: dict
    correct_answer: str
    explanation: Optional[str] = None
    topic_name: Optional[str] = None
    subject_name: Optional[str] = None
    grade: Optional[int] = 8
    callback_url: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str

def log(message: str, level: str = "INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

async def generate_solution_with_gemini(question: VideoRequest) -> dict:
    """Gemini ile çözüm üret"""
    log("Gemini ile çözüm üretiliyor...")
    
    prompt = f"""
    Aşağıdaki soruyu Türkçe olarak adım adım çöz.
    
    SORU: {question.question_text}
    
    ŞIKLAR:
    {json.dumps(question.options, ensure_ascii=False)}
    
    DOĞRU CEVAP: {question.correct_answer}
    
    Yanıtını şu JSON formatında ver:
    {{
        "steps": ["Adım 1: ...", "Adım 2: ...", ...],
        "narrationText": "Video için okunacak tam metin (doğal, öğretici bir dil ile, maksimum 500 karakter)",
        "finalAnswer": "Doğru cevap açıklaması"
    }}
    """
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.7}
                },
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                json_str = text
                if "```json" in text:
                    json_str = text.split("```json")[1].split("```")[0]
                elif "```" in text:
                    json_str = text.split("```")[1].split("```")[0]
                
                result = json.loads(json_str.strip())
                log(f"Gemini çözüm üretti: {len(result.get('steps', []))} adım")
                return result
    except Exception as e:
        log(f"Gemini hatası: {e}", "ERROR")
    
    return {
        "steps": ["Soruyu analiz edelim", "Çözüm adımları", "Sonuç"],
        "narrationText": f"Bu soruyu birlikte çözelim. {question.explanation or 'Adım adım ilerleyelim.'}",
        "finalAnswer": f"Doğru cevap: {question.correct_answer}"
    }

async def generate_audio_with_elevenlabs(text: str, output_path: Path) -> bool:
    """ElevenLabs ile Türkçe ses üret"""
    log(f"ElevenLabs ile ses üretiliyor... ({len(text)} karakter)")
    
    if not ELEVENLABS_API_KEY:
        log("ElevenLabs API key yok, ses atlanıyor", "WARN")
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "text": text[:1000],  # Max 1000 karakter
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                },
                timeout=120
            )
            
            if response.status_code == 200:
                with open(output_path, "wb") as f:
                    f.write(response.content)
                log(f"Ses dosyası oluşturuldu: {output_path.name} ({len(response.content)} bytes)")
                return True
            else:
                log(f"ElevenLabs hatası: {response.status_code} - {response.text[:200]}", "ERROR")
    except Exception as e:
        log(f"Ses üretim hatası: {e}", "ERROR")
    
    return False

def create_simple_video(question: VideoRequest, solution: dict, output_path: Path, audio_path: Optional[Path] = None) -> bool:
    """FFmpeg ile basit video oluştur (Manim yerine)"""
    log("FFmpeg ile video oluşturuluyor...")
    
    try:
        # Metin dosyası oluştur
        text_content = f"""
{question.topic_name or 'Soru Çözümü'}
{question.grade}. Sınıf - {question.subject_name or 'Matematik'}

SORU:
{question.question_text[:200]}

ÇÖZÜM:
{chr(10).join(solution.get('steps', ['Çözüm adımları'])[:5])}

DOĞRU CEVAP: {question.correct_answer}

Teknokul.com.tr
"""
        
        # Video süresi (ses varsa ses süresine göre, yoksa 10 saniye)
        duration = 10
        if audio_path and audio_path.exists():
            probe = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", str(audio_path)],
                capture_output=True, text=True
            )
            if probe.returncode == 0:
                duration = float(probe.stdout.strip()) + 1
        
        # Basit renkli arka plan video oluştur
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", f"color=c=0x1E1B4B:s=1280x720:d={duration}",
            "-vf", f"drawtext=text='{question.topic_name or 'Soru Cozumu'}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=50,drawtext=text='Teknokul.com.tr':fontsize=24:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-50",
            "-c:v", "libx264",
            "-t", str(duration),
            "-pix_fmt", "yuv420p"
        ]
        
        # Ses varsa ekle
        if audio_path and audio_path.exists():
            temp_video = output_path.with_suffix('.temp.mp4')
            cmd.append(str(temp_video))
            
            subprocess.run(cmd, capture_output=True, timeout=60)
            
            # Ses ekle
            merge_cmd = [
                "ffmpeg", "-y",
                "-i", str(temp_video),
                "-i", str(audio_path),
                "-c:v", "copy",
                "-c:a", "aac",
                "-shortest",
                str(output_path)
            ]
            subprocess.run(merge_cmd, capture_output=True, timeout=60)
            temp_video.unlink(missing_ok=True)
        else:
            cmd.append(str(output_path))
            subprocess.run(cmd, capture_output=True, timeout=60)
        
        if output_path.exists():
            log(f"Video oluşturuldu: {output_path.name}")
            return True
            
    except Exception as e:
        log(f"Video oluşturma hatası: {e}", "ERROR")
    
    return False

async def upload_to_teknokul(video_path: Path, question: VideoRequest) -> Optional[str]:
    """Videoyu Teknokul API'ye gönder (Supabase Storage'a yükler)"""
    log("Video Teknokul'a yükleniyor...")
    
    try:
        with open(video_path, "rb") as f:
            video_bytes = f.read()
        
        video_base64 = base64.b64encode(video_bytes).decode()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TEKNOKUL_API_BASE}/api/video/upload-storage",
                json={
                    "questionId": question.question_id,
                    "videoBase64": video_base64,
                    "fileName": f"solution_{question.question_id[:8]}.mp4"
                },
                headers={"Authorization": f"Bearer {API_SECRET}"},
                timeout=120
            )
            
            if response.status_code == 200:
                data = response.json()
                video_url = data.get("videoUrl")
                log(f"Video yüklendi: {video_url}")
                return video_url
            else:
                log(f"Upload hatası: {response.status_code} - {response.text[:200]}", "ERROR")
    except Exception as e:
        log(f"Upload hatası: {e}", "ERROR")
    
    return None

@app.get("/", response_model=HealthResponse)
@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        version="1.0.1"
    )

@app.post("/generate")
async def generate_video(
    request: VideoRequest,
    background_tasks: BackgroundTasks,
    authorization: str = Header(None)
):
    if API_SECRET and authorization != f"Bearer {API_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    log(f"Video üretim isteği: {request.question_id}")
    background_tasks.add_task(process_video, request)
    
    return JSONResponse({
        "success": True,
        "message": "Video üretimi başlatıldı",
        "questionId": request.question_id
    })

async def process_video(request: VideoRequest):
    """Video üretim işlemi"""
    start_time = time.time()
    result = {
        "questionId": request.question_id,
        "success": False,
        "videoUrl": None,
        "error": None
    }
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # 1. Gemini ile çözüm üret
            solution = await generate_solution_with_gemini(request)
            
            # 2. ElevenLabs ile ses üret
            audio_path = temp_path / "narration.mp3"
            narration = solution.get("narrationText", "Bu soruyu birlikte çözelim.")
            audio_success = await generate_audio_with_elevenlabs(narration, audio_path)
            
            # 3. Video oluştur
            video_path = temp_path / f"solution_{request.question_id[:8]}.mp4"
            video_success = create_simple_video(
                request, 
                solution, 
                video_path, 
                audio_path if audio_success else None
            )
            
            if not video_success or not video_path.exists():
                raise Exception("Video oluşturulamadı")
            
            # 4. Teknokul'a yükle
            video_url = await upload_to_teknokul(video_path, request)
            
            if video_url:
                result["success"] = True
                result["videoUrl"] = video_url
                log(f"✅ Video tamamlandı: {video_url}")
            else:
                # Video oluştu ama yüklenemedi - base64 olarak dön
                with open(video_path, "rb") as f:
                    video_base64 = base64.b64encode(f.read()).decode()
                result["success"] = True
                result["videoBase64"] = video_base64
                result["message"] = "Video oluşturuldu, yükleme bekliyor"
                log("⚠️ Video oluşturuldu ama yüklenemedi")
                
    except Exception as e:
        result["error"] = str(e)
        log(f"❌ Video hatası: {e}", "ERROR")
    
    result["duration"] = time.time() - start_time
    
    if request.callback_url:
        try:
            async with httpx.AsyncClient() as client:
                await client.post(request.callback_url, json=result, timeout=30)
        except:
            pass
    
    return result

@app.post("/generate-sync")
async def generate_video_sync(
    request: VideoRequest,
    authorization: str = Header(None)
):
    if API_SECRET and authorization != f"Bearer {API_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    log(f"Senkron video üretim isteği: {request.question_id}")
    result = await process_video(request)
    
    if result.get("success"):
        return JSONResponse(result)
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Video üretilemedi"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
