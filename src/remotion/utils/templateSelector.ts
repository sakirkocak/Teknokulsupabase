import { SolutionStep } from '../types'

// Derse göre animasyon şablonu öner
export function selectTemplate(step: SolutionStep, subjectName: string): string {
  const subject = subjectName.toLowerCase()
  const template = step.animation_template?.toLowerCase() || ''

  // Eğer template belirtilmişse onu kullan
  if (template && template !== 'none') {
    return template
  }

  // Adım tipine göre default şablon
  switch (step.type) {
    case 'quiz':
      return 'quiz_screen'
    case 'result':
      return 'result_screen'
    case 'calculation':
      if (subject.includes('matematik')) return 'equation_balance'
      if (subject.includes('fizik')) return 'step_by_step'
      return 'step_by_step'
    case 'visualization':
      if (subject.includes('matematik')) return 'number_line'
      if (subject.includes('fizik')) return 'motion_animation'
      return 'text_reveal'
    default:
      return 'text_reveal'
  }
}

// Template'e göre duration (saniye)
export function getTemplateDuration(template: string): number {
  const durations: Record<string, number> = {
    'text_reveal': 5,
    'step_by_step': 8,
    'equation_balance': 10,
    'number_line': 8,
    'pie_chart': 8,
    'quiz_screen': 15,
    'result_screen': 6
  }
  return durations[template] || 6
}
