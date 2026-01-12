'use client'

import { MessageSquare, Calculator, BookOpen, Zap } from 'lucide-react'

export type StudioMode = 'chat' | 'solve' | 'teach' | 'quiz'

interface ModeSelectorProps {
  currentMode: StudioMode
  onModeChange: (mode: StudioMode) => void
  disabled?: boolean
}

const modes = [
  { id: 'chat' as StudioMode, label: 'Sohbet', icon: MessageSquare, color: 'cyan' },
  { id: 'solve' as StudioMode, label: 'Çöz', icon: Calculator, color: 'blue' },
  { id: 'teach' as StudioMode, label: 'Öğren', icon: BookOpen, color: 'purple' },
  { id: 'quiz' as StudioMode, label: 'Quiz', icon: Zap, color: 'yellow' }
]

export default function ModeSelector({ currentMode, onModeChange, disabled = false }: ModeSelectorProps) {
  return (
    <div className="flex gap-1 p-2 bg-slate-900/50 rounded-xl">
      {modes.map((mode) => {
        const isActive = currentMode === mode.id
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            disabled={disabled}
            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
              isActive
                ? `bg-${mode.color}-500/20 text-${mode.color}-400 shadow-lg shadow-${mode.color}-500/10`
                : 'text-gray-500 hover:text-gray-300 hover:bg-slate-800'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <mode.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        )
      })}
    </div>
  )
}
