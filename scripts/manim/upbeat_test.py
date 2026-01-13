from manim import *

class UpbeatTest(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"
        self.add_sound("audio/voice_upbeat.mp3")
        
        # Enerjik giriş
        title = Text("🎯 Denklem Çözümü!", font_size=52, color=WHITE)
        badge = Text("UPBEAT", font_size=20, color="#22d3ee")
        badge.next_to(title, DOWN, buff=0.2)
        
        self.play(Write(title, run_time=0.8), FadeIn(badge, shift=UP))
        self.play(title.animate.scale(1.1), run_time=0.2)
        self.play(title.animate.scale(1/1.1), run_time=0.2)
        self.wait(0.3)
        
        self.play(FadeOut(badge), title.animate.to_edge(UP).scale(0.6))
        
        eq1 = Text("2x + 5 = 15", font_size=56, color=WHITE)
        self.play(Write(eq1), run_time=1)
        self.wait(0.8)
        
        step1 = Text("→ 5 çıkar", font_size=28, color=YELLOW)
        step1.next_to(eq1, RIGHT, buff=0.5)
        self.play(FadeIn(step1, shift=LEFT), run_time=0.5)
        
        eq2 = Text("2x = 10", font_size=56, color=YELLOW)
        eq2.next_to(eq1, DOWN, buff=0.5)
        self.play(Write(eq2), run_time=0.8)
        self.wait(0.8)
        
        step2 = Text("→ 2'ye böl", font_size=28, color=GREEN)
        step2.next_to(eq2, RIGHT, buff=0.5)
        self.play(FadeIn(step2, shift=LEFT), run_time=0.5)
        
        result = Text("x = 5 ✓", font_size=72, color=GREEN)
        result.next_to(eq2, DOWN, buff=0.5)
        box = SurroundingRectangle(result, color=GREEN, buff=0.2)
        
        self.play(Write(result), Create(box), run_time=1)
        self.play(Indicate(result, color=WHITE), run_time=0.5)
        
        watermark = Text("teknokul.com", font_size=20, color=WHITE, fill_opacity=0.5)
        watermark.to_corner(DR, buff=0.3)
        self.play(FadeIn(watermark))
        self.wait(1.5)
