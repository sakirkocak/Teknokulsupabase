"""
Genel Template - Tüm dersler için fallback
Bilinmeyen veya özel template olmayan dersler için
"""

def generate_genel_script(scenario: dict, question: dict, durations: dict) -> str:
    """
    Genel sorular için Manim script
    """
    
    video_data = scenario.get("video_senaryosu", {})
    hook = video_data.get("hook_cumlesi", "Soruyu çözelim!")
    adimlar = video_data.get("adimlar", [])[:6]
    kapanis = video_data.get("kapanis_cumlesi", "Teknokul'da kalın!")
    
    hook_dur = durations.get("hook", 3.0)
    step_durs = durations.get("steps", [3.0] * len(adimlar))
    kapanis_dur = durations.get("kapanis", 3.0)
    
    def escape(s):
        return str(s).replace('\\', '\\\\').replace('"', '\\"').replace("'", "\\'").replace('\n', ' ')
    
    script = f'''
from manim import *

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
        
        # ===== HOOK =====
        hook_box = RoundedRectangle(
            width=8, height=3, corner_radius=0.3,
            fill_color=DARK_BG, fill_opacity=0.95,
            stroke_color=ORANGE, stroke_width=4
        )
        hook_box.move_to(UP * 3)
        
        hook_text = Text("{escape(hook)}", font_size=36, color=WHITE, weight=BOLD)
        hook_text.move_to(hook_box.get_center())
        if hook_text.width > 7:
            hook_text.scale_to_fit_width(7)
        
        # Dekoratif yıldızlar
        stars = VGroup(*[
            Text("★", font_size=36, color=YELLOW).shift(
                RIGHT * (i - 2) * 1.5 + DOWN * 1
            )
            for i in range(5)
        ])
        
        self.play(GrowFromCenter(hook_box), run_time=0.4)
        self.play(Write(hook_text), run_time=0.5)
        self.play(
            LaggedStart(*[FadeIn(s, scale=0.5) for s in stars], lag_ratio=0.1),
            run_time=0.5
        )
        self.wait({max(0.3, hook_dur - 1.7)})
        self.play(FadeOut(hook_box, hook_text, stars), run_time=0.5)
'''

    for i, adim in enumerate(adimlar):
        display = escape(adim.get("ekranda_gosterilecek_metin", f"Adım {i+1}"))
        color_name = adim.get("vurgu_rengi", "WHITE")
        dur = step_durs[i] if i < len(step_durs) else 3.0
        
        color_map = {"YELLOW": "YELLOW", "GREEN": "GREEN", "BLUE": "BLUE", "RED": "RED", "WHITE": "WHITE", "ORANGE": "ORANGE"}
        color = color_map.get(color_name.upper(), "WHITE")
        
        script += f'''
        # ===== ADIM {i+1} =====
        step_badge = VGroup(
            Circle(radius=0.5, color=ORANGE, fill_opacity=1, stroke_width=0),
            Text("{i+1}", font_size=40, color=WHITE, weight=BOLD)
        )
        step_badge[1].move_to(step_badge[0].get_center())
        step_badge.to_edge(UP, buff=1)
        
        content_box = RoundedRectangle(
            width=8, height=5, corner_radius=0.3,
            fill_color=DARK_BG, fill_opacity=0.95,
            stroke_color={color}, stroke_width=3
        )
        content_box.move_to(DOWN * 0.5)
        
        content = Text("{display}", font_size=34, color={color}, weight=BOLD)
        content.move_to(content_box.get_center())
        if content.width > 7:
            content.scale_to_fit_width(7)
        if content.height > 4.5:
            content.scale_to_fit_height(4.5)
        
        deco_line = Line(LEFT * 3.5, RIGHT * 3.5, color={color}, stroke_width=2)
        deco_line.next_to(content_box, UP, buff=0.2)
        
        self.play(
            FadeIn(step_badge, scale=0.5),
            GrowFromCenter(content_box),
            Create(deco_line),
            run_time=0.5
        )
        self.play(Write(content), run_time=0.6)
        self.wait({max(0.3, dur - 1.6)})
        self.play(FadeOut(step_badge, content_box, content, deco_line), run_time=0.5)
'''

    script += f'''
        # ===== KAPANIŞ =====
        result_banner = RoundedRectangle(
            width=7, height=1.5, corner_radius=0.3,
            fill_color=GREEN, fill_opacity=1, stroke_width=0
        )
        result_banner.move_to(UP * 2)
        
        result_text = Text("SONUÇ", font_size=48, color=WHITE, weight=BOLD)
        result_text.move_to(result_banner.get_center())
        
        big_logo = Text("Teknokul", font_size=72, color=ORANGE, weight=BOLD)
        big_logo.move_to(DOWN * 1)
        
        slogan = Text("Eğitimin Dijital Üssü", font_size=28, color=WHITE)
        slogan.next_to(big_logo, DOWN, buff=0.4)
        
        # Konfeti
        confetti = VGroup(*[
            Dot(color=random_color(), radius=0.08).shift(
                RIGHT * ((i % 7) - 3) * 1 + UP * ((i // 7) - 1) * 0.8 + DOWN * 1
            )
            for i in range(21)
        ])
        
        self.play(GrowFromCenter(result_banner), Write(result_text), run_time=0.5)
        self.play(FadeIn(big_logo, scale=1.2), FadeIn(slogan), run_time=0.5)
        self.play(
            LaggedStart(*[FadeIn(c, scale=0) for c in confetti], lag_ratio=0.02),
            run_time=0.5
        )
        self.wait({max(0.5, kapanis_dur - 1.5)})
'''
    
    return script
