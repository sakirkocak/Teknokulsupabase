from PIL import Image, ImageDraw, ImageFont
import os

# YouTube thumbnail boyutu: 1280x720
WIDTH = 1280
HEIGHT = 720

# Teknokul renkleri
COLORS = {
    "bg_dark": "#0a0a1a",
    "bg_gradient": "#1a1a3a",
    "primary": "#6366f1",
    "secondary": "#22d3ee",
    "success": "#10b981",
    "warning": "#f59e0b",
    "error": "#ef4444",
    "gold": "#fbbf24",
    "white": "#ffffff",
}

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_gradient_background(width, height, color1, color2):
    """Gradient arka plan oluştur"""
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    r1, g1, b1 = hex_to_rgb(color1)
    r2, g2, b2 = hex_to_rgb(color2)
    
    for y in range(height):
        ratio = y / height
        r = int(r1 + (r2 - r1) * ratio)
        g = int(g1 + (g2 - g1) * ratio)
        b = int(b1 + (b2 - b1) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    return img

def create_thumbnail(question_text, subject, grade, style="default"):
    """
    YouTube thumbnail oluştur
    
    style: "default", "epic", "fun", "minimal"
    """
    # Arka plan
    if style == "epic":
        img = create_gradient_background(WIDTH, HEIGHT, "#1a0a2e", "#0a1a3e")
        accent_color = COLORS["gold"]
        emoji = "⚔️"
    elif style == "fun":
        img = create_gradient_background(WIDTH, HEIGHT, "#0a2a1a", "#1a3a2a")
        accent_color = COLORS["success"]
        emoji = "🎮"
    elif style == "minimal":
        img = create_gradient_background(WIDTH, HEIGHT, "#1a1a2a", "#0a0a1a")
        accent_color = COLORS["secondary"]
        emoji = "📐"
    else:
        img = create_gradient_background(WIDTH, HEIGHT, "#0a0a2a", "#1a1a4a")
        accent_color = COLORS["primary"]
        emoji = "🧮"
    
    draw = ImageDraw.Draw(img)
    
    # Font yükle (sistem fontları)
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 72)
        font_medium = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
        font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
        font_emoji = ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc", 80)
    except:
        font_large = ImageFont.load_default()
        font_medium = font_large
        font_small = font_large
        font_emoji = font_large
    
    # Sol üst köşe - Teknokul badge
    badge_text = "teknokul"
    draw.rounded_rectangle([30, 30, 220, 80], radius=10, fill=hex_to_rgb(COLORS["primary"]))
    draw.text((50, 40), badge_text, fill=hex_to_rgb(COLORS["white"]), font=font_small)
    
    # Sağ üst köşe - Ders ve sınıf
    info_text = f"{subject} • {grade}. Sınıf"
    draw.text((WIDTH - 350, 45), info_text, fill=hex_to_rgb(COLORS["secondary"]), font=font_small)
    
    # Ana içerik kutusu
    box_margin = 60
    box_top = 120
    box_height = 400
    draw.rounded_rectangle(
        [box_margin, box_top, WIDTH - box_margin, box_top + box_height],
        radius=20,
        fill=(20, 20, 40, 200),
        outline=hex_to_rgb(accent_color),
        width=3
    )
    
    # Soru metni (ortada)
    # Metni kısalt eğer çok uzunsa
    if len(question_text) > 40:
        question_text = question_text[:37] + "..."
    
    # Soru metnini ortala
    bbox = draw.textbbox((0, 0), question_text, font=font_large)
    text_width = bbox[2] - bbox[0]
    text_x = (WIDTH - text_width) // 2
    text_y = box_top + 80
    
    # Gölge efekti
    draw.text((text_x + 3, text_y + 3), question_text, fill=(0, 0, 0), font=font_large)
    draw.text((text_x, text_y), question_text, fill=hex_to_rgb(COLORS["white"]), font=font_large)
    
    # "VİDEOLU ÇÖZÜM" etiketi
    solution_text = "📹 VİDEOLU ÇÖZÜM"
    bbox = draw.textbbox((0, 0), solution_text, font=font_medium)
    text_width = bbox[2] - bbox[0]
    text_x = (WIDTH - text_width) // 2
    text_y = box_top + 200
    
    # Parlak kutu
    draw.rounded_rectangle(
        [text_x - 30, text_y - 15, text_x + text_width + 30, text_y + 60],
        radius=10,
        fill=hex_to_rgb(accent_color)
    )
    draw.text((text_x, text_y), solution_text, fill=hex_to_rgb("#000000"), font=font_medium)
    
    # Alt kısım - "Adım Adım Anlatım"
    bottom_text = "✨ Adım Adım Anlatım • AI Sesli"
    bbox = draw.textbbox((0, 0), bottom_text, font=font_small)
    text_width = bbox[2] - bbox[0]
    text_x = (WIDTH - text_width) // 2
    draw.text((text_x, box_top + 320), bottom_text, fill=hex_to_rgb(COLORS["white"]), font=font_small)
    
    # Dekoratif elementler
    # Sol alt - büyük emoji
    draw.text((80, HEIGHT - 150), emoji, fill=hex_to_rgb(COLORS["white"]), font=font_emoji)
    
    # Sağ alt - "TIKLA İZLE" butonu
    button_text = "▶ TIKLA İZLE"
    draw.rounded_rectangle(
        [WIDTH - 280, HEIGHT - 100, WIDTH - 40, HEIGHT - 40],
        radius=15,
        fill=hex_to_rgb(COLORS["error"])
    )
    draw.text((WIDTH - 250, HEIGHT - 90), button_text, fill=hex_to_rgb(COLORS["white"]), font=font_small)
    
    return img

# Test thumbnail'leri oluştur
print("🖼️ Thumbnail'ler oluşturuluyor...")

# 1. Default stil
img1 = create_thumbnail("2x + 5 = 15", "Matematik", 7, "default")
img1.save("thumbnails/thumb_default.png")
print("✅ Default thumbnail")

# 2. Epic stil
img2 = create_thumbnail("x² - 9 = 0", "Matematik", 8, "epic")
img2.save("thumbnails/thumb_epic.png")
print("✅ Epic thumbnail")

# 3. Fun stil
img3 = create_thumbnail("3 + 5 × 2 = ?", "Matematik", 5, "fun")
img3.save("thumbnails/thumb_fun.png")
print("✅ Fun thumbnail")

# 4. Minimal stil
img4 = create_thumbnail("sin²θ + cos²θ = ?", "Matematik", 11, "minimal")
img4.save("thumbnails/thumb_minimal.png")
print("✅ Minimal thumbnail")

print("\n📁 Thumbnail'ler: scripts/manim/thumbnails/")
