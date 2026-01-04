import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const QUESTIONS_PER_SITEMAP = 10000
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
  
  // Toplam soru sayısını al
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  
  const totalQuestions = count || 0
  const questionSitemapCount = Math.ceil(totalQuestions / QUESTIONS_PER_SITEMAP)
  
  // sitemap id'leri: 0 = statik, 1+ = sorular
  const sitemaps = [{ id: 0 }] // Statik sayfalar
  
  for (let i = 1; i <= questionSitemapCount; i++) {
    sitemaps.push({ id: i })
  }
  
  return sitemaps
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseClient()
  
  // ID 0 = Statik sayfalar ve diğer dinamik içerikler
  if (id === 0) {
    return await getStaticAndDynamicPages(supabase)
  }
  
  // ID 1+ = Soru sayfaları (her biri 10.000 soru)
  return await getQuestionPages(supabase, id)
}

// Statik sayfalar ve diğer dinamik içerikler
async function getStaticAndDynamicPages(supabase: any): Promise<MetadataRoute.Sitemap> {
  // Statik sayfalar
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
    {
      url: `${baseUrl}/giris`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/kayit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
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
  ]

  // Ders bazlı sayfalar
  const subjectCodes = [
    'matematik', 'turkce', 'fen_bilimleri', 'sosyal_bilgiler', 
    'ingilizce', 'fizik', 'kimya', 'biyoloji', 'inkilap_tarihi', 'din_kulturu'
  ]
  const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  
  let subjectPages: MetadataRoute.Sitemap = []
  let gradePages: MetadataRoute.Sitemap = []
  
  try {
    const { data: subjects } = await supabase
      .from('subjects')
      .select('code')
      .in('code', subjectCodes)
    
    if (subjects) {
      // Ders sayfaları
      subjectPages = subjects.map((subject: any) => ({
        url: `${baseUrl}/sorular/${subject.code}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }))
      
      // Ders + Sınıf kombinasyonları
      subjects.forEach((subject: any) => {
        grades.forEach((grade) => {
          gradePages.push({
            url: `${baseUrl}/sorular/${subject.code}/${grade}-sinif`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: grade === 8 || grade === 12 ? 0.75 : 0.7,
          })
        })
      })
    }
  } catch (error) {
    console.error('Ders sayfaları sitemap hatası:', error)
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

// Soru sayfaları - her sitemap için 10.000 soru
async function getQuestionPages(supabase: any, sitemapId: number): Promise<MetadataRoute.Sitemap> {
  const offset = (sitemapId - 1) * QUESTIONS_PER_SITEMAP
  
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
      .order('created_at', { ascending: false })
      .range(offset, offset + QUESTIONS_PER_SITEMAP - 1)
    
    if (!questions) return []
    
    return questions
      .filter((q: any) => q.topics && q.topics.subjects)
      .map((q: any) => ({
        url: `${baseUrl}/sorular/${q.topics.subjects.code}/${q.topics.grade}-sinif/${q.id}`,
        lastModified: q.created_at ? new Date(q.created_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: q.topics.grade === 8 || q.topics.grade === 12 ? 0.65 : 0.5,
      }))
  } catch (error) {
    console.error(`Soru sayfaları sitemap hatası (id: ${sitemapId}):`, error)
    return []
  }
}
