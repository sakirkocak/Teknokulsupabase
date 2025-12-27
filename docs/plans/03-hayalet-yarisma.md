# 📋 Plan 3: Hayalet Yarışma (Ghost Match)

> **Tahmini Süre:** 2 gün  
> **Öncelik:** Orta  
> **Durum:** 📝 Planlandı  
> **Bağımlılık:** Plan 1 tamamlanmalı

## 🎯 Hedef

Öğrencilerin daha önce o soruları çözmüş başka bir öğrencinin "kaydı" ile yarışmasını sağlamak. Böylece:
- **Bekleme süresi sıfır** - Anında başla
- **7/24 yarışma** - Her zaman rakip var
- **Motivasyon** - "Geçmiş şampiyonları yen!"

## 🏗️ Mimari

```
┌────────────────────────────────────────────────────────────┐
│                   HAYALET YARIŞMA AKIŞI                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Öğrenci ──> "Hızlı Yarışma" butonu                        │
│      │                                                      │
│      ▼                                                      │
│  ┌──────────────────────────────────────┐                  │
│  │ Hayalet Seçimi                       │                  │
│  │ - Benzer seviye hayalet seç          │                  │
│  │ - Geçmiş performans verisi yükle     │                  │
│  └──────────────────────────────────────┘                  │
│      │                                                      │
│      ▼                                                      │
│  ┌──────────────────────────────────────┐                  │
│  │ Yarışma                              │                  │
│  │ - Öğrenci gerçek zamanlı oynar       │                  │
│  │ - Hayalet kayıttan "oynar"           │                  │
│  │ - Hayalet cevapları zamanlı gösterir │                  │
│  └──────────────────────────────────────┘                  │
│      │                                                      │
│      ▼                                                      │
│  Sonuç: "Hayaleti yendin!" 🏆                              │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

## 📦 Veritabanı

### Hayalet Kayıt Tablosu
```sql
CREATE TABLE ghost_records (
  id uuid PRIMARY KEY,
  student_id uuid REFERENCES student_profiles(id),
  student_name varchar(100), -- Anonim için
  grade int,
  subject varchar(50),
  questions jsonb, -- Sorulan sorular
  answers jsonb, -- [{question_index, answer, time_ms, is_correct}]
  total_score int,
  total_time_ms int,
  created_at timestamptz DEFAULT now()
);
```

### Örnek `answers` JSON:
```json
[
  {"question_index": 0, "answer": "B", "time_ms": 4500, "is_correct": true},
  {"question_index": 1, "answer": "A", "time_ms": 8200, "is_correct": false},
  {"question_index": 2, "answer": "C", "time_ms": 3100, "is_correct": true}
]
```

## 📝 Yapılacaklar (To-Do)

### Altyapı
- [ ] `ghost_records` tablosu
- [ ] Her düello sonrası otomatik hayalet kaydı
- [ ] Hayalet seçim algoritması

### Backend
- [ ] `/api/ghost/start` - Hayalet yarışması başlat
- [ ] `/api/ghost/record` - Yeni hayalet kaydet
- [ ] Typesense'te hayalet arama

### Frontend
- [ ] `GhostMatchScreen` component
- [ ] Hayalet avatar/isim gösterimi
- [ ] "Hayalet cevapladı" animasyonu
- [ ] Karşılaştırmalı sonuç ekranı

## 🎮 Oynanış

1. Öğrenci "Hızlı Yarışma" butonuna basar
2. Sistem benzer seviye bir hayalet seçer
3. Aynı 10 soru her ikisine de yüklenir
4. Öğrenci soruları çözerken:
   - Hayaletin o soruyu kaç saniyede çözdüğü gösterilir
   - Hayalet cevabı (zamanlı olarak) açılır
5. Sonuçta karşılaştırma gösterilir

## 🎨 UI Öğeleri

### Hayalet Gösterimi
- Şeffaf/gri avatar
- "👻 Hayalet: Ali Y." isim
- Yanıp sönen efekt

### Yarışma Sırasında
- "Hayalet 3.2 saniyede cevapladı!"
- Hayalet cevabı kilidi açıldığında animasyon

### Sonuç Ekranı
- Soru bazlı karşılaştırma tablosu
- "Hayaleti yendin! 🏆" veya "Hayalet kazandı 👻"
- Tekrar oyna butonu

## 💡 Özel Durumlar

### Hayalet Seçimi Kriterleri
1. Aynı sınıf
2. Benzer puan (±300)
3. Aynı ders (eğer seçilmişse)
4. Son 30 günde kayıt edilmiş

### Hayalet Yoksa
- Varsayılan "Teknokul Bot" hayaleti
- Ortalama sürelerde cevaplayan yapay rakip

---

**Önceki Plan:** [02-matchmaking.md](./02-matchmaking.md)  
**Sonraki Plan:** [04-gamification.md](./04-gamification.md)

