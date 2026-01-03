# Teknokul - Claude AI Asistan Kuralları

Bu dosya, projede çalışırken uyulması gereken kritik mimari kararları ve kuralları içerir.

---

## 🚀 TEMEL PRENSİPLER

### 1. GEÇİCİ ÇÖZÜM YOK
- **ASLA** geçici çözüm, workaround veya kısa yol sunma
- Her çözüm kalıcı ve production-ready olmalı
- "Şimdilik", "geçici olarak", "sonra düzeltiriz" → **YASAK**

### 2. ÖLÇEKLENEBİLİRLİK (100K+ Kullanıcı)
- Her karar 100.000+ kullanıcı düşünülerek alınmalı
- Performans, maliyet ve kaynak kullanımı optimize edilmeli
- Tek kullanıcıda çalışan kod yetmez, ölçekte çalışmalı

### 3. DOĞRU ÇÖZÜMÜ BUL
- Kolay yol değil, doğru yol
- Kısa vadeli değil, uzun vadeli düşün
- Teknik borç biriktirme

---

## 🗄️ VERİ MİMARİSİ

### Supabase vs Typesense Ayrımı

**KRİTİK KURAL:** Tüm veriler Supabase'de tutulur. Typesense SADECE hızlı arama indeksi olarak kullanılır.

#### Supabase (Ana Veri Kaynağı)
- Tüm soru detayları (options, correct_answer, explanation)
- Görseller (question_image_url)
- Embedding'ler (pgvector ile semantic search)
- Kullanıcı verileri
- İstatistikler

#### Typesense (Sadece Arama İndeksi)
Questions collection'da SADECE şunlar tutulur:
```
- question_id        → Supabase'den detay çekmek için
- question_text      → Metin araması için
- difficulty         → Filtreleme
- subject_code       → Filtreleme
- subject_name       → Filtreleme & gösterim
- main_topic         → Filtreleme
- sub_topic          → Filtreleme (optional)
- grade              → Filtreleme
- has_image          → Filtreleme
- times_answered     → Sıralama (popüler sorular)
- times_correct      → İstatistik hesaplama
- success_rate       → İstatistik gösterim
- created_at         → Sıralama (yeni sorular)
```

**TYPESENSE'E GÖNDERİLMEYECEKLER:**
- ❌ explanation (uzun metin, RAM şişirir)
- ❌ options / option_a/b/c/d/e (Supabase'den çekilir)
- ❌ correct_answer (Supabase'den çekilir)
- ❌ image_url (Supabase'den çekilir)
- ❌ embedding (Supabase pgvector kullanılır)
- ❌ subject_id (subject_code yeterli)
- ❌ topic_id (main_topic yeterli)

### Neden Bu Ayrım?
1. **RAM Tasarrufu:** Typesense Cloud'da RAM sınırlı ve pahalı
2. **Veri Tutarlılığı:** Tek kaynak Supabase, duplicasyon yok
3. **Maliyet:** 80.000+ soru × gereksiz alanlar = RAM patlaması

---

## 🔍 ARAMA AKIŞI

### Soru Arama
1. Kullanıcı arama yapar
2. Typesense'den `question_id` listesi döner (hızlı)
3. Supabase'den detaylar çekilir (options, explanation vs.)
4. Kullanıcıya gösterilir

### Semantic Search
- Typesense DEĞİL, Supabase pgvector kullanılır
- `questions.embedding` kolonu (vector 768)
- `search_questions_semantic()` fonksiyonu

---

## ⚠️ DİKKAT EDİLECEKLER

1. **Webhook route güncellenirken** sadece yukarıdaki alanlar gönderilmeli
2. **Yeni alan eklerken** önce Supabase'e mi Typesense'e mi gideceğine karar ver
3. **typesense-setup.js** ve **collections.ts** senkronize tutulmalı
4. **Embedding'ler** SADECE Supabase'de, Typesense'e gönderme

---

## 📁 İLGİLİ DOSYALAR

- `src/app/api/webhooks/typesense-sync/route.ts` - Supabase → Typesense senkronizasyonu
- `src/lib/typesense/collections.ts` - TypeScript şema tanımları
- `scripts/typesense-setup.js` - Typesense collection oluşturma
- `supabase/migrations/20250101_add_pgvector.sql` - Embedding/semantic search

---

*Son güncelleme: 3 Ocak 2026*
