'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Bot, ArrowLeft, Settings, Loader2, Atom, Mic, MicOff, Volume2, 
  VolumeX, Phone, PhoneOff, Send, MessageSquare, Calculator, 
  BookOpen, Zap, CheckCircle, XCircle, Target, Trophy
} from 'lucide-react'

import QuestionSearch from './QuestionSearch'
import JarvisScene from './JarvisScene'

// ===== TYPES =====
interface Message {
  id: string
  role: 'user' | 'jarvis'
  content: string
  timestamp: Date
}

interface Question {
  id: string
  question_text: string
  subject: string
  topic?: string
  difficulty?: string
  options?: Record<string, string>
  correct_answer?: string
}

type StudioMode = 'chat' | 'solve' | 'teach' | 'quiz'

// ===== COMPONENT =====
export default function JarvisStudioPage() {
  const router = useRouter()
  
  // User
  const [studentName, setStudentName] = useState('Öğrenci')
  const [grade, setGrade] = useState(8)
  const [isLoading, setIsLoading] = useState(true)
  
  // Mode
  const [mode, setMode] = useState<StudioMode>('chat')
  
  // Chat
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  
  // Question
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  
  // Quiz
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [quizAnswered, setQuizAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  
  // Voice
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)  // Kullanıcı etkileşimi
  
  // 3D
  const [modelType, setModelType] = useState('default')
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)  // Çift çalışmayı engelle
  const studentNameRef = useRef('Öğrenci')  // Closure sorunu için
  const voiceModeRef = useRef(false)  // Voice mode için

  // ===== LOAD PROFILE =====
  useEffect(() => {
    // React Strict Mode'da çift çalışmayı engelle
    if (hasInitialized.current) return
    hasInitialized.current = true
    
    async function loadProfile() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/giris')
          return
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single()
        
        console.log('📋 Profil:', profile, 'Hata:', profileError)
        
        // Sadece ilk ismi al (Şakir KOÇAK → Şakir)
        const fullName = profile?.full_name || user.email?.split('@')[0] || 'Öğrenci'
        const firstName = fullName.split(' ')[0]
        console.log('👤 İsim:', firstName)
        setStudentName(firstName)
        studentNameRef.current = firstName  // Ref'i de güncelle
        
        // Sınıf bilgisini student_profiles'dan al
        const { data: studentProfile } = await supabase
          .from('student_profiles')
          .select('grade_level')
          .eq('user_id', user.id)
          .single()
        
        setGrade(studentProfile?.grade_level || 8)
        
        // Proaktif karşılama - Jarvis konuşmayı yönlendiriyor
        setMessages([{
          id: 'welcome',
          role: 'jarvis',
          content: `Merhaba ${firstName}! 👋 Ben Jarvis, senin kişisel yapay zeka öğretmenin.\n\nBugün seninle çalışmak için sabırsızlanıyorum! Ne yapmak istersin?\n\n• "Bana bir soru sor" diyebilirsin\n• "Kesirler konusunu anlat" diyebilirsin\n• Sol panelden soru arayabilirsin\n• Ya da sohbet edebiliriz!`,
          timestamp: new Date()
        }])
        
        // Welcome speech kullanıcı "Başlat" dediğinde çalacak
        
      } catch (error) {
        console.error('Profil hatası:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [router])

  // ===== SPEECH RECOGNITION =====
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SR = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SR()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'tr-TR'

      recognitionRef.current.onresult = (e: any) => {
        const text = e.results[0][0].transcript
        console.log('🎤 Sen:', text)
        setIsListening(false)
        stopSpeaking()
        if (text.trim()) sendMessage(text)
      }

      recognitionRef.current.onerror = () => setIsListening(false)
      recognitionRef.current.onend = () => setIsListening(false)
    }
  }, [])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ===== VOICE FUNCTIONS =====
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsSpeaking(false)
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return
    // Önce Jarvis'i kes
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsSpeaking(false)
    }
    try {
      recognitionRef.current.start()
      setIsListening(true)
      console.log('🎤 Mikrofon açıldı - Konuş!')
    } catch (e) {
      console.error('Mikrofon hatası:', e)
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }, [])

  // voiceMode değiştiğinde ref'i güncelle
  useEffect(() => { voiceModeRef.current = voiceMode }, [voiceMode])

  const speakText = useCallback(async (text: string) => {
    if (!autoSpeak) return
    stopSpeaking()
    setIsSpeaking(true)
    
    try {
      const clean = text.replace(/[👋🎯✨🚀💪📚✅❌🔥⭐💡🎉🤔💬📝🔍]/g, '').slice(0, 400).trim()
      if (!clean) { setIsSpeaking(false); return }
      
      console.log('🔊 Jarvis konuşuyor...')
      
      const res = await fetch('/api/jarvis/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, voice: 'rachel' })
      })
      
      if (!res.ok) throw new Error('TTS failed')
      const data = await res.json()
      if (!data.audio) throw new Error('No audio')
      
      const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`)
      audioRef.current = audio
      
      audio.onended = () => {
        console.log('🔊 Jarvis bitti')
        setIsSpeaking(false)
        audioRef.current = null
        // Sesli modda Jarvis bitince otomatik mikrofon aç
        if (voiceModeRef.current) {
          console.log('🎤 Sıra sende! Mikrofon açılıyor...')
          setTimeout(() => {
            if (recognitionRef.current && !isListening) {
              try {
                recognitionRef.current.start()
                setIsListening(true)
              } catch (e) {}
            }
          }, 500)
        }
      }
      
      audio.onerror = () => { 
        setIsSpeaking(false)
        audioRef.current = null 
      }
      
      await audio.play()
      
    } catch (err) {
      console.error('TTS error:', err)
      setIsSpeaking(false)
      // Hata olsa bile sesli modda mikrofon aç
      if (voiceModeRef.current) {
        setTimeout(() => {
          if (recognitionRef.current && !isListening) {
            try {
              recognitionRef.current.start()
              setIsListening(true)
            } catch (e) {}
          }
        }, 500)
      }
    }
  }, [autoSpeak, stopSpeaking, isListening])

  const toggleVoiceMode = useCallback(() => {
    if (voiceMode) {
      console.log('🔇 Sesli mod kapatıldı')
      setVoiceMode(false)
      voiceModeRef.current = false
      stopListening()
    } else {
      console.log('🎙️ Sesli mod açıldı - Sürekli konuşma!')
      setVoiceMode(true)
      voiceModeRef.current = true
      startListening()
    }
  }, [voiceMode, stopListening, startListening])

  // ===== HELPERS =====
  const getName = () => studentNameRef.current  // Her zaman güncel ismi döndür
  
  const addJarvisMessage = (content: string) => {
    const msg: Message = { id: Date.now().toString(), role: 'jarvis', content, timestamp: new Date() }
    setMessages(prev => [...prev, msg])
  }

  // ===== START JARVIS =====
  const startJarvis = async () => {
    setHasStarted(true)
    setVoiceMode(true)  // Sesli modu otomatik aç
    voiceModeRef.current = true
    // Welcome speech
    try {
      const name = studentNameRef.current
      console.log('🔊 Jarvis başlatılıyor...', name)
      const welcomeText = `Merhaba ${name}! Ben Jarvis. Bugün birlikte neler öğreneceğiz?`
      const res = await fetch('/api/jarvis/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: welcomeText, voice: 'rachel' })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.audio) {
          setIsSpeaking(true)
          const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`)
          audioRef.current = audio
          audio.onended = () => {
            setIsSpeaking(false)
            audioRef.current = null
            // Jarvis bitince mikrofon aç
            console.log('🎤 Jarvis bitti, sıra sende!')
            setTimeout(() => {
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.start()
                  setIsListening(true)
                } catch (e) { console.log('Mic zaten açık') }
              }
            }, 300)
          }
          await audio.play()
          console.log('🔊 Jarvis konuşuyor!')
        }
      }
    } catch (e) {
      console.error('Welcome speech hatası:', e)
    }
  }

  const needsWolfram = (text: string): boolean => {
    return /\d+\s*[\+\-\*\/\^]\s*\d+|kaç|hesapla|çarp|böl|topla|çıkar|kök|üs|karekök/i.test(text)
  }

  const callWolfram = async (query: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/jarvis/wolfram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      const data = await res.json()
      return data.success ? data.result : null
    } catch { return null }
  }

  // Kullanıcı soru istiyor mu?
  const wantsQuestion = (text: string): boolean => {
    const t = text.toLowerCase()
    return t.includes('soru sor') || t.includes('soru getir') || t.includes('bana soru') || 
           t.includes('test et') || t.includes('sınav') || t.includes('bir soru')
  }

  // Konuya göre soru getir
  const getTopicFromText = (text: string): string | null => {
    const topics = ['matematik', 'kesir', 'denklem', 'geometri', 'üçgen', 'fen', 'fizik', 'kimya', 
                    'biyoloji', 'hücre', 'türkçe', 'paragraf', 'tarih', 'coğrafya', 'ingilizce']
    const t = text.toLowerCase()
    for (const topic of topics) {
      if (t.includes(topic)) return topic
    }
    return null
  }

  // Soru havuzundan rastgele soru getir
  const fetchRandomQuestion = async (topic?: string): Promise<Question | null> => {
    try {
      const { searchQuestionsFast, isTypesenseEnabled } = await import('@/lib/typesense/browser-client')
      if (!isTypesenseEnabled()) return null
      
      const searchTerm = topic || ['kesir', 'denklem', 'üçgen', 'hücre', 'paragraf'][Math.floor(Math.random() * 5)]
      const { results } = await searchQuestionsFast(searchTerm, { grade: grade, limit: 10 })
      
      if (results.length === 0) return null
      
      // Rastgele birini seç
      const randomQ = results[Math.floor(Math.random() * results.length)]
      return {
        id: randomQ.question_id,
        question_text: randomQ.question_text,
        subject: randomQ.subject_name,
        topic: randomQ.main_topic,
        difficulty: randomQ.difficulty
      }
    } catch (e) {
      console.error('Soru getirme hatası:', e)
      return null
    }
  }

  const updateModel = (topic: string) => {
    const t = topic.toLowerCase()
    // Fizik/Kimya
    if (t.includes('atom') || t.includes('element') || t.includes('periyodik') || t.includes('elektron')) setModelType('atom')
    else if (t.includes('molekül') || t.includes('bağ') || t.includes('kimya')) setModelType('atom')
    // Biyoloji
    else if (t.includes('hücre') || t.includes('mitoz') || t.includes('mayoz') || t.includes('organel')) setModelType('cell')
    else if (t.includes('dna') || t.includes('gen') || t.includes('kalıtım') || t.includes('kromozom')) setModelType('dna')
    else if (t.includes('fotosentez') || t.includes('solunum') || t.includes('bitki')) setModelType('cell')
    // Geometri
    else if (t.includes('üçgen') || t.includes('açı') || t.includes('kenar')) setModelType('triangle')
    else if (t.includes('küp') || t.includes('prizma') || t.includes('dikdörtgen') || t.includes('kare')) setModelType('cube')
    else if (t.includes('küre') || t.includes('dünya') || t.includes('gezegen') || t.includes('yeryüzü')) setModelType('sphere')
    else if (t.includes('çember') || t.includes('daire') || t.includes('yarıçap')) setModelType('sphere')
    // Matematik
    else if (t.includes('denklem') || t.includes('formül') || t.includes('fonksiyon') || t.includes('eşitlik')) setModelType('math')
    else if (t.includes('kesir') || t.includes('oran') || t.includes('yüzde')) setModelType('math')
    // Teknoloji
    else if (t.includes('robot') || t.includes('mekanik') || t.includes('makine') || t.includes('kol')) setModelType('robot')
    else if (t.includes('bilgisayar') || t.includes('yazılım') || t.includes('kod')) setModelType('robot')
    // Varsayılan
    else setModelType('default')
  }

  // ===== SEND MESSAGE =====
  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending) return
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsSending(true)
    
    try {
      // ===== SORU İSTEME =====
      if (wantsQuestion(text)) {
        const topic = getTopicFromText(text)
        const question = await fetchRandomQuestion(topic || undefined)
        
        if (question) {
          // Hologramı güncelle
          if (question.topic) updateModel(question.topic)
          else if (question.subject) updateModel(question.subject)
          
          const name = studentNameRef.current
          const jarvisResponse = `Tamam ${name}, sana bir soru hazırladım! 📝\n\n**${question.subject}** - ${question.topic || 'Genel'}\n\n"${question.question_text}"\n\nDüşün ve cevabını söyle! Yardım istersen "ipucu ver" de.`
          
          addJarvisMessage(jarvisResponse)
          speakText(`Tamam ${name}, sana bir soru hazırladım. ${question.question_text.slice(0, 200)}. Düşün ve cevabını söyle!`)
          setSelectedQuestion(question)
          setIsSending(false)
          return
        }
      }
      
      let enhanced = text
      
      // Wolfram for math
      if (needsWolfram(text)) {
        const wolfram = await callWolfram(text)
        if (wolfram) enhanced = `${text}\n\n[Matematik Sonucu: ${wolfram}]`
      }
      
      const res = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: enhanced,
          studentName,
          grade,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role === 'jarvis' ? 'assistant' : 'user',
            content: m.content
          }))
        })
      })
      
      const data = await res.json()
      const jarvisText = data.text || data.response
      
      if (jarvisText) {
        addJarvisMessage(jarvisText)
        speakText(jarvisText)
        if (data.topic) updateModel(data.topic)
      }
      
    } catch (err) {
      addJarvisMessage(`${getName()}, bir sorun oluştu. Tekrar dene!`)
    } finally {
      setIsSending(false)
    }
  }

  // ===== SELECT QUESTION (SOLVE MODE) =====
  const handleSelectQuestion = (q: Question) => {
    setSelectedQuestion(q)
    setMode('solve')
    
    // Konuya göre hologram güncelle
    if (q.topic) updateModel(q.topic)
    else if (q.subject) updateModel(q.subject)
    else if (q.question_text) {
      // Soru metninden konu tahmin et
      const text = q.question_text.toLowerCase()
      if (text.includes('robot')) updateModel('robot')
      else if (text.includes('üçgen') || text.includes('açı')) updateModel('triangle')
      else if (text.includes('hücre') || text.includes('canlı')) updateModel('cell')
      else if (text.includes('atom') || text.includes('element')) updateModel('atom')
      else if (text.includes('denklem') || text.includes('=')) updateModel('math')
    }
    
    let prompt = `Bu soruyu adım adım çözelim:\n\n"${q.question_text}"`
    if (q.topic) prompt += `\n\nKonu: ${q.topic}`
    
    sendMessage(prompt)
  }

  // ===== START QUIZ =====
  const startQuiz = (questions: Question[]) => {
    if (questions.length < 3) {
      addJarvisMessage('Quiz için en az 3 soru gerekli. Daha fazla soru ara!')
      return
    }
    
    setQuizQuestions(questions.slice(0, 10))
    setQuizIndex(0)
    setQuizScore(0)
    setQuizAnswered(false)
    setSelectedAnswer(null)
    setMode('quiz')
    
    addJarvisMessage(`🎯 Quiz başlıyor ${getName()}! ${Math.min(questions.length, 10)} soru var. Hazır mısın?`)
    speakText(`Quiz başlıyor ${getName()}! Hazır mısın?`)
  }

  // ===== QUIZ ANSWER =====
  const handleQuizAnswer = (answer: string) => {
    if (quizAnswered) return
    setSelectedAnswer(answer)
    setQuizAnswered(true)
    
    const currentQ = quizQuestions[quizIndex]
    const isCorrect = answer === currentQ.correct_answer
    
    if (isCorrect) {
      setQuizScore(s => s + 1)
      addJarvisMessage(`✅ Doğru ${getName()}! Harikasın!`)
      speakText(`Doğru ${getName()}! Harikasın!`)
    } else {
      addJarvisMessage(`❌ Yanlış. Doğru cevap: ${currentQ.correct_answer}`)
      speakText(`Yanlış oldu. Doğru cevap ${currentQ.correct_answer} şıkkıydı.`)
    }
  }

  const nextQuizQuestion = () => {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(i => i + 1)
      setQuizAnswered(false)
      setSelectedAnswer(null)
    } else {
      // Quiz finished
      const percentage = Math.round((quizScore / quizQuestions.length) * 100)
      addJarvisMessage(`🏆 Quiz bitti ${getName()}!\n\nSonuç: ${quizScore}/${quizQuestions.length} (%${percentage})\n\n${percentage >= 70 ? '🎉 Harika!' : percentage >= 50 ? '👍 İyi!' : '💪 Daha fazla pratik yap!'}`)
      speakText(`Quiz bitti ${getName()}! ${quizQuestions.length} sorudan ${quizScore} doğru yaptın. Yüzde ${percentage} başarı!`)
      setMode('chat')
    }
  }

  // ===== TEACH MODE =====
  const startTeach = async (topic: string) => {
    setMode('teach')
    setIsSending(true)
    
    try {
      const res = await fetch('/api/jarvis/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, grade, subject: 'genel' })
      })
      
      const data = await res.json()
      
      if (data.introduction) {
        addJarvisMessage(data.introduction)
        speakText(data.introduction)
        updateModel(topic)
      } else {
        sendMessage(`${topic} konusunu anlat`)
      }
    } catch {
      sendMessage(`${topic} konusunu anlat`)
    } finally {
      setIsSending(false)
    }
  }

  // ===== LOADING =====
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-cyan-400">Jarvis yükleniyor...</p>
        </div>
      </div>
    )
  }

  // ===== START SCREEN =====
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Bot className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Merhaba {studentName}!</h1>
          <p className="text-cyan-400 mb-8">Ben Jarvis, senin kişisel yapay zeka öğretmenin. Bugün birlikte öğrenmeye hazır mısın?</p>
          
          <button
            onClick={startJarvis}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-semibold rounded-2xl hover:from-cyan-400 hover:to-blue-500 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/30"
          >
            <div className="flex items-center gap-3">
              <Volume2 className="w-6 h-6" />
              <span>Jarvis'i Başlat</span>
            </div>
          </button>
          
          <p className="text-slate-500 text-sm mt-6">Sesli etkileşim için mikrofon izni gerekebilir</p>
        </div>
      </div>
    )
  }

  const currentQuizQ = quizQuestions[quizIndex]

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* ===== LEFT PANEL ===== */}
      <div className="w-96 border-r border-cyan-500/20 flex flex-col bg-slate-900/50">
        {/* Header */}
        <div className="p-4 border-b border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              Jarvis Studio
            </h1>
            <button className="p-2 hover:bg-slate-800 rounded-lg">
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Mode Selector */}
          <div className="flex gap-1 p-1 bg-slate-800 rounded-xl">
            {[
              { id: 'chat', icon: MessageSquare, label: 'Sohbet' },
              { id: 'solve', icon: Calculator, label: 'Çöz' },
              { id: 'teach', icon: BookOpen, label: 'Öğren' },
              { id: 'quiz', icon: Zap, label: 'Quiz' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as StudioMode)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                  mode === m.id 
                    ? 'bg-cyan-500/20 text-cyan-400' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <m.icon className="w-4 h-4" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content based on mode */}
        <div className="flex-1 overflow-hidden">
          {mode === 'quiz' && quizQuestions.length > 0 ? (
            // Quiz Panel
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Soru {quizIndex + 1}/{quizQuestions.length}</span>
                <span className="text-xs text-cyan-400 font-medium"><Target className="w-3 h-3 inline mr-1" />{quizScore} doğru</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full">
                <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${((quizIndex) / quizQuestions.length) * 100}%` }} />
              </div>
              
              <div className="p-4 bg-slate-800 rounded-xl">
                <p className="text-sm text-gray-300">{currentQuizQ?.question_text}</p>
              </div>
              
              {currentQuizQ?.options && (
                <div className="space-y-2">
                  {Object.entries(currentQuizQ.options).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => handleQuizAnswer(key)}
                      disabled={quizAnswered}
                      className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        quizAnswered
                          ? key === currentQuizQ.correct_answer
                            ? 'border-green-500 bg-green-500/20'
                            : selectedAnswer === key
                              ? 'border-red-500 bg-red-500/20'
                              : 'border-slate-600 opacity-50'
                          : selectedAnswer === key
                            ? 'border-cyan-500 bg-cyan-500/20'
                            : 'border-slate-600 hover:border-cyan-500/50'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        quizAnswered && key === currentQuizQ.correct_answer ? 'bg-green-500 text-white' :
                        quizAnswered && selectedAnswer === key ? 'bg-red-500 text-white' :
                        'bg-slate-700 text-gray-400'
                      }`}>{key}</span>
                      <span className="text-sm text-gray-300">{value}</span>
                      {quizAnswered && key === currentQuizQ.correct_answer && <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />}
                      {quizAnswered && selectedAnswer === key && key !== currentQuizQ.correct_answer && <XCircle className="w-5 h-5 text-red-400 ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
              
              {quizAnswered && (
                <button onClick={nextQuizQuestion} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium">
                  {quizIndex < quizQuestions.length - 1 ? 'Sonraki Soru' : 'Sonuçları Gör'}
                </button>
              )}
            </div>
          ) : mode === 'teach' ? (
            // Teach Panel
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-400">Hangi konuyu öğrenmek istersin?</p>
              <div className="space-y-2">
                {['Kesirler', 'Denklemler', 'Üçgenler', 'Hücre', 'Fotosentez', 'Atomun Yapısı'].map(topic => (
                  <button
                    key={topic}
                    onClick={() => startTeach(topic)}
                    className="w-full p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-left text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    {topic}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">veya aşağıya konu yaz</p>
            </div>
          ) : (
            // Question Search (default)
            <QuestionSearch 
              onSelect={handleSelectQuestion} 
              onStartQuiz={startQuiz}
              grade={grade} 
            />
          )}
        </div>
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div className="flex-1 flex flex-col">
        {/* 3D Scene */}
        <div className="h-[40%] relative border-b border-cyan-500/20">
          <JarvisScene modelType={modelType} className="w-full h-full" />
          
          {/* Top Left */}
          <div className="absolute top-4 left-4 space-y-2">
            <div className="px-3 py-1.5 bg-slate-900/80 backdrop-blur rounded-lg border border-cyan-500/20">
              <p className="text-cyan-400 text-xs font-medium flex items-center gap-1">
                <Atom className="w-3 h-3" />
                3D Hologram
              </p>
            </div>
            {isSpeaking && <div className="px-2 py-1 bg-green-500/20 rounded-lg animate-pulse"><p className="text-green-400 text-xs">🔊 Konuşuyor</p></div>}
            {isListening && <div className="px-2 py-1 bg-red-500/20 rounded-lg animate-pulse"><p className="text-red-400 text-xs">🎤 Dinliyor</p></div>}
          </div>
          
          {/* Top Right */}
          <div className="absolute top-4 right-4 space-y-2 text-right">
            <div className="px-3 py-1.5 bg-slate-900/80 backdrop-blur rounded-lg border border-cyan-500/20 inline-block">
              <p className="text-white text-sm font-medium">👋 {studentName}</p>
            </div>
            <button onClick={toggleVoiceMode} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${voiceMode ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-slate-800 text-gray-400 hover:text-white border border-cyan-500/20'}`}>
              {voiceMode ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              <span className="text-xs font-medium">{voiceMode ? 'Sesli Mod Açık' : 'Sesli Sohbet'}</span>
            </button>
          </div>
          
          {/* Bottom */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="px-3 py-1.5 bg-slate-900/80 rounded-full border border-cyan-500/20">
              <p className="text-xs text-gray-400">
                <span className="text-cyan-400">●</span> Gemini
                <span className="mx-2 text-green-400">●</span> ElevenLabs
                <span className="mx-2 text-purple-400">●</span> Wolfram
              </p>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-br-sm' : 'bg-slate-800 text-gray-200 rounded-bl-sm border border-cyan-500/20'}`}>
                  {msg.role === 'jarvis' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-cyan-400 font-medium">Jarvis</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-sm border border-cyan-500/20">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-cyan-400" />
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-xs text-gray-400">Düşünüyor...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-cyan-500/20">
            <div className="flex items-center gap-2">
              <button onClick={() => setAutoSpeak(!autoSpeak)} className={`p-3 rounded-xl ${autoSpeak ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-gray-500'}`}>
                {autoSpeak ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button onClick={() => isListening ? stopListening() : startListening()} className={`p-3 rounded-xl ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-gray-400 hover:text-cyan-400'}`}>
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
                placeholder={`${studentName}, Jarvis'e sor...`}
                className="flex-1 px-4 py-3 bg-slate-800 border border-cyan-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 text-sm"
                disabled={isSending}
              />
              <button onClick={() => sendMessage(inputText)} disabled={!inputText.trim() || isSending} className="p-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-xl">
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Mic */}
      {!voiceMode && (
        <button onClick={startListening} className={`fixed bottom-24 right-8 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 ${isListening ? 'bg-red-500 animate-pulse shadow-red-500/50' : 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/50'}`}>
          <Mic className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  )
}
