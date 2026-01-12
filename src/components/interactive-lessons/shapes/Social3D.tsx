'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line, Text } from '@react-three/drei'
import * as THREE from 'three'

// ============================================
// 📅 ZAMAN ÇİZELGESİ
// ============================================

interface TimelineEvent {
  year: number
  title: string
  description?: string
  importance?: 'low' | 'medium' | 'high'
}

interface TimelineProps {
  events?: TimelineEvent[]
  startYear?: number
  endYear?: number
  highlightedYear?: number
}

export function Timeline({
  events = [
    { year: 1919, title: 'Kurtuluş Savaşı Başlangıcı', importance: 'high' },
    { year: 1920, title: 'TBMM Açılışı', importance: 'high' },
    { year: 1922, title: 'Büyük Taarruz', importance: 'high' },
    { year: 1923, title: 'Cumhuriyet İlanı', importance: 'high' },
  ],
  startYear,
  endYear,
  highlightedYear
}: TimelineProps) {
  const minYear = startYear || Math.min(...events.map(e => e.year)) - 1
  const maxYear = endYear || Math.max(...events.map(e => e.year)) + 1
  const range = maxYear - minYear
  
  const yearToX = (year: number) => ((year - minYear) / range) * 8 - 4

  const importanceColors = {
    low: '#64748b',
    medium: '#f59e0b',
    high: '#ef4444'
  }

  return (
    <group>
      {/* Ana çizgi */}
      <Line
        points={[[-4.5, 0, 0], [4.5, 0, 0]]}
        color="#64748b"
        lineWidth={3}
      />
      
      {/* Ok ucu */}
      <mesh position={[4.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.15, 0.3, 8]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      
      {/* Olaylar */}
      {events.map((event, idx) => {
        const x = yearToX(event.year)
        const isHighlighted = highlightedYear === event.year
        const color = importanceColors[event.importance || 'medium']
        
        return (
          <group key={idx} position={[x, 0, 0]}>
            {/* Dikey çizgi */}
            <Line
              points={[[0, 0, 0], [0, 1.5, 0]]}
              color={isHighlighted ? '#22c55e' : color}
              lineWidth={isHighlighted ? 4 : 2}
            />
            
            {/* Nokta */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[isHighlighted ? 0.2 : 0.15, 16, 16]} />
              <meshStandardMaterial 
                color={isHighlighted ? '#22c55e' : color}
                emissive={isHighlighted ? '#22c55e' : color}
                emissiveIntensity={isHighlighted ? 0.8 : 0.3}
              />
            </mesh>
            
            {/* Yıl */}
            <Html position={[0, -0.5, 0]} center>
              <div className={`px-2 py-1 rounded text-sm font-bold ${
                isHighlighted ? 'bg-green-500 text-white' : 'bg-slate-700 text-white'
              }`}>
                {event.year}
              </div>
            </Html>
            
            {/* Başlık */}
            <Html position={[0, 2, 0]} center>
              <div className={`px-3 py-2 rounded-lg text-center max-w-[120px] ${
                isHighlighted 
                  ? 'bg-green-500/90 text-white' 
                  : 'bg-slate-800/90 text-white'
              }`}>
                <div className="text-xs font-bold">{event.title}</div>
                {event.description && (
                  <div className="text-[10px] opacity-70 mt-1">{event.description}</div>
                )}
              </div>
            </Html>
          </group>
        )
      })}
      
      {/* Başlık */}
      <Html position={[0, 3.5, 0]} center>
        <div className="px-4 py-2 bg-amber-500/90 rounded-xl text-white font-bold">
          📅 Zaman Çizelgesi ({minYear} - {maxYear})
        </div>
      </Html>
    </group>
  )
}

// ============================================
// 🗺️ HARİTA BÖLGE VURGULAMA
// ============================================

interface MapRegion {
  name: string
  x: number
  y: number
  width: number
  height: number
  color?: string
  highlighted?: boolean
}

interface MapHighlightProps {
  regions?: MapRegion[]
  title?: string
  showLabels?: boolean
}

export function MapHighlight({
  regions = [
    { name: 'Marmara', x: 0, y: 1, width: 1.5, height: 1, color: '#3b82f6' },
    { name: 'Ege', x: -1.5, y: 0, width: 1, height: 1.5, color: '#22c55e' },
    { name: 'Akdeniz', x: 0, y: -1, width: 2, height: 1, color: '#f59e0b' },
    { name: 'İç Anadolu', x: 1, y: 0.5, width: 2, height: 1.5, color: '#8b5cf6' },
    { name: 'Karadeniz', x: 1, y: 1.5, width: 2.5, height: 0.8, color: '#06b6d4' },
    { name: 'Doğu Anadolu', x: 2.5, y: 0, width: 1.5, height: 2, color: '#ef4444' },
    { name: 'G.Doğu Anadolu', x: 2, y: -1, width: 1.5, height: 1, color: '#ec4899' },
  ],
  title = 'Türkiye Coğrafi Bölgeleri',
  showLabels = true
}: MapHighlightProps) {
  return (
    <group>
      {/* Bölgeler */}
      {regions.map((region, idx) => (
        <group key={idx} position={[region.x, region.y, 0]}>
          <mesh>
            <boxGeometry args={[region.width, region.height, 0.1]} />
            <meshStandardMaterial 
              color={region.color || '#64748b'} 
              transparent 
              opacity={region.highlighted ? 0.9 : 0.6}
              emissive={region.color || '#64748b'}
              emissiveIntensity={region.highlighted ? 0.5 : 0.1}
            />
          </mesh>
          
          {/* Sınır */}
          <Line
            points={[
              [-region.width/2, -region.height/2, 0.06],
              [region.width/2, -region.height/2, 0.06],
              [region.width/2, region.height/2, 0.06],
              [-region.width/2, region.height/2, 0.06],
              [-region.width/2, -region.height/2, 0.06],
            ]}
            color="#fff"
            lineWidth={1}
          />
          
          {/* Etiket */}
          {showLabels && (
            <Html position={[0, 0, 0.1]} center>
              <div className={`px-2 py-1 rounded text-xs font-bold text-white ${
                region.highlighted ? 'bg-white/30 scale-110' : 'bg-black/30'
              }`}>
                {region.name}
              </div>
            </Html>
          )}
        </group>
      ))}
      
      {/* Başlık */}
      <Html position={[0, 3, 0]} center>
        <div className="px-4 py-2 bg-emerald-500/90 rounded-xl text-white font-bold">
          🗺️ {title}
        </div>
      </Html>
    </group>
  )
}

// ============================================
// 📝 PARAGRAF HARİTASI
// ============================================

interface ParagraphHighlight {
  text: string
  type: 'subject' | 'predicate' | 'object' | 'modifier' | 'keyword'
  color?: string
}

interface ParagraphMapProps {
  sentences?: Array<{
    text: string
    highlights?: ParagraphHighlight[]
  }>
  title?: string
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  subject: '#3b82f6',
  predicate: '#ef4444',
  object: '#22c55e',
  modifier: '#f59e0b',
  keyword: '#8b5cf6',
}

export function ParagraphMap({
  sentences = [
    { 
      text: 'Türkiye güzel bir ülkedir.',
      highlights: [
        { text: 'Türkiye', type: 'subject' },
        { text: 'güzel', type: 'modifier' },
        { text: 'ülkedir', type: 'predicate' },
      ]
    },
  ],
  title = 'Cümle Analizi'
}: ParagraphMapProps) {
  return (
    <group>
      {sentences.map((sentence, sIdx) => {
        const y = (sentences.length / 2 - sIdx) * 1.5
        
        return (
          <group key={sIdx} position={[0, y, 0]}>
            {/* Cümle kutusu */}
            <mesh>
              <boxGeometry args={[6, 0.8, 0.1]} />
              <meshStandardMaterial color="#1e293b" transparent opacity={0.8} />
            </mesh>
            
            {/* Vurgular */}
            {sentence.highlights?.map((h, hIdx) => {
              const color = h.color || HIGHLIGHT_COLORS[h.type] || '#64748b'
              const xOffset = (hIdx - (sentence.highlights!.length - 1) / 2) * 1.8
              
              return (
                <group key={hIdx} position={[xOffset, 0, 0.1]}>
                  <mesh>
                    <boxGeometry args={[1.5, 0.5, 0.05]} />
                    <meshStandardMaterial 
                      color={color} 
                      transparent 
                      opacity={0.3}
                      emissive={color}
                      emissiveIntensity={0.3}
                    />
                  </mesh>
                  
                  <Html position={[0, 0, 0]} center>
                    <div className="text-center">
                      <div className="text-white text-xs font-medium">{h.text}</div>
                      <div className="text-[10px] opacity-70" style={{ color }}>
                        {h.type === 'subject' ? 'Özne' :
                         h.type === 'predicate' ? 'Yüklem' :
                         h.type === 'object' ? 'Nesne' :
                         h.type === 'modifier' ? 'Sıfat' : 'Anahtar'}
                      </div>
                    </div>
                  </Html>
                </group>
              )
            })}
          </group>
        )
      })}
      
      {/* Renk açıklaması */}
      <Html position={[0, -2.5, 0]} center>
        <div className="px-3 py-2 bg-slate-800/90 rounded-lg text-white text-xs flex gap-3">
          <span className="text-blue-400">● Özne</span>
          <span className="text-red-400">● Yüklem</span>
          <span className="text-green-400">● Nesne</span>
          <span className="text-amber-400">● Sıfat</span>
        </div>
      </Html>
      
      {/* Başlık */}
      <Html position={[0, 2.5, 0]} center>
        <div className="px-4 py-2 bg-blue-500/90 rounded-xl text-white font-bold">
          📝 {title}
        </div>
      </Html>
    </group>
  )
}

// ============================================
// ☁️ KELİME BULUTU
// ============================================

interface WordCloudWord {
  text: string
  weight: number
  color?: string
}

interface WordCloudProps {
  words?: WordCloudWord[]
  title?: string
}

export function WordCloud({
  words = [
    { text: 'Cumhuriyet', weight: 10, color: '#ef4444' },
    { text: 'Demokrasi', weight: 8, color: '#3b82f6' },
    { text: 'Bağımsızlık', weight: 9, color: '#22c55e' },
    { text: 'Özgürlük', weight: 7, color: '#f59e0b' },
    { text: 'Eşitlik', weight: 6, color: '#8b5cf6' },
    { text: 'Adalet', weight: 7, color: '#ec4899' },
    { text: 'Barış', weight: 5, color: '#06b6d4' },
  ],
  title = 'Anahtar Kavramlar'
}: WordCloudProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      {words.map((word, idx) => {
        // Rastgele pozisyon (sabit seed ile)
        const angle = (idx / words.length) * Math.PI * 2
        const radius = 1.5 + (idx % 3) * 0.5
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius * 0.6
        const z = (idx % 2 - 0.5) * 0.5
        
        const scale = 0.3 + (word.weight / 10) * 0.4

        return (
          <group key={idx} position={[x, y, z]}>
            <Html center>
              <div 
                className="font-bold whitespace-nowrap transition-transform hover:scale-110 cursor-pointer"
                style={{ 
                  color: word.color || '#fff',
                  fontSize: `${12 + word.weight * 2}px`,
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}
              >
                {word.text}
              </div>
            </Html>
          </group>
        )
      })}
      
      {/* Başlık */}
      <Html position={[0, 2.5, 0]} center>
        <div className="px-4 py-2 bg-sky-500/90 rounded-xl text-white font-bold">
          ☁️ {title}
        </div>
      </Html>
    </group>
  )
}

export default { Timeline, MapHighlight, ParagraphMap, WordCloud }
