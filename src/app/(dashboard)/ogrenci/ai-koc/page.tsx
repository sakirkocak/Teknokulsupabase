'use client'

import { Suspense } from 'react'
import { AICoachDashboard } from '@/components/ai-coach'
import { Bot, Loader2 } from 'lucide-react'

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Bot className="w-8 h-8 text-primary-500" />
        </div>
        <div className="flex items-center gap-2 justify-center text-surface-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>AI Koç yükleniyor...</span>
        </div>
      </div>
    </div>
  )
}

export default function AIKocPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Suspense fallback={<LoadingState />}>
        <AICoachDashboard />
      </Suspense>
    </div>
  )
}

