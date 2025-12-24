'use client'

import { useState, useEffect } from 'react'
import { Bot, Bell, RefreshCw, ChevronRight, Sparkles } from 'lucide-react'
import AICoachAnalysis from './AICoachAnalysis'
import AICoachTasks from './AICoachTasks'
import AICoachChat from './AICoachChat'

interface AICoachData {
  student: {
    name: string
    grade: number
    targetExam: string
  }
  stats: {
    totalQuestions: number
    totalCorrect: number
    accuracy: number
    currentStreak: number
    maxStreak: number
    totalPoints: number
  }
  weekly: {
    totalQuestions: number
    correctCount: number
    wrongCount: number
    accuracy: number
    dailyStats: Array<{
      date: string
      questions: number
      correct: number
      accuracy: number
    }>
  }
  subjects: Record<string, {
    correct: number
    wrong: number
    accuracy: number
    name: string
  }>
  analysis: {
    weakSubjects: string[]
    strongSubjects: string[]
    summary: string
    motivationalMessages: string[]
  }
  aiCoach: {
    totalChats: number
    tasksCompleted: number
    lastInteraction: string | null
  }
  notification: {
    id: string
    type: string
    title: string
    message: string
    icon: string
    action?: {
      label: string
      href: string
    }
  }
}

interface Task {
  id: string
  title: string
  description: string | null
  subject_code: string | null
  subject_name: string | null
  target_count: number
  current_count: number
  target_accuracy: number | null
  xp_reward: number
  bonus_xp: number | null
  status: string
  expires_at: string | null
  completed_at: string | null
  created_at: string
  progress: number
  is_expired: boolean
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default function AICoachDashboard() {
  const [data, setData] = useState<AICoachData | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'analysis' | 'tasks' | 'chat'>('analysis')
  const [showNotification, setShowNotification] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Önce görevleri senkronize et (bugün çözülen sorularla)
      await fetch('/api/ai-coach/sync', { method: 'POST' })
      
      // Sonra tüm verileri yükle
      const [analysisRes, tasksRes, chatRes] = await Promise.all([
        fetch('/api/ai-coach/analyze'),
        fetch('/api/ai-coach/tasks'),
        fetch('/api/ai-coach/chat')
      ])

      const analysisData = await analysisRes.json()
      const tasksData = await tasksRes.json()
      const chatData = await chatRes.json()

      if (!analysisRes.ok) throw new Error(analysisData.error)
      
      setData(analysisData)
      setTasks(tasksData.tasks || [])
      setCompletedTasks(tasksData.completedTasks || [])
      setMessages(chatData.conversations || [])

    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateTask = async () => {
    try {
      setIsGenerating(true)
      const res = await fetch('/api/ai-coach/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setTasks(prev => [data.task, ...prev])
    } catch (error) {
      console.error('Generate task error:', error)
      alert('Görev oluşturulamadı. Lütfen tekrar deneyin.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Bot className="w-8 h-8 text-primary-500" />
          </div>
          <p className="text-surface-600">AI Koç yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-surface-600">Veriler yüklenemedi.</p>
        <button onClick={loadData} className="mt-4 text-primary-500 hover:underline">
          Tekrar Dene
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-surface-900">AI Koç</h1>
            <p className="text-surface-600 text-sm">Merhaba {data.student.name}! 👋</p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
          title="Yenile"
        >
          <RefreshCw className="w-5 h-5 text-surface-500" />
        </button>
      </div>

      {/* Bildirim */}
      {showNotification && data.notification && (
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4 border border-primary-100 relative">
          <button
            onClick={() => setShowNotification(false)}
            className="absolute top-2 right-2 p-1 hover:bg-white/50 rounded-full"
          >
            <span className="sr-only">Kapat</span>
            ×
          </button>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{data.notification.icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-surface-900">{data.notification.title}</h3>
              <p className="text-surface-700 text-sm mt-1">{data.notification.message}</p>
              {data.notification.action && (
                <a
                  href={data.notification.action.href}
                  className="inline-flex items-center gap-1 mt-2 text-primary-600 text-sm font-medium hover:underline"
                >
                  {data.notification.action.label}
                  <ChevronRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-surface-100 pb-2">
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'analysis'
              ? 'bg-primary-500 text-white'
              : 'text-surface-600 hover:bg-surface-100'
          }`}
        >
          📊 Analiz
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'tasks'
              ? 'bg-primary-500 text-white'
              : 'text-surface-600 hover:bg-surface-100'
          }`}
        >
          🎯 Görevler
          {tasks.filter(t => !t.is_expired).length > 0 && (
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              activeTab === 'tasks' ? 'bg-white/20' : 'bg-primary-100 text-primary-600'
            }`}>
              {tasks.filter(t => !t.is_expired).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'bg-primary-500 text-white'
              : 'text-surface-600 hover:bg-surface-100'
          }`}
        >
          💬 Sohbet
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'analysis' && (
          <AICoachAnalysis
            subjects={data.subjects}
            weakSubjects={data.analysis.weakSubjects}
            strongSubjects={data.analysis.strongSubjects}
            summary={data.analysis.summary}
            motivationalMessages={data.analysis.motivationalMessages}
            stats={data.stats}
          />
        )}

        {activeTab === 'tasks' && (
          <AICoachTasks
            tasks={tasks}
            completedTasks={completedTasks}
            onGenerateTask={handleGenerateTask}
            isGenerating={isGenerating}
          />
        )}

        {activeTab === 'chat' && (
          <AICoachChat initialMessages={messages} />
        )}
      </div>

      {/* AI Koç Bilgisi */}
      <div className="bg-surface-50 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <div className="text-sm">
            <span className="text-surface-600">Toplam sohbet: </span>
            <span className="font-medium text-surface-900">{data.aiCoach.totalChats}</span>
            <span className="text-surface-400 mx-2">•</span>
            <span className="text-surface-600">Tamamlanan görev: </span>
            <span className="font-medium text-surface-900">{data.aiCoach.tasksCompleted}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

