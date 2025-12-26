# Typesense Cloud Entegrasyonu - Kurulum Rehberi

## ✅ Tamamlanan Adımlar

1. ✅ **Typesense npm paketi yüklendi**
2. ✅ **Client modülü oluşturuldu** (`src/lib/typesense/`)
3. ✅ **Collection'lar oluşturuldu** (leaderboard, questions)
4. ✅ **31,362 soru migrate edildi**
5. ✅ **98 öğrenci leaderboard verisi migrate edildi**
6. ✅ **Webhook API route oluşturuldu**
7. ✅ **Leaderboard abstraction layer oluşturuldu**
8. ✅ **Search servisi oluşturuldu**
9. ✅ **QuestionSearch komponenti oluşturuldu**
10. ✅ **Liderlik sayfası güncellendi**
11. ✅ **Vercel environment variables eklendi**
12. ✅ **Supabase trigger'lar oluşturuldu** (otomatik sync)

## 🔧 Vercel Environment Variables

Vercel Dashboard'a gidin ve şu environment variables'ları ekleyin:

### Production
```
TYPESENSE_HOST=kc8bx4n1ldm30q6fp-1.a1.typesense.net
TYPESENSE_API_KEY=4EPTC9CnOqPP5sj8Q9Zq98pQutrrEfVz
NEXT_PUBLIC_TYPESENSE_HOST=kc8bx4n1ldm30q6fp-1.a1.typesense.net
NEXT_PUBLIC_TYPESENSE_SEARCH_KEY=xXO8BzyZ2Vj6ZuMoL6KB596JUsn2ZCuc
NEXT_PUBLIC_USE_TYPESENSE=false
TYPESENSE_WEBHOOK_SECRET=teknokul-typesense-webhook-2024
```

**ÖNEMLİ:** Başlangıçta `NEXT_PUBLIC_USE_TYPESENSE=false` bırakın. Test ettikten sonra `true` yapın.

## 📡 Supabase Sync (Otomatik Kuruldu!)

✅ **Trigger'lar otomatik olarak oluşturuldu:**

- `typesense_student_points_sync` - student_points tablosu için
- `typesense_questions_sync` - questions tablosu için

Bu trigger'lar, her INSERT/UPDATE/DELETE işleminde otomatik olarak Typesense'e HTTP isteği gönderir.

### Webhook URL (Güncel)

✅ **Aktif URL:** `https://www.teknokul.com.tr/api/webhooks/typesense-sync`

## 🧪 Test Etme

### 1. Local Test
```bash
# Typesense bağlantısını test et
curl "https://kc8bx4n1ldm30q6fp-1.a1.typesense.net/health" \
  -H "X-TYPESENSE-API-KEY: xXO8BzyZ2Vj6ZuMoL6KB596JUsn2ZCuc"

# Leaderboard collection'ı test et
curl "https://kc8bx4n1ldm30q6fp-1.a1.typesense.net/collections/leaderboard/documents/search?q=*&per_page=5" \
  -H "X-TYPESENSE-API-KEY: xXO8BzyZ2Vj6ZuMoL6KB596JUsn2ZCuc"

# Questions collection'ı test et
curl "https://kc8bx4n1ldm30q6fp-1.a1.typesense.net/collections/questions/documents/search?q=türev&query_by=question_text&per_page=5" \
  -H "X-TYPESENSE-API-KEY: xXO8BzyZ2Vj6ZuMoL6KB596JUsn2ZCuc"
```

### 2. Webhook Health Check
```bash
curl "https://teknokul.com/api/webhooks/typesense-sync"
```

### 3. Feature Flag Aktivasyonu
Testler başarılı olduktan sonra:

1. Vercel Dashboard > Settings > Environment Variables
2. `NEXT_PUBLIC_USE_TYPESENSE` değerini `true` yapın
3. Redeploy edin

## 📊 Collection İstatistikleri

- **Leaderboard:** 98 öğrenci
- **Questions:** 31,362 soru
- **Cluster:** Frankfurt (Germany) - Türkiye'ye yakın, düşük latency

## 🔄 Yeniden Migration (Gerekirse)

Eğer verileri yeniden migrate etmeniz gerekirse:

```bash
cd "/Users/sakirkocak/Teknokul Rıza-Şakir"

# Collection'ları sıfırla ve yeniden oluştur
node scripts/typesense-setup.js

# Verileri migrate et
node scripts/typesense-migrate.js
```

## 🛡️ Güvenlik

- **Admin API Key:** Sadece server-side'da kullanılır (env: `TYPESENSE_API_KEY`)
- **Search-only API Key:** Client-side'da güvenle kullanılabilir (env: `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY`)
- **Webhook Secret:** Yetkisiz webhook çağrılarını engeller

## 📁 Oluşturulan Dosyalar

```
src/lib/typesense/
├── client.ts          # Typesense client'ları
├── collections.ts     # Collection şemaları
└── index.ts           # Export

src/lib/leaderboard/
├── index.ts           # Abstraction layer
├── supabase.ts        # Supabase implementation
└── typesense.ts       # Typesense implementation

src/lib/search/
├── index.ts           # Abstraction layer
├── supabase.ts        # Supabase implementation
└── typesense.ts       # Typesense implementation

src/app/api/webhooks/typesense-sync/
└── route.ts           # Webhook handler

src/components/
└── QuestionSearch.tsx # Arama komponenti

scripts/
├── typesense-setup.js    # Collection oluşturma
└── typesense-migrate.js  # Data migration
```

## 🎯 Sonraki Adımlar

1. ✅ Vercel'e deploy et
2. ✅ Environment variables ekle
3. ✅ Supabase trigger'ları oluşturuldu
4. ⏳ **Feature flag'i aktif et** (`NEXT_PUBLIC_USE_TYPESENSE=true`)
5. ⏳ Canlı performansı izle

## 🚀 Aktivasyon

Typesense'i aktif etmek için:

1. Vercel Dashboard > Settings > Environment Variables
2. `NEXT_PUBLIC_USE_TYPESENSE` değerini `true` olarak değiştir
3. Redeploy yap

**Not:** Aktivasyon öncesi webhook URL'inin doğru olduğundan emin olun!

