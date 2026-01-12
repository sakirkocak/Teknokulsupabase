/**
 * Hand Calibration System - Kişiselleştirilmiş El Takibi
 * 
 * Her kullanıcının eli farklı boyutta ve kamera mesafesi farklı.
 * Bu sistem başlangıçta kalibrasyon yaparak threshold'ları
 * kullanıcıya özel ayarlar.
 * 
 * Kalibrasyon Adımları:
 * 1. "Elini aç" → Max pinch mesafesi (açık el)
 * 2. "Yumruk yap" → Min pinch mesafesi (kapalı el)
 * 3. Threshold'ları bu değerlere göre normalize et
 */

export interface CalibrationData {
  // Pinch mesafeleri
  openHandPinchDistance: number    // El açıkken parmak mesafesi
  closedHandPinchDistance: number  // Yumrukken parmak mesafesi
  
  // Hesaplanan threshold'lar
  pinchThreshold: number           // Bu mesafenin altı = pinch
  pinchReadyThreshold: number      // Pinch'e yakın
  grabThreshold: number            // Yumruk algılama
  
  // Meta
  calibratedAt: number             // Timestamp
  isCalibrated: boolean
}

export type CalibrationStep = 
  | 'NOT_STARTED'
  | 'WAITING_OPEN_HAND'    // El açılmasını bekliyor
  | 'RECORDING_OPEN'       // Açık el kaydediliyor
  | 'WAITING_CLOSED_HAND'  // Yumruk yapılmasını bekliyor
  | 'RECORDING_CLOSED'     // Kapalı el kaydediliyor
  | 'COMPLETED'            // Kalibrasyon tamamlandı
  | 'FAILED'               // Başarısız

export interface CalibrationState {
  step: CalibrationStep
  progress: number         // 0-100
  message: string
  instruction: string
  samples: number[]        // Toplanan örnekler
}

const DEFAULT_CALIBRATION: CalibrationData = {
  openHandPinchDistance: 0.25,
  closedHandPinchDistance: 0.05,
  pinchThreshold: 0.12,
  pinchReadyThreshold: 0.18,
  grabThreshold: 0.08,
  calibratedAt: 0,
  isCalibrated: false
}

const SAMPLES_NEEDED = 15  // Her adım için gerekli örnek sayısı
const SAMPLE_INTERVAL = 50 // ms - örnekler arası süre

export class HandCalibration {
  private data: CalibrationData = { ...DEFAULT_CALIBRATION }
  private state: CalibrationState = {
    step: 'NOT_STARTED',
    progress: 0,
    message: '',
    instruction: '',
    samples: []
  }
  
  private lastSampleTime: number = 0
  private onStateChange?: (state: CalibrationState) => void
  private onComplete?: (data: CalibrationData) => void

  constructor() {
    // LocalStorage'dan önceki kalibrasyonu yükle
    this.loadFromStorage()
  }

  /**
   * Kalibrasyon başlat
   */
  start(
    onStateChange: (state: CalibrationState) => void,
    onComplete: (data: CalibrationData) => void
  ): void {
    this.onStateChange = onStateChange
    this.onComplete = onComplete
    
    this.state = {
      step: 'WAITING_OPEN_HAND',
      progress: 0,
      message: '👋 Kalibrasyona Başlıyoruz!',
      instruction: 'Elini kameraya göster ve AÇ',
      samples: []
    }
    
    this.emitState()
  }

  /**
   * Her frame çağrılmalı - el verilerini işler
   */
  update(pinchDistance: number, isHandClosed: boolean, handDetected: boolean): void {
    if (this.state.step === 'NOT_STARTED' || this.state.step === 'COMPLETED') {
      return
    }
    
    // El algılanmadıysa bekle
    if (!handDetected) {
      this.state.message = '❌ El algılanmadı!'
      this.state.instruction = 'Elini kameraya göster'
      this.emitState()
      return
    }
    
    const now = Date.now()
    
    switch (this.state.step) {
      case 'WAITING_OPEN_HAND':
        // El açık mı kontrol et (pinch mesafesi yüksek olmalı)
        if (pinchDistance > 0.15 && !isHandClosed) {
          this.state.step = 'RECORDING_OPEN'
          this.state.samples = []
          this.state.message = '✅ Güzel! Elini açık tut...'
          this.state.instruction = 'Hareket etme, kaydediyorum'
        }
        break
        
      case 'RECORDING_OPEN':
        // Örnekleri topla
        if (now - this.lastSampleTime >= SAMPLE_INTERVAL) {
          if (pinchDistance > 0.1) { // Hala açıksa kaydet
            this.state.samples.push(pinchDistance)
            this.lastSampleTime = now
            this.state.progress = (this.state.samples.length / SAMPLES_NEEDED) * 50
            this.state.message = `📊 Kaydediliyor... ${this.state.samples.length}/${SAMPLES_NEEDED}`
            
            if (this.state.samples.length >= SAMPLES_NEEDED) {
              // Açık el kaydı tamamlandı
              this.data.openHandPinchDistance = this.calculateMedian(this.state.samples)
              this.state.step = 'WAITING_CLOSED_HAND'
              this.state.samples = []
              this.state.message = '✊ Şimdi YUMRUK yap!'
              this.state.instruction = 'Elini kapat ve bekle'
            }
          } else {
            // El kapandı, yeniden başla
            this.state.step = 'WAITING_OPEN_HAND'
            this.state.samples = []
            this.state.message = '⚠️ El kapandı! Tekrar aç'
            this.state.instruction = 'Elini kameraya göster ve AÇ'
          }
        }
        break
        
      case 'WAITING_CLOSED_HAND':
        // El kapalı mı kontrol et
        if (pinchDistance < 0.1 || isHandClosed) {
          this.state.step = 'RECORDING_CLOSED'
          this.state.samples = []
          this.state.message = '✅ Güzel! Yumruğu tut...'
          this.state.instruction = 'Hareket etme, kaydediyorum'
        }
        break
        
      case 'RECORDING_CLOSED':
        // Örnekleri topla
        if (now - this.lastSampleTime >= SAMPLE_INTERVAL) {
          if (pinchDistance < 0.15) { // Hala kapalıysa kaydet
            this.state.samples.push(pinchDistance)
            this.lastSampleTime = now
            this.state.progress = 50 + (this.state.samples.length / SAMPLES_NEEDED) * 50
            this.state.message = `📊 Kaydediliyor... ${this.state.samples.length}/${SAMPLES_NEEDED}`
            
            if (this.state.samples.length >= SAMPLES_NEEDED) {
              // Kapalı el kaydı tamamlandı
              this.data.closedHandPinchDistance = this.calculateMedian(this.state.samples)
              this.finishCalibration()
            }
          } else {
            // El açıldı, yeniden başla
            this.state.step = 'WAITING_CLOSED_HAND'
            this.state.samples = []
            this.state.message = '⚠️ El açıldı! Tekrar kapat'
            this.state.instruction = 'Yumruk yap ve bekle'
          }
        }
        break
    }
    
    this.emitState()
  }

  /**
   * Kalibrasyonu tamamla ve threshold'ları hesapla
   */
  private finishCalibration(): void {
    const open = this.data.openHandPinchDistance
    const closed = this.data.closedHandPinchDistance
    const range = open - closed
    
    // Threshold'ları hesapla (range'e göre normalize)
    this.data.pinchThreshold = closed + range * 0.3      // %30 noktası
    this.data.pinchReadyThreshold = closed + range * 0.5 // %50 noktası
    this.data.grabThreshold = closed + range * 0.2       // %20 noktası
    
    this.data.calibratedAt = Date.now()
    this.data.isCalibrated = true
    
    // LocalStorage'a kaydet
    this.saveToStorage()
    
    this.state.step = 'COMPLETED'
    this.state.progress = 100
    this.state.message = '🎉 Kalibrasyon Tamamlandı!'
    this.state.instruction = 'Artık sana özel ayarlandı'
    
    this.emitState()
    this.onComplete?.(this.data)
  }

  /**
   * Medyan hesapla (outlier'lara karşı robust)
   */
  private calculateMedian(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2
  }

  /**
   * State değişikliğini bildir
   */
  private emitState(): void {
    this.onStateChange?.({ ...this.state })
  }

  /**
   * LocalStorage'a kaydet
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('jarvis_calibration', JSON.stringify(this.data))
    } catch (e) {
      console.warn('Kalibrasyon kaydedilemedi:', e)
    }
  }

  /**
   * LocalStorage'dan yükle
   */
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('jarvis_calibration')
      if (saved) {
        const parsed = JSON.parse(saved) as CalibrationData
        // 24 saatten eski değilse kullan
        if (parsed.calibratedAt && Date.now() - parsed.calibratedAt < 24 * 60 * 60 * 1000) {
          this.data = parsed
        }
      }
    } catch (e) {
      console.warn('Kalibrasyon yüklenemedi:', e)
    }
  }

  /**
   * Kalibre edilmiş verileri al
   */
  getData(): CalibrationData {
    return { ...this.data }
  }

  /**
   * Kalibre edilmiş mi?
   */
  isCalibrated(): boolean {
    return this.data.isCalibrated
  }

  /**
   * Kalibrasyonu sıfırla
   */
  reset(): void {
    this.data = { ...DEFAULT_CALIBRATION }
    this.state = {
      step: 'NOT_STARTED',
      progress: 0,
      message: '',
      instruction: '',
      samples: []
    }
    try {
      localStorage.removeItem('jarvis_calibration')
    } catch (e) {}
  }

  /**
   * Mevcut state'i al
   */
  getState(): CalibrationState {
    return { ...this.state }
  }

  /**
   * Kalibrasyonu atla (varsayılan değerlerle devam et)
   */
  skip(): void {
    this.state.step = 'COMPLETED'
    this.emitState()
    this.onComplete?.(this.data)
  }
}

export default HandCalibration
