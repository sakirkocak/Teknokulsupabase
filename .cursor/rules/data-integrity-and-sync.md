# Data-Integrity-and-Sync

Daima `.cursorrules` dosyasındaki standartlara sadık kal. Özellikle **Typesense ve Supabase arasındaki veri tutarlılığı** benim için çok önemli.

## Temel Prensipler

### Veri Akışı
- **Okuma:** Typesense üzerinden (%99)
- **Yazma:** Supabase üzerinden (Source of Truth)
- **Senkronizasyon:** Her yazma işleminden sonra Typesense güncellenmeli

### Kesin Yasaklar 🚫
1. **Sahte Veri Üretme:** Asla fake rating, fake comment, fake istatistik üretme
2. **Şişirme:** UI'da statik veya random sayı ile "şişirme" yapma
3. **Tutarsızlık:** Supabase ve Typesense arasında veri tutarsızlığı bırakma

### Doğru Yaklaşımlar ✅
1. Veri yoksa "Henüz yorum yok" gibi dürüst empty state göster
2. İstatistikler her zaman Typesense'den dinamik gelsin
3. Her migration sonrası Typesense schema'sını kontrol et

## Sistem Dürüst Veriye Dayanmalı
Gösterilen her sayı (yorum, rating, çözülen soru) veritabanından doğrulanabilir olmalıdır.
