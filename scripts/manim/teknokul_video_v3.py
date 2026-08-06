from manim import *
import os

# TEKNOKUL RENKLERİ
TEKNOKUL = {
    "purple": "#7C3AED",
    "purple_dark": "#5B21B6",
    "orange": "#F97316",
    "orange_light": "#FB923C",
    "bg_dark": "#0F0A1A",
    "bg_gradient": "#1A0F2E",
    "white": "#FFFFFF",
    "gray": "#9CA3AF",
}

config.pixel_width = 1280
config.pixel_height = 720

TURKISH_FONT = "Arial"

# Test için örnek soru
SAMPLE_QUESTION = "2x + 5 = 15"
SAMPLE_SUBJECT = "Matematik"
SAMPLE_GRADE = "7"

# =====================
# LOGO INTRO + SORU GÖSTERİMİ
# =====================
class TeknokulIntroV3(Scene):
    def construct(self):
        self.camera.background_color = TEKNOKUL["bg_dark"]
        
        # Logo yükle
        logo_path = "assets/teknokul_logo.png"
        if os.path.exists(logo_path):
            logo = ImageMobject(logo_path)
            logo.scale(0.7)
        else:
            logo = VGroup(
                Text("T", font_size=100, color=TEKNOKUL["purple"], weight=BOLD, font=TURKISH_FONT),
                Text("K", font_size=100, color=TEKNOKUL["orange"], weight=BOLD, font=TURKISH_FONT)
            ).arrange(RIGHT, buff=-0.15)
        
        logo.set_opacity(0)
        self.add(logo)
        
        # Parçacıklar
        particles = VGroup(*[
            Dot(
                point=np.array([np.random.uniform(-6, 6), np.random.uniform(-3, 3), 0]),
                radius=0.03,
                color=TEKNOKUL["purple"] if i % 2 == 0 else TEKNOKUL["orange"]
            ).set_opacity(0.6)
            for i in range(30)
        ])
        
        self.play(*[p.animate.move_to(ORIGIN) for p in particles], run_time=0.8)
        self.play(logo.animate.set_opacity(1), FadeOut(particles), run_time=0.5)
        self.play(logo.animate.scale(1.1), run_time=0.2)
        self.play(logo.animate.scale(1/1.1), run_time=0.2)
        
        # YENİ SLOGAN: "Öğrenmenin Dijital Üssü"
        slogan = Text("Öğrenmenin Dijital Üssü", font_size=28, color=TEKNOKUL["gray"], font=TURKISH_FONT)
        slogan.next_to(logo, DOWN, buff=0.5)
        self.play(FadeIn(slogan, shift=UP), run_time=0.5)
        
        self.wait(0.8)
        
        # Logo ve slogan yukarı kayar
        self.play(
            logo.animate.scale(0.4).to_corner(UL, buff=0.3),
            FadeOut(slogan),
            run_time=0.6
        )
        
        # ===== SORU GÖSTERİMİ (Intro sonrası) =====
        
        # "Bugünkü Soru" başlığı
        today_label = Text("Bugünkü Soru", font_size=32, color=TEKNOKUL["orange"], font=TURKISH_FONT)
        today_label.shift(UP * 2)
        self.play(Write(today_label), run_time=0.5)
        
        # Soru kutusu
        question_box = RoundedRectangle(
            corner_radius=0.2, width=10, height=2,
            fill_color=TEKNOKUL["purple"], fill_opacity=0.15,
            stroke_color=TEKNOKUL["purple"], stroke_width=3
        )
        
        question_text = Text(SAMPLE_QUESTION, font_size=72, color=WHITE, weight=BOLD, font=TURKISH_FONT)
        question_text.move_to(question_box.get_center())
        
        self.play(Create(question_box), Write(question_text), run_time=1.2)
        
        # Ders ve sınıf bilgisi
        info = Text(f"{SAMPLE_SUBJECT} | {SAMPLE_GRADE}. Sınıf", font_size=24, color=TEKNOKUL["gray"], font=TURKISH_FONT)
        info.next_to(question_box, DOWN, buff=0.4)
        self.play(FadeIn(info), run_time=0.4)
        
        self.wait(1)
        
        # Geçiş efekti
        self.play(
            FadeOut(today_label),
            FadeOut(question_box),
            FadeOut(question_text),
            FadeOut(info),
            run_time=0.5
        )

# =====================
# ANA VİDEO
# =====================
class TeknokulSolutionV3(Scene):
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
        top_bar = Rectangle(width=14.5, height=0.8, fill_color=TEKNOKUL["purple"], fill_opacity=0.3, stroke_width=0)
        top_bar.to_edge(UP, buff=0)
        self.add(top_bar)
        
        # Sol üst: Logo (görsel)
        logo_path = "assets/teknokul_logo.png"
        if os.path.exists(logo_path):
            mini_logo = ImageMobject(logo_path)
            mini_logo.scale(0.15)
            mini_logo.to_corner(UL, buff=0.15)
        else:
            mini_logo = Text("Teknokul", font_size=28, color=WHITE, weight=BOLD, font=TURKISH_FONT)
            mini_logo[0].set_color(TEKNOKUL["purple"])
            mini_logo[1:].set_color(TEKNOKUL["orange"])
            mini_logo.to_corner(UL, buff=0.2)
        self.add(mini_logo)
        
        # Sağ üst: Ders bilgisi
        info = Text(f"{SAMPLE_SUBJECT} | {SAMPLE_GRADE}. Sınıf", font_size=22, color=TEKNOKUL["orange"], font=TURKISH_FONT)
        info.to_corner(UR, buff=0.25)
        self.add(info)
        
        # Ses ekle
        if os.path.exists("audio/test_voice.mp3"):
            self.add_sound("audio/test_voice.mp3")
        
        # ===== İÇERİK =====
        
        # Başlık
        title = Text("Denklem Çözümü", font_size=42, color=WHITE, weight=BOLD, font=TURKISH_FONT)
        title.shift(UP * 2.5)
        self.play(Write(title), run_time=1)
        self.wait(1)
        
        # Soru kutusu
        question_box = RoundedRectangle(
            corner_radius=0.15, width=8, height=1.2,
            fill_color=TEKNOKUL["purple"], fill_opacity=0.2,
            stroke_color=TEKNOKUL["purple"], stroke_width=2
        )
        question_box.shift(UP * 1)
        
        question = Text(SAMPLE_QUESTION, font_size=56, color=WHITE, weight=BOLD, font=TURKISH_FONT)
        question.move_to(question_box.get_center())
        
        self.play(Create(question_box), Write(question), run_time=1.5)
        self.wait(1)
        
        # Adım 1
        step1_label = Text("Adım 1:", font_size=24, color=TEKNOKUL["orange"], font=TURKISH_FONT)
        step1_label.shift(LEFT * 4 + DOWN * 0.3)
        
        step1_text = Text("Her iki taraftan 5 çıkar", font_size=28, color=TEKNOKUL["gray"], font=TURKISH_FONT)
        step1_text.next_to(step1_label, RIGHT, buff=0.3)
        
        self.play(Write(step1_label), FadeIn(step1_text), run_time=0.8)
        
        result1 = Text("2x = 10", font_size=48, color=TEKNOKUL["orange"], font=TURKISH_FONT)
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
        step2_label = Text("Adım 2:", font_size=24, color=TEKNOKUL["orange"], font=TURKISH_FONT)
        step2_label.shift(LEFT * 4 + DOWN * 2)
        
        step2_text = Text("Her iki tarafı 2'ye böl", font_size=28, color=TEKNOKUL["gray"], font=TURKISH_FONT)
        step2_text.next_to(step2_label, RIGHT, buff=0.3)
        
        self.play(Write(step2_label), FadeIn(step2_text), run_time=0.8)
        
        # Final
        final_box = RoundedRectangle(
            corner_radius=0.15, width=4, height=1.2,
            fill_color=TEKNOKUL["orange"], fill_opacity=0.3,
            stroke_color=TEKNOKUL["orange"], stroke_width=3
        )
        final_box.shift(DOWN * 3)
        
        final = Text("x = 5", font_size=64, color=WHITE, weight=BOLD, font=TURKISH_FONT)
        final.move_to(final_box.get_center())
        
        arrow2 = Arrow(
            result1.get_bottom() + DOWN * 0.1,
            final_box.get_top() + UP * 0.1,
            color=TEKNOKUL["purple"],
            stroke_width=3
        )
        
        self.play(Create(arrow2), Create(final_box), Write(final), run_time=1.2)
        
        check = Text("✓", font_size=48, color="#10B981", font=TURKISH_FONT)
        check.next_to(final_box, RIGHT, buff=0.3)
        self.play(FadeIn(check, scale=2), run_time=0.5)
        
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
        
        # Alt bar
        bottom_bar = Rectangle(width=14.5, height=0.6, fill_color=TEKNOKUL["purple"], fill_opacity=0.5, stroke_width=0)
        bottom_bar.to_edge(DOWN, buff=0)
        
        cta = Text("Teknokul.com.tr | Daha fazla soru için abone ol!", font_size=20, color=WHITE, font=TURKISH_FONT)
        cta.move_to(bottom_bar.get_center())
        
        self.play(FadeIn(bottom_bar), FadeIn(cta), run_time=0.5)
        self.wait(1.5)

# =====================
# THUMBNAIL (Düzeltilmiş)
# =====================
class TeknokulThumbnailV3(Scene):
    def construct(self):
        self.camera.background_color = TEKNOKUL["bg_dark"]
        
        # Gradient glow efektleri - LOGO'DAN UZAKTA
        purple_glow = Circle(radius=4, fill_color=TEKNOKUL["purple"], fill_opacity=0.15, stroke_width=0)
        purple_glow.shift(UP * 1 + LEFT * 2)  # Ortada, logo üstüne gelmiyor
        self.add(purple_glow)
        
        orange_glow = Circle(radius=3, fill_color=TEKNOKUL["orange"], fill_opacity=0.15, stroke_width=0)
        orange_glow.shift(DOWN * 2 + RIGHT * 4)
        self.add(orange_glow)
        
        # SOL ÜST: GERÇEK LOGO
        logo_path = "assets/teknokul_logo.png"
        if os.path.exists(logo_path):
            logo = ImageMobject(logo_path)
            logo.scale(0.25)
            logo.to_corner(UL, buff=0.25)
        else:
            logo = Text("Teknokul", font_size=36, color=WHITE, weight=BOLD, font=TURKISH_FONT)
            logo[0].set_color(TEKNOKUL["purple"])
            logo[1:].set_color(TEKNOKUL["orange"])
            logo.to_corner(UL, buff=0.3)
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
        
        # Soru işareti dekorasyon
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
        
        # KÖŞE DEKORASYONLARı - SAĞ ALT (logo üstüne gelmez)
        corner_line3 = Line(start=RIGHT * 6.2 + DOWN * 3.2, end=RIGHT * 4.5 + DOWN * 3.2, color=TEKNOKUL["orange"], stroke_width=4)
        corner_line4 = Line(start=RIGHT * 6.2 + DOWN * 3.2, end=RIGHT * 6.2 + DOWN * 1.7, color=TEKNOKUL["orange"], stroke_width=4)
        self.add(corner_line3, corner_line4)
        
        # Play ikonu (sol alt)
        play_circle = Circle(radius=0.6, fill_color=TEKNOKUL["orange"], fill_opacity=1, stroke_width=0)
        play_triangle = Triangle(fill_color=WHITE, fill_opacity=1, stroke_width=0)
        play_triangle.scale(0.3).rotate(-PI/2)
        play_icon = VGroup(play_circle, play_triangle)
        play_icon.to_corner(DL, buff=0.4)
        self.add(play_icon)
        
        # Site adresi (sağ alt)
        site = Text("Teknokul.com.tr", font_size=20, color=TEKNOKUL["gray"], font=TURKISH_FONT)
        site.to_corner(DR, buff=0.4)
        self.add(site)
