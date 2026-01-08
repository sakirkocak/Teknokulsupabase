"""
Kimya - Genel Template
Atom, molekül, reaksiyon animasyonları
"""

def generate_kimya_genel_script(scenario: dict, question: dict, durations: dict) -> str:
    """
    Kimya soruları için Manim script
    - Atom modeli
    - Molekül yapısı
    - Reaksiyon okları
    """
    
    video_data = scenario.get("video_senaryosu", {})
    hook = video_data.get("hook_cumlesi", "Kimya sorusunu çözelim!")
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
        
        # ===== HOOK - Kimya Tema =====
        badge = VGroup(
            RoundedRectangle(width=3, height=0.8, corner_radius=0.2, fill_color=GREEN, fill_opacity=1, stroke_width=0),
            Text("KİMYA", font_size=24, color=WHITE, weight=BOLD)
        )
        badge[1].move_to(badge[0].get_center())
        badge.to_edge(UP, buff=0.5)
        
        # Su molekülü (H2O) animasyonu
        oxygen = Circle(radius=0.5, color=RED, fill_opacity=0.9, stroke_width=0)
        oxygen.move_to(UP * 2.5)
        o_label = Text("O", font_size=28, color=WHITE, weight=BOLD)
        o_label.move_to(oxygen.get_center())
        
        hydrogen1 = Circle(radius=0.35, color=BLUE, fill_opacity=0.9, stroke_width=0)
        hydrogen1.move_to(UP * 2.5 + LEFT * 1.2 + DOWN * 0.8)
        h1_label = Text("H", font_size=22, color=WHITE, weight=BOLD)
        h1_label.move_to(hydrogen1.get_center())
        
        hydrogen2 = Circle(radius=0.35, color=BLUE, fill_opacity=0.9, stroke_width=0)
        hydrogen2.move_to(UP * 2.5 + RIGHT * 1.2 + DOWN * 0.8)
        h2_label = Text("H", font_size=22, color=WHITE, weight=BOLD)
        h2_label.move_to(hydrogen2.get_center())
        
        # Bağlar
        bond1 = Line(oxygen.get_center(), hydrogen1.get_center(), color=WHITE, stroke_width=4)
        bond2 = Line(oxygen.get_center(), hydrogen2.get_center(), color=WHITE, stroke_width=4)
        
        molecule = VGroup(bond1, bond2, oxygen, o_label, hydrogen1, h1_label, hydrogen2, h2_label)
        
        hook_text = Text("{escape(hook)}", font_size=34, color=WHITE, weight=BOLD)
        hook_text.move_to(DOWN * 3)
        if hook_text.width > 8:
            hook_text.scale_to_fit_width(8)
        
        self.play(FadeIn(badge, shift=DOWN), run_time=0.3)
        self.play(
            GrowFromCenter(oxygen), FadeIn(o_label),
            run_time=0.4
        )
        self.play(
            Create(bond1), Create(bond2),
            GrowFromCenter(hydrogen1), GrowFromCenter(hydrogen2),
            FadeIn(h1_label), FadeIn(h2_label),
            run_time=0.6
        )
        self.play(Write(hook_text), run_time=0.5)
        self.wait({max(0.3, hook_dur - 2.1)})
        self.play(
            FadeOut(molecule, hook_text),
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
        
        # Her adımda farklı element göster
        elements = [("H", BLUE, 0.3), ("O", RED, 0.4), ("C", PURPLE, 0.4), ("N", GREEN, 0.35), ("Na", ORANGE, 0.4), ("Cl", YELLOW, 0.35)]
        elem = elements[i % len(elements)]
        
        script += f'''
        # ===== ADIM {i+1} =====
        step_num = VGroup(
            Circle(radius=0.4, color=GREEN, fill_opacity=1, stroke_width=0),
            Text("{i+1}", font_size=32, color=WHITE, weight=BOLD)
        )
        step_num[1].move_to(step_num[0].get_center())
        step_num.to_edge(UP, buff=1)
        
        # Element sembolü
        element_circle = Circle(radius={elem[2]}, color="{elem[1]}", fill_opacity=0.9, stroke_width=0)
        element_circle.move_to(UP * 3.5)
        element_label = Text("{elem[0]}", font_size=28, color=WHITE, weight=BOLD)
        element_label.move_to(element_circle.get_center())
        
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
            GrowFromCenter(element_circle),
            FadeIn(element_label),
            run_time=0.4
        )
        self.play(GrowFromCenter(content_box), run_time=0.3)
        self.play(Write(content), run_time=0.6)
        self.wait({max(0.3, dur - 1.8)})
        self.play(FadeOut(step_num, element_circle, element_label, content_box, content), run_time=0.5)
'''

    script += f'''
        # ===== KAPANIŞ =====
        # Periyodik tablo elementi
        element_box = VGroup(
            Square(side_length=2, color=GREEN, fill_opacity=0.8, stroke_width=3),
            Text("6", font_size=20, color=WHITE).move_to(UP * 0.6 + LEFT * 0.6),
            Text("C", font_size=48, color=WHITE, weight=BOLD),
            Text("Karbon", font_size=16, color=WHITE).move_to(DOWN * 0.5),
            Text("12.01", font_size=14, color=WHITE).move_to(DOWN * 0.75),
        )
        element_box.move_to(UP * 2)
        
        result_text = Text("CEVAP HAZIR!", font_size=40, color=GREEN, weight=BOLD)
        result_text.move_to(DOWN * 0.5)
        
        big_logo = Text("Teknokul", font_size=60, color=ORANGE, weight=BOLD)
        big_logo.move_to(DOWN * 3)
        
        slogan = Text("Kimyayı Keşfet", font_size=24, color=WHITE)
        slogan.next_to(big_logo, DOWN, buff=0.3)
        
        self.play(DrawBorderThenFill(element_box), run_time=0.6)
        self.play(FadeIn(result_text, scale=1.3), run_time=0.4)
        self.play(FadeIn(big_logo), FadeIn(slogan), run_time=0.5)
        self.wait({max(0.5, kapanis_dur - 1.5)})
'''
    
    return script
