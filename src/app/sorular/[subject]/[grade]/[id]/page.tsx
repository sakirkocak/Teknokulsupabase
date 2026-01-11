import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { BreadcrumbSchema, QuizSchema, LearningResourceSchema, EducationalQuestionSchema } from '@/components/JsonLdSchema'
import MathRenderer from '@/components/MathRenderer'
import VideoSolutionButton from '@/components/VideoSolutionButton'
import InteractiveSolutionButton from '@/components/InteractiveSolutionButton'
import JarvisSolutionButton from '@/components/JarvisSolutionButton'
import { 
  BookOpen, Calculator, Beaker, Globe, Languages, 
  Atom, FlaskConical, Leaf, History, BookText,
  ChevronRight, CheckCircle, XCircle, Star, Zap,
  ArrowLeft, ArrowRight, Target, Sparkles, Clock,
  Share2, Bookmark, ThumbsUp, MessageCircle, Video
} from 'lucide-react'

// ISR - 1 saat cache (şimşek hız için!)
// Soru içeriği nadiren değişir, cache'lenebilir
export const revalidate = 3600

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

// Ders renkleri (dinamik dersler için de varsayılan mevcut)
const subjectColors: Record<string, string> = {
  'matematik': 'red',
  'turkce': 'blue',
  'fen_bilimleri': 'green',
  'sosyal_bilgiler': 'orange',
  'ingilizce': 'purple',
  'fizik': 'indigo',
  'kimya': 'pink',
  'biyoloji': 'emerald',
  'inkilap_tarihi': 'amber',
  'din_kulturu': 'teal',
  'bilisim': 'cyan',
  'gorsel_sanatlar': 'fuchsia',
  'muzik': 'violet',
  'beden_egitimi': 'lime',
  'saglik_bilgisi': 'rose',
  'teknoloji_tasarim': 'slate',
}

// Varsayılan renk
const defaultColor = 'gray'

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
  
  // Soru detayı + SEO bilgilerini al
  const [questionResult, seoResult] = await Promise.all([
    supabase.rpc('get_question_detail', { p_question_id: id }),
    supabase
      .from('questions')
      .select('is_indexed, index_score, seo_title, seo_description')
      .eq('id', id)
      .single()
  ])
  
  const question = questionResult.data?.[0]
  const seoData = seoResult.data
  
  if (!question) {
    return { title: 'Soru Bulunamadı' }
  }
  
  const gradeNum = grade.replace('-sinif', '')
  const questionPreview = question.question_text.substring(0, 100) + '...'
  
  // 🚪 SEO KAPISI: is_indexed false ise noindex
  // Varsayılan: noindex (güvenli taraf)
  const isIndexed = seoData?.is_indexed === true
  
  // Özel SEO başlık/açıklama varsa kullan
  const seoTitle = seoData?.seo_title || `${gradeNum}. Sınıf ${question.subject_name} Sorusu - ${question.main_topic} | Teknokul`
  const seoDescription = seoData?.seo_description || `${questionPreview} MEB müfredatına uygun ${question.subject_name} sorusu. Çözümlü ve açıklamalı.`
  
  return {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      `${gradeNum}. sınıf ${question.subject_name.toLowerCase()} soruları`,
      `${question.main_topic} soruları`,
      question.sub_topic || '',
      'çözümlü sorular',
      'MEB müfredat',
    ].filter(Boolean),
    // 🚪 NOINDEX KAPISI - Kritik!
    robots: {
      index: isIndexed,
      follow: true, // Her zaman follow (link keşfi için)
      googleBot: {
        index: isIndexed,
        follow: true,
      },
    },
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
    const [questionResult, relatedResult, videoResult] = await Promise.all([
      supabase.rpc('get_question_detail', { p_question_id: questionId }),
      supabase.rpc('get_related_questions', { p_question_id: questionId, p_limit: 5 }),
      // Video bilgilerini al
      supabase
        .from('questions')
        .select('video_status, video_solution_url, video_storage_url')
        .eq('id', questionId)
        .single(),
    ])
    
    if (questionResult.error) {
      console.error('get_question_detail error:', questionResult.error)
    }
    if (relatedResult.error) {
      console.error('get_related_questions error:', relatedResult.error)
    }
    
    // Video bilgilerini question'a ekle
    const question = questionResult.data?.[0] || null
    if (question && videoResult.data) {
      question.video_status = videoResult.data.video_status
      question.video_solution_url = videoResult.data.video_solution_url
      question.video_storage_url = videoResult.data.video_storage_url
    }
    
    return {
      question,
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
  
  const gradeNum = parseInt(grade.replace('-sinif', ''))
  if (isNaN(gradeNum)) {
    notFound()
  }
  
  const { question, relatedQuestions } = await getQuestionData(id)
  
  if (!question) {
    notFound()
  }
  
  // Ders bilgisi artık question'dan geliyor (RPC'den)
  const subjectName = question.subject_name
  const subjectColor = subjectColors[subject] || defaultColor
  
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
          { name: subjectName, url: `/sorular/${subject}` },
          { name: `${gradeNum}. Sınıf`, url: `/sorular/${subject}/${grade}` },
          { name: question.main_topic, url: `/sorular/${subject}/${grade}` },
        ]}
      />
      <QuizSchema
        name={`${gradeNum}. Sınıf ${subjectName} - ${question.main_topic}`}
        description={question.question_text.substring(0, 200)}
        subject={subjectName}
        grade={gradeNum}
        questionCount={1}
        url={`${baseUrl}/sorular/${subject}/${grade}/${id}`}
        questions={[{
          text: question.question_text,
          options: optionKeys.map(k => options[k]).filter((v): v is string => Boolean(v)),
          correctAnswer: options[question.correct_answer as keyof typeof options] || '',
        }]}
      />
      
      {/* LearningResource Schema - Eğitim kaynağı olarak işaretle */}
      <LearningResourceSchema
        name={`${gradeNum}. Sınıf ${subjectName} Sorusu - ${question.main_topic}`}
        description={`${question.question_text.substring(0, 150)}... MEB müfredatına uygun ${subjectName} sorusu.`}
        url={`${baseUrl}/sorular/${subject}/${grade}/${id}`}
        subject={subjectName}
        grade={gradeNum}
        learningResourceType="Çözümlü Soru"
        keywords={[
          `${gradeNum}. sınıf ${subjectName.toLowerCase()}`,
          question.main_topic,
          question.sub_topic || '',
          'çözümlü sorular',
          'MEB müfredat',
        ].filter(Boolean)}
        hasSolution={!!question.explanation}
        hasVideo={!!(question.video_storage_url || question.video_solution_url)}
      />
      
      {/* EducationalQuestion Schema - Detaylı soru bilgisi */}
      <EducationalQuestionSchema
        questionText={question.question_text}
        subject={subjectName}
        grade={gradeNum}
        topic={question.main_topic}
        difficulty={question.difficulty}
        options={optionKeys.filter(k => options[k]).map(k => ({ key: k, value: options[k]! }))}
        correctAnswer={question.correct_answer}
        explanation={question.explanation}
        url={`${baseUrl}/sorular/${subject}/${grade}/${id}`}
        hasVideo={!!(question.video_storage_url || question.video_solution_url)}
        solveCount={question.solve_count}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        {/* Header */}
        <header className={`bg-gradient-to-r from-${subjectColor}-500 to-${subjectColor}-600 text-white`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-white/70 text-sm mb-4 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/sorular" className="hover:text-white transition-colors">Soru Bankası</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href={`/sorular/${subject}`} className="hover:text-white transition-colors">{subjectName}</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href={`/sorular/${subject}/${grade}`} className="hover:text-white transition-colors">{gradeNum}. Sınıf</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white font-medium truncate max-w-[150px]">{question.main_topic}</span>
            </nav>
            
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className={`px-3 py-1 bg-white/20 rounded-full text-sm font-medium`}>
                    {subjectName}
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
                  <span className={`p-2 bg-${subjectColor}-100 text-${subjectColor}-600 rounded-lg`}>
                    <BookOpen className="w-5 h-5" />
                  </span>
                  <span className="text-sm text-gray-500">{gradeNum}. Sınıf {subjectName}</span>
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
            
            {/* Video Çözüm */}
            <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-t border-purple-100">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-sm font-semibold text-purple-800 mb-1 flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Video Çözüm
                  </h3>
                  <p className="text-xs text-purple-600">
                    {question.video_storage_url || question.video_solution_url 
                      ? 'Bu sorunun video çözümü hazır!' 
                      : 'AI ile video çözüm oluştur'}
                  </p>
                </div>
                <VideoSolutionButton
                  questionId={question.id}
                  videoUrl={question.video_solution_url}
                  videoStorageUrl={question.video_storage_url}
                  videoStatus={question.video_status || 'none'}
                />
              </div>
            </div>

            {/* İnteraktif Çözüm */}
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-cyan-50 border-t border-indigo-100">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-sm font-semibold text-indigo-800 mb-1 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    İnteraktif Çözüm
                  </h3>
                  <p className="text-xs text-indigo-600">
                    Adım adım, sesli ve animasyonlu çözüm. Quiz ile kendini test et!
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <InteractiveSolutionButton
                    questionId={question.id}
                    questionText={question.question_text}
                    subjectName={subjectName}
                  />
                  <JarvisSolutionButton
                    questionId={question.id}
                    questionText={question.question_text}
                    subject={subject}
                    options={options}
                    correctAnswer={question.correct_answer}
                    explanation={question.explanation}
                    grade={gradeNum}
                  />
                </div>
              </div>
            </div>
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
                        <span className={`p-2 bg-${subjectColor}-100 text-${subjectColor}-600 rounded-lg`}>
                          <BookOpen className="w-4 h-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-600 line-clamp-2 group-hover:text-gray-900 transition-colors">
                            <MathRenderer text={q.question_text.substring(0, 150)} />
                          </div>
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
              Tüm {gradeNum}. Sınıf {subjectName} Soruları
            </Link>
            <Link
              href={`/sorular/${subject}`}
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Tüm {subjectName} Soruları
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    </>
  )
}

