/**
 * Soru Bankası Oluşturma API
 * POST /api/question-bank/create
 * 
 * Soruları çeker, PDF oluşturur, Storage'a yükler, veritabanına kaydeder
 */

// Vercel serverless function config - Puppeteer için gerekli
export const maxDuration = 60 // 60 saniye timeout
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Typesense from 'typesense'
import { parseQuestionBankRequest, generateTitle, generateSlug, generateMetaDescription } from '@/lib/question-bank/parser'
import { generatePDFHtml } from '@/lib/question-bank/pdf-generator'
import { createPDFFromHtml } from '@/lib/question-bank/pdf-creator'
import { ParsedRequest, QuestionForPDF } from '@/lib/question-bank/types'
import { upsertBank } from '@/lib/typesense-banks'
import crypto from 'crypto'

// Service role client for Storage operations
function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// IP hash oluştur
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + process.env.IP_SALT || 'teknokul').digest('hex').slice(0, 16)
}

// Typesense client oluştur
function getTypesenseClient() {
  return new Typesense.Client({
    nodes: [{
      host: process.env.TYPESENSE_HOST || '',
      port: 443,
      protocol: 'https'
    }],
    apiKey: process.env.TYPESENSE_API_KEY || '',
    connectionTimeoutSeconds: 5
  })
}

// Typesense'den soru çek - esnek arama (max 250 per page)
async function fetchQuestionsFromTypesense(
  parsed: ParsedRequest,
  limit: number = 250
): Promise<string[] | { error: string; found: number }> {
  if (!process.env.TYPESENSE_HOST || !process.env.TYPESENSE_API_KEY) {
    console.error('❌ Typesense env vars missing')
    return []
  }
  
  const client = getTypesenseClient()
  
  // Subject code HER ZAMAN filtrelerde kalmalı (karışık dersler olmaması için)
  const subjectFilter = parsed.subject_code ? `subject_code:=${parsed.subject_code}` : null
  
  // Konu varsa önce konuya göre ara, yoksa genel ara
  // DERS FİLTRESİ HER ZAMAN KORUNUR!
  const searchStrategies = [
    // 1. Konu + ders + sınıf (en spesifik)
    () => {
      if (!parsed.topic) return null
      const filterParts: string[] = []
      if (parsed.grade) filterParts.push(`grade:=${parsed.grade}`)
      if (subjectFilter) filterParts.push(subjectFilter)
      return { q: parsed.topic, filter_by: filterParts.length > 0 ? filterParts.join(' && ') : undefined, isTopicSearch: true }
    },
    // 2. Konu + ders (sınıf olmadan)
    () => {
      if (!parsed.topic) return null
      if (subjectFilter) return { q: parsed.topic, filter_by: subjectFilter, isTopicSearch: true }
      return null
    },
    // 3. Sınıf + ders (konu olmadan) - SADECE konu belirtilmemişse
    () => {
      if (parsed.topic) return null // Konu varsa bu stratejiye geçme!
      const filterParts: string[] = []
      if (parsed.grade) filterParts.push(`grade:=${parsed.grade}`)
      if (subjectFilter) filterParts.push(subjectFilter)
      return { q: '*', filter_by: filterParts.length > 0 ? filterParts.join(' && ') : undefined, isTopicSearch: false }
    },
    // 4. Sadece ders (konu belirtilmemişse)
    () => {
      if (parsed.topic) return null // Konu varsa bu stratejiye geçme!
      if (subjectFilter) return { q: '*', filter_by: subjectFilter, isTopicSearch: false }
      return null
    }
  ]
  
  let topicSearchAttempted = false
  let topicSearchFoundCount = 0
  
  for (const strategy of searchStrategies) {
    const params = strategy()
    if (!params) continue
    
    try {
      const searchParams: any = {
        q: params.q,
        query_by: 'question_text,main_topic,sub_topic',
        per_page: Math.min(limit, 250),
        num_typos: params.q !== '*' ? 2 : 0
      }
      
      if (params.filter_by) {
        searchParams.filter_by = params.filter_by
      }
      
      console.log(`🔍 Trying: q="${params.q}", filter="${params.filter_by}", isTopicSearch=${params.isTopicSearch}`)
      
      const result = await client
        .collections('questions')
        .documents()
        .search(searchParams)
      
      const ids = (result.hits || []).map((hit: any) => hit.document.question_id || hit.document.id)
      
      console.log(`📊 Found ${ids.length} questions`)
      
      // Konu araması yapıldıysa kaydet
      if (params.isTopicSearch) {
        topicSearchAttempted = true
        topicSearchFoundCount = Math.max(topicSearchFoundCount, ids.length)
      }
      
      if (ids.length >= 10) {
        console.log(`✅ Using strategy: q="${params.q}", filter="${params.filter_by}"`)
        return ids
      }
    } catch (error: any) {
      console.error('Typesense search error:', error.message)
    }
  }
  
  // Konu araması yapıldı ama yeterli soru bulunamadıysa özel mesaj
  if (topicSearchAttempted && topicSearchFoundCount < 10) {
    console.log(`⚠️ Topic search found only ${topicSearchFoundCount} questions, not enough for requested count`)
    return { error: 'topic_not_found', found: topicSearchFoundCount }
  }
  
  return []
}

// Supabase'den soru detaylarını çek
async function fetchQuestionDetails(
  supabase: any,
  questionIds: string[]
): Promise<QuestionForPDF[]> {
  console.log(`📝 Fetching ${questionIds.length} questions from Supabase...`)
  
  const { data, error } = await supabase
    .from('questions')
    .select(`
      id,
      question_text,
      question_image_url,
      options,
      correct_answer,
      difficulty,
      topic:topics(
        main_topic,
        subject:subjects(name)
      )
    `)
    .in('id', questionIds)
  
  if (error) {
    console.error('❌ Supabase fetch error:', error)
    return []
  }
  
  console.log(`✅ Fetched ${data?.length || 0} questions from Supabase`)
  
  return (data || []).map((q: any) => {
    const options = q.options || {}
    return {
      id: q.id,
      question_text: q.question_text || '',
      question_image_url: q.question_image_url,
      option_a: options.A || '',
      option_b: options.B || '',
      option_c: options.C || '',
      option_d: options.D || '',
      option_e: options.E || undefined,
      correct_answer: q.correct_answer || 'A',
      difficulty: q.difficulty || 'medium',
      subject_name: q.topic?.subject?.name || '',
      main_topic: q.topic?.main_topic || ''
    }
  })
}

// Soruları karıştır
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()
    
    // Kullanıcı bilgisi
    const { data: { user } } = await supabase.auth.getUser()
    
    // IP hash
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    const ipHash = hashIP(ip)
    
    // Rate limit kontrolü
    const { data: rateLimitData } = await supabase.rpc('check_question_bank_rate_limit', {
      p_ip_hash: ipHash,
      p_user_id: user?.id || null
    })
    
    if (rateLimitData && !rateLimitData[0]?.allowed) {
      return NextResponse.json({
        error: 'Günlük limit aşıldı. Misafirler günde 5, üyeler günde 20 soru bankası oluşturabilir.',
        remaining: 0
      }, { status: 429 })
    }
    
    // Request body
    const body = await request.json()
    const { input, title: customTitle } = body
    
    if (!input) {
      return NextResponse.json({ error: 'İstek metni gerekli' }, { status: 400 })
    }
    
    // Parse et
    const parsed = parseQuestionBankRequest(input)
    
    // En az bir filtre olmalı
    if (!parsed.grade && !parsed.subject_code && !parsed.topic) {
      return NextResponse.json({
        error: 'Lütfen en az sınıf, ders veya konu belirtin. Örnek: "8. sınıf matematik"'
      }, { status: 400 })
    }
    
    console.log(`📚 Creating question bank: ${JSON.stringify(parsed)}`)
    
    // Typesense'den soru ID'leri çek
    const searchResult = await fetchQuestionsFromTypesense(parsed, 250)
    
    // Konu araması yapıldı ama yeterli soru bulunamadı
    if (searchResult && typeof searchResult === 'object' && 'error' in searchResult) {
      const topicName = parsed.topic || 'belirtilen konu'
      return NextResponse.json({
        error: `"${topicName}" konusunda yeterli soru bulunamadı (${searchResult.found} soru mevcut). Bu konuda daha az soru deneyin veya farklı bir konu seçin.`,
        found: searchResult.found,
        suggestion: searchResult.found > 0 ? `En fazla ${searchResult.found} soru isteyebilirsiniz.` : undefined
      }, { status: 400 })
    }
    
    const allQuestionIds = searchResult as string[]

    if (allQuestionIds.length < 10) {
      return NextResponse.json({
        error: `Yeterli soru bulunamadı (${allQuestionIds.length} soru mevcut). Lütfen farklı kriterler deneyin.`,
        found: allQuestionIds.length
      }, { status: 400 })
    }
    
    // Karıştır ve seç
    const shuffledIds = shuffleArray(allQuestionIds)
    const selectedIds = shuffledIds.slice(0, parsed.question_count)
    
    // Supabase'den detayları çek
    const questions = await fetchQuestionDetails(supabase, selectedIds)
    
    if (questions.length < 10) {
      return NextResponse.json({
        error: 'Soru detayları alınamadı. Lütfen tekrar deneyin.'
      }, { status: 500 })
    }
    
    // Başlık ve slug oluştur
    const title = customTitle || generateTitle(parsed)
    const slug = generateSlug(title, questions.length)
    const metaDescription = generateMetaDescription(parsed)
    
    // Kullanıcı adı
    let userName = 'Teknokul Kullanıcısı'
    if (user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      
      if (profile?.full_name) {
        userName = profile.full_name
      }
    }
    
    // PDF HTML oluştur
    const pdfHtml = generatePDFHtml(questions, parsed, title, userName)
    
    // Server-side PDF oluştur
    console.log('📄 Creating PDF with Puppeteer...')
    let pdfBuffer: Buffer | null = null
    let pdfSizeKb = 0
    let pdfUrl: string | null = null
    
    try {
      const pdfResult = await createPDFFromHtml(pdfHtml)
      pdfBuffer = pdfResult.buffer
      pdfSizeKb = pdfResult.sizeKb
      console.log(`✅ PDF created: ${pdfSizeKb}KB`)
    } catch (pdfError: any) {
      console.error('⚠️ PDF creation failed, continuing without PDF:', pdfError.message)
      // PDF oluşturulamadıysa devam et, client-side fallback kullanılacak
    }
    
    // Veritabanına kaydet (önce kaydet, sonra Storage'a yükle)
    const { data: bank, error: insertError } = await supabase
      .from('question_banks')
      .insert({
        title,
        slug,
        description: metaDescription,
        user_id: user?.id || null,
        user_name: userName,
        ip_hash: ipHash,
        grade: parsed.grade,
        exam_type: parsed.exam_type,
        subject_code: parsed.subject_code,
        subject_name: parsed.subject_name,
        topics: parsed.topic ? [parsed.topic] : null,
        difficulty: parsed.difficulty,
        question_count: questions.length,
        question_ids: questions.map(q => q.id),
        is_public: true,
        meta_title: title.slice(0, 70),
        meta_description: metaDescription
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Kayıt hatası oluştu' }, { status: 500 })
    }
    
    // PDF'i Supabase Storage'a yükle
    if (pdfBuffer) {
      try {
        const serviceClient = getServiceClient()
        const fileName = `${slug}.pdf`
        
        console.log(`📤 Uploading PDF to Storage: ${fileName}`)
        
        const { error: uploadError } = await serviceClient.storage
          .from('question-bank-pdfs')
          .upload(fileName, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          })
        
        if (uploadError) {
          console.error('⚠️ Storage upload failed:', uploadError)
        } else {
          // Proxy URL oluştur (teknokul.com.tr/pdf/slug.pdf formatında)
          pdfUrl = `https://teknokul.com.tr/pdf/${slug}.pdf`
          console.log(`✅ PDF uploaded, URL: ${pdfUrl}`)
          
          // question_banks tablosunu güncelle
          await serviceClient
            .from('question_banks')
            .update({ 
              pdf_url: pdfUrl,
              pdf_size_kb: pdfSizeKb
            })
            .eq('id', bank.id)
        }
      } catch (storageError: any) {
        console.error('⚠️ Storage error:', storageError.message)
      }
    }
    
    // Rate limit artır
    await supabase.rpc('increment_question_bank_rate_limit', {
      p_ip_hash: ipHash,
      p_user_id: user?.id || null
    })
    
    // Typesense'e indexle (async, hata olsa da devam et)
    upsertBank({
      id: bank.id,
      title: bank.title,
      slug: bank.slug,
      subject_name: bank.subject_name || undefined,
      grade: bank.grade || undefined,
      question_count: bank.question_count,
      download_count: 0,
      created_at: new Date(bank.created_at).getTime()
    }).catch(err => console.error('Typesense index error:', err))
    
    const duration = Date.now() - startTime
    console.log(`✅ Question bank created: ${slug} (${duration}ms)`)
    
    return NextResponse.json({
      success: true,
      bank: {
        id: bank.id,
        title: bank.title,
        slug: bank.slug,
        question_count: bank.question_count,
        pdf_url: pdfUrl
      },
      // PDF URL varsa client'a gönder, yoksa HTML fallback için
      pdfUrl,
      pdfHtml: pdfUrl ? undefined : pdfHtml,
      questions: questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        correct_answer: q.correct_answer
      })),
      duration
    })
    
  } catch (error) {
    console.error('Create error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    )
  }
}
