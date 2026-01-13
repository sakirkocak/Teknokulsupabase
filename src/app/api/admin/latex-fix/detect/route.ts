import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Auth kontrolü
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Admin/Öğretmen kontrolü
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin' && profile?.role !== 'ogretmen') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit
    
    // Database function'ı çağır
    const { data: questions, error } = await supabase.rpc('get_broken_latex_questions', {
      page_limit: limit,
      page_offset: offset
    })
    
    if (error) {
      console.error('RPC error:', error)
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }
    
    // Sonuçları formatla
    const brokenQuestions = (questions || []).map((q: any) => {
      const issues: string[] = []
      const samples: string[] = []
      
      // Hata türüne göre etiket ekle
      switch (q.error_type) {
        case 'frac_no_backslash':
          issues.push('frac{ without backslash')
          samples.push(extractSample(q.question_text || q.explanation || '', 'frac{'))
          break
        case 'sqrt_no_backslash':
          issues.push('sqrt{ without backslash')
          samples.push(extractSample(q.question_text || q.explanation || '', 'sqrt{'))
          break
        case 'unicode_chars':
          issues.push('Unicode characters instead of LaTeX')
          samples.push(extractSample(q.question_text || q.explanation || '', 'u0'))
          break
        default:
          issues.push('LaTeX error')
      }
      
      return {
        id: q.id,
        question_text: q.question_text,
        explanation: q.explanation,
        options: q.options,
        difficulty: q.difficulty,
        created_at: q.created_at,
        hasBroken: true,
        issues,
        samples: samples.filter(s => s)
      }
    })
    
    // Toplam hatalı soru sayısını al
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
    
    return NextResponse.json({
      success: true,
      data: brokenQuestions,
      pagination: {
        page,
        limit,
        total: count || 0,
        brokenCount: brokenQuestions.length,
      }
    })
    
  } catch (error: any) {
    console.error('Detect API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Örnek metin çıkar
function extractSample(text: string, searchTerm: string): string {
  if (!text) return ''
  const index = text.indexOf(searchTerm)
  if (index === -1) return ''
  const start = Math.max(0, index - 30)
  const end = Math.min(text.length, index + 50)
  return text.substring(start, end)
}
