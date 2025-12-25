import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BreadcrumbSchema, QuizSchema, QuizQuestion } from '@/components/JsonLdSchema'
import { 
  ChevronRight, TrendingUp, Play, ArrowLeft, 
  Star, CheckCircle, Zap, Crown, Users, Trophy
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'En Çok Çözülen Sorular - Popüler 100 | Teknokul',
  description: 'Öğrencilerin en çok çözdüğü 100 soru. Popüler ve önemli sorularla pratik yap.',
  keywords: ['popüler sorular', 'en çok çözülen', 'favori sorular', 'önemli sorular'],
  openGraph: {
    title: 'En Çok Çözülen Sorular | Teknokul',
    description: 'Öğrencilerin favorisi - popüler 100 soru',
    url: 'https://www.teknokul.com.tr/sorular/en-cok-cozulen',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.teknokul.com.tr/sorular/en-cok-cozulen',
  },
}

export const revalidate = 3600 // 1 saat

const difficultyConfig = {
  easy: { label: 'Kolay', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  medium: { label: 'Orta', color: 'bg-yellow-100 text-yellow-700', icon: Star },
  hard: { label: 'Zor', color: 'bg-orange-100 text-orange-700', icon: Zap },
  legendary: { label: 'Efsane', color: 'bg-purple-100 text-purple-700', icon: Crown },
}

async function getPopularQuestions() {
  const supabase = await createClient()
  
  // En çok çözülen sorular (student_question_history'den)
  // Alternatif: questions tablosunda solve_count kolonu varsa onu kullan
  const { data: questions, count } = await supabase
    .from('questions')
    .select(`
      id, 
      question_text, 
      options, 
      correct_answer, 
      difficulty,
      topic:topics(
        main_topic,
        grade,
        subject:subjects(name, code)
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false }) // Normalde solve_count'a göre sıralanır
    .limit(100)
  
  // Ders bazlı istatistik
  const subjectStats: Record<string, number> = {}
  
  questions?.forEach(q => {
    const subjectName = (q.topic as any)?.subject?.name
    if (subjectName) {
      subjectStats[subjectName] = (subjectStats[subjectName] || 0) + 1
    }
  })
  
  return {
    questions: questions || [],
    totalCount: count || 0,
    subjectStats,
  }
}

export default async function EnCokCozulenPage() {
  const { questions, totalCount, subjectStats } = await getPopularQuestions()
  const baseUrl = 'https://www.teknokul.com.tr'
  
  // Quiz Schema için soruları hazırla
  const quizQuestions: QuizQuestion[] = questions.slice(0, 10).map((q) => {
    const options = q.options as { A: string; B: string; C: string; D: string; E?: string }
    const correctAnswer = options[q.correct_answer as keyof typeof options] || ''
    
    return {
      text: q.question_text,
      options: Object.values(options).filter(Boolean) as string[],
      correctAnswer,
    }
  })

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', url: '/' },
          { name: 'Soru Bankası', url: '/sorular' },
          { name: 'En Çok Çözülen', url: '/sorular/en-cok-cozulen' },
        ]}
      />
      <QuizSchema
        name="En Çok Çözülen Sorular"
        description="Öğrencilerin en çok çözdüğü popüler sorular"
        subject="Karışık Dersler"
        questionCount={questions.length}
        questions={quizQuestions}
        url={`${baseUrl}/sorular/en-cok-cozulen`}
      />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/70 text-sm mb-6">
            <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/sorular" className="hover:text-white transition-colors">Soru Bankası</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">En Çok Çözülen</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <TrendingUp className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                    En Çok Çözülen Sorular
                  </h1>
                  <span className="px-3 py-1 bg-emerald-400 text-white text-sm font-semibold rounded-full">
                    Popüler
                  </span>
                </div>
                <p className="text-lg text-white/90 max-w-2xl">
                  Öğrencilerin favorisi! En çok tercih edilen <strong>{questions.length}</strong> soru.
                </p>
              </div>
            </div>
            
            {/* CTA */}
            <Link
              href="/hizli-coz?sort=popular"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              <Play className="w-5 h-5" />
              Popülerleri Çöz
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
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-700">Popüler</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{questions.length}</div>
              <div className="text-sm text-gray-500">soru</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-700">Ders Çeşidi</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{Object.keys(subjectStats).length}</div>
              <div className="text-sm text-gray-500">farklı ders</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-700">Veritabanı</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{totalCount.toLocaleString('tr-TR')}</div>
              <div className="text-sm text-gray-500">toplam soru</div>
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
            <Trophy className="w-5 h-5 text-amber-500" />
            En Popüler Sorular
          </h2>
          <div className="space-y-4">
            {questions.slice(0, 5).map((question, index) => {
              const difficulty = difficultyConfig[question.difficulty as keyof typeof difficultyConfig]
              const DiffIcon = difficulty?.icon || Star
              const options = question.options as { A: string; B: string; C: string; D: string; E?: string }
              const subjectName = (question.topic as any)?.subject?.name || 'Genel'
              
              return (
                <div
                  key={question.id}
                  className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-sm font-medium text-amber-600">
                        <Trophy className="w-4 h-4" />
                        #{index + 1}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                        {subjectName}
                      </span>
                      {difficulty && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${difficulty.color}`}>
                          <DiffIcon className="w-3 h-3" />
                          {difficulty.label}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-800 mb-4 line-clamp-3">
                    {question.question_text}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(options).filter(([_, v]) => v).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-sm"
                      >
                        <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-xs font-medium">
                          {key}
                        </span>
                        <span className="text-gray-700 line-clamp-1">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="text-center mt-8">
            <Link
              href="/hizli-coz?sort=popular"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
            >
              <Play className="w-5 h-5" />
              Tüm Popüler Soruları Çöz
            </Link>
          </div>
        </section>

        {/* İlgili Sayfalar */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">İlgili Sayfalar</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sorular/yeni-eklenen-sorular"
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
            >
              Yeni Sorular
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

