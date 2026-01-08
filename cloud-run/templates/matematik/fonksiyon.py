"""
Matematik - Fonksiyon Template
Grafikler, koordinat sistemi, doğru/eğri çizimleri
"""

def generate_fonksiyon_script(scenario: dict, question: dict, durations: dict) -> str:
    """
    Fonksiyon soruları için Manim script oluştur
    - Koordinat sistemi
    - Grafik çizimi
    - Nokta işaretleme
    """
    
    video_data = scenario.get("video_senaryosu", {})
    hook = video_data.get("hook_cumlesi", "Fonksiyon grafiğini çizelim!")
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
DARK_BG = "#16213e"

Text.set_default(font="Noto Sans")

class VideoScene(Scene):
    def construct(self):
        logo = Text("teknokul.com.tr", font_size=24, color=PURPLE)
        logo.to_edge(DOWN, buff=0.3)
        self.add(logo)
        
        # ===== HOOK - Fonksiyon Tema =====
        badge = VGroup(
            RoundedRectangle(width=4, height=0.8, corner_radius=0.2, fill_color=BLUE, fill_opacity=1, stroke_width=0),
            Text("FONKSİYONLAR", font_size=22, color=WHITE, weight=BOLD)
        )
        badge[1].move_to(badge[0].get_center())
        badge.to_edge(UP, buff=0.5)
        
        # Mini koordinat sistemi animasyonu
        mini_axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[-2, 4, 1],
            x_length=5,
            y_length=4,
            axis_config={{"color": BLUE, "stroke_width": 2}},
        ).scale(0.7).move_to(UP * 2)
        
        # Örnek grafik
        graph = mini_axes.plot(lambda x: 0.5 * x**2, color=ORANGE, stroke_width=3)
        
        hook_text = Text("{escape(hook)}", font_size=34, color=WHITE, weight=BOLD)
        hook_text.move_to(DOWN * 4)
        if hook_text.width > 8:
            hook_text.scale_to_fit_width(8)
        
        self.play(FadeIn(badge, shift=DOWN), run_time=0.3)
        self.play(Create(mini_axes), run_time=0.6)
        self.play(Create(graph), run_time=0.8)
        self.play(Write(hook_text), run_time=0.5)
        self.wait({max(0.3, hook_dur - 2.5)})
        self.play(
            FadeOut(mini_axes, graph, hook_text),
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
            Circle(radius=0.4, color=ORANGE, fill_opacity=1, stroke_width=0),
            Text("{i+1}", font_size=32, color=WHITE, weight=BOLD)
        )
        step_num[1].move_to(step_num[0].get_center())
        step_num.to_edge(UP, buff=1)
        
        # Mini grafik arka plan
        step_axes = Axes(
            x_range=[-2, 2, 1],
            y_range=[-1, 3, 1],
            x_length=4,
            y_length=3,
            axis_config={{"color": BLUE, "stroke_width": 1.5}},
        ).scale(0.6).move_to(UP * 3.5)
        
        content_box = RoundedRectangle(
            width=8, height=4, corner_radius=0.3,
            fill_color=DARK_BG, fill_opacity=0.95,
            stroke_color={color}, stroke_width=3
        )
        content_box.move_to(DOWN * 1.5)
        
        content = Text("{display}", font_size=32, color={color}, weight=BOLD)
        content.move_to(content_box.get_center())
        if content.width > 7:
            content.scale_to_fit_width(7)
        
        self.play(
            FadeIn(step_num, scale=0.5),
            Create(step_axes),
            run_time=0.5
        )
        self.play(GrowFromCenter(content_box), run_time=0.3)
        self.play(Write(content), run_time=0.6)
        self.wait({max(0.3, dur - 1.9)})
        self.play(FadeOut(step_num, step_axes, content_box, content), run_time=0.5)
'''

    script += f'''
        # ===== KAPANIŞ =====
        final_axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[-2, 4, 1],
            x_length=6,
            y_length=4,
            axis_config={{"color": BLUE, "stroke_width": 2}},
        ).scale(0.6).move_to(UP * 3)
        
        final_graph = final_axes.plot(lambda x: x**2 / 3, color=GREEN, stroke_width=4)
        
        checkmark = Text("✓", font_size=72, color=GREEN)
        checkmark.next_to(final_axes, RIGHT, buff=0.3)
        
        big_logo = Text("Teknokul", font_size=60, color=ORANGE, weight=BOLD)
        big_logo.move_to(DOWN * 2)
        
        slogan = Text("Fonksiyonları Kolaylaştırır", font_size=24, color=WHITE)
        slogan.next_to(big_logo, DOWN, buff=0.3)
        
        self.play(Create(final_axes), run_time=0.5)
        self.play(Create(final_graph), run_time=0.6)
        self.play(FadeIn(checkmark, scale=1.5), run_time=0.3)
        self.play(FadeIn(big_logo, scale=1.2), FadeIn(slogan), run_time=0.5)
        self.wait({max(0.5, kapanis_dur - 1.9)})
'''
    
    return script
