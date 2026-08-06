from manim import *

class EpicTest(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a1a"
        self.add_sound("audio/voice_epic.mp3")
        
        # Dramatik giriş
        title = Text("⚔️ MATEMATİK SAVAŞI", font_size=48, color=WHITE)
        badge = Text("EPIC", font_size=20, color="#ef4444")
        badge.next_to(title, DOWN, buff=0.2)
        
        self.play(FadeIn(title, scale=0.5), run_time=1.2)
        self.play(FadeIn(badge))
        self.wait(0.5)
        
        self.play(FadeOut(badge), title.animate.to_edge(UP).scale(0.6))
        
        # Problem - dramatik reveal
        eq1 = Text("2x + 5 = 15", font_size=60, color=WHITE)
        eq1.set_opacity(0)
        self.add(eq1)
        self.play(eq1.animate.set_opacity(1), run_time=1.2)
        self.wait(0.8)
        
        # Adım 1 - kırmızı vurgu
        flash1 = SurroundingRectangle(eq1, color=RED, buff=0.1)
        self.play(Create(flash1), run_time=0.3)
        self.play(FadeOut(flash1), run_time=0.3)
        
        step1 = Text("5'i yok et!", font_size=28, color=RED)
        step1.next_to(eq1, DOWN, buff=0.3)
        self.play(Write(step1), run_time=0.5)
        
        eq2 = Text("2x = 10", font_size=60, color=ORANGE)
        eq2.next_to(step1, DOWN, buff=0.4)
        self.play(Write(eq2), run_time=1)
        self.wait(0.8)
        
        # Adım 2
        step2 = Text("2'yi parçala!", font_size=28, color=ORANGE)
        step2.next_to(eq2, DOWN, buff=0.3)
        self.play(Write(step2), run_time=0.5)
        
        # ZAFER!
        result = Text("x = 5", font_size=80, color=GOLD)
        result.next_to(step2, DOWN, buff=0.5)
        
        # Epic reveal
        self.play(
            FadeIn(result, scale=2),
            Flash(result.get_center(), color=GOLD, line_length=0.5),
            run_time=1
        )
        
        victory = Text("🏆 ZAFER!", font_size=36, color=GOLD)
        victory.next_to(result, DOWN, buff=0.3)
        self.play(Write(victory), run_time=0.5)
        
        watermark = Text("teknokul.com", font_size=20, color=WHITE, fill_opacity=0.5)
        watermark.to_corner(DR, buff=0.3)
        self.play(FadeIn(watermark))
        self.wait(1.5)
