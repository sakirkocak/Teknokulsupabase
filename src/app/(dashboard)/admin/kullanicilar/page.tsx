'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search,
  Filter,
  MoreVertical,
  Shield,
  UserCheck,
  BookOpen,
  Users2,
  Ban,
  CheckCircle,
  Mail
} from 'lucide-react'

export default function AdminUsersPage() {
  const { profile, loading: profileLoading } = useProfile()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setUsers(data)
    }
    setLoading(false)
  }

  const [updating, setUpdating] = useState(false)

  async function updateUserRole(userId: string, newRole: string, currentRole: string) {
    if (updating) return
    setUpdating(true)

    try {
      // 1. Ana profil tablosunu güncelle
      const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

      if (profileError) {
        console.error('Profil güncelleme hatası:', profileError)
        alert('Rol güncellenirken bir hata oluştu: ' + profileError.message)
        setUpdating(false)
        return
      }

      // 2. Eski role göre ilgili profili sil (opsiyonel - veri kaybı olabilir)
      // Şimdilik silmiyoruz, sadece yeni profil oluşturuyoruz

      // 3. Yeni role göre ilgili profil tablosuna ekle
      if (newRole === 'ogrenci') {
        // Öğrenci profili var mı kontrol et
        const { data: existing } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (!existing) {
          await supabase
            .from('student_profiles')
            .insert({ user_id: userId })
        }
      } else if (newRole === 'ogretmen') {
        // Öğretmen profili var mı kontrol et
        const { data: existing } = await supabase
          .from('teacher_profiles')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (!existing) {
          await supabase
            .from('teacher_profiles')
            .insert({ user_id: userId, is_coach: true })
        }
      } else if (newRole === 'veli') {
        // Veli profili var mı kontrol et
        const { data: existing } = await supabase
          .from('parent_profiles')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (!existing) {
          await supabase
            .from('parent_profiles')
            .insert({ user_id: userId })
        }
      }

      alert('Rol başarıyla güncellendi!')
      loadUsers()
      setSelectedUser(null)
    } catch (err: any) {
      console.error('Hata:', err)
      alert('Bir hata oluştu: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  async function toggleUserStatus(userId: string, isActive: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !isActive })
      .eq('id', userId)

    if (!error) {
      loadUsers()
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = !search || 
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const roleConfig: Record<string, { label: string; icon: any; color: string }> = {
    admin: { label: 'Admin', icon: Shield, color: 'bg-red-50 text-red-600' },
    ogretmen: { label: 'Öğretmen/Koç', icon: UserCheck, color: 'bg-primary-50 text-primary-600' },
    ogrenci: { label: 'Öğrenci', icon: BookOpen, color: 'bg-accent-50 text-accent-600' },
    veli: { label: 'Veli', icon: Users2, color: 'bg-purple-50 text-purple-600' },
  }

  if (profileLoading || loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Kullanıcı Yönetimi</h1>
          <p className="text-surface-500">Tüm kullanıcıları görüntüle ve yönet</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { label: 'Toplam', count: users.length, color: 'bg-surface-100' },
            { label: 'Öğretmen', count: users.filter(u => u.role === 'ogretmen').length, color: 'bg-primary-50' },
            { label: 'Öğrenci', count: users.filter(u => u.role === 'ogrenci').length, color: 'bg-accent-50' },
            { label: 'Veli', count: users.filter(u => u.role === 'veli').length, color: 'bg-purple-50' },
          ].map((stat, i) => (
            <div key={i} className={`card p-4 ${stat.color}`}>
              <div className="text-2xl font-bold text-surface-900">{stat.count}</div>
              <div className="text-sm text-surface-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim veya e-posta ara..."
              className="input pl-12"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="all">Tüm Roller</option>
            <option value="ogretmen">Öğretmen/Koç</option>
            <option value="ogrenci">Öğrenci</option>
            <option value="veli">Veli</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  <th className="text-left p-4 font-medium text-surface-600">Kullanıcı</th>
                  <th className="text-left p-4 font-medium text-surface-600">Rol</th>
                  <th className="text-left p-4 font-medium text-surface-600">Durum</th>
                  <th className="text-left p-4 font-medium text-surface-600">Kayıt Tarihi</th>
                  <th className="text-right p-4 font-medium text-surface-600">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredUsers.map((user) => {
                  const role = roleConfig[user.role] || roleConfig.ogrenci
                  const RoleIcon = role.icon

                  return (
                    <tr key={user.id} className="hover:bg-surface-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium overflow-hidden">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              getInitials(user.full_name)
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-surface-900">{user.full_name}</div>
                            <div className="text-sm text-surface-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${role.color}`}>
                          <RoleIcon className="w-3 h-3" />
                          {role.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_active !== false ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {user.is_active !== false ? (
                            <><CheckCircle className="w-3 h-3" /> Aktif</>
                          ) : (
                            <><Ban className="w-3 h-3" /> Pasif</>
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-surface-600">
                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="p-4 text-right">
                        <div className="relative inline-block">
                          <button 
                            onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                            className="p-2 hover:bg-surface-100 rounded-lg"
                          >
                            <MoreVertical className="w-5 h-5 text-surface-500" />
                          </button>
                          
                          {selectedUser?.id === user.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-surface-100 z-10 py-1">
                              <button
                                onClick={() => toggleUserStatus(user.id, user.is_active !== false)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-surface-50 flex items-center gap-2"
                              >
                                {user.is_active !== false ? (
                                  <><Ban className="w-4 h-4 text-red-500" /> Pasif Yap</>
                                ) : (
                                  <><CheckCircle className="w-4 h-4 text-green-500" /> Aktif Yap</>
                                )}
                              </button>
                              <div className="border-t border-surface-100 my-1" />
                              <div className="px-4 py-2 text-xs text-surface-400">Rol Değiştir</div>
                              {['ogretmen', 'ogrenci', 'veli', 'admin'].map(r => (
                                <button
                                  key={r}
                                  onClick={() => updateUserRole(user.id, r, user.role)}
                                  disabled={user.role === r || updating}
                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-surface-50 flex items-center gap-2 ${
                                    user.role === r ? 'text-surface-300' : ''
                                  } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {r === 'admin' && <Shield className="w-4 h-4 text-red-500" />}
                                  {roleConfig[r]?.label || r}
                                  {user.role === r && <CheckCircle className="w-3 h-3 ml-auto" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-surface-300" />
              <p className="text-surface-500">Kullanıcı bulunamadı</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

