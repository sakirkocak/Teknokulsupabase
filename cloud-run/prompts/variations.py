"""
Teknokul AI Çözüm Varyasyonu Sistemi
🎯 Google'ın AI pattern tespitini önlemek için doğal varyasyonlar

Bu modül, AI çözümlerindeki kalıpları kırarak:
1. Farklı açılış cümleleri
2. Farklı ton/üslup
3. Farklı adım sayısı
4. İnsansı dokunuşlar
ekler.
"""

import random
from typing import List, Optional

# =============================================================================
# AÇILIŞ CÜMLELERİ - HOOK'LAR
# =============================================================================

HOOK_VARIATIONS = {
    "merak": [
        "Bu soruyu çoğu öğrenci yanlış yapıyor!",
        "Dikkat! Bu soruda gizli bir tuzak var.",
        "Bu soruyu ilk bakışta herkes kolay sanıyor...",
        "Sınavlarda en çok karıştırılan soru tipi!",
        "Bu konuyu anlayanlar sınavda fark yaratıyor!",
        "Bir dakika! Bu soru göründüğü kadar basit değil.",
        "Çoğu öğrenci burada hata yapıyor, sen yapma!",
    ],
    "enerji": [
        "Hadi bu soruyu birlikte çözelim!",
        "Gel, bu sorunun üstesinden gelelim!",
        "Hazır mısın? Başlıyoruz!",
        "Bu soru seni bekliyor, hadi çözelim!",
        "Şimdi çok güzel bir soru çözeceğiz!",
        "Bu soruyu çözdüğünde çok mutlu olacaksın!",
    ],
    "samimi": [
        "Hmm, buna birlikte bakalım...",
        "Şimdi düşünelim, burada ne yapmalıyız?",
        "Önce sakin olalım ve soruyu inceleyelim.",
        "Bak, aslında çok basit bir mantığı var.",
        "Sana bir şey söyleyeyim, bu soru aslında kolay!",
    ],
    "ogretici": [
        "Bu soruda temel kuralı hatırlayalım.",
        "Önce formülümüzü yazalım...",
        "Adım adım ilerleyelim.",
        "Sistematik düşünelim.",
        "Mantık çerçevesinde yaklaşalım.",
    ]
}

# =============================================================================
# PÜF NOKTALARI - TIPS
# =============================================================================

TIPS_VARIATIONS = {
    "dikkat": [
        "DİKKAT! {}",
        "Önemli: {}",
        "Sakın unutma: {}",
        "Kritik nokta: {}",
        "Bunu aklında tut: {}",
    ],
    "hata": [
        "Sık yapılan hata: {}",
        "Burada herkes yanılıyor: {}",
        "Dikkat et, {}",
        "Tuzak: {}",
        "Yanılma, {}",
    ],
    "ipucu": [
        "İpucu: {}",
        "Püf noktası: {}",
        "Kısayol: {}",
        "Pratik yöntem: {}",
        "Kolaylaştıran bilgi: {}",
    ],
    "formul": [
        "Formülü hatırla: {}",
        "Temel kural: {}",
        "Altın kural: {}",
        "Her zaman geçerli: {}",
    ]
}

# =============================================================================
# KAPANIŞ CÜMLELERİ
# =============================================================================

CLOSING_VARIATIONS = [
    "Gördün mü, aslında ne kadar kolaymış!",
    "İşte bu kadar! Pratik yaptıkça daha da kolaylaşacak.",
    "Aferin! Şimdi benzer soruları da çözebilirsin.",
    "Harika! Bu konuyu artık anladın.",
    "Başardık! Bir sonraki soruda görüşmek üzere.",
    "Teknokul ile başarıya bir adım daha yaklaştın!",
    "Bu soruyu çözdün, sıradakine geç!",
    "Mükemmel! Devam et, çok iyi gidiyorsun.",
    "Anladın mı? Anlamadıysan tekrar izle!",
    "Kolay gelsin! Daha çok soru çöz, daha çok öğren.",
]

# =============================================================================
# İNSANSI DOKUNUŞLAR
# =============================================================================

HUMAN_TOUCHES = [
    "Şimdi düşünelim...",
    "Bakalım ne yapabiliriz...",
    "Hmm, burada şöyle düşünmemiz gerekiyor...",
    "Bir saniye, önce şunu anlayalım...",
    "Aslında çok basit...",
    "Bak şimdi...",
    "Dikkatli ol burada...",
    "İşin püf noktası şu...",
    "Burada bir incelik var...",
]

TRANSITION_PHRASES = [
    "Şimdi bir sonraki adıma geçelim.",
    "Devam edelim...",
    "Buraya kadar anladıysan, devam!",
    "Güzel, şimdi...",
    "Tamam, şimdi...",
    "Peki, sırada ne var?",
    "Bir adım daha...",
    "Ve son olarak...",
]

# =============================================================================
# DERS BAZLI ÖZEL VARYASYONLAR
# =============================================================================

SUBJECT_SPECIFIC_PHRASES = {
    "Matematik": {
        "hooks": [
            "Matematikte her şeyin bir mantığı var!",
            "Bu problem çok klasik, hadi çözelim!",
            "Formülü biliyorsan, gerisi kolay!",
        ],
        "tips": [
            "Matematiksel işlem sırasına dikkat!",
            "Birim dönüşümlerini kontrol et!",
            "Sonucu yaklaşık değerle doğrula!",
        ]
    },
    "Fizik": {
        "hooks": [
            "Fizikte doğayı anlıyoruz!",
            "Bu olay günlük hayatta sürekli karşına çıkıyor!",
            "Newton bunu yıllar önce çözmüştü!",
        ],
        "tips": [
            "Birimleri mutlaka kontrol et!",
            "Yönlere dikkat, vektörel hesap!",
            "Şemayı çizmeden başlama!",
        ]
    },
    "Kimya": {
        "hooks": [
            "Kimya aslında bir dil, öğrenince her şey açılıyor!",
            "Periyodik tablo senin en iyi arkadaşın!",
            "Elementler arasındaki dans başlıyor!",
        ],
        "tips": [
            "Denklem denkleştirmeyi unutma!",
            "Mol kavramını iyi anla!",
            "Elektron sayısına dikkat!",
        ]
    },
    "Biyoloji": {
        "hooks": [
            "Canlılar dünyasına hoş geldin!",
            "Vücudumuz nasıl çalışıyor, bakalım!",
            "Doğanın mükemmel tasarımına bir örnek!",
        ],
        "tips": [
            "Yapı-görev ilişkisini düşün!",
            "Karşılaştırma yapmayı unutma!",
            "Süreçleri sırayla hatırla!",
        ]
    },
    "Türkçe": {
        "hooks": [
            "Dilimizin güzelliğine bir örnek!",
            "Cümlelerin gizli anlamı var!",
            "Kelimeler düşündüğünden fazlasını söyler!",
        ],
        "tips": [
            "Cümleyi dikkatli oku, acele etme!",
            "Bağlama göre anlam değişir!",
            "Ögeleri teker teker bul!",
        ]
    }
}

# =============================================================================
# ANA FONKSİYONLAR
# =============================================================================

def get_random_hook(style: str = None, subject: str = None) -> str:
    """Rastgele açılış cümlesi döndür"""
    
    # Ders bazlı hook varsa %30 ihtimalle kullan
    if subject and subject in SUBJECT_SPECIFIC_PHRASES and random.random() < 0.3:
        hooks = SUBJECT_SPECIFIC_PHRASES[subject].get("hooks", [])
        if hooks:
            return random.choice(hooks)
    
    # Stil belirtilmişse
    if style and style in HOOK_VARIATIONS:
        return random.choice(HOOK_VARIATIONS[style])
    
    # Rastgele stil seç
    style = random.choice(list(HOOK_VARIATIONS.keys()))
    return random.choice(HOOK_VARIATIONS[style])


def get_random_tip(tip_text: str, style: str = None, subject: str = None) -> str:
    """Rastgele formatlı püf noktası döndür"""
    
    # Ders bazlı tip varsa %40 ihtimalle kullan
    if subject and subject in SUBJECT_SPECIFIC_PHRASES and random.random() < 0.4:
        tips = SUBJECT_SPECIFIC_PHRASES[subject].get("tips", [])
        if tips:
            return random.choice(tips)
    
    # Stil belirtilmişse
    if style and style in TIPS_VARIATIONS:
        template = random.choice(TIPS_VARIATIONS[style])
        return template.format(tip_text)
    
    # Rastgele stil seç
    style = random.choice(list(TIPS_VARIATIONS.keys()))
    template = random.choice(TIPS_VARIATIONS[style])
    return template.format(tip_text)


def get_random_closing() -> str:
    """Rastgele kapanış cümlesi döndür"""
    return random.choice(CLOSING_VARIATIONS)


def get_random_human_touch() -> str:
    """Rastgele insansı dokunuş döndür"""
    return random.choice(HUMAN_TOUCHES)


def get_random_transition() -> str:
    """Rastgele geçiş cümlesi döndür"""
    return random.choice(TRANSITION_PHRASES)


def add_variations_to_text(text: str, variation_chance: float = 0.3) -> str:
    """
    Metne rastgele varyasyonlar ekle
    - İnsansı dokunuşlar
    - Geçiş cümleleri
    """
    if random.random() > variation_chance:
        return text
    
    # %50 ihtimalle başa insansı dokunuş ekle
    if random.random() < 0.5:
        touch = get_random_human_touch()
        text = f"{touch} {text}"
    
    return text


def get_step_count_variation() -> int:
    """
    Çözüm adım sayısı için varyasyon
    - %60: 3 adım
    - %25: 4 adım
    - %15: 2 adım
    """
    r = random.random()
    if r < 0.6:
        return 3
    elif r < 0.85:
        return 4
    else:
        return 2


def should_add_emoji() -> bool:
    """
    Emoji kullanılsın mı?
    - %70 ihtimalle evet
    """
    return random.random() < 0.7


# =============================================================================
# PROMPT VARYASYONU
# =============================================================================

def get_varied_system_prompt(base_prompt: str, subject: str = None) -> str:
    """
    Sistem promptuna varyasyon ekle
    - Farklı ton direktifleri
    - Farklı format talepleri
    """
    
    tone_variations = [
        "Samimi ve arkadaşça bir dil kullan.",
        "Enerjik ve motive edici ol.",
        "Sakin ve açıklayıcı bir ton kullan.",
        "Meraklı ve sorgulayıcı bir üslup benimse.",
        "Profesyonel ama sıcak bir dil kullan.",
    ]
    
    format_variations = [
        "Kısa ve öz cümleler kur.",
        "Detaylı ama anlaşılır açıklamalar yap.",
        "Örneklerle destekle.",
        "Adım adım mantıklı ilerle.",
        "Görselleştirmeye önem ver.",
    ]
    
    selected_tone = random.choice(tone_variations)
    selected_format = random.choice(format_variations)
    
    variation_addition = f"""

UYARILAR:
- {selected_tone}
- {selected_format}
- Her çözümde farklı açılış cümleleri kullan.
- Kalıplaşmış ifadelerden kaçın.
- Doğal ve akıcı bir anlatım tercih et.
"""
    
    return base_prompt + variation_addition


# =============================================================================
# EXPORT
# =============================================================================

__all__ = [
    'get_random_hook',
    'get_random_tip', 
    'get_random_closing',
    'get_random_human_touch',
    'get_random_transition',
    'add_variations_to_text',
    'get_step_count_variation',
    'should_add_emoji',
    'get_varied_system_prompt',
    'HOOK_VARIATIONS',
    'TIPS_VARIATIONS',
    'CLOSING_VARIATIONS',
    'SUBJECT_SPECIFIC_PHRASES',
]
