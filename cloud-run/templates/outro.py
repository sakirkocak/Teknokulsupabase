"""
Teknokul Outro Animasyonu
🎬 Her videonun sonuna eklenen profesyonel kapanış
"""

OUTRO_SCENE_CODE = '''
class OutroScene(Scene):
    def construct(self):
        # Arkaplan
        self.camera.background_color = "#0f0f23"
        
        # 1. Ekranı karart
        fade_rect = Rectangle(width=20, height=40, fill_color="#0f0f23", fill_opacity=1)
        self.add(fade_rect)
        
        # 2. Teknokul Logosu (Metin versiyonu)
        # Ana logo
        tekno = Text("Tekno", font="Noto Sans", font_size=72, color=WHITE, weight=BOLD)
        kul = Text("kul", font="Noto Sans", font_size=72, color="#EF4444", weight=BOLD)
        logo_text = VGroup(tekno, kul).arrange(RIGHT, buff=0)
        logo_text.move_to(UP * 1)
        
        # Slogan
        slogan = Text("Eğitimin Dijital Üssü", font="Noto Sans", font_size=28, color="#9CA3AF")
        slogan.next_to(logo_text, DOWN, buff=0.4)
        
        # AI Badge
        ai_badge = VGroup(
            RoundedRectangle(width=2.5, height=0.6, corner_radius=0.3, 
                           fill_color="#8B5CF6", fill_opacity=1, stroke_width=0),
            Text("Powered by AI", font="Noto Sans", font_size=16, color=WHITE)
        )
        ai_badge[1].move_to(ai_badge[0].get_center())
        ai_badge.next_to(slogan, DOWN, buff=0.3)
        
        # Logo animasyonu
        self.play(
            FadeIn(tekno, shift=LEFT),
            FadeIn(kul, shift=RIGHT),
            run_time=0.6
        )
        self.play(
            FadeIn(slogan, shift=UP),
            run_time=0.4
        )
        self.play(
            GrowFromCenter(ai_badge),
            run_time=0.3
        )
        
        # 3. Sosyal medya çağrısı
        cta = Text("Takip Et  •  Abone Ol  •  Paylaş", font="Noto Sans", 
                   font_size=22, color="#22C55E")
        cta.to_edge(DOWN, buff=2)
        
        self.play(Write(cta), run_time=0.5)
        
        # 4. Parlama efekti
        self.play(
            Flash(logo_text.get_center(), color="#8B5CF6", line_length=0.5, num_lines=12),
            run_time=0.4
        )
        
        # 5. Son bekleme
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
        # OUTRO - Teknokul Kapanış
        # ════════════════════════════════════════════════════════════════
        
        # Tüm elementleri temizle
        self.play(*[FadeOut(mob) for mob in self.mobjects if mob != logo], run_time=0.5)
        self.remove(logo)
        
        # Ekranı karart
        self.wait(0.3)
        
        # Teknokul Logosu
        tekno = Text("Tekno", font="Noto Sans", font_size=72, color=WHITE, weight=BOLD)
        kul = Text("kul", font="Noto Sans", font_size=72, color="#EF4444", weight=BOLD)
        logo_main = VGroup(tekno, kul).arrange(RIGHT, buff=0)
        logo_main.move_to(UP * 1)
        
        # Slogan
        slogan = Text("Eğitimin Dijital Üssü", font="Noto Sans", font_size=28, color="#9CA3AF")
        slogan.next_to(logo_main, DOWN, buff=0.4)
        
        # AI Badge
        ai_box = RoundedRectangle(width=2.5, height=0.6, corner_radius=0.3,
                                   fill_color="#8B5CF6", fill_opacity=1, stroke_width=0)
        ai_text = Text("Powered by AI", font="Noto Sans", font_size=16, color=WHITE)
        ai_text.move_to(ai_box.get_center())
        ai_badge = VGroup(ai_box, ai_text)
        ai_badge.next_to(slogan, DOWN, buff=0.3)
        
        # Animasyonlar
        self.play(FadeIn(tekno, shift=LEFT), FadeIn(kul, shift=RIGHT), run_time=0.6)
        self.play(FadeIn(slogan, shift=UP), run_time=0.4)
        self.play(GrowFromCenter(ai_badge), run_time=0.3)
        
        # Sosyal medya
        cta = Text("Takip Et  •  Abone Ol  •  Paylaş", font="Noto Sans",
                   font_size=22, color="#22C55E")
        cta.to_edge(DOWN, buff=2)
        self.play(Write(cta), run_time=0.5)
        
        # Parlama
        self.play(Flash(logo_main.get_center(), color="#8B5CF6", line_length=0.5, num_lines=12), run_time=0.4)
        
        self.wait(1.5)
'''


def get_outro_integration_code() -> str:
    """Ana videoya entegre edilecek outro kodu"""
    return OUTRO_INTEGRATION_CODE
