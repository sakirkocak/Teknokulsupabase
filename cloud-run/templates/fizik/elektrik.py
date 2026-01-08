"""
Fizik - Elektrik Template
Devre, akım, gerilim, direnç animasyonları
"""

def generate_elektrik_script(scenario: dict, question: dict, durations: dict) -> str:
    """
    Elektrik soruları için Manim script
    - Devre şeması
    - Akım akışı
    - Ampul/LED yanma efekti
    """
    
    video_data = scenario.get("video_senaryosu", {})
    hook = video_data.get("hook_cumlesi", "Elektrik devresini çözelim!")
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
DARK_BG = "#16213e"

Text.set_default(font="Noto Sans")

class VideoScene(Scene):
    def construct(self):
        logo = Text("teknokul.com.tr", font_size=24, color=PURPLE)
        logo.to_edge(DOWN, buff=0.3)
        self.add(logo)
        
        # ===== HOOK - Elektrik Tema =====
        badge = VGroup(
            RoundedRectangle(width=3.5, height=0.8, corner_radius=0.2, fill_color=YELLOW, fill_opacity=1, stroke_width=0),
            Text("ELEKTRİK", font_size=24, color=BLACK, weight=BOLD)
        )
        badge[1].move_to(badge[0].get_center())
        badge.to_edge(UP, buff=0.5)
        
        # Basit devre şeması
        wire = VGroup(
            Line(LEFT * 2.5 + UP * 2, LEFT * 2.5 + UP * 4, color=CYAN, stroke_width=4),
            Line(LEFT * 2.5 + UP * 4, RIGHT * 2.5 + UP * 4, color=CYAN, stroke_width=4),
            Line(RIGHT * 2.5 + UP * 4, RIGHT * 2.5 + UP * 2, color=CYAN, stroke_width=4),
            Line(RIGHT * 2.5 + UP * 2, LEFT * 2.5 + UP * 2, color=CYAN, stroke_width=4),
        )
        
        # Pil sembolü
        battery = VGroup(
            Line(LEFT * 2.5 + UP * 2.8, LEFT * 2.5 + UP * 3.2, color=RED, stroke_width=6),
            Line(LEFT * 2.3 + UP * 2.6, LEFT * 2.3 + UP * 3.4, color=RED, stroke_width=3),
        )
        
        # Ampul (daire)
        bulb = Circle(radius=0.4, color=YELLOW, fill_opacity=0.3, stroke_width=3)
        bulb.move_to(RIGHT * 2.5 + UP * 3)
        
        # Akım okları
        current_arrows = VGroup(*[
            Arrow(
                start=LEFT * (2 - i * 1.2) + UP * 4,
                end=LEFT * (1 - i * 1.2) + UP * 4,
                color=GREEN, stroke_width=2, buff=0
            )
            for i in range(4)
        ])
        
        hook_text = Text("{escape(hook)}", font_size=34, color=WHITE, weight=BOLD)
        hook_text.move_to(DOWN * 3)
        if hook_text.width > 8:
            hook_text.scale_to_fit_width(8)
        
        self.play(FadeIn(badge, shift=DOWN), run_time=0.3)
        self.play(Create(wire), run_time=0.6)
        self.play(FadeIn(battery), GrowFromCenter(bulb), run_time=0.4)
        self.play(
            LaggedStart(*[GrowArrow(a) for a in current_arrows], lag_ratio=0.1),
            bulb.animate.set_fill(YELLOW, opacity=0.9),
            run_time=0.6
        )
        self.play(Write(hook_text), run_time=0.5)
        self.wait({max(0.3, hook_dur - 2.7)})
        self.play(
            FadeOut(wire, battery, bulb, current_arrows, hook_text),
            badge.animate.scale(0.7).to_corner(UL, buff=0.3),
            run_time=0.5
        )
'''

    for i, adim in enumerate(adimlar):
        display = escape(adim.get("ekranda_gosterilecek_metin", f"Adım {i+1}"))
        color_name = adim.get("vurgu_rengi", "WHITE")
        dur = step_durs[i] if i < len(step_durs) else 3.0
        
        color_map = {"YELLOW": "YELLOW", "GREEN": "GREEN", "BLUE": "BLUE", "RED": "RED", "WHITE": "WHITE", "CYAN": "CYAN"}
        color = color_map.get(color_name.upper(), "WHITE")
        
        script += f'''
        # ===== ADIM {i+1} =====
        step_num = VGroup(
            Circle(radius=0.4, color=YELLOW, fill_opacity=1, stroke_width=0),
            Text("{i+1}", font_size=32, color=BLACK, weight=BOLD)
        )
        step_num[1].move_to(step_num[0].get_center())
        step_num.to_edge(UP, buff=1)
        
        # Şimşek ikonu
        lightning = VGroup(
            Polygon(
                [0, 0.6, 0], [-0.3, 0, 0], [0, 0.1, 0], [-0.2, -0.5, 0],
                [0.3, 0.1, 0], [0, 0, 0], [0.2, 0.6, 0],
                fill_color=YELLOW, fill_opacity=1, stroke_width=0
            )
        ).scale(1.5).move_to(UP * 3.5)
        
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
            DrawBorderThenFill(lightning),
            run_time=0.4
        )
        self.play(GrowFromCenter(content_box), run_time=0.3)
        self.play(Write(content), run_time=0.6)
        self.wait({max(0.3, dur - 1.8)})
        self.play(FadeOut(step_num, lightning, content_box, content), run_time=0.5)
'''

    script += f'''
        # ===== KAPANIŞ =====
        # Parlayan ampul
        final_bulb = Circle(radius=0.8, color=YELLOW, fill_opacity=1, stroke_width=0)
        final_bulb.move_to(UP * 2)
        
        glow = Circle(radius=1.5, color=YELLOW, fill_opacity=0.2, stroke_width=0)
        glow.move_to(final_bulb.get_center())
        
        result_text = Text("DEVRE TAMAM!", font_size=40, color=GREEN, weight=BOLD)
        result_text.move_to(DOWN * 0.5)
        
        big_logo = Text("Teknokul", font_size=60, color=ORANGE, weight=BOLD)
        big_logo.move_to(DOWN * 3)
        
        slogan = Text("Elektriği Aydınlatır", font_size=24, color=WHITE)
        slogan.next_to(big_logo, DOWN, buff=0.3)
        
        self.play(GrowFromCenter(final_bulb), run_time=0.4)
        self.play(
            GrowFromCenter(glow),
            Flash(final_bulb.get_center(), color=YELLOW, line_length=0.5),
            run_time=0.5
        )
        self.play(FadeIn(result_text, scale=1.3), run_time=0.4)
        self.play(FadeIn(big_logo), FadeIn(slogan), run_time=0.5)
        self.wait({max(0.5, kapanis_dur - 1.8)})
'''
    
    return script
