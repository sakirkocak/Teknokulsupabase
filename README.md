# 🎓 Teknokul - Eğitim Koçluğu Platformu

Modern ve kapsamlı bir eğitim koçluğu yönetim sistemi. Koçlar, öğrenciler ve veliler için özelleştirilmiş paneller sunar.

![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)

## ✨ Özellikler

### 👨‍🏫 Koç Paneli
- Öğrenci yönetimi ve takibi
- **Sınıf Yönetim Sistemi** (AI destekli öğrenci ekleme)
- Görev ve ödev atama
- Deneme sonuçları analizi
- AI destekli soru havuzu ve rapor oluşturucu
- Duyuru ve materyal paylaşımı
- Haftalık leaderboard ve istatistikler

### 👨‍🎓 Öğrenci Paneli
- Görev ve ödev takibi
- Deneme sonuçları yükleme (AI analizi)
- AI Araçları:
  - 🤖 Soru Çözücü
  - 📚 Konu Anlatımı
  - 📊 Deneme Analizi
  - 📅 Çalışma Planı Oluşturucu
- Sınıfa katılma ve sıralama görüntüleme
- İlerleme raporu

### 👨‍👩‍👧 Veli Paneli
- Çocuk performans takibi
- Haftalık raporlar
- Sınıf bilgileri
- Koç iletişimi

### 🏫 Sınıf Yönetim Sistemi
- AI ile fotoğraftan öğrenci listesi çıkarma
- Benzersiz sınıf kodları
- Toplu görev atama
- Duyuru ve materyal paylaşımı
- Haftalık leaderboard
- Detaylı istatistik paneli

## 🛠️ Teknolojiler

- **Frontend:** Next.js 14, React, TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **AI:** Google Gemini 2.5 Flash
- **Deployment:** Vercel

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Supabase hesabı
- Google AI (Gemini) API anahtarı

### Adımlar

1. **Repoyu klonlayın:**
```bash
git clone https://github.com/KULLANICI_ADI/teknokulsupabase.git
cd teknokulsupabase
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Environment variables ayarlayın:**
```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin ve gerekli değerleri girin.

4. **Veritabanı şemasını uygulayın:**
Supabase Dashboard'da `supabase/schema.sql` dosyasını çalıştırın.

5. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 📁 Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Giriş/Kayıt sayfaları
│   ├── (dashboard)/       # Dashboard sayfaları
│   │   ├── admin/         # Admin paneli
│   │   ├── koc/           # Koç paneli
│   │   ├── ogrenci/       # Öğrenci paneli
│   │   └── veli/          # Veli paneli
│   ├── api/               # API Routes
│   └── ...
├── components/            # React bileşenleri
├── hooks/                 # Custom hooks
├── lib/                   # Yardımcı fonksiyonlar
└── types/                 # TypeScript tipleri
```

## 🔐 Environment Variables

| Değişken | Açıklama |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL'i |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `GEMINI_API_KEY` | Google Gemini API anahtarı |

## 📝 Lisans

Bu proje özel kullanım içindir.

## 👥 Geliştiriciler

- Teknokul Ekibi

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!

