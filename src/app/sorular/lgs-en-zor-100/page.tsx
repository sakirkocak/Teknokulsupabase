import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BreadcrumbSchema, QuizSchema, QuizQuestion } from '@/components/JsonLdSchema'
import { 
  ChevronRight, Zap, Crown, Target, Play,
  ArrowLeft, Star, CheckCircle, Flame
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'LGS En Zor 100 Soru - Kendini Sına | Teknokul',
  description: 'LGS sınavına hazırlanan 8. sınıf öğrencileri için en zorlu 100 soru. Matematik, Fen Bilimleri, Türkçe dersleri. Zor ve efsane seviye sorular.',
  keywords: ['LGS zor sorular', 'LGS hazırlık', '8. sınıf zor sorular', 'LGS matematik zor', 'LGS fen zor'],
  openGraph: {
    title: 'LGS En Zor 100 Soru | Teknokul',
    description: 'Kendini sınava hazırla - en zorlu sorularla!',
    url: 'https://www.teknokul.com.tr/sorular/lgs-en-zor-100',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.teknokul.com.tr/sorular/lgs-en-zor-100',
  },
}

const difficultyConfig = {
  hard: { label: 'Zor', color: 'bg-orange-100 text-orange-700', icon: Zap },
  legendary: { label: 'Efsane', color: 'bg-purple-100 text-purple-700', icon: Crown },
}

async function getHardQuestions() {
  const supabase = await createClient()
  
  // LGS dersleri (8. sınıf)
  const lgsSubjects = ['matematik', 'turkce', 'fen_bilimleri', 'inkilap_tarihi', 'din_kulturu', 'ingilizce']
  
  // Subject ID'lerini al
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, code, name')
    .in('code', lgsSubjects)
  
  if (!subjects) return { questions: [], totalCount: 0, subjectStats: {} }
  
  const subjectIds = subjects.map(s => s.id)
  
  // 8. sınıf topic'lerini bul
  const { data: topics } = await supabase
    .from('topics')
    .select('id, subject_id')
    .in('subject_id', subjectIds)
    .eq('grade', 8)
  
  if (!topics || topics.length === 0) return { questions: [], totalCount: 0, subjectStats: {} }
  
  const topicIds = topics.map(t => t.id)
  
  // Zor ve efsane soruları getir
  const { data: questions, count } = await supabase
    .from('questions')
    .select('id, question_text, options, correct_answer, difficulty, topic_id', { count: 'exact' })
    .in('topic_id', topicIds)
    .in('difficulty', ['hard', 'legendary'])
    .order('created_at', { ascending: false })
    .limit(100)
  
  // Ders bazlı istatistik
  const subjectStats: Record<string, number> = {}
  const topicSubjectMap = new Map<string, string>()
  
  topics.forEach(t => {
    const subject = subjects.find(s => s.id === t.subject_id)
    if (subject) {
      topicSubjectMap.set(t.id, subject.name)
    }
  })
  
  questions?.forEach(q => {
    const subjectName = topicSubjectMap.get(q.topic_id)
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

export default async function LGSEnZor100Page() {
  const { questions, totalCount, subjectStats } = await getHardQuestions()
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
  
  const hardCount = questions.filter(q => q.difficulty === 'hard').length
  const legendaryCount = questions.filter(q => q.difficulty === 'legendary').length

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', url: '/' },
          { name: 'Soru Bankası', url: '/sorular' },
          { name: 'LGS En Zor 100 Soru', url: '/sorular/lgs-en-zor-100' },
        ]}
      />
      <QuizSchema
        name="LGS En Zor 100 Soru"
        description="LGS sınavına hazırlanan 8. sınıf öğrencileri için en zorlu sorular"
        subject="LGS Dersleri"
        grade={8}
        questionCount={totalCount}
        questions={quizQuestions}
        url={`${baseUrl}/sorular/lgs-en-zor-100`}
      />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/70 text-sm mb-6">
            <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/sorular" className="hover:text-white transition-colors">Soru Bankası</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">LGS En Zor 100</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Flame className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                    LGS En Zor 100 Soru
                  </h1>
                  <span className="px-3 py-1 bg-orange-400 text-white text-sm font-semibold rounded-full">
                    LGS
                  </span>
                </div>
                <p className="text-lg text-white/90 max-w-2xl">
                  Kendini en zorlu sorularla sına! 8. sınıf müfredatından seçilmiş 
                  <strong> {hardCount} zor</strong> ve <strong>{legendaryCount} efsane</strong> seviye soru.
                </p>
              </div>
            </div>
            
            {/* CTA */}
            <Link
              href="/hizli-coz?difficulty=hard,legendary&grade=8"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              <Play className="w-5 h-5" />
              Meydan Oku
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
            <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-700">Zor</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{hardCount}</div>
              <div className="text-sm text-gray-500">soru</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-700">Efsane</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{legendaryCount}</div>
              <div className="text-sm text-gray-500">soru</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-700">Toplam</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{questions.length}</div>
              <div className="text-sm text-gray-500">soru</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-700">Veritabanı</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{totalCount.toLocaleString('tr-TR')}</div>
              <div className="text-sm text-gray-500">zor soru</div>
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
            <Flame className="w-5 h-5 text-orange-500" />
            Örnek Sorular
          </h2>
          <div className="space-y-4">
            {questions.slice(0, 5).map((question, index) => {
              const difficulty = difficultyConfig[question.difficulty as keyof typeof difficultyConfig]
              const DiffIcon = difficulty?.icon || Zap
              const options = question.options as { A: string; B: string; C: string; D: string; E?: string }
              
              return (
                <div
                  key={question.id}
                  className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">Soru {index + 1}</span>
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
              href="/hizli-coz?difficulty=hard,legendary&grade=8"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
            >
              <Play className="w-5 h-5" />
              Tüm Zor Soruları Çöz
            </Link>
          </div>
        </section>

        {/* İlgili Sayfalar */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">İlgili Sayfalar</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sorular/matematik/8-sinif"
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
            >
              8. Sınıf Matematik
            </Link>
            <Link
              href="/sorular/fen_bilimleri/8-sinif"
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
            >
              8. Sınıf Fen Bilimleri
            </Link>
            <Link
              href="/sorular/turkce/8-sinif"
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              8. Sınıf Türkçe
            </Link>
            <Link
              href="/sorular/sinav-oncesi-hizli-tekrar"
              className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition-colors text-sm"
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

