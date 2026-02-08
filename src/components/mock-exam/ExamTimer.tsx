'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface ExamTimerProps {
  timeRemaining: number // saniye
  warning: 'none' | 'yellow' | 'red' | 'critical'
}

export default function ExamTimer({ timeRemaining, warning }: ExamTimerProps) {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (warning === 'critical') {
      const interval = setInterval(() => setPulse(prev => !prev), 500)
      return () => clearInterval(interval)
    }
    setPulse(false)
  }, [warning])

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const colorClasses = {
    none: 'bg-surface-100 text-surface-700',
    yellow: 'bg-amber-100 text-amber-700 border border-amber-300',
    red: 'bg-red-100 text-red-700 border border-red-400',
    critical: 'bg-red-600 text-white',
  }

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold transition-all ${
        colorClasses[warning]
      } ${pulse ? 'opacity-50' : 'opacity-100'}`}
    >
      <Clock className="w-5 h-5" />
      <span>{display}</span>
    </div>
  )
}
