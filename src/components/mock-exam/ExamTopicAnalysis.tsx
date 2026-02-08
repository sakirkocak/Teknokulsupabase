'use client'

import { TrendingUp, TrendingDown, BookOpen } from 'lucide-react'

interface TopicItem {
  topic: string
  subject: string
  correct: number
  total: number
  rate: number
}

interface ExamTopicAnalysisProps {
  weakTopics: TopicItem[]
  strongTopics: TopicItem[]
}

export default function ExamTopicAnalysis({ weakTopics, strongTopics }: ExamTopicAnalysisProps) {
  if (weakTopics.length === 0 && strongTopics.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-100 p-6">
      <h3 className="text-lg font-bold text-surface-900 mb-6">Konu Analizi</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guclu konular */}
        {strongTopics.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h4 className="text-sm font-semibold text-green-700">Guclu Konular</h4>
            </div>
            <div className="space-y-2">
              {strongTopics.map((topic, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2.5 bg-green-50 rounded-xl"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-green-800 font-medium truncate">{topic.topic}</span>
                  </div>
                  <span className="text-xs font-bold text-green-600 ml-2 flex-shrink-0">
                    %{topic.rate} ({topic.correct}/{topic.total})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zayif konular */}
        {weakTopics.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <h4 className="text-sm font-semibold text-red-700">Gelistirilmesi Gereken Konular</h4>
            </div>
            <div className="space-y-2">
              {weakTopics.map((topic, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2.5 bg-red-50 rounded-xl"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-800 font-medium truncate">{topic.topic}</span>
                  </div>
                  <span className="text-xs font-bold text-red-600 ml-2 flex-shrink-0">
                    %{topic.rate} ({topic.correct}/{topic.total})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
