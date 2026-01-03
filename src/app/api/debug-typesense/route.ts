import { NextResponse } from 'next/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      TYPESENSE_HOST: !!process.env.TYPESENSE_HOST,
      TYPESENSE_API_KEY: !!process.env.TYPESENSE_API_KEY,
    },
    isTypesenseAvailable: isTypesenseAvailable(),
    tests: {}
  }

  try {
    // Test 1: Topics collection - matematik
    const topicsResult = await typesenseClient
      .collections(COLLECTIONS.TOPICS)
      .documents()
      .search({
        q: '*',
        query_by: 'main_topic',
        filter_by: 'subject_code:=matematik',
        facet_by: 'grade',
        per_page: 0
      })
    
    results.tests.topics = {
      success: true,
      found: topicsResult.found,
      grades: topicsResult.facet_counts?.find((f: any) => f.field_name === 'grade')?.counts?.length || 0
    }
  } catch (error: any) {
    results.tests.topics = { success: false, error: error.message }
  }

  try {
    // Test 2: Questions collection - 2. sınıf matematik
    const questionsResult = await typesenseClient
      .collections(COLLECTIONS.QUESTIONS)
      .documents()
      .search({
        q: '*',
        query_by: 'question_text',
        filter_by: 'subject_code:=matematik && grade:=2',
        facet_by: 'difficulty,main_topic',
        per_page: 0,
        max_facet_values: 100
      })
    
    results.tests.questions = {
      success: true,
      found: questionsResult.found,
      topics: questionsResult.facet_counts?.find((f: any) => f.field_name === 'main_topic')?.counts?.length || 0
    }
  } catch (error: any) {
    results.tests.questions = { success: false, error: error.message }
  }

  return NextResponse.json(results)
}
