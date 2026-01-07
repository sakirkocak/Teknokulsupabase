"""
Teknokul Video Factory - Cloud Run Service
Manim + ElevenLabs + VoiceoverScene ile profesyonel video üretimi
Hibrit Upload: Supabase Storage (hızlı) + YouTube (SEO)
"""

import os
import json
import time
import base64
import tempfile
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx

app = FastAPI(
    title="Teknokul Video Factory",
    description="AI-powered video solution generator",
    version="5.0.0"
)

# Environment variables
API_SECRET = os.getenv("API_SECRET", "")
TEKNOKUL_API_BASE = os.getenv("TEKNOKUL_API_BASE", "https://teknokul.com.tr")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# Gemini System Prompt
GEMINI_SYSTEM_PROMPT = """Sen Teknokul'un enerjik matematik öğretmenisin.

KURALLAR:
- SADECE JSON formatında cevap ver, başka bir şey yazma
- Direkt "Selam!" veya "Merhaba!" diye başla, kendini tanıtma
- SES METNİNDE MATEMATİK İFADELERİNİ TÜRKÇE OKU:
  * "f(x)" yerine "f x fonksiyonu" de
  * "f(5)" yerine "f beş" de
  * "2x" yerine "iki çarpı x" de
  * "+" yerine "artı" de
  * "=" yerine "eşittir" de
  * ASLA İNGİLİZCE OKUMA!
- Kapanış kısa olsun (max 10 kelime)
- 3-5 adım olsun

JSON:
{
  "video_senaryosu": {
    "hook_cumlesi": "Dikkat çekici giriş - max 15 kelime",
    "adimlar": [
      {"adim_no": 1, "tts_metni": "Türkçe ses metni", "ekranda_gosterilecek_metin": "Ekran metni", "vurgu_rengi": "YELLOW"}
    ],
    "kapanis_cumlesi": "Kısa kapanış"
  },
  "thumbnail_bilgisi": {
    "ana_metin": "VURUCU BAŞLIK",
    "yan_metin": "Konu",
    "zorluk_etiketi": "ORTA"
  }
}"""


class VideoRequest(BaseModel):
    question_id: str
    question_text: str
    question_image_url: Optional[str] = None
    options: dict = {}
    correct_answer: str = ""
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
# GEMİNİ İLE SENARYO ÜRET
# ============================================================

async def generate_scenario_with_gemini(question: VideoRequest) -> dict:
    """Gemini ile video senaryosu üret"""
    log("🎬 Gemini ile senaryo üretiliyor...")
    
    user_prompt = f"""SORU: {question.question_text}
ŞIKLAR: {json.dumps(question.options, ensure_ascii=False)}
DOĞRU CEVAP: {question.correct_answer}
KONU: {question.topic_name or 'Matematik'}
SINIF: {question.grade}. Sınıf"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"role": "user", "parts": [{"text": GEMINI_SYSTEM_PROMPT + "\n\n" + user_prompt}]}],
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
                
                scenario = json.loads(json_str.strip())
                log(f"✅ Senaryo üretildi: {len(scenario.get('video_senaryosu', {}).get('adimlar', []))} adım")
                return scenario
            else:
                log(f"❌ Gemini hatası: {response.status_code}", "ERROR")
                
    except Exception as e:
        log(f"❌ Gemini hatası: {e}", "ERROR")
    
    # Fallback senaryo
    return {
        "video_senaryosu": {
            "hook_cumlesi": "Bu soruyu birlikte çözelim!",
            "adimlar": [
                {"adim_no": 1, "tts_metni": f"Sorumuzu inceleyelim: {question.question_text[:100]}", "ekranda_gosterilecek_metin": "Soru", "vurgu_rengi": "YELLOW"},
                {"adim_no": 2, "tts_metni": "Adım adım çözelim.", "ekranda_gosterilecek_metin": "Çözüm", "vurgu_rengi": "GREEN"},
                {"adim_no": 3, "tts_metni": f"Doğru cevap {question.correct_answer} şıkkı!", "ekranda_gosterilecek_metin": f"Cevap: {question.correct_answer}", "vurgu_rengi": "GREEN"}
            ],
            "kapanis_cumlesi": "Teknokul'da kalın!"
        },
        "thumbnail_bilgisi": {
            "ana_metin": "SORU ÇÖZÜMÜ",
            "yan_metin": question.topic_name or "Matematik",
            "zorluk_etiketi": "ORTA"
        }
    }


# ============================================================
# MANİM VİDEO OLUŞTUR
# ============================================================

def create_manim_video(scenario: dict, question: VideoRequest, temp_dir: Path) -> Optional[Path]:
    """Manim + VoiceoverScene ile video oluştur"""
    log("🎬 Manim ile video üretiliyor...")
    
    video_data = scenario.get("video_senaryosu", {})
    
    # Manim script oluştur
    script_content = f'''
from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.elevenlabs import ElevenLabsService
import os

os.environ["ELEVEN_API_KEY"] = "{ELEVENLABS_API_KEY}"

config.frame_width = 9
config.frame_height = 16
config.pixel_width = 1080
config.pixel_height = 1920
config.frame_rate = 30
config.background_color = "#1a1a2e"

TEKNOKUL_PURPLE = "#8B5CF6"
TEKNOKUL_ORANGE = "#F97316"

class VideoScene(VoiceoverScene):
    def construct(self):
        self.set_speech_service(
            ElevenLabsService(
                voice_id="21m00Tcm4TlvDq8ikWAM",
                model="eleven_multilingual_v2",
                transcription_model=None
            )
        )
        
        # Logo
        logo = Text("teknokul.com.tr", font_size=28, color=TEKNOKUL_PURPLE)
        logo.to_edge(DOWN, buff=0.3)
        self.add(logo)
        
        # Hook
        hook_text = """{video_data.get('hook_cumlesi', 'Soruyu çözelim!')}"""
        with self.voiceover(text=hook_text) as tracker:
            warning = Text("🚨 DİKKAT 🚨", font_size=72, color=RED)
            self.play(FadeIn(warning, scale=1.5), run_time=tracker.duration * 0.4)
            self.play(warning.animate.set_color(YELLOW), run_time=tracker.duration * 0.3)
            self.play(FadeOut(warning), run_time=tracker.duration * 0.3)
'''
    
    # Adımları ekle
    adimlar = video_data.get("adimlar", [])
    for i, adim in enumerate(adimlar[:6], 1):
        tts = adim.get("tts_metni", f"Adım {i}").replace('"', '\\"').replace("'", "\\'")
        display = adim.get("ekranda_gosterilecek_metin", f"Adım {i}").replace('"', '\\"').replace("'", "\\'")
        color = adim.get("vurgu_rengi", "WHITE")
        
        script_content += f'''
        # Adım {i}
        with self.voiceover(text="{tts}") as tracker:
            badge = Circle(radius=0.7, color=TEKNOKUL_ORANGE, fill_opacity=1, stroke_color=WHITE, stroke_width=3)
            badge_text = Text("{i}", font_size=56, color=WHITE, weight=BOLD)
            badge_text.move_to(badge.get_center())
            badge_group = VGroup(badge, badge_text)
            badge_group.to_edge(UP, buff=1.5)
            
            box = RoundedRectangle(width=8, height=5, corner_radius=0.4, fill_color="#16213e", fill_opacity=0.95, stroke_color={color}, stroke_width=4)
            box.move_to(DOWN * 1)
            
            content = Text("{display}", font_size=44, color={color}, weight=BOLD)
            content.move_to(box.get_center())
            if content.width > 7:
                content.scale_to_fit_width(7)
            
            self.play(FadeIn(badge_group, shift=DOWN), run_time=tracker.duration * 0.15)
            self.play(GrowFromCenter(box), run_time=tracker.duration * 0.15)
            self.play(Write(content), run_time=tracker.duration * 0.5)
            self.wait(tracker.duration * 0.2)
        
        self.play(FadeOut(badge_group), FadeOut(box), FadeOut(content), run_time=0.3)
'''
    
    # Kapanış
    kapanis = video_data.get("kapanis_cumlesi", "Teknokul'da kalın!").replace('"', '\\"').replace("'", "\\'")
    script_content += f'''
        # Kapanış
        with self.voiceover(text="{kapanis}") as tracker:
            result = Text("✅ SONUÇ", font_size=72, color=GREEN, weight=BOLD)
            result.to_edge(UP, buff=1.5)
            
            outro = Text("{kapanis}", font_size=56, color=WHITE, weight=BOLD)
            outro.move_to(UP * 0.5)
            if outro.width > 8:
                outro.scale_to_fit_width(8)
            
            big_logo = Text("Teknokul", font_size=64, color=TEKNOKUL_ORANGE, weight=BOLD)
            big_logo.move_to(DOWN * 3)
            
            slogan = Text("Eğitimin Dijital Üssü", font_size=32, color=WHITE)
            slogan.next_to(big_logo, DOWN, buff=0.3)
            
            self.play(FadeIn(result, shift=DOWN), run_time=tracker.duration * 0.2)
            self.play(Write(outro), run_time=tracker.duration * 0.4)
            self.play(FadeIn(big_logo, shift=UP), FadeIn(slogan, shift=UP), run_time=tracker.duration * 0.4)
        
        self.wait(1)
'''
    
    # Script'i kaydet
    script_path = temp_dir / "video_scene.py"
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(script_content)
    
    # Manim çalıştır
    try:
        result = subprocess.run(
            ["manim", "-ql", "--format=mp4", str(script_path), "VideoScene"],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            timeout=600,
            env={**os.environ, "ELEVEN_API_KEY": ELEVENLABS_API_KEY}
        )
        
        if result.returncode != 0:
            log(f"❌ Manim hatası: {result.stderr[:500]}", "ERROR")
            return None
        
        # Video dosyasını bul
        for video_file in temp_dir.rglob("*.mp4"):
            if "VideoScene" in video_file.name:
                log(f"✅ Video oluşturuldu: {video_file.name}")
                return video_file
        
        log("❌ Video dosyası bulunamadı", "ERROR")
        return None
        
    except subprocess.TimeoutExpired:
        log("❌ Manim timeout (10 dakika)", "ERROR")
        return None
    except Exception as e:
        log(f"❌ Manim hatası: {e}", "ERROR")
        return None


# ============================================================
# SUPABASE STORAGE UPLOAD
# ============================================================

async def upload_to_supabase_storage(video_path: Path, question_id: str) -> Optional[str]:
    """Video'yu Supabase Storage'a yükle"""
    log("📤 Supabase Storage'a yükleniyor...")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        log("⚠️ Supabase credentials eksik", "WARN")
        return None
    
    try:
        with open(video_path, "rb") as f:
            video_bytes = f.read()
        
        file_name = f"videos/{question_id}.mp4"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/storage/v1/object/solution-videos/{file_name}",
                headers={
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "video/mp4",
                    "x-upsert": "true"
                },
                content=video_bytes,
                timeout=300
            )
            
            if response.status_code in [200, 201]:
                video_url = f"{SUPABASE_URL}/storage/v1/object/public/solution-videos/{file_name}"
                log(f"✅ Supabase'e yüklendi: {video_url}")
                return video_url
            else:
                log(f"❌ Supabase hatası: {response.status_code} - {response.text[:200]}", "ERROR")
                return None
                
    except Exception as e:
        log(f"❌ Supabase upload hatası: {e}", "ERROR")
        return None


# ============================================================
# YOUTUBE UPLOAD (Arka Plan)
# ============================================================

async def upload_to_youtube_background(video_path: Path, question: VideoRequest, scenario: dict):
    """YouTube'a arka planda yükle"""
    log("📤 YouTube'a yükleniyor (arka plan)...")
    
    try:
        with open(video_path, "rb") as f:
            video_bytes = f.read()
        
        video_base64 = base64.b64encode(video_bytes).decode()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{TEKNOKUL_API_BASE}/api/video/youtube-upload",
                json={
                    "questionId": question.question_id,
                    "videoBase64": video_base64,
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
                log(f"✅ YouTube'a yüklendi: {data.get('videoUrl')}")
                return data.get("videoUrl")
            else:
                log(f"⚠️ YouTube upload başarısız: {response.status_code}", "WARN")
                return None
                
    except Exception as e:
        log(f"⚠️ YouTube upload hatası: {e}", "WARN")
        return None


# ============================================================
# SUPABASE VERİTABANI GÜNCELLE
# ============================================================

async def update_question_in_supabase(question_id: str, storage_url: str, youtube_url: str = None):
    """Supabase'de soru kaydını güncelle"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return
    
    try:
        update_data = {
            "video_storage_url": storage_url,
            "video_status": "completed",
            "video_generated_at": datetime.now().isoformat()
        }
        
        if youtube_url:
            update_data["video_solution_url"] = youtube_url
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/questions?id=eq.{question_id}",
                headers={
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                json=update_data,
                timeout=30
            )
            
            if response.status_code in [200, 204]:
                log(f"✅ Supabase güncellendi: {question_id}")
            else:
                log(f"⚠️ Supabase güncelleme hatası: {response.status_code}", "WARN")
                
    except Exception as e:
        log(f"⚠️ Supabase güncelleme hatası: {e}", "WARN")


# ============================================================
# ANA İŞLEM FONKSİYONU
# ============================================================

async def process_video(request: VideoRequest):
    """Video üretim işlemi"""
    start_time = time.time()
    result = {
        "questionId": request.question_id,
        "success": False,
        "storageUrl": None,
        "youtubeUrl": None,
        "error": None
    }
    
    log(f"📋 İşlem başladı: {request.question_id}")
    log(f"📚 Konu: {request.topic_name}, Ders: {request.subject_name}, Sınıf: {request.grade}")
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # 1. Gemini ile senaryo üret
            scenario = await generate_scenario_with_gemini(request)
            
            # 2. Manim ile video oluştur
            video_path = create_manim_video(scenario, request, temp_path)
            
            if not video_path or not video_path.exists():
                raise Exception("Video oluşturulamadı")
            
            # 3. Supabase Storage'a yükle (öncelikli - hızlı erişim)
            storage_url = await upload_to_supabase_storage(video_path, request.question_id)
            
            if storage_url:
                result["storageUrl"] = storage_url
                result["success"] = True
                
                # Supabase'i güncelle
                await update_question_in_supabase(request.question_id, storage_url)
                
                # 4. YouTube'a yükle (arka plan - SEO için)
                youtube_url = await upload_to_youtube_background(video_path, request, scenario)
                
                if youtube_url:
                    result["youtubeUrl"] = youtube_url
                    await update_question_in_supabase(request.question_id, storage_url, youtube_url)
            else:
                raise Exception("Supabase upload başarısız")
            
            log(f"✅ İşlem tamamlandı: {request.question_id}")
            
    except Exception as e:
        result["error"] = str(e)
        log(f"❌ İşlem hatası: {e}", "ERROR")
    
    result["duration"] = time.time() - start_time
    
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
        version="5.0.0"
    )


@app.post("/generate")
async def generate_video(
    request: VideoRequest,
    background_tasks: BackgroundTasks,
    authorization: str = Header(None)
):
    """Video üretimini başlat (arka planda)"""
    if API_SECRET and authorization != f"Bearer {API_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    log(f"📥 Video isteği: {request.question_id}")
    background_tasks.add_task(process_video, request)
    
    return JSONResponse({
        "success": True,
        "message": "Video üretimi başlatıldı",
        "questionId": request.question_id
    })


@app.post("/generate-sync")
async def generate_video_sync(
    request: VideoRequest,
    authorization: str = Header(None)
):
    """Video üretimi (senkron - bekle)"""
    if API_SECRET and authorization != f"Bearer {API_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    log(f"📥 Senkron video isteği: {request.question_id}")
    result = await process_video(request)
    
    if result.get("success"):
        return JSONResponse(result)
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Video üretilemedi"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
