import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'
import { BreadcrumbSchema, QuizSchema, QuizQuestion } from '@/components/JsonLdSchema'
import { QuestionText, OptionText } from '@/components/QuestionCard'
import { 
  ChevronRight, Sparkles, Play, ArrowLeft, 
  Star, CheckCircle, Zap, Crown, Calendar, BarChart3
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Yeni Eklenen Sorular - Bu Hafta | Teknokul',
  description: 'Bu hafta eklenen en yeni sorular. Güncel müfredata uygun taze içerikler ile pratik yap.',
  keywords: ['yeni sorular', 'güncel sorular', 'son eklenen sorular', 'taze sorular'],
  openGraph: {
    title: 'Yeni Eklenen Sorular | Teknokul',
    description: 'Bu hafta eklenen taze sorular',
    url: 'https://www.teknokul.com.tr/sorular/yeni-eklenen-sorular',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.teknokul.com.tr/sorular/yeni-eklenen-sorular',
  },
}

export const revalidate = 3600 // 1 saat

const difficultyConfig = {
  easy: { label: 'Kolay', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  medium: { label: 'Orta', color: 'bg-yellow-100 text-yellow-700', icon: Star },
  hard: { label: 'Zor', color: 'bg-orange-100 text-orange-700', icon: Zap },
  legendary: { label: 'Efsane', color: 'bg-purple-100 text-purple-700', icon: Crown },
}

interface NewQuestion {
  id: string
  question_text: string
  options: { A: string; B: string; C: string; D: string; E?: string }
  correct_answer: string
  difficulty: string
  times_answered: number
  times_correct: number
  success_rate: number
  subject_name: string
  subject_code: string
  main_topic: string
  created_at: number
}

// Typesense'den yeni soruları getir
async function getNewQuestionsFromTypesense(): Promise<{
  questions: NewQuestion[]
  totalCount: number
  subjectStats: Record<string, number>
  source: string
}> {
  const startTime = Date.now()
  
  // Son 7 gün timestamp
  const oneWeekAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000)
  
  try {
    const result = await typesenseClient
      .collections(COLLECTIONS.QUESTIONS)
      .documents()
      .search({
        q: '*',
        query_by: 'question_text',
        sort_by: 'created_at:desc',  // EN YENİYE GÖRE SIRALA
        per_page: 100,
        filter_by: `created_at:>=${oneWeekAgo}`,
        facet_by: 'subject_name,difficulty',
        max_facet_values: 20
      })
    
    const hits = result.hits || []
    const totalCount = result.found || 0
    
    // Subject stats from facets
    const subjectStats: Record<string, number> = {}
    const subjectFacet = result.facet_counts?.find((f: any) => f.field_name === 'subject_name')
    if (subjectFacet?.counts) {
      subjectFacet.counts.forEach((item: any) => {
        subjectStats[item.value] = item.count
      })
    }
    
    const questions: NewQuestion[] = hits.map((hit: any) => {
      const doc = hit.document
      const timesAnswered = doc.times_answered || 0
      const timesCorrect = doc.times_correct || 0
      
      return {
        id: doc.question_id || doc.id,
        question_text: doc.question_text || '',
        options: { A: '', B: '', C: '', D: '' },
        correct_answer: '',
        difficulty: doc.difficulty || 'medium',
        times_answered: timesAnswered,
        times_correct: timesCorrect,
        success_rate: doc.success_rate || (timesAnswered > 0 ? Math.round((timesCorrect / timesAnswered) * 100) : 0),
        subject_name: doc.subject_name || '',
        subject_code: doc.subject_code || '',
        main_topic: doc.main_topic || '',
        created_at: doc.created_at || 0
      }
    })
    
    const duration = Date.now() - startTime
    console.log(`⚡ Yeni Sorular: Typesense ${duration}ms, ${questions.length} soru`)
    
    return { questions, totalCount, subjectStats, source: 'typesense' }
  } catch (error) {
    console.error('Typesense error:', error)
    throw error
  }
}

// Supabase fallback
async function getNewQuestionsFromSupabase(): Promise<{
  questions: NewQuestion[]
  totalCount: number
  subjectStats: Record<string, number>
  source: string
}> {
  const startTime = Date.now()
  const supabase = await createClient()
  
  // Son 7 gün
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  const { data: questions, count } = await supabase
    .from('questions')
    .select(`
      id, 
      question_text, 
      options, 
      correct_answer, 
      difficulty,
      created_at,
      times_answered,
      times_correct,
      topic:topics(
        main_topic,
        grade,
        subject:subjects(name, code)
      )
    `, { count: 'exact' })
    .gte('created_at', oneWeekAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(100)
  
  const subjectStats: Record<string, number> = {}
  
  const formattedQuestions: NewQuestion[] = (questions || []).map((q: any) => {
    const subjectName = q.topic?.subject?.name || ''
    if (subjectName) {
      subjectStats[subjectName] = (subjectStats[subjectName] || 0) + 1
    }
    
    const timesAnswered = q.times_answered || 0
    const timesCorrect = q.times_correct || 0
    
    return {
      id: q.id,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      difficulty: q.difficulty,
      times_answered: timesAnswered,
      times_correct: timesCorrect,
      success_rate: timesAnswered > 0 ? Math.round((timesCorrect / timesAnswered) * 100) : 0,
      subject_name: subjectName,
      subject_code: q.topic?.subject?.code || '',
      main_topic: q.topic?.main_topic || '',
      created_at: new Date(q.created_at).getTime()
    }
  })
  
  const duration = Date.now() - startTime
  console.log(`📊 Yeni Sorular: Supabase ${duration}ms, ${formattedQuestions.length} soru`)
  
  return { questions: formattedQuestions, totalCount: count || 0, subjectStats, source: 'supabase' }
}

// Ana data fetcher
async function getNewQuestions() {
  if (isTypesenseAvailable()) {
    try {
      return await getNewQuestionsFromTypesense()
    } catch {
      console.log('⚠️ Typesense failed, falling back to Supabase')
    }
  }
  return await getNewQuestionsFromSupabase()
}

export default async function YeniSorularPage() {
  const { questions, totalCount, subjectStats, source } = await getNewQuestions()
  const baseUrl = 'https://www.teknokul.com.tr'
  
  // Quiz Schema için soruları hazırla
  const quizQuestions: QuizQuestion[] = questions.slice(0, 10).map((q) => {
    return {
      text: q.question_text,
      options: q.options ? Object.values(q.options).filter(Boolean) as string[] : [],
      correctAnswer: q.options?.[q.correct_answer as keyof typeof q.options] || '',
    }
  })

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', url: '/' },
          { name: 'Soru Bankası', url: '/sorular' },
          { name: 'Yeni Sorular', url: '/sorular/yeni-eklenen-sorular' },
        ]}
      />
      <QuizSchema
        name="Yeni Eklenen Sorular"
        description="Bu hafta eklenen en yeni sorular"
        subject="Karışık Dersler"
        questionCount={totalCount}
        questions={quizQuestions}
        url={`${baseUrl}/sorular/yeni-eklenen-sorular`}
      />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/70 text-sm mb-6">
            <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/sorular" className="hover:text-white transition-colors">Soru Bankası</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">Yeni Sorular</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Sparkles className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                    Yeni Eklenen Sorular
                  </h1>
                  {source === 'typesense' && (
                    <span className="px-3 py-1 bg-pink-400 text-white text-sm font-semibold rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Turbo
                    </span>
                  )}
                </div>
                <p className="text-lg text-white/90 max-w-2xl">
                  Bu hafta eklenen <strong>{totalCount.toLocaleString('tr-TR')}</strong> yeni soru ile pratik yap.
                </p>
              </div>
            </div>
            
            {/* CTA */}
            <Link
              href="/hizli-coz?sort=newest"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              <Play className="w-5 h-5" />
              Yenileri Çöz
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link 
          href="/sorular"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Soru Bankasına Dön
        </Link>

        {/* Stats */}
        <section className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-700">Bu Hafta</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{totalCount.toLocaleString('tr-TR')}</div>
              <div className="text-sm text-gray-500">yeni soru</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-700">Günlük Ort.</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{Math.round(totalCount / 7)}</div>
              <div className="text-sm text-gray-500">soru/gün</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-700">Ders Çeşidi</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{Object.keys(subjectStats).length}</div>
              <div className="text-sm text-gray-500">farklı ders</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-700">Son 7 Gün</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">7</div>
              <div className="text-sm text-gray-500">gün</div>
            </div>
          </div>
        </section>

        {/* Ders Dağılımı */}
        {Object.keys(subjectStats).length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ders Dağılımı</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(subjectStats)
                .sort((a, b) => b[1] - a[1])
                .map(([subject, count]) => (
                <div
                  key={subject}
                  className="px-4 py-2 bg-gray-100 rounded-lg text-sm"
                >
                  <span className="font-medium text-gray-900">{subject}:</span>
                  <span className="text-gray-600 ml-1">{count} soru</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Örnek Sorular */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            En Son Eklenen Sorular
          </h2>
          <div className="space-y-4">
            {questions.slice(0, 5).map((question, index) => {
              const difficulty = difficultyConfig[question.difficulty as keyof typeof difficultyConfig]
              const DiffIcon = difficulty?.icon || Star
              const addedDate = question.created_at 
                ? new Date(question.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
                : ''
              
              return (
                <div
                  key={question.id}
                  className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-500">Soru {index + 1}</span>
                      {addedDate && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                          {addedDate}
                        </span>
                      )}
                      {question.subject_name && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                          {question.subject_name}
                        </span>
                      )}
                      {difficulty && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${difficulty.color}`}>
                          <DiffIcon className="w-3 h-3" />
                          {difficulty.label}
                        </span>
                      )}
                    </div>
                    {/* İstatistikler */}
                    {question.times_answered > 0 && (
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          {question.times_answered.toLocaleString('tr-TR')} çözüm
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          %{question.success_rate} başarı
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <QuestionText 
                    text={question.question_text} 
                    className="text-gray-800 mb-4 line-clamp-3" 
                  />
                  
                  {question.options && Object.keys(question.options).length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(question.options).filter(([_, v]) => v).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-sm"
                        >
                          <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-xs font-medium">
                            {key}
                          </span>
                          <OptionText text={value} className="text-gray-700 line-clamp-1" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          <div className="text-center mt-8">
            <Link
              href="/hizli-coz?sort=newest"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
            >
              <Play className="w-5 h-5" />
              Tüm Yeni Soruları Çöz
            </Link>
          </div>
        </section>

        {/* İlgili Sayfalar */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">İlgili Sayfalar</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sorular/en-cok-cozulen"
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
            >
              En Çok Çözülen
            </Link>
            <Link
              href="/sorular/lgs-en-zor-100"
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
            >
              LGS En Zor 100
            </Link>
            <Link
              href="/sorular/sinav-oncesi-hizli-tekrar"
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              Hızlı Tekrar
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-gray-600 text-sm">
              © 2025 Teknokul. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                Ana Sayfa
              </Link>
              <Link href="/sorular" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                Soru Bankası
              </Link>
              <Link href="/hizli-coz" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                Hızlı Çöz
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
