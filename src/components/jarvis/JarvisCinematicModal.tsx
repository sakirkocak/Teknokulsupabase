'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF, Html } from '@react-three/drei'
import { 
  X, Volume2, VolumeX, Mic, MicOff, Send, 
  Loader2, Sparkles, Hand, RotateCcw, ZoomIn,
  Play, MessageCircle, Bot
} from 'lucide-react'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'

import HologramEffect, { HologramGrid, HologramMaterial } from './HologramEffect'
import ParticleSystem, { SparkleParticles, EnergyRing } from './ParticleSystem'
import { getModelById, selectModelForQuestion, Model3D } from '@/lib/jarvis/model-registry'

/**
 * 🎬 Jarvis Cinematic Modal
 * 
 * Sinematik layout:
 * - Üst %60: 3D Hologram sahne
 * - Alt %40: Soru görseli + Chat
 * 
 * WOW efektleri:
 * - Hologram shader
 * - Parçacık sistemi
 * - Scan line animasyonları
 * - Glow efektleri
 */

interface JarvisCinematicModalProps {
  isOpen: boolean
  onClose: () => void
  question?: {
    text: string
    imageUrl?: string
    options?: Record<string, string>
    correctAnswer?: string
    subject?: string
  }
  jarvisData?: {
    voiceIntro?: string
    steps?: Array<{
      order: number
      text: string
      voiceScript: string
    }>
    recommendedModelId?: string | null
  }
}

// 3D Model Loader
function Pro3DModel({ 
  modelId, 
  color = '#00ffff'
}: { 
  modelId: string
  color?: string 
}) {
  const modelInfo = getModelById(modelId)
  const groupRef = useRef<THREE.Group>(null)
  
  // Model yükle
  const { scene } = useGLTF(modelInfo?.path || '/models/brain.glb')
  
  // Hover animasyonu
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })
  
  // Model scale
  const scale = modelInfo?.defaultScale || 1
  
  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={scene.clone()} />
      {/* Hologram glow altı */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <ringGeometry args={[1, 1.5, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// Loading Placeholder
function LoadingPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5
    }
  })
  
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 1]} />
      <HologramMaterial color="#00ffff" intensity={0.5} />
    </mesh>
  )
}

// Ana Sahne
function HologramScene({ 
  modelId,
  showParticles = true
}: { 
  modelId: string | null
  showParticles?: boolean
}) {
  return (
    <>
      {/* Ambient */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#ff00ff" />
      
      {/* Grid */}
      <HologramGrid size={20} divisions={40} color="#00ffff" />
      
      {/* Parçacıklar */}
      {showParticles && (
        <>
          <ParticleSystem count={150} color="#00ffff" spread={8} type="float" speed={0.5} />
          <SparkleParticles count={30} color="#ffffff" spread={5} />
          <EnergyRing radius={3} color="#00ffff" rotationSpeed={0.3} />
          <EnergyRing radius={3.5} color="#ff00ff" rotationSpeed={-0.2} />
        </>
      )}
      
      {/* 3D Model */}
      <Suspense fallback={<LoadingPlaceholder />}>
        {modelId ? (
          <HologramEffect color="#00ffff" intensity={0.9} glitchIntensity={0.02}>
            <Pro3DModel modelId={modelId} />
          </HologramEffect>
        ) : (
          <LoadingPlaceholder />
        )}
      </Suspense>
      
      {/* Controls */}
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={10}
        autoRotate={false}
      />
    </>
  )
}

export default function JarvisCinematicModal({
  isOpen,
  onClose,
  question,
  jarvisData
}: JarvisCinematicModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'jarvis', text: string }>>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // Mount kontrolü (portal için)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  
  // Model seçimi
  useEffect(() => {
    if (jarvisData?.recommendedModelId) {
      setSelectedModelId(jarvisData.recommendedModelId)
    } else if (question?.subject) {
      const model = selectModelForQuestion(question.text, question.subject)
      setSelectedModelId(model?.id || 'brain')
    }
  }, [jarvisData, question])
  
  // İlk açılışta karşılama
  useEffect(() => {
    if (isOpen && jarvisData?.voiceIntro && chatMessages.length === 0) {
      setChatMessages([{ role: 'jarvis', text: jarvisData.voiceIntro }])
      speakText(jarvisData.voiceIntro)
    }
  }, [isOpen, jarvisData])
  
  // Chat scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])
  
  // TTS
  const speakText = async (text: string) => {
    setIsSpeaking(true)
    try {
      const res = await fetch('/api/jarvis/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'rachel' })
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.audio) {
          const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`)
          audio.onended = () => setIsSpeaking(false)
          await audio.play()
          return
        }
      }
    } catch (err) {
      console.warn('TTS hatası:', err)
    }
    setIsSpeaking(false)
  }
  
  // Chat gönder
  const sendChat = async () => {
    if (!chatInput.trim() || isLoading) return
    
    const userMessage = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: chatMessages.map(m => ({
            role: m.role === 'jarvis' ? 'assistant' : 'user',
            content: m.text
          }))
        })
      })
      
      const data = await res.json()
      if (data.success && data.text) {
        setChatMessages(prev => [...prev, { role: 'jarvis', text: data.text }])
        speakText(data.text)
      }
    } catch (err) {
      console.error('Chat hatası:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Adım değiştir
  const nextStep = () => {
    if (jarvisData?.steps && currentStep < jarvisData.steps.length - 1) {
      const next = currentStep + 1
      setCurrentStep(next)
      const step = jarvisData.steps[next]
      setChatMessages(prev => [...prev, { role: 'jarvis', text: step.text }])
      speakText(step.voiceScript)
    }
  }
  
  if (!mounted || !isOpen) return null
  
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black"
      >
        {/* Üst Kısım - 3D Hologram (%60) */}
        <div className="h-[60vh] relative">
          {/* Canvas */}
          <Canvas
            camera={{ position: [0, 2, 6], fov: 50 }}
            className="w-full h-full"
            gl={{ antialias: true, alpha: true }}
          >
            <color attach="background" args={['#050510']} />
            <fog attach="fog" args={['#050510', 5, 20]} />
            <HologramScene modelId={selectedModelId} />
          </Canvas>
          
          {/* Üst UI Overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
            {/* Logo + Status */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
                <Bot className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-white font-bold">Jarvis</h2>
                <p className="text-cyan-400 text-xs">
                  {isSpeaking ? '🔊 Konuşuyor...' : isListening ? '🎤 Dinliyor...' : 'AI Asistan'}
                </p>
              </div>
            </div>
            
            {/* Kontroller */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsListening(!isListening)}
                className={`p-2 rounded-xl transition-all ${
                  isListening ? 'bg-red-500 animate-pulse' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {isListening ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white/70" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          
          {/* Model bilgisi */}
          {selectedModelId && (
            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg border border-cyan-500/30">
              <p className="text-cyan-400 text-xs font-medium">
                {getModelById(selectedModelId)?.name || 'Model'}
              </p>
            </div>
          )}
          
          {/* Kontrol ipuçları */}
          <div className="absolute bottom-4 right-4 flex items-center gap-4 text-white/50 text-xs">
            <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Döndür</span>
            <span className="flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Zoom</span>
            <span className="flex items-center gap-1"><Hand className="w-3 h-3" /> Sürükle</span>
          </div>
        </div>
        
        {/* Alt Kısım - Soru + Chat (%40) */}
        <div className="h-[40vh] bg-gradient-to-t from-slate-900 to-slate-900/95 border-t border-cyan-500/20 flex">
          {/* Sol: Soru */}
          <div className="w-1/2 p-4 border-r border-cyan-500/10 overflow-y-auto">
            {question?.imageUrl ? (
              <img 
                src={question.imageUrl} 
                alt="Soru" 
                className="w-full rounded-xl border border-cyan-500/20 mb-3"
              />
            ) : (
              <div className="w-full aspect-video bg-slate-800 rounded-xl border border-cyan-500/20 flex items-center justify-center mb-3">
                <Sparkles className="w-8 h-8 text-cyan-500/50" />
              </div>
            )}
            
            {question?.text && (
              <p className="text-white/80 text-sm leading-relaxed">{question.text}</p>
            )}
            
            {question?.options && (
              <div className="mt-3 space-y-2">
                {Object.entries(question.options).map(([key, value]) => (
                  <div 
                    key={key}
                    className={`p-2 rounded-lg text-sm ${
                      question.correctAnswer === key 
                        ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                        : 'bg-white/5 text-white/70'
                    }`}
                  >
                    <span className="font-bold mr-2">{key})</span>
                    {value}
                  </div>
                ))}
              </div>
            )}
            
            {/* Adımlar */}
            {jarvisData?.steps && jarvisData.steps.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyan-400 text-xs font-medium">
                    Adım {currentStep + 1} / {jarvisData.steps.length}
                  </span>
                  <button
                    onClick={nextStep}
                    disabled={currentStep >= jarvisData.steps.length - 1}
                    className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-lg hover:bg-cyan-500/30 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" />
                    Sonraki
                  </button>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / jarvisData.steps.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Sağ: Chat */}
          <div className="w-1/2 flex flex-col">
            {/* Mesajlar */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-cyan-600 text-white rounded-br-md'
                        : 'bg-white/10 text-white/90 rounded-bl-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 p-3 rounded-2xl rounded-bl-md">
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
            
            {/* Input */}
            <div className="p-3 border-t border-cyan-500/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                  placeholder="Jarvis'e sor..."
                  className="flex-1 px-4 py-2 bg-white/5 border border-cyan-500/20 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim() || isLoading}
                  className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
