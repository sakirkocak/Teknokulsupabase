from manim import *
import os

# TEKNOKUL RENKLERİ (logodan)
TEKNOKUL = {
    "purple": "#7C3AED",      # Ana mor
    "purple_dark": "#5B21B6", # Koyu mor
    "orange": "#F97316",      # Ana turuncu
    "orange_light": "#FB923C", # Açık turuncu
    "bg_dark": "#0F0A1A",     # Koyu arka plan
    "bg_gradient": "#1A0F2E", # Gradient
    "white": "#FFFFFF",
    "gray": "#9CA3AF",
}

config.pixel_width = 1280
config.pixel_height = 720

# =====================
# 1. LOGO INTRO (3 saniye)
# =====================
class TeknokulIntro(Scene):
    def construct(self):
        self.camera.background_color = TEKNOKUL["bg_dark"]
        
        # Logo yükle
        logo_path = "assets/teknokul_logo.png"
        if os.path.exists(logo_path):
            logo = ImageMobject(logo_path)
            logo.scale(0.8)
        else:
            # Logo yoksa metin kullan
            logo = VGroup(
                Text("T", font_size=120, color=TEKNOKUL["purple"], weight=BOLD),
                Text("K", font_size=120, color=TEKNOKUL["orange"], weight=BOLD)
            ).arrange(RIGHT, buff=-0.2)
        
        # Başlangıçta görünmez
        logo.set_opacity(0)
        self.add(logo)
        
        # Parçacık efekti
        particles = VGroup(*[
            Dot(
                point=np.array([np.random.uniform(-6, 6), np.random.uniform(-3, 3), 0]),
                radius=0.03,
                color=TEKNOKUL["purple"] if i % 2 == 0 else TEKNOKUL["orange"]
            ).set_opacity(0.6)
            for i in range(30)
        ])
        
        # Parçacıklar merkeze
        self.play(
            *[p.animate.move_to(ORIGIN) for p in particles],
            run_time=0.8
        )
        
        # Logo belir
        self.play(
            logo.animate.set_opacity(1),
            FadeOut(particles),
            run_time=0.5
        )
        
        # Logo pulse efekti
        self.play(logo.animate.scale(1.1), run_time=0.2)
        self.play(logo.animate.scale(1/1.1), run_time=0.2)
        
        # Slogan
        slogan = Text("Ogrenmenin Yeni Adresi", font_size=28, color=TEKNOKUL["gray"])
        slogan.next_to(logo, DOWN, buff=0.5)
        self.play(FadeIn(slogan, shift=UP), run_time=0.5)
        
        self.wait(0.5)
        
        # Fade out
        self.play(FadeOut(logo), FadeOut(slogan), run_time=0.5)

# =====================
# 2. ANA VİDEO (Teknokul temalı)
# =====================
class TeknokulSolution(Scene):
    def construct(self):
        self.camera.background_color = TEKNOKUL["bg_dark"]
        
        # Gradient arka plan
        for i in range(15):
            rect = Rectangle(
                width=14.5, height=8.2,
                fill_color=interpolate_color(
                    ManimColor(TEKNOKUL["bg_dark"]),
                    ManimColor(TEKNOKUL["bg_gradient"]),
                    i/15
                ),
                fill_opacity=0.2,
                stroke_width=0
            )
            rect.shift(DOWN * i * 0.2 + LEFT * i * 0.1)
            self.add(rect)
        
        # Üst bar
        top_bar = Rectangle(
            width=14.5, height=0.8,
            fill_color=TEKNOKUL["purple"],
            fill_opacity=0.3,
            stroke_width=0
        )
        top_bar.to_edge(UP, buff=0)
        self.add(top_bar)
        
        # Sol üst: Mini logo
        mini_logo = VGroup(
            Text("T", font_size=36, color=TEKNOKUL["purple"], weight=BOLD),
            Text("K", font_size=36, color=TEKNOKUL["orange"], weight=BOLD)
        ).arrange(RIGHT, buff=-0.05)
        mini_logo.to_corner(UL, buff=0.2)
        self.add(mini_logo)
        
        # Sağ üst: Ders bilgisi
        info = Text("Matematik | 7. Sinif", font_size=22, color=TEKNOKUL["orange"])
        info.to_corner(UR, buff=0.25)
        self.add(info)
        
        # Ses ekle
        if os.path.exists("audio/test_voice.mp3"):
            self.add_sound("audio/test_voice.mp3")
        
        # ===== İÇERİK =====
        
        # Başlık
        title = Text("Denklem Cozumu", font_size=42, color=WHITE, weight=BOLD)
        title.shift(UP * 2.5)
        self.play(Write(title), run_time=1)
        self.wait(1)
        
        # Soru
        question_box = RoundedRectangle(
            corner_radius=0.15, width=8, height=1.2,
            fill_color=TEKNOKUL["purple"], fill_opacity=0.2,
            stroke_color=TEKNOKUL["purple"], stroke_width=2
        )
        question_box.shift(UP * 1)
        
        question = Text("2x + 5 = 15", font_size=56, color=WHITE, weight=BOLD)
        question.move_to(question_box.get_center())
        
        self.play(Create(question_box), Write(question), run_time=1.5)
        self.wait(1)
        
        # Adım 1
        step1_label = Text("Adim 1:", font_size=24, color=TEKNOKUL["orange"])
        step1_label.shift(LEFT * 4 + DOWN * 0.3)
        
        step1_text = Text("Her iki taraftan 5 cikar", font_size=28, color=TEKNOKUL["gray"])
        step1_text.next_to(step1_label, RIGHT, buff=0.3)
        
        self.play(Write(step1_label), FadeIn(step1_text), run_time=0.8)
        
        # Sonuç 1
        result1 = Text("2x = 10", font_size=48, color=TEKNOKUL["orange"])
        result1.shift(DOWN * 1)
        
        arrow1 = Arrow(
            question_box.get_bottom() + DOWN * 0.1,
            result1.get_top() + UP * 0.1,
            color=TEKNOKUL["purple"],
            stroke_width=3
        )
        
        self.play(Create(arrow1), Write(result1), run_time=1)
        self.wait(1)
        
        # Adım 2
        step2_label = Text("Adim 2:", font_size=24, color=TEKNOKUL["orange"])
        step2_label.shift(LEFT * 4 + DOWN * 2)
        
        step2_text = Text("Her iki tarafi 2'ye bol", font_size=28, color=TEKNOKUL["gray"])
        step2_text.next_to(step2_label, RIGHT, buff=0.3)
        
        self.play(Write(step2_label), FadeIn(step2_text), run_time=0.8)
        
        # Final sonuç
        final_box = RoundedRectangle(
            corner_radius=0.15, width=4, height=1.2,
            fill_color=TEKNOKUL["orange"], fill_opacity=0.3,
            stroke_color=TEKNOKUL["orange"], stroke_width=3
        )
        final_box.shift(DOWN * 3)
        
        final = Text("x = 5", font_size=64, color=WHITE, weight=BOLD)
        final.move_to(final_box.get_center())
        
        arrow2 = Arrow(
            result1.get_bottom() + DOWN * 0.1,
            final_box.get_top() + UP * 0.1,
            color=TEKNOKUL["purple"],
            stroke_width=3
        )
        
        self.play(Create(arrow2), Create(final_box), Write(final), run_time=1.2)
        
        # Başarı efekti
        check = Text("✓", font_size=48, color="#10B981")
        check.next_to(final_box, RIGHT, buff=0.3)
        self.play(FadeIn(check, scale=2), run_time=0.5)
        
        # Flash efekt
        self.play(
            final_box.animate.set_stroke(width=5),
            final.animate.set_color(TEKNOKUL["orange"]),
            run_time=0.3
        )
        self.play(
            final_box.animate.set_stroke(width=3),
            final.animate.set_color(WHITE),
            run_time=0.3
        )
        
        # Alt bar - CTA
        bottom_bar = Rectangle(
            width=14.5, height=0.6,
            fill_color=TEKNOKUL["purple"],
            fill_opacity=0.5,
            stroke_width=0
        )
        bottom_bar.to_edge(DOWN, buff=0)
        
        cta = Text("teknokul.com | Daha fazla soru icin abone ol!", font_size=20, color=WHITE)
        cta.move_to(bottom_bar.get_center())
        
        self.play(FadeIn(bottom_bar), FadeIn(cta), run_time=0.5)
        self.wait(1.5)

# =====================
# 3. THUMBNAIL (Dikkat çekici)
# =====================
class TeknokulThumbnail(Scene):
    def construct(self):
        self.camera.background_color = TEKNOKUL["bg_dark"]
        
        # Dinamik arka plan
        # Sol üst köşe - mor gradient
        purple_glow = Circle(radius=4, fill_color=TEKNOKUL["purple"], fill_opacity=0.15, stroke_width=0)
        purple_glow.shift(UP * 2 + LEFT * 4)
        self.add(purple_glow)
        
        # Sağ alt köşe - turuncu gradient
        orange_glow = Circle(radius=3, fill_color=TEKNOKUL["orange"], fill_opacity=0.15, stroke_width=0)
        orange_glow.shift(DOWN * 2 + RIGHT * 4)
        self.add(orange_glow)
        
        # Logo (sol üst)
        logo = VGroup(
            Text("T", font_size=48, color=TEKNOKUL["purple"], weight=BOLD),
            Text("K", font_size=48, color=TEKNOKUL["orange"], weight=BOLD)
        ).arrange(RIGHT, buff=-0.08)
        logo.to_corner(UL, buff=0.3)
        self.add(logo)
        
        # "teknokul" yazısı
        brand = Text("teknokul", font_size=24, color=TEKNOKUL["gray"])
        brand.next_to(logo, RIGHT, buff=0.2)
        self.add(brand)
        
        # Sağ üst: Seviye badge
        level_badge = VGroup(
            RoundedRectangle(corner_radius=0.1, width=2.5, height=0.5,
                fill_color=TEKNOKUL["orange"], fill_opacity=1, stroke_width=0),
            Text("7. SINIF", font_size=22, color=WHITE, weight=BOLD)
        )
        level_badge[1].move_to(level_badge[0].get_center())
        level_badge.to_corner(UR, buff=0.3)
        self.add(level_badge)
        
        # ANA SORU - Büyük ve dikkat çekici
        main_question = Text("2x + 5 = 15", font_size=96, color=WHITE, weight=BOLD)
        main_question.shift(UP * 0.5)
        
        # Glow efekti
        question_glow = main_question.copy()
        question_glow.set_color(TEKNOKUL["purple"])
        question_glow.set_opacity(0.3)
        question_glow.shift(OUT * 0.01)  # Biraz arkada
        
        self.add(question_glow, main_question)
        
        # Soru işareti dekorasyon
        q_mark = Text("?", font_size=200, color=TEKNOKUL["purple"], weight=BOLD)
        q_mark.set_opacity(0.1)
        q_mark.shift(RIGHT * 5 + UP * 1)
        self.add(q_mark)
        
        # "VIDEOLU COZUM" butonu
        video_btn = VGroup(
            RoundedRectangle(corner_radius=0.15, width=5.5, height=1,
                fill_color=TEKNOKUL["purple"], fill_opacity=1, stroke_width=0),
            Text("▶ VIDEOLU COZUM", font_size=32, color=WHITE, weight=BOLD)
        )
        video_btn[1].move_to(video_btn[0].get_center())
        video_btn.shift(DOWN * 1.2)
        self.add(video_btn)
        
        # Alt bilgi
        sub_info = Text("AI Sesli Anlatim | Adim Adim", font_size=24, color=TEKNOKUL["gray"])
        sub_info.shift(DOWN * 2.3)
        self.add(sub_info)
        
        # Köşe dekorasyonları
        corner_line1 = Line(
            start=LEFT * 6.2 + UP * 3.5,
            end=LEFT * 4.5 + UP * 3.5,
            color=TEKNOKUL["purple"],
            stroke_width=4
        )
        corner_line2 = Line(
            start=LEFT * 6.2 + UP * 3.5,
            end=LEFT * 6.2 + UP * 2,
            color=TEKNOKUL["purple"],
            stroke_width=4
        )
        self.add(corner_line1, corner_line2)
        
        corner_line3 = Line(
            start=RIGHT * 6.2 + DOWN * 3.2,
            end=RIGHT * 4.5 + DOWN * 3.2,
            color=TEKNOKUL["orange"],
            stroke_width=4
        )
        corner_line4 = Line(
            start=RIGHT * 6.2 + DOWN * 3.2,
            end=RIGHT * 6.2 + DOWN * 1.7,
            color=TEKNOKUL["orange"],
            stroke_width=4
        )
        self.add(corner_line3, corner_line4)
        
        # Play ikonu (büyük)
        play_circle = Circle(radius=0.6, fill_color=TEKNOKUL["orange"], fill_opacity=1, stroke_width=0)
        play_triangle = Triangle(fill_color=WHITE, fill_opacity=1, stroke_width=0)
        play_triangle.scale(0.3).rotate(-PI/2)
        play_icon = VGroup(play_circle, play_triangle)
        play_icon.to_corner(DL, buff=0.4)
        self.add(play_icon)
