import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  Download, 
  Eye, 
  BookOpen, 
  GraduationCap,
  Calendar,
  User,
  ArrowLeft,
  Share2,
  FileText
} from 'lucide-react'
import DownloadButton from './DownloadButton'

// Dinamik metadata
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: bank } = await supabase
    .from('question_banks')
    .select('title, meta_title, meta_description, question_count, subject_name, grade')
    .eq('slug', slug)
    .single()
  
  if (!bank) {
    return { title: 'Soru Bankası Bulunamadı' }
  }
  
  const title = bank.meta_title || bank.title
  const description = bank.meta_description || `${bank.question_count} soruluk ${bank.subject_name || ''} soru bankası. Ücretsiz indir!`
  
  return {
    title: `${title} | Teknokul`,
    description,
    openGraph: {
      title,
      description,
      type: 'article'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    }
  }
}

// Zorluk renkleri
const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
  mixed: 'bg-purple-100 text-purple-700'
}

const difficultyNames: Record<string, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
  mixed: 'Karışık'
}

export default async function SoruBankasiDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const supabase = await createClient()
  
  // Bankayı getir
  const { data: bank, error } = await supabase
    .from('question_banks')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error || !bank) {
    notFound()
  }
  
  // View count artır
  await supabase.rpc('increment_bank_view_count', { bank_id: bank.id })
  
  // Benzer bankalar
  const { data: similarBanks } = await supabase
    .from('question_banks')
    .select('id, title, slug, question_count, subject_name, grade')
    .eq('is_public', true)
    .neq('id', bank.id)
    .or(`subject_code.eq.${bank.subject_code},grade.eq.${bank.grade}`)
    .limit(4)
  
  // JSON-LD Structured Data - SEO için zenginleştirilmiş
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: bank.title,
    description: bank.meta_description || `${bank.question_count} soruluk ${bank.subject_name || ''} soru bankası`,
    author: {
      '@type': 'Person',
      name: 'Şakir Koçak',
      url: 'https://instagram.com/sakirkocak'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Teknokul',
      url: 'https://teknokul.com.tr'
    },
    datePublished: bank.created_at,
    dateModified: bank.updated_at,
    inLanguage: 'tr',
    isAccessibleForFree: true,
    educationalLevel: bank.grade ? `${bank.grade}. Sınıf` : bank.exam_type,
    about: bank.subject_name,
    numberOfQuestions: bank.question_count,
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student'
    }
  }
  
  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Geri butonu */}
          <Link
            href="/soru-bankasi/kesif"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Soru Bankalarına Dön
          </Link>
          
          {/* Ana Kart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-6 md:p-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full bg-white/20 mb-4`}>
                    {difficultyNames[bank.difficulty || 'mixed']} • {bank.question_count} Soru
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">
                    {bank.title}
                  </h1>
                  {bank.description && (
                    <p className="text-white/80 text-sm">
                      {bank.description}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <FileText className="w-8 h-8" />
                </div>
              </div>
            </div>
            
            {/* İçerik */}
            <div className="p-6 md:p-8">
              {/* Bilgiler Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {bank.grade && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                      <GraduationCap className="w-4 h-4" />
                      Sınıf
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {bank.exam_type || `${bank.grade}. Sınıf`}
                    </p>
                  </div>
                )}
                
                {bank.subject_name && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                      <BookOpen className="w-4 h-4" />
                      Ders
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {bank.subject_name}
                    </p>
                  </div>
                )}
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                    <Eye className="w-4 h-4" />
                    Görüntüleme
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {bank.view_count || 0}
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                    <Download className="w-4 h-4" />
                    İndirme
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {bank.download_count || 0}
                  </p>
                </div>
              </div>
              
              {/* Konular */}
              {bank.topics && bank.topics.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Konular
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {bank.topics.map((topic: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Oluşturan */}
              <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {bank.user_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(bank.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
              
              {/* İndir Butonu */}
              <DownloadButton bank={bank} />
              
              {/* PDF Direkt Link (SEO için) */}
              {bank.pdf_url && (
                <div className="mt-4 text-center">
                  <a 
                    href={bank.pdf_url}
                    target="_blank"
                    rel="noopener"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    PDF dosyasını yeni sekmede aç
                  </a>
                </div>
              )}
            </div>
          </div>
          
          {/* Soru Bankası Bilgisi - Duplicate content önlemek için soru detayları gösterilmiyor */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {bank.question_count} Soru İçeriyor
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Bu soru bankasını PDF olarak indirip çalışmaya başlayabilirsin.
                {bank.topics && bank.topics.length > 0 && (
                  <span className="block mt-2 text-sm">
                    Konular: {bank.topics.join(', ')}
                  </span>
                )}
              </p>
              
              {/* İkinci İndir Butonu */}
              <DownloadButton bank={bank} />
              
              {/* SEO Alt Bilgi */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  "Bu soru bankası Şakir Koçak'ın tüm insanlara armağanıdır."
                </p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">
                  teknokul.com.tr • 📷 @sakirkocak
                </p>
              </div>
            </div>
          </div>
          
          {/* Benzer Bankalar */}
          {similarBanks && similarBanks.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Benzer Soru Bankaları
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {similarBanks.map((similar: any) => (
                  <Link
                    key={similar.id}
                    href={`/soru-bankasi/${similar.slug}`}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
                      {similar.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {similar.question_count} Soru • {similar.subject_name || `${similar.grade}. Sınıf`}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
