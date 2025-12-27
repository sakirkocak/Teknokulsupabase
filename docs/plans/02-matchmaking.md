# 📋 Plan 2: Matchmaking & Bekleme Odası

> **Tahmini Süre:** 2-3 gün  
> **Öncelik:** Orta  
> **Durum:** 📝 Planlandı  
> **Bağımlılık:** Plan 1 tamamlanmalı

## 🎯 Hedef

"Rastgele Rakip Bul" özelliği ile öğrencilerin benzer seviyedeki rakiplerle otomatik eşleşmesini sağlamak.

## 🏗️ Mimari

```
┌────────────────────────────────────────────────────────────┐
│                     MATCHMAKING AKIŞI                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Öğrenci ──> "Rakip Bul" butonu                            │
│      │                                                      │
│      ▼                                                      │
│  ┌──────────────────────────────────────┐                  │
│  │ Typesense Filtreleme (~130ms)        │                  │
│  │ - Aynı sınıf                         │                  │
│  │ - Benzer puan (±500)                 │                  │
│  │ - Online durumu (Presence)           │                  │
│  │ - Aynı ders tercihi                  │                  │
│  └──────────────────────────────────────┘                  │
│      │                                                      │
│      ▼                                                      │
│  ┌──────────────────────────────────────┐                  │
│  │ Bekleme Odası                        │                  │
│  │ - "Rakip aranıyor..." animasyonu     │                  │
│  │ - İptal butonu                       │                  │
│  │ - Tahmini bekleme süresi             │                  │
│  └──────────────────────────────────────┘                  │
│      │                                                      │
│      ▼                                                      │
│  Eşleşme bulundu! ──> Canlı Düello başlar                  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

## 📦 Bileşenler

### 1. Matchmaking Queue (Supabase)
```sql
CREATE TABLE matchmaking_queue (
  id uuid PRIMARY KEY,
  student_id uuid REFERENCES student_profiles(id),
  grade int,
  total_points int,
  preferred_subject varchar(50),
  joined_at timestamptz DEFAULT now(),
  status varchar(20) DEFAULT 'waiting' -- waiting, matched, cancelled
);
```

### 2. Typesense Benzer Oyuncu Arama
```typescript
// Benzer seviye oyuncu bul
async function findSimilarPlayers(options: {
  grade: number
  points: number
  subject?: string
  excludeIds: string[]
}): Promise<Player[]>
```

### 3. Presence Sistemi (Supabase Realtime)
```typescript
// Online kullanıcıları takip et
const presence = supabase.channel('matchmaking')
  .on('presence', { event: 'sync' }, () => {
    const onlineUsers = presence.presenceState()
  })
```

## 📝 Yapılacaklar (To-Do)

### Altyapı
- [ ] `matchmaking_queue` tablosu
- [ ] Presence channel kurulumu
- [ ] Typesense'te `is_online` alanı

### Backend
- [ ] `/api/matchmaking/join` - Kuyruğa katıl
- [ ] `/api/matchmaking/leave` - Kuyruktan çık
- [ ] `/api/matchmaking/match` - Eşleştirme algoritması

### Frontend
- [ ] `MatchmakingLobby` component
- [ ] Bekleme animasyonu
- [ ] Eşleşme bildirimi
- [ ] İptal mekanizması

## ⏱️ Eşleştirme Algoritması

```
1. Kuyruğa gir
2. Her 2 saniyede kontrol et:
   a. Aynı sınıf
   b. Puan farkı < 500
   c. (Opsiyonel) Aynı ders
3. Eşleşme bulunursa:
   a. Her iki tarafı kuyruktan çıkar
   b. Yeni düello oluştur
   c. Canlı düelloya yönlendir
4. 60 saniye sonra:
   a. Puan aralığını genişlet (±1000)
5. 120 saniye sonra:
   a. "Rakip bulunamadı" mesajı
```

## 🎨 UI Tasarımı

### Bekleme Odası
- Dönen animasyon
- "Rakip aranıyor..."
- Bekleme süresi sayacı
- İptal butonu
- Eğlenceli ipuçları

### Eşleşme Bulunduğunda
- VS ekranı (iki avatar karşı karşıya)
- Rakip bilgileri
- 3-2-1 geri sayım
- Başla animasyonu

---

**Önceki Plan:** [01-canli-duello-altyapi.md](./01-canli-duello-altyapi.md)  
**Sonraki Plan:** [03-hayalet-yarisma.md](./03-hayalet-yarisma.md)

