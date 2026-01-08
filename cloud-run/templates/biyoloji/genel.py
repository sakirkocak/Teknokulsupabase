"""
Biyoloji - Genel Template
Hücre, DNA, organ sistemleri animasyonları
"""

def generate_biyoloji_genel_script(scenario: dict, question: dict, durations: dict) -> str:
    """
    Biyoloji soruları için Manim script
    - Hücre modeli
    - DNA sarmalı
    - Organ şemaları
    """
    
    video_data = scenario.get("video_senaryosu", {})
    hook = video_data.get("hook_cumlesi", "Biyoloji sorusunu çözelim!")
    adimlar = video_data.get("adimlar", [])[:6]
    kapanis = video_data.get("kapanis_cumlesi", "Teknokul'da kalın!")
    
    hook_dur = durations.get("hook", 3.0)
    step_durs = durations.get("steps", [3.0] * len(adimlar))
    kapanis_dur = durations.get("kapanis", 3.0)
    
    def escape(s):
        return str(s).replace('\\', '\\\\').replace('"', '\\"').replace("'", "\\'").replace('\n', ' ')
    
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
        logo = Text("teknokul.com.tr", font_size=24, color=PURPLE)
        logo.to_edge(DOWN, buff=0.3)
        self.add(logo)
        
        # ===== HOOK - Biyoloji Tema =====
        badge = VGroup(
            RoundedRectangle(width=3.5, height=0.8, corner_radius=0.2, fill_color=PINK, fill_opacity=1, stroke_width=0),
            Text("BİYOLOJİ", font_size=24, color=WHITE, weight=BOLD)
        )
        badge[1].move_to(badge[0].get_center())
        badge.to_edge(UP, buff=0.5)
        
        # Basit hücre modeli
        cell_membrane = Ellipse(width=4, height=3, color=GREEN, stroke_width=4, fill_opacity=0.1)
        cell_membrane.move_to(UP * 2.5)
        
        # Çekirdek
        nucleus = Circle(radius=0.6, color=PURPLE, fill_opacity=0.7, stroke_width=2)
        nucleus.move_to(cell_membrane.get_center())
        
        # Organeller (basit noktalar)
        organelles = VGroup(*[
            Circle(radius=0.2, color=c, fill_opacity=0.8, stroke_width=0).move_to(
                cell_membrane.get_center() + RIGHT * x + UP * y
            )
            for x, y, c in [
                (1.2, 0.5, ORANGE), (-1, 0.8, BLUE), (0.8, -0.6, CYAN),
                (-0.8, -0.5, YELLOW), (1.3, -0.2, RED)
            ]
        ])
        
        hook_text = Text("{escape(hook)}", font_size=34, color=WHITE, weight=BOLD)
        hook_text.move_to(DOWN * 3)
        if hook_text.width > 8:
            hook_text.scale_to_fit_width(8)
        
        self.play(FadeIn(badge, shift=DOWN), run_time=0.3)
        self.play(Create(cell_membrane), run_time=0.5)
        self.play(GrowFromCenter(nucleus), run_time=0.3)
        self.play(
            LaggedStart(*[GrowFromCenter(o) for o in organelles], lag_ratio=0.1),
            run_time=0.5
        )
        self.play(Write(hook_text), run_time=0.5)
        self.wait({max(0.3, hook_dur - 2.4)})
        self.play(
            FadeOut(cell_membrane, nucleus, organelles, hook_text),
            badge.animate.scale(0.7).to_corner(UL, buff=0.3),
            run_time=0.5
        )
'''

    for i, adim in enumerate(adimlar):
        display = escape(adim.get("ekranda_gosterilecek_metin", f"Adım {i+1}"))
        color_name = adim.get("vurgu_rengi", "WHITE")
        dur = step_durs[i] if i < len(step_durs) else 3.0
        
        color_map = {"YELLOW": "YELLOW", "GREEN": "GREEN", "BLUE": "BLUE", "RED": "RED", "WHITE": "WHITE", "PINK": "PINK"}
        color = color_map.get(color_name.upper(), "WHITE")
        
        script += f'''
        # ===== ADIM {i+1} =====
        step_num = VGroup(
            Circle(radius=0.4, color=PINK, fill_opacity=1, stroke_width=0),
            Text("{i+1}", font_size=32, color=WHITE, weight=BOLD)
        )
        step_num[1].move_to(step_num[0].get_center())
        step_num.to_edge(UP, buff=1)
        
        # DNA ikonu (basit sarmal)
        dna = VGroup(
            *[Circle(radius=0.15, color=BLUE if j % 2 == 0 else RED, fill_opacity=0.8, stroke_width=0).move_to(
                UP * (3.5 - j * 0.3) + RIGHT * (0.3 * np.sin(j * 0.8))
            ) for j in range(6)],
            *[Line(
                UP * (3.5 - j * 0.3) + RIGHT * (0.3 * np.sin(j * 0.8)),
                UP * (3.5 - j * 0.3) + RIGHT * (-0.3 * np.sin(j * 0.8)),
                color=GREEN, stroke_width=2
            ) for j in range(6)]
        )
        
        content_box = RoundedRectangle(
            width=8, height=4.5, corner_radius=0.3,
            fill_color=DARK_BG, fill_opacity=0.95,
            stroke_color={color}, stroke_width=3
        )
        content_box.move_to(DOWN * 1)
        
        content = Text("{display}", font_size=32, color={color}, weight=BOLD)
        content.move_to(content_box.get_center())
        if content.width > 7:
            content.scale_to_fit_width(7)
        
        self.play(
            FadeIn(step_num, scale=0.5),
            LaggedStart(*[FadeIn(d, scale=0.5) for d in dna], lag_ratio=0.05),
            run_time=0.5
        )
        self.play(GrowFromCenter(content_box), run_time=0.3)
        self.play(Write(content), run_time=0.6)
        self.wait({max(0.3, dur - 1.9)})
        self.play(FadeOut(step_num, dna, content_box, content), run_time=0.5)
'''

    script += f'''
        # ===== KAPANIŞ =====
        # Kalp ikonu (sağlık/yaşam sembolü)
        heart = VGroup(
            Circle(radius=0.5, color=RED, fill_opacity=1, stroke_width=0).shift(LEFT * 0.35 + UP * 0.2),
            Circle(radius=0.5, color=RED, fill_opacity=1, stroke_width=0).shift(RIGHT * 0.35 + UP * 0.2),
            Polygon([0, -0.8, 0], [-0.85, 0.2, 0], [0.85, 0.2, 0], fill_color=RED, fill_opacity=1, stroke_width=0),
        ).scale(1.2).move_to(UP * 2)
        
        result_text = Text("YAŞAM BİLİMİ!", font_size=40, color=GREEN, weight=BOLD)
        result_text.move_to(DOWN * 0.5)
        
        big_logo = Text("Teknokul", font_size=60, color=ORANGE, weight=BOLD)
        big_logo.move_to(DOWN * 3)
        
        slogan = Text("Biyolojiyi Canlandırır", font_size=24, color=WHITE)
        slogan.next_to(big_logo, DOWN, buff=0.3)
        
        self.play(DrawBorderThenFill(heart), run_time=0.5)
        self.play(
            heart.animate.scale(1.1),
            rate_func=there_and_back,
            run_time=0.3
        )
        self.play(FadeIn(result_text, scale=1.3), run_time=0.4)
        self.play(FadeIn(big_logo), FadeIn(slogan), run_time=0.5)
        self.wait({max(0.5, kapanis_dur - 1.7)})
'''
    
    return script
