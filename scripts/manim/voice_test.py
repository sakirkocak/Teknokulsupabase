from manim import *

class VoiceTest(Scene):
    def construct(self):
        # Arka plan
        self.camera.background_color = "#0a0a1a"
        
        # Sesi ekle (0. saniyede başla)
        self.add_sound("audio/test_voice.mp3")
        
        # "Merhaba! Bugün basit bir denklem çözeceğiz." (0-2s)
        title = Text("Basit Denklem Çözümü", font_size=48, color=WHITE)
        self.play(Write(title), run_time=1.5)
        self.wait(1)
        
        # "İki x artı beş eşittir on beş." (2-4s)
        self.play(title.animate.to_edge(UP).scale(0.7))
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
        
        # Kutlama efekti
        sparkles = VGroup(*[
            Dot(color=random_bright_color(), radius=0.05).move_to(
                result.get_center() + np.array([np.random.uniform(-2,2), np.random.uniform(-1,1), 0])
            )
            for _ in range(20)
        ])
        self.play(FadeIn(sparkles, scale=0.5), run_time=0.5)
        self.wait(0.5)
        
        # Watermark
        watermark = Text("teknokul.com", font_size=20, color=WHITE, fill_opacity=0.5)
        watermark.to_corner(DR, buff=0.3)
        self.play(FadeIn(watermark))
        self.wait(1)
