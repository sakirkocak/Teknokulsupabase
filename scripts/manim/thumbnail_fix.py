from manim import *
import os

TEKNOKUL = {
    "purple": "#7C3AED",
    "orange": "#F97316",
    "bg_dark": "#0F0A1A",
    "white": "#FFFFFF",
    "gray": "#9CA3AF",
}

config.pixel_width = 1280
config.pixel_height = 720

TURKISH_FONT = "Arial"
SAMPLE_QUESTION = "2x + 5 = 15"
SAMPLE_GRADE = "7"

class TeknokulThumbnailFixed(Scene):
    def construct(self):
        self.camera.background_color = TEKNOKUL["bg_dark"]
        
        # Gradient glow
        purple_glow = Circle(radius=4, fill_color=TEKNOKUL["purple"], fill_opacity=0.15, stroke_width=0)
        purple_glow.shift(UP * 1 + LEFT * 2)
        self.add(purple_glow)
        
        orange_glow = Circle(radius=3, fill_color=TEKNOKUL["orange"], fill_opacity=0.15, stroke_width=0)
        orange_glow.shift(DOWN * 2 + RIGHT * 4)
        self.add(orange_glow)
        
        # SOL ÜST: LOGO
        logo_path = "assets/teknokul_logo.png"
        if os.path.exists(logo_path):
            logo = ImageMobject(logo_path)
            logo.scale(0.25)
            logo.to_corner(UL, buff=0.25)
        self.add(logo)
        
        # Sağ üst: Seviye badge
        level_badge = VGroup(
            RoundedRectangle(corner_radius=0.1, width=2.5, height=0.5,
                fill_color=TEKNOKUL["orange"], fill_opacity=1, stroke_width=0),
            Text(f"{SAMPLE_GRADE}. SINIF", font_size=22, color=WHITE, weight=BOLD, font=TURKISH_FONT)
        )
        level_badge[1].move_to(level_badge[0].get_center())
        level_badge.to_corner(UR, buff=0.3)
        self.add(level_badge)
        
        # ANA SORU
        main_question = Text(SAMPLE_QUESTION, font_size=96, color=WHITE, weight=BOLD, font=TURKISH_FONT)
        main_question.shift(UP * 0.5)
        
        question_glow = main_question.copy()
        question_glow.set_color(TEKNOKUL["purple"])
        question_glow.set_opacity(0.3)
        self.add(question_glow, main_question)
        
        # Soru işareti
        q_mark = Text("?", font_size=200, color=TEKNOKUL["purple"], weight=BOLD, font=TURKISH_FONT)
        q_mark.set_opacity(0.1)
        q_mark.shift(RIGHT * 5 + UP * 1)
        self.add(q_mark)
        
        # "VİDEOLU ÇÖZÜM" butonu
        video_btn = VGroup(
            RoundedRectangle(corner_radius=0.15, width=5.5, height=1,
                fill_color=TEKNOKUL["purple"], fill_opacity=1, stroke_width=0),
            Text("▶ VİDEOLU ÇÖZÜM", font_size=32, color=WHITE, weight=BOLD, font=TURKISH_FONT)
        )
        video_btn[1].move_to(video_btn[0].get_center())
        video_btn.shift(DOWN * 1.2)
        self.add(video_btn)
        
        # Alt bilgi
        sub_info = Text("AI Sesli Anlatım | Adım Adım", font_size=24, color=TEKNOKUL["gray"], font=TURKISH_FONT)
        sub_info.shift(DOWN * 2.3)
        self.add(sub_info)
        
        # Köşe dekorasyonları - sağ alt
        corner_line3 = Line(start=RIGHT * 6.2 + DOWN * 3.2, end=RIGHT * 4.5 + DOWN * 3.2, color=TEKNOKUL["orange"], stroke_width=4)
        corner_line4 = Line(start=RIGHT * 6.2 + DOWN * 3.2, end=RIGHT * 6.2 + DOWN * 1.7, color=TEKNOKUL["orange"], stroke_width=4)
        self.add(corner_line3, corner_line4)
        
        # PLAY BUTONU - DÜZELTİLMİŞ (tam ortada hizalı)
        play_circle = Circle(radius=0.55, fill_color=TEKNOKUL["orange"], fill_opacity=1, stroke_width=0)
        play_triangle = Triangle(fill_color=WHITE, fill_opacity=1, stroke_width=0)
        play_triangle.scale(0.25)
        play_triangle.rotate(-PI/2)
        play_triangle.move_to(play_circle.get_center() + RIGHT * 0.05)  # Hafif sağa kaydır (optik hizalama)
        
        play_icon = VGroup(play_circle, play_triangle)
        play_icon.move_to(LEFT * 5.5 + DOWN * 2.8)  # Sol alt köşe
        self.add(play_icon)
        
        # Site adresi
        site = Text("Teknokul.com.tr", font_size=20, color=TEKNOKUL["gray"], font=TURKISH_FONT)
        site.to_corner(DR, buff=0.4)
        self.add(site)
