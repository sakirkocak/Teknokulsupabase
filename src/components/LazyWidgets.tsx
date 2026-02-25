'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const FeedbackWidget = dynamic(() => import('./FeedbackWidget'), {
  ssr: false,
  loading: () => null
})

export function LazyWidgets() {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(() => {
        setShouldLoad(true)
      }, { timeout: 3000 })
      return () => (window as any).cancelIdleCallback(id)
    } else {
      const timer = setTimeout(() => setShouldLoad(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!shouldLoad) return null

  return <FeedbackWidget />
}
