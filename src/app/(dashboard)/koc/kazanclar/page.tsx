'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Download,
  BookOpen,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

export default function CoachEarningsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { teacherProfile, loading: teacherLoading } = useTeacherProfile(profile?.id || '')
  const [earnings, setEarnings] = useState({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    pending: 0,
  })
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadEarnings()
    }
  }, [teacherProfile?.id])

  async function loadEarnings() {
    setLoading(true)

    // Materyallerden kazanç
    const { data: materials } = await supabase
      .from('materials')
      .select('id, title, price, downloads')
      .eq('teacher_id', teacherProfile?.id)

    if (materials) {
      const total = materials.reduce((acc, m) => acc + ((m.downloads || 0) * (m.price || 0)), 0)
      
      // Basit hesaplama (gerçek projede transaction tablosundan çekilir)
      setEarnings({
        total,
        thisMonth: total * 0.4, // Simüle
        lastMonth: total * 0.3,
        pending: total * 0.1,
      })

      // Son satışlar (simüle - gerçekte material_purchases'dan çekilir)
      const recentTransactions = materials
        .filter(m => m.downloads && m.downloads > 0)
        .slice(0, 10)
        .map(m => ({
          id: m.id,
          type: 'sale',
          title: m.title,
          amount: m.price,
          count: m.downloads,
          date: new Date().toISOString(),
        }))

      setTransactions(recentTransactions)
    }

    setLoading(false)
  }

  const pageLoading = profileLoading || teacherLoading || loading

  if (pageLoading) {
    return (
      <DashboardLayout role="koc">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  const monthChange = earnings.lastMonth > 0 
    ? ((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth * 100).toFixed(0)
    : 0

  return (
    <DashboardLayout role="koc">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Kazançlarım</h1>
          <p className="text-surface-500">Materyal satışlarından elde edilen kazançlar</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-surface-900">₺{earnings.total.toFixed(2)}</div>
            <div className="text-sm text-surface-500">Toplam Kazanç</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              {Number(monthChange) > 0 ? (
                <span className="flex items-center text-green-500 text-sm font-medium">
                  <ArrowUp className="w-4 h-4" />
                  {monthChange}%
                </span>
              ) : Number(monthChange) < 0 ? (
                <span className="flex items-center text-red-500 text-sm font-medium">
                  <ArrowDown className="w-4 h-4" />
                  {Math.abs(Number(monthChange))}%
                </span>
              ) : null}
            </div>
            <div className="text-2xl font-bold text-surface-900">₺{earnings.thisMonth.toFixed(2)}</div>
            <div className="text-sm text-surface-500">Bu Ay</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-surface-900">₺{earnings.lastMonth.toFixed(2)}</div>
            <div className="text-sm text-surface-500">Geçen Ay</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-surface-900">₺{earnings.pending.toFixed(2)}</div>
            <div className="text-sm text-surface-500">Bekleyen Ödeme</div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="card">
            <div className="p-6 border-b border-surface-100">
              <h2 className="text-lg font-semibold text-surface-900">Son Satışlar</h2>
            </div>
            <div className="divide-y divide-surface-100">
              {transactions.length > 0 ? transactions.map((tx, i) => (
                <div key={tx.id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-surface-900">{tx.title}</div>
                    <div className="text-sm text-surface-500">{tx.count} satış</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">+₺{(tx.amount * tx.count).toFixed(2)}</div>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                  <p className="text-surface-500">Henüz satış yok</p>
                </div>
              )}
            </div>
          </div>

          {/* Payout Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-surface-900 mb-6">Ödeme Bilgileri</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-surface-50 rounded-xl">
                <div className="text-sm text-surface-500 mb-1">Komisyon Oranı</div>
                <div className="text-xl font-bold text-surface-900">%10</div>
                <p className="text-xs text-surface-500 mt-1">Her satıştan platform komisyonu kesilir</p>
              </div>

              <div className="p-4 bg-surface-50 rounded-xl">
                <div className="text-sm text-surface-500 mb-1">Minimum Çekim</div>
                <div className="text-xl font-bold text-surface-900">₺100</div>
                <p className="text-xs text-surface-500 mt-1">Minimum bakiye ile para çekebilirsiniz</p>
              </div>

              <div className="p-4 bg-surface-50 rounded-xl">
                <div className="text-sm text-surface-500 mb-1">Ödeme Periyodu</div>
                <div className="text-xl font-bold text-surface-900">Haftalık</div>
                <p className="text-xs text-surface-500 mt-1">Her Cuma hesabınıza aktarılır</p>
              </div>
            </div>

            <button className="btn btn-primary btn-lg w-full mt-6" disabled={earnings.pending < 100}>
              <Download className="w-5 h-5" />
              Para Çek (₺{earnings.pending.toFixed(2)})
            </button>
            {earnings.pending < 100 && (
              <p className="text-xs text-center text-surface-500 mt-2">
                Minimum ₺100 bakiye gerekli
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

