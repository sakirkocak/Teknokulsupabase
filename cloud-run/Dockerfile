# Teknokul Video Factory - Cloud Run
# manimcommunity base image = sıfır kurulum hatası
FROM manimcommunity/manim:latest

# Root yetkisiyle ek paketler
USER root
RUN apt-get update && apt-get install -y \
    ffmpeg \
    sox \
    curl \
    fonts-noto \
    fonts-noto-color-emoji \
    fonts-dejavu \
    fontconfig \
    && rm -rf /var/lib/apt/lists/* \
    && fc-cache -fv

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
