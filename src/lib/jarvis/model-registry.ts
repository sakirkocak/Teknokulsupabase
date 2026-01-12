/**
 * 🎨 JARVIS 3D Model Registry
 * Profesyonel 3D modellerin merkezi yönetimi
 * 
 * Toplam: 33+ model, 135+ MB
 * Kaynaklar: Khronos, Three.js, Custom
 * 
 * Modeller Supabase Storage'da: /storage/v1/object/public/models/
 */

// Supabase Storage base URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cnawnprwdcfmyswqolsu.supabase.co'
export const MODELS_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/models`

// Helper: Local path'i Supabase URL'e çevir
export function getModelUrl(localPath: string): string {
  // /models/biology/brain.glb -> https://...supabase.co/storage/v1/object/public/models/biology/brain.glb
  const cleanPath = localPath.replace(/^\/models\//, '')
  return `${MODELS_BASE_URL}/${cleanPath}`
}

export interface Model3D {
  id: string
  name: string
  path: string
  format: 'glb' | 'gltf'
  source: 'khronos' | 'threejs' | 'sketchfab' | 'custom'
  license: 'cc0' | 'cc-by' | 'cc-by-nc' | 'public-domain'
  category: 'biology' | 'chemistry' | 'physics' | 'math' | 'anatomy' | 'astronomy'
  subjects: string[]
  parts?: string[]
  animations?: string[]
  defaultScale?: number
  defaultPosition?: [number, number, number]
  description: string
  sourceUrl?: string
}

// ============================================
// 33 MODEL - TAM LİSTE
// ============================================

export const MODEL_REGISTRY: Record<string, Model3D> = {
  // ==========================================
  // 🧬 BİYOLOJİ MODELLERİ (10)
  // ==========================================
  
  'brain': {
    id: 'brain',
    name: 'Beyin Sapı',
    path: '/models/biology/brain.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'biology',
    subjects: ['biyoloji', 'fen-bilimleri', 'anatomi', 'sinir'],
    defaultScale: 0.5,
    defaultPosition: [0, 0, 0],
    description: 'Beyin sapı 3D modeli - sinir sistemi'
  },
  
  'dragon': {
    id: 'dragon',
    name: 'Ejderha',
    path: '/models/biology/dragon.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'biology',
    subjects: ['biyoloji', 'hayvanlar', 'mitoloji', 'fantastik'],
    defaultScale: 0.5,
    defaultPosition: [0, 0, 0],
    description: 'Detaylı ejderha modeli'
  },
  
  'mosquito': {
    id: 'mosquito',
    name: 'Kehribar İçinde Sivrisinek',
    path: '/models/biology/mosquito.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'biology',
    subjects: ['biyoloji', 'böcekler', 'fosil', 'evrim'],
    defaultScale: 5,
    defaultPosition: [0, 0, 0],
    description: 'Kehribar içinde korunmuş sivrisinek - evrim ve fosil'
  },
  
  'fox': {
    id: 'fox',
    name: 'Tilki',
    path: '/models/biology/fox.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'biology',
    subjects: ['biyoloji', 'hayvanlar', 'memeli', 'canlı'],
    animations: ['walk', 'run'],
    defaultScale: 0.03,
    defaultPosition: [0, -1, 0],
    description: 'Animasyonlu tilki modeli'
  },
  
  'duck': {
    id: 'duck',
    name: 'Ördek',
    path: '/models/biology/duck.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'biology',
    subjects: ['biyoloji', 'hayvanlar', 'kuş'],
    defaultScale: 2,
    defaultPosition: [0, -0.5, 0],
    description: 'Ördek modeli'
  },
  
  'flamingo': {
    id: 'flamingo',
    name: 'Flamingo',
    path: '/models/biology/flamingo.glb',
    format: 'glb',
    source: 'threejs',
    license: 'cc0',
    category: 'biology',
    subjects: ['biyoloji', 'hayvanlar', 'kuş'],
    animations: ['fly'],
    defaultScale: 0.03,
    defaultPosition: [0, 0, 0],
    description: 'Animasyonlu flamingo'
  },
  
  'parrot': {
    id: 'parrot',
    name: 'Papağan',
    path: '/models/biology/parrot.glb',
    format: 'glb',
    source: 'threejs',
    license: 'cc0',
    category: 'biology',
    subjects: ['biyoloji', 'hayvanlar', 'kuş'],
    animations: ['fly'],
    defaultScale: 0.03,
    defaultPosition: [0, 0, 0],
    description: 'Animasyonlu papağan'
  },
  
  'stork': {
    id: 'stork',
    name: 'Leylek',
    path: '/models/biology/stork.glb',
    format: 'glb',
    source: 'threejs',
    license: 'cc0',
    category: 'biology',
    subjects: ['biyoloji', 'hayvanlar', 'kuş', 'göç'],
    animations: ['fly'],
    defaultScale: 0.03,
    defaultPosition: [0, 0, 0],
    description: 'Animasyonlu leylek - göç konusu'
  },
  
  'horse': {
    id: 'horse',
    name: 'At',
    path: '/models/biology/horse.glb',
    format: 'glb',
    source: 'threejs',
    license: 'cc0',
    category: 'biology',
    subjects: ['biyoloji', 'hayvanlar', 'memeli'],
    animations: ['gallop'],
    defaultScale: 0.03,
    defaultPosition: [0, -1, 0],
    description: 'Animasyonlu at modeli'
  },
  
  'fish': {
    id: 'fish',
    name: 'Balık',
    path: '/models/biology/fish.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'biology',
    subjects: ['biyoloji', 'hayvanlar', 'deniz', 'su'],
    defaultScale: 10,
    defaultPosition: [0, 0, 0],
    description: 'Detaylı balık modeli'
  },

  // ==========================================
  // ⚗️ KİMYA MODELLERİ (3)
  // ==========================================
  
  'water-bottle': {
    id: 'water-bottle',
    name: 'Su Şişesi',
    path: '/models/chemistry/water-bottle.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'chemistry',
    subjects: ['kimya', 'fen-bilimleri', 'su', 'molekül'],
    defaultScale: 5,
    defaultPosition: [0, -1, 0],
    description: 'Su ve moleküller için görsel'
  },
  
  'carbon-fiber': {
    id: 'carbon-fiber',
    name: 'Karbon Fiber',
    path: '/models/chemistry/carbon-fiber.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'chemistry',
    subjects: ['kimya', 'malzeme', 'karbon', 'atom'],
    defaultScale: 2,
    defaultPosition: [0, 0, 0],
    description: 'Karbon fiber yapısı - malzeme bilimi'
  },
  
  'materials-shoe': {
    id: 'materials-shoe',
    name: 'Malzeme Çeşitleri',
    path: '/models/chemistry/materials-shoe.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'chemistry',
    subjects: ['kimya', 'malzeme', 'polimer', 'plastik'],
    defaultScale: 10,
    defaultPosition: [0, -0.5, 0],
    description: 'Farklı malzeme türleri demo'
  },

  // ==========================================
  // ⚛️ FİZİK MODELLERİ (11)
  // ==========================================
  
  'toy-car': {
    id: 'toy-car',
    name: 'Oyuncak Araba',
    path: '/models/physics/toy-car.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'physics',
    subjects: ['fizik', 'hareket', 'hız', 'mekanik'],
    defaultScale: 30,
    defaultPosition: [0, -0.5, 0],
    description: 'Hareket ve mekanik için'
  },
  
  'ferrari': {
    id: 'ferrari',
    name: 'Ferrari',
    path: '/models/physics/ferrari.glb',
    format: 'glb',
    source: 'threejs',
    license: 'cc0',
    category: 'physics',
    subjects: ['fizik', 'hız', 'ivme', 'sürtünme', 'araç'],
    defaultScale: 1.5,
    defaultPosition: [0, 0, 0],
    description: 'Hız ve ivme konuları için spor araba'
  },
  
  'lantern': {
    id: 'lantern',
    name: 'Fener',
    path: '/models/physics/lantern.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'physics',
    subjects: ['fizik', 'ışık', 'optik', 'enerji'],
    defaultScale: 0.1,
    defaultPosition: [0, -1, 0],
    description: 'Işık ve optik için'
  },
  
  'iridescent-lamp': {
    id: 'iridescent-lamp',
    name: 'Gökkuşağı Lamba',
    path: '/models/physics/iridescent-lamp.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'physics',
    subjects: ['fizik', 'ışık', 'kırılma', 'renk', 'spektrum'],
    defaultScale: 5,
    defaultPosition: [0, -1, 0],
    description: 'Işık kırılması ve renk spektrumu'
  },
  
  'antique-camera': {
    id: 'antique-camera',
    name: 'Antik Kamera',
    path: '/models/physics/antique-camera.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'physics',
    subjects: ['fizik', 'optik', 'lens', 'görüntü'],
    defaultScale: 0.3,
    defaultPosition: [0, 0, 0],
    description: 'Optik ve lens konuları için'
  },
  
  'robot': {
    id: 'robot',
    name: 'Robot',
    path: '/models/physics/robot.glb',
    format: 'glb',
    source: 'threejs',
    license: 'cc0',
    category: 'physics',
    subjects: ['fizik', 'teknoloji', 'robotik', 'mekanik'],
    animations: ['wave', 'dance'],
    defaultScale: 1,
    defaultPosition: [0, -1, 0],
    description: 'Animasyonlu robot - teknoloji'
  },
  
  'damaged-helmet': {
    id: 'damaged-helmet',
    name: 'Hasarlı Kask',
    path: '/models/physics/damaged-helmet.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'physics',
    subjects: ['fizik', 'malzeme', 'dayanıklılık', 'kuvvet'],
    defaultScale: 2,
    defaultPosition: [0, 0, 0],
    description: 'Malzeme dayanıklılığı'
  },
  
  'sheen-chair': {
    id: 'sheen-chair',
    name: 'Parlak Sandalye',
    path: '/models/physics/sheen-chair.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'physics',
    subjects: ['fizik', 'yansıma', 'ışık', 'malzeme'],
    defaultScale: 3,
    defaultPosition: [0, -1, 0],
    description: 'Işık yansıması demo'
  },
  
  'littlest-tokyo': {
    id: 'littlest-tokyo',
    name: 'Mini Tokyo',
    path: '/models/physics/littlest-tokyo.glb',
    format: 'glb',
    source: 'threejs',
    license: 'cc0',
    category: 'physics',
    subjects: ['fizik', 'şehir', 'mimari', 'mühendislik'],
    animations: ['animate'],
    defaultScale: 0.01,
    defaultPosition: [0, -1, 0],
    description: 'Animasyonlu şehir modeli'
  },
  
  'ufo': {
    id: 'ufo',
    name: 'UFO Tabağı',
    path: '/models/physics/ufo.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'physics',
    subjects: ['fizik', 'uzay', 'astronomi', 'bilim-kurgu'],
    defaultScale: 10,
    defaultPosition: [0, 0, 0],
    description: 'Uzay ve astronomi konuları'
  },
  
  'milk-truck': {
    id: 'milk-truck',
    name: 'Kamyon',
    path: '/models/physics/sponza-lamp.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'physics',
    subjects: ['fizik', 'hareket', 'taşımacılık'],
    defaultScale: 0.5,
    defaultPosition: [0, -0.5, 0],
    description: 'Hareket ve taşıma'
  },

  // ==========================================
  // 🧮 MATEMATİK MODELLERİ (3)
  // ==========================================
  
  'box-animated': {
    id: 'box-animated',
    name: 'Animasyonlu Küp',
    path: '/models/math/box-animated.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'math',
    subjects: ['matematik', 'geometri', 'küp'],
    animations: ['rotate'],
    defaultScale: 1,
    defaultPosition: [0, 0, 0],
    description: 'Geometrik şekil'
  },
  
  'morph-cube': {
    id: 'morph-cube',
    name: 'Şekil Değiştiren Küp',
    path: '/models/math/animated-morphcube.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'math',
    subjects: ['matematik', 'geometri', 'dönüşüm'],
    animations: ['morph'],
    defaultScale: 1,
    defaultPosition: [0, 0, 0],
    description: 'Geometrik dönüşümler'
  },
  
  'interpolation': {
    id: 'interpolation',
    name: 'İnterpolasyon',
    path: '/models/math/interpolation.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'math',
    subjects: ['matematik', 'fonksiyon', 'grafik'],
    animations: ['interpolate'],
    defaultScale: 1,
    defaultPosition: [0, 0, 0],
    description: 'Matematiksel fonksiyonlar'
  },

  // ==========================================
  // 🫀 ANATOMİ MODELLERİ (6)
  // ==========================================
  
  'avocado': {
    id: 'avocado',
    name: 'Avokado',
    path: '/models/anatomy/avocado.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'anatomy',
    subjects: ['biyoloji', 'bitki', 'meyve', 'beslenme'],
    defaultScale: 30,
    defaultPosition: [0, 0, 0],
    description: 'Meyve yapısı'
  },
  
  'soldier': {
    id: 'soldier',
    name: 'Asker',
    path: '/models/anatomy/soldier.glb',
    format: 'glb',
    source: 'threejs',
    license: 'cc0',
    category: 'anatomy',
    subjects: ['anatomi', 'insan', 'hareket'],
    animations: ['walk', 'run', 'idle'],
    defaultScale: 0.8,
    defaultPosition: [0, -1, 0],
    description: 'Animasyonlu insan modeli'
  },
  
  'xbot': {
    id: 'xbot',
    name: 'X-Bot',
    path: '/models/anatomy/xbot.glb',
    format: 'glb',
    source: 'threejs',
    license: 'cc0',
    category: 'anatomy',
    subjects: ['anatomi', 'hareket', 'iskelet'],
    animations: ['walk', 'run'],
    defaultScale: 0.8,
    defaultPosition: [0, -1, 0],
    description: 'İnsan hareketi ve iskelet'
  },
  
  'michelle': {
    id: 'michelle',
    name: 'Michelle',
    path: '/models/anatomy/michelle.glb',
    format: 'glb',
    source: 'threejs',
    license: 'cc0',
    category: 'anatomy',
    subjects: ['anatomi', 'insan', 'hareket'],
    animations: ['idle'],
    defaultScale: 0.8,
    defaultPosition: [0, -1, 0],
    description: 'İnsan anatomisi'
  },
  
  'nefertiti': {
    id: 'nefertiti',
    name: 'Nefertiti',
    path: '/models/anatomy/nefertiti.glb',
    format: 'glb',
    source: 'threejs',
    license: 'cc0',
    category: 'anatomy',
    subjects: ['tarih', 'sanat', 'heykel'],
    defaultScale: 5,
    defaultPosition: [0, 0, 0],
    description: 'Tarihi heykel - sanat'
  },
  
  'skull-scan': {
    id: 'skull-scan',
    name: 'Kafatası Taraması',
    path: '/models/anatomy/skull-scan.glb',
    format: 'glb',
    source: 'khronos',
    license: 'cc0',
    category: 'anatomy',
    subjects: ['anatomi', 'iskelet', 'kemik', 'tıp'],
    defaultScale: 10,
    defaultPosition: [0, 0, 0],
    description: 'Detaylı kafatası - anatomi'
  }
}

// ============================================
// HELPER FONKSİYONLAR
// ============================================

export function getModelsForSubject(subject: string): Model3D[] {
  const normalized = subject.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_')
  
  return Object.values(MODEL_REGISTRY).filter(model => 
    model.subjects.some(s => {
      const ns = s.toLowerCase().replace(/-/g, '_')
      return ns === normalized || ns.includes(normalized) || normalized.includes(ns)
    })
  )
}

export function getModelById(id: string): Model3D | undefined {
  return MODEL_REGISTRY[id]
}

export function getModelsByCategory(category: Model3D['category']): Model3D[] {
  return Object.values(MODEL_REGISTRY).filter(model => model.category === category)
}

export function getAllModels(): Model3D[] {
  return Object.values(MODEL_REGISTRY)
}

export function getModelCount(): number {
  return Object.keys(MODEL_REGISTRY).length
}

// Soru içeriğinden model seç
export function selectModelForQuestion(subject: string, questionText: string): Model3D | null {
  const keywords = questionText.toLowerCase().split(/\s+/)
  
  const modelMapping: Record<string, string> = {
    // Biyoloji
    'beyin': 'brain', 'sinir': 'brain', 'nöron': 'brain',
    'ejderha': 'dragon', 'sürüngen': 'dragon',
    'sivrisinek': 'mosquito', 'böcek': 'mosquito', 'fosil': 'mosquito', 'kehribar': 'mosquito',
    'tilki': 'fox', 'memeli': 'fox',
    'ördek': 'duck', 'kuş': 'parrot',
    'flamingo': 'flamingo', 'papağan': 'parrot', 'leylek': 'stork',
    'at': 'horse', 'koşu': 'horse',
    'balık': 'fish', 'deniz': 'fish', 'akvaryum': 'fish',
    'hayvan': 'fox', 'canlı': 'fox',
    
    // Kimya
    'su': 'water-bottle', 'h2o': 'water-bottle', 'molekül': 'water-bottle',
    'karbon': 'carbon-fiber', 'atom': 'carbon-fiber',
    'malzeme': 'materials-shoe', 'polimer': 'materials-shoe',
    
    // Fizik
    'araba': 'ferrari', 'hız': 'ferrari', 'ivme': 'ferrari',
    'ışık': 'lantern', 'optik': 'iridescent-lamp', 'kırılma': 'iridescent-lamp',
    'kamera': 'antique-camera', 'lens': 'antique-camera',
    'robot': 'robot', 'teknoloji': 'robot',
    'kask': 'damaged-helmet', 'dayanıklılık': 'damaged-helmet',
    'yansıma': 'sheen-chair',
    'şehir': 'littlest-tokyo', 'mimari': 'littlest-tokyo',
    'uzay': 'ufo', 'astronomi': 'ufo',
    'hareket': 'toy-car', 'kuvvet': 'toy-car',
    
    // Matematik
    'küp': 'morph-cube', 'geometri': 'morph-cube', 'şekil': 'morph-cube',
    'fonksiyon': 'interpolation', 'grafik': 'interpolation',
    
    // Anatomi
    'insan': 'soldier', 'vücut': 'soldier',
    'iskelet': 'xbot', 'kemik': 'skull-scan',
    'kafatası': 'skull-scan', 'kafa': 'skull-scan',
    'meyve': 'avocado', 'bitki': 'avocado',
    'heykel': 'nefertiti', 'sanat': 'nefertiti',
  }
  
  for (const keyword of keywords) {
    if (modelMapping[keyword]) {
      return getModelById(modelMapping[keyword]) || null
    }
  }
  
  // Varsayılan
  const defaults: Record<string, string> = {
    'biyoloji': 'fox',
    'fen-bilimleri': 'brain',
    'fen_bilimleri': 'brain',
    'kimya': 'water-bottle',
    'fizik': 'ferrari',
    'matematik': 'morph-cube',
    'anatomi': 'soldier',
  }
  
  const norm = subject.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_')
  return getModelById(defaults[norm]) || getModelById('brain') || null
}

export const PLACEHOLDER_MODEL: Model3D = {
  id: 'placeholder',
  name: 'Yükleniyor',
  path: '',
  format: 'glb',
  source: 'custom',
  license: 'cc0',
  category: 'math',
  subjects: [],
  defaultScale: 1,
  defaultPosition: [0, 0, 0],
  description: 'Placeholder'
}
