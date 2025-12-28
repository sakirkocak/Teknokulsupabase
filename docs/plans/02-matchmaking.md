# 📋 Plan 2: Matchmaking & Bekleme Odası

> **Tahmini Süre:** 2-3 gün  
> **Öncelik:** Yüksek  
> **Durum:** 📝 Planlandı  
> **Bağımlılık:** Plan 1 ✅ Tamamlandı

## 🎯 Hedef

"**Düello Bul**" butonu ile öğrencilerin benzer seviyedeki rakiplerle otomatik eşleşmesini sağlamak.

## 🏗️ Akış Diyagramı

```
┌────────────────────────────────────────────────────────────────┐
│                     MATCHMAKING AKIŞI                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Öğrenci ──> "Düello Bul" butonu                               │
│      │                                                          │
│      ▼                                                          │
│  ┌──────────────────────────────────────────┐                  │
│  │ 1. matchmaking_queue'ya ekle             │                  │
│  │    - student_id, grade, total_points     │                  │
│  │    - preferred_subject (opsiyonel)       │                  │
│  └──────────────────────────────────────────┘                  │
│      │                                                          │
│      ▼                                                          │
│  ┌──────────────────────────────────────────┐                  │
│  │ 2. Bekleme Odası UI                      │                  │
│  │    - Neon efektli animasyon              │                  │
│  │    - Sınıf renginde pulse                │                  │
│  │    - "Rakip aranıyor..." mesajı          │                  │
│  │    - İptal butonu                        │                  │
│  └──────────────────────────────────────────┘                  │
│      │                                                          │
│      ▼                                                          │
│  ┌──────────────────────────────────────────┐                  │
│  │ 3. Typesense Filtreleme (~130ms)         │                  │
│  │    - Aynı sınıf                          │                  │
│  │    - Benzer puan (step-up logic)         │                  │
│  │    - status = 'waiting'                  │                  │
│  └──────────────────────────────────────────┘                  │
│      │                                                          │
│      ├── Rakip bulundu ──> VS Ekranı ──> Canlı Düello         │
│      │                                                          │
│      └── 60s timeout ──> "Rakip bulunamadı" / Hayalet öner    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## 📦 1. Veritabanı Altyapısı

### matchmaking_queue Tablosu

```sql
CREATE TABLE matchmaking_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES student_profiles(id) ON DELETE CASCADE NOT NULL,
  grade int NOT NULL,
  total_points int DEFAULT 0,
  preferred_subject varchar(50),          -- null = Karışık
  status varchar(20) DEFAULT 'waiting',   -- waiting, matched, cancelled, expired
  matched_with uuid REFERENCES student_profiles(id),
  duel_id uuid REFERENCES duels(id),
  search_range int DEFAULT 300,           -- Başlangıç puan aralığı
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '2 minutes'),
  
  -- Aynı öğrenci aynı anda sadece bir kez kuyrukta olabilir
  UNIQUE(student_id, status) WHERE status = 'waiting'
);

-- Indexler
CREATE INDEX idx_matchmaking_grade ON matchmaking_queue(grade) WHERE status = 'waiting';
CREATE INDEX idx_matchmaking_points ON matchmaking_queue(total_points) WHERE status = 'waiting';
CREATE INDEX idx_matchmaking_expires ON matchmaking_queue(expires_at);

-- Otomatik temizlik (expired kayıtları sil)
CREATE OR REPLACE FUNCTION cleanup_expired_matchmaking()
RETURNS void AS $$
BEGIN
  DELETE FROM matchmaking_queue 
  WHERE expires_at < now() OR status IN ('matched', 'cancelled', 'expired');
END;
$$ LANGUAGE plpgsql;
```

### RLS Policies

```sql
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Service role tam erişim
CREATE POLICY "Service role full access" ON matchmaking_queue
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Öğrenciler kendi kayıtlarını görebilir
CREATE POLICY "Students view own queue" ON matchmaking_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() AND sp.id = student_id
    )
  );

-- Öğrenciler kuyruğa katılabilir
CREATE POLICY "Students can join queue" ON matchmaking_queue
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() AND sp.id = student_id
    )
  );

-- Öğrenciler kendi kaydını iptal edebilir
CREATE POLICY "Students can cancel own" ON matchmaking_queue
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() AND sp.id = student_id
    )
  );
```

## ⏱️ 2. Step-Up Logic (Genişleyen Aralık)

```typescript
// Eşleştirme aralıkları (saniye bazında)
const MATCHMAKING_STEPS = [
  { time: 0,  pointRange: 300,  gradeRange: 0 },  // 0-10s: ±300 puan, aynı sınıf
  { time: 10, pointRange: 500,  gradeRange: 0 },  // 10-20s: ±500 puan, aynı sınıf
  { time: 20, pointRange: 1000, gradeRange: 0 },  // 20-40s: ±1000 puan, aynı sınıf
  { time: 40, pointRange: 2000, gradeRange: 1 },  // 40-60s: ±2000 puan, ±1 sınıf
]

// Timeout
const MATCHMAKING_TIMEOUT = 60 // saniye
```

## 🔌 3. API Endpoints

### POST /api/matchmaking/join
```typescript
// Kuyruğa katıl
Request: { studentId, subject? }
Response: { queueId, position, estimatedWait }
```

### POST /api/matchmaking/leave
```typescript
// Kuyruktan çık (iptal)
Request: { queueId }
Response: { success }
```

### GET /api/matchmaking/status
```typescript
// Eşleşme durumunu kontrol et
Request: { queueId }
Response: { 
  status: 'waiting' | 'matched' | 'cancelled' | 'expired',
  matchedWith?: PlayerInfo,
  duelId?: string,
  waitTime: number,
  currentRange: number
}
```

### Matchmaking Worker (Arka Plan)
```typescript
// Her 2 saniyede çalışır
// 1. Bekleyen oyuncuları al
// 2. Typesense'te uygun rakip ara
// 3. Eşleşme varsa düello oluştur
// 4. Her iki tarafı bilgilendir (Realtime)
```

## 🎨 4. UI Bileşenleri

### Sınıf Renkleri
```typescript
const GRADE_COLORS = {
  1: { primary: '#87CEEB', name: 'Açık Mavi' },
  2: { primary: '#4CAF50', name: 'Yeşil' },
  3: { primary: '#FF9800', name: 'Turuncu' },
  4: { primary: '#9C27B0', name: 'Mor' },
  5: { primary: '#E91E63', name: 'Pembe' },
  6: { primary: '#00BCD4', name: 'Turkuaz' },
  7: { primary: '#2196F3', name: 'Mavi' },
  8: { primary: '#F44336', name: 'Kırmızı' },
  9: { primary: '#FFD700', name: 'Altın' },
  10: { primary: '#C0C0C0', name: 'Gümüş' },
  11: { primary: '#CD7F32', name: 'Bronz' },
  12: { primary: '#E5E4E2', name: 'Platin' },
}
```

### Bekleme Odası UI
- **Neon pulse animasyonu** (sınıf renginde)
- **"Rakip aranıyor..."** mesajı
- **Bekleme süresi** sayacı
- **Arama aralığı** göstergesi (±300, ±500...)
- **İptal butonu**
- **Eğlenceli ipuçları** (rastgele)

### VS Ekranı (Eşleşme Bulunduğunda)
- **İki avatar** karşı karşıya
- **İsimler ve puanlar**
- **"VS"** animasyonlu yazı
- **3-2-1 geri sayım**
- **"BAŞLA!"** efekti

## 🔄 5. Realtime Entegrasyonu

```typescript
// Matchmaking channel
const channel = supabase.channel('matchmaking')
  .on('broadcast', { event: 'match_found' }, (payload) => {
    // Eşleşme bulundu - VS ekranına geç
  })
  .on('broadcast', { event: 'opponent_cancelled' }, (payload) => {
    // Rakip iptal etti - tekrar ara
  })
  .subscribe()
```

## 🎮 6. Maç Sonu Özellikleri

### Rövanş Sistemi
```typescript
// Maç bitiminde göster
- "Rövanş İste" butonu → Aynı rakibe yeni düello daveti
- 30 saniye kabul süresi
- Kabul edilirse anında başla
```

### Paylaşım Linki
```typescript
// Soruyu paylaş
- "Bu Soruyu Paylaş" butonu
- Dinamik link: /sorular/{subject}/{grade}/{questionId}
- WhatsApp, Twitter, Kopyala seçenekleri
```

## 📝 To-Do Listesi

### Altyapı
- [ ] `matchmaking_queue` tablosu oluştur
- [ ] RLS policies ekle
- [ ] Typesense'e `is_searching` alanı ekle (opsiyonel)

### Backend
- [ ] `/api/matchmaking/join` endpoint
- [ ] `/api/matchmaking/leave` endpoint
- [ ] `/api/matchmaking/status` endpoint
- [ ] Matchmaking worker (polling veya cron)
- [ ] Step-up logic implementasyonu

### Frontend
- [ ] `MatchmakingLobby` component
- [ ] Neon pulse animasyonu
- [ ] VS ekranı
- [ ] Geri sayım animasyonu
- [ ] İptal mekanizması

### Maç Sonu
- [ ] Rövanş butonu
- [ ] Paylaşım linki
- [ ] Sonuç animasyonları

## 📊 Performans Hedefleri

| Metrik | Hedef |
|--------|-------|
| Eşleştirme süresi (uygun rakip varsa) | < 5 saniye |
| Typesense sorgu süresi | < 150ms |
| UI render süresi | < 100ms |
| Ortalama bekleme süresi | < 30 saniye |

## 🧪 Test Senaryoları

1. **Normal eşleşme:** İki aynı sınıf, benzer puanlı öğrenci
2. **Step-up:** Başta eşleşme yok, 20s sonra geniş aralıkta bulma
3. **Timeout:** 60s sonra "Rakip bulunamadı" mesajı
4. **İptal:** Öğrenci beklerken iptal ediyor
5. **Çift iptal:** Her iki taraf da iptal ediyor
6. **Rövanş:** Maç sonrası rövanş isteği

---

**Önceki Plan:** [01-canli-duello-altyapi.md](./01-canli-duello-altyapi.md) ✅  
**Sonraki Plan:** [03-hayalet-yarisma.md](./03-hayalet-yarisma.md)
