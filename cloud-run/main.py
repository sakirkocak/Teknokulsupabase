"""
Teknokul Video Fabrikası - Cloud Run Service
3Blue1Brown tarzı senkronize animasyonlu video üretimi
manim-voiceover + ElevenLabs + Gemini ile
Version: 4.0.0
"""

import os
import re
import json
import time
import base64
import httpx
import tempfile
import subprocess
import textwrap
from pathlib import Path
from datetime import datetime
from typing import Optional, Tuple

from fastapi import FastAPI, HTTPException, BackgroundTasks, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(
    title="Teknokul Video Fabrikası",
    description="3Blue1Brown tarzı senkronize animasyonlu video üretimi",
    version="4.0.2"
)

# Environment variables
API_SECRET = os.getenv("API_SECRET", "")
TEKNOKUL_API_BASE = os.getenv("TEKNOKUL_API_BASE", "https://teknokul.com.tr")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# ElevenLabs Voice ID (Türkçe erkek sesi)
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")

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


# ============================================================
# SYSTEM PROMPT - Gemini'ye Manim kodu yazdırma talimatları
# ============================================================

MANIM_SYSTEM_PROMPT = """Sen dünyanın en iyi matematik animasyon uzmanısın. manim ve manim-voiceover kütüphanelerini kullanarak eğitici videolar hazırlıyorsun.

GÖREVİN: Sana verilen soruyu çöz ve çözüm için Python kodu üret.

KESİN KURALLAR:

1. Sınıfını VoiceoverScene'den türet, sınıf adı "SoruCozum" olsun.

2. ElevenLabsService kullan, voice_id="{voice_id}" olacak.

3. ASLA wait() komutunu manuel süreyle (örn: wait(3)) kullanma. Süreyi ses belirler.

4. Her anlatım cümlesini `with self.voiceover(text="...") as tracker:` bloğu içine al.

5. Animasyonları bu bloğun içine yaz. Böylece animasyon ve ses %100 senkronize olur.

6. Matematiksel ifadeler için MathTex kullan. LaTeX formatında yaz.

7. Arka plan rengi "#1E1B4B" (Teknokul mor) olsun, yazı rengi beyaz olsun.

8. Türkçe konuş, sıcak ve öğretici bir üslup kullan.

9. Vurgulama için SurroundingRectangle kullan (YELLOW renk).

10. Yazılar için Write, FadeIn, GrowFromCenter gibi efektleri karıştır.

11. Her adımı ayrı voiceover bloğunda anlat (4-6 adım ideal).

12. Son adımda "SONUÇ" veya "CEVAP" başlığı ile doğru cevabı vurgula.

13. Ekranın altına "Teknokul.com.tr" logosu ekle (Text ile).

14. Çıktı olarak SADECE Python kodunu ver, açıklama yapma. Kod ```python ile başlasın.

ÖRNEK YAPI:
```python
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.elevenlabs import ElevenLabsService

class SoruCozum(VoiceoverScene):
    def construct(self):
        self.camera.background_color = "#1E1B4B"
        self.set_speech_service(
            ElevenLabsService(
                voice_id="{voice_id}",
                model="eleven_multilingual_v2"
            )
        )
        
        # Logo
        logo = Text("Teknokul.com.tr", font_size=24, color="#8B5CF6")
        logo.to_edge(DOWN, buff=0.3)
        self.add(logo)
        
        with self.voiceover(text="Merhaba arkadaşlar, bu soruyu birlikte çözelim.") as tracker:
            baslik = Text("Soru Çözümü", font_size=48, color=WHITE)
            self.play(Write(baslik), run_time=tracker.duration)
        
        # ... diğer adımlar
```
"""


# ============================================================
# GEMINI İLE MANIM KODU ÜRETME
# ============================================================

async def generate_manim_code_with_gemini(question: VideoRequest, error_feedback: str = None) -> str:
    """Gemini ile Manim kodu üret"""
    log("🤖 Gemini'den Manim kodu isteniyor...")
    
    # Soru metnini hazırla
    options_text = ""
    if isinstance(question.options, dict):
        for key in ["A", "B", "C", "D", "E"]:
            if key in question.options and question.options[key]:
                options_text += f"{key}) {question.options[key]}\n"
    
    user_prompt = f"""Şu soruyu çöz ve manim-voiceover animasyon kodunu yaz:

KONU: {question.topic_name or 'Matematik'}
SINIF: {question.grade}. Sınıf
DERS: {question.subject_name or 'Matematik'}

SORU:
{question.question_text}

ŞIKLAR:
{options_text}

DOĞRU CEVAP: {question.correct_answer}

{"AÇIKLAMA: " + question.explanation if question.explanation else ""}
"""

    # Eğer önceki denemede hata olduysa, düzeltme iste
    if error_feedback:
        user_prompt += f"""

⚠️ ÖNCEKİ KODDA HATA OLUŞTU:
{error_feedback}

Lütfen hatayı düzelt ve kodu yeniden yaz.
"""

    system_prompt = MANIM_SYSTEM_PROMPT.replace("{voice_id}", ELEVENLABS_VOICE_ID)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={GEMINI_API_KEY}",
                json={
                    "contents": [
                        {"role": "user", "parts": [{"text": system_prompt + "\n\n" + user_prompt}]}
                    ],
                    "generationConfig": {
                        "temperature": 0.7,
                        "maxOutputTokens": 4096
                    }
                },
                timeout=90
            )
            
            if response.status_code == 200:
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                
                # Python kodunu ayıkla
                if "```python" in text:
                    code = text.split("```python")[1].split("```")[0]
                elif "```" in text:
                    code = text.split("```")[1].split("```")[0]
                else:
                    code = text
                
                log(f"✅ Gemini kod üretti: {len(code)} karakter")
                return code.strip()
            else:
                log(f"❌ Gemini API hatası: {response.status_code}", "ERROR")
                
    except Exception as e:
        log(f"❌ Gemini hatası: {e}", "ERROR")
    
    # Fallback - basit bir kod döndür
    return generate_fallback_manim_code(question)


def generate_fallback_manim_code(question: VideoRequest) -> str:
    """Gemini başarısız olursa fallback kod"""
    q_text = (question.question_text or "").replace('"', '\\"')[:150]
    topic = (question.topic_name or "Soru Çözümü").replace('"', '\\"')
    answer = question.correct_answer
    
    return f'''from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.elevenlabs import ElevenLabsService

class SoruCozum(VoiceoverScene):
    def construct(self):
        self.camera.background_color = "#1E1B4B"
        self.set_speech_service(
            ElevenLabsService(
                voice_id="{ELEVENLABS_VOICE_ID}",
                model="eleven_multilingual_v2"
            )
        )
        
        # Logo
        logo = Text("Teknokul.com.tr", font_size=24, color="#8B5CF6")
        logo.to_edge(DOWN, buff=0.3)
        self.add(logo)
        
        # Başlık
        with self.voiceover(text="Merhaba arkadaşlar, bu soruyu birlikte çözelim.") as tracker:
            baslik = Text("{topic}", font_size=48, color=WHITE)
            self.play(Write(baslik), run_time=tracker.duration)
        
        # Soru
        with self.voiceover(text="Öncelikle sorumuza bakalım.") as tracker:
            self.play(FadeOut(baslik))
            soru = Text("{q_text[:80]}...", font_size=28, color=WHITE)
            soru.scale_to_fit_width(12)
            self.play(FadeIn(soru), run_time=tracker.duration)
        
        # Çözüm
        with self.voiceover(text="Şimdi adım adım çözelim.") as tracker:
            self.play(soru.animate.shift(UP * 2))
            cozum = Text("Çözüm adımları...", font_size=32, color=YELLOW)
            self.play(Write(cozum), run_time=tracker.duration)
        
        # Sonuç
        with self.voiceover(text="Ve sonuç olarak doğru cevap {answer} şıkkıdır. Görüşmek üzere!") as tracker:
            self.play(FadeOut(soru), FadeOut(cozum))
            sonuc = Text("CEVAP: {answer}", font_size=64, color=GREEN)
            cerceve = SurroundingRectangle(sonuc, color=GREEN, buff=0.3)
            self.play(Write(sonuc), Create(cerceve), run_time=tracker.duration)
'''


# ============================================================
# MANIM RENDER MOTORU (Self-Healing ile)
# ============================================================

def run_manim_render(code: str, output_dir: Path, max_retries: int = 3) -> Tuple[bool, Optional[Path], Optional[str]]:
    """
    Manim kodunu çalıştır ve video render et.
    Hata olursa hata mesajını döndür (self-healing için).
    """
    scene_file = output_dir / "scene.py"
    
    # Kodu dosyaya yaz
    scene_file.write_text(code, encoding="utf-8")
    log(f"📝 Scene dosyası yazıldı: {scene_file}")
    
    # Manim komutunu çalıştır
    # -ql: low quality (hızlı), -qm: medium, -qh: high, -qk: 4k
    cmd = [
        "manim",
        "-ql",  # Low quality (hızlı render için)
        "--disable_caching",
        "-o", "output.mp4",
        str(scene_file),
        "SoruCozum"
    ]
    
    log(f"🎬 Manim render başlıyor: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5 dakika timeout
            cwd=str(output_dir),
            env={
                **os.environ,
                "ELEVENLABS_API_KEY": ELEVENLABS_API_KEY
            }
        )
        
        if result.returncode == 0:
            # Video dosyasını bul
            video_paths = list(output_dir.rglob("*.mp4"))
            if video_paths:
                video_path = video_paths[0]
                log(f"✅ Render başarılı: {video_path}")
                return True, video_path, None
            else:
                return False, None, "Video dosyası bulunamadı"
        else:
            error_msg = result.stderr[-1500:] if result.stderr else "Bilinmeyen hata"
            log(f"❌ Manim hatası: {error_msg[:200]}", "ERROR")
            return False, None, error_msg
            
    except subprocess.TimeoutExpired:
        return False, None, "Render timeout (5 dakika aşıldı)"
    except Exception as e:
        return False, None, str(e)


async def render_with_self_healing(question: VideoRequest, output_dir: Path) -> Tuple[bool, Optional[Path]]:
    """
    Self-healing ile render: Hata olursa Gemini'ye geri dön ve düzelt.
    """
    max_attempts = 3
    error_feedback = None
    
    for attempt in range(1, max_attempts + 1):
        log(f"🔄 Render denemesi {attempt}/{max_attempts}")
        
        # 1. Manim kodu üret
        code = await generate_manim_code_with_gemini(question, error_feedback)
        
        # 2. Render et
        success, video_path, error = run_manim_render(code, output_dir)
        
        if success and video_path:
            return True, video_path
        
        # 3. Hata varsa bir sonraki deneme için feedback hazırla
        if error:
            error_feedback = f"Deneme {attempt} hatası:\n{error}"
            log(f"⚠️ Self-healing: Hata alındı, Gemini'ye geri dönülüyor...", "WARN")
        
        if attempt < max_attempts:
            time.sleep(2)  # Rate limiting için bekle
    
    log(f"❌ {max_attempts} deneme sonunda render başarısız", "ERROR")
    return False, None


# ============================================================
# THUMBNAIL OLUŞTURMA (FFmpeg ile)
# ============================================================

def create_thumbnail(question: VideoRequest, output_path: Path) -> bool:
    """FFmpeg ile thumbnail üret"""
    try:
        topic = (question.topic_name or "Soru Çözümü").strip()[:40]
        grade = question.grade or 8
        subject = (question.subject_name or "Matematik").strip()
        
        # Basit FFmpeg thumbnail
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", "color=c=0x1E1B4B:s=1280x720:d=1",
            "-vf", f"drawtext=text='{grade}. Sınıf {subject}':fontsize=44:fontcolor=white:x=60:y=60,"
                   f"drawtext=text='{topic}':fontsize=52:fontcolor=0xF97316:x=60:y=130,"
                   f"drawtext=text='Teknokul.com.tr':fontsize=28:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-60",
            "-frames:v", "1",
            str(output_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return result.returncode == 0 and output_path.exists()
    except Exception as e:
        log(f"Thumbnail hatası: {e}", "ERROR")
        return False


# ============================================================
# YOUTUBE UPLOAD
# ============================================================

async def upload_to_youtube(video_path: Path, question: VideoRequest) -> Optional[str]:
    """Videoyu YouTube'a yükle (Teknokul API üzerinden)"""
    log("📤 YouTube'a yükleniyor...")
    
    try:
        # Thumbnail üret
        thumb_path = video_path.with_suffix(".thumb.png")
        create_thumbnail(question, thumb_path)
        
        with open(video_path, "rb") as f:
            video_bytes = f.read()
        
        video_base64 = base64.b64encode(video_bytes).decode()
        video_size_kb = len(video_bytes) / 1024
        
        thumbnail_base64 = None
        if thumb_path.exists():
            thumbnail_base64 = base64.b64encode(thumb_path.read_bytes()).decode()
        
        log(f"📦 Video boyutu: {video_size_kb:.1f} KB")
        
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
                return video_url
            else:
                log(f"❌ YouTube upload hatası: {response.status_code}", "ERROR")
                
    except Exception as e:
        log(f"❌ YouTube upload hatası: {e}", "ERROR")
    
    return None


# ============================================================
# ANA VİDEO İŞLEM FONKSİYONU
# ============================================================

async def process_video(request: VideoRequest):
    """Video üretim işlemi - Video Fabrikası ana akışı"""
    start_time = time.time()
    result = {
        "questionId": request.question_id,
        "success": False,
        "videoUrl": None,
        "error": None
    }
    
    log("=" * 50)
    log(f"🎬 VIDEO FABRİKASI BAŞLADI")
    log(f"📋 Soru: {request.question_text[:100]}...")
    log(f"📚 Konu: {request.topic_name}, Ders: {request.subject_name}, Sınıf: {request.grade}")
    log("=" * 50)
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # 1. Manim ile video render et (self-healing ile)
            log("🎬 Adım 1: Manim render başlıyor...")
            success, video_path = await render_with_self_healing(request, temp_path)
            
            if not success or not video_path:
                raise Exception("Video render başarısız (3 deneme sonunda)")
            
            # 2. YouTube'a yükle
            log("📤 Adım 2: YouTube'a yükleme...")
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
    log(f"⏱️ Toplam süre: {result['duration']:.1f} saniye")
    
    # Callback
    if request.callback_url:
        try:
            async with httpx.AsyncClient() as client:
                await client.post(request.callback_url, json=result, timeout=30)
        except:
            pass
    
    return result


# ============================================================
# API ENDPOINTS
# ============================================================

@app.get("/", response_model=HealthResponse)
@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        version="4.0.2"
    )

@app.post("/generate")
async def generate_video(
    request: VideoRequest,
    background_tasks: BackgroundTasks,
    authorization: str = Header(None)
):
    if API_SECRET and authorization != f"Bearer {API_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    log(f"📥 Video üretim isteği: {request.question_id}")
    background_tasks.add_task(process_video, request)
    
    return JSONResponse({
        "success": True,
        "message": "Video üretimi başlatıldı (Video Fabrikası v4.0)",
        "questionId": request.question_id
    })

@app.post("/generate-sync")
async def generate_video_sync(
    request: VideoRequest,
    authorization: str = Header(None)
):
    if API_SECRET and authorization != f"Bearer {API_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    log(f"📥 Senkron video üretim isteği: {request.question_id}")
    result = await process_video(request)
    
    if result.get("success"):
        return JSONResponse(result)
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Video üretilemedi"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
