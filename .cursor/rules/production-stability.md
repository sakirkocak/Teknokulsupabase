# Production-Stability

⚠️ **Canlıda 4.2k+ aktif kullanıcı var!**

Herhangi bir Supabase migration veya Typesense schema değişikliği yapmadan önce mutlaka **etki analizi (impact analysis)** yap.

## Değişiklik Öncesi Kontrol Listesi

### 1. Impact Analysis
```
### Impact Analysis
- Etkilenen Tablolar: [Liste]
- Etkilenen API'ler: [Liste]
- Aktif Kullanıcı Etkisi: [Açıklama]
- Downtime Riski: [Yok/Düşük/Orta/Yüksek]
- Veri Kaybı Riski: [Yok/Düşük/Orta/Yüksek]
```

### 2. Fallback Mekanizmaları
Her değişiklik için çalışma zamanı hatalarını (runtime errors) önleyecek fallback öner:
- Typesense hatası → Supabase fallback
- Yeni kolon yoksa → Varsayılan değer kullan
- API hatası → Graceful degradation

### 3. Rollback Planı
- Migration geri alınabilir mi?
- Typesense schema eski haline döndürülebilir mi?
- Kullanıcı verisi etkilenir mi?

## Kesin Kurallar 🚨

1. **Production'da test YAPMA** - Staging/local'de test et
2. **Breaking change'leri announce et** - Kullanıcıları bilgilendir
3. **Peak saatlerde deploy YAPMA** - Gece saatlerini tercih et
4. **Incremental deploy** - Büyük değişiklikleri parçala

## Onay Süreci
Kritik değişiklikler için (migration, schema change) önce impact analysis paylaş ve onay al.
