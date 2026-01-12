'use client'

import { useState, useEffect } from 'react'
import { Loader2, ExternalLink, Maximize2, Minimize2, Play, Pause } from 'lucide-react'

/**
 * 🔬 PhET Interactive Simulations
 * 
 * Colorado Üniversitesi tarafından geliştirilen ücretsiz simülasyonlar
 * Fizik, Kimya, Biyoloji, Matematik için interaktif deneyimler
 */

// Simülasyon listesi - Türkçe destekleyenler
export const PHET_SIMULATIONS = {
  // Fizik
  'circuit-construction-kit-dc': {
    name: 'Elektrik Devresi (DC)',
    category: 'fizik',
    description: 'Devre elemanlarını birleştirerek elektrik devresi kur',
    keywords: ['elektrik', 'devre', 'akım', 'direnç', 'pil', 'ampul']
  },
  'forces-and-motion-basics': {
    name: 'Kuvvet ve Hareket',
    category: 'fizik',
    description: 'Kuvvetlerin hareketi nasıl etkilediğini keşfet',
    keywords: ['kuvvet', 'hareket', 'sürtünme', 'ivme', 'newton']
  },
  'energy-skate-park-basics': {
    name: 'Enerji Kaykay Parkı',
    category: 'fizik',
    description: 'Kinetik ve potansiyel enerji dönüşümünü gözlemle',
    keywords: ['enerji', 'kinetik', 'potansiyel', 'korunum']
  },
  'projectile-motion': {
    name: 'Mermi Hareketi',
    category: 'fizik',
    description: 'Eğik atış hareketini simüle et',
    keywords: ['atış', 'eğik', 'yatay', 'yerçekimi', 'hız']
  },
  'wave-on-a-string': {
    name: 'İpteki Dalga',
    category: 'fizik',
    description: 'Dalga hareketini ve özelliklerini keşfet',
    keywords: ['dalga', 'frekans', 'genlik', 'periyot']
  },
  'pendulum-lab': {
    name: 'Sarkaç Laboratuvarı',
    category: 'fizik',
    description: 'Sarkacın periyodunu etkileyen faktörleri keşfet',
    keywords: ['sarkaç', 'periyot', 'uzunluk', 'kütle', 'salınım']
  },
  
  // Kimya
  'build-an-atom': {
    name: 'Atom Oluştur',
    category: 'kimya',
    description: 'Proton, nötron ve elektronlarla atom kur',
    keywords: ['atom', 'proton', 'nötron', 'elektron', 'element']
  },
  'balancing-chemical-equations': {
    name: 'Kimyasal Denklem Denkleştirme',
    category: 'kimya',
    description: 'Kimyasal denklemleri denkleştirmeyi öğren',
    keywords: ['denklem', 'denkleştirme', 'tepkime', 'mol']
  },
  'acid-base-solutions': {
    name: 'Asit-Baz Çözeltileri',
    category: 'kimya',
    description: 'Asit ve bazların özelliklerini keşfet',
    keywords: ['asit', 'baz', 'ph', 'çözelti', 'indikatör']
  },
  'molecule-shapes': {
    name: 'Molekül Şekilleri',
    category: 'kimya',
    description: 'Moleküllerin 3D yapısını keşfet',
    keywords: ['molekül', 'geometri', 'bağ', 'orbital']
  },
  'states-of-matter': {
    name: 'Maddenin Halleri',
    category: 'kimya',
    description: 'Katı, sıvı ve gaz hallerini simüle et',
    keywords: ['katı', 'sıvı', 'gaz', 'hal', 'sıcaklık']
  },
  
  // Biyoloji
  'natural-selection': {
    name: 'Doğal Seçilim',
    category: 'biyoloji',
    description: 'Evrim ve doğal seçilimi gözlemle',
    keywords: ['evrim', 'seçilim', 'mutasyon', 'adaptasyon']
  },
  'gene-expression-essentials': {
    name: 'Gen İfadesi',
    category: 'biyoloji',
    description: 'DNA\'dan proteine geçişi keşfet',
    keywords: ['gen', 'dna', 'rna', 'protein', 'transkripsiyon']
  },
  
  // Matematik
  'fractions-intro': {
    name: 'Kesirlere Giriş',
    category: 'matematik',
    description: 'Kesirleri görsel olarak öğren',
    keywords: ['kesir', 'pay', 'payda', 'bölme']
  },
  'graphing-lines': {
    name: 'Doğru Grafikleri',
    category: 'matematik',
    description: 'Doğru denklemlerini grafikte çiz',
    keywords: ['grafik', 'doğru', 'eğim', 'denklem', 'koordinat']
  },
  'function-builder': {
    name: 'Fonksiyon Oluşturucu',
    category: 'matematik',
    description: 'Fonksiyonları görsel olarak keşfet',
    keywords: ['fonksiyon', 'girdi', 'çıktı', 'işlem']
  },
  'area-builder': {
    name: 'Alan Oluşturucu',
    category: 'matematik',
    description: 'Şekillerin alanını keşfet',
    keywords: ['alan', 'kare', 'dikdörtgen', 'geometri']
  },
  'equality-explorer': {
    name: 'Eşitlik Gezgini',
    category: 'matematik',
    description: 'Denklik ve denklem kavramını öğren',
    keywords: ['eşitlik', 'denklem', 'terazi', 'bilinmeyen']
  },
  'vector-addition': {
    name: 'Vektör Toplama',
    category: 'matematik',
    description: 'Vektörleri görsel olarak topla',
    keywords: ['vektör', 'toplama', 'bileşke', 'yön']
  }
} as const

export type PhETSimulationId = keyof typeof PHET_SIMULATIONS

interface PhETSimulationProps {
  simulation: PhETSimulationId
  locale?: string
  width?: string | number
  height?: string | number
  showControls?: boolean
  className?: string
}

/**
 * Konu veya anahtar kelimeye göre simülasyon bul
 */
export function findSimulationForTopic(topic: string): PhETSimulationId | null {
  const lowerTopic = topic.toLowerCase()
  
  for (const [id, sim] of Object.entries(PHET_SIMULATIONS)) {
    // İsimde veya keywordlerde ara
    if (sim.name.toLowerCase().includes(lowerTopic)) {
      return id as PhETSimulationId
    }
    
    if (sim.keywords.some(kw => lowerTopic.includes(kw) || kw.includes(lowerTopic))) {
      return id as PhETSimulationId
    }
  }
  
  return null
}

/**
 * Kategoriye göre simülasyonları getir
 */
export function getSimulationsByCategory(category: 'fizik' | 'kimya' | 'biyoloji' | 'matematik') {
  return Object.entries(PHET_SIMULATIONS)
    .filter(([_, sim]) => sim.category === category)
    .map(([id, sim]) => ({ id: id as PhETSimulationId, ...sim }))
}

export default function PhETSimulation({
  simulation,
  locale = 'tr',
  width = '100%',
  height = 400,
  showControls = true,
  className = ''
}: PhETSimulationProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const simInfo = PHET_SIMULATIONS[simulation]
  
  // PhET URL
  const phetUrl = `https://phet.colorado.edu/sims/html/${simulation}/latest/${simulation}_${locale}.html`
  
  // Fullscreen toggle
  const toggleFullscreen = () => {
    const container = document.getElementById(`phet-${simulation}`)
    if (!container) return
    
    if (!isFullscreen) {
      container.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setIsFullscreen(!isFullscreen)
  }
  
  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])
  
  if (!simInfo) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
        Simülasyon bulunamadı: {simulation}
      </div>
    )
  }
  
  return (
    <div 
      id={`phet-${simulation}`}
      className={`relative bg-slate-900 rounded-xl overflow-hidden ${className}`}
      style={{ width, height: isFullscreen ? '100vh' : height }}
    >
      {/* Header */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-3 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {simInfo.name}
            </h3>
            <p className="text-white/60 text-xs">{simInfo.description}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Yeni sekmede aç */}
            <a
              href={phetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Yeni sekmede aç"
            >
              <ExternalLink className="w-4 h-4 text-white" />
            </a>
            
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title={isFullscreen ? 'Küçült' : 'Tam ekran'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-white" />
              ) : (
                <Maximize2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-2" />
            <p className="text-white/60 text-sm">Simülasyon yükleniyor...</p>
          </div>
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-center p-4">
            <p className="text-red-400 mb-2">{error}</p>
            <a
              href={phetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Doğrudan Aç
            </a>
          </div>
        </div>
      )}
      
      {/* iFrame */}
      <iframe
        src={phetUrl}
        width="100%"
        height="100%"
        allowFullScreen
        allow="fullscreen"
        className={`border-0 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setError('Simülasyon yüklenemedi')
        }}
        style={{ 
          marginTop: showControls ? '0' : '0',
          height: showControls ? 'calc(100% - 0px)' : '100%'
        }}
      />
      
      {/* Kategori badge */}
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded-lg">
        <span className={`text-xs font-medium ${
          simInfo.category === 'fizik' ? 'text-blue-400' :
          simInfo.category === 'kimya' ? 'text-green-400' :
          simInfo.category === 'biyoloji' ? 'text-pink-400' :
          'text-purple-400'
        }`}>
          {simInfo.category.toUpperCase()}
        </span>
      </div>
    </div>
  )
}
