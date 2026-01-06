# Teknokul Video Generator - Cloud Run
FROM python:3.11-slim

# Sistem bağımlılıkları
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libcairo2-dev \
    libpango1.0-dev \
    pkg-config \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    texlive-lang-other \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

# Türkçe karakter desteği
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# Çalışma dizini
WORKDIR /app

# Python bağımlılıkları
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama dosyaları
COPY . .

# Port
ENV PORT=8080
EXPOSE 8080

# Başlat
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
