'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import MathRenderer from '@/components/MathRenderer'

// ============================================================
// EQUATION BALANCE - Terazi Animasyonu
// ============================================================
interface EquationStep {
  operation: string
  value: string
  result_left: string
  result_right: string
}

interface EquationBalanceProps {
  data: {
    left_side: string
    right_side: string
    steps?: EquationStep[]
  }
  isPlaying?: boolean
}

export function EquationBalance({ data, isPlaying = true }: EquationBalanceProps) {
  const [currentStep, setCurrentStep] = useState(-1)
  const steps = data?.steps || []

  useEffect(() => {
    if (!isPlaying || steps.length === 0) return
    
    setCurrentStep(-1)
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) return prev + 1
        return prev
      })
    }, 2500)

    return () => clearInterval(timer)
  }, [isPlaying, steps.length])

  const getCurrentLeft = () => {
    if (currentStep < 0) return data?.left_side || '?'
    return steps[currentStep]?.result_left || data?.left_side || '?'
  }

  const getCurrentRight = () => {
    if (currentStep < 0) return data?.right_side || '?'
    return steps[currentStep]?.result_right || data?.right_side || '?'
  }

  return (
    <div className="w-full h-96 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-xl overflow-hidden">
      {/* Terazi SVG */}
      <svg viewBox="0 0 400 200" className="w-full max-w-md">
        {/* Taban */}
        <rect x="175" y="170" width="50" height="20" rx="5" fill="#92400e" />
        <rect x="190" y="80" width="20" height="90" fill="#b45309" />
        
        {/* Terazi Kolu */}
        <motion.g
          animate={{ rotate: currentStep >= 0 ? 0 : [-3, 3, -3] }}
          transition={{ duration: 2, repeat: currentStep < 0 ? Infinity : 0 }}
          style={{ originX: '200px', originY: '80px' }}
        >
          <rect x="50" y="75" width="300" height="10" rx="5" fill="#d97706" />
          
          {/* Sol Kefe İpi */}
          <line x1="80" y1="85" x2="80" y2="130" stroke="#fbbf24" strokeWidth="3" />
          {/* Sağ Kefe İpi */}
          <line x1="320" y1="85" x2="320" y2="130" stroke="#fbbf24" strokeWidth="3" />
        </motion.g>

        {/* Sol Kefe */}
        <motion.g
          animate={{ y: currentStep >= 0 ? 0 : [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <rect x="30" y="130" width="100" height="50" rx="10" fill="url(#leftGradient)" />
          <text x="80" y="162" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="monospace">
            {getCurrentLeft()}
          </text>
        </motion.g>

        {/* Sağ Kefe */}
        <motion.g
          animate={{ y: currentStep >= 0 ? 0 : [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <rect x="270" y="130" width="100" height="50" rx="10" fill="url(#rightGradient)" />
          <text x="320" y="162" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="monospace">
            {getCurrentRight()}
          </text>
        </motion.g>

        {/* Eşittir */}
        <text x="200" y="160" textAnchor="middle" fill="#fbbf24" fontSize="24" fontWeight="bold">=</text>

        {/* Gradients */}
        <defs>
          <linearGradient id="leftGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="rightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>

      {/* İşlem Açıklaması */}
      <AnimatePresence mode="wait">
        {currentStep >= 0 && steps[currentStep] && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 px-4 py-2 bg-amber-500/20 border border-amber-500/50 rounded-lg"
          >
            <span className="text-amber-300 text-sm font-medium">
              {steps[currentStep].operation === 'subtract' && `➖ Her iki taraftan ${steps[currentStep].value} çıkar`}
              {steps[currentStep].operation === 'add' && `➕ Her iki tarafa ${steps[currentStep].value} ekle`}
              {steps[currentStep].operation === 'divide' && `➗ Her iki tarafı ${steps[currentStep].value}'e böl`}
              {steps[currentStep].operation === 'multiply' && `✖️ Her iki tarafı ${steps[currentStep].value} ile çarp`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adım İndikatörü */}
      {steps.length > 0 && (
        <div className="mt-3 flex gap-2">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full ${i <= currentStep ? 'bg-amber-400' : 'bg-slate-600'}`}
              animate={{ scale: i === currentStep ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.5 }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// NUMBER LINE - Sayı Doğrusu Animasyonu
// ============================================================
interface NumberLineProps {
  data: {
    min: number
    max: number
    points?: Array<{ value: number; label: string; color?: string }>
    highlight_range?: { start: number; end: number }
  }
  isPlaying?: boolean
}

export function NumberLine({ data, isPlaying = true }: NumberLineProps) {
  const [visiblePoints, setVisiblePoints] = useState(0)
  const min = data?.min ?? -10
  const max = data?.max ?? 10
  const points = data?.points || []
  const range = max - min

  useEffect(() => {
    if (!isPlaying) return
    setVisiblePoints(0)
    
    const timer = setInterval(() => {
      setVisiblePoints(prev => {
        if (prev < points.length) return prev + 1
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isPlaying, points.length])

  const getX = (value: number) => {
    return 50 + ((value - min) / range) * 300
  }

  return (
    <div className="w-full h-96 flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 rounded-xl">
      <svg viewBox="0 0 400 150" className="w-full max-w-lg">
        {/* Sayı Doğrusu */}
        <line x1="40" y1="75" x2="360" y2="75" stroke="#64748b" strokeWidth="3" />
        
        {/* Ok uçları */}
        <polygon points="355,70 365,75 355,80" fill="#64748b" />
        <polygon points="45,70 35,75 45,80" fill="#64748b" />

        {/* Sayı işaretleri */}
        {Array.from({ length: Math.min(11, range + 1) }, (_, i) => {
          const value = min + Math.floor(i * range / 10)
          const x = getX(value)
          return (
            <g key={i}>
              <line x1={x} y1="70" x2={x} y2="80" stroke="#94a3b8" strokeWidth="2" />
              <text x={x} y="100" textAnchor="middle" fill="#94a3b8" fontSize="12">
                {value}
              </text>
            </g>
          )
        })}

        {/* Highlight Range */}
        {data?.highlight_range && (
          <motion.rect
            x={getX(data.highlight_range.start)}
            y="65"
            width={getX(data.highlight_range.end) - getX(data.highlight_range.start)}
            height="20"
            fill="#fbbf24"
            opacity="0.3"
            rx="5"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1 }}
          />
        )}

        {/* Noktalar */}
        {points.slice(0, visiblePoints).map((point, i) => (
          <motion.g
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <circle
              cx={getX(point.value)}
              cy="75"
              r="12"
              fill={point.color || '#6366f1'}
            />
            <text
              x={getX(point.value)}
              y="80"
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
            >
              {point.label}
            </text>
            <text
              x={getX(point.value)}
              y="45"
              textAnchor="middle"
              fill={point.color || '#6366f1'}
              fontSize="14"
              fontWeight="bold"
            >
              {point.value}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  )
}

// ============================================================
// PIE CHART - Pasta Grafik Animasyonu
// ============================================================
interface PieChartProps {
  data: {
    total?: number
    segments: Array<{ label: string; value: number; color?: string }>
    highlight_segment?: number
  }
  isPlaying?: boolean
}

export function PieChart({ data, isPlaying = true }: PieChartProps) {
  const [progress, setProgress] = useState(0)
  const segments = data?.segments || []
  const total = data?.total || segments.reduce((sum, s) => sum + s.value, 0)

  useEffect(() => {
    if (!isPlaying) return
    setProgress(0)
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev < 100) return prev + 2
        return 100
      })
    }, 30)

    return () => clearInterval(timer)
  }, [isPlaying])

  const getPath = (startAngle: number, endAngle: number, radius: number = 80) => {
    const start = {
      x: 150 + radius * Math.cos((startAngle - 90) * Math.PI / 180),
      y: 100 + radius * Math.sin((startAngle - 90) * Math.PI / 180)
    }
    const end = {
      x: 150 + radius * Math.cos((endAngle - 90) * Math.PI / 180),
      y: 100 + radius * Math.sin((endAngle - 90) * Math.PI / 180)
    }
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    
    return `M 150 100 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`
  }

  let currentAngle = 0
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="w-full h-96 flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 rounded-xl">
      <div className="flex items-center gap-8">
        <svg viewBox="0 0 300 200" className="w-64 h-48">
          {segments.map((segment, i) => {
            const segmentAngle = (segment.value / total) * 360
            const displayAngle = Math.min(segmentAngle, (segmentAngle * progress) / 100)
            const startAngle = currentAngle
            const endAngle = currentAngle + displayAngle
            currentAngle += segmentAngle

            const isHighlighted = data?.highlight_segment === i
            const radius = isHighlighted ? 85 : 80

            return (
              <motion.path
                key={i}
                d={getPath(startAngle, endAngle, radius)}
                fill={segment.color || colors[i % colors.length]}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: 1,
                  scale: isHighlighted ? 1.05 : 1
                }}
                transition={{ duration: 0.3 }}
                style={{ filter: isHighlighted ? 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' : 'none' }}
              />
            )
          })}
          {/* Ortadaki daire (donut efekti) */}
          <circle cx="150" cy="100" r="40" fill="#1e293b" />
          <text x="150" y="105" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
            {total}
          </text>
        </svg>

        {/* Legend */}
        <div className="space-y-2">
          {segments.map((segment, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: progress > (i * 100 / segments.length) ? 1 : 0, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: segment.color || colors[i % colors.length] }}
              />
              <span className="text-white text-sm">
                {segment.label}: <strong>{segment.value}</strong>
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// TEXT REVEAL - Metin Ortaya Çıkış Animasyonu
// ============================================================
interface TextRevealProps {
  data: {
    text: string
    highlight_parts?: string[]
    celebration?: boolean
    style?: 'success' | 'info' | 'warning' | 'celebration'
    icon?: string
  }
  isPlaying?: boolean
}

export function TextReveal({ data, isPlaying = true }: TextRevealProps) {
  const [revealed, setRevealed] = useState(false)
  const text = data?.text || ''
  const highlights = data?.highlight_parts || []
  const style = data?.style || 'info'
  const icon = data?.icon || (style === 'celebration' || data?.celebration ? '🎉' : style === 'success' ? '✅' : '💡')

  useEffect(() => {
    if (!isPlaying) return
    setRevealed(false)
    const timer = setTimeout(() => setRevealed(true), 500)
    return () => clearTimeout(timer)
  }, [isPlaying])

  const renderText = () => {
    let result = text
    highlights.forEach(part => {
      result = result.replace(
        part,
        `<span class="text-amber-400 font-bold">${part}</span>`
      )
    })
    return result
  }

  const bgGradient = {
    success: 'from-slate-900 via-slate-800 to-green-900',
    info: 'from-slate-900 via-slate-800 to-blue-900',
    warning: 'from-slate-900 via-slate-800 to-amber-900',
    celebration: 'from-slate-900 via-purple-900 to-pink-900'
  }[style]

  const showCelebration = data?.celebration || style === 'celebration'

  return (
    <div className={`w-full h-96 flex flex-col items-center justify-center p-6 bg-gradient-to-br ${bgGradient} rounded-xl relative overflow-hidden`}>
      {/* Arka plan efekti */}
      {showCelebration && revealed && (
        <>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#fbbf24', '#10b981', '#6366f1', '#ef4444', '#ec4899'][i % 5],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                y: [0, -50]
              }}
              transition={{ 
                duration: 2,
                delay: i * 0.1,
                repeat: Infinity
              }}
            />
          ))}
        </>
      )}

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={revealed ? { scale: 1, opacity: 1 } : {}}
        transition={{ type: 'spring', duration: 0.8 }}
        className="text-center"
      >
        {/* Icon */}
        <motion.div 
          className="text-6xl mb-4"
          animate={revealed ? { rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {icon}
        </motion.div>

        <div className="text-2xl md:text-3xl font-bold text-white">
          <MathRenderer text={text} />
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================
// BAR CHART - Çubuk Grafik Animasyonu  
// ============================================================
interface BarChartProps {
  data: {
    bars?: Array<{ label: string; value: number; color?: string }>
    max_value?: number
    highlight_bar?: number
  }
  isPlaying?: boolean
}

export function BarChart({ data, isPlaying = true }: BarChartProps) {
  const [progress, setProgress] = useState(0)
  const bars = data?.bars || []
  const maxValue = data?.max_value || Math.max(...bars.map(b => b.value), 100)
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  useEffect(() => {
    if (!isPlaying) return
    setProgress(0)
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev < 100) return prev + 3
        return 100
      })
    }, 30)

    return () => clearInterval(timer)
  }, [isPlaying])

  return (
    <div className="w-full h-96 flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-xl">
      <div className="w-full max-w-lg">
        <div className="flex items-end justify-around h-48 gap-4">
          {bars.map((bar, i) => {
            const height = (bar.value / maxValue) * 100 * (progress / 100)
            const isHighlighted = data?.highlight_bar === i
            
            return (
              <motion.div
                key={i}
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                {/* Değer */}
                <motion.span 
                  className="text-white text-sm font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: progress > 50 ? 1 : 0 }}
                >
                  {bar.value}
                </motion.span>
                
                {/* Çubuk */}
                <motion.div
                  className="w-12 rounded-t-lg relative"
                  style={{ 
                    backgroundColor: bar.color || colors[i % colors.length],
                    height: `${height}%`,
                    minHeight: 4,
                    boxShadow: isHighlighted ? '0 0 20px rgba(255,255,255,0.4)' : 'none'
                  }}
                  animate={isHighlighted ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                
                {/* Label */}
                <span className="text-slate-300 text-xs text-center">{bar.label}</span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// STEP BY STEP - Adım Adım Gösterim
// ============================================================
interface StepItem {
  text: string
  highlight?: boolean
}

interface StepByStepProps {
  data: {
    steps?: (string | StepItem)[]
    current_step?: number
  }
  isPlaying?: boolean
}

export function StepByStep({ data, isPlaying = true }: StepByStepProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const rawSteps = data?.steps || []
  
  // Hem string hem de object formatını destekle
  const steps: StepItem[] = rawSteps.map(step => 
    typeof step === 'string' ? { text: step, highlight: false } : step
  )

  useEffect(() => {
    if (!isPlaying || steps.length === 0) return
    setCurrentStep(0)
    
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) return prev + 1
        return prev
      })
    }, 2000)

    return () => clearInterval(timer)
  }, [isPlaying, steps.length])

  return (
    <div className="w-full h-96 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 rounded-xl overflow-y-auto">
      <div className="w-full max-w-md space-y-3">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3, x: -20 }}
            animate={{ 
              opacity: i <= currentStep ? 1 : 0.3,
              x: 0,
              scale: i === currentStep ? 1.02 : 1
            }}
            transition={{ duration: 0.3 }}
            className={`flex items-start gap-3 p-3 rounded-lg ${
              i === currentStep ? 'bg-violet-500/30 border border-violet-400' : 
              step.highlight ? 'bg-amber-500/20 border border-amber-400/50' : 'bg-slate-700/30'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              i < currentStep ? 'bg-green-500' : i === currentStep ? 'bg-violet-500' : 
              step.highlight ? 'bg-amber-500' : 'bg-slate-600'
            }`}>
              {i < currentStep ? (
                <span className="text-white">✓</span>
              ) : (
                <span className="text-white font-bold">{i + 1}</span>
              )}
            </div>
            <p className={`text-sm leading-relaxed ${step.highlight ? 'text-amber-200 font-semibold' : 'text-white'}`}>
              {step.text}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// COORDINATE PLANE - Koordinat Düzlemi
// ============================================================
interface CoordinatePlaneProps {
  data: {
    x_range?: [number, number]
    y_range?: [number, number]
    points?: Array<{ x: number; y: number; label?: string; color?: string }>
    lines?: Array<{ equation: string; color?: string }>
  }
  isPlaying?: boolean
}

export function CoordinatePlane({ data, isPlaying = true }: CoordinatePlaneProps) {
  const [visibleElements, setVisibleElements] = useState(0)
  const xRange = data?.x_range || [-5, 5]
  const yRange = data?.y_range || [-5, 5]
  const points = data?.points || []

  useEffect(() => {
    if (!isPlaying) return
    setVisibleElements(0)
    
    const timer = setInterval(() => {
      setVisibleElements(prev => prev + 1)
    }, 500)

    return () => clearInterval(timer)
  }, [isPlaying])

  const getScreenX = (x: number) => 150 + (x / (xRange[1] - xRange[0])) * 200
  const getScreenY = (y: number) => 100 - (y / (yRange[1] - yRange[0])) * 150

  return (
    <div className="w-full h-96 flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 rounded-xl">
      <svg viewBox="0 0 300 200" className="w-full max-w-lg">
        {/* Grid */}
        {Array.from({ length: 11 }, (_, i) => {
          const x = 50 + i * 20
          return (
            <line key={`v${i}`} x1={x} y1="25" x2={x} y2="175" stroke="#334155" strokeWidth="0.5" />
          )
        })}
        {Array.from({ length: 8 }, (_, i) => {
          const y = 25 + i * 21.5
          return (
            <line key={`h${i}`} x1="50" y1={y} x2="250" y2={y} stroke="#334155" strokeWidth="0.5" />
          )
        })}

        {/* Eksenler */}
        <line x1="50" y1="100" x2="250" y2="100" stroke="#64748b" strokeWidth="2" />
        <line x1="150" y1="25" x2="150" y2="175" stroke="#64748b" strokeWidth="2" />
        
        {/* Ok uçları */}
        <polygon points="248,95 255,100 248,105" fill="#64748b" />
        <polygon points="145,27 150,20 155,27" fill="#64748b" />

        {/* Etiketler */}
        <text x="255" y="115" fill="#94a3b8" fontSize="12">x</text>
        <text x="155" y="22" fill="#94a3b8" fontSize="12">y</text>

        {/* Noktalar */}
        {points.slice(0, visibleElements).map((point, i) => (
          <motion.g
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          >
            <circle
              cx={getScreenX(point.x)}
              cy={getScreenY(point.y)}
              r="8"
              fill={point.color || '#6366f1'}
            />
            {point.label && (
              <text
                x={getScreenX(point.x) + 12}
                y={getScreenY(point.y) + 4}
                fill="white"
                fontSize="12"
                fontWeight="bold"
              >
                {point.label}({point.x},{point.y})
              </text>
            )}
          </motion.g>
        ))}
      </svg>
    </div>
  )
}

// ============================================================
// GEOMETRY SHAPE - Geometri Şekil
// ============================================================
interface GeometryShapeProps {
  data: {
    shape?: 'triangle' | 'rectangle' | 'circle' | 'polygon'
    vertices?: Array<{ x: number; y: number }>
    labels?: { sides?: string[]; angles?: string[] }
    measurements?: Record<string, number>
  }
  isPlaying?: boolean
}

export function GeometryShape({ data, isPlaying = true }: GeometryShapeProps) {
  const [drawn, setDrawn] = useState(false)
  const vertices = data?.vertices || [{ x: 50, y: 150 }, { x: 150, y: 50 }, { x: 250, y: 150 }]

  useEffect(() => {
    if (!isPlaying) return
    setDrawn(false)
    const timer = setTimeout(() => setDrawn(true), 300)
    return () => clearTimeout(timer)
  }, [isPlaying])

  const pathData = vertices.map((v, i) => `${i === 0 ? 'M' : 'L'} ${v.x} ${v.y}`).join(' ') + ' Z'

  return (
    <div className="w-full h-96 flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 rounded-xl">
      <svg viewBox="0 0 300 200" className="w-full max-w-lg">
        {/* Şekil */}
        <motion.path
          d={pathData}
          fill="rgba(251, 191, 36, 0.2)"
          stroke="#fbbf24"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: drawn ? 1 : 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />

        {/* Köşe noktaları ve etiketler */}
        {drawn && vertices.map((v, i) => (
          <motion.g
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.2 }}
          >
            <circle cx={v.x} cy={v.y} r="6" fill="#fbbf24" />
            {data?.labels?.angles?.[i] && (
              <text
                x={v.x + (v.x < 150 ? -15 : 15)}
                y={v.y + (v.y < 100 ? -10 : 15)}
                fill="white"
                fontSize="14"
                fontWeight="bold"
                textAnchor="middle"
              >
                {data.labels.angles[i]}
              </text>
            )}
          </motion.g>
        ))}

        {/* Ölçümler */}
        {drawn && data?.measurements && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {Object.entries(data.measurements).map(([key, value], i) => (
              <text
                key={key}
                x={150}
                y={180 + i * 0}
                fill="#94a3b8"
                fontSize="12"
                textAnchor="middle"
              >
                {key} = {value}
              </text>
            ))}
          </motion.g>
        )}
      </svg>
    </div>
  )
}

// ============================================================
// ANIMATION RENDERER - Ana Renderer
// ============================================================
interface AnimationRendererProps {
  template: string
  data?: Record<string, unknown>
  isPlaying?: boolean
}

export default function AnimationRenderer({ template, data, isPlaying = true }: AnimationRendererProps) {
  // Debug log
  console.log('🎬 AnimationRenderer:', { template, data })
  
  // Template yoksa veya none ise default animasyon göster
  if (!template || template === 'none') {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div 
            className="text-8xl mb-4"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🎓
          </motion.div>
          <p className="text-white/70 text-sm">Çözüm anlatılıyor...</p>
        </motion.div>
      </div>
    )
  }

  // Data yoksa default data kullan
  const safeData = data || {}

  switch (template) {
    case 'equation_balance':
      return <EquationBalance data={{ left_side: '?', right_side: '?', steps: [], ...safeData } as EquationBalanceProps['data']} isPlaying={isPlaying} />
    
    case 'number_line':
      return <NumberLine data={{ min: -10, max: 10, points: [], ...safeData } as NumberLineProps['data']} isPlaying={isPlaying} />
    
    case 'pie_chart':
      return <PieChart data={{ total: 100, segments: [], ...safeData } as PieChartProps['data']} isPlaying={isPlaying} />
    
    case 'text_reveal':
      return <TextReveal data={{ text: '...', style: 'info', ...safeData } as TextRevealProps['data']} isPlaying={isPlaying} />
    
    case 'step_by_step':
      return <StepByStep data={{ steps: [], ...safeData } as StepByStepProps['data']} isPlaying={isPlaying} />
    
    case 'coordinate_plane':
      return <CoordinatePlane data={{ x_range: [-5, 5], y_range: [-5, 5], points: [], ...safeData } as CoordinatePlaneProps['data']} isPlaying={isPlaying} />
    
    case 'geometry_shape':
      return <GeometryShape data={{ shape: 'triangle', ...safeData } as GeometryShapeProps['data']} isPlaying={isPlaying} />
    
    case 'bar_graph':
    case 'bar_chart':
      return <BarChart data={{ bars: [], max_value: 100, ...safeData } as BarChartProps['data']} isPlaying={isPlaying} />
    
    default:
      // Bilinmeyen template için genel animasyon
      console.log('⚠️ Unknown template:', template)
      return (
        <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div 
              className="text-7xl mb-4"
              animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              📊
            </motion.div>
            <p className="text-slate-400 text-sm">{template}</p>
          </motion.div>
        </div>
      )
  }
}
