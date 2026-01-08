"""
Fizik - Genel Template
Diğer fizik konuları için temel animasyonlar
"""

def generate_fizik_genel_script(scenario: dict, question: dict, durations: dict) -> str:
    """
    Genel fizik soruları için Manim script
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
DARK_BG = "#16213e"

Text.set_default(font="Noto Sans")

class VideoScene(Scene):
    def construct(self):
        logo = Text("teknokul.com.tr", font_size=24, color=PURPLE)
        logo.to_edge(DOWN, buff=0.3)
        self.add(logo)
        
        # ===== HOOK =====
        badge = VGroup(
            RoundedRectangle(width=3, height=0.8, corner_radius=0.2, fill_color=BLUE, fill_opacity=1, stroke_width=0),
            Text("FİZİK", font_size=24, color=WHITE, weight=BOLD)
        )
        badge[1].move_to(badge[0].get_center())
        badge.to_edge(UP, buff=0.5)
        
        # Atom simgesi
        atom_center = Dot(color=ORANGE, radius=0.3)
        atom_center.move_to(UP * 2.5)
        
        orbits = VGroup(*[
            Ellipse(width=2+i*0.8, height=1+i*0.4, color=BLUE, stroke_width=2).rotate(i*PI/3)
            for i in range(3)
        ])
        orbits.move_to(atom_center.get_center())
        
        electrons = VGroup(*[
            Dot(color=CYAN, radius=0.15).move_to(
                atom_center.get_center() + RIGHT * (1 + i*0.4) * np.cos(i*PI/3) + UP * (0.5 + i*0.2) * np.sin(i*PI/3)
            )
            for i in range(3)
        ])
        
        hook_text = Text("{escape(hook)}", font_size=34, color=WHITE, weight=BOLD)
        hook_text.move_to(DOWN * 3)
        if hook_text.width > 8:
            hook_text.scale_to_fit_width(8)
        
        self.play(FadeIn(badge, shift=DOWN), run_time=0.3)
        self.play(GrowFromCenter(atom_center), run_time=0.3)
        self.play(Create(orbits), run_time=0.5)
        self.play(FadeIn(electrons), run_time=0.3)
        self.play(Write(hook_text), run_time=0.5)
        self.wait({max(0.3, hook_dur - 2.2)})
        self.play(
            FadeOut(atom_center, orbits, electrons, hook_text),
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
        
        content_box = RoundedRectangle(
            width=8, height=5, corner_radius=0.3,
            fill_color=DARK_BG, fill_opacity=0.95,
            stroke_color={color}, stroke_width=3
        )
        content_box.move_to(DOWN * 0.5)
        
        content = Text("{display}", font_size=32, color={color}, weight=BOLD)
        content.move_to(content_box.get_center())
        if content.width > 7:
            content.scale_to_fit_width(7)
        
        self.play(FadeIn(step_num, scale=0.5), GrowFromCenter(content_box), run_time=0.5)
        self.play(Write(content), run_time=0.6)
        self.wait({max(0.3, dur - 1.6)})
        self.play(FadeOut(step_num, content_box, content), run_time=0.5)
'''

    script += f'''
        # ===== KAPANIŞ =====
        result_banner = RoundedRectangle(
            width=7, height=1.5, corner_radius=0.3,
            fill_color=GREEN, fill_opacity=1, stroke_width=0
        )
        result_banner.move_to(UP * 2)
        
        result_text = Text("SONUÇ", font_size=44, color=WHITE, weight=BOLD)
        result_text.move_to(result_banner.get_center())
        
        big_logo = Text("Teknokul", font_size=64, color=ORANGE, weight=BOLD)
        big_logo.move_to(DOWN * 1)
        
        slogan = Text("Fiziği Sevdirir", font_size=26, color=WHITE)
        slogan.next_to(big_logo, DOWN, buff=0.4)
        
        self.play(GrowFromCenter(result_banner), Write(result_text), run_time=0.5)
        self.play(FadeIn(big_logo, scale=1.2), FadeIn(slogan), run_time=0.5)
        self.wait({max(0.5, kapanis_dur - 1.0)})
'''
    
    return script
