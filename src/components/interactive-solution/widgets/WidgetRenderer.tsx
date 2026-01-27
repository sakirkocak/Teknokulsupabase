'use client'

import SliderWidget from './SliderWidget'
import NumberInputWidget from './NumberInputWidget'
import FillBlankWidget from './FillBlankWidget'
import MultipleChoiceWidget from './MultipleChoiceWidget'
import DragDropWidget from './DragDropWidget'
import MatchPairsWidget from './MatchPairsWidget'
import OrderStepsWidget from './OrderStepsWidget'
import CategorySortWidget from './CategorySortWidget'

export interface StepInteraction {
  type: 'slider' | 'drag_drop' | 'number_input' | 'multiple_choice' | 'fill_blank' | 'match_pairs' | 'order_steps' | 'category_sort' | 'draw' | 'none'
  prompt: string
  correct_value: any
  hints: string[]
  feedback_correct: string
  feedback_wrong: string
  max_attempts: number
  // Widget-specific
  min?: number
  max?: number
  step?: number
  tolerance?: number
  items?: string[]
  correct_order?: string[]
  template?: string
  correct_values?: string[]
  options?: { id: string; text: string; is_correct: boolean }[]
  pairs?: { left: string; right: string }[]
  categories?: string[]
  correct_mapping?: Record<string, string> // item -> category
}

interface Props {
  interaction: StepInteraction
  onResult: (isCorrect: boolean, value: any) => void
  disabled?: boolean
}

export default function WidgetRenderer({ interaction, onResult, disabled }: Props) {
  if (!interaction || interaction.type === 'none') return null

  switch (interaction.type) {
    case 'slider':
      return (
        <SliderWidget
          prompt={interaction.prompt}
          min={interaction.min ?? 0}
          max={interaction.max ?? 100}
          step={interaction.step ?? 1}
          correctValue={Number(interaction.correct_value)}
          onSubmit={(v, ok) => onResult(ok, v)}
          disabled={disabled}
        />
      )

    case 'number_input':
      return (
        <NumberInputWidget
          prompt={interaction.prompt}
          correctValue={interaction.correct_value}
          tolerance={interaction.tolerance ?? 0}
          onSubmit={(v, ok) => onResult(ok, v)}
          disabled={disabled}
        />
      )

    case 'fill_blank':
      return (
        <FillBlankWidget
          prompt={interaction.prompt}
          template={interaction.template || '___'}
          correctValues={interaction.correct_values || [String(interaction.correct_value)]}
          onSubmit={(v, ok) => onResult(ok, v)}
          disabled={disabled}
        />
      )

    case 'multiple_choice':
      return (
        <MultipleChoiceWidget
          prompt={interaction.prompt}
          options={interaction.options || []}
          onSubmit={(v, ok) => onResult(ok, v)}
          disabled={disabled}
        />
      )

    case 'drag_drop':
      // If categories exist, use CategorySortWidget instead
      if (interaction.categories && interaction.categories.length > 0 && interaction.correct_mapping) {
        return (
          <CategorySortWidget
            prompt={interaction.prompt}
            items={interaction.items || []}
            categories={interaction.categories}
            correctMapping={interaction.correct_mapping}
            onSubmit={(v, ok) => onResult(ok, v)}
            disabled={disabled}
          />
        )
      }
      return (
        <DragDropWidget
          prompt={interaction.prompt}
          items={interaction.items || []}
          correctOrder={interaction.correct_order || interaction.items || []}
          onSubmit={(v, ok) => onResult(ok, v)}
          disabled={disabled}
        />
      )

    case 'category_sort':
      return (
        <CategorySortWidget
          prompt={interaction.prompt}
          items={interaction.items || []}
          categories={interaction.categories || []}
          correctMapping={interaction.correct_mapping || {}}
          onSubmit={(v, ok) => onResult(ok, v)}
          disabled={disabled}
        />
      )

    case 'match_pairs':
      return (
        <MatchPairsWidget
          prompt={interaction.prompt}
          pairs={interaction.pairs || []}
          onSubmit={(v, ok) => onResult(ok, v)}
          disabled={disabled}
        />
      )

    case 'order_steps':
      return (
        <OrderStepsWidget
          prompt={interaction.prompt}
          steps={interaction.items || []}
          correctOrder={interaction.correct_order || interaction.items || []}
          onSubmit={(v, ok) => onResult(ok, v)}
          disabled={disabled}
        />
      )

    default:
      return null
  }
}
