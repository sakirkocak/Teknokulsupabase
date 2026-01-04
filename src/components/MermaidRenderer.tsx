'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

interface MermaidRendererProps {
  chart: string
  className?: string
}

// Mermaid'i bir kez initialize et
let mermaidInitialized = false

function initializeMermaid() {
  if (mermaidInitialized) return
  
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'inherit',
    // Türkçe karakterler için
    htmlLabels: true,
    // Grafik ayarları
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis',
    },
    // Pie chart ayarları
    pie: {
      useMaxWidth: true,
      textPosition: 0.75,
    },
    // XY Chart ayarları
    themeVariables: {
      fontSize: '14px',
      primaryColor: '#6366f1',
      primaryTextColor: '#1f2937',
      primaryBorderColor: '#4f46e5',
      lineColor: '#6366f1',
      secondaryColor: '#f0fdf4',
      tertiaryColor: '#f3f4f6',
    },
  })
  
  mermaidInitialized = true
}

/**
 * Mermaid.js diyagramlarını render eder
 * 
 * Desteklenen diyagram türleri:
 * - flowchart (akış şeması)
 * - pie (pasta grafiği)
 * - xychart-beta (çubuk/çizgi grafik)
 * - sequence (sıra diyagramı)
 * - classDiagram (sınıf diyagramı)
 * - stateDiagram (durum diyagramı)
 * - erDiagram (ER diyagramı)
 * - gantt (Gantt şeması)
 * - journey (kullanıcı yolculuğu)
 * - timeline (zaman çizelgesi)
 */
export default function MermaidRenderer({ chart, className = '' }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!chart || !containerRef.current) return

    const renderChart = async () => {
      setIsLoading(true)
      setError(null)

      try {
        initializeMermaid()
        
        // Benzersiz ID oluştur
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        
        // Chart'ı temizle (baştaki/sondaki boşluklar)
        const cleanedChart = chart.trim()
        
        // Render et
        const { svg: renderedSvg } = await mermaid.render(id, cleanedChart)
        setSvg(renderedSvg)
      } catch (err) {
        console.error('Mermaid render hatası:', err)
        setError(err instanceof Error ? err.message : 'Diyagram oluşturulamadı')
      } finally {
        setIsLoading(false)
      }
    }

    renderChart()
  }, [chart])

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 bg-gray-50 rounded-lg ${className}`}>
        <div className="animate-pulse flex items-center gap-2 text-gray-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Diyagram yükleniyor...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-800">Diyagram görüntülenemedi</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
            <details className="mt-2">
              <summary className="text-xs text-red-500 cursor-pointer">Kaynak kodu göster</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-x-auto">{chart}</pre>
            </details>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`mermaid-container overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

/**
 * Metin içindeki Mermaid kod bloklarını tespit eder ve render eder
 * Kullanım: <MermaidContent content={text} />
 */
export function MermaidContent({ content, className = '' }: { content: string; className?: string }) {
  // Mermaid kod bloklarını bul
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
  const parts: { type: 'text' | 'mermaid'; content: string }[] = []
  
  let lastIndex = 0
  let match
  
  while ((match = mermaidRegex.exec(content)) !== null) {
    // Önceki metin
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      })
    }
    
    // Mermaid bloğu
    parts.push({
      type: 'mermaid',
      content: match[1].trim()
    })
    
    lastIndex = match.index + match[0].length
  }
  
  // Kalan metin
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex)
    })
  }
  
  // Eğer hiç Mermaid bloğu yoksa direkt metni döndür
  if (parts.length === 0 || (parts.length === 1 && parts[0].type === 'text')) {
    return <span className={className}>{content}</span>
  }
  
  return (
    <div className={className}>
      {parts.map((part, index) => (
        part.type === 'mermaid' ? (
          <div key={index} className="my-4">
            <MermaidRenderer chart={part.content} />
          </div>
        ) : (
          <span key={index}>{part.content}</span>
        )
      ))}
    </div>
  )
}
