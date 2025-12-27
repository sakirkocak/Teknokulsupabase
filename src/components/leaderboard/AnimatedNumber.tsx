'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  duration?: number // animasyon süresi (ms)
  formatOptions?: Intl.NumberFormatOptions
  className?: string
  showDelta?: boolean // +X göster
  deltaClassName?: string
}

export function AnimatedNumber({
  value,
  duration = 500,
  formatOptions = {},
  className = '',
  showDelta = false,
  deltaClassName = 'text-green-400'
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [delta, setDelta] = useState(0)
  const previousValue = useRef(value)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const startValue = previousValue.current
    const endValue = value
    const diff = endValue - startValue
    
    if (diff !== 0) {
      setDelta(diff)
      
      const startTime = performance.now()
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3)
        
        const currentValue = Math.round(startValue + diff * easeOut)
        setDisplayValue(currentValue)
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          setDisplayValue(endValue)
          // Delta'yı 2 saniye sonra gizle
          setTimeout(() => setDelta(0), 2000)
        }
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    previousValue.current = value
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, duration])

  const formattedValue = new Intl.NumberFormat('tr-TR', formatOptions).format(displayValue)

  return (
    <span className={`relative inline-flex items-center gap-1 ${className}`}>
      <motion.span
        key={value}
        initial={delta !== 0 ? { scale: 1.2, color: delta > 0 ? '#22c55e' : '#ef4444' } : {}}
        animate={{ scale: 1, color: 'inherit' }}
        transition={{ duration: 0.3 }}
      >
        {formattedValue}
      </motion.span>
      
      {/* Floating delta indicator */}
      <AnimatePresence>
        {showDelta && delta !== 0 && (
          <motion.span
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`absolute -right-10 text-sm font-bold ${delta > 0 ? deltaClassName : 'text-red-400'}`}
          >
            {delta > 0 ? '+' : ''}{delta.toLocaleString('tr-TR')}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

// Basit animasyonlu puan gösterimi
interface AnimatedPointsProps {
  points: number
  previousPoints?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showGain?: boolean
}

export function AnimatedPoints({ 
  points, 
  previousPoints,
  size = 'md',
  showGain = true 
}: AnimatedPointsProps) {
  const [gain, setGain] = useState(0)
  const prevRef = useRef(previousPoints ?? points)

  useEffect(() => {
    const diff = points - prevRef.current
    if (diff > 0 && showGain) {
      setGain(diff)
      const timer = setTimeout(() => setGain(0), 3000)
      return () => clearTimeout(timer)
    }
    prevRef.current = points
  }, [points, showGain])

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  return (
    <div className="relative">
      <motion.div
        key={points}
        initial={gain > 0 ? { scale: 1.1 } : {}}
        animate={{ scale: 1 }}
        className={`font-bold ${sizeClasses[size]}`}
      >
        <AnimatedNumber value={points} />
      </motion.div>
      
      {/* Floating XP gain */}
      <AnimatePresence>
        {gain > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 0, x: '-50%' }}
            animate={{ opacity: 1, y: -30 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 1 }}
            className="absolute top-0 left-1/2 text-green-400 font-bold text-sm whitespace-nowrap"
          >
            +{gain} XP
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AnimatedNumber

