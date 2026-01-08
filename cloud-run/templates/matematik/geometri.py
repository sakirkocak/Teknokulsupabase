"""
Matematik - Geometri Template
Şekiller, açılar, alan/çevre hesaplamaları
Görsel animasyonlarla zenginleştirilmiş
"""

def generate_geometri_script(scenario: dict, question: dict, durations: dict) -> str:
    """
    Geometri soruları için Manim script oluştur
    - Şekil çizim animasyonları
    - Açı gösterimi
    - Alan/çevre hesaplama
    - Ölçü işaretleri
    """
    
    video_data = scenario.get("video_senaryosu", {})
    hook = video_data.get("hook_cumlesi", "Geometri sorusunu çözelim!")
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

# Video ayarları
config.frame_width = 9
config.frame_height = 16
config.pixel_width = 1080
config.pixel_height = 1920
config.frame_rate = 30
config.background_color = "#1a1a2e"

# Renkler
PURPLE = "#8B5CF6"
ORANGE = "#F97316"
GREEN = "#22C55E"
BLUE = "#3B82F6"
YELLOW = "#EAB308"
CYAN = "#06B6D4"
DARK_BG = "#16213e"

Text.set_default(font="Noto Sans")

class VideoScene(Scene):
    def construct(self):
        # Logo
        logo = Text("teknokul.com.tr", font_size=24, color=PURPLE)
        logo.to_edge(DOWN, buff=0.3)
        self.add(logo)
        
        # ===== HOOK - Geometri Tema =====
        # Ders badge
        badge = VGroup(
            RoundedRectangle(width=3.5, height=0.8, corner_radius=0.2, fill_color=CYAN, fill_opacity=1, stroke_width=0),
            Text("GEOMETRİ", font_size=24, color=WHITE, weight=BOLD)
        )
        badge[1].move_to(badge[0].get_center())
        badge.to_edge(UP, buff=0.5)
        
        # Geometrik şekiller animasyonu
        shapes = VGroup(
            Triangle(color=ORANGE, fill_opacity=0.3).scale(0.8).shift(LEFT * 2 + UP * 2),
            Circle(radius=0.6, color=BLUE, fill_opacity=0.3).shift(RIGHT * 2 + UP * 2),
            Square(side_length=1, color=GREEN, fill_opacity=0.3).shift(DOWN * 0.5),
            RegularPolygon(n=6, color=PURPLE, fill_opacity=0.3).scale(0.7).shift(LEFT * 2 + DOWN * 2),
            RegularPolygon(n=5, color=YELLOW, fill_opacity=0.3).scale(0.6).shift(RIGHT * 2 + DOWN * 2),
        )
        
        hook_text = Text("{escape(hook)}", font_size=36, color=WHITE, weight=BOLD)
        hook_text.move_to(DOWN * 4)
        if hook_text.width > 8:
            hook_text.scale_to_fit_width(8)
        
        self.play(FadeIn(badge, shift=DOWN), run_time=0.3)
        self.play(
            LaggedStart(*[GrowFromCenter(s) for s in shapes], lag_ratio=0.15),
            run_time=1.0
        )
        self.play(Write(hook_text), run_time=0.5)
        self.wait({max(0.3, hook_dur - 2.0)})
        self.play(
            FadeOut(shapes, hook_text),
            badge.animate.scale(0.7).to_corner(UL, buff=0.3),
            run_time=0.5
        )
'''

    # Adımları ekle
    for i, adim in enumerate(adimlar):
        display = escape(adim.get("ekranda_gosterilecek_metin", f"Adım {i+1}"))
        color_name = adim.get("vurgu_rengi", "WHITE")
        dur = step_durs[i] if i < len(step_durs) else 3.0
        
        color_map = {"YELLOW": "YELLOW", "GREEN": "GREEN", "BLUE": "BLUE", "RED": "RED", "WHITE": "WHITE", "CYAN": "CYAN"}
        color = color_map.get(color_name.upper(), "WHITE")
        
        # Her adımda farklı geometrik şekil göster
        shapes_code = [
            'Triangle(color=ORANGE, fill_opacity=0.5).scale(1.5)',
            'Circle(radius=1.2, color=BLUE, fill_opacity=0.5)',
            'Square(side_length=2, color=GREEN, fill_opacity=0.5)',
            'RegularPolygon(n=6, color=PURPLE, fill_opacity=0.5).scale(1.2)',
            'Rectangle(width=2.5, height=1.5, color=CYAN, fill_opacity=0.5)',
            'Ellipse(width=2.5, height=1.5, color=YELLOW, fill_opacity=0.5)',
        ]
        shape_code = shapes_code[i % len(shapes_code)]
        
        script += f'''
        # ===== ADIM {i+1} =====
        # Adım numarası
        step_badge = VGroup(
            Circle(radius=0.4, color=ORANGE, fill_opacity=1, stroke_width=0),
            Text("{i+1}", font_size=32, color=WHITE, weight=BOLD)
        )
        step_badge[1].move_to(step_badge[0].get_center())
        step_badge.to_edge(UP, buff=1)
        
        # Geometrik şekil
        geo_shape = {shape_code}
        geo_shape.move_to(UP * 3)
        
        # İçerik kutusu
        content_box = RoundedRectangle(
            width=8, height=4, corner_radius=0.3,
            fill_color=DARK_BG, fill_opacity=0.95,
            stroke_color={color}, stroke_width=3
        )
        content_box.move_to(DOWN * 2)
        
        content = Text("{display}", font_size=34, color={color}, weight=BOLD)
        content.move_to(content_box.get_center())
        if content.width > 7:
            content.scale_to_fit_width(7)
        if content.height > 3.5:
            content.scale_to_fit_height(3.5)
        
        # Ölçü çizgileri (dekoratif)
        measure_lines = VGroup(
            Line(LEFT * 3, LEFT * 3 + UP * 0.3, color=YELLOW, stroke_width=2),
            Line(LEFT * 3, LEFT * 3 + RIGHT * 0.3, color=YELLOW, stroke_width=2),
        )
        measure_lines.next_to(geo_shape, DL, buff=0.1)
        
        self.play(
            FadeIn(step_badge, scale=0.5),
            DrawBorderThenFill(geo_shape),
            run_time=0.5
        )
        self.play(
            GrowFromCenter(content_box),
            Create(measure_lines),
            run_time=0.4
        )
        self.play(Write(content), run_time=0.6)
        self.wait({max(0.3, dur - 2.0)})
        self.play(FadeOut(step_badge, geo_shape, content_box, content, measure_lines), run_time=0.5)
'''

    # Kapanış
    script += f'''
        # ===== KAPANIŞ =====
        # Tüm şekiller birlikte
        final_shapes = VGroup(
            Triangle(color=ORANGE, fill_opacity=0.6).scale(0.6).shift(LEFT * 2 + UP * 4),
            Circle(radius=0.5, color=BLUE, fill_opacity=0.6).shift(RIGHT * 2 + UP * 4),
            Square(side_length=0.8, color=GREEN, fill_opacity=0.6).shift(UP * 4),
        )
        
        result_banner = RoundedRectangle(
            width=7, height=1.5, corner_radius=0.3,
            fill_color=GREEN, fill_opacity=1, stroke_width=0
        )
        result_banner.move_to(UP * 1)
        
        result_text = Text("CEVAP HAZIR!", font_size=40, color=WHITE, weight=BOLD)
        result_text.move_to(result_banner.get_center())
        
        big_logo = Text("Teknokul", font_size=64, color=ORANGE, weight=BOLD)
        big_logo.move_to(DOWN * 2)
        
        slogan = Text("Geometriyi Sevdiren Platform", font_size=24, color=WHITE)
        slogan.next_to(big_logo, DOWN, buff=0.3)
        
        self.play(
            LaggedStart(*[GrowFromCenter(s) for s in final_shapes], lag_ratio=0.1),
            run_time=0.5
        )
        self.play(
            GrowFromCenter(result_banner),
            Write(result_text),
            run_time=0.5
        )
        self.play(
            FadeIn(big_logo, scale=1.2),
            FadeIn(slogan),
            run_time=0.5
        )
        self.wait({max(0.5, kapanis_dur - 1.5)})
'''
    
    return script
