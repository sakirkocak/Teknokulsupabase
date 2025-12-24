'use client'

import { useState } from 'react'
import { Target, Clock, Award, CheckCircle, Plus, Sparkles, AlertCircle } from 'lucide-react'

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

interface AICoachTasksProps {
  tasks: Task[]
  completedTasks: Task[]
  onGenerateTask: () => Promise<void>
  isGenerating: boolean
}

export default function AICoachTasks({ tasks, completedTasks, onGenerateTask, isGenerating }: AICoachTasksProps) {
  const activeTasks = tasks.filter(t => !t.is_expired)
  const hasActiveTask = activeTasks.length > 0

  return (
    <div className="space-y-6">
      {/* Yeni Görev Oluştur */}
      {!hasActiveTask && (
        <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Günlük AI Görevi</h3>
              <p className="text-white/80 text-sm">AI Koç sana özel bir görev oluşturabilir</p>
            </div>
          </div>
          <button
            onClick={onGenerateTask}
            disabled={isGenerating}
            className="w-full mt-4 bg-white text-primary-600 font-medium py-3 px-4 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                Görev Oluşturuluyor...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Günlük Görev Al
              </>
            )}
          </button>
        </div>
      )}

      {/* Aktif Görevler */}
      {activeTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-surface-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-500" />
            Aktif Görevler
          </h3>
          
          {activeTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}

      {/* Tamamlanan Görevler */}
      {completedTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-surface-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Son Tamamlanan Görevler
          </h3>
          
          <div className="space-y-3">
            {completedTasks.map(task => (
              <CompletedTaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Boş durum */}
      {tasks.length === 0 && completedTasks.length === 0 && (
        <div className="text-center py-8 text-surface-500">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Henüz AI Koç göreviniz yok</p>
          <p className="text-sm">Yukarıdaki butona tıklayarak ilk görevinizi alın!</p>
        </div>
      )}
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
  const timeLeft = task.expires_at 
    ? Math.max(0, new Date(task.expires_at).getTime() - Date.now())
    : null
  
  const hoursLeft = timeLeft ? Math.floor(timeLeft / (1000 * 60 * 60)) : null
  const minutesLeft = timeLeft ? Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)) : null

  return (
    <div className="bg-white rounded-xl p-5 border border-surface-100 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-surface-900">{task.title}</h4>
          {task.description && (
            <p className="text-surface-600 text-sm mt-1">{task.description}</p>
          )}
        </div>
        {task.subject_name && (
          <span className="px-3 py-1 bg-primary-50 text-primary-600 text-xs rounded-full">
            {task.subject_name}
          </span>
        )}
      </div>

      {/* İlerleme */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-surface-600">İlerleme</span>
          <span className="font-medium text-surface-900">
            {task.current_count} / {task.target_count}
          </span>
        </div>
        <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>

      {/* Alt bilgiler */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {timeLeft !== null && (
            <div className="flex items-center gap-1 text-surface-500">
              <Clock className="w-4 h-4" />
              <span>{hoursLeft}s {minutesLeft}dk kaldı</span>
            </div>
          )}
          
          {task.target_accuracy && (
            <div className="flex items-center gap-1 text-surface-500">
              <AlertCircle className="w-4 h-4" />
              <span>%{task.target_accuracy} hedef</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-500" />
          <span className="font-medium text-yellow-600">
            {task.xp_reward} XP
            {task.bonus_xp ? ` +${task.bonus_xp}` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

function CompletedTaskCard({ task }: { task: Task }) {
  const completedDate = task.completed_at 
    ? new Date(task.completed_at).toLocaleDateString('tr-TR')
    : ''

  return (
    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <h4 className="font-medium text-green-800">{task.title}</h4>
            <p className="text-green-600 text-sm">{completedDate}</p>
          </div>
        </div>
        <span className="text-green-700 font-medium">+{task.xp_reward} XP</span>
      </div>
    </div>
  )
}

