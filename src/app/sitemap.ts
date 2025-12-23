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

  return [...staticPages, ...coachPages, ...materialPages, ...blogPages]
}

