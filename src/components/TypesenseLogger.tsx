'use client'

import { useEffect } from 'react'

interface TypesenseLoggerProps {
  source: string
  duration?: number
  page: string
  data?: Record<string, any>
}

export default function TypesenseLogger({ source, duration, page, data }: TypesenseLoggerProps) {
  useEffect(() => {
    if (source === 'typesense') {
      console.log(
        `%c⚡ TYPESENSE %c${page}%c ${duration}ms`,
        'background: #10b981; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
        'background: #6366f1; color: white; padding: 2px 6px; border-radius: 3px; margin-left: 4px;',
        'color: #10b981; font-weight: bold; margin-left: 4px;'
      )
      if (data) {
        console.log('📊 Data:', data)
      }
    } else {
      console.log(
        `%c📊 SUPABASE %c${page}%c ${duration}ms`,
        'background: #f59e0b; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
        'background: #6366f1; color: white; padding: 2px 6px; border-radius: 3px; margin-left: 4px;',
        'color: #f59e0b; font-weight: bold; margin-left: 4px;'
      )
    }
  }, [source, duration, page, data])

  return null
}
