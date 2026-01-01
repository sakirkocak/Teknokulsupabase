import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, 
  FileText, 
  Download, 
  Eye, 
  Trash2,
  BookOpen,
  GraduationCap,
  Calendar
} from 'lucide-react'
import DeleteBankButton from './DeleteBankButton'

export const metadata: Metadata = {
  title: 'Benim Soru Bankalarım | Teknokul',
  description: 'Oluşturduğunuz soru bankalarını görüntüleyin ve yönetin.'
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

export default async function BenimBankalarimPage() {
  const supabase = await createClient()
  
  // Kullanıcı kontrolü
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/giris?redirect=/soru-bankasi/benim')
  }
  
  // Kullanıcının bankalarını getir
  const { data: banks, error } = await supabase
    .from('question_banks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  // İstatistikler
  const totalBanks = banks?.length || 0
  const totalQuestions = banks?.reduce((sum, b) => sum + (b.question_count || 0), 0) || 0
  const totalDownloads = banks?.reduce((sum, b) => sum + (b.download_count || 0), 0) || 0
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-indigo-600" />
              Benim Soru Bankalarım
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Oluşturduğunuz tüm soru bankaları
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
        
        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBanks}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Soru Bankası</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalQuestions}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Soru</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Download className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDownloads}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Toplam İndirme</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bankalar Listesi */}
        {banks && banks.length > 0 ? (
          <div className="space-y-4">
            {banks.map((bank: any) => (
              <div
                key={bank.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/soru-bankasi/${bank.slug}`}
                        className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        {bank.title}
                      </Link>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${difficultyColors[bank.difficulty || 'mixed']}`}>
                        {difficultyNames[bank.difficulty || 'mixed']}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
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
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {bank.question_count} Soru
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(bank.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* İstatistikler */}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {bank.view_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        {bank.download_count || 0}
                      </span>
                    </div>
                    
                    {/* Aksiyonlar */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/soru-bankasi/${bank.slug}`}
                        className="px-3 py-1.5 text-sm bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors"
                      >
                        Görüntüle
                      </Link>
                      <DeleteBankButton bankId={bank.id} bankTitle={bank.title} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Henüz soru bankası oluşturmadınız
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              İlk soru bankanızı oluşturmak için aşağıdaki butona tıklayın.
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
      </div>
    </div>
  )
}
