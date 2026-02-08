# Teknokul - Proje Context

## Genel Bakis

Teknokul, Turkiye'deki ogrenciler icin yapay zeka destekli egitim platformudur. LGS ve YKS sinavlarina hazirlanan ogrencilere soru bankasi, interaktif cozumler, AI kocluk, canli ders, gamification ve rekabetci ogrenme ozellikleri sunar.

- **URL:** https://www.teknokul.com.tr
- **Repo:** github.com/sakirkocak/Teknokulsupabase
- **Deploy:** Vercel (Frankfurt/fra1)
- **Hedef:** 1 milyon soru, her soru icin bagimsiz SEO sayfasi

## Mimari Prensipler (KRITIK)

### 1. Performans Oncelikli - Typesense First
**Supabase SADECE veri depolama icindir.** Okuma/arama/listeleme islemlerinde Typesense kullanilir. Supabase'e dogrudan sorgu atarak siteyi yavaslatma.

```
YAZMA: Client → API Route → Supabase (INSERT/UPDATE) → Trigger → Typesense sync
OKUMA: Client → Typesense (arama, listeleme, filtreleme, leaderboard)
```

- Soru arama/listeleme → Typesense (`questions` collection)
- Leaderboard → Typesense (`leaderboard` collection)
- Ogrenci istatistikleri → Typesense (`student_stats` collection)
- Konum/okul arama → Typesense (`locations`, `schools` collection)
- Supabase sorgusu YALNIZCA: auth, profil guncelleme, veri yazma, realtime

**Yeni ozellik eklerken:** Eger veri okuma/listeleme gerektiriyorsa, ONCE Typesense collection var mi kontrol et. Yoksa olustur. Supabase'e SELECT sorgusu atma.

### 2. Vektorel / Semantik Arama
- Her soru icin **Gemini embedding** olusturulur ve Typesense'e kaydedilir
- Typesense uzerinden **vektorel arama** destegi aktif
- Semantik arama endpoint: `POST /api/search/semantic`
- Kullanim: "Bu soruya benzer sorular", "Konu bazli oneri", akilli arama

### 3. SEO & 1 Milyon Soru Hedefi
- Her soru icin `/sorular/[subject]/[grade]/[id]` formatinda bagimsiz sayfa
- **ISR (Incremental Static Regeneration)** ile statik sayfa uretimi
- Google bot ilk kez istekte bulunursa sayfa otomatik olusturulur (on-demand ISR)
- Soru uretimi: **Gemini AI** ile toplu uretim
- SEO indexing: Haftalik cron ile Google'a bildirim (`/api/cron/seo-index`)
- Hedef: 1.000.000 benzersiz soru sayfasi → organik trafik

### 4. Supabase Sismemeli
Supabase free/pro tier sinirlarini asmamak icin:
- Agir sorgular (JOIN, aggregate, full-text search) Typesense'e tasindi
- Supabase'de sadece basit CRUD + auth + realtime
- Leaderboard verileri haftalik sifirlanir (Typesense'de)
- `student_points` tablosu minimal tutulur (tum zamanlar ozeti)

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14.2.5, React 18, TypeScript 5, Tailwind CSS |
| Animasyon | Framer Motion, GSAP, Lottie, Three.js |
| Veritabani | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Arama | Typesense Cloud (Frankfurt) |
| AI | Google Gemini 2.5 Flash (`@google/genai`), OpenAI (TTS/Chat) |
| Canli Ders | LiveKit (WebRTC) |
| TTS | ElevenLabs, OpenAI TTS |
| Video | Remotion (React video renderer) |
| Matematik | KaTeX (LaTeX rendering) |
| Mobile | Expo (React Native) - `mobile/` dizini |
| Video Backend | Python FastAPI - `cloud-run/` dizini |
| Test | Cypress |
| DnD | @dnd-kit/core, @dnd-kit/sortable |

## Proje Yapisi

```
src/
├── app/                         # Next.js App Router
│   ├── (auth)/                  # Giris/kayit sayfalari
│   │   ├── giris/               # Login
│   │   └── kayit/               # Register
│   ├── (dashboard)/             # Rol bazli paneller
│   │   ├── admin/               # Admin paneli
│   │   ├── koc/                 # Ogretmen/koc paneli
│   │   ├── ogrenci/             # Ogrenci paneli
│   │   ├── ogretmen/            # Ogretmen paneli
│   │   ├── veli/                # Veli paneli
│   │   └── demo/                # Misafir erisimi
│   ├── api/                     # 47+ API route (detay asagida)
│   ├── soru-bankasi/            # Soru bankasi sayfalari
│   ├── sorular/                 # Soru cozme sayfalari
│   ├── liderlik/                # Leaderboard sayfasi
│   ├── rozetler/                # Badge sayfasi
│   ├── hizli-coz/               # Hizli soru cozme
│   ├── tekno-ogretmen/          # AI ogretmen (live)
│   ├── jarvis/studio/           # Jarvis AI studio
│   ├── lgs-puan-hesaplama/      # LGS puan hesaplama
│   ├── yks-puan-hesaplama/      # YKS puan hesaplama
│   └── yasal/                   # Hukuki sayfalar
├── components/                  # React bilesenleri
│   ├── ai-coach/                # AI Koc (analiz, chat, gorevler)
│   ├── gamification/            # XP, badge, streak, daily challenges
│   ├── interactive-solution/    # Rehberli kesif, widget'lar
│   ├── jarvis/                  # Jarvis AI tutor
│   ├── JarvisStudio/            # Jarvis Studio (quiz, voice, 3D)
│   ├── TeknoTeacher/            # Canli AI ogretmen
│   ├── leaderboard/             # Liderlik tablosu bilesenleri
│   ├── lobby/                   # Duello lobby
│   ├── matchmaking/             # Rekabetci eslesme
│   ├── magic-search/            # Akilli arama
│   ├── layout/                  # Dashboard layout, bildirimler
│   ├── security/                # HoneypotTrap
│   └── ui/                      # UI primitives
├── hooks/                       # 17 custom hook
│   ├── useGamification.ts       # XP/level/streak/badge yonetimi
│   ├── useTTS.ts                # Text-to-speech
│   ├── useDuelRealtime.ts       # Duello realtime
│   ├── useGeminiLive.ts         # Gemini Live API
│   ├── useHandTracking.ts       # El takibi (MediaPipe)
│   ├── useMockExam.ts           # Deneme sinavi state yonetimi
│   └── ...
├── lib/                         # Yardimci kutuphaneler
│   ├── supabase/                # client.ts (browser), server.ts (SSR)
│   ├── typesense/               # client.ts, collections.ts, browser-client.ts
│   ├── security/                # anti-scraping.ts (bot/rate limit)
│   ├── ai-coach/                # prompts.ts, gemini.ts
│   ├── latex/                   # normalizer, sanitizer, validator
│   ├── question-bank/           # PDF olusturma, parser
│   ├── jarvis/                  # scenes, voice-scripts
│   ├── mock-exam/               # types.ts, scoring.ts, constants.ts
│   ├── guestTracker.ts          # Misafir soru cozme takibi (localStorage)
│   ├── gamification.ts          # XP, level, badge, streak, daily challenge
│   ├── gemini.ts                # Gemini AI wrapper + retry logic
│   └── rate-limit.ts            # API rate limiting
├── types/                       # TypeScript tipleri
│   └── database.ts              # Supabase DB tipleri
├── remotion/                    # Video sablonlari
└── middleware.ts                # Auth, bot detection, rate limiting, role routing
```

## Kullanici Rolleri ve Routing

| Rol | Route Prefix | Aciklama |
|-----|-------------|----------|
| `ogrenci` | `/ogrenci/*` | Ogrenci paneli |
| `ogretmen` | `/koc/*` | Ogretmen/Koc paneli |
| `veli` | `/veli/*` | Veli paneli |
| `admin` | `/admin/*` | Admin paneli (404 gizleme ile) |

Middleware otomatik yonlendirme yapar: `ogretmen` rolu `/koc` altina, `ogrenci` rolu `/ogrenci` altina yonlendirilir. Askiya alinan hesaplar `/askiya-alindi` sayfasina yonlendirilir.

## Veritabani Semalari (Supabase)

### Ana Tablolar
- **profiles** - Kullanici profilleri (rol, isim, avatar)
- **student_points** - Gamification puanlari (XP, streak, level)
- **user_badges** - Kazanilmis rozetler
- **student_subject_points** - Ders bazli puanlar
- **point_history** - XP gecmisi (audit log)
- **questions** - 31,000+ soru (LGS/YKS)
- **duels** / **duel_stats** - Duello sistemi
- **classrooms** - Sinif yonetimi
- **tasks** - Odev/gorev sistemi
- **exam_results** - Deneme sonuclari
- **mock_exams** - Deneme sinavlari (bursluluk, LGS vb.)
- **mock_exam_questions** - Deneme sinavi sorulari (exam_id → question_id)
- **mock_exam_results** - Ogrenci deneme sonuclari (puanlama, konu analizi)
- **exam_scoring_rules** - Sinav puanlama kurallari (katsayi, baz puan)
- **user_answers** - Ogrenci cevap gecmisi (soru tekrari engelleme + AI analiz)
- **ai_coach_chats** - AI koc sohbet gecmisi
- **interactive_solutions** - Interaktif cozum cache
- **video_solutions** - Video cozum cache
- **notifications** - Bildirim sistemi
- **materials** - Materyal paylasimi

### Supabase Ozellikler
- **Auth:** Email + OAuth
- **RLS:** Tum tablolarda Row Level Security aktif
- **Realtime:** Duello ve bildirimler icin
- **Storage:** Avatar, materyal, soru gorselleri
- **Edge Functions:** Yok (API route'lar kullaniliyor)
- **Triggers:** Typesense sync, auto-update timestamp'ler

## Typesense Collections

| Collection | Kayit Sayisi | Kullanim |
|-----------|-------------|---------|
| `leaderboard` | ~200 | Liderlik tablosu, haftalik sifirlama |
| `questions` | 31,362 | Soru arama (full-text + filtreleme) |
| `topics` | - | Konu bazli arama |
| `locations` | - | Sehir/ilce arama |
| `schools` | - | Okul arama |
| `student_stats` | - | Ogrenci istatistikleri |
| `mock_exams` | - | Deneme sinavlari |
| `mock_exam_results` | - | Deneme sonuclari |

**Feature Flag:** `NEXT_PUBLIC_USE_TYPESENSE` (true/false)
**Sync:** Supabase trigger'lar + webhook (`/api/webhooks/typesense-sync`)

## API Route'lar (Onemli Olanlar)

### Gamification
- `POST /api/gamification/add-xp` - XP ekleme (bot korumasili, rate limit'li)

### AI
- `POST /api/ai/solve-question` - Soru cozme
- `POST /api/ai/explain-topic` - Konu anlatimi
- `POST /api/ai/generate-questions` - Soru uretme
- `POST /api/ai/analyze-exam` - Deneme analizi
- `POST /api/ai/generate-plan` - Calisma plani

### AI Coach
- `POST /api/ai-coach/chat` - AI Koc sohbet
- `POST /api/ai-coach/analyze` - Ogrenci analizi
- `POST /api/ai-coach/tasks` - AI gorevleri

### Duello
- `POST /api/duel/start` - Duello baslat
- `POST /api/duel/answer` - Cevap gonder
- `POST /api/duel/accept` - Kabul et

### Deneme Sinavi (Mock Exam)
- `GET /api/mock-exam/list` - Deneme listesi
- `GET /api/mock-exam/[examId]` - Deneme detayi + sorulari
- `POST /api/mock-exam/submit` - Sinav gonderme (server-side puanlama)
- `GET /api/mock-exam/results` - Ogrenci sonuclari
- `GET /api/mock-exam/results/[resultId]` - Detayli sonuc
- `POST /api/mock-exam/ai-analysis` - AI performans analizi
- `POST /api/mock-exam/admin/create` - Deneme olustur (admin)
- `PUT /api/mock-exam/admin/update` - Deneme guncelle (admin)
- `DELETE /api/mock-exam/admin/delete` - Deneme sil (admin)
- `POST /api/mock-exam/admin/generate` - AI ile soru uret (admin)

### Soru Takibi
- `GET /api/answered-questions` - Ogrencinin cozdugu soru ID'leri (cross-session dedup)
- `POST /api/adaptive-question` - Adaptif zorluk ile soru sec

### Arama
- `GET /api/leaderboard` - Liderlik (scope: turkey/city/school)
- `GET /api/search/questions` - Soru arama
- `POST /api/search/semantic` - Semantik arama

### Interaktif Cozum
- `POST /api/interactive-solution/generate` - Rehberli kesif uretimi

### Video
- `POST /api/video/generate` - Video cozum uretimi
- `POST /api/video/export` - Remotion export

### Jarvis (AI Tutor)
- `POST /api/jarvis/chat` - Sohbet
- `POST /api/jarvis/teach` - Ders anlatimi
- `POST /api/jarvis/vision` - Gorsel analiz
- `POST /api/jarvis/speak` - TTS

### Tekno Ogretmen
- `POST /api/tekno-teacher/chat` - Canli ders sohbet
- `POST /api/tekno-teacher/tts` - Ses sentezi
- `GET /api/tekno-teacher/live/*` - LiveKit entegrasyonu

### Cron Jobs
- `GET /api/cron/flush-points` - Gunluk puan flush (00:00 UTC)
- `GET /api/cron/seo-index` - Haftalik SEO index (Pazartesi 03:00 UTC)
- `GET /api/cron/reset-leaderboard` - Haftalik leaderboard sifirlama (Pazar 21:00 UTC = Pazartesi 00:00 TR)

## Gamification Sistemi

### XP Sistemi
- Dogru cevap: 10 XP
- Yanlis cevap: 2 XP (katilim puani)
- Streak bonus: 5-50 XP (gun sayisina gore)
- Combo bonus: Her 5 dogru cevapta +10 XP
- Hizli cevap bonusu: +5 XP (30 saniye altinda)
- Seviye: 1-100 (Caylak → GOAT)

### Streak Sistemi
- Her gun soru cozme = streak devam
- 1 gun aralasirsa streak sifirlir
- Yanlis cevaplarda streak HER ZAMAN sifirlanir (bot korumasi)
- `skipXpGrant=true` durumunda bile streak sifirlanir

### Rozet Sistemi (35+ rozet)
- Soru rozetleri (1, 10, 50, 100, 500, 1000, 5000)
- Streak rozetleri (3, 7, 14, 30, 100 gun)
- Basari rozetleri (%70, %80, %90, %95 accuracy)
- Hiz rozetleri
- Liderlik rozetleri (Top 100, 50, 10, 1)
- Ders rozetleri (matematik, turkce, fen, sosyal)
- AI Koc rozetleri

### Subject Points Key Formati
Ders puanlari lowercase key ile saklanir: `matematik`, `turkce`, `fen`, `sosyal`

### Gunluk Gorevler
- Deterministik secim (gunun tarihine gore seed)
- Turkiye timezone kullanir (`Europe/Istanbul`)
- 5 gorev/gun (en az 1 kolay, 1 zor)

### Haftalik Leaderboard Sifirlama
- Her Pazartesi 00:00 TR (Vercel Cron: Pazar 21:00 UTC)
- Sadece Typesense leaderboard sifirlanir
- `student_points` tablosu (tum zamanlar) korunur

## Guvenlik

### Bot/Scraping Korumasi
- **Middleware:** User-Agent blacklist (40+ bot imzasi)
- **Headless Detection:** Client Hints + header analizi
- **Rate Limiting:**
  - Soru listesi: 30 req/dakika
  - Soru detay: 60 req/dakika
  - Arama: 20 req/dakika
  - Genel API: 100 req/dakika
- **Risk Scoring:** 0-100 (50+ = engellenme)
- **IP Extraction:** Cloudflare → X-Forwarded-For → X-Real-IP

### XP Anti-Bot
- `add-xp` endpoint'inde supheli davranislarda `skipXpGrant=true`
- IP + User-Agent log'lanir (`point_history.metadata`)
- Yanlis cevaplarda streak her zaman sifirlanir

### Diger
- Admin path'ler 404 dondurur (security by obscurity)
- Supabase RLS tum tablolarda aktif
- CRON_SECRET ile cron endpoint korumasi

## Environment Variables

### Zorunlu
```
NEXT_PUBLIC_SUPABASE_URL        # Supabase proje URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY       # Supabase admin key (server-only)
GEMINI_API_KEY                  # Google Gemini API
```

### Typesense
```
TYPESENSE_HOST                  # kc8bx4n1ldm30q6fp-1.a1.typesense.net
TYPESENSE_API_KEY               # Admin key (server-only)
NEXT_PUBLIC_TYPESENSE_HOST      # Client-side host
NEXT_PUBLIC_TYPESENSE_SEARCH_KEY # Search-only key
NEXT_PUBLIC_USE_TYPESENSE       # Feature flag (true/false)
TYPESENSE_WEBHOOK_SECRET        # Webhook guvenlik
```

### AI / Medya
```
OPENAI_API_KEY                  # OpenAI (TTS, Chat)
ELEVENLABS_API_KEY              # ElevenLabs TTS
LIVEKIT_API_KEY / SECRET        # LiveKit WebRTC
```

### Cron / Guvenlik
```
CRON_SECRET                     # Vercel cron auth
```

## Build & Deploy

```bash
# Gelistirme
npm run dev

# Build (bellek gerekebilir)
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Deploy
git push origin main  # Vercel auto-deploy
```

**Vercel Config:** Frankfurt (fra1), 3 cron job, ads.txt/robot.txt redirect'leri

## Onemli Dosyalar (Sik Duzenlenenler)

| Dosya | Aciklama |
|-------|----------|
| `src/middleware.ts` | Auth, bot detection, rate limiting, routing |
| `src/lib/gamification.ts` | XP, level, badge, streak, daily challenge |
| `src/hooks/useGamification.ts` | Client-side gamification state |
| `src/lib/security/anti-scraping.ts` | Bot korumasi |
| `src/app/api/gamification/add-xp/route.ts` | XP ekleme endpoint |
| `src/app/api/leaderboard/route.ts` | Liderlik API |
| `src/components/gamification/GamificationPanel.tsx` | Gamification UI |
| `src/components/InteractiveSolutionButton.tsx` | Interaktif cozum baslat |
| `src/lib/typesense/client.ts` | Typesense baglanti + COLLECTIONS sabitleri |
| `src/lib/typesense/collections.ts` | Typesense collection semalari |
| `src/lib/gemini.ts` | Gemini AI wrapper |
| `src/app/hizli-coz/page.tsx` | Hizli soru cozme (dedup, pool filtreleme) |
| `src/app/(dashboard)/ogrenci/soru-bankasi/page.tsx` | Soru bankasi (dedup, adaptive, gorsel sorular) |
| `src/app/api/answered-questions/route.ts` | Cozulmus soru ID'leri API (cross-session dedup) |
| `src/app/api/adaptive-question/route.ts` | Adaptive zorluk soru secimi |
| `src/components/MathRenderer.tsx` | LaTeX render (regex guvenlik) |
| `src/components/QuestionCard.tsx` | Soru karti + QuestionText bileseni |
| `src/lib/guestTracker.ts` | Misafir kullanici soru takibi (localStorage) |
| `src/lib/mock-exam/types.ts` | Deneme sinavi tip tanimlari |
| `src/lib/mock-exam/scoring.ts` | Deneme sinavi puanlama motoru |
| `src/hooks/useMockExam.ts` | Deneme sinavi state yonetimi |
| `src/app/api/mock-exam/` | Deneme sinavi API route'lari (10 endpoint) |
| `src/components/mock-exam/` | Deneme sinavi UI bilesenleri (10 component) |

## Kodlama Kurallari

### Performans (EN ONEMLI)
- **Veri okuma/listeleme icin ASLA Supabase'e sorgu atma** - Typesense kullan
- Yeni ozellik eklerken ilgili Typesense collection var mi kontrol et, yoksa olustur
- Client-side'da agir hesaplama yapma, server'a tasi
- Gereksiz re-render'lardan kacin, React.memo/useMemo kullan

### Genel
- Turkce UI metinleri, Ingilizce kod degiskenleri
- Subject key'leri Typesense'de lowercase: `matematik`, `turkce`, `fen`, `sosyal`
- Tarih/saat: Turkiye timezone (`Europe/Istanbul`) kullan, UTC degil
- Supabase client: browser icin `client.ts`, server icin `server.ts`
- API route'larda her zaman hata yakalama ve anlamli hata mesajlari
- Bot korumasini bypass edecek degisiklik yapma
- `student_points` tablosu tum zamanlar verisi icin, leaderboard haftalik
- Build oncesi `NODE_OPTIONS="--max-old-space-size=4096"` gerekebilir
