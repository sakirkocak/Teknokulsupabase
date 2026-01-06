from manim import *

class TestScene(Scene):
    def construct(self):
        # Arka plan
        self.camera.background_color = "#0a0a1a"
        
        # Başlık
        title = Text("Teknokul Video Test", font_size=48, color=WHITE)
        self.play(Write(title), run_time=1.5)
        self.wait(0.5)
        
        # Matematik
        self.play(title.animate.to_edge(UP))
        
        eq1 = MathTex(r"2x + 5 = 15", color=WHITE, font_size=48)
        self.play(Write(eq1), run_time=1)
        self.wait(0.5)
        
        eq2 = MathTex(r"2x = 10", color=YELLOW, font_size=48)
        eq2.next_to(eq1, DOWN, buff=0.5)
        self.play(Write(eq2), run_time=1)
        self.wait(0.5)
        
        eq3 = MathTex(r"x = 5", color=GREEN, font_size=56)
        eq3.next_to(eq2, DOWN, buff=0.5)
        box = SurroundingRectangle(eq3, color=GREEN, buff=0.2)
        self.play(Write(eq3), Create(box), run_time=1)
        self.wait(1)
        
        # Watermark
        watermark = Text("teknokul.com", font_size=20, color=WHITE, fill_opacity=0.5)
        watermark.to_corner(DR, buff=0.3)
        self.play(FadeIn(watermark))
        self.wait(1)
