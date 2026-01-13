import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Auth kontrolü
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Admin kontrolü
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin' && profile?.role !== 'ogretmen') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { questionId, fixedQuestionText, fixedExplanation, fixedOptions } = body
    
    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
    }
    
    // Güncellenecek alanları hazırla
    const updateData: Record<string, any> = {}
    
    if (fixedQuestionText !== undefined) {
      updateData.question_text = fixedQuestionText
    }
    if (fixedExplanation !== undefined) {
      updateData.explanation = fixedExplanation
    }
    if (fixedOptions !== undefined) {
      updateData.options = fixedOptions
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }
    
    // Veritabanını güncelle
    const { data, error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', questionId)
      .select('id, question_text, explanation, options')
      .single()
    
    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Soru başarıyla güncellendi',
      data
    })
    
  } catch (error: any) {
    console.error('Apply API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Toplu düzeltme için
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Auth kontrolü
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Admin kontrolü
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can do batch updates' }, { status: 403 })
    }
    
    const body = await request.json()
    const { fixes } = body // Array of { questionId, fixedQuestionText, fixedExplanation, fixedOptions }
    
    if (!fixes || !Array.isArray(fixes) || fixes.length === 0) {
      return NextResponse.json({ error: 'fixes array is required' }, { status: 400 })
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }
    
    for (const fix of fixes) {
      try {
        const updateData: Record<string, any> = {}
        
        if (fix.fixedQuestionText !== undefined) {
          updateData.question_text = fix.fixedQuestionText
        }
        if (fix.fixedExplanation !== undefined) {
          updateData.explanation = fix.fixedExplanation
        }
        if (fix.fixedOptions !== undefined) {
          updateData.options = fix.fixedOptions
        }
        
        if (Object.keys(updateData).length === 0) continue
        
        const { error } = await supabase
          .from('questions')
          .update(updateData)
          .eq('id', fix.questionId)
        
        if (error) {
          results.failed++
          results.errors.push(`${fix.questionId}: ${error.message}`)
        } else {
          results.success++
        }
      } catch (err: any) {
        results.failed++
        results.errors.push(`${fix.questionId}: ${err.message}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `${results.success} soru güncellendi, ${results.failed} başarısız`,
      results
    })
    
  } catch (error: any) {
    console.error('Batch Apply API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
