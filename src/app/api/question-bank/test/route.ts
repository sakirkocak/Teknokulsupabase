/**
 * Typesense Test API
 */

import { NextRequest, NextResponse } from 'next/server'
import Typesense from 'typesense'

export async function GET(request: NextRequest) {
  try {
    const host = process.env.TYPESENSE_HOST
    const apiKey = process.env.TYPESENSE_API_KEY
    
    console.log('🔍 TYPESENSE_HOST:', host ? 'SET' : 'NOT SET')
    console.log('🔍 TYPESENSE_API_KEY:', apiKey ? 'SET' : 'NOT SET')
    
    if (!host || !apiKey) {
      return NextResponse.json({ 
        error: 'Typesense env vars missing',
        host: !!host,
        apiKey: !!apiKey
      })
    }
    
    const client = new Typesense.Client({
      nodes: [{ host, port: 443, protocol: 'https' }],
      apiKey,
      connectionTimeoutSeconds: 5
    })
    
    const result = await client
      .collections('questions')
      .documents()
      .search({
        q: '*',
        query_by: 'question_text',
        filter_by: 'grade:=8',
        per_page: 5
      })
    
    return NextResponse.json({
      success: true,
      found: result.found,
      sampleIds: (result.hits || []).slice(0, 3).map((h: any) => h.document.question_id || h.document.id)
    })
    
  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
