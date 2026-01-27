'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface Props {
  prompt: string
  steps: string[]
  correctOrder: string[]
  onSubmit: (order: string[], isCorrect: boolean) => void
  disabled?: boolean
}

function SortableStep({ id, index, disabled, submitted, isCorrectPos }: { id: string; index: number; disabled: boolean; submitted: boolean; isCorrectPos?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-3 p-3 border-2 rounded-xl bg-white text-sm select-none ${
        submitted ? (isCorrectPos ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : 'border-gray-200'
      }`}
    >
      {!disabled && !submitted && (
        <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400">
          <GripVertical className="w-4 h-4" />
        </span>
      )}
      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{index + 1}</span>
      <span className="flex-1">{id}</span>
    </div>
  )
}

export default function OrderStepsWidget({ prompt, steps: initialSteps, correctOrder, onSubmit, disabled }: Props) {
  const [steps, setSteps] = useState(() => [...initialSteps].sort(() => Math.random() - 0.5))
  const [submitted, setSubmitted] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setSteps(prev => {
        const oldIndex = prev.indexOf(active.id as string)
        const newIndex = prev.indexOf(over.id as string)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  const isCorrect = steps.every((s, i) => s === correctOrder[i])

  const handleSubmit = () => {
    setSubmitted(true)
    onSubmit(steps, isCorrect)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">{prompt}</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={steps} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <SortableStep key={step} id={step} index={i} disabled={disabled || submitted} submitted={submitted} isCorrectPos={submitted && step === correctOrder[i]} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {submitted && !isCorrect && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gray-500">
          Doğru sıra: {correctOrder.map((s, i) => `${i + 1}. ${s}`).join(' → ')}
        </motion.div>
      )}
      {!submitted && !disabled && (
        <button onClick={handleSubmit} className="w-full py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors text-sm">
          Kontrol Et
        </button>
      )}
    </div>
  )
}
