import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'
import { BreadcrumbSchema, QuizSchema, QuizQuestion } from '@/components/JsonLdSchema'
import { QuestionText, OptionText } from '@/components/QuestionCard'
import { 
  ChevronRight, ImageIcon, Play, ArrowLeft, 
  Star, CheckCircle, Zap, Crown, BarChart3, Table2
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Görselli Sorular - Grafik, Tablo, Şema | Teknokul',
  description: 'Grafik, tablo, şema ve diyagram içeren sorular. Görsel okuma ve yorumlama becerilerinizi geliştirin.',
  keywords: ['görselli sorular', 'grafik soruları', 'tablo soruları', 'şema soruları', 'diyagram soruları'],
  openGraph: {
    title: 'Görselli Sorular | Teknokul',
    description: 'Grafik, tablo ve şema içeren sorular',
    url: 'https://www.teknokul.com.tr/sorular/gorselli-sorular',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.teknokul.com.tr/sorular/gorselli-sorular',
  },
}

export const revalidate = 3600 // 1 saat

const difficultyConfig = {
  easy: { label: 'Kolay', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  medium: { label: 'Orta', color: 'bg-yellow-100 text-yellow-700', icon: Star },
  hard: { label: 'Zor', color: 'bg-orange-100 text-orange-700', icon: Zap },
  legendary: { label: 'Efsane', color: 'bg-purple-100 text-purple-700', icon: Crown },
}

interface ImageQuestion {
  id: string
  question_text: string
  options: { A: string; B: string; C: string; D: string; E?: string }
  correct_answer: string
  difficulty: string
  question_image_url?: string
  times_answered: number
  times_correct: number
  success_rate: number
  subject_name: string
}

// Typesense'den görselli soruları getir
async function getImageQuestionsFromTypesense(): Promise<{
  questions: ImageQuestion[]
  totalCount: number
  subjectStats: Record<string, number>
  source: string
}> {
  const startTime = Date.now()
  
  try {
    const result = await typesenseClient
      .collections(COLLECTIONS.QUESTIONS)
      .documents()
      .search({
        q: '*',
        query_by: 'question_text',
        sort_by: 'created_at:desc',
        per_page: 100,
        filter_by: 'has_image:=true',
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
    
    const questions: ImageQuestion[] = hits.map((hit: any) => {
      const doc = hit.document
      const timesAnswered = doc.times_answered || 0
      const timesCorrect = doc.times_correct || 0
      
      return {
        id: doc.question_id || doc.id,
        question_text: doc.question_text || '',
        options: { 
          A: doc.option_a || '', 
          B: doc.option_b || '', 
          C: doc.option_c || '', 
          D: doc.option_d || '',
          E: doc.option_e || ''
        },
        correct_answer: doc.correct_answer || '',
        difficulty: doc.difficulty || 'medium',
        question_image_url: doc.image_url || doc.question_image_url || '',
        times_answered: timesAnswered,
        times_correct: timesCorrect,
        success_rate: doc.success_rate || (timesAnswered > 0 ? Math.round((timesCorrect / timesAnswered) * 100) : 0),
        subject_name: doc.subject_name || ''
      }
    })
    
    const duration = Date.now() - startTime
    console.log(`⚡ Görselli Sorular: Typesense ${duration}ms, ${questions.length} soru`)
    
    return { questions, totalCount, subjectStats, source: 'typesense' }
  } catch (error) {
    console.error('Typesense error:', error)
    throw error
  }
}

// Supabase fallback
async function getImageQuestionsFromSupabase(): Promise<{
  questions: ImageQuestion[]
  totalCount: number
  subjectStats: Record<string, number>
  source: string
}> {
  const startTime = Date.now()
  const supabase = await createClient()
  
  const { data: questions, count } = await supabase
    .from('questions')
    .select(`
      id, 
      question_text, 
      options, 
      correct_answer, 
      difficulty,
      question_image_url,
      times_answered,
      times_correct,
      topic:topics(
        main_topic,
        grade,
        subject:subjects(name, code)
      )
    `, { count: 'exact' })
    .not('question_image_url', 'is', null)
    .order('times_answered', { ascending: false })
    .limit(100)
  
  const subjectStats: Record<string, number> = {}
  
  const formattedQuestions: ImageQuestion[] = (questions || []).map((q: any) => {
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
      question_image_url: q.question_image_url,
      times_answered: timesAnswered,
      times_correct: timesCorrect,
      success_rate: timesAnswered > 0 ? Math.round((timesCorrect / timesAnswered) * 100) : 0,
      subject_name: subjectName
    }
  })
  
  const duration = Date.now() - startTime
  console.log(`📊 Görselli Sorular: Supabase ${duration}ms, ${formattedQuestions.length} soru`)
  
  return { questions: formattedQuestions, totalCount: count || 0, subjectStats, source: 'supabase' }
}

// Ana data fetcher
async function getImageQuestions() {
  if (isTypesenseAvailable()) {
    try {
      return await getImageQuestionsFromTypesense()
    } catch {
      console.log('⚠️ Typesense failed, falling back to Supabase')
    }
  }
  return await getImageQuestionsFromSupabase()
}

export default async function GorselliSorularPage() {
  const { questions, totalCount, subjectStats, source } = await getImageQuestions()
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
          { name: 'Görselli Sorular', url: '/sorular/gorselli-sorular' },
        ]}
      />
      <QuizSchema
        name="Görselli Sorular"
        description="Grafik, tablo, şema ve diyagram içeren sorular"
        subject="Karışık Dersler"
        questionCount={totalCount}
        questions={quizQuestions}
        url={`${baseUrl}/sorular/gorselli-sorular`}
      />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/70 text-sm mb-6">
            <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/sorular" className="hover:text-white transition-colors">Soru Bankası</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">Görselli Sorular</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <ImageIcon className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                    Görselli Sorular
                  </h1>
                  {source === 'typesense' && (
                    <span className="px-3 py-1 bg-amber-400 text-white text-sm font-semibold rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Turbo
                    </span>
                  )}
                </div>
                <p className="text-lg text-white/90 max-w-2xl">
                  Grafik, tablo, şema ve diyagram içeren <strong>{totalCount.toLocaleString('tr-TR')}</strong> soru. 
                  Görsel okuma becerilerini geliştir!
                </p>
              </div>
            </div>
            
            {/* CTA */}
            <Link
              href="/hizli-coz?hasImage=true"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              <Play className="w-5 h-5" />
              Görsellileri Çöz
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-700">Görselli</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{totalCount.toLocaleString('tr-TR')}</div>
              <div className="text-sm text-gray-500">soru</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-700">Grafik</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">~{Math.round(totalCount * 0.4)}</div>
              <div className="text-sm text-gray-500">grafik sorusu</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Table2 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-700">Ders Çeşidi</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{Object.keys(subjectStats).length}</div>
              <div className="text-sm text-gray-500">farklı ders</div>
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
            <ImageIcon className="w-5 h-5 text-amber-500" />
            Örnek Görselli Sorular
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {questions.slice(0, 4).map((question, index) => {
              const difficulty = difficultyConfig[question.difficulty as keyof typeof difficultyConfig]
              const DiffIcon = difficulty?.icon || Star
              
              return (
                <div
                  key={question.id}
                  className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-500">Soru {index + 1}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        Görselli
                      </span>
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
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          {question.times_answered.toLocaleString('tr-TR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          %{question.success_rate}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Görsel */}
                  {question.question_image_url && (
                    <div className="mb-4 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                      {question.question_image_url.startsWith('data:') ? (
                        <img 
                          src={question.question_image_url} 
                          alt="Soru görseli"
                          className="w-full h-48 object-contain"
                        />
                      ) : (
                        <Image
                          src={question.question_image_url}
                          alt="Soru görseli"
                          width={400}
                          height={200}
                          className="w-full h-48 object-contain"
                        />
                      )}
                    </div>
                  )}
                  
                  <QuestionText 
                    text={question.question_text} 
                    className="text-gray-800 mb-4 line-clamp-2" 
                  />
                  
                  {question.options && Object.keys(question.options).length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(question.options).filter(([_, v]) => v).slice(0, 4).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-sm"
                        >
                          <span className="w-5 h-5 flex items-center justify-center bg-gray-200 rounded-full text-xs font-medium">
                            {key}
                          </span>
                          <OptionText text={value} className="text-gray-700 line-clamp-1 text-xs" />
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
              href="/hizli-coz?hasImage=true"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
            >
              <Play className="w-5 h-5" />
              Tüm Görselli Soruları Çöz
            </Link>
          </div>
        </section>

        {/* Görsel Türleri */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Görsel Türleri</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium text-gray-900">Grafikler</div>
              <div className="text-sm text-gray-500">Çubuk, çizgi, pasta</div>
            </div>
            <div className="p-4 bg-green-50 rounded-xl text-center">
              <Table2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium text-gray-900">Tablolar</div>
              <div className="text-sm text-gray-500">Veri tabloları</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl text-center">
              <ImageIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="font-medium text-gray-900">Şemalar</div>
              <div className="text-sm text-gray-500">Akış, yapı şemaları</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl text-center">
              <Star className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <div className="font-medium text-gray-900">Diyagramlar</div>
              <div className="text-sm text-gray-500">Bilimsel çizimler</div>
            </div>
          </div>
        </section>

        {/* İlgili Sayfalar */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">İlgili Sayfalar</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sorular/fen_bilimleri/8-sinif"
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
            >
              Fen Bilimleri Soruları
            </Link>
            <Link
              href="/sorular/matematik/8-sinif"
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
            >
              Matematik Soruları
            </Link>
            <Link
              href="/sorular/lgs-en-zor-100"
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
            >
              LGS En Zor 100
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
