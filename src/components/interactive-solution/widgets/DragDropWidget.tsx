'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

interface Props {
  prompt: string
  items: string[]
  correctOrder: string[]
  onSubmit: (order: string[], isCorrect: boolean) => void
  disabled?: boolean
}

function SortableItem({ id, disabled, submitted, isCorrectPosition }: { id: string; disabled: boolean; submitted: boolean; isCorrectPosition?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-2 p-3 border-2 rounded-xl bg-white text-sm font-medium select-none ${
        submitted ? (isCorrectPosition ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : 'border-gray-200'
      }`}
    >
      {!disabled && !submitted && (
        <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400">
          <GripVertical className="w-4 h-4" />
        </span>
      )}
      <span>{id}</span>
    </div>
  )
}

export default function DragDropWidget({ prompt, items: initialItems, correctOrder, onSubmit, disabled }: Props) {
  const [items, setItems] = useState(initialItems)
  const [submitted, setSubmitted] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems(prev => {
        const oldIndex = prev.indexOf(active.id as string)
        const newIndex = prev.indexOf(over.id as string)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  const isCorrect = items.every((item, i) => item === correctOrder[i])

  const handleSubmit = () => {
    setSubmitted(true)
    onSubmit(items, isCorrect)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">{prompt}</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item, i) => (
              <SortableItem key={item} id={item} disabled={disabled || submitted} submitted={submitted} isCorrectPosition={submitted && item === correctOrder[i]} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {submitted && !isCorrect && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-600">
          Doğru sıra: {correctOrder.join(' → ')}
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
