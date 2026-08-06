#!/usr/bin/env python3
"""
Teknokul Video Çözüm Generator v2
Ses-Görüntü Senkronizasyonlu Manim Video Üretimi

Pipeline:
1. Gemini → Çözüm adımları (JSON)
2. ElevenLabs → Her adım için ses (.mp3)
3. Manim → Animasyon (ses süresiyle senkronize)
4. FFmpeg → Final birleştirme
"""

import json
import os
import sys
import subprocess
import tempfile
import requests
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional
import io

# Ses süresi ölçümü için
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    print("⚠️ pydub yüklü değil. pip install pydub")

# Manim import
try:
    from manim import *
    MANIM_AVAILABLE = True
except ImportError:
    MANIM_AVAILABLE = False
    print("⚠️ manim yüklü değil. pip install manim")


@dataclass
class SolutionStep:
    """Bir çözüm adımı"""
    order: int
    text: str           # Seslendirme metni
    math: str = ""      # LaTeX matematiksel ifade
    duration: float = 0 # Ses süresi (saniye)
    audio_path: str = "" # Ses dosyası yolu


@dataclass
class QuestionData:
    """Soru verisi"""
    id: str
    question_text: str
    options: dict
    correct_answer: str
    explanation: str
    grade: int = 8  # Sınıf seviyesi (ses seçimi için)
    subject: str = "matematik"


class ElevenLabsVoice:
    """ElevenLabs ses üretici"""
    
    # Seviyeye göre ses ID'leri
    VOICES = {
        # İlkokul (1-4) - Yumuşak ve neşeli
        "primary": {
            "female": "EXAVITQu4vr4xnSDxMaL",  # Rachel - soft
            "male": "pNInz6obpgDQGcFmaJgB",    # Adam
        },
        # Ortaokul (5-8) - Dengeli
        "middle": {
            "female": "21m00Tcm4TlvDq8ikWAM",  # Rachel natural
            "male": "JBFqnCBsd6RMkjVDRZzb",    # Turkish default
        },
        # Lise (9-12) - Ciddi ve akademik
        "high": {
            "female": "21m00Tcm4TlvDq8ikWAM",
            "male": "JBFqnCBsd6RMkjVDRZzb",
        }
    }
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.elevenlabs.io/v1"
    
    def get_voice_id(self, grade: int, gender: str = "female") -> str:
        """Sınıf seviyesine göre ses ID'si döndür"""
        if grade <= 4:
            level = "primary"
        elif grade <= 8:
            level = "middle"
        else:
            level = "high"
        
        return self.VOICES[level].get(gender, self.VOICES["middle"]["female"])
    
    def generate_speech(self, text: str, voice_id: str, output_path: str) -> float:
        """
        Metni sese çevir ve süresini döndür
        
        Returns:
            float: Ses süresi (saniye)
        """
        url = f"{self.base_url}/text-to-speech/{voice_id}"
        
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        data = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True
            }
        }
        
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code != 200:
            raise Exception(f"ElevenLabs hatası: {response.status_code} - {response.text[:200]}")
        
        # Ses dosyasını kaydet
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        # Süreyi ölç
        duration = self.get_audio_duration(output_path)
        
        return duration
    
    @staticmethod
    def get_audio_duration(audio_path: str) -> float:
        """Ses dosyasının süresini saniye olarak döndür"""
        if PYDUB_AVAILABLE:
            audio = AudioSegment.from_mp3(audio_path)
            return len(audio) / 1000.0  # milisaniye -> saniye
        else:
            # Fallback: ffprobe kullan
            try:
                result = subprocess.run([
                    'ffprobe', '-v', 'error', '-show_entries', 
                    'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1',
                    audio_path
                ], capture_output=True, text=True)
                return float(result.stdout.strip())
            except:
                return 5.0  # Varsayılan 5 saniye


class TeknokulVideoGenerator:
    """Ana video üretici sınıf"""
    
    def __init__(self, elevenlabs_api_key: str, output_dir: str = "./output"):
        self.voice_generator = ElevenLabsVoice(elevenlabs_api_key)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir = Path(tempfile.mkdtemp())
    
    def generate_video(self, question: QuestionData, steps: List[SolutionStep]) -> str:
        """
        Tam video üretim pipeline'ı
        
        Returns:
            str: Final video dosya yolu
        """
        print(f"🎬 Video üretimi başlıyor: {question.id}")
        
        # 1. Her adım için ses üret
        print("\n📢 Sesler üretiliyor...")
        voice_id = self.voice_generator.get_voice_id(question.grade)
        
        for i, step in enumerate(steps):
            audio_path = str(self.temp_dir / f"step_{i}.mp3")
            
            print(f"  Adım {i+1}: {step.text[:40]}...")
            duration = self.voice_generator.generate_speech(step.text, voice_id, audio_path)
            
            step.audio_path = audio_path
            step.duration = duration
            print(f"    ✓ Süre: {duration:.2f}s")
        
        # 2. Manim scene oluştur
        print("\n🎨 Manim animasyonu oluşturuluyor...")
        video_path = self._render_manim_scene(question, steps)
        
        # 3. Temizlik
        # self._cleanup()
        
        print(f"\n✅ Video hazır: {video_path}")
        return video_path
    
    def _render_manim_scene(self, question: QuestionData, steps: List[SolutionStep]) -> str:
        """Manim scene'i render et"""
        
        # Dinamik scene kodu oluştur
        scene_code = self._generate_scene_code(question, steps)
        
        # Geçici Python dosyasına yaz
        scene_file = self.temp_dir / "scene.py"
        with open(scene_file, 'w', encoding='utf-8') as f:
            f.write(scene_code)
        
        # Manim çalıştır
        output_file = self.output_dir / f"solution_{question.id}.mp4"
        
        cmd = [
            "manim", "render",
            "-qm",  # Medium quality (720p)
            "--format", "mp4",
            "-o", str(output_file),
            str(scene_file),
            "SolutionScene"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"⚠️ Manim uyarı: {result.stderr[:500]}")
        
        return str(output_file)
    
    def _generate_scene_code(self, question: QuestionData, steps: List[SolutionStep]) -> str:
        """Dinamik Manim scene kodu üret"""
        
        # Adımlar için kod bloğu
        steps_code = ""
        for i, step in enumerate(steps):
            # Ses ekle
            if step.audio_path:
                steps_code += f'''
        # Adım {i+1} - Ses ekle
        self.add_sound("{step.audio_path}")
'''
            
            # Matematiksel ifade varsa
            if step.math:
                steps_code += f'''
        # Adım {i+1} - Matematik
        step{i} = MathTex(r"{step.math}", color=WHITE, font_size=36)
        step{i}.move_to(ORIGIN + DOWN * {0.8 * i})
        self.play(Write(step{i}), run_time=1)
        self.wait({step.duration - 1 if step.duration > 1 else step.duration})
'''
            else:
                # Sadece metin
                safe_text = step.text.replace('"', '\\"').replace('\n', ' ')[:100]
                steps_code += f'''
        # Adım {i+1} - Metin
        step{i} = Text("{safe_text}", font_size=28, color=WHITE)
        step{i}.move_to(ORIGIN + DOWN * {0.8 * i})
        self.play(FadeIn(step{i}), run_time=0.5)
        self.wait({step.duration})
'''
        
        scene_code = f'''
from manim import *

# Teknokul renkleri
TEKNOKUL_BG = "#0a0a1a"
TEKNOKUL_PRIMARY = "#6366f1"
TEKNOKUL_SUCCESS = "#10b981"

class SolutionScene(Scene):
    def construct(self):
        # Arka plan
        self.camera.background_color = TEKNOKUL_BG
        
        # Watermark
        watermark = Text("teknokul.com", font_size=16, color=WHITE, fill_opacity=0.3)
        watermark.to_corner(DR, buff=0.2)
        self.add(watermark)
        
        # Soru başlığı
        question_text = "{question.question_text[:80].replace('"', '\\"')}..."
        title = Text(question_text, font_size=24, color=WHITE)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.5)
        self.wait(0.5)
        
        # Çözüm adımları
        {steps_code}
        
        # Doğru cevap
        answer = Text("Doğru Cevap: {question.correct_answer}", font_size=36, color="{TEKNOKUL_SUCCESS}")
        answer.to_edge(DOWN, buff=1)
        box = SurroundingRectangle(answer, color="{TEKNOKUL_SUCCESS}", buff=0.2)
        self.play(Write(answer), Create(box), run_time=1)
        self.wait(2)
'''
        
        return scene_code
    
    def _cleanup(self):
        """Geçici dosyaları temizle"""
        import shutil
        try:
            shutil.rmtree(self.temp_dir)
        except:
            pass


def generate_video_from_json(
    question_json: dict,
    steps_json: list,
    elevenlabs_api_key: str,
    output_dir: str = "./output"
) -> str:
    """
    JSON verilerinden video üret
    
    Args:
        question_json: Soru verisi
        steps_json: Çözüm adımları
        elevenlabs_api_key: ElevenLabs API anahtarı
        output_dir: Çıktı klasörü
    
    Returns:
        str: Video dosya yolu
    """
    # QuestionData oluştur
    question = QuestionData(
        id=question_json.get("id", "unknown"),
        question_text=question_json.get("question_text", ""),
        options=question_json.get("options", {}),
        correct_answer=question_json.get("correct_answer", ""),
        explanation=question_json.get("explanation", ""),
        grade=question_json.get("grade", 8),
        subject=question_json.get("subject", "matematik")
    )
    
    # SolutionStep listesi oluştur
    steps = [
        SolutionStep(
            order=s.get("order", i+1),
            text=s.get("text", ""),
            math=s.get("math", ""),
            duration=s.get("duration", 5)
        )
        for i, s in enumerate(steps_json)
    ]
    
    # Video üret
    generator = TeknokulVideoGenerator(elevenlabs_api_key, output_dir)
    return generator.generate_video(question, steps)


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":
    import os
    from dotenv import load_dotenv
    
    # .env.local yükle
    env_path = Path(__file__).parent.parent.parent / ".env.local"
    load_dotenv(env_path)
    
    api_key = os.getenv("ELEVENLABS_API_KEY")
    
    if not api_key:
        print("❌ ELEVENLABS_API_KEY bulunamadı!")
        sys.exit(1)
    
    # Test verisi
    test_question = {
        "id": "test-001",
        "question_text": "2x + 5 = 15 denklemini çözünüz.",
        "options": {"A": "3", "B": "5", "C": "7", "D": "10"},
        "correct_answer": "B",
        "explanation": "Her iki taraftan 5 çıkarıp 2'ye böleriz.",
        "grade": 6
    }
    
    test_steps = [
        {
            "order": 1,
            "text": "Önce denklemi inceleyelim. İki x artı beş, on beşe eşit.",
            "math": "2x + 5 = 15"
        },
        {
            "order": 2,
            "text": "Şimdi her iki taraftan beş çıkaralım.",
            "math": "2x = 10"
        },
        {
            "order": 3,
            "text": "Son olarak her iki tarafı ikiye bölelim ve x eşittir beş buluruz.",
            "math": "x = 5"
        }
    ]
    
    print("🎬 Teknokul Video Generator Test")
    print("=" * 50)
    
    if not MANIM_AVAILABLE:
        print("\n⚠️ Manim yüklü değil. Sadece ses testi yapılacak.")
        
        # Ses testi
        voice = ElevenLabsVoice(api_key)
        voice_id = voice.get_voice_id(6)
        
        test_text = "Bu bir test seslendirmesidir. Matematik sorusunu çözeceğiz."
        output_path = "./test_voice.mp3"
        
        duration = voice.generate_speech(test_text, voice_id, output_path)
        print(f"\n✅ Ses üretildi: {output_path}")
        print(f"   Süre: {duration:.2f} saniye")
        
    else:
        result = generate_video_from_json(
            test_question,
            test_steps,
            api_key,
            output_dir="./output"
        )
        print(f"\n✅ Video oluşturuldu: {result}")
