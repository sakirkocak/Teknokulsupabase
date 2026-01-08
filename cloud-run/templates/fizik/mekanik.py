"""
Fizik - Mekanik Template
Hareket, kuvvet, hız, ivme animasyonları
"""

def generate_mekanik_script(scenario: dict, question: dict, durations: dict) -> str:
    """
    Mekanik soruları için Manim script
    - Cisim hareketi
    - Vektör animasyonları
    - Yörünge çizimi
    """
    
    video_data = scenario.get("video_senaryosu", {})
    hook = video_data.get("hook_cumlesi", "Fizik sorusunu çözelim!")
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
DARK_BG = "#16213e"

Text.set_default(font="Noto Sans")

class VideoScene(Scene):
    def construct(self):
        logo = Text("teknokul.com.tr", font_size=24, color=PURPLE)
        logo.to_edge(DOWN, buff=0.3)
        self.add(logo)
        
        # ===== HOOK - Fizik Mekanik Tema =====
        badge = VGroup(
            RoundedRectangle(width=3, height=0.8, corner_radius=0.2, fill_color=BLUE, fill_opacity=1, stroke_width=0),
            Text("FİZİK", font_size=24, color=WHITE, weight=BOLD)
        )
        badge[1].move_to(badge[0].get_center())
        badge.to_edge(UP, buff=0.5)
        
        # Hareket animasyonu - cisim ve yörünge
        ball = Circle(radius=0.3, color=ORANGE, fill_opacity=1)
        ball.move_to(LEFT * 3 + UP * 2)
        
        # Vektör okları
        velocity_arrow = Arrow(
            start=LEFT * 3 + UP * 2,
            end=LEFT * 1 + UP * 2,
            color=GREEN, buff=0, stroke_width=4
        )
        v_label = MathTex("\\\\vec{{v}}", font_size=36, color=GREEN)
        v_label.next_to(velocity_arrow, UP, buff=0.1)
        
        force_arrow = Arrow(
            start=LEFT * 3 + UP * 2,
            end=LEFT * 3 + DOWN * 0.5,
            color=RED, buff=0, stroke_width=4
        )
        f_label = MathTex("\\\\vec{{F}}", font_size=36, color=RED)
        f_label.next_to(force_arrow, LEFT, buff=0.1)
        
        hook_text = Text("{escape(hook)}", font_size=34, color=WHITE, weight=BOLD)
        hook_text.move_to(DOWN * 4)
        if hook_text.width > 8:
            hook_text.scale_to_fit_width(8)
        
        self.play(FadeIn(badge, shift=DOWN), run_time=0.3)
        self.play(GrowFromCenter(ball), run_time=0.3)
        self.play(
            GrowArrow(velocity_arrow),
            FadeIn(v_label),
            run_time=0.4
        )
        self.play(
            GrowArrow(force_arrow),
            FadeIn(f_label),
            run_time=0.4
        )
        self.play(
            ball.animate.move_to(RIGHT * 2 + DOWN * 1),
            run_time=0.8
        )
        self.play(Write(hook_text), run_time=0.5)
        self.wait({max(0.3, hook_dur - 3.0)})
        self.play(
            FadeOut(ball, velocity_arrow, v_label, force_arrow, f_label, hook_text),
            badge.animate.scale(0.7).to_corner(UL, buff=0.3),
            run_time=0.5
        )
'''

    for i, adim in enumerate(adimlar):
        display = escape(adim.get("ekranda_gosterilecek_metin", f"Adım {i+1}"))
        color_name = adim.get("vurgu_rengi", "WHITE")
        dur = step_durs[i] if i < len(step_durs) else 3.0
        
        color_map = {"YELLOW": "YELLOW", "GREEN": "GREEN", "BLUE": "BLUE", "RED": "RED", "WHITE": "WHITE"}
        color = color_map.get(color_name.upper(), "WHITE")
        
        script += f'''
        # ===== ADIM {i+1} =====
        step_num = VGroup(
            Circle(radius=0.4, color=BLUE, fill_opacity=1, stroke_width=0),
            Text("{i+1}", font_size=32, color=WHITE, weight=BOLD)
        )
        step_num[1].move_to(step_num[0].get_center())
        step_num.to_edge(UP, buff=1)
        
        # Fizik sembolü
        physics_icon = Circle(radius=0.5, color=ORANGE, fill_opacity=0.8)
        physics_icon.move_to(UP * 3.5)
        
        # Küçük vektör
        mini_arrow = Arrow(
            physics_icon.get_center(),
            physics_icon.get_center() + RIGHT * 1.5,
            color=GREEN, stroke_width=3
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
            GrowFromCenter(physics_icon),
            run_time=0.4
        )
        self.play(GrowArrow(mini_arrow), run_time=0.3)
        self.play(GrowFromCenter(content_box), run_time=0.3)
        self.play(Write(content), run_time=0.6)
        self.wait({max(0.3, dur - 2.1)})
        self.play(FadeOut(step_num, physics_icon, mini_arrow, content_box, content), run_time=0.5)
'''

    script += f'''
        # ===== KAPANIŞ =====
        # Final hareket
        final_ball = Circle(radius=0.4, color=ORANGE, fill_opacity=1)
        final_ball.move_to(LEFT * 3 + UP * 2)
        
        # Yörünge
        path = TracedPath(final_ball.get_center, stroke_color=YELLOW, stroke_width=3)
        
        result_text = Text("ÇÖZÜM TAMAM!", font_size=40, color=GREEN, weight=BOLD)
        result_text.move_to(DOWN * 0.5)
        
        big_logo = Text("Teknokul", font_size=60, color=ORANGE, weight=BOLD)
        big_logo.move_to(DOWN * 3)
        
        slogan = Text("Fiziği Anlaşılır Kılar", font_size=24, color=WHITE)
        slogan.next_to(big_logo, DOWN, buff=0.3)
        
        self.add(path)
        self.play(GrowFromCenter(final_ball), run_time=0.3)
        self.play(
            final_ball.animate.move_to(RIGHT * 3 + UP * 2),
            run_time=0.8
        )
        self.play(
            final_ball.animate.move_to(RIGHT * 3 + DOWN * 1),
            run_time=0.5
        )
        self.play(FadeIn(result_text, scale=1.3), run_time=0.4)
        self.play(FadeIn(big_logo), FadeIn(slogan), run_time=0.5)
        self.wait({max(0.5, kapanis_dur - 2.5)})
'''
    
    return script
