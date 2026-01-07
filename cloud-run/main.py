"""
Teknokul Video Factory - Cloud Run Service v5.1.0
Basit ve stabil: Manim + ElevenLabs (ayrı) + FFmpeg birleştirme
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
    version="5.1.0"
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
                {"adim_no": 1, "tts_metni": f"Sorumuzu inceleyelim.", "ekranda_gosterilecek_metin": "Soru", "vurgu_rengi": "YELLOW"},
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
# ELEVENLABS SES OLUŞTUR
# ============================================================

async def generate_audio(text: str, output_path: Path) -> bool:
    """ElevenLabs ile ses oluştur"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
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
                timeout=60
            )
            
            if response.status_code == 200:
                with open(output_path, "wb") as f:
                    f.write(response.content)
                return True
            else:
                log(f"❌ ElevenLabs hatası: {response.status_code}", "ERROR")
                return False
    except Exception as e:
        log(f"❌ ElevenLabs hatası: {e}", "ERROR")
        return False


def get_audio_duration(audio_path: Path) -> float:
    """FFprobe ile ses süresini al"""
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", 
             "-of", "default=noprint_wrappers=1:nokey=1", str(audio_path)],
            capture_output=True, text=True, timeout=30
        )
        return float(result.stdout.strip())
    except:
        return 3.0  # Fallback


# ============================================================
# MANİM VİDEO OLUŞTUR (BASİT VERSİYON)
# ============================================================

def create_manim_video(scenario: dict, question: VideoRequest, temp_dir: Path, durations: dict) -> Optional[Path]:
    """Basit Manim ile video oluştur (ses yok, sadece görsel)"""
    log("🎬 Manim ile video üretiliyor...")
    
    video_data = scenario.get("video_senaryosu", {})
    hook = video_data.get("hook_cumlesi", "Soruyu çözelim!")
    adimlar = video_data.get("adimlar", [])[:5]
    kapanis = video_data.get("kapanis_cumlesi", "Teknokul'da kalın!")
    
    # Süreleri al
    hook_dur = durations.get("hook", 3.0)
    step_durs = durations.get("steps", [3.0] * len(adimlar))
    kapanis_dur = durations.get("kapanis", 3.0)
    
    # Python string escape
    def escape(s):
        return s.replace('\\', '\\\\').replace('"', '\\"').replace("'", "\\'").replace('\n', ' ')
    
    # Manim script oluştur
    script_content = f'''
from manim import *

config.frame_width = 9
config.frame_height = 16
config.pixel_width = 1080
config.pixel_height = 1920
config.frame_rate = 30
config.background_color = "#1a1a2e"

PURPLE = "#8B5CF6"
ORANGE = "#F97316"

class VideoScene(Scene):
    def construct(self):
        # Logo (sabit)
        logo = Text("teknokul.com.tr", font_size=28, color=PURPLE)
        logo.to_edge(DOWN, buff=0.3)
        self.add(logo)
        
        # HOOK
        warning = Text("DİKKAT", font_size=72, color=RED, weight=BOLD)
        self.play(FadeIn(warning, scale=1.5), run_time=0.5)
        self.wait({hook_dur - 1.0})
        self.play(FadeOut(warning), run_time=0.5)
'''
    
    # Adımları ekle
    for i, adim in enumerate(adimlar):
        display = escape(adim.get("ekranda_gosterilecek_metin", f"Adım {i+1}"))
        color = adim.get("vurgu_rengi", "WHITE")
        dur = step_durs[i] if i < len(step_durs) else 3.0
        
        script_content += f'''
        # Adım {i+1}
        badge = Circle(radius=0.6, color=ORANGE, fill_opacity=1)
        badge_num = Text("{i+1}", font_size=48, color=WHITE, weight=BOLD)
        badge_num.move_to(badge.get_center())
        badge_grp = VGroup(badge, badge_num).to_edge(UP, buff=1.5)
        
        box = RoundedRectangle(width=8, height=4, corner_radius=0.3, fill_color="#16213e", fill_opacity=0.9, stroke_color={color}, stroke_width=3)
        box.move_to(DOWN * 0.5)
        
        content = Text("{display}", font_size=36, color={color}, weight=BOLD)
        content.move_to(box.get_center())
        if content.width > 7:
            content.scale_to_fit_width(7)
        
        self.play(FadeIn(badge_grp), GrowFromCenter(box), run_time=0.4)
        self.play(Write(content), run_time=0.6)
        self.wait({max(0.1, dur - 1.5)})
        self.play(FadeOut(badge_grp, box, content), run_time=0.5)
'''
    
    # Kapanış
    script_content += f'''
        # Kapanış
        result = Text("SONUÇ", font_size=64, color=GREEN, weight=BOLD)
        result.to_edge(UP, buff=2)
        
        big_logo = Text("Teknokul", font_size=72, color=ORANGE, weight=BOLD)
        big_logo.move_to(ORIGIN)
        
        slogan = Text("Eğitimin Dijital Üssü", font_size=32, color=WHITE)
        slogan.next_to(big_logo, DOWN, buff=0.4)
        
        self.play(FadeIn(result, shift=DOWN), run_time=0.4)
        self.wait(0.5)
        self.play(FadeIn(big_logo, scale=1.2), FadeIn(slogan), run_time=0.6)
        self.wait({max(0.5, kapanis_dur - 1.5)})
'''
    
    # Script'i kaydet
    script_path = temp_dir / "video_scene.py"
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(script_content)
    
    log(f"📝 Manim script oluşturuldu: {script_path}")
    
    # Manim çalıştır
    try:
        result = subprocess.run(
            ["manim", "render", "-ql", "--format=mp4", str(script_path), "VideoScene"],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        log(f"📊 Manim exit code: {result.returncode}")
        
        if result.returncode != 0:
            log(f"❌ Manim stderr: {result.stderr[:1000]}", "ERROR")
            return None
        
        # Video dosyasını bul
        for video_file in temp_dir.rglob("*.mp4"):
            if "VideoScene" in video_file.name:
                log(f"✅ Video oluşturuldu: {video_file.name}")
                return video_file
        
        log("❌ Video dosyası bulunamadı", "ERROR")
        return None
        
    except subprocess.TimeoutExpired:
        log("❌ Manim timeout (5 dakika)", "ERROR")
        return None
    except Exception as e:
        log(f"❌ Manim hatası: {e}", "ERROR")
        return None


# ============================================================
# SES VE VİDEO BİRLEŞTİR
# ============================================================

def merge_audio_video(video_path: Path, audio_path: Path, output_path: Path) -> bool:
    """FFmpeg ile ses ve videoyu birleştir"""
    log("🔊 Ses ve video birleştiriliyor...")
    
    try:
        result = subprocess.run([
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-i", str(audio_path),
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            str(output_path)
        ], capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0 and output_path.exists():
            log("✅ Ses ve video birleştirildi")
            return True
        else:
            log(f"❌ FFmpeg hatası: {result.stderr[:500]}", "ERROR")
            return False
    except Exception as e:
        log(f"❌ FFmpeg hatası: {e}", "ERROR")
        return False


def concat_audios(audio_files: list, output_path: Path) -> bool:
    """Ses dosyalarını birleştir"""
    try:
        # Concat file oluştur
        concat_file = output_path.parent / "concat.txt"
        with open(concat_file, "w") as f:
            for audio in audio_files:
                f.write(f"file '{audio}'\n")
        
        result = subprocess.run([
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(concat_file),
            "-c:a", "libmp3lame", "-q:a", "2",
            str(output_path)
        ], capture_output=True, text=True, timeout=60)
        
        return result.returncode == 0
    except Exception as e:
        log(f"❌ Ses birleştirme hatası: {e}", "ERROR")
        return False


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
            audio_dir = temp_path / "audio"
            audio_dir.mkdir()
            
            # 1. Gemini ile senaryo üret
            scenario = await generate_scenario_with_gemini(request)
            video_data = scenario.get("video_senaryosu", {})
            
            # 2. Sesleri oluştur
            log("🎤 Sesler oluşturuluyor...")
            audio_files = []
            durations = {"hook": 3.0, "steps": [], "kapanis": 3.0}
            
            # Hook sesi
            hook_text = video_data.get("hook_cumlesi", "Soruyu çözelim!")
            hook_audio = audio_dir / "hook.mp3"
            if await generate_audio(hook_text, hook_audio):
                audio_files.append(hook_audio)
                durations["hook"] = get_audio_duration(hook_audio)
            
            # Adım sesleri
            for i, adim in enumerate(video_data.get("adimlar", [])[:5]):
                tts = adim.get("tts_metni", f"Adım {i+1}")
                step_audio = audio_dir / f"step_{i}.mp3"
                if await generate_audio(tts, step_audio):
                    audio_files.append(step_audio)
                    durations["steps"].append(get_audio_duration(step_audio))
                else:
                    durations["steps"].append(3.0)
            
            # Kapanış sesi
            kapanis_text = video_data.get("kapanis_cumlesi", "Teknokul'da kalın!")
            kapanis_audio = audio_dir / "kapanis.mp3"
            if await generate_audio(kapanis_text, kapanis_audio):
                audio_files.append(kapanis_audio)
                durations["kapanis"] = get_audio_duration(kapanis_audio)
            
            log(f"✅ {len(audio_files)} ses dosyası oluşturuldu")
            
            # 3. Sesleri birleştir
            combined_audio = temp_path / "combined_audio.mp3"
            if audio_files:
                concat_audios(audio_files, combined_audio)
            
            # 4. Manim ile video oluştur
            video_path = create_manim_video(scenario, request, temp_path, durations)
            
            if not video_path or not video_path.exists():
                raise Exception("Video oluşturulamadı")
            
            # 5. Ses ve videoyu birleştir
            final_video = temp_path / "final_video.mp4"
            if combined_audio.exists():
                merge_audio_video(video_path, combined_audio, final_video)
            else:
                final_video = video_path
            
            if not final_video.exists():
                final_video = video_path
            
            # 6. Supabase Storage'a yükle
            storage_url = await upload_to_supabase_storage(final_video, request.question_id)
            
            if storage_url:
                result["storageUrl"] = storage_url
                result["success"] = True
                
                await update_question_in_supabase(request.question_id, storage_url)
                
                # 7. YouTube'a yükle (arka plan)
                youtube_url = await upload_to_youtube_background(final_video, request, scenario)
                
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
        version="5.1.0"
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
