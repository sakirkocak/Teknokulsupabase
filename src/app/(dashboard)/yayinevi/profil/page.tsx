'use client'

import { useState, useEffect } from 'react'
import { Building2, Mail, Shield, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function YayineviProfilPage() {
  const [profile, setProfile] = useState<{ full_name: string; email: string; created_at: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('profiles')
          .select('full_name, email, created_at')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setProfile(data)
            setLoading(false)
          })
      }
    })
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex justify-center pt-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-surface-900 mb-6">Profil</h1>

      <div className="bg-white rounded-2xl border border-surface-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-surface-900">{profile?.full_name}</p>
            <p className="text-sm text-surface-500">Yayınevi Hesabı</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
            <Mail className="w-5 h-5 text-surface-400" />
            <div>
              <p className="text-xs text-surface-500">E-posta</p>
              <p className="text-sm font-medium text-surface-900">{profile?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
            <Shield className="w-5 h-5 text-surface-400" />
            <div>
              <p className="text-xs text-surface-500">Hesap Türü</p>
              <p className="text-sm font-medium text-surface-900">Kurumsal Yayınevi</p>
            </div>
          </div>

          {profile?.created_at && (
            <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
              <Building2 className="w-5 h-5 text-surface-400" />
              <div>
                <p className="text-xs text-surface-500">Üyelik Tarihi</p>
                <p className="text-sm font-medium text-surface-900">
                  {new Date(profile.created_at).toLocaleDateString('tr-TR', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-xl">
          <p className="text-sm text-amber-700">
            Profil bilgilerinizi güncellemek veya şifrenizi değiştirmek için Teknokul yöneticisiyle iletişime geçin.
          </p>
        </div>
      </div>
    </div>
  )
}
