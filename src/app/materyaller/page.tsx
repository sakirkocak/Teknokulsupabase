'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  BookOpen,
  Search,
  Filter,
  Star,
  Download,
  ShoppingCart,
  FileText,
  Video,
  Image as ImageIcon,
  ChevronRight,
  GraduationCap
} from 'lucide-react'

export default function MaterialsPage() {
  const { profile } = useProfile()
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    loadMaterials()
  }, [])

  async function loadMaterials() {
    setLoading(true)

    const { data } = await supabase
      .from('materials')
      .select(`
        *,
        teacher:teacher_profiles!materials_teacher_id_fkey(
          profile:profiles!teacher_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (data) {
      setMaterials(data)
    }

    setLoading(false)
  }

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = !search || 
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter
    const matchesType = typeFilter === 'all' || m.type === typeFilter
    return matchesSearch && matchesCategory && matchesType
  })

  const categories = Array.from(new Set(materials.map(m => m.category).filter(Boolean)))
  const types = Array.from(new Set(materials.map(m => m.type).filter(Boolean)))

  const typeIcons: Record<string, any> = {
    pdf: FileText,
    video: Video,
    image: ImageIcon,
    document: FileText,
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-surface-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <img 
                src="/images/logo.png" 
                alt="Teknokul" 
                className="h-10 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                  const fallback = document.getElementById('materyaller-logo-fallback')
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              <div id="materyaller-logo-fallback" className="hidden items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">
                  Tekn<span className="text-primary-500">okul</span>
                </span>
              </div>
            </Link>
            
            {profile ? (
              <Link 
                href={`/${profile.role === 'ogretmen' ? 'koc' : profile.role}`}
                className="btn btn-primary btn-sm"
              >
                Dashboard
              </Link>
            ) : (
              <Link href="/giris" className="btn btn-primary btn-sm">
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Materyal Marketi</h1>
          <p className="text-surface-600">Öğretmenler tarafından hazırlanan eğitim materyalleri</p>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Materyal ara..."
                className="input pl-12"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input w-full sm:w-40"
            >
              <option value="all">Tüm Kategoriler</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-full sm:w-40"
            >
              <option value="all">Tüm Türler</option>
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Materials Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredMaterials.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMaterials.map((material, index) => {
              const TypeIcon = typeIcons[material.type] || FileText

              return (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/materyaller/${material.id}`}>
                    <div className="card group hover:shadow-xl transition-all duration-300 overflow-hidden">
                      {/* Preview */}
                      <div className="h-40 bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                        {material.preview_url ? (
                          <img 
                            src={material.preview_url} 
                            alt={material.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <TypeIcon className="w-16 h-16 text-primary-300" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs font-medium rounded-full">
                            {material.category || 'Genel'}
                          </span>
                          <span className="px-2 py-0.5 bg-surface-100 text-surface-600 text-xs font-medium rounded-full capitalize">
                            {material.type || 'PDF'}
                          </span>
                        </div>

                        <h3 className="font-semibold text-surface-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
                          {material.title}
                        </h3>

                        <p className="text-sm text-surface-500 line-clamp-2 mb-3">
                          {material.description}
                        </p>

                        {/* Teacher */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-medium text-primary-600 overflow-hidden">
                            {material.teacher?.profile?.avatar_url ? (
                              <img src={material.teacher.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              getInitials(material.teacher?.profile?.full_name)
                            )}
                          </div>
                          <span className="text-sm text-surface-600">
                            {material.teacher?.profile?.full_name || 'Anonim'}
                          </span>
                        </div>

                        {/* Price & Stats */}
                        <div className="flex items-center justify-between pt-3 border-t border-surface-100">
                          <div className="flex items-center gap-3 text-sm text-surface-500">
                            <span className="flex items-center gap-1">
                              <Download className="w-4 h-4" />
                              {material.downloads || 0}
                            </span>
                          </div>
                          <div className="text-lg font-bold text-primary-600">
                            {material.price > 0 ? `₺${material.price}` : 'Ücretsiz'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-surface-300" />
            <h3 className="text-lg font-medium text-surface-900 mb-2">Materyal bulunamadı</h3>
            <p className="text-surface-500">
              {search || categoryFilter !== 'all' || typeFilter !== 'all'
                ? 'Filtreleri değiştirmeyi deneyin.'
                : 'Henüz materyal yüklenmemiş.'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

