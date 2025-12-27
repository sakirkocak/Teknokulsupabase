# 📋 Plan 4: Gamification & Polish

> **Tahmini Süre:** 2-3 gün  
> **Öncelik:** Düşük-Orta  
> **Durum:** 📝 Planlandı  
> **Bağımlılık:** Plan 1, 2, 3 tamamlanmalı

## 🎯 Hedef

Düello sistemini daha eğlenceli ve bağımlılık yapıcı hale getirmek. Öğrencilerin tekrar tekrar oynamak istemesini sağlayacak mekanikler eklemek.

## 🎮 Özellikler

### 1. Puan Bahsi Sistemi

```
┌─────────────────────────────────────────┐
│           DÜELLO BAHSİ                  │
├─────────────────────────────────────────┤
│                                          │
│  "Kaç puan bahis oynamak istersin?"     │
│                                          │
│  ┌────┐  ┌────┐  ┌────┐  ┌─────┐        │
│  │ 25 │  │ 50 │  │100 │  │ 200 │        │
│  └────┘  └────┘  └────┘  └─────┘        │
│     ↓       ↓       ↓        ↓          │
│  Kazan: 50  100    200     400          │
│  Kaybet: 0   0      0       0           │
│                                          │
└─────────────────────────────────────────┘
```

**Kurallar:**
- Minimum bahis: 25 puan
- Maksimum bahis: 200 puan
- Kazanan: Bahis x 2
- Kaybeden: Bahis kadar puan kaybeder
- Berabere: Bahisler iade

### 2. Kombo / Alev Modu (Streak)

```
Üst üste doğru cevap = Kombo

1 doğru  →  🔥 x1 (normal puan)
2 doğru  →  🔥 x1.5 
3 doğru  →  🔥🔥 x2 (ALEV MODU!)
4 doğru  →  🔥🔥🔥 x2.5
5+ doğru →  🔥🔥🔥🔥 x3 (EFSANE!)
```

**UI:**
- Ekranın kenarlarında alev efekti
- Titreşim/shake animasyonu
- Ses efekti (opsiyonel)

### 3. Hız Bonusu

```
Soruyu rakipten önce doğru cevapla = Hız Bonusu!

┌──────────────────────────────────────┐
│  ⚡ HIZ BONUSU! +5 PUAN              │
│  Rakipten 3.2 saniye önce cevapladın │
└──────────────────────────────────────┘
```

**Hesaplama:**
- Rakipten 5+ saniye önce: +10 puan
- Rakipten 3-5 saniye önce: +5 puan
- Rakipten 1-3 saniye önce: +2 puan

### 4. Rozetler & Başarımlar

| Rozet | Koşul | Puan |
|-------|-------|------|
| 🏃 Hız Şeytanı | 5 soruda da rakipten önce cevapla | +20 |
| 🎯 Keskin Nişancı | 10 soruda 10 doğru | +50 |
| 🔥 Ateş Topu | 5 maç üst üste kazan | +30 |
| 🛡️ Savunmacı | 3 maç üst üste berabere | +15 |
| 👻 Hayalet Avcısı | 10 hayalet yen | +25 |
| ⚔️ Düello Ustası | 100 düello tamamla | +100 |

### 5. Sesler & Efektler

**Ses Efektleri:**
- Doğru cevap: "ding!"
- Yanlış cevap: "buzz"
- Kombo: "woosh!"
- Galibiyet: Zafer müziği
- Mağlubiyet: Üzgün ses

**Görsel Efektler:**
- Confetti (galibiyet)
- Shake (yanlış cevap)
- Glow (kombo)
- Particles (puan kazanma)

### 6. Canlı Rakip Durumu

```
┌─────────────────────────────────────┐
│  👤 Mehmet                          │
│  ├── Soru 3/10                      │
│  ├── Skor: 45                       │
│  ├── 🔥🔥 Kombo x2                  │
│  └── ⏱️ Düşünüyor... (5s)          │
└─────────────────────────────────────┘
```

## 📝 Yapılacaklar (To-Do)

### Puan Bahsi
- [ ] Bahis seçim UI
- [ ] `duels.bet_amount` alanı
- [ ] Bahis hesaplama logic
- [ ] Yeterli puan kontrolü

### Kombo Sistemi
- [ ] Streak takibi
- [ ] Çarpan hesaplama
- [ ] Alev animasyonu
- [ ] UI göstergesi

### Hız Bonusu
- [ ] Cevap süresi karşılaştırma
- [ ] Bonus hesaplama
- [ ] UI bildirimi

### Rozetler
- [ ] `duel_achievements` tablosu
- [ ] Rozet kontrol fonksiyonları
- [ ] Rozet kazanma animasyonu
- [ ] Profilde rozet gösterimi

### Sesler & Efektler
- [ ] Ses dosyaları
- [ ] Howler.js entegrasyonu
- [ ] Canvas confetti
- [ ] Framer Motion animasyonları

## 🎨 UI Bileşenleri

```
src/components/duel/
├── BetSelector.tsx        // Bahis seçimi
├── ComboIndicator.tsx     // Kombo göstergesi
├── SpeedBonus.tsx         // Hız bonusu bildirimi
├── AchievementPopup.tsx   // Rozet kazanma
├── FireEffect.tsx         // Alev efekti
└── VictoryScreen.tsx      // Zafer ekranı
```

## ⚙️ Ayarlar

Kullanıcı ayarları:
- [ ] Sesleri aç/kapat
- [ ] Efektleri azalt (performans)
- [ ] Bildirimleri aç/kapat

---

**Önceki Plan:** [03-hayalet-yarisma.md](./03-hayalet-yarisma.md)

