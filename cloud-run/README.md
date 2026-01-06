# 🎬 Teknokul Video Generator - Google Cloud Run

AI destekli video çözüm üretici.

## 🚀 Kurulum

### 1. Google Cloud CLI kurulumu

```bash
# macOS
brew install google-cloud-sdk

# Giriş yap
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. API'leri etkinleştir

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

### 3. Deploy

```bash
cd cloud-run

# Build ve deploy (tek komut)
gcloud run deploy teknokul-video \
  --source . \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars "API_SECRET=your-secret,TEKNOKUL_API_BASE=https://teknokul.com.tr,ELEVENLABS_API_KEY=your-key,GEMINI_API_KEY=your-key"
```

### 4. URL al

Deploy sonrası URL verilir:
```
https://teknokul-video-xxxxx-ew.a.run.app
```

Bu URL'i Vercel'e environment variable olarak ekle:
```
VIDEO_GENERATOR_URL=https://teknokul-video-xxxxx-ew.a.run.app
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Video Üret (Async)
```
POST /generate
Authorization: Bearer YOUR_API_SECRET
Content-Type: application/json

{
  "question_id": "abc123",
  "question_text": "Soru metni...",
  "options": {"A": "...", "B": "..."},
  "correct_answer": "A",
  "topic_name": "Denklemler",
  "subject_name": "Matematik",
  "grade": 8
}
```

### Video Üret (Sync - Bekler)
```
POST /generate-sync
```

## 💰 Maliyet Tahmini

- Cloud Run: ~$0.00002400/vCPU-second
- Bir video (~2 dakika işlem): ~$0.003
- Günde 50 video: ~$0.15/gün = ~$4.5/ay

## 🔧 Environment Variables

| Değişken | Açıklama |
|----------|----------|
| API_SECRET | API güvenlik anahtarı |
| TEKNOKUL_API_BASE | Ana site URL'i |
| ELEVENLABS_API_KEY | ElevenLabs API key |
| GEMINI_API_KEY | Google Gemini API key |

## 📝 Logs

```bash
gcloud run services logs read teknokul-video --region europe-west1
```
