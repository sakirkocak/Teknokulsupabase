'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useTeacherProfile } from '@/hooks/useProfile'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  DollarSign,
  FileText,
  MoreVertical,
  ExternalLink
} from 'lucide-react'

export default function CoachMaterialsPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { teacherProfile, loading: teacherLoading } = useTeacherProfile(profile?.id || '')
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    type: 'pdf',
    price: 0,
    file_url: '',
    preview_url: '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (teacherProfile?.id) {
      loadMaterials()
    }
  }, [teacherProfile?.id])

  async function loadMaterials() {
    setLoading(true)

    const { data } = await supabase
      .from('materials')
      .select('*')
      .eq('teacher_id', teacherProfile?.id)
      .order('created_at', { ascending: false })

    if (data) {
      setMaterials(data)
    }

    setLoading(false)
  }

  function openModal(material?: any) {
    if (material) {
      setEditingMaterial(material)
      setFormData({
        title: material.title || '',
        description: material.description || '',
        category: material.category || '',
        type: material.type || 'pdf',
        price: material.price || 0,
        file_url: material.file_url || '',
        preview_url: material.preview_url || '',
      })
    } else {
      setEditingMaterial(null)
      setFormData({
        title: '',
        description: '',
        category: '',
        type: 'pdf',
        price: 0,
        file_url: '',
        preview_url: '',
      })
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    if (editingMaterial) {
      // Güncelle
      const { error } = await supabase
        .from('materials')
        .update(formData)
        .eq('id', editingMaterial.id)

      if (!error) {
        setShowModal(false)
        loadMaterials()
      }
    } else {
      // Yeni ekle
      const { error } = await supabase
        .from('materials')
        .insert({
          ...formData,
          teacher_id: teacherProfile?.id,
          is_active: true,
        })

      if (!error) {
        setShowModal(false)
        loadMaterials()
      }
    }

    setSaving(false)
  }

  async function deleteMaterial(id: string) {
    if (!confirm('Bu materyali silmek istediğinize emin misiniz?')) return

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id)

    if (!error) {
      setMaterials(prev => prev.filter(m => m.id !== id))
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    const { error } = await supabase
      .from('materials')
      .update({ is_active: !isActive })
      .eq('id', id)

    if (!error) {
      loadMaterials()
    }
  }

  const totalEarnings = materials.reduce((acc, m) => acc + ((m.downloads || 0) * (m.price || 0)), 0)
  const totalDownloads = materials.reduce((acc, m) => acc + (m.downloads || 0), 0)

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

  return (
    <DashboardLayout role="koc">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Materyallerim</h1>
            <p className="text-surface-500">Eğitim materyallerini yönet ve sat</p>
          </div>
          <button onClick={() => openModal()} className="btn btn-primary btn-md">
            <Plus className="w-5 h-5" />
            Yeni Materyal
          </button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <div className="text-xl font-bold text-surface-900">{materials.length}</div>
                <div className="text-sm text-surface-500">Materyal</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary-50 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-secondary-500" />
              </div>
              <div>
                <div className="text-xl font-bold text-surface-900">{totalDownloads}</div>
                <div className="text-sm text-surface-500">İndirme</div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent-500" />
              </div>
              <div>
                <div className="text-xl font-bold text-surface-900">₺{totalEarnings}</div>
                <div className="text-sm text-surface-500">Kazanç</div>
              </div>
            </div>
          </div>
        </div>

        {/* Materials List */}
        <div className="card overflow-hidden">
          {materials.length > 0 ? (
            <table className="w-full">
              <thead className="bg-surface-50 border-b border-surface-100">
                <tr>
                  <th className="text-left p-4 font-medium text-surface-600">Materyal</th>
                  <th className="text-left p-4 font-medium text-surface-600">Kategori</th>
                  <th className="text-left p-4 font-medium text-surface-600">Fiyat</th>
                  <th className="text-left p-4 font-medium text-surface-600">İndirme</th>
                  <th className="text-left p-4 font-medium text-surface-600">Durum</th>
                  <th className="text-right p-4 font-medium text-surface-600">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {materials.map((material) => (
                  <tr key={material.id} className="hover:bg-surface-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary-500" />
                        </div>
                        <div>
                          <div className="font-medium text-surface-900">{material.title}</div>
                          <div className="text-sm text-surface-500 capitalize">{material.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-surface-600">{material.category || '-'}</td>
                    <td className="p-4">
                      <span className="font-medium text-primary-600">
                        {material.price > 0 ? `₺${material.price}` : 'Ücretsiz'}
                      </span>
                    </td>
                    <td className="p-4 text-surface-600">{material.downloads || 0}</td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleActive(material.id, material.is_active)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          material.is_active 
                            ? 'bg-green-50 text-green-600' 
                            : 'bg-surface-100 text-surface-500'
                        }`}
                      >
                        {material.is_active ? 'Aktif' : 'Pasif'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/materyaller/${material.id}`}
                          target="_blank"
                          className="p-2 hover:bg-surface-100 rounded-lg"
                        >
                          <ExternalLink className="w-4 h-4 text-surface-500" />
                        </Link>
                        <button
                          onClick={() => openModal(material)}
                          className="p-2 hover:bg-surface-100 rounded-lg"
                        >
                          <Edit className="w-4 h-4 text-surface-500" />
                        </button>
                        <button
                          onClick={() => deleteMaterial(material.id)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-surface-300" />
              <h3 className="text-lg font-medium text-surface-900 mb-2">Henüz materyal yok</h3>
              <p className="text-surface-500 mb-6">İlk materyalinizi yükleyin ve satmaya başlayın.</p>
              <button onClick={() => openModal()} className="btn btn-primary btn-md">
                <Plus className="w-5 h-5" />
                Materyal Ekle
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-surface-900 mb-6">
                {editingMaterial ? 'Materyal Düzenle' : 'Yeni Materyal'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Başlık</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Açıklama</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Kategori</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input"
                      placeholder="Örn: Matematik"
                    />
                  </div>
                  <div>
                    <label className="label">Tür</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="input"
                    >
                      <option value="pdf">PDF</option>
                      <option value="video">Video</option>
                      <option value="document">Doküman</option>
                      <option value="image">Görsel</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Fiyat (₺)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="input"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-surface-500 mt-1">0 girerseniz ücretsiz olur</p>
                </div>

                <div>
                  <label className="label">Dosya URL</label>
                  <input
                    type="url"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    className="input"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="label">Önizleme Görseli URL</label>
                  <input
                    type="url"
                    value={formData.preview_url}
                    onChange={(e) => setFormData({ ...formData, preview_url: e.target.value })}
                    className="input"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-ghost btn-md flex-1"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary btn-md flex-1"
                  >
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

