import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { typesenseClient, COLLECTIONS, isTypesenseAvailable } from '@/lib/typesense/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'yayinevi') {
      return NextResponse.json({ error: 'Sadece yayınevleri satın alabilir' }, { status: 403 })
    }

    const { question_id } = await request.json()
    if (!question_id) {
      return NextResponse.json({ error: 'question_id zorunlu' }, { status: 400 })
    }

    // Soru ve kredi kontrolü — race condition önlemek için sıralı kontrol
    const [questionResult, creditsResult] = await Promise.all([
      supabase
        .from('publisher_questions')
        .select('id, is_available, price_credits')
        .eq('id', question_id)
        .single(),
      supabase
        .from('publisher_credits')
        .select('balance')
        .eq('publisher_id', user.id)
        .single(),
    ])

    if (questionResult.error || !questionResult.data) {
      return NextResponse.json({ error: 'Soru bulunamadı' }, { status: 404 })
    }

    const question = questionResult.data

    if (!question.is_available) {
      return NextResponse.json({ error: 'Bu soru artık satışta değil' }, { status: 409 })
    }

    const credits = creditsResult.data
    if (!credits || credits.balance < question.price_credits) {
      return NextResponse.json({
        error: `Yetersiz kredi. Gerekli: ${question.price_credits}, Mevcut: ${credits?.balance || 0}`
      }, { status: 402 })
    }

    // Transaction benzeri sıralı güncelleme
    // 1. Soruyu satın alındı olarak işaretle
    const { error: qUpdateError } = await supabase
      .from('publisher_questions')
      .update({
        is_available: false,
        purchased_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', question_id)
      .eq('is_available', true) // Race condition guard

    if (qUpdateError) {
      return NextResponse.json({ error: 'Bu soru az önce başka biri tarafından satın alındı' }, { status: 409 })
    }

    // 2. Krediyi düş
    const { error: creditUpdateError } = await supabase
      .from('publisher_credits')
      .update({
        balance: credits.balance - question.price_credits,
        updated_at: new Date().toISOString(),
      })
      .eq('publisher_id', user.id)

    if (creditUpdateError) {
      // Geri al
      await supabase
        .from('publisher_questions')
        .update({ is_available: true, purchased_by: null })
        .eq('id', question_id)
      throw creditUpdateError
    }

    // 3. Geçmişe ekle
    await supabase.from('publisher_credit_history').insert({
      publisher_id: user.id,
      amount: -question.price_credits,
      reason: `Soru satın alma: ${question_id}`,
      question_id,
    })

    // 4. Typesense güncelle
    if (isTypesenseAvailable()) {
      try {
        await typesenseClient
          .collections(COLLECTIONS.PUBLISHER_QUESTIONS)
          .documents()
          .update({ is_available: false }, { filter_by: `id:=${question_id}` } as Record<string, string>)
      } catch {
        // Non-fatal
      }
    }

    // Tam soru detayını döndür (görsel dahil)
    const { data: fullQuestion } = await supabase
      .from('publisher_questions')
      .select('*')
      .eq('id', question_id)
      .single()

    return NextResponse.json({
      success: true,
      question: fullQuestion,
      new_balance: credits.balance - question.price_credits,
    })
  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json({ error: 'Satın alma hatası' }, { status: 500 })
  }
}
