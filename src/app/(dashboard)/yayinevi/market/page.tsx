'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Coins, Search, Brain, Filter, X, CheckCircle,
  AlertCircle, Loader2, ImageIcon, Sparkles, ChevronDown, Zap
} from 'lucide-react'

interface MarketQuestion {
  id: string
  question_text: string
  subject: string
  topic: string
  difficulty: string
  exam_type?: string
  image_type?: string
  bloom_level?: string
  learning_outcome?: string
  price_credits: number
  verified?: boolean
  created_at: number
}

const DIFFICULTY_CFG: Record<string, { label: string; cls: string }> = {
  easy: { label: 'Kolay', cls: 'bg-green-100 text-green-700' },
  medium: { label: 'Orta', cls: 'bg-yellow-100 text-yellow-700' },
  hard: { label: 'Zor', cls: 'bg-orange-100 text-orange-700' },
  legendary: { label: 'Efsane', cls: 'bg-red-100 text-red-700' },
  kolay: { label: 'Kolay', cls: 'bg-green-100 text-green-700' },
  orta: { label: 'Orta', cls: 'bg-yellow-100 text-yellow-700' },
  zor: { label: 'Zor', cls: 'bg-orange-100 text-orange-700' },
}

const SUBJECTS = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Edebiyat',
  'Tarih', 'Coğrafya', 'Geometri', 'Felsefe', 'Sosyal Bilgiler',
  'Fen Bilimleri', 'İngilizce', 'Din Kültürü']
const EXAM_TYPES = ['TYT', 'AYT', 'LGS', 'KPSS', 'KPSS_ONLISANS', 'KPSS_ORTAOGRETIM', 'DGS', 'ALES', 'YDS']
const IMAGE_TYPES = [
  { value: 'all', label: 'Tüm Tipler' },
  { value: 'with_image', label: 'Görselli' },
  { value: 'no_image', label: 'Görselsiz' },
  { value: 'geometry_shape', label: '🔺 Geometrik Şekil' },
  { value: '3d_solid', label: '🧊 3D Cisim' },
  { value: 'coordinate_graph', label: '📈 Koordinat' },
  { value: 'data_graph', label: '🥧 Veri Grafiği' },
  { value: 'physics_experiment', label: '⚡ Fizik Düzeneği' },
  { value: 'biology_diagram', label: '🧬 Biyoloji' },
  { value: 'chemistry_schema', label: '⚗️ Kimya' },
  { value: 'geography_map', label: '🗺️ Coğrafya/Tarih' },
  { value: 'logic_table', label: '📊 Veri Tablosu' },
]

export default function MarketPage() {
  const [questions, setQuestions] = useState<MarketQuestion[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState(0)
  const [facets, setFacets] = useState<Record<string, { value: string; count: number }[]>>({})

  // Arama
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'keyword' | 'semantic'>('keyword')
  const [semanticLoading, setSemanticLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Filtreler
  const [filters, setFilters] = useState({
    subject: '', difficulty: '', exam_type: '', image_type: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Satın alma
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [purchased, setPurchased] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Debounce query
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 400)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  // Bakiye yükle
  useEffect(() => {
    fetch('/api/publisher/credits').then(r => r.json()).then(d => setBalance(d.balance || 0))
  }, [successMsg])

  // Arama
  const doSearch = useCallback(async (p = 1, semantic = false) => {
    setLoading(true)
    setError('')
    if (semantic) setSemanticLoading(true)

    try {
      const params = new URLSearchParams({
        q: debouncedQuery || '*',
        semantic: String(semantic),
        page: String(p),
        per_page: '24',
        ...(filters.subject && { subject: filters.subject }),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.exam_type && { exam_type: filters.exam_type }),
        ...(filters.image_type && filters.image_type !== 'all' && { image_type: filters.image_type }),
      })

      const res = await fetch(`/api/publisher/search?${params}`)
      const data = await res.json()

      setQuestions(data.hits || [])
      setTotal(data.total || 0)
      setPage(p)

      if (data.facets) {
        const facetMap: Record<string, { value: string; count: number }[]> = {}
        for (const f of data.facets) {
          facetMap[f.field_name] = f.counts?.map((c: { value: string; count: number }) => ({
            value: c.value, count: c.count
          })) || []
        }
        setFacets(facetMap)
      }
    } catch (e) {
      setError('Arama sırasında hata oluştu')
    } finally {
      setLoading(false)
      setSemanticLoading(false)
    }
  }, [debouncedQuery, filters])

  useEffect(() => { doSearch(1, false) }, [debouncedQuery, filters, doSearch])

  async function handlePurchase(q: MarketQuestion) {
    if (balance < q.price_credits) {
      setError('Yetersiz kredi. Admin ile iletişime geçin.')
      return
    }
    setPurchasing(q.id); setError(''); setSuccessMsg('')
    try {
      const res = await fetch('/api/publisher/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: q.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPurchased(prev => new Set(Array.from(prev).concat(q.id)))
      setBalance(data.new_balance)
      setSuccessMsg(`"${q.topic}" konusundan soru satın alındı!`)
      setQuestions(prev => prev.filter(item => item.id !== q.id))
      setTotal(t => t - 1)
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Satın alma hatası')
    } finally {
      setPurchasing(null)
    }
  }

  const totalPages = Math.ceil(total / 24)
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Soru Marketi</h1>
          <p className="text-surface-500 text-sm mt-1">{total} soru müsait</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <Coins className="w-5 h-5 text-amber-500" />
          <span className="text-xl font-bold text-amber-700">{balance}</span>
          <span className="text-sm text-amber-600">kredi</span>
        </div>
      </div>

      {/* Bildirimler */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
            <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />{successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Arama */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-sm p-4 mb-4">
        {/* Arama bar */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Soru ara... (konu, ders, kazanım)"
              className="w-full pl-9 pr-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {query && (
              <button onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Semantik arama butonu */}
          <button
            onClick={() => { setSearchMode('semantic'); doSearch(1, true) }}
            disabled={!query || semanticLoading}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
              semanticLoading
                ? 'bg-violet-100 text-violet-500'
                : 'bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-40'
            }`}
            title="AI ile anlamsal arama (RAG)"
          >
            {semanticLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            <span className="hidden sm:inline">Anlam Araması</span>
          </button>

          {/* Filtre toggle */}
          <button onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 border transition-all ${
              activeFilterCount > 0 ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-surface-200 text-surface-600 hover:bg-surface-50'
            }`}>
            <Filter className="w-4 h-4" />
            Filtrele
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-primary-500 text-white rounded-full text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Arama modu göstergesi */}
        {searchMode === 'semantic' && !semanticLoading && (
          <div className="flex items-center gap-2 text-xs text-violet-600 bg-violet-50 rounded-lg px-3 py-1.5 mb-3">
            <Sparkles className="w-3 h-3" />
            Semantik arama aktif — anlamsal benzerlik ile sıralandı
            <button onClick={() => { setSearchMode('keyword'); doSearch(1, false) }}
              className="ml-auto underline hover:no-underline">Keyword'e dön</button>
          </div>
        )}

        {/* Filtreler */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="pt-3 border-t border-surface-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-surface-600 block mb-1">Ders</label>
                  <select value={filters.subject} onChange={e => setFilters(f => ({ ...f, subject: e.target.value }))}
                    className="w-full border border-surface-200 rounded-xl px-3 py-2 text-sm">
                    <option value="">Tümü</option>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-surface-600 block mb-1">Zorluk</label>
                  <select value={filters.difficulty} onChange={e => setFilters(f => ({ ...f, difficulty: e.target.value }))}
                    className="w-full border border-surface-200 rounded-xl px-3 py-2 text-sm">
                    <option value="">Tümü</option>
                    <option value="easy">Kolay</option>
                    <option value="medium">Orta</option>
                    <option value="hard">Zor</option>
                    <option value="legendary">Efsane</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-surface-600 block mb-1">Sınav</label>
                  <select value={filters.exam_type} onChange={e => setFilters(f => ({ ...f, exam_type: e.target.value }))}
                    className="w-full border border-surface-200 rounded-xl px-3 py-2 text-sm">
                    <option value="">Tümü</option>
                    {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-surface-600 block mb-1">Görsel Tipi</label>
                  <select value={filters.image_type} onChange={e => setFilters(f => ({ ...f, image_type: e.target.value }))}
                    className="w-full border border-surface-200 rounded-xl px-3 py-2 text-sm">
                    {IMAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={() => setFilters({ subject: '', difficulty: '', exam_type: '', image_type: '' })}
                  className="mt-2 text-xs text-red-500 hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" /> Filtreleri temizle
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Facet özeti */}
        {facets.subject && facets.subject.length > 0 && !filters.subject && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-surface-50">
            {facets.subject.slice(0, 6).map(f => (
              <button key={f.value} onClick={() => setFilters(prev => ({ ...prev, subject: f.value }))}
                className="text-xs px-2.5 py-1 bg-surface-100 text-surface-600 rounded-full hover:bg-primary-50 hover:text-primary-700 transition-colors">
                {f.value} <span className="opacity-60">({f.count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Soru Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-surface-100 p-5 animate-pulse">
              <div className="h-4 bg-surface-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-surface-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-surface-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-100 p-16 text-center">
          <ShoppingBag className="w-14 h-14 text-surface-200 mx-auto mb-4" />
          <p className="text-surface-600 font-medium mb-1">Soru bulunamadı</p>
          <p className="text-surface-400 text-sm">Filtrelerinizi değiştirmeyi deneyin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {questions.map((q, idx) => (
              <motion.div key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white rounded-2xl border border-surface-100 shadow-sm hover:shadow-md hover:border-primary-100 transition-all flex flex-col">
                <div className="p-5 flex-1">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg font-medium">
                      {q.subject}
                    </span>
                    {q.exam_type && (
                      <span className="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-lg">
                        {q.exam_type}
                      </span>
                    )}
                    {q.difficulty && (
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${DIFFICULTY_CFG[q.difficulty]?.cls || 'bg-surface-100 text-surface-600'}`}>
                        {DIFFICULTY_CFG[q.difficulty]?.label || q.difficulty}
                      </span>
                    )}
                    {q.image_type && q.image_type !== 'none' && (
                      <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                        <ImageIcon className="w-2.5 h-2.5" /> Görsel
                      </span>
                    )}
                    {q.verified && (
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" /> Doğrulandı
                      </span>
                    )}
                  </div>

                  {/* Konu */}
                  <p className="text-sm font-semibold text-surface-700 mb-2">{q.topic}</p>

                  {/* Kazanım */}
                  {q.learning_outcome && (
                    <p className="text-xs text-surface-500 mb-2 line-clamp-1 italic">
                      📋 {q.learning_outcome}
                    </p>
                  )}

                  {/* Bulanık soru önizlemesi */}
                  <div className="relative mb-2">
                    <p className="text-xs text-surface-600 line-clamp-3 blur-[3px] select-none leading-relaxed">
                      {q.question_text}
                    </p>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs bg-surface-900/60 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                        Satın al → görüntüle
                      </span>
                    </div>
                  </div>
                </div>

                {/* Satın al */}
                <div className="px-5 pb-5">
                  <button
                    onClick={() => handlePurchase(q)}
                    disabled={purchasing === q.id || purchased.has(q.id)}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      purchased.has(q.id)
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : purchasing === q.id
                          ? 'bg-primary-100 text-primary-600 cursor-wait'
                          : 'bg-primary-500 hover:bg-primary-600 text-white hover:shadow-md'
                    }`}
                  >
                    {purchased.has(q.id) ? (
                      <><CheckCircle className="w-4 h-4" /> Satın Alındı</>
                    ) : purchasing === q.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> İşleniyor...</>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        Satın Al
                        <span className="flex items-center gap-0.5 bg-primary-400/30 px-2 py-0.5 rounded-lg">
                          <Coins className="w-3 h-3" />{q.price_credits}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button onClick={() => doSearch(page - 1)} disabled={page === 1}
            className="px-4 py-2 border border-surface-200 rounded-xl text-sm disabled:opacity-40 hover:bg-surface-50">
            ← Önceki
          </button>
          <span className="px-4 py-2 text-sm text-surface-500">{page} / {totalPages}</span>
          <button onClick={() => doSearch(page + 1)} disabled={page === totalPages}
            className="px-4 py-2 border border-surface-200 rounded-xl text-sm disabled:opacity-40 hover:bg-surface-50">
            Sonraki →
          </button>
        </div>
      )}
    </div>
  )
}
