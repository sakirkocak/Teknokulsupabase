"""
Teknokul Video Factory - Cloud Run Service v8.0.0
🎬 Muhteşem Eğitim Video Üretim Sistemi

Özellikler:
- Gemini 3 Pro Preview: Akıllı Manim kod üretimi
- Süper Prompt: Tüm dersler için optimize edilmiş
- Püf Noktaları: Her videoda öğrenci odaklı ipuçları
- Teknokul Outro: Profesyonel kapanış animasyonu
- Müzik: Arka plan müziği + jingle
- 3Blue1Brown tarzı zengin animasyonlar
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

# Yeni modüller
from prompts import get_full_prompt, SUPER_MANIM_PROMPT
from templates import get_outro_integration_code, generate_smart_script, detect_animations
from audio.music_manager import (
    download_music, 
    get_music_type_for_subject, 
    create_full_audio_mix,
    MUSIC_CONFIG
)

app = FastAPI(
    title="Teknokul Video Factory",
    description="AI-powered educational video generator with Gemini 3 Pro",
    version="8.0.0"
)

# Model tanımları
GEMINI_MODEL_PRO = "gemini-3-pro-preview"   # Manim kodu için (güçlü)
GEMINI_MODEL_FLASH = "gemini-3-flash-preview"  # Senaryo için (hızlı)

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
    include_music: Optional[bool] = True
    include_outro: Optional[bool] = True


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    version: str
    features: list


def log(message: str, level: str = "INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")


# ============================================================
# MANIM CONFIG HEADER
# ============================================================

CONFIG_HEADER = '''from manim import *
import numpy as np

config.frame_width = 9
config.frame_height = 16
config.pixel_width = 1080
config.pixel_height = 1920
config.frame_rate = 30
config.background_color = "#0f0f23"
Text.set_default(font="Noto Sans")

'''


# ============================================================
# GEMİNİ 3 PRO İLE MANİM KODU ÜRET
# ============================================================

async def generate_manim_code_with_gemini_pro(question: VideoRequest, include_outro: bool = True) -> Optional[str]:
    """Gemini 3 Pro ile doğrudan Manim kodu üret - Süper Prompt ile"""
    log(f"🚀 Gemini 3 Pro ile Manim kodu üretiliyor... (Ders: {question.subject_name})")
    
    # Süper prompt al
    system_prompt, user_prompt = get_full_prompt(
        question_text=question.question_text,
        options=question.options,
        correct_answer=question.correct_answer,
        subject_name=question.subject_name or "Genel",
        topic_name=question.topic_name or "Genel",
        grade=question.grade or 8,
        explanation=question.explanation
    )
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL_PRO}:generateContent?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"role": "user", "parts": [{"text": system_prompt + "\n\n" + user_prompt}]}],
                    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 16000}
                },
                timeout=180
            )
            
            if response.status_code == 200:
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                
                # Python kodunu çıkar
                code = text
                if "```python" in text:
                    code = text.split("```python")[1].split("```")[0]
                elif "```" in text:
                    code = text.split("```")[1].split("```")[0]
                
                code = code.strip()
                
                # Temel kontroller
                if "class VideoScene" in code and "def construct" in code:
                    log(f"✅ Gemini 3 Pro Manim kodu üretti ({len(code)} karakter)")
                    
                    # Outro ekle
                    if include_outro:
                        code = add_outro_to_code(code)
                    
                    return code
                else:
                    log("⚠️ Gemini kodu geçersiz format", "WARN")
                    return None
            else:
                log(f"❌ Gemini 3 Pro hatası: {response.status_code} - {response.text[:300]}", "ERROR")
                return None
                
    except Exception as e:
        log(f"❌ Gemini 3 Pro hatası: {e}", "ERROR")
        return None


def add_outro_to_code(code: str) -> str:
    """Manim koduna outro ekle"""
    outro_code = get_outro_integration_code()
    
    # Son self.wait() veya construct fonksiyonunun sonunu bul
    if "self.wait" in code:
        # Son wait'i bul ve outro ekle
        lines = code.split('\n')
        last_wait_idx = -1
        for i, line in enumerate(lines):
            if 'self.wait' in line:
                last_wait_idx = i
        
        if last_wait_idx > 0:
            # Son wait'ten sonra outro ekle
            indent = len(lines[last_wait_idx]) - len(lines[last_wait_idx].lstrip())
            outro_lines = outro_code.strip().split('\n')
            indented_outro = '\n'.join([' ' * indent + line.strip() for line in outro_lines if line.strip()])
            
            lines.insert(last_wait_idx + 1, '\n' + indented_outro)
            return '\n'.join(lines)
    
    return code


def validate_manim_code(code: str) -> bool:
    """Manim kodunu syntax kontrolü yap"""
    try:
        compile(code, "<string>", "exec")
        log("✅ Manim kodu syntax kontrolü geçti")
        return True
    except SyntaxError as e:
        log(f"❌ Manim kodu syntax hatası: {e}", "ERROR")
        return False


# ============================================================
# ELEVENLABS SES OLUŞTUR (Türkçe Profesyonel Sesler)
# ============================================================
import random

# 🇹🇷 Türkçe Profesyonel Sesler (Voice Library'den)
TURKISH_VOICES = {
    "erdem": {
        "id": "spa9IALJDrGWqKYWII2J",
        "name": "Erdem",
        "gender": "male",
        "style": "energetic",
        "description": "Enerjik, eğitim odaklı genç erkek"
    },
    "mehmet": {
        "id": "RiIWpdXo71aR6kOsLsEw",
        "name": "Mehmet", 
        "gender": "male",
        "style": "natural",
        "description": "Doğal, genç erkek"
    },
    "gamze": {
        "id": "Hvrobr8BhLPfiaSv2cHi",
        "name": "Gamze",
        "gender": "female",
        "style": "warm",
        "description": "Sıcak, kadın anlatıcı"
    }
}

# Ders bazlı ses eşleştirmesi
SUBJECT_VOICE_MAP = {
    "matematik": "erdem",      # Enerjik, heyecanlı
    "fizik": "erdem",          # Enerjik
    "kimya": "mehmet",         # Doğal, sakin
    "biyoloji": "gamze",       # Sıcak, açıklayıcı
    "türkçe": "gamze",         # Kadın ses, edebiyat için uygun
    "tarih": "mehmet",         # Hikaye anlatıcı
    "coğrafya": "mehmet",      # Doğal
    "ingilizce": "gamze",      # Dil dersleri için
}

# Varsayılan ses
DEFAULT_VOICE = "erdem"


def get_voice_for_subject(subject_name: str) -> dict:
    """Derse göre en uygun sesi seç"""
    if not subject_name:
        return TURKISH_VOICES[DEFAULT_VOICE]
    
    subject_lower = subject_name.lower().strip()
    
    # Ders eşleştirmesi
    for key, voice_key in SUBJECT_VOICE_MAP.items():
        if key in subject_lower:
            voice = TURKISH_VOICES.get(voice_key, TURKISH_VOICES[DEFAULT_VOICE])
            log(f"🎙️ Ses seçildi: {voice['name']} ({subject_name} için)")
            return voice
    
    # Eşleşme yoksa rastgele seç
    voice_key = random.choice(list(TURKISH_VOICES.keys()))
    voice = TURKISH_VOICES[voice_key]
    log(f"🎙️ Ses seçildi: {voice['name']} (rastgele)")
    return voice


def get_random_voice() -> dict:
    """Rastgele bir ses seç"""
    voice_key = random.choice(list(TURKISH_VOICES.keys()))
    return TURKISH_VOICES[voice_key]

async def generate_audio(text: str, output_path: Path, subject_name: str = None, voice_id: str = None) -> bool:
    """
    ElevenLabs ile kaliteli Türkçe ses oluştur
    
    🎙️ Sesler: Erdem, Mehmet, Gamze (Türkçe profesyonel)
    🎯 Model: eleven_turbo_v2_5 - Hızlı + kaliteli
    📚 Ders bazlı ses seçimi otomatik yapılır
    """
    try:
        # Ses seçimi: Elle belirtilmişse onu kullan, yoksa derse göre seç
        if voice_id:
            selected_voice_id = voice_id
            voice_name = "Manuel"
        else:
            voice = get_voice_for_subject(subject_name)
            selected_voice_id = voice["id"]
            voice_name = voice["name"]
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{selected_voice_id}",
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "text": text,
                    "model_id": "eleven_turbo_v2_5",  # Hızlı + kaliteli + Türkçe
                    "voice_settings": {
                        "stability": 0.70,           # Doğal ses için dengeli
                        "similarity_boost": 0.80,    # Orijinal sese yakın
                        "style": 0.35,               # Duygu ve ifade ekle
                        "use_speaker_boost": True    # Net ve temiz ses
                    }
                },
                timeout=60
            )
            
            if response.status_code == 200:
                with open(output_path, "wb") as f:
                    f.write(response.content)
                log(f"✅ Ses oluşturuldu: {voice_name} | {len(text)} karakter")
                return True
            else:
                error_detail = response.text[:200] if response.text else "Bilinmeyen hata"
                log(f"❌ ElevenLabs hatası: {response.status_code} - {error_detail}", "ERROR")
                return False
    except Exception as e:
        log(f"❌ ElevenLabs hatası: {e}", "ERROR")
        return False


async def generate_sound_effect(prompt: str, output_path: Path, duration_seconds: float = 2.0) -> bool:
    """
    ElevenLabs ile ses efekti oluştur
    Örnek: "classroom bell ringing", "applause", "success chime"
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.elevenlabs.io/v1/sound-generation",
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "text": prompt,
                    "duration_seconds": duration_seconds,
                    "prompt_influence": 0.3  # Yaratıcılık dengesi
                },
                timeout=60
            )
            
            if response.status_code == 200:
                with open(output_path, "wb") as f:
                    f.write(response.content)
                log(f"✅ Ses efekti oluşturuldu: {prompt[:30]}...")
                return True
            else:
                log(f"⚠️ Ses efekti hatası: {response.status_code}", "WARN")
                return False
    except Exception as e:
        log(f"⚠️ Ses efekti hatası: {e}", "WARN")
        return False


async def generate_tts_for_scenario(scenario: dict, audio_dir: Path, subject_name: str = None) -> tuple:
    """
    Senaryo için tüm sesleri oluştur
    
    🎙️ Ders bazlı ses seçimi:
    - Matematik/Fizik → Erdem (enerjik)
    - Türkçe/Biyoloji → Gamze (sıcak)
    - Tarih/Coğrafya → Mehmet (doğal)
    """
    audio_files = []
    durations = {"hook": 3.0, "steps": [], "kapanis": 3.0, "outro": 3.0}
    
    video_data = scenario.get("video_senaryosu", {})
    
    # Ses seçimini logla
    voice = get_voice_for_subject(subject_name)
    log(f"🎙️ Video sesi: {voice['name']} ({voice['description']})")
    
    # Hook sesi
    hook_text = video_data.get("hook_cumlesi", "Bu soruyu birlikte çözelim!")
    hook_audio = audio_dir / "hook.mp3"
    if await generate_audio(hook_text, hook_audio, subject_name=subject_name):
        audio_files.append(hook_audio)
        durations["hook"] = get_audio_duration(hook_audio)
    
    # Adım sesleri
    for i, adim in enumerate(video_data.get("adimlar", [])[:6]):
        tts = adim.get("tts_metni", f"Adım {i+1}")
        step_audio = audio_dir / f"step_{i}.mp3"
        if await generate_audio(tts, step_audio, subject_name=subject_name):
            audio_files.append(step_audio)
            durations["steps"].append(get_audio_duration(step_audio))
        else:
            durations["steps"].append(3.0)
    
    # Kapanış sesi
    kapanis_text = video_data.get("kapanis_cumlesi", "Teknokul ile başarıya!")
    kapanis_audio = audio_dir / "kapanis.mp3"
    if await generate_audio(kapanis_text, kapanis_audio, subject_name=subject_name):
        audio_files.append(kapanis_audio)
        durations["kapanis"] = get_audio_duration(kapanis_audio)
    
    # Outro sesi
    outro_audio = audio_dir / "outro.mp3"
    if await generate_audio("Teknokul, eğitimin dijital üssü!", outro_audio, subject_name=subject_name):
        audio_files.append(outro_audio)
        durations["outro"] = get_audio_duration(outro_audio)
    
    return audio_files, durations


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
# GEMİNİ FLASH İLE SENARYO ÜRET
# ============================================================

SCENARIO_PROMPT = """Sen bir eğitim videosu senaryo yazarısın. Verilen soru için video senaryosu oluştur.

ÇIKTI FORMATI (JSON):
{
    "video_senaryosu": {
        "hook_cumlesi": "Dikkat çekici açılış cümlesi (merak uyandır)",
        "adimlar": [
            {
                "adim_no": 1,
                "tts_metni": "Sesli anlatım metni (doğal konuşma dili)",
                "ekranda_gosterilecek_metin": "Ekranda gösterilecek kısa metin",
                "vurgu_rengi": "YELLOW/BLUE/GREEN/RED",
                "animasyon_tipi": "yazı/şekil/hesaplama/grafik"
            }
        ],
        "puf_noktasi": {
            "baslik": "💡 PÜF NOKTASI",
            "aciklama": "Öğrencilerin dikkat etmesi gereken önemli bilgi"
        },
        "kapanis_cumlesi": "Kapanış cümlesi"
    }
}

KURALLAR:
1. Hook cümlesi merak uyandırmalı: "Bu soruyu çoğu öğrenci yanlış yapıyor!"
2. Adımlar net ve anlaşılır olmalı: Verilenler → İstenen → Yöntem → Çözüm
3. PÜF NOKTASI mutlaka olmalı: Kısayol, sık yapılan hata, dikkat noktası
4. TTS metni doğal konuşma dilinde olmalı
5. Maximum 6 adım olmalı
"""


async def generate_scenario_with_gemini(question: VideoRequest) -> dict:
    """Gemini Flash ile video senaryosu üret"""
    log(f"🎬 Gemini Flash ile senaryo üretiliyor... (Ders: {question.subject_name})")
    
    user_prompt = f"""SORU: {question.question_text}
ŞIKLAR: {json.dumps(question.options, ensure_ascii=False)}
DOĞRU CEVAP: {question.correct_answer}
DERS: {question.subject_name or 'Genel'}
KONU: {question.topic_name or 'Genel'}
SINIF: {question.grade}. Sınıf
AÇIKLAMA: {question.explanation or 'Yok'}

Bu soru için video senaryosu oluştur. JSON formatında döndür."""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL_FLASH}:generateContent?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"role": "user", "parts": [{"text": SCENARIO_PROMPT + "\n\n" + user_prompt}]}],
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
    
    return create_fallback_scenario(question)


def create_fallback_scenario(question: VideoRequest) -> dict:
    """Fallback senaryo oluştur"""
    return {
        "video_senaryosu": {
            "hook_cumlesi": "Bu soruyu birlikte adım adım çözelim!",
            "adimlar": [
                {"adim_no": 1, "tts_metni": "Önce sorumuzu inceleyelim.", "ekranda_gosterilecek_metin": "📝 Soru İnceleme", "vurgu_rengi": "YELLOW"},
                {"adim_no": 2, "tts_metni": "Şimdi çözüm adımlarına geçelim.", "ekranda_gosterilecek_metin": "🔍 Çözüm Adımları", "vurgu_rengi": "BLUE"},
                {"adim_no": 3, "tts_metni": f"Ve doğru cevabımız {question.correct_answer} şıkkı!", "ekranda_gosterilecek_metin": f"✅ Cevap: {question.correct_answer}", "vurgu_rengi": "GREEN"}
            ],
            "puf_noktasi": {
                "baslik": "💡 PÜF NOKTASI",
                "aciklama": "Soruyu dikkatlice okumayı unutma!"
            },
            "kapanis_cumlesi": "Teknokul ile başarıya!"
        }
    }


# ============================================================
# MANİM VİDEO OLUŞTUR
# ============================================================

async def create_manim_video(question: VideoRequest, scenario: dict, temp_dir: Path, 
                             include_outro: bool = True) -> Optional[Path]:
    """Gemini 3 Pro veya fallback ile Manim video oluştur"""
    log(f"🎬 Manim video üretiliyor... (Ders: {question.subject_name})")
    
    script_content = None
    generation_method = "fallback"
    
    # 1. Önce Gemini 3 Pro ile dene
    gemini_code = await generate_manim_code_with_gemini_pro(question, include_outro)
    
    if gemini_code and validate_manim_code(gemini_code):
        # Config header ekle
        if "from manim import" not in gemini_code:
            script_content = CONFIG_HEADER + gemini_code
        else:
            script_content = gemini_code.replace("from manim import *", CONFIG_HEADER.strip())
        
        generation_method = "gemini_3_pro"
        log("🚀 Gemini 3 Pro kodu kullanılıyor")
    else:
        # 2. Fallback: Smart renderer
        log("⚠️ Fallback template kullanılıyor")
        
        question_dict = {
            "question_text": question.question_text,
            "options": question.options,
            "correct_answer": question.correct_answer,
            "topic_name": question.topic_name,
            "subject_name": question.subject_name,
            "grade": question.grade
        }
        
        durations = {"hook": 3, "steps": [3, 3, 3], "kapanis": 3}
        script_content = generate_smart_script(scenario, question_dict, durations)
    
    # Script'i kaydet
    script_path = temp_dir / "video_scene.py"
    with open(script_path, "w", encoding="utf-8") as f:
        f.write(script_content)
    
    log(f"📝 Manim script oluşturuldu ({generation_method})")
    
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
            return None, generation_method
        
        # Video dosyasını bul
        for video_file in temp_dir.rglob("*.mp4"):
            if "VideoScene" in video_file.name:
                log(f"✅ Video oluşturuldu: {video_file.name}")
                return video_file, generation_method
        
        log("❌ Video dosyası bulunamadı", "ERROR")
        return None, generation_method
        
    except subprocess.TimeoutExpired:
        log("❌ Manim timeout (5 dakika)", "ERROR")
        return None, generation_method
    except Exception as e:
        log(f"❌ Manim hatası: {e}", "ERROR")
        return None, generation_method


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


async def add_background_music_full(video_path: Path, output_path: Path, 
                                     subject_name: str, temp_dir: Path) -> bool:
    """Videoya arka plan müziği ve jingle ekle"""
    log("🎵 Arka plan müziği ekleniyor...")
    
    try:
        # 1. Ders için uygun müzik türünü belirle
        music_type = get_music_type_for_subject(subject_name or "Genel")
        log(f"🎶 Müzik türü: {music_type}")
        
        # 2. Müzik dosyalarını indir
        music_path = temp_dir / "background_music.mp3"
        jingle_path = temp_dir / "outro_jingle.mp3"
        
        music_downloaded = await download_music(music_type, music_path)
        jingle_downloaded = await download_music("outro_jingle", jingle_path)
        
        if not music_downloaded:
            log("⚠️ Arka plan müziği indirilemedi, müziksiz devam ediliyor")
            music_path = None
        
        if not jingle_downloaded:
            log("⚠️ Jingle indirilemedi")
            jingle_path = None
        
        # 3. Tüm sesleri mixle
        if music_path or jingle_path:
            success = create_full_audio_mix(
                video_path=video_path,
                tts_audio_path=None,  # TTS zaten video içinde
                music_path=music_path if music_path and music_path.exists() else None,
                jingle_path=jingle_path if jingle_path and jingle_path.exists() else None,
                output_path=output_path,
                music_volume=0.12  # TTS duyulsun diye düşük volume
            )
            
            if success:
                log("✅ Müzik başarıyla eklendi")
                return True
            else:
                log("⚠️ Müzik ekleme başarısız, orijinal video kullanılıyor")
        
        # Fallback: Müzik yoksa videoyu kopyala
        import shutil
        shutil.copy(video_path, output_path)
        return False
        
    except Exception as e:
        log(f"⚠️ Müzik ekleme hatası: {e}", "WARN")
        import shutil
        shutil.copy(video_path, output_path)
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
                log(f"❌ Supabase hatası: {response.status_code}", "ERROR")
                return None
                
    except Exception as e:
        log(f"❌ Supabase upload hatası: {e}", "ERROR")
        return None


# ============================================================
# YOUTUBE UPLOAD
# ============================================================

async def upload_to_youtube(video_path: Path, question: VideoRequest, scenario: dict) -> Optional[str]:
    """YouTube'a yükle"""
    log("📤 YouTube'a yükleniyor...")
    
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
                log(f"✅ YouTube'a yüklendi")
                return data.get("videoUrl")
            else:
                log(f"⚠️ YouTube upload başarısız: {response.status_code}", "WARN")
                return None
                
    except Exception as e:
        log(f"⚠️ YouTube upload hatası: {e}", "WARN")
        return None


# ============================================================
# SUPABASE DB GÜNCELLE
# ============================================================

async def update_question_in_db(question_id: str, storage_url: str, youtube_url: str = None):
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
            await client.patch(
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
            log(f"✅ DB güncellendi: {question_id}")
                
    except Exception as e:
        log(f"⚠️ DB güncelleme hatası: {e}", "WARN")


# ============================================================
# ANA İŞLEM FONKSİYONU
# ============================================================

async def process_video(request: VideoRequest):
    """Ana video üretim işlemi"""
    start_time = time.time()
    result = {
        "questionId": request.question_id,
        "success": False,
        "storageUrl": None,
        "youtubeUrl": None,
        "error": None,
        "generation_method": None,
        "features": []
    }
    
    log(f"📋 İşlem başladı: {request.question_id}")
    log(f"📚 Ders: {request.subject_name}, Konu: {request.topic_name}")
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            audio_dir = temp_path / "audio"
            audio_dir.mkdir()
            
            # 1. Senaryo üret
            scenario = await generate_scenario_with_gemini(request)
            
            # 2. TTS sesleri oluştur (Türkçe profesyonel sesler)
            log(f"🎤 Sesler oluşturuluyor... (Ders: {request.subject_name})")
            audio_files, durations = await generate_tts_for_scenario(
                scenario, audio_dir, subject_name=request.subject_name
            )
            log(f"✅ {len(audio_files)} ses dosyası oluşturuldu")
            
            # 3. Sesleri birleştir
            combined_audio = temp_path / "combined_audio.mp3"
            if audio_files:
                concat_audios(audio_files, combined_audio)
            
            # 4. Video oluştur
            video_path, generation_method = await create_manim_video(
                request, scenario, temp_path, 
                include_outro=request.include_outro
            )
            
            result["generation_method"] = generation_method
            
            if not video_path or not video_path.exists():
                raise Exception("Video oluşturulamadı")
            
            result["features"].append("manim_video")
            if request.include_outro:
                result["features"].append("outro_animation")
            
            # 5. Ses ve videoyu birleştir
            video_with_tts = temp_path / "video_with_tts.mp4"
            if combined_audio.exists():
                merge_audio_video(video_path, combined_audio, video_with_tts)
            else:
                video_with_tts = video_path
            
            if not video_with_tts.exists():
                video_with_tts = video_path
            
            result["features"].append("tts_audio")
            
            # 6. Arka plan müziği ekle (opsiyonel)
            final_video = temp_path / "final_video.mp4"
            if request.include_music:
                music_added = await add_background_music_full(
                    video_path=video_with_tts,
                    output_path=final_video,
                    subject_name=request.subject_name,
                    temp_dir=temp_path
                )
                if music_added:
                    result["features"].append("background_music")
                    result["features"].append("outro_jingle")
            else:
                import shutil
                shutil.copy(video_with_tts, final_video)
            
            if not final_video.exists():
                final_video = video_with_tts
            
            # 8. Supabase'e yükle
            storage_url = await upload_to_supabase_storage(final_video, request.question_id)
            
            if storage_url:
                result["storageUrl"] = storage_url
                result["success"] = True
                
                await update_question_in_db(request.question_id, storage_url)
                
                # 9. YouTube'a yükle
                youtube_url = await upload_to_youtube(final_video, request, scenario)
                
                if youtube_url:
                    result["youtubeUrl"] = youtube_url
                    result["features"].append("youtube_upload")
                    await update_question_in_db(request.question_id, storage_url, youtube_url)
            else:
                raise Exception("Supabase upload başarısız")
            
            log(f"✅ İşlem tamamlandı: {request.question_id}")
            
    except Exception as e:
        result["error"] = str(e)
        log(f"❌ İşlem hatası: {e}", "ERROR")
    
    result["duration"] = round(time.time() - start_time, 2)
    
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
        version="8.0.0",
        features=[
            "gemini_3_pro_manim",
            "super_prompt_system",
            "student_tips",
            "outro_animation",
            "background_music",
            "3blue1brown_style",
            "all_subjects_support",
            "smart_fallback"
        ]
    )


@app.get("/info")
async def info():
    """Sistem bilgisi"""
    return {
        "version": "8.0.0",
        "name": "Teknokul Video Factory",
        "models": {
            "manim_code": GEMINI_MODEL_PRO,
            "scenario": GEMINI_MODEL_FLASH
        },
        "supported_subjects": [
            "Matematik", "Fizik", "Kimya", "Biyoloji",
            "Türkçe", "Tarih", "Coğrafya"
        ],
        "video_features": [
            "Hook (dikkat çekici açılış)",
            "Adım adım çözüm",
            "Püf noktası",
            "Doğru cevap vurgusu",
            "Teknokul outro",
            "TTS ses"
        ]
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
    
    log(f"📥 Video isteği: {request.question_id} | Ders: {request.subject_name}")
    
    background_tasks.add_task(process_video, request)
    
    return JSONResponse({
        "success": True,
        "message": "Video üretimi başlatıldı",
        "questionId": request.question_id,
        "estimatedTime": "60-120 saniye"
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
