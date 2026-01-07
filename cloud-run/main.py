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
    version="2.2.0"
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

def clean_latex_for_display(text: str) -> str:
    """LaTeX ifadelerini ekran için temizle"""
    import re
    if not text:
        return ""
    # $ işaretlerini kaldır
    text = re.sub(r'\$([^$]+)\$', r'\1', text)
    # Bazı LaTeX komutlarını temizle
    text = text.replace('\\int', '∫')
    text = text.replace('\\sum', 'Σ')
    text = text.replace('\\infty', '∞')
    text = text.replace('\\pi', 'π')
    text = text.replace('\\sqrt', '√')
    text = text.replace('\\frac', '')
    text = text.replace('\\left', '')
    text = text.replace('\\right', '')
    text = text.replace('\\cdot', '·')
    text = text.replace('\\times', '×')
    text = text.replace('\\div', '÷')
    text = text.replace('\\leq', '≤')
    text = text.replace('\\geq', '≥')
    text = text.replace('\\neq', '≠')
    text = text.replace('\\pm', '±')
    text = text.replace('{', '')
    text = text.replace('}', '')
    text = text.replace('^', '')
    text = text.replace('_', '')
    text = text.replace('\\', '')
    return text.strip()

def clean_latex_for_speech(text: str) -> str:
    """LaTeX ifadelerini konuşma için temizle"""
    import re
    if not text:
        return ""
    
    # $...$ içindeki ifadeleri sözelleştir
    def replace_math(match):
        expr = match.group(1)
        # Temel dönüşümler
        expr = re.sub(r'(\w)\^2', r"\1'nin karesi", expr)
        expr = re.sub(r'(\w)\^3', r"\1'ün küpü", expr)
        expr = re.sub(r'(\w)\^(\d+)', r'\1 üzeri \2', expr)
        expr = re.sub(r'\\int', 'integralini alırsak', expr)
        expr = re.sub(r'\\sum', 'toplamı', expr)
        expr = re.sub(r'\\infty', 'sonsuz', expr)
        expr = re.sub(r'\\pi', 'pi', expr)
        expr = re.sub(r'\\sqrt\{([^}]+)\}', r'\1 in karekökü', expr)
        expr = re.sub(r'\\frac\{([^}]+)\}\{([^}]+)\}', r'\1 bölü \2', expr)
        expr = re.sub(r'f\((\w+)\)', r'f \1 fonksiyonu', expr)
        expr = re.sub(r"f'", 'f türevi', expr)
        expr = expr.replace('\\left', '')
        expr = expr.replace('\\right', '')
        expr = expr.replace('{', '')
        expr = expr.replace('}', '')
        expr = expr.replace('\\', '')
        expr = expr.replace('_', ' alt ')
        expr = expr.replace('^', ' üzeri ')
        return expr
    
    text = re.sub(r'\$([^$]+)\$', replace_math, text)
    # Kalan $ işaretlerini kaldır
    text = text.replace('$', '')
    return text.strip()

async def generate_solution_with_gemini(question: VideoRequest) -> dict:
    """Gemini ile çözüm üret"""
    log("Gemini ile çözüm üretiliyor...")
    
    # Soru metnini temizle
    clean_question = clean_latex_for_speech(question.question_text)
    
    prompt = f"""Sen deneyimli bir matematik öğretmenisin. Bu soruyu öğrenciye anlatır gibi ADIM ADIM çöz.

SORU: {clean_question}

ŞIKLAR:
{json.dumps(question.options, ensure_ascii=False)}

DOĞRU CEVAP: {question.correct_answer}

MUTLAKA UYULMASI GEREKEN KURALLAR:

1. EN AZ 4, EN FAZLA 6 ADIM olsun. Her adım SOMUT ve ANLAMLI olmalı.

2. MATEMATİKSEL İFADELERİ ASLA LaTeX OLARAK YAZMA! Sözel yaz:
   - "$x^2$" YAZMA → "x'in karesi" YAZ
   - "$\\int$" YAZMA → "integral" YAZ  
   - "$f(x)$" YAZMA → "f fonksiyonu" YAZ
   - "$\\frac{{a}}{{b}}$" YAZMA → "a bölü b" YAZ

3. SESLENDIRME METNİNDE:
   - Kısa cümleler kur (max 15 kelime)
   - Duraklamalar için "..." kullan
   - Vurgular: "dikkat!", "önemli!", "işte burada..."
   - Motivasyon: "Harika!", "Evet doğru yoldayız!", "Şimdi sonuca ulaştık!"

JSON formatında MUTLAKA şöyle yanıt ver:
{{
    "steps": [
        {{"text": "Birinci adımın seslendirme metni", "displayText": "Ekranda gösterilecek kısa metin"}},
        {{"text": "İkinci adımın seslendirme metni", "displayText": "Ekranda gösterilecek kısa metin"}},
        {{"text": "Üçüncü adımın seslendirme metni", "displayText": "Ekranda gösterilecek kısa metin"}},
        {{"text": "Dördüncü adımın seslendirme metni", "displayText": "Ekranda gösterilecek kısa metin"}}
    ],
    "narrationText": "Tüm çözümün akıcı seslendirme metni... Duraklamalar için üç nokta kullan... Matematiksel ifadeleri sözel anlat... Max 600 karakter.",
    "finalAnswer": "Doğru cevap {question.correct_answer} şıkkı"
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
    
    # Fallback - daha anlamlı varsayılan adımlar
    clean_exp = clean_latex_for_speech(question.explanation or "")
    return {
        "steps": [
            {"text": "Öncelikle soruyu dikkatli okuyalım ve verilenleri belirleyelim.", "displayText": "Verilenleri belirleyelim"},
            {"text": "Şimdi bu verileri kullanarak çözüme başlayalım.", "displayText": "Çözüme başlayalım"},
            {"text": f"{clean_exp or 'İşlemleri adım adım yapalım.'}", "displayText": "İşlemleri yapalım"},
            {"text": f"Ve sonuç olarak doğru cevap {question.correct_answer} şıkkı!", "displayText": f"Cevap: {question.correct_answer}"}
        ],
        "narrationText": f"Bu soruyu birlikte çözelim... Önce verilenlere bakalım... {clean_exp or 'Adım adım ilerleyelim.'}... Ve sonuç olarak doğru cevap {question.correct_answer} şıkkı!",
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
    # LaTeX temizle
    q = clean_latex_for_display(question.question_text or "")
    q = q.strip().replace("\r", " ")
    q = " ".join(q.split())
    q_wrapped = textwrap.fill(q, width=44)

    options_lines = []
    if isinstance(question.options, dict):
        for key in ["A", "B", "C", "D", "E"]:
            if key in question.options and question.options.get(key):
                opt = clean_latex_for_display(str(question.options.get(key)))
                opt = opt.strip().replace("\r", " ")
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

def _create_step_clip(step_num: int, step_text: str, duration: float, output_path: Path, fontfile: Optional[str], topic: str) -> bool:
    """Tek bir adım için video klip oluştur"""
    try:
        # Adım metnini temizle ve wrap et
        clean_text = step_text.replace("'", "").replace('"', '').replace('\n', ' ')
        wrapped = textwrap.fill(clean_text, width=50)
        
        textfile = output_path.with_suffix(f".step{step_num}.txt")
        textfile.write_text(wrapped, encoding="utf-8")
        tf = _ffmpeg_escape_path_for_filter(textfile)
        
        draw = []
        # Başlık
        if fontfile:
            draw.append(f"drawtext=fontfile={fontfile}:text='{topic}':fontsize=42:fontcolor=white:x=(w-text_w)/2:y=40")
            draw.append(f"drawtext=fontfile={fontfile}:text='Adım {step_num}':fontsize=56:fontcolor=0xF97316:x=(w-text_w)/2:y=120")
        else:
            draw.append(f"drawtext=text='{topic}':fontsize=42:fontcolor=white:x=(w-text_w)/2:y=40")
            draw.append(f"drawtext=text='Adım {step_num}':fontsize=56:fontcolor=0xF97316:x=(w-text_w)/2:y=120")
        
        # İçerik kutusu
        draw.append("drawbox=x=80:y=200:w=1120:h=400:color=black@0.4:t=fill")
        if fontfile:
            draw.append(f"drawtext=fontfile={fontfile}:textfile='{tf}':reload=0:fontsize=36:fontcolor=white:x=120:y=250:line_spacing=16")
        else:
            draw.append(f"drawtext=textfile='{tf}':reload=0:fontsize=36:fontcolor=white:x=120:y=250:line_spacing=16")
        
        # Footer
        if fontfile:
            draw.append(f"drawtext=fontfile={fontfile}:text='Teknokul.com.tr':fontsize=24:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-50")
        else:
            draw.append("drawtext=text='Teknokul.com.tr':fontsize=24:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-50")
        
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", f"color=c=0x1E1B4B:s=1280x720:d={duration}",
            "-vf", ",".join(draw),
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            str(output_path)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        textfile.unlink(missing_ok=True)
        return res.returncode == 0 and output_path.exists()
    except Exception as e:
        log(f"Adım {step_num} klip hatası: {e}", "ERROR")
        return False

def create_simple_video(question: VideoRequest, solution: dict, output_path: Path, audio_path: Optional[Path] = None) -> bool:
    """FFmpeg ile video oluştur (intro + soru + adımlar + sonuç)"""
    log("FFmpeg ile video oluşturuluyor...")

    try:
        # --- Audio işle ---
        intro_seconds = 2.5
        question_seconds = 6.0
        final_audio: Optional[Path] = None
        total_audio_duration = 30.0

        if audio_path and audio_path.exists():
            slow_audio = audio_path.with_name("narration_slow.mp3")
            if _slow_down_audio(audio_path, slow_audio, speed=0.92):
                final_audio = slow_audio
            else:
                final_audio = audio_path

            aud_dur = _audio_duration_seconds(final_audio)
            if aud_dur:
                total_audio_duration = aud_dur + 2.0

        # --- Görsel indir ---
        img_path: Optional[Path] = None
        if question.question_image_url:
            log(f"Görsel indiriliyor: {question.question_image_url[:50]}...")
            img_path = _download_question_image(question.question_image_url, output_path.with_suffix(".qimg"))
            if img_path and img_path.exists():
                log(f"✅ Görsel indirildi: {img_path.stat().st_size} bytes")
            else:
                log("⚠️ Görsel indirilemedi", "WARN")

        fontfile = _pick_fontfile()
        topic = (question.topic_name or "Soru Çözümü").strip().replace("'", "").replace('"', '')
        
        clips_to_concat = []
        temp_files = []

        # --- 1. INTRO KLİP ---
        intro_path = output_path.with_suffix(".intro.mp4")
        intro_draw = []
        if fontfile:
            intro_draw.append(f"drawtext=fontfile={fontfile}:text='Teknokul':fontsize=84:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-50")
            intro_draw.append(f"drawtext=fontfile={fontfile}:text='Video Soru Çözümü':fontsize=44:fontcolor=0xF97316:x=(w-text_w)/2:y=(h-text_h)/2+50")
            intro_draw.append(f"drawtext=fontfile={fontfile}:text='teknokul.com.tr':fontsize=28:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-60")
        else:
            intro_draw.append("drawtext=text='Teknokul':fontsize=84:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-50")
            intro_draw.append("drawtext=text='Video Soru Çözümü':fontsize=44:fontcolor=0xF97316:x=(w-text_w)/2:y=(h-text_h)/2+50")
            intro_draw.append("drawtext=text='teknokul.com.tr':fontsize=28:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-60")

        intro_cmd = [
            "ffmpeg", "-y", "-f", "lavfi",
            "-i", f"color=c=0x1E1B4B:s=1280x720:d={intro_seconds}",
            "-vf", ",".join(intro_draw),
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            str(intro_path)
        ]
        subprocess.run(intro_cmd, capture_output=True, text=True, timeout=60)
        clips_to_concat.append(intro_path)
        temp_files.append(intro_path)

        # --- 2. SORU KLİP ---
        question_path = output_path.with_suffix(".question.mp4")
        q_text = _build_question_overlay_text(question)
        q_textfile = output_path.with_suffix(".qtxt")
        q_textfile.write_text(q_text, encoding="utf-8")
        temp_files.append(q_textfile)
        qtf = _ffmpeg_escape_path_for_filter(q_textfile)

        if img_path and img_path.exists():
            # Görsel + metin
            q_draw = []
            if fontfile:
                q_draw.append(f"drawtext=fontfile={fontfile}:text='{topic}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=40")
            else:
                q_draw.append(f"drawtext=text='{topic}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=40")
            q_draw.append("drawbox=x=640:y=100:w=600:h=520:color=black@0.35:t=fill")
            if fontfile:
                q_draw.append(f"drawtext=fontfile={fontfile}:textfile='{qtf}':reload=0:fontsize=24:fontcolor=white:x=660:y=120:line_spacing=6")
                q_draw.append(f"drawtext=fontfile={fontfile}:text='Teknokul.com.tr':fontsize=22:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-40")
            else:
                q_draw.append(f"drawtext=textfile='{qtf}':reload=0:fontsize=24:fontcolor=white:x=660:y=120:line_spacing=6")
                q_draw.append("drawtext=text='Teknokul.com.tr':fontsize=22:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-40")
            
            q_vf = (
                "[1:v]scale=580:-1:force_original_aspect_ratio=decrease[img];"
                f"[0:v][img]overlay=30:120:format=auto,{','.join(q_draw)}[v]"
            )
            q_cmd = [
                "ffmpeg", "-y",
                "-f", "lavfi", "-i", f"color=c=0x1E1B4B:s=1280x720:d={question_seconds}",
                "-i", str(img_path),
                "-filter_complex", q_vf,
                "-map", "[v]",
                "-c:v", "libx264", "-pix_fmt", "yuv420p",
                str(question_path)
            ]
        else:
            # Sadece metin
            q_draw = []
            if fontfile:
                q_draw.append(f"drawtext=fontfile={fontfile}:text='{topic}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=40")
            else:
                q_draw.append(f"drawtext=text='{topic}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=40")
            q_draw.append("drawbox=x=60:y=100:w=1160:h=520:color=black@0.35:t=fill")
            if fontfile:
                q_draw.append(f"drawtext=fontfile={fontfile}:textfile='{qtf}':reload=0:fontsize=28:fontcolor=white:x=100:y=130:line_spacing=8")
                q_draw.append(f"drawtext=fontfile={fontfile}:text='Teknokul.com.tr':fontsize=22:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-40")
            else:
                q_draw.append(f"drawtext=textfile='{qtf}':reload=0:fontsize=28:fontcolor=white:x=100:y=130:line_spacing=8")
                q_draw.append("drawtext=text='Teknokul.com.tr':fontsize=22:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-40")
            
            q_cmd = [
                "ffmpeg", "-y", "-f", "lavfi",
                "-i", f"color=c=0x1E1B4B:s=1280x720:d={question_seconds}",
                "-vf", ",".join(q_draw),
                "-c:v", "libx264", "-pix_fmt", "yuv420p",
                str(question_path)
            ]
        
        subprocess.run(q_cmd, capture_output=True, text=True, timeout=60)
        clips_to_concat.append(question_path)
        temp_files.append(question_path)

        # --- 3. ADIM KLİPLERİ ---
        steps = solution.get("steps", [])
        num_steps = len(steps) if steps else 1
        
        # Her adıma düşen süre (intro + soru hariç kalan süre)
        remaining_time = max(10.0, total_audio_duration - intro_seconds - question_seconds - 3.0)
        step_duration = remaining_time / max(num_steps, 1)
        step_duration = max(3.0, min(8.0, step_duration))  # 3-8 saniye arası
        
        for i, step in enumerate(steps[:5], 1):  # Max 5 adım
            step_path = output_path.with_suffix(f".step{i}.mp4")
            
            # Step text'i al
            if isinstance(step, dict):
                step_text = step.get("displayText") or step.get("text") or str(step)
            else:
                step_text = str(step)
            
            if _create_step_clip(i, step_text, step_duration, step_path, fontfile, topic):
                clips_to_concat.append(step_path)
                temp_files.append(step_path)

        # --- 4. SONUÇ KLİP ---
        result_path = output_path.with_suffix(".result.mp4")
        result_duration = 3.0
        final_answer = solution.get("finalAnswer", f"Doğru cevap: {question.correct_answer}")
        
        result_draw = []
        if fontfile:
            result_draw.append(f"drawtext=fontfile={fontfile}:text='SONUÇ':fontsize=64:fontcolor=0x22C55E:x=(w-text_w)/2:y=200")
            # Doğru cevap - kısa tut
            answer_short = final_answer[:80].replace("'", "").replace('"', '')
            result_draw.append(f"drawtext=fontfile={fontfile}:text='{answer_short}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=320")
            result_draw.append(f"drawtext=fontfile={fontfile}:text='Teknokul.com.tr':fontsize=28:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-60")
        else:
            result_draw.append("drawtext=text='SONUÇ':fontsize=64:fontcolor=0x22C55E:x=(w-text_w)/2:y=200")
            answer_short = final_answer[:80].replace("'", "").replace('"', '')
            result_draw.append(f"drawtext=text='{answer_short}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=320")
            result_draw.append("drawtext=text='Teknokul.com.tr':fontsize=28:fontcolor=0x8B5CF6:x=(w-text_w)/2:y=h-60")
        
        result_cmd = [
            "ffmpeg", "-y", "-f", "lavfi",
            "-i", f"color=c=0x1E1B4B:s=1280x720:d={result_duration}",
            "-vf", ",".join(result_draw),
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            str(result_path)
        ]
        subprocess.run(result_cmd, capture_output=True, text=True, timeout=60)
        clips_to_concat.append(result_path)
        temp_files.append(result_path)

        # --- 5. KLİPLERİ BİRLEŞTİR ---
        concat_list_path = output_path.with_suffix(".concat.txt")
        with open(concat_list_path, "w") as f:
            for clip in clips_to_concat:
                f.write(f"file '{clip}'\n")
        temp_files.append(concat_list_path)
        
        concat_video_path = output_path.with_suffix(".concat.mp4")
        concat_cmd = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0",
            "-i", str(concat_list_path),
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            str(concat_video_path)
        ]
        subprocess.run(concat_cmd, capture_output=True, text=True, timeout=120)
        temp_files.append(concat_video_path)

        # --- 6. SES EKLE ---
        if final_audio and final_audio.exists():
            merge_cmd = [
                "ffmpeg", "-y",
                "-i", str(concat_video_path),
                "-i", str(final_audio),
                "-filter_complex", f"[1:a]adelay={int(intro_seconds*1000)}|{int(intro_seconds*1000)}[a]",
                "-map", "0:v:0", "-map", "[a]",
                "-c:v", "copy", "-c:a", "aac",
                "-shortest",
                str(output_path)
            ]
            subprocess.run(merge_cmd, capture_output=True, text=True, timeout=120)
        else:
            import shutil
            shutil.copy(concat_video_path, output_path)

        # --- Cleanup ---
        for f in temp_files:
            try:
                Path(f).unlink(missing_ok=True)
            except:
                pass
        if img_path:
            try:
                img_path.unlink(missing_ok=True)
            except:
                pass

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
        version="2.2.0"
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
    
    # Debug log
    log(f"📋 Soru: {request.question_text[:100]}...")
    log(f"🖼️ Görsel URL: {request.question_image_url or 'YOK'}")
    log(f"📚 Konu: {request.topic_name}, Ders: {request.subject_name}, Sınıf: {request.grade}")
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # 1. Gemini ile çözüm üret
            solution = await generate_solution_with_gemini(request)
            log(f"📝 Gemini adımlar: {len(solution.get('steps', []))}")
            
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
