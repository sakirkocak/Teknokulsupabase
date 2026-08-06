"""
Teknokul Manim Theme
3Blue1Brown tarzı matematik animasyonları için Teknokul teması
"""

from manim import *

# Teknokul Renk Paleti
TEKNOKUL_COLORS = {
    "background": "#0a0a1a",      # Koyu lacivert
    "primary": "#6366f1",          # Indigo (marka rengi)
    "secondary": "#22d3ee",        # Cyan
    "success": "#10b981",          # Yeşil (doğru cevap)
    "warning": "#f59e0b",          # Sarı (vurgu)
    "error": "#ef4444",            # Kırmızı (yanlış)
    "text": "#ffffff",             # Beyaz metin
    "text_dim": "#9ca3af",         # Soluk metin
    "highlight": "#a855f7",        # Mor vurgu
}

# Manim Color objelerine çevir
TEKNOKUL_BG = TEKNOKUL_COLORS["background"]
TEKNOKUL_PRIMARY = TEKNOKUL_COLORS["primary"]
TEKNOKUL_SECONDARY = TEKNOKUL_COLORS["secondary"]
TEKNOKUL_SUCCESS = TEKNOKUL_COLORS["success"]
TEKNOKUL_WARNING = TEKNOKUL_COLORS["warning"]
TEKNOKUL_ERROR = TEKNOKUL_COLORS["error"]
TEKNOKUL_TEXT = TEKNOKUL_COLORS["text"]
TEKNOKUL_HIGHLIGHT = TEKNOKUL_COLORS["highlight"]


class TeknokulScene(Scene):
    """Teknokul temalı base scene"""
    
    def setup(self):
        self.camera.background_color = TEKNOKUL_BG
    
    def add_logo(self, position=DOWN + RIGHT, scale=0.3):
        """Sağ alt köşeye Teknokul logosu ekle"""
        logo_text = Text("teknokul.com", font_size=24, color=TEKNOKUL_TEXT)
        logo_text.scale(scale)
        logo_text.to_corner(DR, buff=0.3)
        self.add(logo_text)
        return logo_text
    
    def add_watermark(self):
        """Watermark ekle"""
        watermark = Text("teknokul.com", font_size=16, color="#ffffff", fill_opacity=0.3)
        watermark.to_corner(DR, buff=0.2)
        self.add(watermark)
        return watermark


class QuestionScene(TeknokulScene):
    """Soru çözümü için özel scene"""
    
    def __init__(self, question_data=None, **kwargs):
        super().__init__(**kwargs)
        self.question_data = question_data or {}
    
    def show_question(self, question_text, options=None):
        """Soruyu ekranda göster"""
        # Soru metni
        question = Text(question_text, font_size=32, color=TEKNOKUL_TEXT)
        question.to_edge(UP, buff=0.5)
        
        self.play(Write(question), run_time=1.5)
        
        # Şıklar varsa göster
        if options:
            option_group = VGroup()
            for key, value in options.items():
                opt_text = Text(f"{key}) {value}", font_size=24, color=TEKNOKUL_TEXT)
                option_group.add(opt_text)
            
            option_group.arrange(DOWN, aligned_edge=LEFT, buff=0.3)
            option_group.next_to(question, DOWN, buff=0.8)
            
            self.play(FadeIn(option_group, shift=UP), run_time=1)
        
        return question
    
    def show_step(self, step_text, position=ORIGIN, color=TEKNOKUL_TEXT):
        """Çözüm adımı göster"""
        step = MathTex(step_text, color=color, font_size=36)
        step.move_to(position)
        self.play(Write(step), run_time=1)
        return step
    
    def highlight_answer(self, answer_text, is_correct=True):
        """Doğru cevabı vurgula"""
        color = TEKNOKUL_SUCCESS if is_correct else TEKNOKUL_ERROR
        answer = Text(answer_text, font_size=40, color=color)
        answer.move_to(ORIGIN)
        
        # Parlama efekti
        self.play(
            Write(answer),
            answer.animate.scale(1.2),
            run_time=0.8
        )
        self.play(answer.animate.scale(1/1.2), run_time=0.3)
        
        return answer
    
    def show_correct_option(self, option_key):
        """Doğru şıkkı göster"""
        result = Text(f"Doğru Cevap: {option_key}", font_size=36, color=TEKNOKUL_SUCCESS)
        result.to_edge(DOWN, buff=1)
        
        # Kutucuk ekle
        box = SurroundingRectangle(result, color=TEKNOKUL_SUCCESS, buff=0.2)
        
        self.play(
            Write(result),
            Create(box),
            run_time=1
        )
        
        return VGroup(result, box)


class MathSolutionScene(TeknokulScene):
    """Matematik çözümü için özel scene"""
    
    def transform_equation(self, eq1, eq2, run_time=1.5):
        """Denklemi dönüştür"""
        self.play(TransformMatchingTex(eq1, eq2), run_time=run_time)
    
    def show_calculation(self, steps, position=ORIGIN):
        """Adım adım hesaplama göster"""
        current_pos = position + UP * 2
        equations = []
        
        for i, step in enumerate(steps):
            eq = MathTex(step, color=TEKNOKUL_TEXT)
            eq.move_to(current_pos)
            
            if i == 0:
                self.play(Write(eq), run_time=1)
            else:
                self.play(
                    FadeIn(eq, shift=DOWN * 0.3),
                    run_time=0.8
                )
            
            equations.append(eq)
            current_pos += DOWN * 0.8
        
        return equations
    
    def circle_answer(self, mobject, color=TEKNOKUL_SUCCESS):
        """Cevabı daire içine al"""
        circle = Circle(color=color)
        circle.surround(mobject, buff=0.2)
        self.play(Create(circle), run_time=0.5)
        return circle


# Video ayarları
VIDEO_CONFIG = {
    "pixel_width": 1920,
    "pixel_height": 1080,
    "frame_rate": 30,
    "background_color": TEKNOKUL_BG,
}

# Kısa video ayarları (mobil için)
VIDEO_CONFIG_SHORT = {
    "pixel_width": 1080,
    "pixel_height": 1920,
    "frame_rate": 30,
    "background_color": TEKNOKUL_BG,
}
