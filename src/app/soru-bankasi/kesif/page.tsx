import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import Link from 'next/link'
import { 
  Search, 
  Download, 
  Eye, 
  BookOpen, 
  Filter,
  GraduationCap,
  Plus,
  FileText
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Soru Bankası Keşfet | Teknokul',
  description: 'Binlerce ücretsiz soru bankası arasından istediğini bul ve indir. LGS, TYT, AYT ve tüm sınıflar için hazır PDF soru bankaları.',
  openGraph: {
    title: 'Soru Bankası Keşfet | Teknokul',
    description: 'Binlerce ücretsiz soru bankası arasından istediğini bul ve indir.',
  }
}

// Zorluk renkleri
const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  mixed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
}

const difficultyNames: Record<string, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
  mixed: 'Karışık'
}

interface SearchParams {
  grade?: string
  subject?: string
  q?: string
  page?: string
}

async function getBanks(searchParams: SearchParams) {
  const supabase = await createClient()
  
  const page = parseInt(searchParams.page || '1')
  const pageSize = 12
  const offset = (page - 1) * pageSize
  
  let query = supabase
    .from('question_banks')
    .select('*', { count: 'exact' })
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  
  // Filtreler
  if (searchParams.grade) {
    query = query.eq('grade', parseInt(searchParams.grade))
  }
  
  if (searchParams.subject) {
    query = query.eq('subject_code', searchParams.subject)
  }
  
  if (searchParams.q) {
    query = query.ilike('title', `%${searchParams.q}%`)
  }
  
  query = query.range(offset, offset + pageSize - 1)
  
  const { data, count, error } = await query
  
  if (error) {
    console.error('Fetch banks error:', error)
    return { banks: [], total: 0, page, pageSize }
  }
  
  return { banks: data || [], total: count || 0, page, pageSize }
}

// Sınıflar
const GRADES = [5, 6, 7, 8, 9, 10, 11, 12]

// Dersler
const SUBJECTS = [
  { code: 'MAT', name: 'Matematik' },
  { code: 'TUR', name: 'Türkçe' },
  { code: 'FEN', name: 'Fen Bilimleri' },
  { code: 'FIZ', name: 'Fizik' },
  { code: 'KIM', name: 'Kimya' },
  { code: 'BIO', name: 'Biyoloji' },
  { code: 'ING', name: 'İngilizce' },
  { code: 'TAR', name: 'Tarih' },
  { code: 'COG', name: 'Coğrafya' },
]

export default async function KesifPage({ 
  searchParams 
}: { 
  searchParams: Promise<SearchParams> 
}) {
  const params = await searchParams
  const { banks, total, page, pageSize } = await getBanks(params)
  const totalPages = Math.ceil(total / pageSize)
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-indigo-600" />
              Soru Bankası Keşfet
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {total} soru bankası mevcut
            </p>
          </div>
          
          <Link
            href="/soru-bankasi/olustur"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Oluştur
          </Link>
        </div>
        
        {/* Filtreler */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <form className="flex flex-col md:flex-row gap-4">
            {/* Arama */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Soru bankası ara..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            {/* Sınıf */}
            <select
              name="grade"
              defaultValue={params.grade}
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Sınıflar</option>
              {GRADES.map(g => (
                <option key={g} value={g}>{g}. Sınıf</option>
              ))}
            </select>
            
            {/* Ders */}
            <select
              name="subject"
              defaultValue={params.subject}
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Dersler</option>
              {SUBJECTS.map(s => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
            
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtrele
            </button>
          </form>
        </div>
        
        {/* Bankalar Grid */}
        {banks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {banks.map((bank: any) => (
              <Link
                key={bank.id}
                href={`/soru-bankasi/${bank.slug}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${difficultyColors[bank.difficulty || 'mixed']}`}>
                    {difficultyNames[bank.difficulty || 'mixed']}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2 line-clamp-2">
                  {bank.title}
                </h3>
                
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {bank.grade && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      {bank.exam_type || `${bank.grade}. Sınıf`}
                    </span>
                  )}
                  {bank.subject_name && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {bank.subject_name}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    {bank.question_count} Soru
                  </span>
                  <div className="flex items-center gap-3 text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {bank.view_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      {bank.download_count || 0}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400">
                    {bank.user_name} • {new Date(bank.created_at).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Soru bankası bulunamadı
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Farklı filtreler deneyin veya yeni bir soru bankası oluşturun.
            </p>
            <Link
              href="/soru-bankasi/olustur"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              <Plus className="w-5 h-5" />
              İlk Soru Bankasını Oluştur
            </Link>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link
                key={p}
                href={`/soru-bankasi/kesif?page=${p}${params.grade ? `&grade=${params.grade}` : ''}${params.subject ? `&subject=${params.subject}` : ''}${params.q ? `&q=${params.q}` : ''}`}
                className={`px-4 py-2 rounded-lg ${
                  p === page
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
