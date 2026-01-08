"""
Teknokul Video Factory - Cloud Run Service v6.0.0
🎬 Zengin Animasyonlu Video Üretim Sistemi
- Ders bazlı template'ler (Matematik, Fizik, Kimya, Biyoloji, Türkçe)
- 3Blue1Brown tarzı görsel animasyonlar
- Manim + ElevenLabs + FFmpeg
- Hibrit Upload: Supabase Storage + YouTube
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

# Template ve Prompt sistemleri
from templates.base import get_template_for_subject
from templates.matematik.cebir import generate_cebir_script
from templates.matematik.geometri import generate_geometri_script
from templates.matematik.fonksiyon import generate_fonksiyon_script
from templates.matematik.istatistik import generate_istatistik_script
from templates.fizik.mekanik import generate_mekanik_script
from templates.fizik.elektrik import generate_elektrik_script
from templates.fizik.genel import generate_fizik_genel_script
from templates.kimya.genel import generate_kimya_genel_script
from templates.biyoloji.genel import generate_biyoloji_genel_script
from templates.dil.turkce import generate_turkce_genel_script
from templates.genel import generate_genel_script
from prompts import get_prompt_for_subject

app = FastAPI(
    title="Teknokul Video Factory",
    description="AI-powered video solution generator with rich animations",
    version="6.0.0"
)

# Environment variables
API_SECRET = os.getenv("API_SECRET", "")
TEKNOKUL_API_BASE = os.getenv("TEKNOKUL_API_BASE", "https://teknokul.com.tr")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


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
    features: list


def log(message: str, level: str = "INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")


# ============================================================
# TEMPLATE SEÇİCİ
# ============================================================

def get_script_generator(template_type: str):
    """Template tipine göre script generator fonksiyonunu döndür"""
    generators = {
        # Matematik
        'matematik_cebir': generate_cebir_script,
        'matematik_geometri': generate_geometri_script,
        'matematik_fonksiyon': generate_fonksiyon_script,
        'matematik_istatistik': generate_istatistik_script,
        # Fizik
        'fizik_mekanik': generate_mekanik_script,
        'fizik_elektrik': generate_elektrik_script,
        'fizik_dalga': generate_fizik_genel_script,
        'fizik_genel': generate_fizik_genel_script,
        # Kimya
        'kimya_atom': generate_kimya_genel_script,
        'kimya_molekul': generate_kimya_genel_script,
        'kimya_reaksiyon': generate_kimya_genel_script,
        'kimya_genel': generate_kimya_genel_script,
        # Biyoloji
        'biyoloji_hucre': generate_biyoloji_genel_script,
        'biyoloji_genetik': generate_biyoloji_genel_script,
        'biyoloji_sistem': generate_biyoloji_genel_script,
        'biyoloji_genel': generate_biyoloji_genel_script,
        # Türkçe
        'turkce_cumle': generate_turkce_genel_script,
        'turkce_paragraf': generate_turkce_genel_script,
        'turkce_anlam': generate_turkce_genel_script,
        'turkce_genel': generate_turkce_genel_script,
        # Diğer
        'fen_genel': generate_biyoloji_genel_script,
        'sosyal_genel': generate_genel_script,
        'genel': generate_genel_script,
    }
    return generators.get(template_type, generate_genel_script)


# ============================================================
# GEMİNİ İLE SENARYO ÜRET
# ============================================================

async def generate_scenario_with_gemini(question: VideoRequest) -> dict:
    """Gemini ile video senaryosu üret - derse özel prompt ile"""
    log(f"🎬 Gemini ile senaryo üretiliyor... (Ders: {question.subject_name})")
    
    # Derse özel prompt al
    system_prompt = get_prompt_for_subject(question.subject_name)
    
    user_prompt = f"""SORU: {question.question_text}
ŞIKLAR: {json.dumps(question.options, ensure_ascii=False)}
DOĞRU CEVAP: {question.correct_answer}
KONU: {question.topic_name or 'Genel'}
SINIF: {question.grade}. Sınıf
AÇIKLAMA: {question.explanation or 'Yok'}"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"role": "user", "parts": [{"text": system_prompt + "\n\n" + user_prompt}]}],
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
    return create_fallback_scenario(question)


def create_fallback_scenario(question: VideoRequest) -> dict:
    """Fallback senaryo oluştur"""
    return {
        "video_senaryosu": {
            "hook_cumlesi": "Bu soruyu birlikte çözelim!",
            "adimlar": [
                {"adim_no": 1, "tts_metni": "Sorumuzu inceleyelim.", "ekranda_gosterilecek_metin": "Soru İnceleme", "vurgu_rengi": "YELLOW"},
                {"adim_no": 2, "tts_metni": "Adım adım çözelim.", "ekranda_gosterilecek_metin": "Çözüm Adımları", "vurgu_rengi": "BLUE"},
                {"adim_no": 3, "tts_metni": f"Doğru cevap {question.correct_answer} şıkkı!", "ekranda_gosterilecek_metin": f"Cevap: {question.correct_answer}", "vurgu_rengi": "GREEN"}
            ],
            "kapanis_cumlesi": "Teknokul'da kalın!"
        },
        "thumbnail_bilgisi": {
            "ana_metin": "SORU ÇÖZÜMÜ",
            "yan_metin": question.topic_name or question.subject_name or "Soru",
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
                        "similarity_boost": 0.75,
                        "speed": 1.1  # Biraz daha hızlı konuşma
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
        return 3.0


# ============================================================
# MANİM VİDEO OLUŞTUR (ZENGİN TEMPLATE SİSTEMİ)
# ============================================================

def create_manim_video(scenario: dict, question: VideoRequest, temp_dir: Path, durations: dict) -> Optional[Path]:
    """Template sistemini kullanarak Manim video oluştur"""
    log(f"🎬 Manim video üretiliyor... (Ders: {question.subject_name}, Konu: {question.topic_name})")
    
    # Template seç
    template_type = get_template_for_subject(question.subject_name, question.topic_name)
    log(f"📝 Template: {template_type}")
    
    # Script generator al
    generator = get_script_generator(template_type)
    
    # Question dict oluştur
    question_dict = {
        "question_text": question.question_text,
        "options": question.options,
        "correct_answer": question.correct_answer,
        "topic_name": question.topic_name,
        "subject_name": question.subject_name,
        "grade": question.grade
    }
    
    # Script oluştur
    script_content = generator(scenario, question_dict, durations)
    
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
            log(f"❌ Manim stderr: {result.stderr[:1500]}", "ERROR")
            # Script hatasını logla
            log(f"📝 Script hatası - ilk 500 karakter: {script_content[:500]}", "DEBUG")
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
        "error": None,
        "template": None
    }
    
    log(f"📋 İşlem başladı: {request.question_id}")
    log(f"📚 Ders: {request.subject_name}, Konu: {request.topic_name}, Sınıf: {request.grade}")
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            audio_dir = temp_path / "audio"
            audio_dir.mkdir()
            
            # 1. Gemini ile senaryo üret
            scenario = await generate_scenario_with_gemini(request)
            video_data = scenario.get("video_senaryosu", {})
            
            # Template tipini kaydet
            template_type = get_template_for_subject(request.subject_name, request.topic_name)
            result["template"] = template_type
            
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
            for i, adim in enumerate(video_data.get("adimlar", [])[:6]):
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
        version="6.0.0",
        features=[
            "matematik_templates",
            "fizik_templates", 
            "kimya_templates",
            "biyoloji_templates",
            "turkce_templates",
            "rich_animations",
            "subject_prompts"
        ]
    )


@app.get("/templates")
async def list_templates():
    """Mevcut template'leri listele"""
    return {
        "templates": {
            "matematik": ["cebir", "geometri", "fonksiyon", "istatistik"],
            "fizik": ["mekanik", "elektrik", "dalga", "genel"],
            "kimya": ["atom", "molekul", "reaksiyon", "genel"],
            "biyoloji": ["hucre", "genetik", "sistem", "genel"],
            "turkce": ["cumle", "paragraf", "anlam", "genel"],
            "genel": ["default"]
        }
    }


@app.post("/generate")
async def generate_video(
    request: VideoRequest,
    background_tasks: BackgroundTasks,
    authorization: str = Header(None)
):
    """Video üretimini başlat (arka planda)"""
    if API_SECRET and authorization != f"Bearer {API_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Template seç ve logla
    template_type = get_template_for_subject(request.subject_name, request.topic_name)
    log(f"📥 Video isteği: {request.question_id} | Template: {template_type}")
    
    background_tasks.add_task(process_video, request)
    
    return JSONResponse({
        "success": True,
        "message": "Video üretimi başlatıldı",
        "questionId": request.question_id,
        "template": template_type
    })


@app.post("/generate-sync")
async def generate_video_sync(
    request: VideoRequest,
    authorization: str = Header(None)
):
    """Video üretimi (senkron - bekle)"""
    if API_SECRET and authorization != f"Bearer {API_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    template_type = get_template_for_subject(request.subject_name, request.topic_name)
    log(f"📥 Senkron video isteği: {request.question_id} | Template: {template_type}")
    
    result = await process_video(request)
    
    if result.get("success"):
        return JSONResponse(result)
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Video üretilemedi"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
