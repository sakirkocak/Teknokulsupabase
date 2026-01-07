"""
Teknokul Video Generator - Google Cloud Run Service
Video üretir ve YouTube'a yükler
"""

import os
import json
import time
import base64
import httpx
import tempfile
import subprocess
import textwrap
from pathlib import Path
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(
    title="Teknokul Video Generator",
    description="AI-powered video solution generator",
    version="1.0.2"
)

# Environment variables
API_SECRET = os.getenv("API_SECRET", "")
TEKNOKUL_API_BASE = os.getenv("TEKNOKUL_API_BASE", "https://teknokul.com.tr")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

class VideoRequest(BaseModel):
    question_id: str
    question_text: str
    question_image_url: Optional[str] = None
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
        "narrationText": "Video için okunacak tam metin (yavaş ve anlaşılır; kısa cümleler; bol noktalama ve duraklama; maksimum 500 karakter)",
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
                    "text": text[:1000],
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

def _ffmpeg_escape_path_for_filter(path: Path) -> str:
    # drawtext textfile yolu için ':' kaçır (ör: /tmp/a:b.txt -> /tmp/a\:b.txt)
    return str(path).replace("\\", "\\\\").replace(":", "\\:")

def _pick_fontfile() -> Optional[str]:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            return p
    return None

def _build_question_overlay_text(question: VideoRequest) -> str:
    q = (question.question_text or "").strip().replace("\r", " ")
    q = " ".join(q.split())
    q_wrapped = textwrap.fill(q, width=44)

    options_lines = []
    if isinstance(question.options, dict):
        for key in ["A", "B", "C", "D", "E"]:
            if key in question.options and question.options.get(key):
                opt = str(question.options.get(key)).strip().replace("\r", " ")
                opt = " ".join(opt.split())
                opt_wrapped = textwrap.fill(opt, width=42, subsequent_indent="   ")
                options_lines.append(f"{key}) {opt_wrapped}")

    parts = [
        "SORU:",
        q_wrapped,
        "",
    ]
    if options_lines:
        parts.append("ŞIKLAR:")
        parts.extend(options_lines)
        parts.append("")
    parts.append(f"Doğru cevap: {question.correct_answer}")
    return "\n".join(parts).strip()

def _download_question_image(url: str, dest: Path) -> Optional[Path]:
    if not url:
        return None
    try:
        r = httpx.get(url, timeout=20)
        if r.status_code == 200 and r.content:
            dest.write_bytes(r.content)
            return dest
    except Exception:
        return None
    return None

def _audio_duration_seconds(audio_path: Path) -> Optional[float]:
    try:
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(audio_path)],
            capture_output=True, text=True
        )
        if probe.returncode == 0:
            return float(probe.stdout.strip())
    except Exception:
        return None
    return None

def _slow_down_audio(input_audio: Path, output_audio: Path, speed: float = 0.90) -> bool:
    # speed<1 => yavaşlat. atempo faktörü 0.5-2.0 aralığında olmalı.
    try:
        result = subprocess.run(
            ["ffmpeg", "-y", "-i", str(input_audio), "-filter:a", f"atempo={speed}", str(output_audio)],
            capture_output=True, text=True, timeout=60
        )
        return result.returncode == 0 and output_audio.exists()
    except Exception:
        return False

def create_thumbnail(question: VideoRequest, output_path: Path, image_path: Optional[Path] = None) -> bool:
    """FFmpeg ile thumbnail üret"""
    try:
        fontfile = _pick_fontfile()
        topic = (question.topic_name or "Soru Çözümü").strip()
        grade = question.grade or 8
        subject = (question.subject_name or "Matematik").strip()
        q_short = (question.question_text or "").strip().replace("\n", " ")
        q_short = " ".join(q_short.split())[:120]

        textfile = output_path.with_suffix(".txt")
        textfile.write_text(textwrap.fill(q_short, width=34), encoding="utf-8")
        tf = _ffmpeg_escape_path_for_filter(textfile)

        inputs = ["-f", "lavfi", "-i", "color=c=0x1E1B4B:s=1280x720:d=1"]
        filter_parts = ["[0:v]"]

        if image_path and image_path.exists():
            inputs += ["-i", str(image_path)]
            filter_parts.append(
                "[1:v]scale=560:-1:force_original_aspect_ratio=decrease[img];"
                "[0:v][img]overlay=60:180:format=auto[bg];"
                "[bg]"
            )

        draw = []
        if fontfile:
            draw.append(f"drawtext=fontfile={fontfile}:text='{grade}. Sınıf {subject}':fontsize=44:fontcolor=white:x=60:y=60")
            draw.append(f"drawtext=fontfile={fontfile}:text='{topic}':fontsize=52:fontcolor=0xF97316:x=60:y=120")
            draw.append("drawbox=x=640:y=210:w=580:h=300:color=black@0.35:t=fill")
            draw.append(f"drawtext=fontfile={fontfile}:textfile='{tf}':reload=0:fontsize=30:fontcolor=white:x=660:y=230:line_spacing=10")
            draw.append(f"drawtext=fontfile={fontfile}:text='Teknokul.com.tr':fontsize=28:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-60")
        else:
            draw.append(f"drawtext=text='{grade}. Sınıf {subject}':fontsize=44:fontcolor=white:x=60:y=60")
            draw.append(f"drawtext=text='{topic}':fontsize=52:fontcolor=0xF97316:x=60:y=120")
            draw.append("drawbox=x=640:y=210:w=580:h=300:color=black@0.35:t=fill")
            draw.append(f"drawtext=textfile='{tf}':reload=0:fontsize=30:fontcolor=white:x=660:y=230:line_spacing=10")
            draw.append("drawtext=text='Teknokul.com.tr':fontsize=28:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-60")

        vf = ",".join(draw)
        cmd = ["ffmpeg", "-y", *inputs, "-frames:v", "1", "-vf", vf, str(output_path)]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        textfile.unlink(missing_ok=True)
        return res.returncode == 0 and output_path.exists()
    except Exception:
        return False

def create_simple_video(question: VideoRequest, solution: dict, output_path: Path, audio_path: Optional[Path] = None) -> bool:
    """FFmpeg ile video oluştur (intro + soru metni + varsa görsel)"""
    log("FFmpeg ile video oluşturuluyor...")

    try:
        # --- Audio (yavaşlat) ---
        intro_seconds = 2.0
        final_audio: Optional[Path] = None
        duration = 14.0

        if audio_path and audio_path.exists():
            slow_audio = audio_path.with_name("narration_slow.mp3")
            if _slow_down_audio(audio_path, slow_audio, speed=0.90):
                final_audio = slow_audio
            else:
                final_audio = audio_path

            aud_dur = _audio_duration_seconds(final_audio)
            if aud_dur:
                duration = aud_dur + intro_seconds + 1.0

        # --- Optional image download ---
        img_path: Optional[Path] = None
        if question.question_image_url:
            img_path = _download_question_image(question.question_image_url, output_path.with_suffix(".img"))

        fontfile = _pick_fontfile()
        topic = (question.topic_name or "Soru Çözümü").strip().replace("'", "").replace('"', '')

        # --- Main text file for drawtext ---
        overlay_text = _build_question_overlay_text(question)
        textfile = output_path.with_suffix(".txt")
        textfile.write_text(overlay_text, encoding="utf-8")
        tf = _ffmpeg_escape_path_for_filter(textfile)

        # --- Intro clip ---
        intro_path = output_path.with_suffix(".intro.mp4")
        intro_draw = []
        if fontfile:
            intro_draw.append(f"drawtext=fontfile={fontfile}:text='Teknokul':fontsize=78:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-40")
            intro_draw.append(f"drawtext=fontfile={fontfile}:text='Video Soru Çözümü':fontsize=42:fontcolor=0xF97316:x=(w-text_w)/2:y=(h-text_h)/2+40")
            intro_draw.append(f"drawtext=fontfile={fontfile}:text='teknokul.com.tr':fontsize=28:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-70")
        else:
            intro_draw.append("drawtext=text='Teknokul':fontsize=78:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-40")
            intro_draw.append("drawtext=text='Video Soru Çözümü':fontsize=42:fontcolor=0xF97316:x=(w-text_w)/2:y=(h-text_h)/2+40")
            intro_draw.append("drawtext=text='teknokul.com.tr':fontsize=28:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-70")

        intro_cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", f"color=c=0x1E1B4B:s=1280x720:d={intro_seconds}",
            "-vf", ",".join(intro_draw),
            "-c:v", "libx264",
            "-t", str(intro_seconds),
            "-pix_fmt", "yuv420p",
            str(intro_path)
        ]
        subprocess.run(intro_cmd, capture_output=True, text=True, timeout=60)

        # --- Main clip ---
        main_seconds = max(8.0, duration - intro_seconds)
        main_path = output_path.with_suffix(".main.mp4")

        inputs = ["-f", "lavfi", "-i", f"color=c=0x1E1B4B:s=1280x720:d={main_seconds}"]
        use_filter_complex = False

        if img_path and img_path.exists():
            inputs += ["-i", str(img_path)]
            text_x = 660
            box_x = 640
            box_w = 580
            use_filter_complex = True
        else:
            text_x = 120
            box_x = 80
            box_w = 1120

        draw = []
        # Başlık
        if fontfile:
            draw.append(f"drawtext=fontfile={fontfile}:text='{topic}':fontsize=54:fontcolor=white:x=(w-text_w)/2:y=50")
        else:
            draw.append(f"drawtext=text='{topic}':fontsize=54:fontcolor=white:x=(w-text_w)/2:y=50")

        # Metin kutusu
        draw.append(f"drawbox=x={box_x}:y=160:w={box_w}:h=470:color=black@0.35:t=fill")
        if fontfile:
            draw.append(f"drawtext=fontfile={fontfile}:textfile='{tf}':reload=0:fontsize=28:fontcolor=white:x={text_x}:y=180:line_spacing=8")
        else:
            draw.append(f"drawtext=textfile='{tf}':reload=0:fontsize=28:fontcolor=white:x={text_x}:y=180:line_spacing=8")

        # Footer
        if fontfile:
            draw.append(f"drawtext=fontfile={fontfile}:text='Teknokul.com.tr':fontsize=26:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-60")
        else:
            draw.append("drawtext=text='Teknokul.com.tr':fontsize=26:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-60")

        if use_filter_complex:
            # Görsel + text overlay
            vf = (
                "[1:v]scale=560:-1:force_original_aspect_ratio=decrease[img];"
                f"[0:v][img]overlay=60:180:format=auto,{','.join(draw)}[v]"
            )
            cmd = [
                "ffmpeg", "-y",
                *inputs,
                "-filter_complex", vf,
                "-map", "[v]",
                "-c:v", "libx264",
                "-t", str(main_seconds),
                "-pix_fmt", "yuv420p",
                str(main_path)
            ]
        else:
            vf = ",".join(draw)
            cmd = ["ffmpeg", "-y", *inputs, "-vf", vf, "-c:v", "libx264",
                   "-t", str(main_seconds), "-pix_fmt", "yuv420p", str(main_path)]
        subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        # --- Concat intro + main ---
        concat_path = output_path.with_suffix(".concat.mp4")
        concat_cmd = [
            "ffmpeg", "-y",
            "-i", str(intro_path),
            "-i", str(main_path),
            "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0[v]",
            "-map", "[v]",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            str(concat_path)
        ]
        subprocess.run(concat_cmd, capture_output=True, text=True, timeout=120)

        # --- Merge audio (intro kadar geciktir) ---
        if final_audio and final_audio.exists():
            merge_cmd = [
                "ffmpeg", "-y",
                "-i", str(concat_path),
                "-i", str(final_audio),
                "-filter_complex", f"[1:a]adelay={int(intro_seconds*1000)}|{int(intro_seconds*1000)}[a]",
                "-map", "0:v:0",
                "-map", "[a]",
                "-c:v", "copy",
                "-c:a", "aac",
                "-shortest",
                str(output_path)
            ]
            subprocess.run(merge_cmd, capture_output=True, text=True, timeout=120)
        else:
            concat_path.replace(output_path)

        # Cleanup
        textfile.unlink(missing_ok=True)
        if img_path and img_path.exists():
            img_path.unlink(missing_ok=True)
        intro_path.unlink(missing_ok=True)
        main_path.unlink(missing_ok=True)
        concat_path.unlink(missing_ok=True)

        if output_path.exists():
            log(f"Video oluşturuldu: {output_path.name}")
            return True
    except Exception as e:
        log(f"Video oluşturma hatası: {e}", "ERROR")
    return False

async def upload_to_youtube(video_path: Path, question: VideoRequest) -> Optional[str]:
    """Videoyu YouTube'a yükle (Teknokul API üzerinden)"""
    log("YouTube'a yükleniyor...")
    
    try:
        # Thumbnail üret
        thumb_path = video_path.with_suffix(".thumb.png")
        img_path: Optional[Path] = None
        if question.question_image_url:
            img_path = _download_question_image(question.question_image_url, video_path.with_suffix(".thumb_img"))
        create_thumbnail(question, thumb_path, image_path=img_path)

        with open(video_path, "rb") as f:
            video_bytes = f.read()
        
        video_base64 = base64.b64encode(video_bytes).decode()
        video_size_kb = len(video_bytes) / 1024

        thumbnail_base64: Optional[str] = None
        if thumb_path.exists():
            thumbnail_base64 = base64.b64encode(thumb_path.read_bytes()).decode()
        
        log(f"Video boyutu: {video_size_kb:.1f} KB, YouTube'a gönderiliyor...")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TEKNOKUL_API_BASE}/api/video/youtube-upload",
                json={
                    "questionId": question.question_id,
                    "videoBase64": video_base64,
                    "thumbnailBase64": thumbnail_base64,
                    "thumbnailMimeType": "image/png",
                    "title": f"{question.grade}. Sınıf {question.subject_name} | {question.topic_name}",
                    "grade": question.grade,
                    "subject": question.subject_name,
                    "topicName": question.topic_name,
                    "questionText": question.question_text[:500]
                },
                headers={"Authorization": f"Bearer {API_SECRET}"},
                timeout=300
            )
            
            if response.status_code == 200:
                data = response.json()
                video_url = data.get("videoUrl")
                log(f"✅ YouTube'a yüklendi: {video_url}")
                try:
                    thumb_path.unlink(missing_ok=True)
                    if img_path:
                        img_path.unlink(missing_ok=True)
                except Exception:
                    pass
                return video_url
            else:
                error_msg = response.text[:500]
                log(f"YouTube upload hatası: {response.status_code} - {error_msg}", "ERROR")
                return None
                
    except Exception as e:
        log(f"YouTube upload hatası: {e}", "ERROR")
    
    return None

@app.get("/", response_model=HealthResponse)
@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        version="1.0.2"
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
            
            # 4. YouTube'a yükle
            video_url = await upload_to_youtube(video_path, request)
            
            if video_url:
                result["success"] = True
                result["videoUrl"] = video_url
                log(f"✅ Video tamamlandı: {video_url}")
            else:
                raise Exception("YouTube yükleme başarısız")
                
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
