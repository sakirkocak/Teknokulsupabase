import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'
import { createClient } from '@/lib/supabase/server'
import { BreadcrumbSchema, QuizSchema, QuizQuestion } from '@/components/JsonLdSchema'
import TypesenseLogger from '@/components/TypesenseLogger'
import QuestionPreviewList from '@/components/QuestionPreviewList'
import { 
  BookOpen, Calculator, Beaker, Globe, Languages, 
  Atom, FlaskConical, Leaf, History, BookText,
  ChevronRight, CheckCircle, Star, Zap, Crown,
  ArrowLeft, Play, Target, Sparkles, Monitor, Palette, 
  Music, Dumbbell, HeartPulse, Hammer
} from 'lucide-react'

// difficultyConfig kaldırıldı - QuestionPreviewList'te kullanılıyor

// ISR - 1 saat cache (şimşek hız!)
export const revalidate = 3600

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

const subjectIcons: Record<string, React.ReactNode> = {
  'matematik': <Calculator className="w-6 h-6" />,
  'turkce': <BookText className="w-6 h-6" />,
  'fen_bilimleri': <Beaker className="w-6 h-6" />,
  'sosyal_bilgiler': <Globe className="w-6 h-6" />,
  'ingilizce': <Languages className="w-6 h-6" />,
  'fizik': <Atom className="w-6 h-6" />,
  'kimya': <FlaskConical className="w-6 h-6" />,
  'biyoloji': <Leaf className="w-6 h-6" />,
  'inkilap_tarihi': <History className="w-6 h-6" />,
  'din_kulturu': <BookOpen className="w-6 h-6" />,
  'bilisim': <Monitor className="w-6 h-6" />,
  'gorsel_sanatlar': <Palette className="w-6 h-6" />,
  'muzik': <Music className="w-6 h-6" />,
  'beden_egitimi': <Dumbbell className="w-6 h-6" />,
  'saglik_bilgisi': <HeartPulse className="w-6 h-6" />,
  'teknoloji_tasarim': <Hammer className="w-6 h-6" />,
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

// Varsayılan renkler
const defaultColors = { gradient: 'from-gray-500 to-gray-600', light: 'bg-gray-50', text: 'text-gray-600' }

const difficultyConfig = {
  easy: { label: 'Kolay', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  medium: { label: 'Orta', color: 'bg-yellow-100 text-yellow-700', icon: Star },
  hard: { label: 'Zor', color: 'bg-orange-100 text-orange-700', icon: Zap },
  legendary: { label: 'Efsane', color: 'bg-purple-100 text-purple-700', icon: Crown },
}

interface Props {
  params: Promise<{ subject: string; grade: string }>
}

function parseGrade(gradeParam: string): number | null {
  // "8-sinif" formatından sadece sayıyı al
  const match = gradeParam.match(/^(\d+)-sinif$/)
  if (match) {
    const grade = parseInt(match[1], 10)
    if (grade >= 1 && grade <= 12) {
      return grade
    }
  }
  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject, grade: gradeParam } = await params
  const grade = parseGrade(gradeParam)
  
  if (!grade) {
    return { title: 'Sayfa Bulunamadı' }
  }
  
  // Veritabanından ders bilgisini çek
  const subjectInfo = await getSubjectInfo(subject)
  
  if (!subjectInfo) {
    return { title: 'Ders Bulunamadı' }
  }
  
  const isLGS = grade === 8
  const isYKS = grade === 12
  const examLabel = isLGS ? ' (LGS)' : isYKS ? ' (YKS)' : ''
  
  const title = `${grade}. Sınıf ${subjectInfo.name} Soruları${examLabel} | Teknokul`
  const description = `${grade}. sınıf ${subjectInfo.name} soruları - MEB müfredatına uygun, zorluk seviyelerine göre ayrılmış kapsamlı soru bankası.${isLGS ? ' LGS hazırlık soruları.' : ''}${isYKS ? ' YKS hazırlık soruları.' : ''}`
  
  return {
    title,
    description,
    keywords: [
      `${grade}. sınıf ${subjectInfo.name.toLowerCase()} soruları`,
      `${subjectInfo.name.toLowerCase()} test`,
      isLGS ? 'LGS soruları' : '',
      isYKS ? 'YKS soruları' : '',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url: `https://www.teknokul.com.tr/sorular/${subject}/${grade}-sinif`,
      type: 'website',
    },
    alternates: {
      canonical: `https://www.teknokul.com.tr/sorular/${subject}/${grade}-sinif`,
    },
  }
}

export async function generateStaticParams() {
  // Popüler kombinasyonları statik olarak oluştur
  const popularSubjects = [
    'matematik', 'turkce', 'fen_bilimleri', 'sosyal_bilgiler', 
    'ingilizce', 'fizik', 'kimya', 'biyoloji', 
    'inkilap_tarihi', 'din_kulturu'
  ]
  const popularGrades = [5, 6, 7, 8, 9, 10, 11, 12] // En popüler sınıflar
  
  const params: { subject: string; grade: string }[] = []
  
  popularSubjects.forEach((subject) => {
    popularGrades.forEach((grade) => {
      params.push({ subject, grade: `${grade}-sinif` })
    })
  })
  
  return params
}

// ⚡ TYPESENSE - Şimşek hızında veri çekme!
async function getQuestionsDataFromTypesense(subjectCode: string, grade: number, subjectName: string) {
  try {
    // Tek sorgu ile zorluk dağılımı + konular
    const result = await typesenseClient
      .collections(COLLECTIONS.QUESTIONS)
      .documents()
      .search({
        q: '*',
        query_by: 'question_text',
        filter_by: `subject_code:=${subjectCode} && grade:=${grade}`,
        facet_by: 'difficulty,main_topic',
        per_page: 0,
        max_facet_values: 200
      })
    
    const facets = result.facet_counts || []
    const difficultyFacet = facets.find((f: any) => f.field_name === 'difficulty')
    const topicFacet = facets.find((f: any) => f.field_name === 'main_topic')
    
    // Zorluk istatistikleri
    const diffCounts = difficultyFacet?.counts || []
    const difficultyStats = {
      easy: diffCounts.find((d: any) => d.value === 'easy')?.count || 0,
      medium: diffCounts.find((d: any) => d.value === 'medium')?.count || 0,
      hard: diffCounts.find((d: any) => d.value === 'hard')?.count || 0,
      legendary: diffCounts.find((d: any) => d.value === 'legendary')?.count || 0,
    }
    
    // Konu listesi (main_topic facet'lerinden)
    const topicCounts = topicFacet?.counts || []
    const topics = topicCounts.map((t: any) => ({
      name: t.value,
      subTopics: [], // Typesense facet'te sub_topic gruplu gelmiyor, boş bırakıyoruz
      questionCount: t.count
    }))
    
    return {
      subject: { name: subjectName },
      topics,
      totalCount: result.found || 0,
      difficultyStats,
      source: 'typesense'
    }
  } catch (error) {
    console.error('⚠️ Typesense grade data error:', error)
    return null
  }
}

// Supabase fallback
async function getQuestionsDataFromSupabase(subjectCode: string, grade: number) {
  const supabase = await createClient()
  
  // Subject bilgisini al
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('code', subjectCode)
    .single()
  
  if (!subject) return null
  
  // 2 RPC sorgusunu paralel olarak çalıştır
  const [difficultyResult, topicGroupsResult] = await Promise.all([
    supabase.rpc('get_grade_difficulty_stats', { 
      p_subject_code: subjectCode, 
      p_grade: grade 
    }),
    supabase.rpc('get_grade_topic_groups', { 
      p_subject_code: subjectCode, 
      p_grade: grade 
    })
  ])
  
  // Zorluk istatistikleri
  const diffStats = difficultyResult.data?.[0] || {
    total_questions: 0,
    easy_count: 0,
    medium_count: 0,
    hard_count: 0,
    legendary_count: 0
  }
  
  const difficultyStats = {
    easy: Number(diffStats.easy_count) || 0,
    medium: Number(diffStats.medium_count) || 0,
    hard: Number(diffStats.hard_count) || 0,
    legendary: Number(diffStats.legendary_count) || 0,
  }
  
  // Topic grupları
  const topics = (topicGroupsResult.data || []).map((row: { main_topic: string; sub_topics: string[] | null; question_count: number }) => ({
    name: row.main_topic,
    subTopics: row.sub_topics || [],
    questionCount: Number(row.question_count) || 0,
  }))
  
  return {
    subject,
    topics,
    totalCount: Number(diffStats.total_questions) || 0,
    difficultyStats,
    source: 'supabase'
  }
}

// Örnek soruları ayrı çek (Supabase - detay lazım)
async function getSampleQuestions(subjectCode: string, grade: number) {
  const supabase = await createClient()
  
  const { data: subject } = await supabase
    .from('subjects')
    .select('id')
    .eq('code', subjectCode)
    .single()
  
  if (!subject) return []
  
  const { data } = await supabase
    .from('questions')
    .select(`
      id, question_text, options, correct_answer, difficulty, topic_id,
      topics!inner(subject_id, grade)
    `)
    .eq('topics.subject_id', subject.id)
    .eq('topics.grade', grade)
    .order('created_at', { ascending: false })
    .limit(20)
  
  return data || []
}

// Ana data fetcher - Typesense öncelikli (DOĞRUDAN ÇAĞIR!)
async function getQuestionsData(subjectCode: string, grade: number) {
  const startTime = Date.now()
  const supabase = await createClient()
  
  // Subject bilgisini al (Supabase'den - hızlı, küçük sorgu)
  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('code', subjectCode)
    .single()
  
  if (!subject) return null
  
  // Typesense'i DOĞRUDAN dene
  let statsData = null
  try {
    console.log(`🔍 [${subjectCode}/${grade}] Trying Typesense...`)
    statsData = await getQuestionsDataFromTypesense(subjectCode, grade, subject.name)
    if (statsData) {
      console.log(`⚡ [${subjectCode}/${grade}] Stats from Typesense: ${Date.now() - startTime}ms`)
    }
  } catch (error) {
    console.error(`❌ [${subjectCode}/${grade}] Typesense FAILED:`, error)
  }
  
  // Typesense başarısızsa Supabase fallback
  if (!statsData) {
    console.log(`📊 [${subjectCode}/${grade}] Falling back to Supabase...`)
    statsData = await getQuestionsDataFromSupabase(subjectCode, grade)
  }
  
  if (!statsData) return null
  
  // Örnek soruları Supabase'den çek (detay lazım - options, correct_answer)
  const questions = await getSampleQuestions(subjectCode, grade)
  
  return {
    ...statsData,
    subject,
    questions
  }
}

export default async function GradePage({ params }: Props) {
  const { subject, grade: gradeParam } = await params
  const grade = parseGrade(gradeParam)
  
  if (!grade) {
    notFound()
  }
  
  const data = await getQuestionsData(subject, grade)
  
  if (!data) {
    notFound()
  }
  
  // Subject bilgisi artık data içinden geliyor
  const subjectName = data.subject.name
  
  const colors = subjectColors[subject] || defaultColors
  const icon = subjectIcons[subject] || <BookOpen className="w-6 h-6" />
  const baseUrl = 'https://www.teknokul.com.tr'
  
  const isLGS = grade === 8
  const isYKS = grade === 12
  const examLabel = isLGS ? ' (LGS)' : isYKS ? ' (YKS)' : ''
  
  // Quiz Schema için soruları hazırla
  const quizQuestions: QuizQuestion[] = data.questions.map((q) => {
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
      <TypesenseLogger 
        source={data.source || 'unknown'} 
        page={`/sorular/${subject}/${grade}-sinif`}
        data={{ topics: data.topics?.length, questions: data.totalCount }}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', url: '/' },
          { name: 'Soru Bankası', url: '/sorular' },
          { name: subjectName, url: `/sorular/${subject}` },
          { name: `${grade}. Sınıf`, url: `/sorular/${subject}/${grade}-sinif` },
        ]}
      />
      <QuizSchema
        name={`${grade}. Sınıf ${subjectName} Soruları${examLabel}`}
        description={`${grade}. sınıf ${subjectName} soruları - MEB müfredatına uygun ${data.totalCount} soru`}
        subject={subjectName}
        grade={grade}
        questionCount={data.totalCount}
        questions={quizQuestions}
        url={`${baseUrl}/sorular/${subject}/${grade}-sinif`}
      />
      
      {/* Header */}
      <header className={`bg-gradient-to-r ${colors.gradient} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-white/70 text-sm mb-6 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/sorular" className="hover:text-white transition-colors">Soru Bankası</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/sorular/${subject}`} className="hover:text-white transition-colors">{subjectName}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">{grade}. Sınıf</span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                {icon}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
                    {grade}. Sınıf {subjectName}
                  </h1>
                  {(isLGS || isYKS) && (
                    <span className={`px-3 py-1 ${isLGS ? 'bg-orange-500' : 'bg-purple-500'} text-white text-sm font-semibold rounded-full`}>
                      {isLGS ? 'LGS' : 'YKS'}
                    </span>
                  )}
                  {data.source === 'typesense' && (
                    <span className="inline-flex items-center gap-1 text-sm font-normal bg-white/20 px-3 py-1 rounded-full">
                      <Zap className="w-4 h-4" />
                      Turbo
                    </span>
                  )}
                </div>
                <p className="text-lg text-white/90">
                  MEB müfredatına uygun {data.totalCount.toLocaleString('tr-TR')} soru
                </p>
              </div>
            </div>
            
            {/* CTA */}
            <Link
              href={`/hizli-coz?subject=${subject}&grade=${grade}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              <Play className="w-5 h-5" />
              Hemen Çöz
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link 
          href={`/sorular/${subject}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {subjectName} - Tüm Sınıflara Dön
        </Link>

        {/* Zorluk Dağılımı */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Zorluk Dağılımı</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(difficultyConfig).map(([key, config]) => {
              const count = data.difficultyStats[key as keyof typeof data.difficultyStats]
              const Icon = config.icon
              
              return (
                <div key={key} className={`p-4 rounded-xl ${config.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{count.toLocaleString('tr-TR')}</div>
                  <div className="text-sm opacity-75">soru</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Konular */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Konular ({data.topics.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.topics.map((topic: { name: string; subTopics: string[]; questionCount: number }, index: number) => (
              <div
                key={index}
                className={`p-5 rounded-xl ${colors.light} border border-gray-100 hover:shadow-md transition-all`}
              >
                <h3 className={`font-semibold ${colors.text} mb-2`}>{topic.name}</h3>
                {topic.subTopics.length > 0 && (
                  <div className="text-sm text-gray-600 mb-3">
                    {topic.subTopics.slice(0, 3).join(', ')}
                    {topic.subTopics.length > 3 && ` +${topic.subTopics.length - 3} daha`}
                  </div>
                )}
                <div className="text-sm font-medium text-gray-500">
                  {topic.questionCount.toLocaleString('tr-TR')} soru
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Örnek Sorular */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Örnek Sorular
          </h2>
          
          <QuestionPreviewList 
            questions={data.questions.map(q => ({
              id: q.id,
              question_text: q.question_text,
              options: q.options as { A: string; B: string; C: string; D: string; E?: string },
              difficulty: q.difficulty
            }))}
            subject={subject}
            grade={grade}
          />
          
          {data.totalCount > 5 && (
            <div className="text-center mt-6">
              <Link
                href={`/hizli-coz?subject=${subject}&grade=${grade}`}
                className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${colors.gradient} text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg`}
              >
                <Play className="w-5 h-5" />
                Tüm {data.totalCount.toLocaleString('tr-TR')} Soruyu Çöz
              </Link>
            </div>
          )}
        </section>

        {/* İlgili Sayfalar */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">İlgili Sayfalar</h2>
          <div className="flex flex-wrap gap-3">
            {grade > 1 && (
              <Link
                href={`/sorular/${subject}/${grade - 1}-sinif`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                ← {grade - 1}. Sınıf {subjectName}
              </Link>
            )}
            {grade < 12 && (
              <Link
                href={`/sorular/${subject}/${grade + 1}-sinif`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                {grade + 1}. Sınıf {subjectName} →
              </Link>
            )}
            <Link
              href="/sorular/lgs-en-zor-100"
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
            >
              LGS En Zor 100 Soru
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

