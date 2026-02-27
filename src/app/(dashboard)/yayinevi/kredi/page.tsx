'use client'

import { useState, useEffect } from 'react'
import { Coins, TrendingUp, TrendingDown, Loader2 } from 'lucide-react'

interface CreditHistory {
  id: string
  amount: number
  reason: string | null
  created_at: string
}

export default function KrediPage() {
  const [balance, setBalance] = useState(0)
  const [history, setHistory] = useState<CreditHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/publisher/credits')
      .then(r => r.json())
      .then(data => {
        setBalance(data.balance || 0)
        setHistory(data.history || [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex justify-center pt-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-surface-900 mb-6">Kredi Yönetimi</h1>

      {/* Bakiye */}
      <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-8 text-white text-center mb-6">
        <Coins className="w-12 h-12 mx-auto mb-3 opacity-90" />
        <p className="text-6xl font-bold">{balance}</p>
        <p className="text-amber-100 mt-2">Mevcut Kredi Bakiyesi</p>
        <p className="text-amber-200 text-sm mt-1">Kredi yüklemek için lütfen Teknokul ile iletişime geçin</p>
      </div>

      {/* Hareketler */}
      <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden">
        <div className="p-4 border-b border-surface-100">
          <h2 className="font-semibold text-surface-900">Kredi Hareketleri</h2>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-surface-500">Henüz hareket yok</div>
        ) : (
          <div className="divide-y divide-surface-50">
            {history.map(h => (
              <div key={h.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    h.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {h.amount > 0
                      ? <TrendingUp className="w-4 h-4 text-green-600" />
                      : <TrendingDown className="w-4 h-4 text-red-600" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900">
                      {h.reason || (h.amount > 0 ? 'Kredi yükleme' : 'Soru satın alma')}
                    </p>
                    <p className="text-xs text-surface-500">
                      {new Date(h.created_at).toLocaleDateString('tr-TR', {
                        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${h.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {h.amount > 0 ? '+' : ''}{h.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
