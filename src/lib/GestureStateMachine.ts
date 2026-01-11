/**
 * Gesture State Machine - Profesyonel El Hareketi Yönetimi
 * 
 * Random if-else yerine düzgün state transitions:
 * - Her gesture için belirli state'ler
 * - Debounce ile yanlış algılama önleme
 * - Confidence threshold ile güvenilirlik
 * - Event-based callback sistemi
 */

// ============================================
// TYPES & INTERFACES
// ============================================

export type GestureState = 
  | 'IDLE'           // El açık, hiçbir şey yapılmıyor
  | 'PINCH_READY'    // Pinch'e yakın, henüz başlamadı
  | 'PINCHING'       // Pinch aktif
  | 'GRAB_READY'     // Yumruk yapılmak üzere
  | 'GRABBING'       // Yumruk aktif (tutma)
  | 'CORNER_HOVER'   // Köşeye yakın
  | 'CORNER_GRAB'    // Köşe tutuldu

export type GestureEvent = 
  | 'PINCH_START'
  | 'PINCH_END'
  | 'GRAB_START'
  | 'GRAB_END'
  | 'CORNER_ENTER'
  | 'CORNER_GRAB'
  | 'CORNER_RELEASE'
  | 'HAND_LOST'
  | 'HAND_FOUND'

export interface GestureInput {
  handDetected: boolean
  pinchDistance: number      // 0-1 arası, 0 = kapalı
  isHandClosed: boolean      // Yumruk mu?
  nearestCorner: number | null  // 0, 1, 2 veya null
  handX: number              // 0-1 arası
  handY: number              // 0-1 arası
  handRotation: number       // Radyan
  timestamp: number          // ms
}

export interface GestureOutput {
  state: GestureState
  event: GestureEvent | null
  confidence: number         // 0-1 arası
  stateTime: number          // Bu state'te geçen süre (ms)
  corner: number | null      // Aktif köşe
  canTransition: boolean     // Debounce geçti mi?
}

export interface GestureConfig {
  // Threshold'lar
  pinchThreshold: number           // Bu mesafenin altı = pinch (default: 0.12)
  pinchReadyThreshold: number      // Pinch'e yakın (default: 0.2)
  cornerProximity: number          // Köşe algılama mesafesi (default: 0.15)
  
  // Debounce süreleri (ms)
  minPinchDuration: number         // Pinch için min süre (default: 100)
  minGrabDuration: number          // Grab için min süre (default: 80)
  stateChangeCooldown: number      // State değişimi arası min süre (default: 50)
  
  // Confidence
  minConfidenceForTransition: number  // Min güvenilirlik (default: 0.7)
}

// ============================================
// DEFAULT CONFIG
// ============================================

const DEFAULT_CONFIG: GestureConfig = {
  pinchThreshold: 0.12,
  pinchReadyThreshold: 0.2,
  cornerProximity: 0.15,
  minPinchDuration: 100,
  minGrabDuration: 80,
  stateChangeCooldown: 50,
  minConfidenceForTransition: 0.6
}

// ============================================
// STATE MACHINE
// ============================================

export class GestureStateMachine {
  private state: GestureState = 'IDLE'
  private previousState: GestureState = 'IDLE'
  private stateStartTime: number = Date.now()
  private lastTransitionTime: number = 0
  private config: GestureConfig
  private activeCorner: number | null = null
  
  // Confidence tracking
  private confidenceHistory: number[] = []
  private readonly CONFIDENCE_WINDOW = 5
  
  // Event listeners
  private listeners: Map<GestureEvent, Set<(data: any) => void>> = new Map()

  constructor(config: Partial<GestureConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Ana güncelleme fonksiyonu - her frame çağrılmalı
   */
  update(input: GestureInput): GestureOutput {
    const now = input.timestamp
    const stateTime = now - this.stateStartTime
    const timeSinceLastTransition = now - this.lastTransitionTime
    const canTransition = timeSinceLastTransition >= this.config.stateChangeCooldown
    
    // El kayboldu mu?
    if (!input.handDetected) {
      if (this.state !== 'IDLE') {
        this.transitionTo('IDLE', now)
        this.emit('HAND_LOST', {})
      }
      return this.createOutput(null, 0, canTransition, stateTime)
    }
    
    // El bulundu (IDLE'dan geliyorsak)
    if (this.previousState === 'IDLE' && this.state === 'IDLE' && input.handDetected) {
      this.emit('HAND_FOUND', { x: input.handX, y: input.handY })
    }
    
    // Confidence hesapla
    const confidence = this.calculateConfidence(input)
    
    // State transition logic
    let event: GestureEvent | null = null
    
    switch (this.state) {
      case 'IDLE':
        event = this.handleIdleState(input, canTransition, now)
        break
        
      case 'PINCH_READY':
        event = this.handlePinchReadyState(input, canTransition, stateTime, now)
        break
        
      case 'PINCHING':
        event = this.handlePinchingState(input, canTransition, now)
        break
        
      case 'GRAB_READY':
        event = this.handleGrabReadyState(input, canTransition, stateTime, now)
        break
        
      case 'GRABBING':
        event = this.handleGrabbingState(input, canTransition, now)
        break
        
      case 'CORNER_HOVER':
        event = this.handleCornerHoverState(input, canTransition, now)
        break
        
      case 'CORNER_GRAB':
        event = this.handleCornerGrabState(input, canTransition, now)
        break
    }
    
    return this.createOutput(event, confidence, canTransition, stateTime)
  }

  // ============================================
  // STATE HANDLERS
  // ============================================

  private handleIdleState(input: GestureInput, canTransition: boolean, now: number): GestureEvent | null {
    if (!canTransition) return null
    
    // Köşe hover kontrolü
    if (input.nearestCorner !== null) {
      this.activeCorner = input.nearestCorner
      this.transitionTo('CORNER_HOVER', now)
      this.emit('CORNER_ENTER', { corner: input.nearestCorner })
      return 'CORNER_ENTER'
    }
    
    // Pinch ready kontrolü
    if (input.pinchDistance < this.config.pinchReadyThreshold) {
      this.transitionTo('PINCH_READY', now)
      return null
    }
    
    // Grab ready kontrolü (yumruk başlıyor)
    if (input.isHandClosed) {
      this.transitionTo('GRAB_READY', now)
      return null
    }
    
    return null
  }

  private handlePinchReadyState(input: GestureInput, canTransition: boolean, stateTime: number, now: number): GestureEvent | null {
    // Pinch gerçekleşti mi?
    if (input.pinchDistance < this.config.pinchThreshold && stateTime >= this.config.minPinchDuration) {
      this.transitionTo('PINCHING', now)
      this.emit('PINCH_START', { distance: input.pinchDistance })
      return 'PINCH_START'
    }
    
    // Pinch iptal - el açıldı
    if (input.pinchDistance > this.config.pinchReadyThreshold && canTransition) {
      this.transitionTo('IDLE', now)
      return null
    }
    
    // Yumruk yapıldı - grab'e geç
    if (input.isHandClosed && canTransition) {
      this.transitionTo('GRAB_READY', now)
      return null
    }
    
    return null
  }

  private handlePinchingState(input: GestureInput, canTransition: boolean, now: number): GestureEvent | null {
    // Pinch bitti mi?
    if (input.pinchDistance > this.config.pinchThreshold && canTransition) {
      this.transitionTo('IDLE', now)
      this.emit('PINCH_END', { distance: input.pinchDistance })
      return 'PINCH_END'
    }
    
    return null
  }

  private handleGrabReadyState(input: GestureInput, canTransition: boolean, stateTime: number, now: number): GestureEvent | null {
    // Grab gerçekleşti mi?
    if (input.isHandClosed && stateTime >= this.config.minGrabDuration) {
      // Köşeye yakınsa corner grab
      if (input.nearestCorner !== null) {
        this.activeCorner = input.nearestCorner
        this.transitionTo('CORNER_GRAB', now)
        this.emit('CORNER_GRAB', { corner: input.nearestCorner })
        return 'CORNER_GRAB'
      }
      
      // Normal grab
      this.transitionTo('GRABBING', now)
      this.emit('GRAB_START', { x: input.handX, y: input.handY })
      return 'GRAB_START'
    }
    
    // El açıldı - iptal
    if (!input.isHandClosed && canTransition) {
      this.transitionTo('IDLE', now)
      return null
    }
    
    return null
  }

  private handleGrabbingState(input: GestureInput, canTransition: boolean, now: number): GestureEvent | null {
    // Grab bitti mi?
    if (!input.isHandClosed && canTransition) {
      this.transitionTo('IDLE', now)
      this.emit('GRAB_END', { x: input.handX, y: input.handY })
      return 'GRAB_END'
    }
    
    return null
  }

  private handleCornerHoverState(input: GestureInput, canTransition: boolean, now: number): GestureEvent | null {
    // Köşeden uzaklaştı mı?
    if (input.nearestCorner === null && canTransition) {
      this.activeCorner = null
      this.transitionTo('IDLE', now)
      return null
    }
    
    // Farklı köşeye geçti mi?
    if (input.nearestCorner !== null && input.nearestCorner !== this.activeCorner) {
      this.activeCorner = input.nearestCorner
      this.emit('CORNER_ENTER', { corner: input.nearestCorner })
      return 'CORNER_ENTER'
    }
    
    // Köşeyi tuttu mu?
    if (input.isHandClosed && canTransition) {
      this.transitionTo('CORNER_GRAB', now)
      this.emit('CORNER_GRAB', { corner: this.activeCorner })
      return 'CORNER_GRAB'
    }
    
    return null
  }

  private handleCornerGrabState(input: GestureInput, canTransition: boolean, now: number): GestureEvent | null {
    // Köşe bırakıldı mı?
    if (!input.isHandClosed && canTransition) {
      const releasedCorner = this.activeCorner
      this.activeCorner = null
      this.transitionTo('IDLE', now)
      this.emit('CORNER_RELEASE', { corner: releasedCorner })
      return 'CORNER_RELEASE'
    }
    
    return null
  }

  // ============================================
  // HELPERS
  // ============================================

  private transitionTo(newState: GestureState, now: number): void {
    this.previousState = this.state
    this.state = newState
    this.stateStartTime = now
    this.lastTransitionTime = now
  }

  private calculateConfidence(input: GestureInput): number {
    let confidence = 1.0
    
    // Pinch için confidence
    if (this.state === 'PINCHING' || this.state === 'PINCH_READY') {
      // Threshold'a ne kadar yakın?
      const distFromThreshold = Math.abs(input.pinchDistance - this.config.pinchThreshold)
      confidence *= Math.max(0.3, 1 - distFromThreshold * 3)
    }
    
    // Grab için confidence - el ne kadar kapalı?
    if (this.state === 'GRABBING' || this.state === 'GRAB_READY') {
      confidence *= input.isHandClosed ? 1.0 : 0.3
    }
    
    // Corner için confidence - mesafeye göre
    if (this.state === 'CORNER_HOVER' || this.state === 'CORNER_GRAB') {
      confidence *= input.nearestCorner !== null ? 1.0 : 0.2
    }
    
    // Geçmiş confidence'larla smooth
    this.confidenceHistory.push(confidence)
    if (this.confidenceHistory.length > this.CONFIDENCE_WINDOW) {
      this.confidenceHistory.shift()
    }
    
    return this.confidenceHistory.reduce((a, b) => a + b, 0) / this.confidenceHistory.length
  }

  private createOutput(
    event: GestureEvent | null, 
    confidence: number, 
    canTransition: boolean,
    stateTime: number
  ): GestureOutput {
    return {
      state: this.state,
      event,
      confidence,
      stateTime,
      corner: this.activeCorner,
      canTransition
    }
  }

  // ============================================
  // EVENT SYSTEM
  // ============================================

  on(event: GestureEvent, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: GestureEvent, callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback)
  }

  private emit(event: GestureEvent, data: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data))
  }

  // ============================================
  // PUBLIC API
  // ============================================

  getState(): GestureState {
    return this.state
  }

  getActiveCorner(): number | null {
    return this.activeCorner
  }

  isGrabbing(): boolean {
    return this.state === 'GRABBING' || this.state === 'CORNER_GRAB'
  }

  isPinching(): boolean {
    return this.state === 'PINCHING'
  }

  reset(): void {
    this.state = 'IDLE'
    this.previousState = 'IDLE'
    this.activeCorner = null
    this.stateStartTime = Date.now()
    this.lastTransitionTime = 0
    this.confidenceHistory = []
  }

  setConfig(config: Partial<GestureConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

export default GestureStateMachine
