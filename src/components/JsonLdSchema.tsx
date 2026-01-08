export default function JsonLdSchema() {
  const baseUrl = 'https://www.teknokul.com.tr'
  
  // Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${baseUrl}/#organization`,
    name: 'Teknokul',
    alternateName: 'Teknokul - Eğitimin Dijital Üssü',
    description: 'AI destekli soru bankası, liderlik yarışı, kişisel eğitim koçluğu ve gelişim takibi platformu. 1-12. sınıf öğrencileri için MEB müfredatına uygun eğitim içerikleri.',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/images/logo.png`,
      width: 512,
      height: 512,
    },
    sameAs: [
      // Sosyal medya hesapları eklenebilir
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: 'Turkish',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Turkey',
    },
    founder: {
      '@type': 'Organization',
      name: 'Teknokul',
    },
  }

  // WebSite Schema with SearchAction
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: baseUrl,
    name: 'Teknokul',
    description: 'Öğren. Yarış. Kazan! AI destekli eğitim platformu.',
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
    inLanguage: 'tr-TR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/hizli-coz?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  // Course Schema for educational content
  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${baseUrl}/#course`,
    name: 'Teknokul Soru Bankası',
    description: '1-12. sınıf MEB müfredatına uygun, zorluk seviyelerine göre ayrılmış binlerce soru içeren interaktif eğitim platformu.',
    provider: {
      '@id': `${baseUrl}/#organization`,
    },
    educationalLevel: [
      'İlkokul (1-4. Sınıf)',
      'Ortaokul (5-8. Sınıf)',
      'Lise (9-12. Sınıf)',
    ],
    teaches: [
      'Matematik',
      'Türkçe',
      'Fen Bilimleri',
      'Sosyal Bilgiler',
      'İngilizce',
      'Fizik',
      'Kimya',
      'Biyoloji',
    ],
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: 'PT30M', // 30 dakika günlük
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TRY',
      availability: 'https://schema.org/InStock',
    },
  }

  // SoftwareApplication Schema - KALDIRILDI
  // Google yıldız derecelendirmesi göstermemesi için bu schema tamamen kaldırıldı
  // Sahte değerlendirme gibi görünüyor ve Google cezasına neden olabilir

  // BreadcrumbList Schema (temel yapı)
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${baseUrl}/#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Ana Sayfa',
        item: baseUrl,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(courseSchema),
        }}
      />
      {/* SoftwareApplication schema kaldırıldı - sahte yıldız gösterimine neden oluyordu */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
    </>
  )
}

// FAQ Schema helper for blog/rehber pages
export function FAQSchema({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(faqSchema),
      }}
    />
  )
}

// Article Schema helper for blog posts
export function ArticleSchema({
  title,
  description,
  slug,
  publishedAt,
  updatedAt,
  authorName,
  imageUrl,
}: {
  title: string
  description: string
  slug: string
  publishedAt: string
  updatedAt?: string
  authorName?: string
  imageUrl?: string
}) {
  const baseUrl = 'https://www.teknokul.com.tr'
  
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    url: `${baseUrl}/rehberler/${slug}`,
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    author: {
      '@type': 'Organization',
      name: authorName || 'Teknokul',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Teknokul',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/images/logo.png`,
      },
    },
    image: imageUrl || `${baseUrl}/images/logo.png`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/rehberler/${slug}`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(articleSchema),
      }}
    />
  )
}

// Calculator Tool Schema for LGS/YKS pages
export function CalculatorSchema({
  name,
  description,
  url,
}: {
  name: string
  description: string
  url: string
}) {
  const calculatorSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: name,
    description: description,
    url: url,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TRY',
    },
    featureList: [
      'Anlık puan hesaplama',
      'Yüzdelik dilim tahmini',
      'Geçmiş yıl karşılaştırması',
      'Sonuç paylaşma',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(calculatorSchema),
      }}
    />
  )
}

// Quiz Schema for question pages - Google Rich Snippets
export interface QuizQuestion {
  text: string
  options: string[]
  correctAnswer: string
}

export function QuizSchema({
  name,
  description,
  subject,
  grade,
  questionCount,
  questions,
  url,
}: {
  name: string
  description: string
  subject: string
  grade?: number
  questionCount: number
  questions: QuizQuestion[]
  url: string
}) {
  const baseUrl = 'https://www.teknokul.com.tr'
  
  const quizSchema = {
    '@context': 'https://schema.org/',
    '@type': 'Quiz',
    name: name,
    description: description,
    url: url,
    provider: {
      '@type': 'Organization',
      name: 'Teknokul',
      url: baseUrl,
    },
    about: {
      '@type': 'Thing',
      name: subject,
    },
    educationalLevel: grade ? `${grade}. Sınıf` : 'Tüm Seviyeler',
    numberOfQuestions: questionCount,
    educationalAlignment: {
      '@type': 'AlignmentObject',
      alignmentType: 'educationalSubject',
      targetName: subject,
    },
    hasPart: questions.slice(0, 10).map((q, index) => ({
      '@type': 'Question',
      '@id': `${url}#question-${index + 1}`,
      position: index + 1,
      name: q.text.length > 200 ? q.text.substring(0, 200) + '...' : q.text,
      text: q.text,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.correctAnswer,
      },
      suggestedAnswer: q.options
        .filter(opt => opt !== q.correctAnswer)
        .map(opt => ({
          '@type': 'Answer',
          text: opt,
        })),
    })),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TRY',
      availability: 'https://schema.org/InStock',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(quizSchema),
      }}
    />
  )
}

// Breadcrumb Schema helper for navigation
export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[]
}) {
  const baseUrl = 'https://www.teknokul.com.tr'
  
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(breadcrumbSchema),
      }}
    />
  )
}

// ItemList Schema for question list pages
export function QuestionListSchema({
  name,
  description,
  url,
  items,
}: {
  name: string
  description: string
  url: string
  items: { name: string; url: string; position: number }[]
}) {
  const baseUrl = 'https://www.teknokul.com.tr'
  
  const listSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: name,
    description: description,
    url: url,
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(listSchema),
      }}
    />
  )
}

/**
 * LearningResource Schema - Eğitim İçeriği için
 * Google'a bu sayfanın bir eğitim kaynağı olduğunu söyler
 * SEO için çok önemli - E-E-A-T sinyalleri güçlendirir
 */
export function LearningResourceSchema({
  name,
  description,
  url,
  subject,
  grade,
  educationalLevel,
  learningResourceType,
  keywords,
  datePublished,
  dateModified,
  hasSolution,
  hasVideo,
}: {
  name: string
  description: string
  url: string
  subject: string
  grade: number
  educationalLevel?: string
  learningResourceType?: string
  keywords?: string[]
  datePublished?: string
  dateModified?: string
  hasSolution?: boolean
  hasVideo?: boolean
}) {
  const baseUrl = 'https://www.teknokul.com.tr'
  
  // Eğitim seviyesi belirleme
  const getEducationalLevel = (g: number) => {
    if (g <= 4) return 'İlkokul'
    if (g <= 8) return 'Ortaokul'
    return 'Lise'
  }
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: name,
    description: description,
    url: url,
    inLanguage: 'tr',
    isAccessibleForFree: true,
    
    // Eğitim bilgileri
    educationalLevel: educationalLevel || `${getEducationalLevel(grade)} - ${grade}. Sınıf`,
    learningResourceType: learningResourceType || 'Problem/Soru',
    teaches: subject,
    
    // Konu/Ders bilgisi
    about: {
      '@type': 'Thing',
      name: subject,
    },
    
    // Eğitim uyumu
    educationalAlignment: [
      {
        '@type': 'AlignmentObject',
        alignmentType: 'educationalSubject',
        targetName: subject,
      },
      {
        '@type': 'AlignmentObject',
        alignmentType: 'educationalLevel',
        targetName: `${grade}. Sınıf`,
      },
    ],
    
    // Sağlayıcı
    provider: {
      '@type': 'Organization',
      name: 'Teknokul',
      url: baseUrl,
    },
    
    // Tarihler
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    
    // Anahtar kelimeler
    ...(keywords && keywords.length > 0 && { keywords: keywords.join(', ') }),
    
    // Çözüm/Video bilgisi
    ...(hasSolution && {
      hasPart: {
        '@type': 'Answer',
        name: 'Çözüm Açıklaması',
      },
    }),
    
    // Video varsa
    ...(hasVideo && {
      video: {
        '@type': 'VideoObject',
        name: `${name} - Video Çözüm`,
        description: `${subject} ${grade}. sınıf soru çözümü`,
        uploadDate: dateModified || datePublished || new Date().toISOString(),
        contentUrl: `${url}#video`,
        embedUrl: `${url}#video`,
        publisher: {
          '@type': 'Organization',
          name: 'Teknokul',
        },
      },
    }),
    
    // Ücretsiz
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'TRY',
      availability: 'https://schema.org/InStock',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  )
}

/**
 * EducationalQuestion Schema - Soru İçeriği için
 * Bu, soruların Google'da daha iyi anlaşılmasını sağlar
 */
export function EducationalQuestionSchema({
  questionText,
  subject,
  grade,
  topic,
  difficulty,
  options,
  correctAnswer,
  explanation,
  url,
  hasVideo,
  solveCount,
}: {
  questionText: string
  subject: string
  grade: number
  topic: string
  difficulty: string
  options: { key: string; value: string }[]
  correctAnswer: string
  explanation?: string
  url: string
  hasVideo?: boolean
  solveCount?: number
}) {
  const baseUrl = 'https://www.teknokul.com.tr'
  
  const difficultyMap: Record<string, string> = {
    'easy': 'Kolay',
    'medium': 'Orta',
    'hard': 'Zor',
    'legendary': 'Çok Zor',
  }
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Question',
    name: questionText.substring(0, 100) + (questionText.length > 100 ? '...' : ''),
    text: questionText,
    url: url,
    
    // Soru detayları
    answerCount: 1,
    
    // Doğru cevap
    acceptedAnswer: {
      '@type': 'Answer',
      text: options.find(o => o.key === correctAnswer)?.value || correctAnswer,
      ...(explanation && { description: explanation }),
      upvoteCount: solveCount || 0,
    },
    
    // Yanlış cevaplar
    suggestedAnswer: options
      .filter(o => o.key !== correctAnswer)
      .map(o => ({
        '@type': 'Answer',
        text: o.value,
      })),
    
    // Eğitim bilgileri
    about: [
      {
        '@type': 'Thing',
        name: subject,
      },
      {
        '@type': 'Thing',
        name: topic,
      },
    ],
    
    // Zorluk seviyesi
    educationalLevel: `${grade}. Sınıf - ${difficultyMap[difficulty] || 'Orta'}`,
    
    // Sağlayıcı
    author: {
      '@type': 'Organization',
      name: 'Teknokul',
      url: baseUrl,
    },
    
    // Video varsa
    ...(hasVideo && {
      video: {
        '@type': 'VideoObject',
        name: `${topic} - Soru Çözümü`,
        description: `${subject} ${grade}. sınıf ${topic} video çözüm`,
      },
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  )
}

