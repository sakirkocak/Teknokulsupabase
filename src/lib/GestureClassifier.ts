/**
 * Gesture Classifier - Profesyonel El Hareketi Tanıma
 * 
 * MediaPipe Hands landmarks'ından gesture'ları algılar.
 * Her gesture için confidence score verir.
 * 
 * Desteklenen Gesture'lar:
 * - OPEN_PALM: Açık el (5 parmak açık)
 * - CLOSED_FIST: Yumruk (tüm parmaklar kapalı)
 * - PINCH: Başparmak + işaret parmağı birleşik
 * - POINTING: İşaret parmağı uzatılmış, diğerleri kapalı
 * - VICTORY: ✌️ İşaret + orta parmak açık
 * - THUMB_UP: 👍 Sadece başparmak açık
 * - THREE: 3 parmak açık
 */

export type GestureType = 
  | 'OPEN_PALM'     // 🖐️ Açık el
  | 'CLOSED_FIST'   // ✊ Yumruk
  | 'PINCH'         // 🤏 Sıkıştırma
  | 'POINTING'      // 👆 İşaret
  | 'VICTORY'       // ✌️ Zafer
  | 'THUMB_UP'      // 👍 Beğeni
  | 'THREE'         // 3️⃣ Üç
  | 'UNKNOWN'       // ❓ Bilinmiyor

export interface GestureResult {
  gesture: GestureType
  confidence: number      // 0-1 arası
  fingerStates: {
    thumb: boolean        // Başparmak açık mı
    index: boolean        // İşaret parmağı açık mı
    middle: boolean       // Orta parmak açık mı
    ring: boolean         // Yüzük parmağı açık mı
    pinky: boolean        // Serçe parmak açık mı
  }
  pinchDistance: number   // Pinch mesafesi (0-1)
  handRotation: number    // El dönüş açısı (radyan)
}

// Landmark indices
const WRIST = 0
const THUMB_CMC = 1
const THUMB_MCP = 2
const THUMB_IP = 3
const THUMB_TIP = 4
const INDEX_MCP = 5
const INDEX_PIP = 6
const INDEX_DIP = 7
const INDEX_TIP = 8
const MIDDLE_MCP = 9
const MIDDLE_PIP = 10
const MIDDLE_DIP = 11
const MIDDLE_TIP = 12
const RING_MCP = 13
const RING_PIP = 14
const RING_DIP = 15
const RING_TIP = 16
const PINKY_MCP = 17
const PINKY_PIP = 18
const PINKY_DIP = 19
const PINKY_TIP = 20

export class GestureClassifier {
  private smoothedResults: GestureResult[] = []
  private readonly SMOOTH_WINDOW = 3

  /**
   * Landmarks'tan gesture algıla
   */
  classify(landmarks: any[]): GestureResult {
    if (!landmarks || landmarks.length < 21) {
      return this.createUnknownResult()
    }

    // Parmak durumlarını hesapla
    const fingerStates = this.getFingerStates(landmarks)
    const pinchDistance = this.getPinchDistance(landmarks)
    const handRotation = this.getHandRotation(landmarks)

    // Gesture'ı belirle
    const { gesture, confidence } = this.determineGesture(
      fingerStates,
      pinchDistance,
      landmarks
    )

    const result: GestureResult = {
      gesture,
      confidence,
      fingerStates,
      pinchDistance,
      handRotation
    }

    // Smooth results
    return this.smoothResult(result)
  }

  /**
   * Her parmağın açık/kapalı durumunu hesapla
   */
  private getFingerStates(landmarks: any[]): GestureResult['fingerStates'] {
    return {
      thumb: this.isThumbOpen(landmarks),
      index: this.isFingerOpen(landmarks, INDEX_PIP, INDEX_TIP),
      middle: this.isFingerOpen(landmarks, MIDDLE_PIP, MIDDLE_TIP),
      ring: this.isFingerOpen(landmarks, RING_PIP, RING_TIP),
      pinky: this.isFingerOpen(landmarks, PINKY_PIP, PINKY_TIP)
    }
  }

  /**
   * Başparmak açık mı? (Özel hesaplama - yatay hareket)
   */
  private isThumbOpen(landmarks: any[]): boolean {
    const thumbTip = landmarks[THUMB_TIP]
    const thumbMcp = landmarks[THUMB_MCP]
    const indexMcp = landmarks[INDEX_MCP]
    
    if (!thumbTip || !thumbMcp || !indexMcp) return false

    // Başparmak ucu, MCP'den ne kadar uzakta?
    const distance = Math.sqrt(
      Math.pow(thumbTip.x - thumbMcp.x, 2) +
      Math.pow(thumbTip.y - thumbMcp.y, 2)
    )
    
    // Index MCP'ye olan mesafe de kontrol et
    const distToIndex = Math.sqrt(
      Math.pow(thumbTip.x - indexMcp.x, 2) +
      Math.pow(thumbTip.y - indexMcp.y, 2)
    )

    return distance > 0.05 && distToIndex > 0.08
  }

  /**
   * Parmak açık mı? (PIP ve TIP karşılaştırması)
   */
  private isFingerOpen(landmarks: any[], pipIdx: number, tipIdx: number): boolean {
    const pip = landmarks[pipIdx]
    const tip = landmarks[tipIdx]
    const mcp = landmarks[pipIdx - 1] // MCP her zaman PIP'in bir öncesi
    
    if (!pip || !tip || !mcp) return false

    // Parmak ucu, PIP'ten yukarıda mı? (Y ekseni ters)
    // Ayrıca MCP-TIP mesafesi yeterince uzun mu?
    const mcpToTip = Math.sqrt(
      Math.pow(tip.x - mcp.x, 2) +
      Math.pow(tip.y - mcp.y, 2)
    )

    return tip.y < pip.y && mcpToTip > 0.06
  }

  /**
   * Pinch mesafesi (başparmak - işaret parmağı)
   */
  private getPinchDistance(landmarks: any[]): number {
    const thumb = landmarks[THUMB_TIP]
    const index = landmarks[INDEX_TIP]
    
    if (!thumb || !index) return 1

    return Math.sqrt(
      Math.pow(thumb.x - index.x, 2) +
      Math.pow(thumb.y - index.y, 2)
    )
  }

  /**
   * El dönüş açısı (bilek -> orta parmak tabanı)
   */
  private getHandRotation(landmarks: any[]): number {
    const wrist = landmarks[WRIST]
    const middleMcp = landmarks[MIDDLE_MCP]
    
    if (!wrist || !middleMcp) return 0

    return Math.atan2(
      middleMcp.y - wrist.y,
      middleMcp.x - wrist.x
    )
  }

  /**
   * Gesture'ı ve confidence'ı belirle
   */
  private determineGesture(
    fingers: GestureResult['fingerStates'],
    pinchDist: number,
    landmarks: any[]
  ): { gesture: GestureType; confidence: number } {
    const openCount = [
      fingers.thumb,
      fingers.index,
      fingers.middle,
      fingers.ring,
      fingers.pinky
    ].filter(Boolean).length

    // PINCH: Başparmak ve işaret parmağı çok yakın
    if (pinchDist < 0.06) {
      return { gesture: 'PINCH', confidence: Math.max(0, 1 - pinchDist * 10) }
    }

    // CLOSED_FIST: Tüm parmaklar kapalı
    if (openCount === 0) {
      return { gesture: 'CLOSED_FIST', confidence: 0.95 }
    }

    // CLOSED_FIST: Sadece başparmak hafif açık olabilir
    if (openCount === 1 && fingers.thumb && !fingers.index && !fingers.middle) {
      return { gesture: 'CLOSED_FIST', confidence: 0.85 }
    }

    // THUMB_UP: Sadece başparmak açık
    if (fingers.thumb && !fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
      return { gesture: 'THUMB_UP', confidence: 0.9 }
    }

    // POINTING: Sadece işaret parmağı açık
    if (!fingers.thumb && fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
      return { gesture: 'POINTING', confidence: 0.9 }
    }

    // POINTING: Başparmak + işaret açık (diğerleri kapalı)
    if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
      return { gesture: 'POINTING', confidence: 0.8 }
    }

    // VICTORY: İşaret + orta parmak açık
    if (fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
      return { gesture: 'VICTORY', confidence: 0.9 }
    }

    // THREE: 3 parmak açık
    if (openCount === 3) {
      return { gesture: 'THREE', confidence: 0.85 }
    }

    // OPEN_PALM: 4-5 parmak açık
    if (openCount >= 4) {
      return { gesture: 'OPEN_PALM', confidence: 0.7 + openCount * 0.06 }
    }

    return { gesture: 'UNKNOWN', confidence: 0.3 }
  }

  /**
   * Sonuçları smooth et (titreme önleme)
   */
  private smoothResult(result: GestureResult): GestureResult {
    this.smoothedResults.push(result)
    
    if (this.smoothedResults.length > this.SMOOTH_WINDOW) {
      this.smoothedResults.shift()
    }

    // En sık görülen gesture'ı bul
    const gestureCounts = new Map<GestureType, number>()
    let totalConfidence = 0

    for (const r of this.smoothedResults) {
      gestureCounts.set(r.gesture, (gestureCounts.get(r.gesture) || 0) + 1)
      totalConfidence += r.confidence
    }

    let maxCount = 0
    let dominantGesture: GestureType = 'UNKNOWN'

    gestureCounts.forEach((count, gesture) => {
      if (count > maxCount) {
        maxCount = count
        dominantGesture = gesture
      }
    })

    // Eğer dominant gesture yeterince baskın değilse, en son sonucu döndür
    if (maxCount < this.smoothedResults.length * 0.6) {
      return result
    }

    return {
      ...result,
      gesture: dominantGesture,
      confidence: totalConfidence / this.smoothedResults.length
    }
  }

  /**
   * Bilinmeyen sonuç oluştur
   */
  private createUnknownResult(): GestureResult {
    return {
      gesture: 'UNKNOWN',
      confidence: 0,
      fingerStates: {
        thumb: false,
        index: false,
        middle: false,
        ring: false,
        pinky: false
      },
      pinchDistance: 1,
      handRotation: 0
    }
  }

  /**
   * Reset
   */
  reset(): void {
    this.smoothedResults = []
  }
}

// Gesture için emoji ve Türkçe isim
export const GestureLabels: Record<GestureType, { emoji: string; name: string }> = {
  'OPEN_PALM': { emoji: '🖐️', name: 'Açık El' },
  'CLOSED_FIST': { emoji: '✊', name: 'Yumruk' },
  'PINCH': { emoji: '🤏', name: 'Sıkıştır' },
  'POINTING': { emoji: '👆', name: 'İşaret' },
  'VICTORY': { emoji: '✌️', name: 'Zafer' },
  'THUMB_UP': { emoji: '👍', name: 'Beğeni' },
  'THREE': { emoji: '3️⃣', name: 'Üç' },
  'UNKNOWN': { emoji: '❓', name: 'Bilinmiyor' }
}

export default GestureClassifier
