/**
 * One Euro Filter - Profesyonel El Takibi için Smoothing Algoritması
 * 
 * VR/AR sistemlerinde (Oculus, HoloLens, Leap Motion) kullanılan
 * endüstri standardı titreme önleme algoritması.
 * 
 * Özellikler:
 * - Yavaş hareketlerde: Çok smooth (titreme yok)
 * - Hızlı hareketlerde: Minimum gecikme (responsive)
 * 
 * Paper: "1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Interactive Systems"
 * Authors: Géry Casiez, Nicolas Roussel, Daniel Vogel
 * 
 * @see https://cristal.univ-lille.fr/~casiez/1euro/
 */

// Low-pass filter helper
class LowPassFilter {
  private y: number | null = null
  private s: number | null = null

  constructor(private alpha: number = 0.5) {}

  setAlpha(alpha: number): void {
    this.alpha = Math.max(0, Math.min(1, alpha))
  }

  filter(value: number): number {
    if (this.y === null) {
      this.y = value
      this.s = value
    } else {
      this.s = this.alpha * value + (1 - this.alpha) * (this.s ?? value)
      this.y = this.s
    }
    return this.y
  }

  lastValue(): number | null {
    return this.y
  }

  reset(): void {
    this.y = null
    this.s = null
  }
}

export interface OneEuroFilterConfig {
  /** Minimum cutoff frequency (Hz). Lower = more smoothing. Default: 1.0 */
  minCutoff?: number
  /** Speed coefficient. Higher = less smoothing at high speed. Default: 0.0 */
  beta?: number
  /** Derivative cutoff frequency. Default: 1.0 */
  dCutoff?: number
  /** Initial frequency estimate. Default: 120 (typical webcam FPS) */
  freq?: number
}

export class OneEuroFilter {
  private freq: number
  private minCutoff: number
  private beta: number
  private dCutoff: number
  
  private xFilter: LowPassFilter
  private dxFilter: LowPassFilter
  private lastTime: number | null = null
  
  constructor(config: OneEuroFilterConfig = {}) {
    this.freq = config.freq ?? 120
    this.minCutoff = config.minCutoff ?? 1.0
    this.beta = config.beta ?? 0.0
    this.dCutoff = config.dCutoff ?? 1.0
    
    this.xFilter = new LowPassFilter(this.alpha(this.minCutoff))
    this.dxFilter = new LowPassFilter(this.alpha(this.dCutoff))
  }

  private alpha(cutoff: number): number {
    const te = 1.0 / this.freq
    const tau = 1.0 / (2 * Math.PI * cutoff)
    return 1.0 / (1.0 + tau / te)
  }

  /**
   * Filter a value
   * @param value - Raw input value
   * @param timestamp - Optional timestamp in milliseconds
   * @returns Filtered (smoothed) value
   */
  filter(value: number, timestamp?: number): number {
    // Update frequency based on timestamp
    if (timestamp !== undefined && this.lastTime !== null) {
      const dt = (timestamp - this.lastTime) / 1000 // Convert to seconds
      if (dt > 0) {
        this.freq = 1.0 / dt
      }
    }
    this.lastTime = timestamp ?? Date.now()

    // Get previous filtered value
    const prevX = this.xFilter.lastValue()
    
    // Estimate derivative (speed)
    const dx = prevX !== null 
      ? (value - prevX) * this.freq 
      : 0
    
    // Filter derivative
    const edx = this.dxFilter.filter(dx)
    
    // Adaptive cutoff based on speed
    // Higher speed → higher cutoff → less smoothing
    const cutoff = this.minCutoff + this.beta * Math.abs(edx)
    
    // Update alpha and filter
    this.xFilter.setAlpha(this.alpha(cutoff))
    
    return this.xFilter.filter(value)
  }

  /**
   * Reset the filter state
   */
  reset(): void {
    this.xFilter.reset()
    this.dxFilter.reset()
    this.lastTime = null
  }

  /**
   * Update filter parameters
   */
  setParams(config: Partial<OneEuroFilterConfig>): void {
    if (config.minCutoff !== undefined) this.minCutoff = config.minCutoff
    if (config.beta !== undefined) this.beta = config.beta
    if (config.dCutoff !== undefined) this.dCutoff = config.dCutoff
    if (config.freq !== undefined) this.freq = config.freq
  }
}

/**
 * 2D koordinatlar için One Euro Filter
 * El pozisyonu gibi X,Y çiftleri için
 */
export class OneEuroFilter2D {
  private xFilter: OneEuroFilter
  private yFilter: OneEuroFilter

  constructor(config: OneEuroFilterConfig = {}) {
    this.xFilter = new OneEuroFilter(config)
    this.yFilter = new OneEuroFilter(config)
  }

  filter(x: number, y: number, timestamp?: number): { x: number; y: number } {
    return {
      x: this.xFilter.filter(x, timestamp),
      y: this.yFilter.filter(y, timestamp)
    }
  }

  reset(): void {
    this.xFilter.reset()
    this.yFilter.reset()
  }

  setParams(config: Partial<OneEuroFilterConfig>): void {
    this.xFilter.setParams(config)
    this.yFilter.setParams(config)
  }
}

/**
 * Preset configurations for different use cases
 */
export const FilterPresets = {
  /** Very smooth, good for slow/precise movements */
  SMOOTH: {
    minCutoff: 0.5,
    beta: 0.0001,
    dCutoff: 1.0
  },
  /** Balanced smoothing and responsiveness */
  BALANCED: {
    minCutoff: 1.0,
    beta: 0.007,
    dCutoff: 1.0
  },
  /** Fast response, minimal smoothing */
  RESPONSIVE: {
    minCutoff: 1.5,
    beta: 0.5,
    dCutoff: 1.0
  },
  /** Optimized for hand tracking */
  HAND_TRACKING: {
    minCutoff: 1.0,
    beta: 0.01,
    dCutoff: 1.0
  },
  /** Optimized for pinch gestures */
  PINCH: {
    minCutoff: 0.8,
    beta: 0.005,
    dCutoff: 1.0
  },
  /** Optimized for rotation */
  ROTATION: {
    minCutoff: 0.5,
    beta: 0.003,
    dCutoff: 1.0
  }
} as const

export default OneEuroFilter
