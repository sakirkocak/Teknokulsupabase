# 📋 Plan 1: Canlı Düello - Temel Altyapı

> **Tahmini Süre:** 3-4 gün  
> **Öncelik:** Yüksek  
> **Durum:** 📝 Planlandı

## 🎯 Hedef

Mevcut sıra tabanlı düello sistemini **gerçek zamanlı (real-time)** bir yarışma sistemine dönüştürmek. İki öğrenci aynı anda aynı soruları çözer, birbirlerinin ilerlemesini anlık görür.

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                        AKIŞ DİYAGRAMI                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Ahmet                                           Mehmet      │
│    │                                               │         │
│    ├──> "Yarışma Başlat" ─────────────────────────>│         │
│    │                                               │         │
│    │         Supabase Realtime Channel             │         │
│    │    ┌──────────────────────────────────┐      │         │
│    │    │  duel:{duel_id}                  │      │         │
│    │    │  - question_index                │      │         │
│    │    │  - player_1_score                │      │         │
│    │    │  - player_2_score                │      │         │
│    │    │  - player_1_answered             │      │         │
│    │    │  - player_2_answered             │      │         │
│    │    └──────────────────────────────────┘      │         │
│    │                                               │         │
│    │<──────────── Broadcast ──────────────────────>│         │
│    │                                               │         │
│  ┌─┴─┐                                           ┌─┴─┐       │
│  │ ⚡│ Typesense (130ms)                         │ ⚡│       │
│  │   │ 10 soru çek                               │   │       │
│  └───┘                                           └───┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Bileşenler

### 1. Supabase Realtime Channel
**Dosya:** `src/hooks/useDuelRealtime.ts`

```typescript
// Her düello için benzersiz channel
const channel = supabase.channel(`duel:${duelId}`)

// Dinlenecek eventler:
- player_ready     // Oyuncu hazır
- question_answer  // Cevap verildi
- next_question    // Sonraki soruya geç
- game_end         // Oyun bitti
```

### 2. Typesense Soru Seçimi
**Dosya:** `src/lib/typesense/duel-questions.ts`

```typescript
// Düello için soru seçimi (~130ms)
async function getDuelQuestions(options: {
  grade: number
  subject?: string
  count: number
  difficulty?: string[]
}): Promise<Question[]>
```

### 3. Canlı Düello Ekranı
**Dosya:** `src/app/(dashboard)/ogrenci/duello/[id]/canli/page.tsx`

**UI Bileşenleri:**
- Rakip durumu (anlık)
- Soru kartı
- Süre sayacı
- Skor tablosu
- İlerleme çubuğu

### 4. Ana Sayfa Entegrasyonu
**Dosya:** `src/app/page.tsx`

- "🔴 Canlı Düello" butonu
- Aktif düello sayısı badge
- Hızlı erişim

## 🗃️ Veritabanı Değişiklikleri

### Mevcut `duels` tablosuna eklenecek alanlar:

```sql
ALTER TABLE duels ADD COLUMN IF NOT EXISTS
  questions jsonb DEFAULT '[]',           -- Seçilen sorular
  current_question_started_at timestamptz, -- Soru başlama zamanı
  time_per_question int DEFAULT 30,        -- Soru başına süre (saniye)
  is_realtime boolean DEFAULT false;       -- Canlı mı?
```

### Yeni `duel_answers` tablosu:

```sql
CREATE TABLE duel_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  duel_id uuid REFERENCES duels(id) ON DELETE CASCADE,
  student_id uuid REFERENCES student_profiles(id),
  question_index int NOT NULL,
  answer varchar(1), -- A, B, C, D
  is_correct boolean,
  answered_at timestamptz DEFAULT now(),
  time_taken_ms int -- Cevaplama süresi
);
```

## 📝 Yapılacaklar (To-Do)

### Aşama 1: Altyapı
- [ ] `useDuelRealtime` hook oluştur
- [ ] `getDuelQuestions` Typesense fonksiyonu
- [ ] Veritabanı migration'ları
- [ ] `duel_answers` tablosu

### Aşama 2: Backend
- [ ] `/api/duel/start` - Düelloyu başlat, soruları çek
- [ ] `/api/duel/answer` - Cevap kaydet, broadcast yap
- [ ] `/api/duel/finish` - Düelloyu bitir, puanları hesapla

### Aşama 3: Frontend
- [ ] `/duello/[id]/canli/page.tsx` - Canlı düello ekranı
- [ ] `DuelQuestionCard` component
- [ ] `DuelScoreBoard` component
- [ ] `DuelTimer` component
- [ ] `OpponentStatus` component

### Aşama 4: Ana Sayfa
- [ ] "Canlı Düello" butonu ekle
- [ ] Aktif düello badge
- [ ] Yönlendirme

### Aşama 5: Test & Polish
- [ ] Latency testleri
- [ ] Edge case'ler (disconnect, timeout)
- [ ] Loading state'ler
- [ ] Error handling

## 🔗 Bağımlılıklar

- ✅ Typesense kurulumu (mevcut)
- ✅ Supabase Realtime (mevcut, aktifleştirilecek)
- ✅ Mevcut düello sistemi (mevcut)
- ✅ `questions` collection (mevcut)

## ⚡ Performans Hedefleri

| Metrik | Hedef |
|--------|-------|
| Soru yükleme | < 150ms |
| Cevap senkronizasyonu | < 100ms |
| UI güncellemesi | < 50ms |

## 🧪 Test Senaryoları

1. İki kullanıcı aynı anda başlıyor
2. Bir kullanıcı bağlantı kaybediyor
3. Süre dolmadan cevap verilmezse
4. İki kullanıcı aynı anda cevaplıyor
5. Düello ortasında sayfa yenileme

## 📅 Tahmini Zaman Çizelgesi

| Gün | Görev |
|-----|-------|
| 1 | Altyapı + Veritabanı |
| 2 | Backend API'ler |
| 3 | Frontend ekran |
| 4 | Ana sayfa + Test |

---

**Sonraki Plan:** [02-matchmaking.md](./02-matchmaking.md)

