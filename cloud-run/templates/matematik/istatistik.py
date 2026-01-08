"""
Matematik - İstatistik Template
Grafikler, tablolar, ortalama, olasılık
"""

def generate_istatistik_script(scenario: dict, question: dict, durations: dict) -> str:
    """
    İstatistik soruları için Manim script oluştur
    - Bar grafik
    - Pasta grafik
    - Veri tablosu
    """
    
    video_data = scenario.get("video_senaryosu", {})
    hook = video_data.get("hook_cumlesi", "Verileri analiz edelim!")
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
CYAN = "#06B6D4"
PINK = "#EC4899"
DARK_BG = "#16213e"

Text.set_default(font="Noto Sans")

class VideoScene(Scene):
    def construct(self):
        logo = Text("teknokul.com.tr", font_size=24, color=PURPLE)
        logo.to_edge(DOWN, buff=0.3)
        self.add(logo)
        
        # ===== HOOK - İstatistik Tema =====
        badge = VGroup(
            RoundedRectangle(width=3.5, height=0.8, corner_radius=0.2, fill_color=CYAN, fill_opacity=1, stroke_width=0),
            Text("İSTATİSTİK", font_size=24, color=WHITE, weight=BOLD)
        )
        badge[1].move_to(badge[0].get_center())
        badge.to_edge(UP, buff=0.5)
        
        # Bar grafik animasyonu
        bars = VGroup(*[
            Rectangle(width=0.6, height=h, fill_color=c, fill_opacity=0.8, stroke_width=0)
            .move_to(RIGHT * (i - 2) * 1 + UP * (h/2 + 1))
            for i, (h, c) in enumerate([
                (1.5, BLUE), (2.5, GREEN), (2, ORANGE), (3, PURPLE), (1.8, PINK)
            ])
        ])
        
        hook_text = Text("{escape(hook)}", font_size=34, color=WHITE, weight=BOLD)
        hook_text.move_to(DOWN * 4)
        if hook_text.width > 8:
            hook_text.scale_to_fit_width(8)
        
        self.play(FadeIn(badge, shift=DOWN), run_time=0.3)
        self.play(
            LaggedStart(*[GrowFromEdge(b, DOWN) for b in bars], lag_ratio=0.15),
            run_time=1.0
        )
        self.play(Write(hook_text), run_time=0.5)
        self.wait({max(0.3, hook_dur - 2.0)})
        self.play(
            FadeOut(bars, hook_text),
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
        
        # Her adımda farklı grafik tipi
        graph_types = [
            # Bar
            '''VGroup(*[
                Rectangle(width=0.5, height=h, fill_color=c, fill_opacity=0.7, stroke_width=0)
                .move_to(RIGHT * (j - 1.5) * 0.8 + UP * (h/2))
                for j, (h, c) in enumerate([(1, BLUE), (1.5, GREEN), (1.2, ORANGE), (1.8, PURPLE)])
            ]).scale(0.8).move_to(UP * 3)''',
            # Dots
            '''VGroup(*[
                Dot(color=c, radius=0.15).move_to(RIGHT * x + UP * y)
                for x, y, c in [(-1, 2.5, BLUE), (0, 3, GREEN), (1, 2.8, ORANGE), (0.5, 3.5, PURPLE)]
            ])''',
        ]
        graph_code = graph_types[i % len(graph_types)]
        
        script += f'''
        # ===== ADIM {i+1} =====
        step_num = VGroup(
            Circle(radius=0.4, color=ORANGE, fill_opacity=1, stroke_width=0),
            Text("{i+1}", font_size=32, color=WHITE, weight=BOLD)
        )
        step_num[1].move_to(step_num[0].get_center())
        step_num.to_edge(UP, buff=1)
        
        # Mini grafik
        mini_graph = {graph_code}
        
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
        
        self.play(FadeIn(step_num, scale=0.5), run_time=0.3)
        self.play(
            LaggedStart(*[FadeIn(g, scale=0.5) for g in mini_graph], lag_ratio=0.1),
            GrowFromCenter(content_box),
            run_time=0.5
        )
        self.play(Write(content), run_time=0.6)
        self.wait({max(0.3, dur - 1.9)})
        self.play(FadeOut(step_num, mini_graph, content_box, content), run_time=0.5)
'''

    script += f'''
        # ===== KAPANIŞ =====
        # Final bar grafik
        final_bars = VGroup(*[
            Rectangle(width=0.8, height=h, fill_color=GREEN, fill_opacity=0.8, stroke_width=0)
            .move_to(RIGHT * (i - 1.5) * 1.2 + UP * (h/2 + 2))
            for i, h in enumerate([1.5, 2.5, 2, 3])
        ])
        
        checkmark = Text("✓", font_size=60, color=GREEN)
        checkmark.move_to(UP * 0.5)
        
        big_logo = Text("Teknokul", font_size=60, color=ORANGE, weight=BOLD)
        big_logo.move_to(DOWN * 2)
        
        slogan = Text("Verileri Anlamlandırır", font_size=24, color=WHITE)
        slogan.next_to(big_logo, DOWN, buff=0.3)
        
        self.play(
            LaggedStart(*[GrowFromEdge(b, DOWN) for b in final_bars], lag_ratio=0.1),
            run_time=0.6
        )
        self.play(FadeIn(checkmark, scale=1.5), run_time=0.3)
        self.play(FadeIn(big_logo, scale=1.2), FadeIn(slogan), run_time=0.5)
        self.wait({max(0.5, kapanis_dur - 1.4)})
'''
    
    return script
