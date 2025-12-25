import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Feedback listesi (GET)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Kullanıcı kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    
    // Parametreleri al
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const userOnly = searchParams.get('userOnly') === 'true'
    
    // Query oluştur
    let query = supabase
      .from('feedback')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
    
    // Sadece kendi feedback'lerini görmek istiyorsa
    if (userOnly && user) {
      query = query.eq('user_id', user.id)
    }
    
    // Filtreleme
    if (status) {
      query = query.eq('status', status)
    }
    if (category) {
      query = query.eq('category', category)
    }
    
    // Sayfalama
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)
    
    const { data, count, error } = await query
    
    if (error) {
      console.error('Feedback listesi alınamadı:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
    
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Yeni feedback oluştur (POST)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Validasyon
    if (!body.message || body.message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Mesaj en az 10 karakter olmalıdır' },
        { status: 400 }
      )
    }
    
    // Kullanıcı bilgisi (varsa)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Feedback oluştur
    const feedbackData = {
      user_id: user?.id || null,
      name: body.name?.trim() || (user ? null : 'Anonim'),
      email: body.email?.trim() || null,
      category: body.category || 'other',
      message: body.message.trim(),
      page_url: body.page_url || null,
      status: 'new'
    }
    
    const { data, error } = await supabase
      .from('feedback')
      .insert(feedbackData)
      .select()
      .single()
    
    if (error) {
      console.error('Feedback oluşturulamadı:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Geri bildiriminiz başarıyla gönderildi!',
      data 
    })
    
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Feedback güncelle (PATCH) - Sadece admin
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Admin kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Validasyon
    if (!body.id) {
      return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })
    }
    
    // Güncellenecek alanlar
    const updateData: any = {}
    if (body.status) updateData.status = body.status
    if (body.admin_note !== undefined) updateData.admin_note = body.admin_note
    
    const { data, error } = await supabase
      .from('feedback')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()
    
    if (error) {
      console.error('Feedback güncellenemedi:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Geri bildirim güncellendi',
      data 
    })
    
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Feedback sil (DELETE) - Sadece admin
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID gerekli' }, { status: 400 })
    }
    
    // Admin kontrolü
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Feedback silinemedi:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Geri bildirim silindi' 
    })
    
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

