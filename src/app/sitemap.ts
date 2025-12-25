import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.teknokul.com.tr'
  const supabase = await createClient()
  
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
  ]

  // Dinamik koç sayfaları
  let coachPages: MetadataRoute.Sitemap = []
  try {
    const { data: coaches } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('role', 'coach')
      .eq('is_active', true)
    
    if (coaches) {
      coachPages = coaches.map((coach) => ({
        url: `${baseUrl}/koclar/${coach.id}`,
        lastModified: coach.updated_at ? new Date(coach.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Koç sayfaları sitemap hatası:', error)
  }

  // Dinamik materyal sayfaları
  let materialPages: MetadataRoute.Sitemap = []
  try {
    const { data: materials } = await supabase
      .from('materials')
      .select('id, updated_at')
      .eq('is_public', true)
    
    if (materials) {
      materialPages = materials.map((material) => ({
        url: `${baseUrl}/materyaller/${material.id}`,
        lastModified: material.updated_at ? new Date(material.updated_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }))
    }
  } catch (error) {
    console.error('Materyal sayfaları sitemap hatası:', error)
  }

  // Dinamik rehber/blog sayfaları
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
    
    if (posts) {
      blogPages = posts.map((post) => ({
        url: `${baseUrl}/rehberler/${post.slug}`,
        lastModified: post.updated_at ? new Date(post.updated_at) : new Date(post.published_at),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    // Blog tablosu henüz yoksa sessizce devam et
    console.log('Blog tablosu bulunamadı, statik sayfalar ile devam ediliyor')
  }

  // ========== SORU BANKAS SEO SAYFALARI ==========
  
  // Ana soru bankası sayfası
  const questionBankPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/sorular`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    },
    // Programatik SEO sayfaları
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
  ]

  // Ders bazlı sayfalar (Pillar Pages)
  let subjectPages: MetadataRoute.Sitemap = []
  const subjectCodes = [
    'matematik', 'turkce', 'fen_bilimleri', 'sosyal_bilgiler', 
    'ingilizce', 'fizik', 'kimya', 'biyoloji', 'inkilap_tarihi', 'din_kulturu'
  ]
  
  try {
    const { data: subjects } = await supabase
      .from('subjects')
      .select('code')
      .in('code', subjectCodes)
    
    if (subjects) {
      // Her ders için pillar page
      subjectPages = subjects.map((subject) => ({
        url: `${baseUrl}/sorular/${subject.code}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('Ders sayfaları sitemap hatası:', error)
  }

  // Sınıf bazlı sayfalar (Cluster Pages) - Ders + Sınıf kombinasyonları
  let gradePages: MetadataRoute.Sitemap = []
  const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  
  try {
    const { data: subjects } = await supabase
      .from('subjects')
      .select('code')
      .in('code', subjectCodes)
    
    if (subjects) {
      // Her ders + sınıf kombinasyonu için cluster page
      subjects.forEach((subject) => {
        grades.forEach((grade) => {
          gradePages.push({
            url: `${baseUrl}/sorular/${subject.code}/${grade}-sinif`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: grade === 8 || grade === 12 ? 0.75 : 0.7, // LGS ve YKS sınıflarına öncelik
          })
        })
      })
    }
  } catch (error) {
    console.error('Sınıf sayfaları sitemap hatası:', error)
  }

  // ========== TEK SORU SAYFALARI (31.000+) ==========
  let questionPages: MetadataRoute.Sitemap = []
  
  try {
    // Tüm soruları topic ve subject bilgileriyle birlikte çek
    const { data: questions } = await supabase
      .from('questions')
      .select(`
        id,
        created_at,
        topics(
          grade,
          subjects(code)
        )
      `)
      .order('created_at', { ascending: false })
    
    if (questions) {
      questionPages = questions
        .filter((q: any) => q.topics && q.topics.subjects)
        .map((q: any) => ({
          url: `${baseUrl}/sorular/${q.topics.subjects.code}/${q.topics.grade}-sinif/${q.id}`,
          lastModified: q.created_at ? new Date(q.created_at) : new Date(),
          changeFrequency: 'monthly' as const,
          // LGS (8. sınıf) ve YKS (12. sınıf) sorularına yüksek öncelik
          priority: q.topics.grade === 8 || q.topics.grade === 12 ? 0.65 : 0.5,
        }))
    }
  } catch (error) {
    console.error('Soru sayfaları sitemap hatası:', error)
  }

  return [
    ...staticPages, 
    ...coachPages, 
    ...materialPages, 
    ...blogPages,
    ...questionBankPages,
    ...subjectPages,
    ...gradePages,
    ...questionPages,
  ]
}

