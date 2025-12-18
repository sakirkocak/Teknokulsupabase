'use client'

import { Volume2, VolumeX, Loader2 } from 'lucide-react'
import { useSpeech } from '@/hooks/useSpeech'

interface SpeakButtonProps {
  text: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'icon' | 'button' | 'pill'
  label?: string
  className?: string
  rate?: number
}

export default function SpeakButton({ 
  text, 
  size = 'md', 
  variant = 'icon',
  label = 'Oku',
  className = '',
  rate = 0.9
}: SpeakButtonProps) {
  const { speak, stop, speaking, supported } = useSpeech({ rate })

  if (!supported) return null

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const handleClick = () => {
    if (speaking) {
      stop()
    } else {
      speak(text)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={`${sizeClasses[size]} flex items-center justify-center rounded-full transition-all ${
          speaking 
            ? 'bg-purple-600 text-white animate-pulse' 
            : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
        } ${className}`}
        title={speaking ? 'Durdur' : 'Sesli Oku'}
      >
        {speaking ? (
          <VolumeX className={iconSizes[size]} />
        ) : (
          <Volume2 className={iconSizes[size]} />
        )}
      </button>
    )
  }

  if (variant === 'pill') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          speaking
            ? 'bg-purple-600 text-white'
            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
        } ${className}`}
      >
        {speaking ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Durdurmak için tıkla</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4" />
            <span>{label}</span>
          </>
        )}
      </button>
    )
  }

  // variant === 'button'
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        speaking
          ? 'bg-purple-600 text-white'
          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
      } ${className}`}
    >
      {speaking ? (
        <>
          <VolumeX className="w-5 h-5" />
          <span>Durdur</span>
        </>
      ) : (
        <>
          <Volume2 className="w-5 h-5" />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}

