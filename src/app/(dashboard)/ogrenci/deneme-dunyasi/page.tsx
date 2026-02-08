'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { FileText, Clock, TrendingUp, Trophy, ExternalLink } from 'lucide-react'
import { EXAM_TYPE_LABELS } from '@/lib/mock-exam/constants'

interface ExamHistory {
  id: string
  result_id: string
  exam_id: string
  exam_title: string
  score: number
  total_net: number
  time_taken: number
  rank: number
  percentile: number
  exam_type: string
  grade: number
  completed_at: number
}

export default function OgrenciDenemeDunyasiPage() {
  const [results, setResults] = useState<ExamHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalExams: 0,
    avgScore: 0,
    bestScore: 0,
    avgPercentile: 0,
  })

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    try {
      // Kullanicinin sonuclarini Typesense'den al
      const res = await fetch('/api/mock-exam/results?per_page=50')
      if (!res.ok) return

      const data = await res.json()
      const rankings = data.rankings || []
      setResults(rankings)

      // Istatistikleri hesapla
      if (rankings.length > 0) {
        const scores = rankings.map((r: any) => Number(r.score))
        setStats({
          totalExams: rankings.length,
          avgScore: Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length),
          bestScore: Math.round(Math.max(...scores)),
          avgPercentile: Math.round(
            rankings.reduce((a: number, r: any) => a + Number(r.percentile || 0), 0) / rankings.length
          ),
        })
      }
    } catch (e) {
      console.error('History fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="ogrenci">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-surface-900">Deneme Dunyasi</h1>
            <p className="text-sm text-surface-500">Deneme sinavi gecmisiniz ve istatistikleriniz</p>
          </div>
          <Link
            href="/deneme-dunyasi"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Yeni Deneme Coz
          </Link>
        </div>

        {/* Istatistik kartlari */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-surface-100 p-5 text-center">
            <FileText className="w-7 h-7 text-primary-500 mx-auto mb-2" />
            <div className="text-2xl font-black text-surface-800">{stats.totalExams}</div>
            <div className="text-xs text-surface-400">Toplam Deneme</div>
          </div>
          <div className="bg-white rounded-2xl border border-surface-100 p-5 text-center">
            <TrendingUp className="w-7 h-7 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-black text-surface-800">{stats.avgScore}</div>
            <div className="text-xs text-surface-400">Ort. Puan</div>
          </div>
          <div className="bg-white rounded-2xl border border-surface-100 p-5 text-center">
            <Trophy className="w-7 h-7 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-black text-surface-800">{stats.bestScore}</div>
            <div className="text-xs text-surface-400">En Yuksek</div>
          </div>
          <div className="bg-white rounded-2xl border border-surface-100 p-5 text-center">
            <Clock className="w-7 h-7 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-black text-surface-800">%{stats.avgPercentile}</div>
            <div className="text-xs text-surface-400">Ort. Yuzdelik</div>
          </div>
        </div>

        {/* Gecmis */}
        <div className="bg-white rounded-2xl border border-surface-100">
          <div className="px-6 py-4 border-b border-surface-50">
            <h2 className="text-lg font-bold text-surface-900">Deneme Gecmisi</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-surface-400">Yukleniyor...</div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="text-surface-500 mb-3">Henuz deneme cozmediniz</p>
              <Link
                href="/deneme-dunyasi"
                className="text-sm text-primary-600 hover:underline"
              >
                Ilk denemenizi cozun
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-surface-50">
              {results.map((result) => {
                const minutes = Math.floor(result.time_taken / 60)
                const date = result.completed_at
                  ? new Date(result.completed_at * 1000).toLocaleDateString('tr-TR')
                  : ''

                return (
                  <Link
                    key={result.id || result.result_id}
                    href={`/deneme-dunyasi/sonuc/${result.id || result.result_id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-surface-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-surface-800 truncate">
                        {result.exam_title || 'Deneme Sinavi'}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-surface-400 mt-1">
                        <span>{EXAM_TYPE_LABELS[result.exam_type] || result.exam_type}</span>
                        <span>{date}</span>
                        <span>{minutes} dk</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-surface-800">
                        {Number(result.score).toFixed(1)}
                      </div>
                      <div className="text-xs text-surface-400">
                        {Number(result.total_net).toFixed(1)} net / {result.rank}. sira
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
