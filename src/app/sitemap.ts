import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

/**
 * Teknokul Akıllı Sitemap Sistemi
 * 
 * Yapı:
 * - sitemap/0.xml = Statik sayfalar + ders/sınıf sayfaları
 * - sitemap/1-N.xml = İNDEKSLENEN sorular (is_indexed=true)
 * - sitemap/discover-1-N.xml = KEŞİF sorular (is_indexed=false, Google yapıyı görsün)
 * 
 * Google sadece indekslenen sayfaları kullanıcılara sunar,
 * ama keşif sitemap ile sitenin büyüklüğünü anlar.
 */

const QUESTIONS_PER_SITEMAP = 10000 // Her sitemap max 10K URL
const baseUrl = 'https://www.teknokul.com.tr'

// Sitemap için service role client (build zamanında çalışır)
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Next.js'e kaç tane sitemap olacağını söyle
export async function generateSitemaps() {
  const supabase = getSupabaseClient()
  
  // İndeksli soru sayısı
  const { count: indexedCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('is_indexed', true)
  
  // Keşif (noindex) soru sayısı
  const { count: discoverCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .or('is_indexed.eq.false,is_indexed.is.null')
  
  const indexedSitemapCount = Math.ceil((indexedCount || 0) / QUESTIONS_PER_SITEMAP)
  const discoverSitemapCount = Math.ceil((discoverCount || 0) / QUESTIONS_PER_SITEMAP)
  
  const sitemaps: { id: number }[] = []
  
  // ID 0: Statik sayfalar
  sitemaps.push({ id: 0 })
  
  // ID 1-N: İndeksli sorular
  for (let i = 1; i <= indexedSitemapCount; i++) {
    sitemaps.push({ id: i })
  }
  
  // ID 1000+: Keşif sorular (discover)
  // 1000 offset ile ayırıyoruz ki karışmasın
  for (let i = 0; i < discoverSitemapCount; i++) {
    sitemaps.push({ id: 1000 + i })
  }
  
  console.log(`📊 Sitemap Stats: ${indexedCount} indexed, ${discoverCount} discover, ${sitemaps.length} total sitemaps`)
  
  return sitemaps
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseClient()
  
  // ID 0 = Statik sayfalar ve ders/sınıf sayfaları
  if (id === 0) {
    return await getStaticAndDynamicPages(supabase)
  }
  
  // ID >= 1000 = Keşif (discover) sitemap
  if (id >= 1000) {
    return await getDiscoverQuestionPages(supabase, id - 1000)
  }
  
  // ID 1-999 = İndeksli soru sayfaları
  return await getIndexedQuestionPages(supabase, id)
}

// Statik sayfalar ve diğer dinamik içerikler
async function getStaticAndDynamicPages(supabase: any): Promise<MetadataRoute.Sitemap> {
  // Statik sayfalar (değişmez)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/hizli-coz`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/liderlik`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/lgs-puan-hesaplama`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/yks-puan-hesaplama`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/koclar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/materyaller`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/rehberler`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/rozetler`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Soru bankası ana sayfaları
    {
      url: `${baseUrl}/sorular`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/sorular/lgs-en-zor-100`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/sorular/sinav-oncesi-hizli-tekrar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/sorular/yeni-eklenen-sorular`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/sorular/en-cok-cozulen`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/sorular/gorselli-sorular`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/soru-bankasi/olustur`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/soru-bankasi/kesif`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.85,
    },
    // Yasal sayfalar
    {
      url: `${baseUrl}/yasal/gizlilik`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.1,
    },
    {
      url: `${baseUrl}/yasal/kullanim-kosullari`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.1,
    },
    {
      url: `${baseUrl}/yasal/kvkk`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.1,
    },
    {
      url: `${baseUrl}/yasal/cerezler`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.1,
    },
  ]

  // Ders bazlı sayfalar - SADECE soru olan kombinasyonlar
  let subjectPages: MetadataRoute.Sitemap = []
  let gradePages: MetadataRoute.Sitemap = []
  
  try {
    // Soru sayısı olan ders+sınıf kombinasyonlarını bul (RPC veya SQL view)
    const { data: counts } = await supabase.rpc('get_question_counts_by_subject_grade')
    
    if (counts && Array.isArray(counts)) {
      const subjectCodes = new Set<string>()
      
      counts.forEach((row: any) => {
        if (row.subject_code && row.grade && row.question_count > 0) {
          subjectCodes.add(row.subject_code)
          gradePages.push({
            url: `${baseUrl}/sorular/${row.subject_code}/${row.grade}-sinif`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: row.grade === 8 || row.grade === 12 ? 0.75 : 0.7,
          })
        }
      })
      
      // Ders ana sayfaları
      subjectPages = Array.from(subjectCodes).map((code) => ({
        url: `${baseUrl}/sorular/${code}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    // Fallback: En popüler dersler
    console.error('Ders sayfaları sitemap hatası, fallback kullanılıyor:', error)
    const mainSubjects = ['matematik', 'turkce', 'fen_bilimleri', 'ingilizce']
    const mainGrades = [5, 6, 7, 8]
    
    subjectPages = mainSubjects.map((code) => ({
      url: `${baseUrl}/sorular/${code}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))
    
    mainSubjects.forEach((code) => {
      mainGrades.forEach((grade) => {
        gradePages.push({
          url: `${baseUrl}/sorular/${code}/${grade}-sinif`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: grade === 8 ? 0.75 : 0.7,
        })
      })
    })
  }

  // Koç sayfaları
  let coachPages: MetadataRoute.Sitemap = []
  try {
    const { data: coaches } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('role', 'ogretmen')
      .limit(1000)
    
    if (coaches) {
      coachPages = coaches.map((coach: any) => ({
        url: `${baseUrl}/koclar/${coach.id}`,
        lastModified: coach.updated_at ? new Date(coach.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Koç sayfaları sitemap hatası:', error)
  }

  // PDF Soru Bankaları
  let pdfBankPages: MetadataRoute.Sitemap = []
  try {
    const { data: pdfBanks } = await supabase
      .from('question_banks')
      .select('slug, created_at, updated_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(5000)
    
    if (pdfBanks) {
      pdfBankPages = pdfBanks.map((bank: any) => ({
        url: `${baseUrl}/soru-bankasi/${bank.slug}`,
        lastModified: bank.updated_at ? new Date(bank.updated_at) : new Date(bank.created_at),
        changeFrequency: 'monthly' as const,
        priority: 0.75,
      }))
    }
  } catch (error) {
    console.error('PDF Soru Bankası sitemap hatası:', error)
  }

  return [
    ...staticPages,
    ...subjectPages,
    ...gradePages,
    ...coachPages,
    ...pdfBankPages,
  ]
}

/**
 * 🟢 İNDEKSLİ SORULAR - VİTRİN
 * Bu sorular Google aramalarda görünür
 * is_indexed = true olan kaliteli sorular
 */
async function getIndexedQuestionPages(supabase: any, sitemapId: number): Promise<MetadataRoute.Sitemap> {
  const offset = (sitemapId - 1) * QUESTIONS_PER_SITEMAP
  
  try {
    const { data: questions } = await supabase
      .from('questions')
      .select(`
        id,
        updated_at,
        indexed_at,
        index_score,
        topics!inner(
          grade,
          subjects!inner(code)
        )
      `)
      .eq('is_active', true)
      .eq('is_indexed', true)  // 🚪 SADECE İNDEKSLİ SORULAR
      .order('indexed_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + QUESTIONS_PER_SITEMAP - 1)
    
    if (!questions) return []
    
    return questions
      .filter((q: any) => q.topics && q.topics.subjects)
      .map((q: any) => {
        // Yüksek skorlu sorular daha yüksek priority
        const scorePriority = Math.min(0.9, 0.6 + (q.index_score || 0) / 200)
        // LGS/YKS sınıfları bonus
        const gradePriority = q.topics.grade === 8 || q.topics.grade === 12 ? 0.05 : 0
        
        return {
          url: `${baseUrl}/sorular/${q.topics.subjects.code}/${q.topics.grade}-sinif/${q.id}`,
          lastModified: q.indexed_at ? new Date(q.indexed_at) : (q.updated_at ? new Date(q.updated_at) : new Date()),
          changeFrequency: 'weekly' as const,
          priority: Math.min(0.95, scorePriority + gradePriority),
        }
      })
  } catch (error) {
    console.error(`İndeksli sorular sitemap hatası (id: ${sitemapId}):`, error)
    return []
  }
}

/**
 * 🔍 KEŞİF SORULARI - DISCOVER
 * Bu sorular Google aramalarda GÖRÜNMEZ (noindex)
 * Ama Google sitenin yapısını ve büyüklüğünü anlar
 * Crawl budget optimize edilir
 */
async function getDiscoverQuestionPages(supabase: any, discoverIndex: number): Promise<MetadataRoute.Sitemap> {
  const offset = discoverIndex * QUESTIONS_PER_SITEMAP
  
  try {
    const { data: questions } = await supabase
      .from('questions')
      .select(`
        id,
        created_at,
        topics!inner(
          grade,
          subjects!inner(code)
        )
      `)
      .eq('is_active', true)
      .or('is_indexed.eq.false,is_indexed.is.null')  // 🔍 NOINDEXLİ SORULAR
      .order('created_at', { ascending: false })
      .range(offset, offset + QUESTIONS_PER_SITEMAP - 1)
    
    if (!questions) return []
    
    return questions
      .filter((q: any) => q.topics && q.topics.subjects)
      .map((q: any) => ({
        url: `${baseUrl}/sorular/${q.topics.subjects.code}/${q.topics.grade}-sinif/${q.id}`,
        lastModified: q.created_at ? new Date(q.created_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.3, // Düşük priority - keşif amaçlı
      }))
  } catch (error) {
    console.error(`Keşif sorular sitemap hatası (index: ${discoverIndex}):`, error)
    return []
  }
}
