"""
Teknokul Video Factory - Base Template
Tüm template'lerin temel sınıfı
"""

# Ders bazlı template seçici
def get_template_for_subject(subject_name: str, topic_name: str = None) -> str:
    """
    Ders ve konuya göre uygun Manim template'ini seç
    """
    subject = (subject_name or "").lower().strip()
    topic = (topic_name or "").lower().strip()
    
    # Matematik
    if any(s in subject for s in ['matematik', 'math']):
        if any(t in topic for t in ['geometri', 'üçgen', 'daire', 'çember', 'alan', 'çevre', 'açı']):
            return 'matematik_geometri'
        elif any(t in topic for t in ['fonksiyon', 'grafik', 'koordinat', 'doğru', 'parabol']):
            return 'matematik_fonksiyon'
        elif any(t in topic for t in ['istatistik', 'olasılık', 'ortalama', 'grafik', 'tablo']):
            return 'matematik_istatistik'
        else:
            return 'matematik_cebir'
    
    # Fizik
    elif any(s in subject for s in ['fizik', 'physics']):
        if any(t in topic for t in ['hareket', 'hız', 'ivme', 'kuvvet', 'mekanik', 'düzgün']):
            return 'fizik_mekanik'
        elif any(t in topic for t in ['elektrik', 'devre', 'akım', 'gerilim', 'direnç']):
            return 'fizik_elektrik'
        elif any(t in topic for t in ['dalga', 'ses', 'ışık', 'optik']):
            return 'fizik_dalga'
        else:
            return 'fizik_genel'
    
    # Kimya
    elif any(s in subject for s in ['kimya', 'chemistry']):
        if any(t in topic for t in ['atom', 'element', 'periyodik']):
            return 'kimya_atom'
        elif any(t in topic for t in ['bağ', 'molekül', 'bileşik']):
            return 'kimya_molekul'
        elif any(t in topic for t in ['reaksiyon', 'denklem', 'mol']):
            return 'kimya_reaksiyon'
        else:
            return 'kimya_genel'
    
    # Biyoloji
    elif any(s in subject for s in ['biyoloji', 'biology']):
        if any(t in topic for t in ['hücre', 'organel', 'mitoz', 'mayoz']):
            return 'biyoloji_hucre'
        elif any(t in topic for t in ['dna', 'gen', 'kalıtım', 'protein']):
            return 'biyoloji_genetik'
        elif any(t in topic for t in ['sistem', 'organ', 'dolaşım', 'sindirim', 'solunum']):
            return 'biyoloji_sistem'
        else:
            return 'biyoloji_genel'
    
    # Türkçe / Edebiyat
    elif any(s in subject for s in ['türkçe', 'edebiyat', 'dil']):
        if any(t in topic for t in ['cümle', 'özne', 'yüklem', 'öğe']):
            return 'turkce_cumle'
        elif any(t in topic for t in ['paragraf', 'anlam', 'yorum']):
            return 'turkce_paragraf'
        elif any(t in topic for t in ['söz', 'deyim', 'atasözü', 'anlam']):
            return 'turkce_anlam'
        else:
            return 'turkce_genel'
    
    # Tarih / Coğrafya / Sosyal
    elif any(s in subject for s in ['tarih', 'coğrafya', 'sosyal', 'inkılap']):
        return 'sosyal_genel'
    
    # Fen Bilimleri (genel)
    elif any(s in subject for s in ['fen', 'science']):
        return 'fen_genel'
    
    # Default
    return 'genel'


# Ortak renkler ve stiller
COLORS = {
    'primary': '#8B5CF6',      # Mor - Teknokul ana rengi
    'secondary': '#F97316',    # Turuncu
    'success': '#22C55E',      # Yeşil
    'warning': '#EAB308',      # Sarı
    'error': '#EF4444',        # Kırmızı
    'info': '#3B82F6',         # Mavi
    'background': '#1a1a2e',   # Koyu arka plan
    'card': '#16213e',         # Kart arka planı
    'text': '#FFFFFF',         # Beyaz metin
    'text_muted': '#94A3B8',   # Soluk metin
}

# Ders renkleri
SUBJECT_COLORS = {
    'matematik': '#8B5CF6',    # Mor
    'fizik': '#3B82F6',        # Mavi
    'kimya': '#22C55E',        # Yeşil
    'biyoloji': '#EC4899',     # Pembe
    'turkce': '#F97316',       # Turuncu
    'tarih': '#EAB308',        # Sarı
    'cografya': '#14B8A6',     # Turkuaz
}
