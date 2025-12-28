import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BreadcrumbSchema, QuestionListSchema } from '@/components/JsonLdSchema'
import { 
  BookOpen, Calculator, Beaker, Globe, Languages, 
  Atom, FlaskConical, Leaf, History, BookText,
  ChevronRight, GraduationCap, Users, Target,
  ArrowLeft, Code, Palette, Music, Dumbbell, HeartPulse,
  Hammer, Monitor
} from 'lucide-react'

// ISR - 1 saat cache
export const revalidate = 3600

// Sabit meta bilgileri (opsiyonel - veritabanındaki ders için zenginleştirilmiş SEO)
const subjectMetaEnhancements: Record<string, { description: string; keywords: string[] }> = {
  'matematik': {
    description: 'Matematik soruları - temel işlemlerden ileri matematiğe kadar tüm konular. Sayılar, geometri, cebir ve daha fazlası.',
    keywords: ['matematik soruları', 'matematik test', 'matematik pratik', 'sayılar', 'geometri', 'cebir'],
  },
  'turkce': {
    description: 'Türkçe soruları - dil bilgisi, okuma anlama, yazım kuralları. MEB müfredatına uygun kapsamlı sorular.',
    keywords: ['türkçe soruları', 'dil bilgisi', 'okuma anlama', 'paragraf soruları'],
  },
  'fen_bilimleri': {
    description: 'Fen Bilimleri soruları - fizik, kimya, biyoloji temel konuları. Deneyler, formüller ve kavramlar.',
    keywords: ['fen bilimleri soruları', 'fen test', 'LGS fen soruları'],
  },
  'sosyal_bilgiler': {
    description: 'Sosyal Bilgiler soruları - tarih, coğrafya, vatandaşlık. Türkiye ve dünya tarihi, harita bilgisi.',
    keywords: ['sosyal bilgiler soruları', 'tarih soruları', 'coğrafya soruları'],
  },
  'ingilizce': {
    description: 'İngilizce soruları - gramer, kelime, okuma anlama. Temel seviyeden ileri seviyeye.',
    keywords: ['ingilizce soruları', 'english test', 'gramer soruları'],
  },
  'fizik': {
    description: 'Fizik soruları - mekanik, elektrik, optik, modern fizik. YKS ve TYT fizik soruları.',
    keywords: ['fizik soruları', 'YKS fizik', 'TYT fizik', 'mekanik soruları'],
  },
  'kimya': {
    description: 'Kimya soruları - atomlar, bileşikler, tepkimeler. Organik ve inorganik kimya.',
    keywords: ['kimya soruları', 'YKS kimya', 'organik kimya soruları'],
  },
  'biyoloji': {
    description: 'Biyoloji soruları - hücre, genetik, ekoloji, insan biyolojisi. YKS biyoloji hazırlık.',
    keywords: ['biyoloji soruları', 'YKS biyoloji', 'genetik soruları', 'hücre soruları'],
  },
  'inkilap_tarihi': {
    description: 'T.C. İnkılap Tarihi ve Atatürkçülük soruları - Kurtuluş Savaşı, Cumhuriyet dönemi.',
    keywords: ['inkılap tarihi soruları', 'atatürk soruları', 'LGS inkılap tarihi'],
  },
  'din_kulturu': {
    description: 'Din Kültürü ve Ahlak Bilgisi soruları - inanç, ibadet, ahlak konuları.',
    keywords: ['din kültürü soruları', 'din testi'],
  },
  'bilisim': {
    description: 'Bilişim Teknolojileri soruları - programlama, algoritma, bilgisayar kullanımı.',
    keywords: ['bilişim soruları', 'bilgisayar soruları', 'programlama soruları'],
  },
  'gorsel_sanatlar': {
    description: 'Görsel Sanatlar soruları - resim, heykel, sanat tarihi, estetik.',
    keywords: ['görsel sanatlar soruları', 'resim soruları', 'sanat soruları'],
  },
  'muzik': {
    description: 'Müzik soruları - nota bilgisi, müzik tarihi, enstrümanlar.',
    keywords: ['müzik soruları', 'nota soruları', 'müzik testi'],
  },
  'beden_egitimi': {
    description: 'Beden Eğitimi soruları - spor kuralları, sağlık, hareket bilgisi.',
    keywords: ['beden eğitimi soruları', 'spor soruları'],
  },
  'saglik_bilgisi': {
    description: 'Sağlık Bilgisi soruları - ilk yardım, hijyen, sağlıklı yaşam.',
    keywords: ['sağlık bilgisi soruları', 'ilk yardım soruları'],
  },
  'teknoloji_tasarim': {
    description: 'Teknoloji ve Tasarım soruları - tasarım süreci, malzeme bilgisi, üretim.',
    keywords: ['teknoloji tasarım soruları', 'tasarım soruları'],
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
  'bilisim': <Monitor className="w-8 h-8" />,
  'gorsel_sanatlar': <Palette className="w-8 h-8" />,
  'muzik': <Music className="w-8 h-8" />,
  'beden_egitimi': <Dumbbell className="w-8 h-8" />,
  'saglik_bilgisi': <HeartPulse className="w-8 h-8" />,
  'teknoloji_tasarim': <Hammer className="w-8 h-8" />,
}

const subjectColors: Record<string, { gradient: string; light: string; text: string }> = {
  'matematik': { gradient: 'from-red-500 to-rose-600', light: 'bg-red-50', text: 'text-red-600' },
  'turkce': { gradient: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', text: 'text-blue-600' },
  'fen_bilimleri': { gradient: 'from-green-500 to-emerald-600', light: 'bg-green-50', text: 'text-green-600' },
  'sosyal_bilgiler': { gradient: 'from-orange-500 to-amber-600', light: 'bg-orange-50', text: 'text-orange-600' },
  'ingilizce': { gradient: 'from-purple-500 to-violet-600', light: 'bg-purple-50', text: 'text-purple-600' },
  'fizik': { gradient: 'from-indigo-500 to-blue-600', light: 'bg-indigo-50', text: 'text-indigo-600' },
  'kimya': { gradient: 'from-pink-500 to-rose-600', light: 'bg-pink-50', text: 'text-pink-600' },
  'biyoloji': { gradient: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50', text: 'text-emerald-600' },
  'inkilap_tarihi': { gradient: 'from-amber-500 to-orange-600', light: 'bg-amber-50', text: 'text-amber-600' },
  'din_kulturu': { gradient: 'from-teal-500 to-cyan-600', light: 'bg-teal-50', text: 'text-teal-600' },
  'bilisim': { gradient: 'from-cyan-500 to-blue-600', light: 'bg-cyan-50', text: 'text-cyan-600' },
  'gorsel_sanatlar': { gradient: 'from-fuchsia-500 to-pink-600', light: 'bg-fuchsia-50', text: 'text-fuchsia-600' },
  'muzik': { gradient: 'from-violet-500 to-purple-600', light: 'bg-violet-50', text: 'text-violet-600' },
  'beden_egitimi': { gradient: 'from-lime-500 to-green-600', light: 'bg-lime-50', text: 'text-lime-600' },
  'saglik_bilgisi': { gradient: 'from-rose-500 to-red-600', light: 'bg-rose-50', text: 'text-rose-600' },
  'teknoloji_tasarim': { gradient: 'from-slate-500 to-gray-600', light: 'bg-slate-50', text: 'text-slate-600' },
}

// Varsayılan renkler (tanımsız dersler için)
const defaultColors = { gradient: 'from-gray-500 to-gray-600', light: 'bg-gray-50', text: 'text-gray-600' }

const gradeLabels: Record<number, string> = {
  1: '1. Sınıf',
  2: '2. Sınıf',
  3: '3. Sınıf',
  4: '4. Sınıf',
  5: '5. Sınıf',
  6: '6. Sınıf',
  7: '7. Sınıf',
  8: '8. Sınıf (LGS)',
  9: '9. Sınıf',
  10: '10. Sınıf',
  11: '11. Sınıf',
  12: '12. Sınıf (YKS)',
}

interface Props {
  params: Promise<{ subject: string }>
}

// Veritabanından ders bilgisini çek
async function getSubjectInfo(subjectCode: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('subjects')
    .select('id, name, code')
    .eq('code', subjectCode)
    .single()
  
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject } = await params
  
  // Veritabanından ders bilgisini çek
  const subjectInfo = await getSubjectInfo(subject)
  
  if (!subjectInfo) {
    return { title: 'Ders Bulunamadı' }
  }
  
  // Zenginleştirilmiş meta varsa kullan, yoksa varsayılan oluştur
  const enhancement = subjectMetaEnhancements[subject]
  const description = enhancement?.description || `${subjectInfo.name} soruları - MEB müfredatına uygun kapsamlı sorular.`
  const keywords = enhancement?.keywords || [`${subjectInfo.name.toLowerCase()} soruları`, `${subjectInfo.name.toLowerCase()} test`]
  
  return {
    title: `${subjectInfo.name} Soruları - Tüm Sınıflar | Teknokul`,
    description,
    keywords,
    openGraph: {
      title: `${subjectInfo.name} Soruları | Teknokul`,
      description,
      url: `https://www.teknokul.com.tr/sorular/${subject}`,
      type: 'website',
    },
    alternates: {
      canonical: `https://www.teknokul.com.tr/sorular/${subject}`,
    },
  }
}

export async function generateStaticParams() {
  // Popüler dersleri statik olarak oluştur
  const popularSubjects = [
    'matematik', 'turkce', 'fen_bilimleri', 'sosyal_bilgiler', 
    'ingilizce', 'fizik', 'kimya', 'biyoloji', 
    'inkilap_tarihi', 'din_kulturu'
  ]
  
  return popularSubjects.map((subject) => ({ subject }))
}

async function getGradesWithCounts(subjectCode: string) {
  const supabase = await createClient()
  
  // RPC fonksiyonu ile tek sorguda tüm sınıf istatistiklerini al
  const { data, error } = await supabase
    .rpc('get_subject_grade_stats', { p_subject_code: subjectCode })
  
  if (error) {
    console.error('RPC error:', error)
    return []
  }
  
  return (data || []).map((row: { grade: number; topic_count: number; question_count: number }) => ({
    grade: row.grade,
    topicCount: row.topic_count,
    questionCount: row.question_count,
  }))
}

async function getSubjectStats(subjectCode: string) {
  const supabase = await createClient()
  
  // RPC fonksiyonu ile tek sorguda toplam istatistikleri al
  const { data, error } = await supabase
    .rpc('get_subject_total_stats', { p_subject_code: subjectCode })
  
  if (error) {
    console.error('RPC error:', error)
    return { totalQuestions: 0, totalTopics: 0 }
  }
  
  const stats = data?.[0] || { total_questions: 0, total_topics: 0 }
  return {
    totalQuestions: Number(stats.total_questions) || 0,
    totalTopics: Number(stats.total_topics) || 0,
  }
}

export default async function SubjectPage({ params }: Props) {
  const { subject } = await params
  
  // Veritabanından ders bilgisini çek
  const subjectInfo = await getSubjectInfo(subject)
  
  if (!subjectInfo) {
    notFound()
  }
  
  const [grades, stats] = await Promise.all([
    getGradesWithCounts(subject),
    getSubjectStats(subject),
  ])
  
  const colors = subjectColors[subject] || defaultColors
  const icon = subjectIcons[subject] || <BookOpen className="w-8 h-8" />
  const baseUrl = 'https://www.teknokul.com.tr'
  
  // Meta enhancement varsa description al
  const enhancement = subjectMetaEnhancements[subject]
  const description = enhancement?.description || `${subjectInfo.name} soruları - MEB müfredatına uygun kapsamlı sorular.`

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', url: '/' },
          { name: 'Soru Bankası', url: '/sorular' },
          { name: subjectInfo.name, url: `/sorular/${subject}` },
        ]}
      />
      <QuestionListSchema
        name={`${subjectInfo.name} Soruları`}
        description={description}
        url={`${baseUrl}/sorular/${subject}`}
        items={grades.map((g: { grade: number; topicCount: number; questionCount: number }, index: number) => ({
          name: `${gradeLabels[g.grade] || `${g.grade}. Sınıf`} ${subjectInfo.name}`,
          url: `/sorular/${subject}/${g.grade}-sinif`,
          position: index + 1,
        }))}
      />
      
      {/* Header */}
      <header className={`bg-gradient-to-r ${colors.gradient} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/70 text-sm mb-6">
            <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/sorular" className="hover:text-white transition-colors">Soru Bankası</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">{subjectInfo.name}</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                {icon}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
                  {subjectInfo.name} Soruları
                </h1>
                <p className="text-lg text-white/90 max-w-2xl">
                  {description}
                </p>
              </div>
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
                <div className="text-3xl md:text-4xl font-bold">{grades.length}</div>
                <div className="text-white/70 text-sm">Sınıf</div>
              </div>
            </div>
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
          Tüm Derslere Dön
        </Link>

        {/* Sınıf Listesi */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            Sınıf Seçin
          </h2>
          
          {grades.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <p className="text-gray-500">Bu ders için henüz soru eklenmemiş.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {grades.map((g: { grade: number; topicCount: number; questionCount: number }) => {
                const label = gradeLabels[g.grade] || `${g.grade}. Sınıf`
                const isLGS = g.grade === 8
                const isYKS = g.grade === 12
                
                return (
                  <Link
                    key={g.grade}
                    href={`/sorular/${subject}/${g.grade}-sinif`}
                    className={`group relative overflow-hidden rounded-2xl p-6 ${colors.light} border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                  >
                    {(isLGS || isYKS) && (
                      <div className={`absolute top-3 right-3 px-2 py-1 ${isLGS ? 'bg-orange-500' : 'bg-purple-500'} text-white text-xs font-semibold rounded-full`}>
                        {isLGS ? 'LGS' : 'YKS'}
                      </div>
                    )}
                    
                    <div className={`inline-flex p-3 rounded-xl bg-white shadow-sm ${colors.text} mb-4`}>
                      <Target className="w-6 h-6" />
                    </div>
                    
                    <h3 className={`text-xl font-semibold text-gray-900 mb-2 group-hover:${colors.text} transition-colors`}>
                      {label}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {g.topicCount} konu
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {g.questionCount.toLocaleString('tr-TR')} soru
                      </span>
                    </div>
                    
                    <div className={`text-sm font-medium ${colors.text} group-hover:underline`}>
                      Soruları Gör →
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
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

