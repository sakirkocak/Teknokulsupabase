/**
 * Soru Bankası İndirme API
 * POST /api/question-bank/download
 * 
 * İndirme sayacını artırır
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { bankId } = await request.json()
    
    if (!bankId) {
      return NextResponse.json({ error: 'Bank ID gerekli' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // İndirme sayacını artır
    await supabase.rpc('increment_bank_download_count', { bank_id: bankId })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Download count error:', error)
    return NextResponse.json({ error: 'Hata oluştu' }, { status: 500 })
  }
}
