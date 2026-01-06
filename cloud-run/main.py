"""
Teknokul Video Generator - Google Cloud Run Service
"""

import os
import json
import time
import base64
import httpx
import tempfile
from pathlib import Path
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Manim imports
from manim import *

app = FastAPI(
    title="Teknokul Video Generator",
    description="AI-powered video solution generator",
    version="1.0.0"
)

# Environment variables
API_SECRET = os.getenv("API_SECRET", "")
TEKNOKUL_API_BASE = os.getenv("TEKNOKUL_API_BASE", "https://teknokul.com.tr")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Teknokul renkleri
TEKNOKUL_PURPLE = "#8B5CF6"
TEKNOKUL_ORANGE = "#F97316"
TEKNOKUL_DARK = "#1E1B4B"

# =====================================================
# MODELS
# =====================================================

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

# =====================================================
# HELPERS
# =====================================================

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
        "narrationText": "Video için okunacak tam metin (doğal, öğretici bir dil ile)",
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
                # JSON parse
                json_str = text
                if "```json" in text:
                    json_str = text.split("```json")[1].split("```")[0]
                elif "```" in text:
                    json_str = text.split("```")[1].split("```")[0]
                
                return json.loads(json_str.strip())
    except Exception as e:
        log(f"Gemini hatası: {e}", "ERROR")
    
    # Fallback
    return {
        "steps": ["Soruyu analiz edelim", "Çözüm adımları", "Sonuç"],
        "narrationText": f"Bu soruyu birlikte çözelim. {question.explanation or 'Adım adım ilerleyelim.'}",
        "finalAnswer": f"Doğru cevap: {question.correct_answer}"
    }

async def generate_audio_with_elevenlabs(text: str, output_path: Path) -> bool:
    """ElevenLabs ile Türkçe ses üret"""
    log("ElevenLabs ile ses üretiliyor...")
    
    if not ELEVENLABS_API_KEY:
        log("ElevenLabs API key yok, ses atlanıyor", "WARN")
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",  # Rachel voice
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "text": text,
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
                log(f"Ses dosyası oluşturuldu: {output_path.name}")
                return True
            else:
                log(f"ElevenLabs hatası: {response.status_code}", "ERROR")
    except Exception as e:
        log(f"Ses üretim hatası: {e}", "ERROR")
    
    return False

def render_video_with_manim(question: VideoRequest, solution: dict, output_dir: Path) -> Optional[Path]:
    """Manim ile video render et"""
    log("Manim ile video render ediliyor...")
    
    # Dinamik Manim scene oluştur
    class VideoSolution(Scene):
        def construct(self):
            self.camera.background_color = TEKNOKUL_DARK
            
            # Başlık
            title = Text(
                question.topic_name or "Soru Çözümü",
                font_size=36,
                color=WHITE
            )
            subtitle = Text(
                f"{question.grade}. Sınıf - {question.subject_name or 'Matematik'}",
                font_size=24,
                color=TEKNOKUL_ORANGE
            )
            
            header = VGroup(title, subtitle).arrange(DOWN, buff=0.3)
            header.to_edge(UP, buff=0.5)
            
            self.play(FadeIn(header))
            self.wait(1)
            
            # Soru metni (kısaltılmış)
            q_text = question.question_text[:150] + "..." if len(question.question_text) > 150 else question.question_text
            question_label = Text("📝 SORU", font_size=28, color=TEKNOKUL_PURPLE)
            question_content = Text(q_text, font_size=18, color=WHITE)
            question_content.scale(0.8)
            
            question_box = VGroup(question_label, question_content).arrange(DOWN, buff=0.3, aligned_edge=LEFT)
            question_box.next_to(header, DOWN, buff=0.5)
            
            self.play(FadeIn(question_box))
            self.wait(3)
            
            # Çözüm
            self.play(FadeOut(question_box))
            
            solution_title = Text("✨ ÇÖZÜM", font_size=32, color=TEKNOKUL_ORANGE)
            solution_title.to_edge(UP, buff=1.5)
            self.play(FadeIn(solution_title))
            
            # Adımlar
            steps = solution.get("steps", [])[:5]
            for i, step in enumerate(steps, 1):
                step_text = str(step)[:100]
                step_obj = Text(f"Adım {i}: {step_text}", font_size=20, color=WHITE)
                step_obj.next_to(solution_title, DOWN, buff=0.3 + i*0.7)
                self.play(Write(step_obj))
                self.wait(2)
            
            self.wait(1)
            
            # Final
            answer = Text(f"✅ Doğru Cevap: {question.correct_answer}", font_size=32, color=GREEN)
            answer.move_to(ORIGIN)
            self.play(FadeIn(answer, scale=1.5))
            self.wait(2)
            
            # Logo
            logo = Text("Teknokul.com.tr", font_size=28, color=TEKNOKUL_PURPLE)
            logo.to_edge(DOWN, buff=0.5)
            self.play(FadeIn(logo))
            self.wait(1)
    
    try:
        # Manim config
        config.pixel_width = 1280
        config.pixel_height = 720
        config.frame_rate = 30
        config.media_dir = str(output_dir)
        config.output_file = f"solution_{question.question_id[:8]}"
        
        scene = VideoSolution()
        scene.render()
        
        # Output dosyasını bul
        video_path = output_dir / "videos" / "720p30" / f"{config.output_file}.mp4"
        if video_path.exists():
            log(f"Video oluşturuldu: {video_path}")
            return video_path
        
        # Alternatif path kontrol
        for mp4 in output_dir.rglob("*.mp4"):
            log(f"Video bulundu: {mp4}")
            return mp4
            
    except Exception as e:
        log(f"Manim render hatası: {e}", "ERROR")
    
    return None

async def upload_to_youtube(video_path: Path, question: VideoRequest) -> Optional[str]:
    """YouTube'a yükle (Teknokul API üzerinden)"""
    log("YouTube'a yükleniyor...")
    
    try:
        # Video dosyasını base64'e çevir
        with open(video_path, "rb") as f:
            video_base64 = base64.b64encode(f.read()).decode()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TEKNOKUL_API_BASE}/api/video/youtube-upload",
                json={
                    "questionId": question.question_id,
                    "videoBase64": video_base64,
                    "title": f"{question.grade}. Sınıf {question.subject_name} | {question.topic_name}",
                    "grade": question.grade,
                    "subject": question.subject_name
                },
                headers={"Authorization": f"Bearer {API_SECRET}"},
                timeout=300
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("videoUrl")
    except Exception as e:
        log(f"YouTube upload hatası: {e}", "ERROR")
    
    return None

async def notify_callback(callback_url: str, result: dict):
    """Callback URL'e sonuç bildir"""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(callback_url, json=result, timeout=30)
    except Exception as e:
        log(f"Callback hatası: {e}", "ERROR")

# =====================================================
# ENDPOINTS
# =====================================================

@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        version="1.0.0"
    )

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        version="1.0.0"
    )

@app.post("/generate")
async def generate_video(
    request: VideoRequest,
    background_tasks: BackgroundTasks,
    authorization: str = Header(None)
):
    """Video üretim isteği"""
    
    # Auth kontrolü
    if API_SECRET and authorization != f"Bearer {API_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    log(f"Video üretim isteği: {request.question_id}")
    
    # Background task olarak çalıştır
    background_tasks.add_task(process_video, request)
    
    return JSONResponse({
        "success": True,
        "message": "Video üretimi başlatıldı",
        "questionId": request.question_id
    })

async def process_video(request: VideoRequest):
    """Video üretim işlemi (background)"""
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
            log(f"Çözüm üretildi: {len(solution.get('steps', []))} adım")
            
            # 2. ElevenLabs ile ses üret
            audio_path = temp_path / "narration.mp3"
            narration = solution.get("narrationText", "")
            audio_success = await generate_audio_with_elevenlabs(narration, audio_path)
            
            # 3. Manim ile video render
            video_path = render_video_with_manim(request, solution, temp_path)
            
            if not video_path:
                raise Exception("Video render edilemedi")
            
            # 4. Ses + Video birleştir (eğer ses varsa)
            final_path = video_path
            if audio_success and audio_path.exists():
                import subprocess
                merged_path = temp_path / "final.mp4"
                subprocess.run([
                    "ffmpeg", "-y",
                    "-i", str(video_path),
                    "-i", str(audio_path),
                    "-c:v", "copy",
                    "-c:a", "aac",
                    "-shortest",
                    str(merged_path)
                ], capture_output=True, timeout=120)
                
                if merged_path.exists():
                    final_path = merged_path
            
            # 5. YouTube'a yükle
            youtube_url = await upload_to_youtube(final_path, request)
            
            if youtube_url:
                result["success"] = True
                result["videoUrl"] = youtube_url
                log(f"✅ Video tamamlandı: {youtube_url}")
            else:
                result["error"] = "YouTube yükleme başarısız"
                
    except Exception as e:
        result["error"] = str(e)
        log(f"❌ Video hatası: {e}", "ERROR")
    
    result["duration"] = time.time() - start_time
    
    # Callback
    if request.callback_url:
        await notify_callback(request.callback_url, result)
    
    return result

@app.post("/generate-sync")
async def generate_video_sync(
    request: VideoRequest,
    authorization: str = Header(None)
):
    """Video üretimi (senkron - bekler)"""
    
    # Auth kontrolü
    if API_SECRET and authorization != f"Bearer {API_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    log(f"Senkron video üretim isteği: {request.question_id}")
    
    result = await process_video(request)
    
    if result["success"]:
        return JSONResponse(result)
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Video üretilemedi"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
