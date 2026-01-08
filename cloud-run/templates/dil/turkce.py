"""
Türkçe - Genel Template
Cümle analizi, paragraf, anlam animasyonları
"""

def generate_turkce_genel_script(scenario: dict, question: dict, durations: dict) -> str:
    """
    Türkçe soruları için Manim script
    - Cümle vurgulama
    - Kelime animasyonları
    - Anlam ilişkileri
    """
    
    video_data = scenario.get("video_senaryosu", {})
    hook = video_data.get("hook_cumlesi", "Türkçe sorusunu çözelim!")
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
RED = "#EF4444"
CYAN = "#06B6D4"
DARK_BG = "#16213e"

Text.set_default(font="Noto Sans")

class VideoScene(Scene):
    def construct(self):
        logo = Text("teknokul.com.tr", font_size=24, color=PURPLE)
        logo.to_edge(DOWN, buff=0.3)
        self.add(logo)
        
        # ===== HOOK - Türkçe Tema =====
        badge = VGroup(
            RoundedRectangle(width=3, height=0.8, corner_radius=0.2, fill_color=ORANGE, fill_opacity=1, stroke_width=0),
            Text("TÜRKÇE", font_size=24, color=WHITE, weight=BOLD)
        )
        badge[1].move_to(badge[0].get_center())
        badge.to_edge(UP, buff=0.5)
        
        # Kelime animasyonu
        words = VGroup(
            Text("Özne", font_size=36, color=BLUE, weight=BOLD).shift(LEFT * 2 + UP * 3),
            Text("Yüklem", font_size=36, color=RED, weight=BOLD).shift(RIGHT * 2 + UP * 3),
            Text("Tümleç", font_size=32, color=GREEN, weight=BOLD).shift(UP * 1.5),
        )
        
        # Bağlantı okları
        arrows = VGroup(
            Arrow(words[0].get_right(), words[2].get_left() + UP * 0.3, color=YELLOW, stroke_width=2),
            Arrow(words[2].get_right() + UP * 0.3, words[1].get_left(), color=YELLOW, stroke_width=2),
        )
        
        hook_text = Text("{escape(hook)}", font_size=34, color=WHITE, weight=BOLD)
        hook_text.move_to(DOWN * 3)
        if hook_text.width > 8:
            hook_text.scale_to_fit_width(8)
        
        self.play(FadeIn(badge, shift=DOWN), run_time=0.3)
        self.play(
            LaggedStart(*[FadeIn(w, scale=0.5) for w in words], lag_ratio=0.2),
            run_time=0.6
        )
        self.play(
            LaggedStart(*[GrowArrow(a) for a in arrows], lag_ratio=0.2),
            run_time=0.5
        )
        self.play(Write(hook_text), run_time=0.5)
        self.wait({max(0.3, hook_dur - 2.2)})
        self.play(
            FadeOut(words, arrows, hook_text),
            badge.animate.scale(0.7).to_corner(UL, buff=0.3),
            run_time=0.5
        )
'''

    for i, adim in enumerate(adimlar):
        display = escape(adim.get("ekranda_gosterilecek_metin", f"Adım {i+1}"))
        color_name = adim.get("vurgu_rengi", "WHITE")
        dur = step_durs[i] if i < len(step_durs) else 3.0
        
        color_map = {"YELLOW": "YELLOW", "GREEN": "GREEN", "BLUE": "BLUE", "RED": "RED", "WHITE": "WHITE", "ORANGE": "ORANGE"}
        color = color_map.get(color_name.upper(), "WHITE")
        
        script += f'''
        # ===== ADIM {i+1} =====
        step_num = VGroup(
            Circle(radius=0.4, color=ORANGE, fill_opacity=1, stroke_width=0),
            Text("{i+1}", font_size=32, color=WHITE, weight=BOLD)
        )
        step_num[1].move_to(step_num[0].get_center())
        step_num.to_edge(UP, buff=1)
        
        # Kitap/kalem ikonu
        book = VGroup(
            RoundedRectangle(width=1.2, height=1.5, corner_radius=0.1, fill_color=ORANGE, fill_opacity=0.8, stroke_width=0),
            Line(UP * 0.5, DOWN * 0.5, color=WHITE, stroke_width=3).shift(LEFT * 0.1),
            *[Line(LEFT * 0.3, RIGHT * 0.3, color=WHITE, stroke_width=2).shift(UP * (0.3 - j * 0.25)) for j in range(4)]
        ).scale(0.8).move_to(UP * 3.5)
        
        content_box = RoundedRectangle(
            width=8, height=5, corner_radius=0.3,
            fill_color=DARK_BG, fill_opacity=0.95,
            stroke_color={color}, stroke_width=3
        )
        content_box.move_to(DOWN * 0.5)
        
        content = Text("{display}", font_size=30, color={color}, weight=BOLD)
        content.move_to(content_box.get_center())
        if content.width > 7:
            content.scale_to_fit_width(7)
        if content.height > 4.5:
            content.scale_to_fit_height(4.5)
        
        self.play(
            FadeIn(step_num, scale=0.5),
            DrawBorderThenFill(book),
            run_time=0.5
        )
        self.play(GrowFromCenter(content_box), run_time=0.3)
        self.play(Write(content), run_time=0.7)
        self.wait({max(0.3, dur - 2.0)})
        self.play(FadeOut(step_num, book, content_box, content), run_time=0.5)
'''

    script += f'''
        # ===== KAPANIŞ =====
        # A harfi büyük
        big_a = Text("A", font_size=120, color=ORANGE, weight=BOLD)
        big_a.move_to(UP * 2)
        
        # Altında küçük harfler
        alphabet = Text("B C Ç D E F G...", font_size=28, color=WHITE)
        alphabet.next_to(big_a, DOWN, buff=0.5)
        
        result_text = Text("DİL USTALIGI!", font_size=40, color=GREEN, weight=BOLD)
        result_text.move_to(DOWN * 1)
        
        big_logo = Text("Teknokul", font_size=60, color=ORANGE, weight=BOLD)
        big_logo.move_to(DOWN * 3.5)
        
        slogan = Text("Türkçeyi Sevdirir", font_size=24, color=WHITE)
        slogan.next_to(big_logo, DOWN, buff=0.3)
        
        self.play(FadeIn(big_a, scale=1.5), run_time=0.4)
        self.play(Write(alphabet), run_time=0.4)
        self.play(FadeIn(result_text, scale=1.3), run_time=0.4)
        self.play(FadeIn(big_logo), FadeIn(slogan), run_time=0.5)
        self.wait({max(0.5, kapanis_dur - 1.7)})
'''
    
    return script
