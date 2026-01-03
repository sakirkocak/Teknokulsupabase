# SEO-and-Vector-Search

1 Milyon sayfa hedefine uygun olarak daima **"Scale-First"** ve **SEO odaklı** düşün.

## SEO Gereksinimleri

### Yapısal Veri
- **JSON-LD:** Her soru sayfası için `Question` ve `Quiz` schema zorunlu
- **Schema.org:** Tüm içerik sayfalarında uygun schema işaretlemeleri
- **Metadata:** Dinamik title, description, canonical URL

### Sitemap Stratejisi
- **Parçalı Sitemap:** 1M sayfa için sharded sitemap yapısı kullan
- **Dinamik Güncelleme:** Yeni içerikler otomatik sitemap'e eklenmeli
- **Priority:** Popüler sayfalar daha yüksek öncelik almalı

## Vektörel Arama

### Enriched Embeddings
Vektör verisi oluşturulurken soru metnine ek olarak:
- Zorluk seviyesi
- Konu yolu (breadcrumb)
- Ders ve sınıf bilgisi
- Anahtar kelimeler

### Anlamsal Çıkarım
- "Hız problemleri" → "türev-hız ilişkisi" soruları da öner
- Öğrencinin zayıf konularını tespit et
- Benzer sorular ile internal linking oluştur

## Proaktif Öneriler
Internal linking yapısını her soru sayfasında proaktif olarak öner:
- Benzer Sorular
- Aynı Konudan Sorular  
- Zorluk Sıralamalı Sorular
