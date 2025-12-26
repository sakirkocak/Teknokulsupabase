import { NextRequest, NextResponse } from 'next/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'
import { createClient } from '@supabase/supabase-js'

// Supabase service role client (server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface StatsResponse {
  totalQuestions: number
  activeStudents: number
  todayQuestions: number
  bySubject: Array<{
    subject_name: string
    subject_code: string
    question_count: number
    icon: string
    color: string
  }>
  byGrade: Array<{
    grade: number
    question_count: number
  }>
  byDifficulty: {
    easy: number
    medium: number
    hard: number
    legendary: number
  }
}

/**
 * GET /api/stats
 * 
 * Sistem istatistiklerini dondurur (Typesense veya Supabase'den)
 * Ana sayfa ve admin dashboard icin kullanilir
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Typesense kullanilabilir mi kontrol et
    if (isTypesenseAvailable()) {
      const result = await getStatsFromTypesense()
      
      const duration = Date.now() - startTime
      console.log(`⚡ Stats from Typesense: ${duration}ms`)
      
      return NextResponse.json({
        ...result,
        source: 'typesense',
        duration
      })
    }
    
    // Fallback to Supabase
    const result = await getStatsFromSupabase()
    
    const duration = Date.now() - startTime
    console.log(`📊 Stats from Supabase: ${duration}ms`)
    
    return NextResponse.json({
      ...result,
      source: 'supabase',
      duration
    })
    
  } catch (error) {
    console.error('Stats error:', error)
    
    // Typesense hata verdiyse Supabase'e fallback
    try {
      const result = await getStatsFromSupabase()
      
      const duration = Date.now() - startTime
      console.log(`📊 Stats fallback to Supabase: ${duration}ms`)
      
      return NextResponse.json({
        ...result,
        source: 'supabase_fallback',
        duration
      })
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Istatistikler yuklenemedi', details: (fallbackError as Error).message },
        { status: 500 }
      )
    }
  }
}

// Typesense'den istatistikler
async function getStatsFromTypesense(): Promise<StatsResponse> {
  // Questions collection'dan facet sorgusu
  const questionsResult = await typesenseClient
    .collections(COLLECTIONS.QUESTIONS)
    .documents()
    .search({
      q: '*',
      query_by: 'question_text',
      per_page: 0,
      facet_by: 'subject_name,subject_code,grade,difficulty',
      max_facet_values: 50
    })

  // Leaderboard collection'dan ogrenci sayisi
  const leaderboardResult = await typesenseClient
    .collections(COLLECTIONS.LEADERBOARD)
    .documents()
    .search({
      q: '*',
      query_by: 'full_name',
      per_page: 0
    })

  const facets = questionsResult.facet_counts || []
  
  // Toplam soru sayisi
  const totalQuestions = questionsResult.found || 0
  
  // Aktif ogrenci sayisi
  const activeStudents = leaderboardResult.found || 0
  
  // Ders bazli dagilim
  const subjectFacet = facets.find((f: any) => f.field_name === 'subject_name')
  const subjectCodeFacet = facets.find((f: any) => f.field_name === 'subject_code')
  
  const bySubject = (subjectFacet?.counts || []).map((item: any, idx: number) => ({
    subject_name: item.value,
    subject_code: subjectCodeFacet?.counts?.[idx]?.value || item.value,
    question_count: item.count,
    icon: getSubjectIcon(item.value),
    color: getSubjectColor(item.value)
  })).sort((a: any, b: any) => b.question_count - a.question_count)
  
  // Sinif bazli dagilim
  const gradeFacet = facets.find((f: any) => f.field_name === 'grade')
  const byGrade = (gradeFacet?.counts || [])
    .map((item: any) => ({
      grade: parseInt(item.value),
      question_count: item.count
    }))
    .sort((a: any, b: any) => a.grade - b.grade)
  
  // Zorluk bazli dagilim
  const difficultyFacet = facets.find((f: any) => f.field_name === 'difficulty')
  const byDifficulty = { easy: 0, medium: 0, hard: 0, legendary: 0 }
  ;(difficultyFacet?.counts || []).forEach((item: any) => {
    if (item.value in byDifficulty) {
      byDifficulty[item.value as keyof typeof byDifficulty] = item.count
    }
  })

  // Bugun cozulen sorular (Supabase'den - Typesense'de bu veri yok)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { count: todayQuestions } = await supabase
    .from('point_history')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())
    .eq('source', 'question')

  return {
    totalQuestions,
    activeStudents,
    todayQuestions: todayQuestions || 0,
    bySubject,
    byGrade,
    byDifficulty
  }
}

// Supabase'den istatistikler (fallback)
async function getStatsFromSupabase(): Promise<StatsResponse> {
  // Paralel sorgular
  const [
    totalQuestionsRes,
    activeStudentsRes,
    todayQuestionsRes,
    subjectsRes
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('student_points').select('*', { count: 'exact', head: true }).gt('total_questions', 0),
    supabase.from('point_history').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
      .eq('source', 'question'),
    supabase.from('subjects').select('id, name, code, icon, color')
  ])

  const totalQuestions = totalQuestionsRes.count || 0
  const activeStudents = activeStudentsRes.count || 0
  const todayQuestions = todayQuestionsRes.count || 0

  // Ders bazli soru sayilari (basit versiyon)
  const bySubject = (subjectsRes.data || []).map(subject => ({
    subject_name: subject.name,
    subject_code: subject.code,
    question_count: 0, // Detayli count icin ayri sorgu gerekir
    icon: subject.icon || getSubjectIcon(subject.name),
    color: subject.color || getSubjectColor(subject.name)
  }))

  return {
    totalQuestions,
    activeStudents,
    todayQuestions,
    bySubject,
    byGrade: [],
    byDifficulty: { easy: 0, medium: 0, hard: 0, legendary: 0 }
  }
}

// Ders ikonlari
function getSubjectIcon(subjectName: string): string {
  const icons: Record<string, string> = {
    'Matematik': '🔢',
    'Fen Bilimleri': '🔬',
    'Türkçe': '📖',
    'İngilizce': '🇬🇧',
    'Din Kültürü ve Ahlak Bilgisi': '☪️',
    'Sosyal Bilgiler': '🌍',
    'T.C. İnkılap Tarihi ve Atatürkçülük': '🏛️',
    'Fizik': '⚡',
    'Kimya': '🧪',
    'Biyoloji': '🧬',
    'Tarih': '📜',
    'Coğrafya': '🗺️',
    'Türk Dili ve Edebiyatı': '📚',
    'Bilişim Teknolojileri': '💻',
    'Felsefe': '🤔',
  }
  return icons[subjectName] || '📚'
}

// Ders renkleri
function getSubjectColor(subjectName: string): string {
  const colors: Record<string, string> = {
    'Matematik': 'blue',
    'Fen Bilimleri': 'green',
    'Türkçe': 'red',
    'İngilizce': 'purple',
    'Din Kültürü ve Ahlak Bilgisi': 'emerald',
    'Sosyal Bilgiler': 'amber',
    'T.C. İnkılap Tarihi ve Atatürkçülük': 'orange',
    'Fizik': 'cyan',
    'Kimya': 'pink',
    'Biyoloji': 'lime',
    'Tarih': 'yellow',
    'Coğrafya': 'teal',
    'Türk Dili ve Edebiyatı': 'indigo',
    'Bilişim Teknolojileri': 'slate',
    'Felsefe': 'violet',
  }
  return colors[subjectName] || 'gray'
}

