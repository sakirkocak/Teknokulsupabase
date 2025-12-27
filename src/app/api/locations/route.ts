import { NextResponse } from 'next/server'
import { typesenseClient, isTypesenseAvailable, COLLECTIONS } from '@/lib/typesense/client'
import { createClient } from '@supabase/supabase-js'

// Supabase admin client (server-side)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'city' // 'city', 'district', 'school'
  const parentId = searchParams.get('parentId') // city_id for districts, district_id for schools
  
  try {
    // Önce Typesense'den dene
    if (isTypesenseAvailable()) {
      try {
        if (type === 'city') {
          const result = await typesenseClient
            .collections(COLLECTIONS.LOCATIONS)
            .documents()
            .search({
              q: '*',
              query_by: 'name',
              filter_by: 'type:=city',
              sort_by: 'name:asc',
              per_page: 100
            })

          const cities = (result.hits || []).map(hit => {
            const doc = hit.document as any
            return {
              id: doc.location_id || doc.id,
              name: doc.name,
              plate_code: doc.plate_code
            }
          })

          console.log(`⚡ Cities from Typesense: ${cities.length}`)
          return NextResponse.json({ data: cities, source: 'typesense' })
        }
        
        if (type === 'district' && parentId) {
          const result = await typesenseClient
            .collections(COLLECTIONS.LOCATIONS)
            .documents()
            .search({
              q: '*',
              query_by: 'name',
              filter_by: `type:=district && parent_id:=${parentId}`,
              sort_by: 'name:asc',
              per_page: 100
            })

          const districts = (result.hits || []).map(hit => {
            const doc = hit.document as any
            return {
              id: doc.location_id || doc.id,
              name: doc.name,
              city_id: doc.parent_id
            }
          })

          console.log(`⚡ Districts from Typesense: ${districts.length}`)
          return NextResponse.json({ data: districts, source: 'typesense' })
        }
        
        if (type === 'school' && parentId) {
          const result = await typesenseClient
            .collections(COLLECTIONS.SCHOOLS)
            .documents()
            .search({
              q: '*',
              query_by: 'name',
              filter_by: `district_id:=${parentId}`,
              sort_by: 'name:asc',
              per_page: 250
            })

          const schools = (result.hits || []).map(hit => {
            const doc = hit.document as any
            return {
              id: doc.school_id || doc.id,
              name: doc.name,
              district_id: doc.district_id
            }
          })

          console.log(`⚡ Schools from Typesense: ${schools.length}`)
          return NextResponse.json({ data: schools, source: 'typesense' })
        }
      } catch (typesenseError) {
        console.warn('⚠️ Typesense locations failed, falling back to Supabase:', typesenseError)
      }
    }

    // Fallback: Supabase
    if (type === 'city') {
      const { data: cities, error } = await supabaseAdmin
        .from('turkey_cities')
        .select('id, name, plate_code')
        .order('name')

      if (error) throw error
      console.log(`📍 Cities from Supabase: ${cities?.length || 0}`)
      return NextResponse.json({ data: cities || [], source: 'supabase' })
    }
    
    if (type === 'district' && parentId) {
      const { data: districts, error } = await supabaseAdmin
        .from('turkey_districts')
        .select('id, name, city_id')
        .eq('city_id', parentId)
        .order('name')

      if (error) throw error
      console.log(`📍 Districts from Supabase: ${districts?.length || 0}`)
      return NextResponse.json({ data: districts || [], source: 'supabase' })
    }
    
    if (type === 'school' && parentId) {
      const { data: schools, error } = await supabaseAdmin
        .from('schools')
        .select('id, name, district_id')
        .eq('district_id', parentId)
        .order('name')
        .limit(250)

      if (error) throw error
      console.log(`📍 Schools from Supabase: ${schools?.length || 0}`)
      return NextResponse.json({ data: schools || [], source: 'supabase' })
    }

    return NextResponse.json({ data: [], source: 'none' })
    
  } catch (error) {
    console.error('Locations API error:', error)
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}

