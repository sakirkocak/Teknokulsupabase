// Core exports
export { RemotionRoot } from './Root'
export { SolutionVideo } from './compositions/SolutionVideo'
export { SolutionShort } from './compositions/SolutionShort'
export * from './types'

// Common templates
export * from './templates/common'

// Subject-specific templates
export * from './templates/math'
export * from './templates/physics'
export * from './templates/chemistry'
export * from './templates/biology'
export * from './templates/turkish'
export * from './templates/history'

// Utilities
export { selectTemplate, getTemplateDuration } from './utils/templateSelector'
