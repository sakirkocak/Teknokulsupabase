"""
Teknokul Müzik Yöneticisi
🎵 Arka plan müziği ve jingle entegrasyonu
"""

import os
import subprocess
from pathlib import Path
from typing import Optional
import httpx

# Supabase bilgileri
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# Müzik türleri ve URL'leri (Supabase Storage'dan)
MUSIC_CONFIG = {
    "background": {
        "default": "music/background_calm.mp3",
        "energetic": "music/background_energetic.mp3",
        "focus": "music/background_focus.mp3",
    },
    "outro_jingle": "music/teknokul_jingle.mp3",
    "success_sound": "music/success_ding.mp3"
}

# Ders bazlı müzik önerileri
SUBJECT_MUSIC = {
    "Matematik": "focus",
    "Fizik": "energetic",
    "Kimya": "focus",
    "Biyoloji": "default",
    "Türkçe": "default",
    "Tarih": "default",
    "Coğrafya": "default"
}


def get_music_type_for_subject(subject_name: str) -> str:
    """Ders için uygun müzik türünü döndür"""
    for key in SUBJECT_MUSIC:
        if key.lower() in subject_name.lower():
            return SUBJECT_MUSIC[key]
    return "default"


async def download_music(music_key: str, output_path: Path) -> bool:
    """Supabase Storage'dan müzik indir"""
    try:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            print("⚠️ Supabase credentials eksik, müzik indirilemedi")
            return False
        
        # Müzik yolunu al
        if music_key in MUSIC_CONFIG:
            music_path = MUSIC_CONFIG[music_key]
        elif music_key in MUSIC_CONFIG.get("background", {}):
            music_path = MUSIC_CONFIG["background"][music_key]
        else:
            music_path = MUSIC_CONFIG["background"]["default"]
        
        url = f"{SUPABASE_URL}/storage/v1/object/public/assets/{music_path}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=60)
            
            if response.status_code == 200:
                with open(output_path, "wb") as f:
                    f.write(response.content)
                return True
            else:
                print(f"⚠️ Müzik indirilemedi: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"⚠️ Müzik indirme hatası: {e}")
        return False


def add_background_music(video_path: Path, music_path: Path, output_path: Path, 
                         music_volume: float = 0.15) -> bool:
    """
    Videoya arka plan müziği ekle
    - TTS duyulsun diye müzik düşük volume
    - Müzik loop edilir
    """
    try:
        # Video süresini al
        duration_cmd = [
            "ffprobe", "-v", "error", 
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(video_path)
        ]
        result = subprocess.run(duration_cmd, capture_output=True, text=True, timeout=30)
        video_duration = float(result.stdout.strip())
        
        # Müziği loop edip video süresine kırp, volume ayarla, orijinal sesle mixle
        cmd = [
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-stream_loop", "-1",  # Müziği tekrarla
            "-i", str(music_path),
            "-filter_complex", 
            f"[1:a]volume={music_volume},atrim=0:{video_duration}[bg];"
            f"[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]",
            "-map", "0:v",
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            str(output_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0 and output_path.exists():
            return True
        else:
            print(f"⚠️ Müzik ekleme hatası: {result.stderr[:300]}")
            return False
            
    except Exception as e:
        print(f"⚠️ Müzik ekleme hatası: {e}")
        return False


def add_outro_jingle(video_path: Path, jingle_path: Path, output_path: Path,
                     jingle_start_before_end: float = 3.0) -> bool:
    """
    Video sonuna jingle ekle
    - Video bitmeden X saniye önce başlar
    - Fade-in efekti
    """
    try:
        # Video süresini al
        duration_cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(video_path)
        ]
        result = subprocess.run(duration_cmd, capture_output=True, text=True, timeout=30)
        video_duration = float(result.stdout.strip())
        
        jingle_start = max(0, video_duration - jingle_start_before_end)
        
        # Jingle'ı belirli zamanda başlat ve mixle
        cmd = [
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-i", str(jingle_path),
            "-filter_complex",
            f"[1:a]adelay={int(jingle_start*1000)}|{int(jingle_start*1000)},afade=t=in:st=0:d=0.5,volume=0.8[jingle];"
            f"[0:a][jingle]amix=inputs=2:duration=first[aout]",
            "-map", "0:v",
            "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac",
            str(output_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0 and output_path.exists():
            return True
        else:
            print(f"⚠️ Jingle ekleme hatası: {result.stderr[:300]}")
            return False
            
    except Exception as e:
        print(f"⚠️ Jingle ekleme hatası: {e}")
        return False


def create_full_audio_mix(video_path: Path, tts_audio_path: Path, 
                          music_path: Optional[Path], jingle_path: Optional[Path],
                          output_path: Path, music_volume: float = 0.12) -> bool:
    """
    Tüm sesleri tek seferde mixle:
    1. TTS (ana ses - yüksek volume)
    2. Arka plan müziği (düşük volume)
    3. Outro jingle (son 3 saniye)
    """
    try:
        # Video süresini al
        duration_cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(video_path)
        ]
        result = subprocess.run(duration_cmd, capture_output=True, text=True, timeout=30)
        video_duration = float(result.stdout.strip())
        
        inputs = ["-i", str(video_path)]
        filter_parts = []
        audio_streams = []
        stream_idx = 1
        
        # TTS sesi (video'dan)
        audio_streams.append("[0:a]")
        
        # Arka plan müziği
        if music_path and music_path.exists():
            inputs.extend(["-stream_loop", "-1", "-i", str(music_path)])
            filter_parts.append(f"[{stream_idx}:a]volume={music_volume},atrim=0:{video_duration}[bg]")
            audio_streams.append("[bg]")
            stream_idx += 1
        
        # Jingle
        if jingle_path and jingle_path.exists():
            inputs.extend(["-i", str(jingle_path)])
            jingle_start = max(0, video_duration - 3.5)
            filter_parts.append(
                f"[{stream_idx}:a]adelay={int(jingle_start*1000)}|{int(jingle_start*1000)},"
                f"afade=t=in:st=0:d=0.3,volume=0.7[jingle]"
            )
            audio_streams.append("[jingle]")
            stream_idx += 1
        
        # Tüm audio'ları mixle
        if len(audio_streams) > 1:
            filter_complex = ";".join(filter_parts)
            if filter_complex:
                filter_complex += ";"
            filter_complex += f"{''.join(audio_streams)}amix=inputs={len(audio_streams)}:duration=first[aout]"
            
            cmd = [
                "ffmpeg", "-y",
                *inputs,
                "-filter_complex", filter_complex,
                "-map", "0:v",
                "-map", "[aout]",
                "-c:v", "copy",
                "-c:a", "aac",
                str(output_path)
            ]
        else:
            # Sadece orijinal ses
            cmd = [
                "ffmpeg", "-y",
                "-i", str(video_path),
                "-c:v", "copy",
                "-c:a", "aac",
                str(output_path)
            ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
        
        if result.returncode == 0 and output_path.exists():
            return True
        else:
            print(f"⚠️ Audio mix hatası: {result.stderr[:500]}")
            return False
            
    except Exception as e:
        print(f"⚠️ Audio mix hatası: {e}")
        return False


# Basit placeholder müzik oluştur (test için)
def create_silent_audio(duration: float, output_path: Path) -> bool:
    """Test için sessiz audio oluştur"""
    try:
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", f"anullsrc=r=44100:cl=stereo",
            "-t", str(duration),
            "-c:a", "libmp3lame",
            str(output_path)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return result.returncode == 0
    except:
        return False
