import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BreadcrumbSchema, QuizSchema, QuizQuestion } from '@/components/JsonLdSchema'
import { 
  ChevronRight, Clock, Play, ArrowLeft, 
  Star, CheckCircle, Zap, Crown, Sparkles
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sınav Öncesi Hızlı Tekrar - 50 Kritik Soru | Teknokul',
  description: 'Sınav öncesi son dakika tekrarı için seçilmiş 50 kritik soru. Tüm derslerden karışık, en önemli konulardan.',
  keywords: ['sınav tekrarı', 'hızlı tekrar', 'son dakika çalışma', 'LGS tekrar', 'YKS tekrar'],
  openGraph: {
    title: 'Sınav Öncesi Hızlı Tekrar | Teknokul',
    description: 'Son dakika pratik - kritik 50 soru',
    url: 'https://www.teknokul.com.tr/sorular/sinav-oncesi-hizli-tekrar',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.teknokul.com.tr/sorular/sinav-oncesi-hizli-tekrar',
  },
}

const difficultyConfig = {
  easy: { label: 'Kolay', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  medium: { label: 'Orta', color: 'bg-yellow-100 text-yellow-700', icon: Star },
  hard: { label: 'Zor', color: 'bg-orange-100 text-orange-700', icon: Zap },
  legendary: { label: 'Efsane', color: 'bg-purple-100 text-purple-700', icon: Crown },
}

async function getQuickReviewQuestions() {
  const supabase = await createClient()
  
  // Karışık zorlukta 50 soru getir (orta ağırlıklı)
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
        subject:subjects(name)
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)
  
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

export default async function HizliTekrarPage() {
  const { questions, totalCount, subjectStats } = await getQuickReviewQuestions()
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
  
  // Tahmini süre (soru başına 1.5 dakika)
  const estimatedMinutes = Math.ceil(questions.length * 1.5)

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', url: '/' },
          { name: 'Soru Bankası', url: '/sorular' },
          { name: 'Hızlı Tekrar', url: '/sorular/sinav-oncesi-hizli-tekrar' },
        ]}
      />
      <QuizSchema
        name="Sınav Öncesi Hızlı Tekrar"
        description="Sınav öncesi son dakika tekrarı için seçilmiş kritik sorular"
        subject="Karışık Dersler"
        questionCount={questions.length}
        questions={quizQuestions}
        url={`${baseUrl}/sorular/sinav-oncesi-hizli-tekrar`}
      />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/70 text-sm mb-6">
            <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/sorular" className="hover:text-white transition-colors">Soru Bankası</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">Hızlı Tekrar</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Clock className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
                  Sınav Öncesi Hızlı Tekrar
                </h1>
                <p className="text-lg text-white/90 max-w-2xl">
                  Son dakika pratik! <strong>{questions.length}</strong> kritik soru ile 
                  <strong> ~{estimatedMinutes} dakikada</strong> hazırlan.
                </p>
              </div>
            </div>
            
            {/* CTA */}
            <Link
              href="/hizli-coz?mode=quick-review"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              <Play className="w-5 h-5" />
              Hemen Başla
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

        {/* Info Cards */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-900">Tahmini Süre</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">{estimatedMinutes} dk</div>
              <p className="text-sm text-gray-600 mt-1">Soru başına ~1.5 dakika</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <Sparkles className="w-6 h-6 text-green-600" />
                </div>
                <span className="font-semibold text-gray-900">Soru Sayısı</span>
              </div>
              <div className="text-3xl font-bold text-green-600">{questions.length}</div>
              <p className="text-sm text-gray-600 mt-1">Seçilmiş kritik sorular</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <span className="font-semibold text-gray-900">Ders Sayısı</span>
              </div>
              <div className="text-3xl font-bold text-purple-600">{Object.keys(subjectStats).length}</div>
              <p className="text-sm text-gray-600 mt-1">Farklı ders</p>
            </div>
          </div>
        </section>

        {/* Ders Dağılımı */}
        {Object.keys(subjectStats).length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ders Dağılımı</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(subjectStats).map(([subject, count]) => (
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
            <Sparkles className="w-5 h-5 text-cyan-500" />
            Örnek Sorular
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">Soru {index + 1}</span>
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
              href="/hizli-coz?mode=quick-review"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
            >
              <Play className="w-5 h-5" />
              Hızlı Tekrar Başlat
            </Link>
          </div>
        </section>

        {/* İlgili Sayfalar */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">İlgili Sayfalar</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sorular/lgs-en-zor-100"
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
            >
              LGS En Zor 100 Soru
            </Link>
            <Link
              href="/sorular/en-cok-cozulen"
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
            >
              En Çok Çözülen
            </Link>
            <Link
              href="/sorular/yeni-eklenen-sorular"
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
            >
              Yeni Sorular
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

