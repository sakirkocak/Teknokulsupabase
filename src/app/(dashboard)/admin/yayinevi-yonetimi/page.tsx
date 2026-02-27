'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Plus, Coins, Building2, AlertCircle, Loader2, CheckCircle } from 'lucide-react'

interface Publisher {
  id: string
  full_name: string
  email: string
  balance: number
  purchased_count: number
  created_at: string
}

export default function YayineviYonetimPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [loading, setLoading] = useState(true)

  // Yeni yayınevi formu
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    password: '',
    initial_credits: 0,
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  // Kredi yükleme
  const [creditModal, setCreditModal] = useState<{ publisher: Publisher } | null>(null)
  const [creditAmount, setCreditAmount] = useState(10)
  const [creditLoading, setCreditLoading] = useState(false)
  const [creditError, setCreditError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    fetchPublishers()
  }, [])

  async function fetchPublishers() {
    setLoading(true)
    try {
      const res = await fetch('/api/publisher/admin')
      const data = await res.json()
      setPublishers(data.publishers || [])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!createForm.full_name || !createForm.email || !createForm.password) {
      setCreateError('Tüm alanlar zorunlu')
      return
    }
    setCreateLoading(true)
    setCreateError('')
    try {
      const res = await fetch('/api/publisher/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowCreate(false)
      setCreateForm({ full_name: '', email: '', password: '', initial_credits: 0 })
      setSuccessMsg('Yayınevi oluşturuldu')
      fetchPublishers()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Hata')
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleAddCredits() {
    if (!creditModal || creditAmount <= 0) return
    setCreditLoading(true)
    setCreditError('')
    try {
      const res = await fetch('/api/publisher/admin/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publisher_id: creditModal.publisher.id,
          amount: creditAmount,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCreditModal(null)
      setSuccessMsg(`${creditAmount} kredi yüklendi`)
      fetchPublishers()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (e) {
      setCreditError(e instanceof Error ? e.message : 'Hata')
    } finally {
      setCreditLoading(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Yayınevi Yönetimi</h1>
            <p className="text-surface-500 text-sm mt-1">{publishers.length} yayınevi</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Yayınevi
          </button>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        {/* Yayınevi Listesi */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : publishers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-surface-100 p-12 text-center">
            <Building2 className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500">Henüz yayınevi yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {publishers.map(pub => (
              <div key={pub.id} className="bg-white rounded-2xl border border-surface-100 p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-surface-900">{pub.full_name}</p>
                    <p className="text-sm text-surface-500">{pub.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">{pub.balance}</p>
                    <p className="text-xs text-surface-500">kredi</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-surface-700">{pub.purchased_count}</p>
                    <p className="text-xs text-surface-500">satın alınan</p>
                  </div>
                  <button
                    onClick={() => { setCreditModal({ publisher: pub }); setCreditAmount(10); setCreditError('') }}
                    className="flex items-center gap-2 border border-primary-200 text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Coins className="w-4 h-4" />
                    Kredi Yükle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Yeni Yayınevi Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-lg font-bold text-surface-900 mb-4">Yeni Yayınevi Oluştur</h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Yayınevi Adı</label>
                  <input
                    type="text"
                    value={createForm.full_name}
                    onChange={e => setCreateForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="ör. Milli Eğitim Yayınları"
                    className="w-full border border-surface-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-surface-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Şifre</label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full border border-surface-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Başlangıç Kredisi</label>
                  <input
                    type="number"
                    min={0}
                    value={createForm.initial_credits}
                    onChange={e => setCreateForm(f => ({ ...f, initial_credits: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-surface-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {createError && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {createError}
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border border-surface-200 text-surface-600 py-2 rounded-xl text-sm"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createLoading}
                  className="flex-1 bg-primary-500 text-white py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kredi Yükleme Modal */}
        {creditModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h2 className="text-lg font-bold text-surface-900 mb-1">Kredi Yükle</h2>
              <p className="text-sm text-surface-500 mb-4">{creditModal.publisher.full_name}</p>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Kredi Miktarı</label>
                <input
                  type="number"
                  min={1}
                  value={creditAmount}
                  onChange={e => setCreditAmount(parseInt(e.target.value) || 1)}
                  className="w-full border border-surface-200 rounded-xl px-3 py-2"
                />
              </div>

              <p className="text-sm text-surface-500 mt-2">
                Mevcut bakiye: <strong>{creditModal.publisher.balance}</strong> →
                Yeni bakiye: <strong>{creditModal.publisher.balance + creditAmount}</strong>
              </p>

              {creditError && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{creditError}</div>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => setCreditModal(null)} className="flex-1 border border-surface-200 text-surface-600 py-2 rounded-xl text-sm">
                  İptal
                </button>
                <button
                  onClick={handleAddCredits}
                  disabled={creditLoading}
                  className="flex-1 bg-primary-500 text-white py-2 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creditLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                  Yükle
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
