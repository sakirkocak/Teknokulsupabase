import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { BreadcrumbSchema, QuizSchema } from '@/components/JsonLdSchema'
import MathRenderer from '@/components/MathRenderer'
import { 
  BookOpen, Calculator, Beaker, Globe, Languages, 
  Atom, FlaskConical, Leaf, History, BookText,
  ChevronRight, CheckCircle, XCircle, Star, Zap,
  ArrowLeft, ArrowRight, Target, Sparkles, Clock,
  Share2, Bookmark, ThumbsUp, MessageCircle
} from 'lucide-react'

// Fully dynamic - no caching issues
export const dynamic = 'force-dynamic'

// Cookie-free Supabase client for public pages
function createPublicClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
    }
  )
}

const subjectMeta: Record<string, { name: string; color: string }> = {
  'matematik': { name: 'Matematik', color: 'red' },
  'turkce': { name: 'Türkçe', color: 'blue' },
  'fen_bilimleri': { name: 'Fen Bilimleri', color: 'green' },
  'sosyal_bilgiler': { name: 'Sosyal Bilgiler', color: 'orange' },
  'ingilizce': { name: 'İngilizce', color: 'purple' },
  'fizik': { name: 'Fizik', color: 'indigo' },
  'kimya': { name: 'Kimya', color: 'pink' },
  'biyoloji': { name: 'Biyoloji', color: 'emerald' },
  'inkilap_tarihi': { name: 'İnkılap Tarihi', color: 'amber' },
  'din_kulturu': { name: 'Din Kültürü', color: 'teal' },
}

const difficultyConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'easy': { label: 'Kolay', color: 'green', icon: <Star className="w-4 h-4" /> },
  'medium': { label: 'Orta', color: 'yellow', icon: <Zap className="w-4 h-4" /> },
  'hard': { label: 'Zor', color: 'orange', icon: <Target className="w-4 h-4" /> },
  'legendary': { label: 'Efsanevi', color: 'red', icon: <Sparkles className="w-4 h-4" /> },
}

interface Props {
  params: Promise<{ subject: string; grade: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject, grade, id } = await params
  const supabase = createPublicClient()
  
  const { data } = await supabase.rpc('get_question_detail', { p_question_id: id })
  const question = data?.[0]
  
  if (!question) {
    return { title: 'Soru Bulunamadı' }
  }
  
  const gradeNum = grade.replace('-sinif', '')
  const questionPreview = question.question_text.substring(0, 100) + '...'
  
  return {
    title: `${gradeNum}. Sınıf ${question.subject_name} Sorusu - ${question.main_topic} | Teknokul`,
    description: `${questionPreview} MEB müfredatına uygun ${question.subject_name} sorusu. Çözümlü ve açıklamalı.`,
    keywords: [
      `${gradeNum}. sınıf ${question.subject_name.toLowerCase()} soruları`,
      `${question.main_topic} soruları`,
      question.sub_topic || '',
      'çözümlü sorular',
      'MEB müfredat',
    ].filter(Boolean),
    openGraph: {
      title: `${gradeNum}. Sınıf ${question.subject_name} Sorusu | Teknokul`,
      description: questionPreview,
      url: `https://www.teknokul.com.tr/sorular/${subject}/${grade}/${id}`,
      type: 'article',
    },
    alternates: {
      canonical: `https://www.teknokul.com.tr/sorular/${subject}/${grade}/${id}`,
    },
  }
}

// Popüler soruları önceden oluştur (on-demand için boş bırakılabilir)
export async function generateStaticParams() {
  // İlk etapta boş bırakıyoruz - tüm sayfalar on-demand oluşturulacak
  // İleride en çok çözülen 100 soruyu buraya ekleyebiliriz
  return []
}

async function getQuestionData(questionId: string) {
  try {
    const supabase = createPublicClient()
    
    // Paralel sorgular
    const [questionResult, relatedResult] = await Promise.all([
      supabase.rpc('get_question_detail', { p_question_id: questionId }),
      supabase.rpc('get_related_questions', { p_question_id: questionId, p_limit: 5 }),
    ])
    
    if (questionResult.error) {
      console.error('get_question_detail error:', questionResult.error)
    }
    if (relatedResult.error) {
      console.error('get_related_questions error:', relatedResult.error)
    }
    
    return {
      question: questionResult.data?.[0] || null,
      relatedQuestions: relatedResult.data || [],
    }
  } catch (error) {
    console.error('getQuestionData exception:', error)
    return {
      question: null,
      relatedQuestions: [],
    }
  }
}

export default async function SingleQuestionPage({ params }: Props) {
  const { subject, grade, id } = await params
  const meta = subjectMeta[subject]
  
  if (!meta) {
    notFound()
  }
  
  const gradeNum = parseInt(grade.replace('-sinif', ''))
  if (isNaN(gradeNum)) {
    notFound()
  }
  
  const { question, relatedQuestions } = await getQuestionData(id)
  
  if (!question) {
    notFound()
  }
  
  const difficulty = difficultyConfig[question.difficulty] || difficultyConfig['medium']
  const baseUrl = 'https://www.teknokul.com.tr'
  
  // Şıkları parse et
  const options = question.options as { A: string; B: string; C: string; D: string; E?: string }
  const optionKeys = Object.keys(options) as ('A' | 'B' | 'C' | 'D' | 'E')[]
  
  return (
    <>
      {/* Schema Markup */}
      <BreadcrumbSchema
        items={[
          { name: 'Ana Sayfa', url: '/' },
          { name: 'Soru Bankası', url: '/sorular' },
          { name: meta.name, url: `/sorular/${subject}` },
          { name: `${gradeNum}. Sınıf`, url: `/sorular/${subject}/${grade}` },
          { name: question.main_topic, url: `/sorular/${subject}/${grade}` },
        ]}
      />
      <QuizSchema
        name={`${gradeNum}. Sınıf ${meta.name} - ${question.main_topic}`}
        description={question.question_text.substring(0, 200)}
        subject={meta.name}
        grade={gradeNum}
        questionCount={1}
        url={`${baseUrl}/sorular/${subject}/${grade}/${id}`}
        questions={[{
          text: question.question_text,
          options: optionKeys.map(k => options[k]).filter((v): v is string => Boolean(v)),
          correctAnswer: options[question.correct_answer as keyof typeof options] || '',
        }]}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        {/* Header */}
        <header className={`bg-gradient-to-r from-${meta.color}-500 to-${meta.color}-600 text-white`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-white/70 text-sm mb-4 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/sorular" className="hover:text-white transition-colors">Soru Bankası</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href={`/sorular/${subject}`} className="hover:text-white transition-colors">{meta.name}</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href={`/sorular/${subject}/${grade}`} className="hover:text-white transition-colors">{gradeNum}. Sınıf</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white font-medium truncate max-w-[150px]">{question.main_topic}</span>
            </nav>
            
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className={`px-3 py-1 bg-white/20 rounded-full text-sm font-medium`}>
                    {meta.name}
                  </span>
                  <span className={`px-3 py-1 bg-${difficulty.color}-500/30 rounded-full text-sm font-medium flex items-center gap-1`}>
                    {difficulty.icon}
                    {difficulty.label}
                  </span>
                  {question.solve_count > 0 && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {question.solve_count.toLocaleString('tr-TR')} kez çözüldü
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold">{question.main_topic}</h1>
                {question.sub_topic && (
                  <p className="text-white/80 text-sm mt-1">{question.sub_topic}</p>
                )}
              </div>
              <Link
                href={`/sorular/${subject}/${grade}`}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Tüm Sorular
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Soru Kartı */}
          <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            {/* Soru Başlığı */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`p-2 bg-${meta.color}-100 text-${meta.color}-600 rounded-lg`}>
                    <BookOpen className="w-5 h-5" />
                  </span>
                  <span className="text-sm text-gray-500">{gradeNum}. Sınıf {meta.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Paylaş">
                    <Share2 className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Kaydet">
                    <Bookmark className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              
              {/* Soru Metni */}
              <div className="prose prose-lg max-w-none">
                <MathRenderer text={question.question_text} />
              </div>
              
              {/* Soru Görseli */}
              {question.question_image_url && (
                <div className="mt-4">
                  <img
                    src={question.question_image_url}
                    alt="Soru görseli"
                    className="max-w-full h-auto rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
            
            {/* Şıklar */}
            <div className="p-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Şıklar</h3>
              {optionKeys.map((key) => {
                const isCorrect = key === question.correct_answer
                return (
                  <div
                    key={key}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isCorrect
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        isCorrect
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-gray-600 border border-gray-300'
                      }`}>
                        {key}
                      </span>
                      <div className="flex-1">
                        <MathRenderer text={options[key]} />
                      </div>
                      {isCorrect && (
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Açıklama */}
            {question.explanation && (
              <div className="p-6 bg-blue-50 border-t border-blue-100">
                <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Çözüm Açıklaması
                </h3>
                <div className="prose prose-blue max-w-none text-blue-900">
                  <MathRenderer text={question.explanation} />
                </div>
              </div>
            )}
          </article>

          {/* Hızlı Çöz CTA */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Bu konudan daha fazla soru çöz!</h3>
                <p className="text-white/80 text-sm">Interaktif soru çözümü ile pratik yap, puan kazan.</p>
              </div>
              <Link
                href={`/hizli-coz?subject=${subject}&grade=${gradeNum}`}
                className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors flex items-center gap-2"
              >
                <Target className="w-5 h-5" />
                Hızlı Çöz
              </Link>
            </div>
          </div>

          {/* Benzer Sorular */}
          {relatedQuestions.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Benzer Sorular
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedQuestions.map((q: { id: string; question_text: string; difficulty: string; main_topic: string }) => {
                  const qDiff = difficultyConfig[q.difficulty] || difficultyConfig['medium']
                  return (
                    <Link
                      key={q.id}
                      href={`/sorular/${subject}/${grade}/${q.id}`}
                      className="p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`p-2 bg-${meta.color}-100 text-${meta.color}-600 rounded-lg`}>
                          <BookOpen className="w-4 h-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-600 line-clamp-2 group-hover:text-gray-900 transition-colors">
                            {q.question_text.substring(0, 100)}...
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 bg-${qDiff.color}-100 text-${qDiff.color}-700 rounded text-xs font-medium`}>
                              {qDiff.label}
                            </span>
                            <span className="text-xs text-gray-400">{q.main_topic}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Link
              href={`/sorular/${subject}/${grade}`}
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tüm {gradeNum}. Sınıf {meta.name} Soruları
            </Link>
            <Link
              href={`/sorular/${subject}`}
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Tüm {meta.name} Soruları
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    </>
  )
}

