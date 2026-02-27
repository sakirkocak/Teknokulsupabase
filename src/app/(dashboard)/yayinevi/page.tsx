'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, BookOpen, Coins, TrendingUp, ArrowRight } from 'lucide-react'

export default function YayineviDashboard() {
  const [stats, setStats] = useState({
    balance: 0,
    purchased: 0,
    available: 0,
    loading: true,
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const [creditsRes, purchasesRes, questionsRes] = await Promise.all([
          fetch('/api/publisher/credits'),
          fetch('/api/publisher/purchases?limit=1'),
          fetch('/api/publisher/questions?limit=1'),
        ])

        const [creditsData, purchasesData, questionsData] = await Promise.all([
          creditsRes.json(),
          purchasesRes.json(),
          questionsRes.json(),
        ])

        setStats({
          balance: creditsData.balance || 0,
          purchased: purchasesData.total || 0,
          available: questionsData.total || 0,
          loading: false,
        })
      } catch {
        setStats(s => ({ ...s, loading: false }))
      }
    }
    fetchStats()
  }, [])

  const cards = [
    {
      title: 'Kredi Bakiyesi',
      value: stats.balance,
      icon: Coins,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      href: '/yayinevi/kredi',
    },
    {
      title: 'Satın Alınan Sorular',
      value: stats.purchased,
      icon: BookOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/yayinevi/sorularim',
    },
    {
      title: 'Markette Müsait',
      value: stats.available,
      icon: ShoppingBag,
      color: 'text-green-600',
      bg: 'bg-green-50',
      href: '/yayinevi/market',
    },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Yayınevi Paneli</h1>
        <p className="text-surface-500 mt-1">Teknokul Kurumsal — Yüksek kaliteli AI destekli sorular</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map(card => (
          <Link key={card.href} href={card.href}>
            <div className="bg-white rounded-2xl border border-surface-100 p-5 hover:border-primary-200 transition-colors cursor-pointer">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-3xl font-bold text-surface-900">
                {stats.loading ? '—' : card.value}
              </p>
              <p className="text-sm text-surface-500 mt-1">{card.title}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Hızlı Erişim */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Soru Marketine Göz At</h2>
            <p className="text-primary-100 text-sm">
              1 kredi = 1 özgün, doğrulanmış soru. Görsel diyagramlar dahil.
            </p>
          </div>
          <Link
            href="/yayinevi/market"
            className="flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-50 transition-colors"
          >
            Markete Git
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
