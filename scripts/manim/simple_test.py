from manim import *

class SimpleTest(Scene):
    def construct(self):
        # Arka plan
        self.camera.background_color = "#0a0a1a"
        
        # Başlık
        title = Text("Teknokul Video Test", font_size=48, color=WHITE)
        self.play(Write(title), run_time=1.5)
        self.wait(0.5)
        
        self.play(title.animate.to_edge(UP))
        
        # Basit metin (LaTeX yok)
        step1 = Text("Adım 1: Denklemi yazalım", font_size=32, color=WHITE)
        step1.move_to(ORIGIN + UP)
        self.play(FadeIn(step1), run_time=0.8)
        self.wait(1)
        
        step2 = Text("Adım 2: Her iki taraftan 5 çıkaralım", font_size=32, color=YELLOW)
        step2.next_to(step1, DOWN, buff=0.5)
        self.play(FadeIn(step2), run_time=0.8)
        self.wait(1)
        
        step3 = Text("Sonuç: x = 5", font_size=40, color=GREEN)
        step3.next_to(step2, DOWN, buff=0.5)
        box = SurroundingRectangle(step3, color=GREEN, buff=0.2)
        self.play(Write(step3), Create(box), run_time=1)
        self.wait(1)
        
        # Watermark
        watermark = Text("teknokul.com", font_size=20, color=WHITE, fill_opacity=0.5)
        watermark.to_corner(DR, buff=0.3)
        self.play(FadeIn(watermark))
        self.wait(1)
