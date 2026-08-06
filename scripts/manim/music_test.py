from manim import *

class MusicTest(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"
        
        # Birleşik ses (voice + background music)
        self.add_sound("audio/combined_audio.mp3")
        
        # "Merhaba! Bugün basit bir denklem çözeceğiz." (0-2s)
        title = Text("Basit Denklem Çözümü", font_size=48, color=WHITE)
        subtitle = Text("🎵 Müzikli Versiyon", font_size=24, color="#6366f1")
        subtitle.next_to(title, DOWN, buff=0.3)
        self.play(Write(title), FadeIn(subtitle), run_time=1.5)
        self.wait(1)
        
        # "İki x artı beş eşittir on beş." (2-4s)
        self.play(FadeOut(subtitle), title.animate.to_edge(UP).scale(0.7))
        eq1 = Text("2x + 5 = 15", font_size=56, color=WHITE)
        self.play(Write(eq1), run_time=1.5)
        self.wait(1)
        
        # "Önce her iki taraftan beş çıkaralım." (4-6s)
        step1 = Text("Her iki taraftan 5 çıkar", font_size=28, color=YELLOW)
        step1.next_to(eq1, DOWN, buff=0.3)
        self.play(FadeIn(step1), run_time=0.8)
        self.wait(0.7)
        
        # "İki x eşittir on." (6-8s)
        eq2 = Text("2x = 10", font_size=56, color=YELLOW)
        eq2.next_to(step1, DOWN, buff=0.5)
        self.play(Write(eq2), run_time=1.2)
        self.wait(1)
        
        # "Şimdi her iki tarafı ikiye bölelim." (8-10s)
        step2 = Text("Her iki tarafı 2'ye böl", font_size=28, color=GREEN)
        step2.next_to(eq2, DOWN, buff=0.3)
        self.play(FadeIn(step2), run_time=0.8)
        self.wait(0.7)
        
        # "Ve sonuç: x eşittir beş!" (10-13s)
        result = Text("x = 5", font_size=72, color=GREEN)
        result.next_to(step2, DOWN, buff=0.5)
        box = SurroundingRectangle(result, color=GREEN, buff=0.2, corner_radius=0.1)
        self.play(Write(result), Create(box), run_time=1.5)
        
        # Kutlama
        self.play(
            result.animate.scale(1.1),
            box.animate.set_stroke(width=4),
            run_time=0.3
        )
        self.play(
            result.animate.scale(1/1.1),
            box.animate.set_stroke(width=2),
            run_time=0.3
        )
        
        # Watermark
        watermark = Text("teknokul.com", font_size=20, color=WHITE, fill_opacity=0.5)
        watermark.to_corner(DR, buff=0.3)
        self.play(FadeIn(watermark))
        self.wait(1.5)
