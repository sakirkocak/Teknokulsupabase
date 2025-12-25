import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BreadcrumbSchema, QuestionListSchema } from '@/components/JsonLdSchema'
import { 
  BookOpen, Calculator, Beaker, Globe, Languages, 
  Atom, FlaskConical, Leaf, History, BookText,
  ChevronRight, GraduationCap, Sparkles, TrendingUp,
  Target, Star, Clock, Image as ImageIcon
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Soru Bankası - Tüm Dersler | Teknokul',
  description: 'MEB müfredatına uygun 30.000+ soru ile pratik yap. Matematik, Türkçe, Fen Bilimleri, Sosyal Bilgiler ve daha fazlası. 1-12. sınıf tüm konular.',
  keywords: ['soru bankası', 'test çöz', 'LGS soruları', 'YKS soruları', 'matematik soruları', 'fen bilimleri soruları'],
  openGraph: {
    title: 'Soru Bankası - Tüm Dersler | Teknokul',
    description: 'MEB müfredatına uygun 30.000+ soru ile pratik yap.',
    url: 'https://www.teknokul.com.tr/sorular',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.teknokul.com.tr/sorular',
  },
}

const subjectIcons: Record<string, React.ReactNode> = {
  'matematik': <Calculator className="w-8 h-8" />,
  'turkce': <BookText className="w-8 h-8" />,
  'fen_bilimleri': <Beaker className="w-8 h-8" />,
  'sosyal_bilgiler': <Globe className="w-8 h-8" />,
  'ingilizce': <Languages className="w-8 h-8" />,
  'fizik': <Atom className="w-8 h-8" />,
  'kimya': <FlaskConical className="w-8 h-8" />,
  'biyoloji': <Leaf className="w-8 h-8" />,
  'inkilap_tarihi': <History className="w-8 h-8" />,
  'din_kulturu': <BookOpen className="w-8 h-8" />,
}

const subjectColors: Record<string, { bg: string; text: string; border: string }> = {
  'matematik': { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  'turkce': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  'fen_bilimleri': { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  'sosyal_bilgiler': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  'ingilizce': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  'fizik': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  'kimya': { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  'biyoloji': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  'inkilap_tarihi': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  'din_kulturu': { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
}

const subjectNames: Record<string, string> = {
  'matematik': 'Matematik',
  'turkce': 'Türkçe',
  'fen_bilimleri': 'Fen Bilimleri',
  'sosyal_bilgiler': 'Sosyal Bilgiler',
  'ingilizce': 'İngilizce',
  'fizik': 'Fizik',
  'kimya': 'Kimya',
  'biyoloji': 'Biyoloji',
  'inkilap_tarihi': 'İnkılap Tarihi',
  'din_kulturu': 'Din Kültürü',
}

async function getSubjectsWithCounts() {
  const supabase = await createClient()
  
  // Dersleri getir
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, code')
    .order('name')
  
  if (!subjects) return []
  
  // Her ders için soru sayısını hesapla
  const subjectsWithCounts = await Promise.all(
    subjects.map(async (subject) => {
      const { count } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('topic_id', subject.id)
      
      // Topic'lerden soru say
      const { data: topics } = await supabase
        .from('topics')
        .select('id')
        .eq('subject_id', subject.id)
      
      let totalCount = 0
      if (topics) {
        const topicIds = topics.map(t => t.id)
        if (topicIds.length > 0) {
          const { count: questionCount } = await supabase
            .from('questions')
            .select('id', { count: 'exact', head: true })
            .in('topic_id', topicIds)
          totalCount = questionCount || 0
        }
      }
      
      return {
        ...subject,
        questionCount: totalCount,
      }
    })
  )
  
  return subjectsWithCounts.filter(s => s.questionCount > 0)
}

async function getStats() {
  const supabase = await createClient()
  
  const { count: totalQuestions } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
  
  const { count: totalTopics } = await supabase
    .from('topics')
    .select('id', { count: 'exact', head: true })
  
  const { count: imageQuestions } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .not('question_image_url', 'is', null)
  
  return {
    totalQuestions: totalQuestions || 0,
    totalTopics: totalTopics || 0,
    imageQuestions: imageQuestions || 0,
  }
}

export default async function SorularPage() {
  const [subjects, stats] = await Promise.all([
    getSubjectsWithCounts(),
    getStats(),
  ])
  
  const baseUrl = 'https://www.teknokul.com.tr'
  
  // Programatik SEO sayfaları
  const specialPages = [
    {
      title: 'LGS En Zor 100 Soru',
      description: 'Kendini sınava hazırla - en zorlu sorularla!',
      href: '/sorular/lgs-en-zor-100',
      icon: <Target className="w-6 h-6" />,
      color: 'from-red-500 to-orange-500',
    },
    {
      title: 'Sınav Öncesi Hızlı Tekrar',
      description: 'Son dakika pratik - kritik 50 soru',
      href: '/sorular/sinav-oncesi-hizli-tekrar',
      icon: <Clock className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'En Çok Çözülen Sorular',
      description: 'Öğrencilerin favorisi - popüler 100 soru',
      href: '/sorular/en-cok-cozulen',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Yeni Eklenen Sorular',
      description: 'Bu hafta eklenen taze sorular',
      href: '/sorular/yeni-eklenen-sorular',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Görselli Sorular',
      description: 'Grafik, tablo ve şema içeren sorular',
      href: '/sorular/gorselli-sorular',
      icon: <ImageIcon className="w-6 h-6" />,
      color: 'from-amber-500 to-yellow-500',
    },
  ]

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', url: '/' },
          { name: 'Soru Bankası', url: '/sorular' },
        ]}
      />
      <QuestionListSchema
        name="Teknokul Soru Bankası"
        description="MEB müfredatına uygun tüm dersler için soru bankası"
        url={`${baseUrl}/sorular`}
        items={subjects.map((subject, index) => ({
          name: subjectNames[subject.code] || subject.name,
          url: `/sorular/${subject.code}`,
          position: index + 1,
        }))}
      />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/70 text-sm mb-6">
            <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">Soru Bankası</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Soru Bankası
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                MEB müfredatına uygun <strong>{stats.totalQuestions.toLocaleString('tr-TR')}+</strong> soru ile pratik yap. 
                Tüm dersler, tüm sınıflar.
              </p>
            </div>
            
            {/* Stats */}
            <div className="flex gap-6 md:gap-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">{stats.totalQuestions.toLocaleString('tr-TR')}</div>
                <div className="text-white/70 text-sm">Soru</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">{stats.totalTopics.toLocaleString('tr-TR')}</div>
                <div className="text-white/70 text-sm">Konu</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold">{subjects.length}</div>
                <div className="text-white/70 text-sm">Ders</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Özel Koleksiyonlar */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500" />
            Özel Koleksiyonlar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {specialPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="group relative overflow-hidden rounded-2xl p-6 bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${page.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${page.color} text-white mb-4`}>
                  {page.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  {page.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {page.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Tüm Dersler */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            Tüm Dersler
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subjects.map((subject) => {
              const colors = subjectColors[subject.code] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }
              const icon = subjectIcons[subject.code] || <BookOpen className="w-8 h-8" />
              const displayName = subjectNames[subject.code] || subject.name
              
              return (
                <Link
                  key={subject.id}
                  href={`/sorular/${subject.code}`}
                  className={`group relative overflow-hidden rounded-2xl p-6 ${colors.bg} border ${colors.border} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className={`inline-flex p-3 rounded-xl bg-white shadow-sm ${colors.text} mb-4`}>
                    {icon}
                  </div>
                  <h3 className={`text-xl font-semibold ${colors.text} mb-2`}>
                    {displayName}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    1-12. sınıf müfredatına uygun sorular
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {subject.questionCount.toLocaleString('tr-TR')}
                    </span>
                    <span className="text-sm text-gray-500">soru</span>
                  </div>
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.text.replace('text', 'from')}-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                </Link>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 text-center">
          <div className="inline-flex flex-col items-center p-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Hemen Çözmeye Başla!
            </h3>
            <p className="text-gray-600 mb-4">
              Üye olmadan hızlıca soru çözebilirsin
            </p>
            <Link
              href="/hizli-coz"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
            >
              <Sparkles className="w-5 h-5" />
              Hızlı Çöz
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
              <Link href="/hizli-coz" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                Hızlı Çöz
              </Link>
              <Link href="/liderlik" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                Liderlik
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

