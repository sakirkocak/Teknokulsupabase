from manim import *

config.pixel_width = 1280
config.pixel_height = 720
config.frame_rate = 1

class ThumbnailDefault(Scene):
    def construct(self):
        self.camera.background_color = "#0a0a2a"
        
        # Gradient efekti için dikdörtgenler
        for i in range(10):
            rect = Rectangle(
                width=14.5, height=8.2,
                fill_color=interpolate_color(
                    ManimColor("#0a0a2a"), 
                    ManimColor("#1a1a4a"), 
                    i/10
                ),
                fill_opacity=0.3,
                stroke_width=0
            )
            rect.shift(DOWN * i * 0.3)
            self.add(rect)
        
        # Teknokul badge (sol üst)
        badge = VGroup(
            RoundedRectangle(corner_radius=0.1, width=2, height=0.5, fill_color="#6366f1", fill_opacity=1, stroke_width=0),
            Text("teknokul", font_size=24, color=WHITE)
        )
        badge[1].move_to(badge[0].get_center())
        badge.to_corner(UL, buff=0.3)
        self.add(badge)
        
        # Ders bilgisi (sağ üst)
        info = Text("Matematik - 7. Sinif", font_size=24, color="#22d3ee")
        info.to_corner(UR, buff=0.4)
        self.add(info)
        
        # Ana kutu
        main_box = RoundedRectangle(
            corner_radius=0.2, width=12, height=4.5,
            fill_color="#0a0a1a", fill_opacity=0.8,
            stroke_color="#6366f1", stroke_width=4
        )
        main_box.shift(UP * 0.3)
        self.add(main_box)
        
        # Soru metni (büyük)
        question = Text("2x + 5 = 15", font_size=72, color=WHITE, weight=BOLD)
        question.shift(UP * 1.2)
        self.add(question)
        
        # Videolu Çözüm butonu
        button_bg = RoundedRectangle(
            corner_radius=0.15, width=5, height=0.9,
            fill_color="#6366f1", fill_opacity=1, stroke_width=0
        )
        button_text = Text("VIDEOLU COZUM", font_size=36, color=WHITE, weight=BOLD)
        button = VGroup(button_bg, button_text)
        button[1].move_to(button[0].get_center())
        button.shift(DOWN * 0.3)
        self.add(button)
        
        # Alt metin
        sub_text = Text("Adim Adim Anlatim - AI Sesli", font_size=28, color="#9ca3af")
        sub_text.shift(DOWN * 1.3)
        self.add(sub_text)
        
        # Play butonu (sağ alt)
        play_bg = RoundedRectangle(
            corner_radius=0.15, width=3, height=0.7,
            fill_color="#ef4444", fill_opacity=1, stroke_width=0
        )
        play_text = Text("TIKLA IZLE", font_size=28, color=WHITE, weight=BOLD)
        play_btn = VGroup(play_bg, play_text)
        play_btn[1].move_to(play_btn[0].get_center())
        play_btn.to_corner(DR, buff=0.4)
        self.add(play_btn)
        
        # Play ikonu (sol alt)
        play_icon = Triangle(fill_color=WHITE, fill_opacity=0.8, stroke_width=0)
        play_icon.scale(0.5).rotate(-PI/2)
        circle = Circle(radius=0.6, fill_color="#6366f1", fill_opacity=0.3, stroke_color=WHITE, stroke_width=2)
        play_group = VGroup(circle, play_icon)
        play_group.to_corner(DL, buff=0.5)
        self.add(play_group)

class ThumbnailEpic(Scene):
    def construct(self):
        self.camera.background_color = "#1a0a2e"
        
        # Gradient
        for i in range(10):
            rect = Rectangle(width=14.5, height=8.2,
                fill_color=interpolate_color(ManimColor("#1a0a2e"), ManimColor("#0a1a3e"), i/10),
                fill_opacity=0.3, stroke_width=0)
            rect.shift(DOWN * i * 0.3)
            self.add(rect)
        
        # Badge
        badge = VGroup(
            RoundedRectangle(corner_radius=0.1, width=2, height=0.5, fill_color="#fbbf24", fill_opacity=1, stroke_width=0),
            Text("teknokul", font_size=24, color="#000000")
        )
        badge[1].move_to(badge[0].get_center())
        badge.to_corner(UL, buff=0.3)
        self.add(badge)
        
        # Info
        info = Text("Matematik - 8. Sinif", font_size=24, color="#fbbf24")
        info.to_corner(UR, buff=0.4)
        self.add(info)
        
        # Main box
        main_box = RoundedRectangle(corner_radius=0.2, width=12, height=4.5,
            fill_color="#0a0a1a", fill_opacity=0.8,
            stroke_color="#fbbf24", stroke_width=4)
        main_box.shift(UP * 0.3)
        self.add(main_box)
        
        # Question
        question = Text("x² - 9 = 0", font_size=80, color=WHITE, weight=BOLD)
        question.shift(UP * 1.2)
        self.add(question)
        
        # Epic badge
        epic_badge = VGroup(
            RoundedRectangle(corner_radius=0.1, width=1.5, height=0.4, fill_color="#ef4444", fill_opacity=1, stroke_width=0),
            Text("EPIC", font_size=20, color=WHITE)
        )
        epic_badge[1].move_to(epic_badge[0].get_center())
        epic_badge.next_to(question, RIGHT, buff=0.3)
        self.add(epic_badge)
        
        # Button
        button_bg = RoundedRectangle(corner_radius=0.15, width=5, height=0.9,
            fill_color="#fbbf24", fill_opacity=1, stroke_width=0)
        button_text = Text("VIDEOLU COZUM", font_size=36, color="#000000", weight=BOLD)
        button = VGroup(button_bg, button_text)
        button[1].move_to(button[0].get_center())
        button.shift(DOWN * 0.3)
        self.add(button)
        
        # Sub text
        sub_text = Text("Zor Soru - Detayli Anlatim", font_size=28, color="#9ca3af")
        sub_text.shift(DOWN * 1.3)
        self.add(sub_text)
        
        # Play button
        play_bg = RoundedRectangle(corner_radius=0.15, width=3, height=0.7,
            fill_color="#ef4444", fill_opacity=1, stroke_width=0)
        play_text = Text("TIKLA IZLE", font_size=28, color=WHITE, weight=BOLD)
        play_btn = VGroup(play_bg, play_text)
        play_btn[1].move_to(play_btn[0].get_center())
        play_btn.to_corner(DR, buff=0.4)
        self.add(play_btn)

class ThumbnailFun(Scene):
    def construct(self):
        self.camera.background_color = "#0a2a1a"
        
        # Gradient
        for i in range(10):
            rect = Rectangle(width=14.5, height=8.2,
                fill_color=interpolate_color(ManimColor("#0a2a1a"), ManimColor("#1a4a2a"), i/10),
                fill_opacity=0.3, stroke_width=0)
            rect.shift(DOWN * i * 0.3)
            self.add(rect)
        
        # Badge
        badge = VGroup(
            RoundedRectangle(corner_radius=0.1, width=2, height=0.5, fill_color="#10b981", fill_opacity=1, stroke_width=0),
            Text("teknokul", font_size=24, color=WHITE)
        )
        badge[1].move_to(badge[0].get_center())
        badge.to_corner(UL, buff=0.3)
        self.add(badge)
        
        # Info
        info = Text("Matematik - 5. Sinif", font_size=24, color="#10b981")
        info.to_corner(UR, buff=0.4)
        self.add(info)
        
        # Main box
        main_box = RoundedRectangle(corner_radius=0.2, width=12, height=4.5,
            fill_color="#0a0a1a", fill_opacity=0.8,
            stroke_color="#10b981", stroke_width=4)
        main_box.shift(UP * 0.3)
        self.add(main_box)
        
        # Question
        question = Text("3 + 5 x 2 = ?", font_size=80, color=WHITE, weight=BOLD)
        question.shift(UP * 1.2)
        self.add(question)
        
        # Fun badge
        fun_badge = VGroup(
            RoundedRectangle(corner_radius=0.1, width=1.5, height=0.4, fill_color="#f59e0b", fill_opacity=1, stroke_width=0),
            Text("FUN", font_size=20, color=WHITE)
        )
        fun_badge[1].move_to(fun_badge[0].get_center())
        fun_badge.next_to(question, RIGHT, buff=0.3)
        self.add(fun_badge)
        
        # Button
        button_bg = RoundedRectangle(corner_radius=0.15, width=5, height=0.9,
            fill_color="#10b981", fill_opacity=1, stroke_width=0)
        button_text = Text("VIDEOLU COZUM", font_size=36, color=WHITE, weight=BOLD)
        button = VGroup(button_bg, button_text)
        button[1].move_to(button[0].get_center())
        button.shift(DOWN * 0.3)
        self.add(button)
        
        # Sub text
        sub_text = Text("Eglenceli Anlatim - Kolay Ogrenme", font_size=28, color="#9ca3af")
        sub_text.shift(DOWN * 1.3)
        self.add(sub_text)
        
        # Play button
        play_bg = RoundedRectangle(corner_radius=0.15, width=3, height=0.7,
            fill_color="#ef4444", fill_opacity=1, stroke_width=0)
        play_text = Text("TIKLA IZLE", font_size=28, color=WHITE, weight=BOLD)
        play_btn = VGroup(play_bg, play_text)
        play_btn[1].move_to(play_btn[0].get_center())
        play_btn.to_corner(DR, buff=0.4)
        self.add(play_btn)

        # Stars decoration
        for i in range(5):
            star = Star(5, outer_radius=0.15, fill_color=YELLOW, fill_opacity=0.7, stroke_width=0)
            star.move_to([-5 + i*2.5, -3, 0])
            self.add(star)
