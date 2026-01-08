"""
Teknokul Smart Renderer - Akıllı Animasyon Sistemi
Soru içeriğine göre otomatik animasyon seçimi
"""

import re
from typing import List, Tuple

# Animasyon tipleri ve anahtar kelimeleri
ANIMATION_PATTERNS = {
    # Matematik - Denklem/Formül
    'mathtex': {
        'keywords': ['denklem', 'eşitlik', 'formül', 'x=', 'y=', 'f(x)', '=', '+', '-', '×', '÷', 'kare', 'küp', 'üs', 'kök', 'karekök'],
        'patterns': [r'\d+\s*[+\-×÷=]\s*\d+', r'[xyz]\s*[=+\-]', r'\d+x', r'x\^?\d*']
    },
    # Matematik - Geometri
    'geometri': {
        'keywords': ['üçgen', 'kare', 'dikdörtgen', 'daire', 'çember', 'alan', 'çevre', 'açı', 'derece', 'kenar', 'köşe', 'yarıçap', 'çap', 'paralel', 'dik', 'eşkenar', 'ikizkenar'],
        'patterns': [r'\d+\s*cm', r'\d+\s*m²', r'\d+°']
    },
    # Matematik - Grafik/Fonksiyon
    'grafik': {
        'keywords': ['grafik', 'fonksiyon', 'koordinat', 'eksen', 'x ekseni', 'y ekseni', 'doğru', 'eğri', 'parabol', 'lineer', 'noktası'],
        'patterns': [r'f\(x\)', r'y\s*=', r'\(\d+,\s*\d+\)']
    },
    # Matematik - İstatistik
    'istatistik': {
        'keywords': ['ortalama', 'medyan', 'mod', 'standart sapma', 'veri', 'frekans', 'olasılık', 'yüzde', '%', 'oran', 'tablo', 'grafik'],
        'patterns': [r'\d+%', r'\d+/\d+']
    },
    # Fizik - Hareket
    'hareket': {
        'keywords': ['hız', 'ivme', 'yol', 'zaman', 'hareket', 'düşme', 'fırlatma', 'mesafe', 'sürat', 'm/s', 'km/h'],
        'patterns': [r'\d+\s*m/s', r'\d+\s*km/h', r'\d+\s*saniye']
    },
    # Fizik - Kuvvet
    'kuvvet': {
        'keywords': ['kuvvet', 'newton', 'kütle', 'ağırlık', 'sürtünme', 'itme', 'çekme', 'denge', 'moment'],
        'patterns': [r'\d+\s*N', r'\d+\s*kg']
    },
    # Fizik - Elektrik
    'elektrik': {
        'keywords': ['elektrik', 'akım', 'gerilim', 'direnç', 'volt', 'amper', 'ohm', 'devre', 'pil', 'ampul', 'seri', 'paralel'],
        'patterns': [r'\d+\s*V', r'\d+\s*A', r'\d+\s*Ω']
    },
    # Kimya - Molekül
    'molekul': {
        'keywords': ['atom', 'molekül', 'element', 'bileşik', 'proton', 'nötron', 'elektron', 'periyodik', 'H2O', 'CO2', 'NaCl'],
        'patterns': [r'[A-Z][a-z]?\d*', r'H₂O', r'CO₂']
    },
    # Kimya - Reaksiyon
    'reaksiyon': {
        'keywords': ['reaksiyon', 'tepkime', 'yanma', 'çözünme', 'asit', 'baz', 'nötr', 'pH', 'mol', 'kütle'],
        'patterns': [r'→', r'\+\s*[A-Z]']
    },
    # Biyoloji - Hücre
    'hucre': {
        'keywords': ['hücre', 'çekirdek', 'mitokondri', 'ribozom', 'golgi', 'sitoplazma', 'zar', 'organel', 'bitki hücresi', 'hayvan hücresi'],
        'patterns': []
    },
    # Biyoloji - DNA
    'dna': {
        'keywords': ['DNA', 'RNA', 'gen', 'kromozom', 'kalıtım', 'protein', 'amino asit', 'replikasyon', 'mutasyon'],
        'patterns': []
    },
    # Sayı/Hesaplama
    'hesaplama': {
        'keywords': ['hesapla', 'bul', 'kaç', 'toplam', 'fark', 'çarpım', 'bölüm'],
        'patterns': [r'\d+\s*[+\-×÷]\s*\d+']
    }
}


def detect_animations(text: str) -> List[str]:
    """
    Metin içeriğine göre uygun animasyon tiplerini tespit et
    """
    text_lower = text.lower()
    detected = []
    scores = {}
    
    for anim_type, config in ANIMATION_PATTERNS.items():
        score = 0
        
        # Anahtar kelime kontrolü
        for keyword in config['keywords']:
            if keyword.lower() in text_lower:
                score += 2
        
        # Pattern kontrolü
        for pattern in config['patterns']:
            if re.search(pattern, text, re.IGNORECASE):
                score += 3
        
        if score > 0:
            scores[anim_type] = score
    
    # En yüksek skorlu animasyonları seç (max 3)
    sorted_anims = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    detected = [anim for anim, score in sorted_anims[:3] if score >= 2]
    
    # Hiç tespit edilmediyse varsayılan
    if not detected:
        detected = ['hesaplama']
    
    return detected


def extract_math_expressions(text: str) -> List[str]:
    """
    Metinden matematiksel ifadeleri çıkar
    """
    expressions = []
    
    # Basit denklemler: x = 5, y = 2x + 3
    eq_pattern = r'[xyz]\s*=\s*[\d\w\+\-\*\/\s]+'
    expressions.extend(re.findall(eq_pattern, text))
    
    # Sayısal işlemler: 5 + 3, 10 × 2
    op_pattern = r'\d+\s*[+\-×÷=]\s*\d+'
    expressions.extend(re.findall(op_pattern, text))
    
    # Kesirler: 3/4, 1/2
    frac_pattern = r'\d+/\d+'
    expressions.extend(re.findall(frac_pattern, text))
    
    return expressions[:5]  # Max 5 expression


def extract_numbers(text: str) -> List[Tuple[float, str]]:
    """
    Metinden sayıları ve birimlerini çıkar
    """
    numbers = []
    
    # Birimli sayılar
    patterns = [
        (r'(\d+(?:\.\d+)?)\s*(cm|m|km|mm)', 'uzunluk'),
        (r'(\d+(?:\.\d+)?)\s*(m²|cm²|km²)', 'alan'),
        (r'(\d+(?:\.\d+)?)\s*(m/s|km/h)', 'hız'),
        (r'(\d+(?:\.\d+)?)\s*(kg|g|mg)', 'kütle'),
        (r'(\d+(?:\.\d+)?)\s*(N)', 'kuvvet'),
        (r'(\d+(?:\.\d+)?)\s*(V|A|Ω)', 'elektrik'),
        (r'(\d+(?:\.\d+)?)\s*°', 'açı'),
        (r'(\d+(?:\.\d+)?)\s*%', 'yüzde'),
    ]
    
    for pattern, unit_type in patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            numbers.append((float(match[0]), unit_type))
    
    return numbers[:10]


def generate_animation_code(anim_type: str, content: str, step_num: int, color: str = "YELLOW") -> str:
    """
    Animasyon tipine göre Manim kodu üret
    """
    
    if anim_type == 'mathtex':
        # Matematiksel ifade için MathTex
        expressions = extract_math_expressions(content)
        if expressions:
            expr = expressions[0].replace('×', '\\\\times').replace('÷', '\\\\div')
            return f'''
        # MathTex Animasyonu
        math_expr = MathTex(r"{expr}", font_size=48, color={color})
        math_expr.move_to(UP * 3)
        math_box = SurroundingRectangle(math_expr, color=ORANGE, buff=0.3, corner_radius=0.1)
        self.play(Write(math_expr), Create(math_box), run_time=0.8)
'''
        else:
            return ''
    
    elif anim_type == 'geometri':
        # Geometrik şekil
        shapes = {
            'üçgen': 'Triangle(color=ORANGE, fill_opacity=0.5).scale(1.5)',
            'kare': 'Square(side_length=2, color=BLUE, fill_opacity=0.5)',
            'dikdörtgen': 'Rectangle(width=3, height=2, color=GREEN, fill_opacity=0.5)',
            'daire': 'Circle(radius=1.2, color=PURPLE, fill_opacity=0.5)',
            'çember': 'Circle(radius=1.2, color=CYAN, fill_opacity=0.3, stroke_width=4)',
        }
        
        content_lower = content.lower()
        shape_code = None
        for shape_name, code in shapes.items():
            if shape_name in content_lower:
                shape_code = code
                break
        
        if not shape_code:
            shape_code = 'RegularPolygon(n=6, color=PURPLE, fill_opacity=0.5).scale(1.2)'
        
        return f'''
        # Geometri Animasyonu
        geo_shape = {shape_code}
        geo_shape.move_to(UP * 3)
        self.play(DrawBorderThenFill(geo_shape), run_time=0.6)
        
        # Ölçü gösterimi
        if hasattr(geo_shape, 'get_vertices'):
            brace = Brace(geo_shape, DOWN, color=YELLOW)
            self.play(FadeIn(brace), run_time=0.3)
'''
    
    elif anim_type == 'grafik':
        return f'''
        # Grafik/Koordinat Animasyonu
        axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[-2, 4, 1],
            x_length=5,
            y_length=4,
            axis_config={{"color": BLUE, "stroke_width": 2}},
        ).scale(0.6).move_to(UP * 3)
        
        # Örnek fonksiyon grafiği
        graph = axes.plot(lambda x: 0.5 * x**2, color=ORANGE, stroke_width=3)
        
        self.play(Create(axes), run_time=0.5)
        self.play(Create(graph), run_time=0.6)
'''
    
    elif anim_type == 'istatistik':
        return f'''
        # İstatistik/Bar Grafik Animasyonu
        bars = VGroup(*[
            Rectangle(width=0.6, height=h, fill_color=c, fill_opacity=0.8, stroke_width=0)
            .move_to(RIGHT * (i - 1.5) * 1 + UP * (h/2 + 2))
            for i, (h, c) in enumerate([(1.5, BLUE), (2.5, GREEN), (2, ORANGE), (1.8, PURPLE)])
        ])
        
        self.play(
            LaggedStart(*[GrowFromEdge(b, DOWN) for b in bars], lag_ratio=0.15),
            run_time=0.8
        )
'''
    
    elif anim_type == 'hareket':
        return f'''
        # Hareket Animasyonu
        ball = Circle(radius=0.3, color=ORANGE, fill_opacity=1)
        ball.move_to(LEFT * 3 + UP * 3)
        
        # Yörünge çizgisi
        path = TracedPath(ball.get_center, stroke_color=YELLOW, stroke_width=2)
        self.add(path)
        
        # Hız vektörü
        velocity = Arrow(ball.get_center(), ball.get_center() + RIGHT * 1.5, color=GREEN, stroke_width=3)
        v_label = MathTex(r"\\\\vec{{v}}", font_size=28, color=GREEN).next_to(velocity, UP, buff=0.1)
        
        self.play(GrowFromCenter(ball), run_time=0.3)
        self.play(GrowArrow(velocity), FadeIn(v_label), run_time=0.3)
        self.play(
            ball.animate.move_to(RIGHT * 2 + UP * 3),
            velocity.animate.shift(RIGHT * 5),
            v_label.animate.shift(RIGHT * 5),
            run_time=1.0
        )
'''
    
    elif anim_type == 'kuvvet':
        return f'''
        # Kuvvet Vektör Animasyonu
        block = Square(side_length=1, color=BLUE, fill_opacity=0.7)
        block.move_to(UP * 3)
        
        # Kuvvet okları
        f_right = Arrow(block.get_right(), block.get_right() + RIGHT * 1.5, color=RED, stroke_width=4)
        f_down = Arrow(block.get_bottom(), block.get_bottom() + DOWN * 1, color=GREEN, stroke_width=4)
        
        f_label = MathTex(r"\\\\vec{{F}}", font_size=28, color=RED).next_to(f_right, UP, buff=0.1)
        g_label = MathTex(r"\\\\vec{{G}}", font_size=28, color=GREEN).next_to(f_down, RIGHT, buff=0.1)
        
        self.play(DrawBorderThenFill(block), run_time=0.3)
        self.play(GrowArrow(f_right), GrowArrow(f_down), run_time=0.4)
        self.play(FadeIn(f_label), FadeIn(g_label), run_time=0.3)
'''
    
    elif anim_type == 'elektrik':
        return f'''
        # Elektrik Devre Animasyonu
        # Basit devre
        wire = VGroup(
            Line(LEFT * 2 + UP * 4, LEFT * 2 + UP * 2.5, color=CYAN, stroke_width=3),
            Line(LEFT * 2 + UP * 2.5, RIGHT * 2 + UP * 2.5, color=CYAN, stroke_width=3),
            Line(RIGHT * 2 + UP * 2.5, RIGHT * 2 + UP * 4, color=CYAN, stroke_width=3),
            Line(RIGHT * 2 + UP * 4, LEFT * 2 + UP * 4, color=CYAN, stroke_width=3),
        )
        
        # Ampul
        bulb = Circle(radius=0.3, color=YELLOW, fill_opacity=0.3, stroke_width=3)
        bulb.move_to(UP * 2.5)
        
        # Akım okları
        current = VGroup(*[
            Arrow(LEFT * (1.5 - i*1) + UP * 4, LEFT * (0.5 - i*1) + UP * 4, color=GREEN, stroke_width=2, buff=0)
            for i in range(3)
        ])
        
        self.play(Create(wire), run_time=0.5)
        self.play(GrowFromCenter(bulb), run_time=0.3)
        self.play(
            LaggedStart(*[GrowArrow(a) for a in current], lag_ratio=0.1),
            bulb.animate.set_fill(YELLOW, opacity=0.9),
            run_time=0.5
        )
'''
    
    elif anim_type == 'molekul':
        return f'''
        # Molekül Animasyonu (H2O örneği)
        oxygen = Circle(radius=0.5, color=RED, fill_opacity=0.9, stroke_width=0)
        oxygen.move_to(UP * 3)
        o_label = Text("O", font_size=24, color=WHITE, weight=BOLD).move_to(oxygen.get_center())
        
        hydrogen1 = Circle(radius=0.35, color=BLUE, fill_opacity=0.9, stroke_width=0)
        hydrogen1.move_to(UP * 3 + LEFT * 1 + DOWN * 0.7)
        h1_label = Text("H", font_size=20, color=WHITE, weight=BOLD).move_to(hydrogen1.get_center())
        
        hydrogen2 = Circle(radius=0.35, color=BLUE, fill_opacity=0.9, stroke_width=0)
        hydrogen2.move_to(UP * 3 + RIGHT * 1 + DOWN * 0.7)
        h2_label = Text("H", font_size=20, color=WHITE, weight=BOLD).move_to(hydrogen2.get_center())
        
        bond1 = Line(oxygen.get_center(), hydrogen1.get_center(), color=WHITE, stroke_width=3)
        bond2 = Line(oxygen.get_center(), hydrogen2.get_center(), color=WHITE, stroke_width=3)
        
        self.play(GrowFromCenter(oxygen), FadeIn(o_label), run_time=0.3)
        self.play(Create(bond1), Create(bond2), run_time=0.3)
        self.play(
            GrowFromCenter(hydrogen1), GrowFromCenter(hydrogen2),
            FadeIn(h1_label), FadeIn(h2_label),
            run_time=0.4
        )
'''
    
    elif anim_type == 'hucre':
        return f'''
        # Hücre Animasyonu
        # Hücre zarı
        cell = Ellipse(width=4, height=3, color=GREEN, stroke_width=4, fill_opacity=0.1)
        cell.move_to(UP * 3)
        
        # Çekirdek
        nucleus = Circle(radius=0.6, color=PURPLE, fill_opacity=0.7, stroke_width=2)
        nucleus.move_to(cell.get_center())
        n_label = Text("Çekirdek", font_size=14, color=WHITE).move_to(nucleus.get_center())
        
        # Organeller
        organelles = VGroup(*[
            Circle(radius=0.2, color=c, fill_opacity=0.8, stroke_width=0).move_to(
                cell.get_center() + RIGHT * x + UP * y
            )
            for x, y, c in [(1.2, 0.5, ORANGE), (-1, 0.7, BLUE), (0.8, -0.5, CYAN)]
        ])
        
        self.play(Create(cell), run_time=0.4)
        self.play(GrowFromCenter(nucleus), FadeIn(n_label), run_time=0.3)
        self.play(LaggedStart(*[GrowFromCenter(o) for o in organelles], lag_ratio=0.1), run_time=0.4)
'''
    
    elif anim_type == 'dna':
        return f'''
        # DNA Sarmalı Animasyonu
        dna_points = VGroup()
        for i in range(8):
            # Sol ve sağ noktalar
            left = Circle(radius=0.15, color=BLUE, fill_opacity=0.9, stroke_width=0)
            left.move_to(LEFT * 0.8 + UP * (4 - i * 0.5))
            right = Circle(radius=0.15, color=RED, fill_opacity=0.9, stroke_width=0)
            right.move_to(RIGHT * 0.8 + UP * (4 - i * 0.5))
            # Bağ
            bond = Line(left.get_center(), right.get_center(), color=GREEN, stroke_width=2)
            dna_points.add(bond, left, right)
        
        self.play(
            LaggedStart(*[FadeIn(p, scale=0.5) for p in dna_points], lag_ratio=0.05),
            run_time=1.0
        )
'''
    
    else:  # hesaplama veya default
        return f'''
        # Hesaplama Animasyonu
        calc_icon = VGroup(
            RoundedRectangle(width=1.5, height=2, corner_radius=0.1, color=BLUE, fill_opacity=0.8),
            *[Line(LEFT * 0.4, RIGHT * 0.4, color=WHITE, stroke_width=2).shift(UP * (0.5 - i * 0.3)) for i in range(4)]
        ).scale(0.8).move_to(UP * 3.5)
        
        self.play(DrawBorderThenFill(calc_icon), run_time=0.4)
'''


def generate_smart_script(scenario: dict, question: dict, durations: dict) -> str:
    """
    Akıllı Manim script üret - içeriğe göre animasyon seç
    """
    
    video_data = scenario.get("video_senaryosu", {})
    hook = video_data.get("hook_cumlesi", "Soruyu çözelim!")
    adimlar = video_data.get("adimlar", [])[:6]
    kapanis = video_data.get("kapanis_cumlesi", "Teknokul'da kalın!")
    
    hook_dur = durations.get("hook", 3.0)
    step_durs = durations.get("steps", [3.0] * len(adimlar))
    kapanis_dur = durations.get("kapanis", 3.0)
    
    subject = question.get("subject_name", "Matematik")
    topic = question.get("topic_name", "Genel")
    question_text = question.get("question_text", "")
    
    # Tüm içeriği birleştir ve animasyonları tespit et
    all_content = f"{question_text} {hook} " + " ".join([a.get("ekranda_gosterilecek_metin", "") + " " + a.get("tts_metni", "") for a in adimlar])
    detected_anims = detect_animations(all_content)
    
    def escape(s):
        return str(s).replace('\\', '\\\\').replace('"', '\\"').replace("'", "\\'").replace('\n', ' ')
    
    # Ders rengini belirle
    subject_colors = {
        'matematik': 'PURPLE', 'fizik': 'BLUE', 'kimya': 'GREEN',
        'biyoloji': 'PINK', 'türkçe': 'ORANGE', 'tarih': 'YELLOW'
    }
    subject_color = subject_colors.get(subject.lower(), 'PURPLE')
    
    script = f'''
from manim import *
import numpy as np

config.frame_width = 9
config.frame_height = 16
config.pixel_width = 1080
config.pixel_height = 1920
config.frame_rate = 30
config.background_color = "#1a1a2e"

PURPLE = "#8B5CF6"
ORANGE = "#F97316"
GREEN = "#22C55E"
BLUE = "#3B82F6"
YELLOW = "#EAB308"
RED = "#EF4444"
CYAN = "#06B6D4"
PINK = "#EC4899"
DARK_BG = "#16213e"

Text.set_default(font="Noto Sans")

class VideoScene(Scene):
    def construct(self):
        # Logo
        logo = Text("teknokul.com.tr", font_size=24, color=PURPLE)
        logo.to_edge(DOWN, buff=0.3)
        self.add(logo)
        
        # ===== HOOK =====
        # Ders badge
        badge = VGroup(
            RoundedRectangle(width=3.5, height=0.8, corner_radius=0.2, fill_color={subject_color}, fill_opacity=1, stroke_width=0),
            Text("{escape(subject.upper())}", font_size=22, color=WHITE, weight=BOLD)
        )
        badge[1].move_to(badge[0].get_center())
        badge.to_edge(UP, buff=0.5)
        
        hook_text = Text("{escape(hook)}", font_size=32, color=WHITE, weight=BOLD)
        hook_text.move_to(DOWN * 4)
        if hook_text.width > 8:
            hook_text.scale_to_fit_width(8)
        
        self.play(FadeIn(badge, shift=DOWN), run_time=0.3)
        
        # Hook animasyonu - tespit edilen ilk animasyon tipine göre
'''
    
    # Hook için animasyon ekle
    if detected_anims:
        hook_anim_code = generate_animation_code(detected_anims[0], all_content, 0, subject_color)
        script += hook_anim_code
    
    script += f'''
        self.play(Write(hook_text), run_time=0.5)
        self.wait({max(0.3, hook_dur - 1.5)})
        
        # Hook temizle
        self.play(
            *[FadeOut(mob) for mob in self.mobjects if mob != logo],
            run_time=0.4
        )
        self.add(logo)  # Logo'yu geri ekle
        badge.scale(0.7).to_corner(UL, buff=0.3)
        self.add(badge)
'''
    
    # Her adım için
    for i, adim in enumerate(adimlar):
        display = escape(adim.get("ekranda_gosterilecek_metin", f"Adım {i+1}"))
        tts = adim.get("tts_metni", "")
        color_name = adim.get("vurgu_rengi", "WHITE")
        dur = step_durs[i] if i < len(step_durs) else 3.0
        
        color_map = {"YELLOW": "YELLOW", "GREEN": "GREEN", "BLUE": "BLUE", "RED": "RED", "WHITE": "WHITE", "ORANGE": "ORANGE", "CYAN": "CYAN", "PINK": "PINK"}
        color = color_map.get(color_name.upper(), "WHITE")
        
        # Bu adım için animasyon tespit et
        step_content = f"{display} {tts}"
        step_anims = detect_animations(step_content)
        
        script += f'''
        # ===== ADIM {i+1} =====
        step_num = VGroup(
            Circle(radius=0.45, color={subject_color}, fill_opacity=1, stroke_width=0),
            Text("{i+1}", font_size=36, color=WHITE, weight=BOLD)
        )
        step_num[1].move_to(step_num[0].get_center())
        step_num.to_edge(UP, buff=1)
        
        step_label = Text("ADIM {i+1}", font_size=18, color={subject_color})
        step_label.next_to(step_num, RIGHT, buff=0.3)
        
        self.play(FadeIn(step_num, scale=0.5), FadeIn(step_label), run_time=0.3)
'''
        
        # Adım animasyonu ekle
        if step_anims:
            step_anim_code = generate_animation_code(step_anims[0], step_content, i+1, color)
            script += step_anim_code
        
        script += f'''
        # İçerik kutusu
        content_box = RoundedRectangle(
            width=8, height=4, corner_radius=0.3,
            fill_color=DARK_BG, fill_opacity=0.95,
            stroke_color={color}, stroke_width=3
        )
        content_box.move_to(DOWN * 1.5)
        
        content = Text("{display}", font_size=30, color={color}, weight=BOLD)
        content.move_to(content_box.get_center())
        if content.width > 7:
            content.scale_to_fit_width(7)
        if content.height > 3.5:
            content.scale_to_fit_height(3.5)
        
        self.play(GrowFromCenter(content_box), run_time=0.3)
        self.play(Write(content), run_time=0.6)
        self.wait({max(0.3, dur - 2.0)})
        
        # Adım temizle
        self.play(
            *[FadeOut(mob) for mob in self.mobjects if mob not in [logo, badge]],
            run_time=0.4
        )
        self.add(logo, badge)
'''
    
    # Kapanış
    script += f'''
        # ===== KAPANIŞ =====
        result_banner = RoundedRectangle(
            width=7, height=1.5, corner_radius=0.3,
            fill_color=GREEN, fill_opacity=1, stroke_width=0
        )
        result_banner.move_to(UP * 2)
        
        result_text = Text("SONUÇ", font_size=44, color=WHITE, weight=BOLD)
        result_text.move_to(result_banner.get_center())
        
        # Büyük checkmark
        check = Text("✓", font_size=80, color=GREEN)
        check.move_to(DOWN * 0.5)
        
        big_logo = Text("Teknokul", font_size=64, color=ORANGE, weight=BOLD)
        big_logo.move_to(DOWN * 3)
        
        slogan = Text("Eğitimin Dijital Üssü", font_size=26, color=WHITE)
        slogan.next_to(big_logo, DOWN, buff=0.4)
        
        self.play(GrowFromCenter(result_banner), Write(result_text), run_time=0.4)
        self.play(FadeIn(check, scale=1.5), run_time=0.4)
        self.play(FadeIn(big_logo, scale=1.1), FadeIn(slogan), run_time=0.5)
        self.wait({max(0.5, kapanis_dur - 1.3)})
'''
    
    return script
