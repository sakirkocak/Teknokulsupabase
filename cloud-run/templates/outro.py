"""
Teknokul Outro Animasyonu
🎬 Her videonun sonuna eklenen profesyonel kapanış
🎨 Yeni TK Logo ile gradient arka plan
"""

import os

# Logo URL'si (Supabase Storage)
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
LOGO_PATH = "assets/teknokul-logo.png"

OUTRO_SCENE_CODE = '''
class OutroScene(Scene):
    def construct(self):
        # 1. Gradient Arkaplan (Mor -> Turuncu)
        # Mor-turuncu gradient için rectangle'lar
        bg_colors = ["#8B5CF6", "#9333EA", "#C026D3", "#E11D48", "#F97316", "#FB923C"]
        bg_rects = VGroup()
        for i, color in enumerate(bg_colors):
            rect = Rectangle(
                width=20, height=40/len(bg_colors),
                fill_color=color, fill_opacity=0.9, stroke_width=0
            )
            rect.move_to(UP * (3 - i * 1.2))
            bg_rects.add(rect)
        
        self.add(bg_rects)
        
        # 2. Logo alanı (koyu mor kutu)
        logo_box = RoundedRectangle(
            width=7, height=2.2, corner_radius=0.2,
            fill_color="#1e1b4b", fill_opacity=0.95, stroke_width=0
        )
        logo_box.move_to(UP * 0.5)
        
        # 3. TK Logo (Metin versiyonu - gerçek logo için ImageMobject kullanılabilir)
        # T harfi
        t_letter = Text("T", font="Noto Sans", font_size=90, color=WHITE, weight=BOLD)
        # K harfi (turuncu)
        k_letter = Text("K", font="Noto Sans", font_size=90, color="#F97316", weight=BOLD)
        tk_logo = VGroup(t_letter, k_letter).arrange(RIGHT, buff=-0.15)
        
        # Teknokul yazısı
        teknokul_text = Text("Teknokul", font="Noto Sans", font_size=48, color=WHITE, weight=BOLD)
        
        # Logo grubu
        full_logo = VGroup(tk_logo, teknokul_text).arrange(RIGHT, buff=0.3)
        full_logo.move_to(logo_box.get_center())
        
        # 4. Slogan
        slogan = Text("Eğitimin Dijital Üssü", font="Noto Sans", font_size=28, color="#E5E7EB")
        slogan.next_to(logo_box, DOWN, buff=0.5)
        
        # 5. AI Badge
        ai_box = RoundedRectangle(
            width=2.8, height=0.6, corner_radius=0.3,
            fill_color="#8B5CF6", fill_opacity=1, stroke_width=0
        )
        ai_text = Text("Powered by AI", font="Noto Sans", font_size=16, color=WHITE, weight=BOLD)
        ai_text.move_to(ai_box.get_center())
        ai_badge = VGroup(ai_box, ai_text)
        ai_badge.next_to(slogan, DOWN, buff=0.4)
        
        # 6. Sosyal medya
        cta = Text("Takip Et  •  Abone Ol  •  Paylaş", font="Noto Sans",
                   font_size=22, color="#22C55E", weight=BOLD)
        cta.to_edge(DOWN, buff=2.5)
        
        # 7. Sparkle efekti (sağ alt köşe)
        sparkle = Text("✦", font_size=40, color=WHITE).set_opacity(0.6)
        sparkle.to_corner(DR, buff=1)
        
        # ═══════════════════════════════════════
        # ANİMASYONLAR
        # ═══════════════════════════════════════
        
        # Logo kutusu fade in
        self.play(FadeIn(logo_box, scale=0.9), run_time=0.4)
        
        # TK Logo animasyonu
        self.play(
            FadeIn(tk_logo, shift=LEFT * 0.5),
            FadeIn(teknokul_text, shift=RIGHT * 0.5),
            run_time=0.5
        )
        
        # Slogan
        self.play(FadeIn(slogan, shift=UP * 0.3), run_time=0.3)
        
        # AI Badge
        self.play(GrowFromCenter(ai_badge), run_time=0.3)
        
        # CTA ve Sparkle
        self.play(
            Write(cta),
            FadeIn(sparkle, scale=0.5),
            run_time=0.4
        )
        
        # Parlama efekti
        self.play(
            Flash(full_logo.get_center(), color="#F97316", line_length=0.6, num_lines=16),
            run_time=0.4
        )
        
        # Logo hafif pulse
        self.play(
            full_logo.animate.scale(1.05),
            run_time=0.2
        )
        self.play(
            full_logo.animate.scale(1/1.05),
            run_time=0.2
        )
        
        # Son bekleme
        self.wait(1.5)
'''


def get_outro_code() -> str:
    """Outro scene kodunu döndür"""
    return OUTRO_SCENE_CODE


# FFmpeg ile outro ekleme komutu
def get_ffmpeg_concat_command(main_video: str, outro_video: str, output: str) -> list:
    """İki videoyu birleştirmek için FFmpeg komutu"""
    return [
        "ffmpeg", "-y",
        "-i", main_video,
        "-i", outro_video,
        "-filter_complex", "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[outv][outa]",
        "-map", "[outv]", "-map", "[outa]",
        "-c:v", "libx264", "-c:a", "aac",
        output
    ]


# Outro'yu ana videoya entegre etme (kod içinde)
OUTRO_INTEGRATION_CODE = '''
        # ════════════════════════════════════════════════════════════════
        # OUTRO - Teknokul Kapanış (Yeni Logo Tasarımı)
        # ════════════════════════════════════════════════════════════════
        
        # Tüm elementleri temizle
        self.play(*[FadeOut(mob) for mob in self.mobjects], run_time=0.5)
        
        # Gradient arkaplan (Mor -> Turuncu)
        bg_colors = ["#8B5CF6", "#9333EA", "#C026D3", "#E11D48", "#F97316", "#FB923C"]
        bg_rects = VGroup()
        for i, color in enumerate(bg_colors):
            rect = Rectangle(
                width=20, height=40/len(bg_colors),
                fill_color=color, fill_opacity=0.9, stroke_width=0
            )
            rect.move_to(UP * (3 - i * 1.2))
            bg_rects.add(rect)
        self.add(bg_rects)
        
        # Logo alanı (koyu mor kutu)
        logo_box = RoundedRectangle(
            width=7, height=2.2, corner_radius=0.2,
            fill_color="#1e1b4b", fill_opacity=0.95, stroke_width=0
        )
        logo_box.move_to(UP * 0.5)
        
        # TK Logo
        t_letter = Text("T", font="Noto Sans", font_size=90, color=WHITE, weight=BOLD)
        k_letter = Text("K", font="Noto Sans", font_size=90, color="#F97316", weight=BOLD)
        tk_logo = VGroup(t_letter, k_letter).arrange(RIGHT, buff=-0.15)
        
        teknokul_text = Text("Teknokul", font="Noto Sans", font_size=48, color=WHITE, weight=BOLD)
        full_logo = VGroup(tk_logo, teknokul_text).arrange(RIGHT, buff=0.3)
        full_logo.move_to(logo_box.get_center())
        
        # Slogan
        slogan = Text("Eğitimin Dijital Üssü", font="Noto Sans", font_size=28, color="#E5E7EB")
        slogan.next_to(logo_box, DOWN, buff=0.5)
        
        # AI Badge
        ai_box = RoundedRectangle(width=2.8, height=0.6, corner_radius=0.3,
                                   fill_color="#8B5CF6", fill_opacity=1, stroke_width=0)
        ai_text = Text("Powered by AI", font="Noto Sans", font_size=16, color=WHITE, weight=BOLD)
        ai_text.move_to(ai_box.get_center())
        ai_badge = VGroup(ai_box, ai_text)
        ai_badge.next_to(slogan, DOWN, buff=0.4)
        
        # Sosyal medya
        cta = Text("Takip Et  •  Abone Ol  •  Paylaş", font="Noto Sans",
                   font_size=22, color="#22C55E", weight=BOLD)
        cta.to_edge(DOWN, buff=2.5)
        
        # Sparkle
        sparkle = Text("✦", font_size=40, color=WHITE).set_opacity(0.6)
        sparkle.to_corner(DR, buff=1)
        
        # Animasyonlar
        self.play(FadeIn(logo_box, scale=0.9), run_time=0.4)
        self.play(
            FadeIn(tk_logo, shift=LEFT * 0.5),
            FadeIn(teknokul_text, shift=RIGHT * 0.5),
            run_time=0.5
        )
        self.play(FadeIn(slogan, shift=UP * 0.3), run_time=0.3)
        self.play(GrowFromCenter(ai_badge), run_time=0.3)
        self.play(Write(cta), FadeIn(sparkle, scale=0.5), run_time=0.4)
        
        # Parlama efekti
        self.play(Flash(full_logo.get_center(), color="#F97316", line_length=0.6, num_lines=16), run_time=0.4)
        
        # Pulse
        self.play(full_logo.animate.scale(1.05), run_time=0.2)
        self.play(full_logo.animate.scale(1/1.05), run_time=0.2)
        
        self.wait(1.5)
'''


def get_outro_integration_code() -> str:
    """Ana videoya entegre edilecek outro kodu"""
    return OUTRO_INTEGRATION_CODE
