#!/usr/bin/env python3
"""
Video Orchestrator - Tüm Video Üretim Pipeline'ı
Teknokul AI Video Solution System

Bu script şunları yapar:
1. Soruyu al (API'den veya parametre olarak)
2. Gemini ile çözüm üret
3. ElevenLabs ile ses üret
4. Manim ile video render et
5. Thumbnail oluştur
6. Ses + Video birleştir
7. YouTube'a yükle
8. Playlist'e ekle
"""

import os
import sys
import json
import time
import base64
import requests
import subprocess
from pathlib import Path
from datetime import datetime

# Proje kök dizini
PROJECT_ROOT = Path(__file__).parent.parent
MANIM_DIR = PROJECT_ROOT / "scripts" / "manim"
OUTPUT_DIR = MANIM_DIR / "media" / "videos"
TEMP_DIR = MANIM_DIR / "temp"

# Temp dizini oluştur
TEMP_DIR.mkdir(parents=True, exist_ok=True)

# Renk kodları
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=Colors.CYAN):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {message}{Colors.END}")

def log_success(message):
    log(f"✅ {message}", Colors.GREEN)

def log_error(message):
    log(f"❌ {message}", Colors.RED)

def log_step(step, message):
    log(f"[{step}/7] {message}", Colors.YELLOW)

# =====================================================
# 1. SORU VERİSİ AL
# =====================================================
def get_question_data(question_id: str, api_base: str) -> dict:
    """Supabase'den soru verisini al"""
    log_step(1, "Soru verisi alınıyor...")
    
    # API endpoint'i çağır
    try:
        response = requests.get(
            f"{api_base}/api/video/generate",
            params={"questionId": question_id},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            log_success(f"Soru alındı: {data.get('question', {}).get('question_text', '')[:50]}...")
            return data
        else:
            log_error(f"API hatası: {response.status_code}")
            return None
    except Exception as e:
        log_error(f"Soru alınamadı: {e}")
        return None

# =====================================================
# 2. GEMİNİ İLE ÇÖZÜM ÜRET
# =====================================================
def generate_solution(question_data: dict, api_base: str) -> dict:
    """Gemini ile adım adım çözüm üret"""
    log_step(2, "Gemini ile çözüm üretiliyor...")
    
    try:
        response = requests.post(
            f"{api_base}/api/video/generate",
            json={"questionId": question_data["question"]["id"]},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            solution = data.get("solutionData", {})
            log_success(f"Çözüm üretildi: {len(solution.get('steps', []))} adım")
            return solution
        else:
            log_error(f"Gemini hatası: {response.status_code}")
            return None
    except Exception as e:
        log_error(f"Çözüm üretilemedi: {e}")
        return None

# =====================================================
# 3. ELEVENLABS İLE SES ÜRET
# =====================================================
def generate_audio(narration_text: str, api_base: str, output_path: Path) -> bool:
    """ElevenLabs ile Türkçe ses üret"""
    log_step(3, "ElevenLabs ile ses üretiliyor...")
    
    try:
        response = requests.post(
            f"{api_base}/api/tekno-teacher/elevenlabs-tts",
            json={"text": narration_text, "voice": "turkish"},
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            audio_base64 = data.get("audio")
            
            if audio_base64:
                # Base64'ü dosyaya kaydet
                audio_bytes = base64.b64decode(audio_base64)
                with open(output_path, "wb") as f:
                    f.write(audio_bytes)
                
                log_success(f"Ses dosyası oluşturuldu: {output_path.name}")
                return True
        
        log_error(f"Ses üretilemedi: {response.status_code}")
        return False
    except Exception as e:
        log_error(f"Ses hatası: {e}")
        return False

# =====================================================
# 4. MANİM İLE VİDEO RENDER ET
# =====================================================
def render_video(question_data: dict, solution_data: dict, output_name: str) -> Path:
    """Manim ile video render et"""
    log_step(4, "Manim ile video render ediliyor...")
    
    # Manim script'ini dinamik oluştur
    manim_script = TEMP_DIR / f"{output_name}_scene.py"
    
    question = question_data.get("question", {})
    topic = question_data.get("topic", {})
    
    # Çözüm adımlarını al
    steps = solution_data.get("steps", [])
    narration = solution_data.get("narrationText", "")
    
    script_content = f'''
from manim import *

# Teknokul renkleri
TEKNOKUL_PURPLE = "#8B5CF6"
TEKNOKUL_ORANGE = "#F97316"
TEKNOKUL_DARK = "#1E1B4B"

class VideoSolution(Scene):
    def construct(self):
        # Arka plan
        self.camera.background_color = TEKNOKUL_DARK
        
        # Başlık
        title = Text("{topic.get('main_topic', 'Soru Çözümü')}", font_size=36, color=WHITE)
        subtitle = Text("{question.get('difficulty', 'Orta').title()} Seviye", font_size=24, color=TEKNOKUL_ORANGE)
        
        header = VGroup(title, subtitle).arrange(DOWN, buff=0.3)
        header.to_edge(UP, buff=0.5)
        
        self.play(FadeIn(header))
        self.wait(1)
        
        # Soru metni
        q_text = "{question.get('question_text', '')[:200].replace(chr(10), ' ').replace('"', "'")}"
        question_box = VGroup(
            Text("📝 SORU", font_size=28, color=TEKNOKUL_PURPLE),
            Text(q_text, font_size=20, color=WHITE).scale(0.8)
        ).arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        question_box.next_to(header, DOWN, buff=0.5)
        
        self.play(FadeIn(question_box))
        self.wait(3)
        
        # Çözüm adımları
        self.play(FadeOut(question_box))
        
        steps_title = Text("✨ ÇÖZÜM", font_size=32, color=TEKNOKUL_ORANGE)
        steps_title.to_edge(UP, buff=1.5)
        self.play(FadeIn(steps_title))
        
'''
    
    # Her adım için animasyon ekle
    for i, step in enumerate(steps[:5], 1):  # Max 5 adım
        step_text = str(step).replace('"', "'").replace('\n', ' ')[:150]
        script_content += f'''
        step_{i} = Text("Adım {i}: {step_text}", font_size=22, color=WHITE)
        step_{i}.next_to(steps_title, DOWN, buff={0.5 + i*0.8})
        self.play(Write(step_{i}))
        self.wait(2)
'''
    
    # Final
    script_content += '''
        # Doğru cevap
        self.wait(1)
        
        answer = Text("✅ DOĞRU CEVAP", font_size=36, color=GREEN)
        answer.move_to(ORIGIN)
        self.play(FadeIn(answer, scale=1.5))
        self.wait(2)
        
        # Teknokul logo
        logo = Text("Teknokul.com.tr", font_size=28, color=TEKNOKUL_PURPLE)
        logo.to_edge(DOWN, buff=0.5)
        self.play(FadeIn(logo))
        self.wait(1)
'''
    
    # Script'i kaydet
    with open(manim_script, "w", encoding="utf-8") as f:
        f.write(script_content)
    
    # Manim'i çalıştır
    try:
        result = subprocess.run(
            ["manim", "-qm", str(manim_script), "VideoSolution", "-o", output_name],
            cwd=MANIM_DIR,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            # Output dosyasını bul
            video_path = OUTPUT_DIR / "720p30" / f"{output_name}.mp4"
            if video_path.exists():
                log_success(f"Video render edildi: {video_path.name}")
                return video_path
        
        log_error(f"Manim hatası: {result.stderr[:200]}")
        return None
    except subprocess.TimeoutExpired:
        log_error("Manim timeout (5 dakika)")
        return None
    except Exception as e:
        log_error(f"Render hatası: {e}")
        return None

# =====================================================
# 5. THUMBNAIL OLUŞTUR
# =====================================================
def create_thumbnail(question_data: dict, output_path: Path) -> bool:
    """Manim ile thumbnail oluştur"""
    log_step(5, "Thumbnail oluşturuluyor...")
    
    question = question_data.get("question", {})
    topic = question_data.get("topic", {})
    
    thumbnail_script = TEMP_DIR / "thumbnail_temp.py"
    
    script_content = f'''
from manim import *

class Thumbnail(Scene):
    def construct(self):
        self.camera.background_color = "#1E1B4B"
        
        # Gradient arka plan efekti
        rect = Rectangle(width=14.2, height=8, fill_opacity=1)
        rect.set_fill(color=["#1E1B4B", "#312E81"])
        self.add(rect)
        
        # Başlık
        title = Text("{topic.get('main_topic', 'Soru Çözümü')[:30]}", font_size=48, color=WHITE, font="Arial")
        title.to_edge(UP, buff=1)
        
        # Sınıf badge
        grade = Text("{topic.get('grade', 8)}. SINIF", font_size=32, color="#F97316", font="Arial")
        grade.next_to(title, DOWN, buff=0.3)
        
        # Play butonu
        play_circle = Circle(radius=0.8, color="#8B5CF6", fill_opacity=0.9)
        play_triangle = Triangle(color=WHITE, fill_opacity=1).scale(0.4)
        play_triangle.move_to(play_circle.get_center() + RIGHT*0.1)
        play_btn = VGroup(play_circle, play_triangle)
        play_btn.move_to(ORIGIN)
        
        # VİDEOLU ÇÖZÜM text
        video_text = Text("VİDEOLU ÇÖZÜM", font_size=36, color="#F97316", font="Arial")
        video_text.next_to(play_btn, DOWN, buff=0.5)
        
        # Logo
        logo = Text("Teknokul.com.tr", font_size=28, color="#8B5CF6", font="Arial")
        logo.to_edge(DOWN, buff=0.5)
        
        self.add(title, grade, play_btn, video_text, logo)

# PNG olarak kaydet
config.pixel_width = 1280
config.pixel_height = 720
config.frame_rate = 1
'''
    
    with open(thumbnail_script, "w", encoding="utf-8") as f:
        f.write(script_content)
    
    try:
        result = subprocess.run(
            ["manim", "-ql", "--format=png", str(thumbnail_script), "Thumbnail", "-o", "thumbnail"],
            cwd=MANIM_DIR,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        # PNG dosyasını bul ve taşı
        png_path = OUTPUT_DIR / "480p15" / "thumbnail.png"
        if png_path.exists():
            import shutil
            shutil.copy(png_path, output_path)
            log_success(f"Thumbnail oluşturuldu: {output_path.name}")
            return True
        
        log_error("Thumbnail oluşturulamadı")
        return False
    except Exception as e:
        log_error(f"Thumbnail hatası: {e}")
        return False

# =====================================================
# 6. SES + VİDEO BİRLEŞTİR
# =====================================================
def merge_audio_video(video_path: Path, audio_path: Path, output_path: Path) -> bool:
    """FFmpeg ile ses ve videoyu birleştir"""
    log_step(6, "Ses ve video birleştiriliyor...")
    
    try:
        # Video süresini al
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", 
             "-of", "default=noprint_wrappers=1:nokey=1", str(video_path)],
            capture_output=True, text=True
        )
        video_duration = float(probe.stdout.strip())
        
        # FFmpeg komutu
        cmd = [
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-i", str(audio_path),
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            str(output_path)
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0 and output_path.exists():
            log_success(f"Final video oluşturuldu: {output_path.name}")
            return True
        
        log_error(f"FFmpeg hatası: {result.stderr[:200]}")
        return False
    except Exception as e:
        log_error(f"Birleştirme hatası: {e}")
        return False

# =====================================================
# 7. YOUTUBE'A YÜKLE
# =====================================================
def upload_to_youtube(video_path: Path, thumbnail_path: Path, metadata: dict, api_base: str) -> dict:
    """YouTube'a video yükle"""
    log_step(7, "YouTube'a yükleniyor...")
    
    # TODO: Gerçek YouTube upload implementasyonu
    # Şimdilik API'yi çağır
    try:
        response = requests.post(
            f"{api_base}/api/video/youtube-upload",
            json={
                "videoPath": str(video_path),
                "questionId": metadata["questionId"],
                "title": metadata["title"],
                "description": metadata["description"],
                "tags": metadata["tags"],
                "grade": metadata.get("grade"),
                "subject": metadata.get("subject")
            },
            timeout=300
        )
        
        if response.status_code == 200:
            data = response.json()
            log_success(f"YouTube'a yüklendi: {data.get('videoUrl')}")
            return data
        else:
            log_error(f"Upload hatası: {response.status_code}")
            return None
    except Exception as e:
        log_error(f"YouTube hatası: {e}")
        return None

# =====================================================
# ANA ORCHESTRATOR
# =====================================================
def orchestrate(question_id: str, api_base: str = "http://localhost:3000"):
    """Tüm pipeline'ı çalıştır"""
    
    print(f"\n{Colors.HEADER}{'='*60}")
    print(f"🎬 TEKNOKUL VİDEO ORCHESTRATOR")
    print(f"{'='*60}{Colors.END}\n")
    
    log(f"Soru ID: {question_id}")
    log(f"API Base: {api_base}")
    print()
    
    start_time = time.time()
    output_name = f"solution_{question_id[:8]}_{int(time.time())}"
    
    # 1. Soru verisini al
    question_data = get_question_data(question_id, api_base)
    if not question_data:
        return False
    
    # 2. Çözüm üret
    solution_data = generate_solution(question_data, api_base)
    if not solution_data:
        return False
    
    # 3. Ses üret
    audio_path = TEMP_DIR / f"{output_name}.mp3"
    narration = solution_data.get("narrationText", "Bu sorunun çözümünü birlikte inceleyelim.")
    if not generate_audio(narration, api_base, audio_path):
        log_error("Ses üretilemedi, devam ediliyor...")
    
    # 4. Video render et
    video_path = render_video(question_data, solution_data, output_name)
    if not video_path:
        return False
    
    # 5. Thumbnail oluştur
    thumbnail_path = TEMP_DIR / f"{output_name}_thumb.png"
    create_thumbnail(question_data, thumbnail_path)
    
    # 6. Ses + Video birleştir
    final_path = TEMP_DIR / f"{output_name}_final.mp4"
    if audio_path.exists():
        merge_audio_video(video_path, audio_path, final_path)
    else:
        final_path = video_path
    
    # 7. YouTube'a yükle
    question = question_data.get("question", {})
    topic = question_data.get("topic", {})
    
    metadata = {
        "questionId": question_id,
        "title": f"{topic.get('grade', 8)}. Sınıf {topic.get('subject_name', 'Matematik')} | {topic.get('main_topic', 'Soru Çözümü')}",
        "description": solution_data.get("narrationText", ""),
        "tags": ["Teknokul", "soru çözümü", "eğitim"],
        "grade": topic.get("grade"),
        "subject": topic.get("subject_name")
    }
    
    result = upload_to_youtube(final_path, thumbnail_path, metadata, api_base)
    
    # Sonuç
    elapsed = time.time() - start_time
    print(f"\n{Colors.HEADER}{'='*60}")
    if result:
        print(f"✅ VİDEO BAŞARIYLA OLUŞTURULDU!")
        print(f"🎬 YouTube URL: {result.get('videoUrl', 'N/A')}")
    else:
        print(f"⚠️ Video oluşturuldu ama YouTube'a yüklenemedi")
    print(f"⏱️ Toplam süre: {elapsed:.1f} saniye")
    print(f"{'='*60}{Colors.END}\n")
    
    return result

# =====================================================
# CLI
# =====================================================
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Kullanım: python video-orchestrator.py <question_id> [api_base]")
        print("Örnek: python video-orchestrator.py abc123 http://localhost:3000")
        sys.exit(1)
    
    question_id = sys.argv[1]
    api_base = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:3000"
    
    orchestrate(question_id, api_base)
