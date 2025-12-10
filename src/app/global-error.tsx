'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="tr">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: '#f8fafc',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
            <div style={{
              width: '5rem',
              height: '5rem',
              backgroundColor: '#fef2f2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <AlertTriangle style={{ width: '2.5rem', height: '2.5rem', color: '#ef4444' }} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>
              Kritik Hata
            </h1>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
              Uygulama düzeyinde bir hata oluştu. Lütfen sayfayı yenileyin.
            </p>
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6366f1',
                color: 'white',
                fontWeight: '500',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <RefreshCw style={{ width: '1.25rem', height: '1.25rem' }} />
              Tekrar Dene
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}


