'use client'

import { useEffect } from 'react'

interface SourceLoggerProps {
  source: string
  duration?: number
  page: string
}

export default function SourceLogger({ source, duration, page }: SourceLoggerProps) {
  useEffect(() => {
    if (source === 'typesense') {
      console.log(`⚡ TYPESENSE AKTIF - ${page}`)
      console.log(`   Kaynak: Typesense`)
      if (duration) console.log(`   Süre: ${duration}ms`)
      console.log(`   Şimşek hızında veri çekildi! 🚀`)
    } else {
      console.log(`📊 SUPABASE - ${page}`)
      console.log(`   Kaynak: Supabase (fallback)`)
      if (duration) console.log(`   Süre: ${duration}ms`)
    }
  }, [source, duration, page])

  return null
}
