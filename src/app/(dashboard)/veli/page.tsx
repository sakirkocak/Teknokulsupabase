'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useParentProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Users, 
  TrendingUp, 
  FileText, 
  ArrowRight,
  Target,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

export default function ParentDashboard() {
  const { profile, loading: profileLoading } = useProfile()
  const { parentProfile, loading: parentLoading } = useParentProfile(profile?.id || '')
  const [children, setChildren] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (parentProfile?.id) {
      loadChildren()
    }
  }, [parentProfile?.id])

  async function loadChildren() {
    // Bu tablonun oluşturulması gerekiyor - parent_students ilişkisi
    const { data } = await supabase
      .from('parent_students')
      .select(`
        *,
        student:student_id(
          id,
          user_id,
          grade,
          target_exam,
          profile:user_id(full_name, avatar_url)
        )
      `)
      .eq('parent_id', parentProfile?.id)

    if (data) {
      setChildren(data.map(d => d.student))
    }
  }

  const loading = profileLoading || parentLoading

  if (loading) {
    return (
      <DashboardLayout role="veli">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="veli">
      <div className="space-y-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white"
        >
          <h1 className="text-2xl font-bold mb-2">
            Hoş geldin, {profile?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-secondary-100">
            Çocuklarınızın gelişimini buradan takip edebilirsiniz.
          </p>
        </motion.div>

        {/* Children List */}
        <div className="card">
          <div className="p-6 border-b border-surface-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Çocuklarım</h2>
              <p className="text-sm text-surface-500">Kayıtlı öğrenciler</p>
            </div>
            <Link href="/veli/cocuklar/ekle" className="btn btn-primary btn-sm">
              Çocuk Ekle
            </Link>
          </div>
          <div className="divide-y divide-surface-100">
            {children.length > 0 ? children.map((child) => (
              <Link 
                key={child.id}
                href={`/veli/cocuklar/${child.id}`}
                className="p-6 flex items-center gap-4 hover:bg-surface-50 transition-colors"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center text-white text-lg font-medium">
                  {getInitials(child.profile?.full_name)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-surface-900">{child.profile?.full_name}</div>
                  <div className="text-sm text-surface-500">
                    {child.grade && `${child.grade}. Sınıf`}
                    {child.target_exam && ` • ${child.target_exam}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-secondary-500">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">İyi Gidiyor</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-surface-400" />
              </Link>
            )) : (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-surface-300" />
                <h3 className="text-lg font-medium text-surface-900 mb-2">Henüz çocuk eklenmemiş</h3>
                <p className="text-surface-500 mb-6">
                  Çocuğunuzun gelişimini takip etmek için hesabını ekleyin.
                </p>
                <Link href="/veli/cocuklar/ekle" className="btn btn-primary btn-md">
                  Çocuk Ekle
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

