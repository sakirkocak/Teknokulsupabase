'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/hooks/useProfile'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Download,
  ShoppingCart,
  FileText,
  Video,
  Image as ImageIcon,
  CheckCircle,
  Star,
  User,
  Calendar,
  GraduationCap,
  Loader2
} from 'lucide-react'

export default function MaterialDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useProfile()
  const [material, setMaterial] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [purchased, setPurchased] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadMaterial()
    }
  }, [params.id])

  useEffect(() => {
    if (profile?.id && material?.id) {
      checkPurchase()
    }
  }, [profile?.id, material?.id])

  async function loadMaterial() {
    setLoading(true)

    const { data } = await supabase
      .from('materials')
      .select(`
        *,
        teacher:teacher_profiles!materials_teacher_id_fkey(
          id,
          user_id,
          profile:profiles!teacher_profiles_user_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq('id', params.id)
      .single()

    if (data) {
      setMaterial(data)
    }

    setLoading(false)
  }

  async function checkPurchase() {
    const { data } = await supabase
      .from('material_purchases')
      .select('id')
      .eq('material_id', material.id)
      .eq('buyer_id', profile?.id)
      .single()

    if (data) {
      setPurchased(true)
    }
  }

  async function handlePurchase() {
    if (!profile) {
      router.push('/giris')
      return
    }

    setPurchasing(true)

    // Ücretsiz materyal ise doğrudan satın al
    if (material.price === 0 || !material.price) {
      const { error } = await supabase
        .from('material_purchases')
        .insert({
          material_id: material.id,
          buyer_id: profile.id,
          seller_id: material.teacher?.profile?.id,
          amount: 0,
        })

      if (!error) {
        // İndirme sayısını artır
        await supabase
          .from('materials')
          .update({ downloads: (material.downloads || 0) + 1 })
          .eq('id', material.id)

        setPurchased(true)
      }
    } else {
      // Ücretli materyal - şimdilik simüle et
      alert('Ödeme sistemi yakında aktif olacak!')
    }

    setPurchasing(false)
  }

  async function handleDownload() {
    if (material.file_url) {
      window.open(material.file_url, '_blank')
    } else {
      alert('Dosya henüz yüklenmemiş.')
    }
  }

  const typeIcons: Record<string, any> = {
    pdf: FileText,
    video: Video,
    image: ImageIcon,
    document: FileText,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!material) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-surface-900 mb-2">Materyal bulunamadı</h2>
          <Link href="/materyaller" className="text-primary-500">
            Materyallere dön
          </Link>
        </div>
      </div>
    )
  }

  const TypeIcon = typeIcons[material.type] || FileText
  const isOwner = profile?.id === material.teacher?.profile?.id
  const canDownload = purchased || isOwner || material.price === 0

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-surface-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <img 
                src="/images/logo.png" 
                alt="Teknokul - Eğitimin Dijital Üssü" 
                className="h-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                  const fallback = document.getElementById('materyal-detay-logo-fallback')
                  if (fallback) fallback.style.display = 'flex'
                }}
              />
              <div id="materyal-detay-logo-fallback" className="hidden items-center gap-2">
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link href="/materyaller" className="inline-flex items-center gap-2 text-surface-600 hover:text-primary-500 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Materyallere Dön
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card overflow-hidden"
            >
              <div className="h-64 bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                {material.preview_url ? (
                  <img 
                    src={material.preview_url} 
                    alt={material.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <TypeIcon className="w-24 h-24 text-primary-300" />
                )}
              </div>
            </motion.div>

            {/* Details */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-primary-50 text-primary-600 text-sm font-medium rounded-full">
                  {material.category || 'Genel'}
                </span>
                <span className="px-3 py-1 bg-surface-100 text-surface-600 text-sm font-medium rounded-full capitalize">
                  {material.type || 'PDF'}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-surface-900 mb-4">{material.title}</h1>
              
              <p className="text-surface-600 leading-relaxed">{material.description}</p>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-6 pt-6 border-t border-surface-100">
                <div className="flex items-center gap-2 text-surface-500">
                  <Download className="w-5 h-5" />
                  <span>{material.downloads || 0} indirme</span>
                </div>
                <div className="flex items-center gap-2 text-surface-500">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date(material.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-primary-600 mb-1">
                  {material.price > 0 ? `₺${material.price}` : 'Ücretsiz'}
                </div>
                {material.price > 0 && (
                  <p className="text-sm text-surface-500">Tek seferlik ödeme</p>
                )}
              </div>

              {canDownload ? (
                <button
                  onClick={handleDownload}
                  className="btn btn-primary btn-lg w-full"
                >
                  <Download className="w-5 h-5" />
                  İndir
                </button>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="btn btn-primary btn-lg w-full"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      İşleniyor...
                    </>
                  ) : material.price > 0 ? (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Satın Al
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Ücretsiz İndir
                    </>
                  )}
                </button>
              )}

              {purchased && (
                <div className="flex items-center justify-center gap-2 mt-4 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Satın alındı</span>
                </div>
              )}
            </motion.div>

            {/* Teacher Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <h3 className="font-semibold text-surface-900 mb-4">Öğretmen</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-medium overflow-hidden">
                  {material.teacher?.profile?.avatar_url ? (
                    <img src={material.teacher.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(material.teacher?.profile?.full_name)
                  )}
                </div>
                <div>
                  <div className="font-medium text-surface-900">
                    {material.teacher?.profile?.full_name || 'Anonim'}
                  </div>
                  <div className="text-sm text-surface-500">Eğitmen</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

