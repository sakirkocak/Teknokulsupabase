'use client'

import Image from 'next/image'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showSlogan?: boolean
  linkTo?: string
  variant?: 'default' | 'white' | 'dark'
  className?: string
}

const sizeConfig = {
  sm: { icon: 'w-8 h-8', text: 'text-lg', slogan: 'text-xs', image: 32 },
  md: { icon: 'w-10 h-10', text: 'text-xl', slogan: 'text-xs', image: 40 },
  lg: { icon: 'w-12 h-12', text: 'text-2xl', slogan: 'text-sm', image: 48 },
  xl: { icon: 'w-16 h-16', text: 'text-3xl', slogan: 'text-base', image: 64 },
}

export default function Logo({ 
  size = 'md', 
  showSlogan = false, 
  linkTo = '/',
  variant = 'default',
  className = ''
}: LogoProps) {
  const config = sizeConfig[size]
  
  const textColors = {
    default: {
      tekn: 'text-surface-900',
      okul: 'text-primary-500',
      slogan: 'text-surface-500'
    },
    white: {
      tekn: 'text-white',
      okul: 'text-primary-300',
      slogan: 'text-white/70'
    },
    dark: {
      tekn: 'text-surface-900',
      okul: 'text-primary-600',
      slogan: 'text-surface-600'
    }
  }
  
  const colors = textColors[variant]

  const LogoContent = () => (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Image - eğer varsa kullan, yoksa ikon göster */}
      <div className={`${config.icon} bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center relative overflow-hidden`}>
        {/* Logo ikonu yerine resim kullanılacak */}
        <Image 
          src="/images/logo-icon.png" 
          alt="Teknokul" 
          width={config.image}
          height={config.image}
          className="object-contain"
          onError={(e) => {
            // Resim yüklenemezse ikon göster
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
        {/* Fallback ikon */}
        <GraduationCap className={`w-6 h-6 text-white absolute inset-0 m-auto`} style={{ display: 'none' }} />
      </div>
      
      <div className="flex flex-col">
        <span className={`${config.text} font-bold leading-tight`}>
          <span className={colors.tekn}>Tekn</span>
          <span className={colors.okul}>okul</span>
        </span>
        {showSlogan && (
          <span className={`${config.slogan} ${colors.slogan} font-medium leading-tight`}>
            Eğitimin Dijital Üssü
          </span>
        )}
      </div>
    </div>
  )

  if (linkTo) {
    return (
      <Link href={linkTo} className="inline-flex">
        <LogoContent />
      </Link>
    )
  }

  return <LogoContent />
}

// Sadece metin versiyonu - ikon olmadan
export function LogoText({ 
  size = 'md', 
  showSlogan = false,
  variant = 'default',
  className = ''
}: Omit<LogoProps, 'linkTo'>) {
  const config = sizeConfig[size]
  
  const textColors = {
    default: {
      tekn: 'text-surface-900',
      okul: 'text-primary-500',
      slogan: 'text-surface-500'
    },
    white: {
      tekn: 'text-white',
      okul: 'text-primary-300',
      slogan: 'text-white/70'
    },
    dark: {
      tekn: 'text-surface-900',
      okul: 'text-primary-600',
      slogan: 'text-surface-600'
    }
  }
  
  const colors = textColors[variant]

  return (
    <div className={`flex flex-col ${className}`}>
      <span className={`${config.text} font-bold leading-tight`}>
        <span className={colors.tekn}>Tekn</span>
        <span className={colors.okul}>okul</span>
      </span>
      {showSlogan && (
        <span className={`${config.slogan} ${colors.slogan} font-medium leading-tight`}>
          Eğitimin Dijital Üssü
        </span>
      )}
    </div>
  )
}

// Sadece ikon versiyonu
export function LogoIcon({ 
  size = 'md',
  className = ''
}: Pick<LogoProps, 'size' | 'className'>) {
  const config = sizeConfig[size]

  return (
    <div className={`${config.icon} bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center relative overflow-hidden ${className}`}>
      <Image 
        src="/images/logo-icon.png" 
        alt="Teknokul" 
        width={config.image}
        height={config.image}
        className="object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none'
          const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
          if (fallback) fallback.style.display = 'flex'
        }}
      />
      <GraduationCap className={`w-6 h-6 text-white absolute inset-0 m-auto`} style={{ display: 'none' }} />
    </div>
  )
}

