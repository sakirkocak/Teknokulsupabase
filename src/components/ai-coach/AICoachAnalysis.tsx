'use client'

import { TrendingUp, TrendingDown, Target, Award, Zap } from 'lucide-react'

interface SubjectStats {
  correct: number
  wrong: number
  accuracy: number
  name: string
}

interface AnalysisProps {
  subjects: Record<string, SubjectStats>
  weakSubjects: string[]
  strongSubjects: string[]
  summary: string
  motivationalMessages: string[]
  stats: {
    totalQuestions: number
    totalCorrect: number
    accuracy: number
    currentStreak: number
    maxStreak: number
    totalPoints: number
  }
}

export default function AICoachAnalysis({ 
  subjects, 
  weakSubjects, 
  strongSubjects, 
  summary, 
  motivationalMessages,
  stats
}: AnalysisProps) {
  const subjectEntries = Object.entries(subjects).filter(([_, s]) => s.correct + s.wrong > 0)

  return (
    <div className="space-y-6">
      {/* AI Özet */}
      <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-5 border border-primary-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold text-surface-900 mb-2">AI Koç Analizi</h3>
            <p className="text-surface-700 whitespace-pre-line">{summary}</p>
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-sm">
          <div className="flex items-center gap-2 text-surface-500 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-xs">Toplam Soru</span>
          </div>
          <p className="text-2xl font-bold text-surface-900">{stats.totalQuestions}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-sm">
          <div className="flex items-center gap-2 text-surface-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Doğruluk</span>
          </div>
          <p className="text-2xl font-bold text-primary-600">%{stats.accuracy}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-sm">
          <div className="flex items-center gap-2 text-surface-500 mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-xs">Seri</span>
          </div>
          <p className="text-2xl font-bold text-accent-600">{stats.currentStreak} 🔥</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-sm">
          <div className="flex items-center gap-2 text-surface-500 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-xs">Toplam XP</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.totalPoints}</p>
        </div>
      </div>

      {/* Ders Analizi */}
      {subjectEntries.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-surface-100 shadow-sm">
          <h3 className="font-semibold text-surface-900 mb-4">Ders Bazlı Performans</h3>
          <div className="space-y-3">
            {subjectEntries.map(([code, subject]) => {
              const total = subject.correct + subject.wrong
              const isWeak = weakSubjects.includes(subject.name)
              const isStrong = strongSubjects.includes(subject.name)
              
              return (
                <div key={code} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-surface-600 truncate">
                    {subject.name}
                  </div>
                  <div className="flex-1">
                    <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          isWeak ? 'bg-red-500' : isStrong ? 'bg-green-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${subject.accuracy}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <span className={`text-sm font-medium ${
                      isWeak ? 'text-red-600' : isStrong ? 'text-green-600' : 'text-surface-700'
                    }`}>
                      %{subject.accuracy}
                    </span>
                  </div>
                  <div className="w-8">
                    {isWeak && <TrendingDown className="w-4 h-4 text-red-500" />}
                    {isStrong && <TrendingUp className="w-4 h-4 text-green-500" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Güçlü ve Zayıf Yönler */}
      <div className="grid md:grid-cols-2 gap-4">
        {strongSubjects.length > 0 && (
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Güçlü Yönlerin
            </h4>
            <div className="flex flex-wrap gap-2">
              {strongSubjects.map(subject => (
                <span key={subject} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {subject}
                </span>
              ))}
            </div>
          </div>
        )}

        {weakSubjects.length > 0 && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Geliştirilmesi Gereken
            </h4>
            <div className="flex flex-wrap gap-2">
              {weakSubjects.map(subject => (
                <span key={subject} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                  {subject}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Motivasyon Mesajları */}
      {motivationalMessages.length > 0 && (
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <h4 className="font-medium text-yellow-800 mb-3">💡 AI Koç Önerileri</h4>
          <ul className="space-y-2">
            {motivationalMessages.map((msg, idx) => (
              <li key={idx} className="text-yellow-700 text-sm flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

