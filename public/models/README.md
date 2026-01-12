# 🎨 JARVIS 3D Model Kütüphanesi

Bu klasör, Jarvis Holografik Eğitim Sistemi için kullanılan 3D modelleri içerir.

## 📁 Klasör Yapısı

```
/public/models/
├── biology/          # Biyoloji modelleri
│   ├── animal-cell.glb
│   ├── plant-cell.glb
│   ├── dna-helix.glb
│   └── influenza.glb
├── chemistry/        # Kimya modelleri
│   ├── atom-bohr.glb
│   ├── h2o.glb
│   └── co2.glb
├── physics/          # Fizik modelleri
│   ├── pendulum.glb
│   └── solar-system.glb
├── anatomy/          # Anatomi modelleri
│   ├── heart.glb
│   └── respiratory.glb
└── math/             # Matematik (genelde kod ile çizilir)
```

## 📥 Model Kaynakları

### 1. Sketchfab (CC Attribution)
- **Animal Cell**: https://sketchfab.com/3d-models/animal-cell-737b35f5b779418998d834c28ed15295
- İndirmek için Sketchfab hesabı gerekli
- Format: GLB/GLTF seç

### 2. NIH 3D (Public Domain)
- **Ana site**: https://3d.nih.gov/
- **Influenza**: https://3d.nih.gov/entries/3DPX-013373
- **Respiratory**: https://3d.nih.gov/entries/3DPX-013408
- **H2O**: https://3d.nih.gov/entries/8091/1
- Format: GLB tercih et

### 3. Smithsonian Open Access (CC0)
- **Ana site**: https://3d.si.edu/
- Tarihi ve bilimsel objeler

### 4. NASA 3D Resources (Public Domain)
- **Ana site**: https://nasa3d.arc.nasa.gov/
- Uzay ve astronomi modelleri

## 📋 Model İndirme Adımları

### Sketchfab'dan:
1. Sketchfab.com'a ücretsiz kayıt ol
2. Model sayfasına git
3. "Download" butonuna tıkla
4. Format olarak "glTF" veya "GLB" seç
5. İndirilen dosyayı ilgili klasöre koy

### NIH 3D'den:
1. Model sayfasına git
2. "Download" bölümünden GLB formatını seç
3. Dosyayı ilgili klasöre koy

## ⚠️ Önemli Notlar

1. **Format**: Her zaman `.glb` veya `.gltf` kullan
2. **Boyut**: Modeller 10MB'ın altında olmalı (performans)
3. **Lisans**: Lisansı kontrol et (CC-BY, CC0, Public Domain)
4. **İsimlendirme**: Dosya adları `model-registry.ts` ile eşleşmeli

## 🔄 Model Ekleme

Yeni model eklemek için:

1. Dosyayı uygun klasöre koy
2. `src/lib/jarvis/model-registry.ts` dosyasını güncelle:

```typescript
'yeni-model': {
  id: 'yeni-model',
  name: 'Model Adı',
  path: '/models/category/yeni-model.glb',
  format: 'glb',
  source: 'sketchfab',
  license: 'cc-by',
  category: 'biology',
  subjects: ['biyoloji', 'fen-bilimleri'],
  parts: ['part1', 'part2'], // Vurgulanabilir parçalar
  description: 'Model açıklaması'
}
```

## 📊 Mevcut Modeller (13 Adet)

### ✅ İndirilmiş ve Hazır

| ID | Ad | Boyut | Kategori |
|----|-----|-------|----------|
| brain | Beyin Sapı | 3 MB | Biyoloji |
| fox | Tilki (Animasyonlu) | 150 KB | Biyoloji |
| duck | Ördek | 118 KB | Biyoloji |
| avocado | Avokado | 7.7 MB | Biyoloji |
| water-bottle | Su Şişesi | 8.5 MB | Kimya |
| toy-car | Oyuncak Araba | 5.2 MB | Fizik |
| lantern | Fener | 9 MB | Fizik |
| damaged-helmet | Kask | 3.6 MB | Fizik |
| antique-camera | Antik Kamera | 17 MB | Fizik/Optik |
| milk-truck | Süt Kamyonu | 350 KB | Fizik |
| box-animated | Animasyonlu Küp | 12 KB | Matematik |
| morph-cube | Şekil Değiştiren Küp | 6 KB | Matematik |
| interpolation | İnterpolasyon Demo | - | Matematik |

### 📥 Sketchfab'dan İndirilecekler (Premium)

| ID | Ad | Link |
|----|-----|------|
| animal-cell | Hayvan Hücresi | [Sketchfab](https://sketchfab.com/3d-models/animal-cell-737b35f5b779418998d834c28ed15295) |
| plant-cell | Bitki Hücresi | Sketchfab'da ara |
| dna-helix | DNA Sarmalı | NIH 3D |

---

**Son güncelleme**: 2026-01-11
**Toplam**: 13 model hazır, 3 model bekleniyor
