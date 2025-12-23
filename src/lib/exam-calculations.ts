/**
 * LGS ve YKS Puan Hesaplama Fonksiyonları
 * 
 * Not: Bu hesaplamalar yaklaşık değerlerdir.
 * Gerçek sonuçlar ÖSYM/MEB tarafından belirlenir.
 */

// ============================================
// LGS HESAPLAMA
// ============================================

export interface LGSNetler {
  turkce: number      // Max 20
  matematik: number   // Max 20
  fen: number         // Max 20
  inkilap: number     // Max 10 (T.C. İnkılap Tarihi ve Atatürkçülük)
  din: number         // Max 10
  ingilizce: number   // Max 10
}

export interface LGSSonuc {
  toplamNet: number
  toplamSoru: number
  basariYuzdesi: number
  tahminiPuan: number
  tahminiYuzdelik: number
  dersBazliPuanlar: {
    turkce: number
    matematik: number
    fen: number
    inkilap: number
    din: number
    ingilizce: number
  }
}

// 2025 LGS Soru Sayıları ve Katsayılar
// Matematik, Türkçe, Fen = 4 katsayı (toplam puanın ~%80'i)
// İnkılap, Din, Yabancı Dil = 1 katsayı
const LGS_KATSAYILAR = {
  turkce: 4,        // Yüksek ağırlık
  matematik: 4,     // Yüksek ağırlık
  fen: 4,           // Yüksek ağırlık
  inkilap: 1,       // Düşük ağırlık
  din: 1,           // Düşük ağırlık
  ingilizce: 1,     // Düşük ağırlık
}

const LGS_SORU_SAYILARI = {
  turkce: 20,       // 20 soru
  matematik: 20,    // 20 soru
  fen: 20,          // 20 soru
  inkilap: 10,      // 10 soru (T.C. İnkılap Tarihi ve Atatürkçülük)
  din: 10,          // 10 soru (Din Kültürü ve Ahlak Bilgisi)
  ingilizce: 10,    // 10 soru (Yabancı Dil)
  // Toplam: 90 soru
}

export function hesaplaLGS(netler: LGSNetler): LGSSonuc {
  // Validasyon
  const validNetler = {
    turkce: Math.min(Math.max(0, netler.turkce), LGS_SORU_SAYILARI.turkce),
    matematik: Math.min(Math.max(0, netler.matematik), LGS_SORU_SAYILARI.matematik),
    fen: Math.min(Math.max(0, netler.fen), LGS_SORU_SAYILARI.fen),
    inkilap: Math.min(Math.max(0, netler.inkilap), LGS_SORU_SAYILARI.inkilap),
    din: Math.min(Math.max(0, netler.din), LGS_SORU_SAYILARI.din),
    ingilizce: Math.min(Math.max(0, netler.ingilizce), LGS_SORU_SAYILARI.ingilizce),
  }

  // Toplam net ve soru sayısı
  const toplamNet = Object.values(validNetler).reduce((a, b) => a + b, 0)
  const toplamSoru = Object.values(LGS_SORU_SAYILARI).reduce((a, b) => a + b, 0) // 100
  const basariYuzdesi = (toplamNet / toplamSoru) * 100

  // Ders bazlı puanlar
  const dersBazliPuanlar = {
    turkce: validNetler.turkce * LGS_KATSAYILAR.turkce,
    matematik: validNetler.matematik * LGS_KATSAYILAR.matematik,
    fen: validNetler.fen * LGS_KATSAYILAR.fen,
    inkilap: validNetler.inkilap * LGS_KATSAYILAR.inkilap,
    din: validNetler.din * LGS_KATSAYILAR.din,
    ingilizce: validNetler.ingilizce * LGS_KATSAYILAR.ingilizce,
  }

  // Toplam ham puan
  const toplamHamPuan = Object.values(dersBazliPuanlar).reduce((a, b) => a + b, 0)
  
  // LGS Puanı hesaplama (100-500 arası)
  // Formül: Taban Puan (100) + (Ağırlıklı Ham Puan / Max Ağırlıklı Ham Puan) * 400
  // Max = (20*4 + 20*4 + 20*4 + 10*1 + 10*1 + 10*1) = 270
  const maxHamPuan = 
    LGS_SORU_SAYILARI.turkce * LGS_KATSAYILAR.turkce +
    LGS_SORU_SAYILARI.matematik * LGS_KATSAYILAR.matematik +
    LGS_SORU_SAYILARI.fen * LGS_KATSAYILAR.fen +
    LGS_SORU_SAYILARI.inkilap * LGS_KATSAYILAR.inkilap +
    LGS_SORU_SAYILARI.din * LGS_KATSAYILAR.din +
    LGS_SORU_SAYILARI.ingilizce * LGS_KATSAYILAR.ingilizce // 270

  const tahminiPuan = 100 + (toplamHamPuan / maxHamPuan) * 400

  // Yüzdelik dilim tahmini (basit lineer model)
  // Gerçekte çan eğrisi kullanılır
  const tahminiYuzdelik = hesaplaYuzdelikDilim(basariYuzdesi)

  return {
    toplamNet,
    toplamSoru,
    basariYuzdesi: Math.round(basariYuzdesi * 100) / 100,
    tahminiPuan: Math.round(tahminiPuan * 100) / 100,
    tahminiYuzdelik,
    dersBazliPuanlar,
  }
}

function hesaplaYuzdelikDilim(basariYuzdesi: number): number {
  // Basit yüzdelik tahmin modeli
  // Gerçekte ÖSYM verileriyle çan eğrisi kullanılmalı
  if (basariYuzdesi >= 95) return 0.1
  if (basariYuzdesi >= 90) return 0.5
  if (basariYuzdesi >= 85) return 1
  if (basariYuzdesi >= 80) return 3
  if (basariYuzdesi >= 75) return 5
  if (basariYuzdesi >= 70) return 10
  if (basariYuzdesi >= 65) return 15
  if (basariYuzdesi >= 60) return 20
  if (basariYuzdesi >= 55) return 30
  if (basariYuzdesi >= 50) return 40
  if (basariYuzdesi >= 45) return 50
  if (basariYuzdesi >= 40) return 60
  if (basariYuzdesi >= 35) return 70
  if (basariYuzdesi >= 30) return 80
  if (basariYuzdesi >= 25) return 90
  return 95
}

// ============================================
// YKS HESAPLAMA
// ============================================

// YKS'de 4 yanlış 1 doğruyu götürür
// Net = Doğru - (Yanlış / 4)

export interface TYTNetler {
  turkce: number      // Max 40
  sosyal: number      // Max 20
  matematik: number   // Max 40
  fen: number         // Max 20
}

export interface AYTNetler {
  matematik?: number      // Max 40 (SAY, EA)
  fizik?: number          // Max 14 (SAY)
  kimya?: number          // Max 13 (SAY)
  biyoloji?: number       // Max 13 (SAY)
  edebiyat?: number       // Max 24 (SOZ, EA)
  tarih1?: number         // Max 10 (SOZ, EA)
  cografya1?: number      // Max 6 (SOZ, EA)
  tarih2?: number         // Max 11 (SOZ)
  cografya2?: number      // Max 11 (SOZ)
  felsefe?: number        // Max 12 (SOZ)
  din?: number            // Max 6 (SOZ)
}

export type YKSPuanTuru = 'SAY' | 'SOZ' | 'EA' | 'DIL'

export interface YKSSonuc {
  tytPuan: number         // TYT ham puan
  tytKatki: number        // TYT'nin yerleşme puanına katkısı (%40)
  aytPuan: number         // AYT ham puan
  aytKatki: number        // AYT'nin yerleşme puanına katkısı (%60)
  hamPuan: number         // Toplam ham puan (TYT + AYT katkıları)
  obpPuan: number         // OBP (Diploma notu x 5)
  obpKatki: number        // OBP'nin puanına katkısı (OBP x 0.12)
  yerlesmeYKS: number     // Yerleştirme puanı (Ham puan + OBP katkısı)
  tahminiSiralama: number
  puanTuru: YKSPuanTuru
}

// TYT Katsayıları (2025 tahmini)
// TYT toplam puana %40 katkı sağlar
// Ortalama net başına ~1.33 puan
const TYT_KATSAYILAR = {
  turkce: 1.33,     // 40 soru
  sosyal: 1.36,     // 20 soru
  matematik: 1.33,  // 40 soru
  fen: 1.36,        // 20 soru
}

// TYT Soru Sayıları (Toplam 120 soru, 165 dakika)
const TYT_SORU_SAYILARI = {
  turkce: 40,     // Dil Bilgisi ve Paragraf
  sosyal: 20,     // Tarih (5), Coğrafya (5), Felsefe (5), Din Kültürü (5)
  matematik: 40,  // Matematik ve Geometri
  fen: 20,        // Fizik (7), Kimya (7), Biyoloji (6)
  // Toplam: 120 soru
}

// AYT Katsayıları (puan türüne göre değişir)
// AYT toplam puana %60 katkı sağlar
const AYT_KATSAYILAR = {
  SAY: {
    matematik: 3.0,      // 40 soru
    fizik: 2.85,         // 14 soru
    kimya: 3.07,         // 13 soru
    biyoloji: 3.07,      // 13 soru
  },
  SOZ: {
    edebiyat: 3.0,       // 24 soru
    tarih1: 2.80,        // 10 soru
    cografya1: 3.33,     // 6 soru
    tarih2: 2.91,        // 11 soru
    cografya2: 2.91,     // 11 soru
    felsefe: 3.0,        // 12 soru
    din: 3.33,           // 6 soru
  },
  EA: {
    matematik: 3.0,      // 40 soru
    edebiyat: 3.0,       // 24 soru
    tarih1: 2.80,        // 10 soru
    cografya1: 3.30,     // 6 soru
  },
}

// AYT Soru Sayıları (Toplam 160 soru, aday kendi alanına göre ~80 soru çözer)
const AYT_SORU_SAYILARI = {
  // Matematik Testi (40 soru)
  matematik: 40,
  // Fen Bilimleri Testi (40 soru)
  fizik: 14,
  kimya: 13,
  biyoloji: 13,
  // Türk Dili ve Edebiyatı - Sosyal Bilimler-1 Testi (40 soru)
  edebiyat: 24,
  tarih1: 10,
  cografya1: 6,
  // Sosyal Bilimler-2 Testi (40 soru)
  tarih2: 11,
  cografya2: 11,
  felsefe: 12,
  din: 6,
}

export function hesaplaTYT(netler: TYTNetler): { hamPuan: number, toplamNet: number } {
  const validNetler = {
    turkce: Math.min(Math.max(0, netler.turkce), TYT_SORU_SAYILARI.turkce),
    sosyal: Math.min(Math.max(0, netler.sosyal), TYT_SORU_SAYILARI.sosyal),
    matematik: Math.min(Math.max(0, netler.matematik), TYT_SORU_SAYILARI.matematik),
    fen: Math.min(Math.max(0, netler.fen), TYT_SORU_SAYILARI.fen),
  }

  const toplamNet = validNetler.turkce + validNetler.sosyal + validNetler.matematik + validNetler.fen

  // TYT Ham Puan = Taban (100) + (Netler * Katsayılar)
  const hamPuan = 100 +
    validNetler.turkce * TYT_KATSAYILAR.turkce +
    validNetler.sosyal * TYT_KATSAYILAR.sosyal +
    validNetler.matematik * TYT_KATSAYILAR.matematik +
    validNetler.fen * TYT_KATSAYILAR.fen

  return { hamPuan, toplamNet }
}

export function hesaplaAYT(netler: AYTNetler, puanTuru: YKSPuanTuru): { hamPuan: number, toplamNet: number } {
  let hamPuan = 0
  let toplamNet = 0

  if (puanTuru === 'SAY') {
    const matematik = Math.min(Math.max(0, netler.matematik || 0), AYT_SORU_SAYILARI.matematik)
    const fizik = Math.min(Math.max(0, netler.fizik || 0), AYT_SORU_SAYILARI.fizik)
    const kimya = Math.min(Math.max(0, netler.kimya || 0), AYT_SORU_SAYILARI.kimya)
    const biyoloji = Math.min(Math.max(0, netler.biyoloji || 0), AYT_SORU_SAYILARI.biyoloji)
    
    toplamNet = matematik + fizik + kimya + biyoloji
    hamPuan = 
      matematik * AYT_KATSAYILAR.SAY.matematik +
      fizik * AYT_KATSAYILAR.SAY.fizik +
      kimya * AYT_KATSAYILAR.SAY.kimya +
      biyoloji * AYT_KATSAYILAR.SAY.biyoloji
  } else if (puanTuru === 'SOZ') {
    const edebiyat = Math.min(Math.max(0, netler.edebiyat || 0), AYT_SORU_SAYILARI.edebiyat)
    const tarih1 = Math.min(Math.max(0, netler.tarih1 || 0), AYT_SORU_SAYILARI.tarih1)
    const cografya1 = Math.min(Math.max(0, netler.cografya1 || 0), AYT_SORU_SAYILARI.cografya1)
    const tarih2 = Math.min(Math.max(0, netler.tarih2 || 0), AYT_SORU_SAYILARI.tarih2)
    const cografya2 = Math.min(Math.max(0, netler.cografya2 || 0), AYT_SORU_SAYILARI.cografya2)
    const felsefe = Math.min(Math.max(0, netler.felsefe || 0), AYT_SORU_SAYILARI.felsefe)
    const din = Math.min(Math.max(0, netler.din || 0), AYT_SORU_SAYILARI.din)

    toplamNet = edebiyat + tarih1 + cografya1 + tarih2 + cografya2 + felsefe + din
    hamPuan = 
      edebiyat * AYT_KATSAYILAR.SOZ.edebiyat +
      tarih1 * AYT_KATSAYILAR.SOZ.tarih1 +
      cografya1 * AYT_KATSAYILAR.SOZ.cografya1 +
      tarih2 * AYT_KATSAYILAR.SOZ.tarih2 +
      cografya2 * AYT_KATSAYILAR.SOZ.cografya2 +
      felsefe * AYT_KATSAYILAR.SOZ.felsefe +
      din * AYT_KATSAYILAR.SOZ.din
  } else if (puanTuru === 'EA') {
    const matematik = Math.min(Math.max(0, netler.matematik || 0), AYT_SORU_SAYILARI.matematik)
    const edebiyat = Math.min(Math.max(0, netler.edebiyat || 0), AYT_SORU_SAYILARI.edebiyat)
    const tarih1 = Math.min(Math.max(0, netler.tarih1 || 0), AYT_SORU_SAYILARI.tarih1)
    const cografya1 = Math.min(Math.max(0, netler.cografya1 || 0), AYT_SORU_SAYILARI.cografya1)

    toplamNet = matematik + edebiyat + tarih1 + cografya1
    hamPuan = 
      matematik * AYT_KATSAYILAR.EA.matematik +
      edebiyat * AYT_KATSAYILAR.EA.edebiyat +
      tarih1 * AYT_KATSAYILAR.EA.tarih1 +
      cografya1 * AYT_KATSAYILAR.EA.cografya1
  }

  return { hamPuan, toplamNet }
}

export function hesaplaYKS(
  tytNetler: TYTNetler, 
  aytNetler: AYTNetler, 
  puanTuru: YKSPuanTuru,
  diplomaNotu: number = 80, // 50-100 arası
  kirikOBP: boolean = false // Önceki yıl yerleşti mi?
): YKSSonuc {
  const tytSonuc = hesaplaTYT(tytNetler)
  const aytSonuc = hesaplaAYT(aytNetler, puanTuru)
  
  // OBP (Ortaöğretim Başarı Puanı) Hesaplama
  // Diploma notu (50-100) x 5 = OBP (250-500 arası)
  const validDiplomaNotu = Math.min(Math.max(50, diplomaNotu), 100)
  const obpPuan = validDiplomaNotu * 5
  
  // OBP Katkısı: OBP x 0.12 (veya 0.06 kırık OBP için)
  const obpKatsayi = kirikOBP ? 0.06 : 0.12
  const obpKatki = obpPuan * obpKatsayi

  // TYT katkısı (%40): TYT ham puanının %40'ı
  const tytKatki = tytSonuc.hamPuan * 0.4
  
  // AYT katkısı (%60): AYT ham puanının %60'ı
  const aytKatki = aytSonuc.hamPuan * 0.6
  
  // Ham Puan = TYT katkısı + AYT katkısı
  const hamPuan = tytKatki + aytKatki

  // Yerleştirme Puanı = Ham Puan + OBP Katkısı
  const yerlesmeYKS = hamPuan + obpKatki

  // Tahmini sıralama (basit model)
  const tahminiSiralama = hesaplaYKSSiralama(yerlesmeYKS, puanTuru)

  return {
    tytPuan: Math.round(tytSonuc.hamPuan * 100) / 100,
    tytKatki: Math.round(tytKatki * 100) / 100,
    aytPuan: Math.round(aytSonuc.hamPuan * 100) / 100,
    aytKatki: Math.round(aytKatki * 100) / 100,
    hamPuan: Math.round(hamPuan * 100) / 100,
    obpPuan: Math.round(obpPuan * 100) / 100,
    obpKatki: Math.round(obpKatki * 100) / 100,
    yerlesmeYKS: Math.round(yerlesmeYKS * 100) / 100,
    tahminiSiralama,
    puanTuru,
  }
}

function hesaplaYKSSiralama(puan: number, puanTuru: YKSPuanTuru): number {
  // Basit sıralama tahmini (2024 verilerine yakın)
  // Gerçek verilerle güncellenmeli
  const maksimumAday = {
    SAY: 500000,
    SOZ: 600000,
    EA: 700000,
    DIL: 100000,
  }

  const topAday = maksimumAday[puanTuru]
  
  // Lineer olmayan tahmin (yüksek puanlar üstte sıkışır)
  if (puan >= 500) return Math.round(topAday * 0.001)
  if (puan >= 450) return Math.round(topAday * 0.01)
  if (puan >= 400) return Math.round(topAday * 0.05)
  if (puan >= 350) return Math.round(topAday * 0.15)
  if (puan >= 300) return Math.round(topAday * 0.30)
  if (puan >= 250) return Math.round(topAday * 0.50)
  if (puan >= 200) return Math.round(topAday * 0.70)
  
  return Math.round(topAday * 0.90)
}

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

export function formatPuan(puan: number): string {
  return puan.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatSiralama(siralama: number): string {
  return siralama.toLocaleString('tr-TR')
}

// Geçmiş yıl verileri (yaklaşık)
export const LGS_GECMIS_YILLAR = [
  { yil: 2024, ortPuan: 280, yuzde1Esik: 475, yuzde5Esik: 440 },
  { yil: 2023, ortPuan: 275, yuzde1Esik: 470, yuzde5Esik: 435 },
  { yil: 2022, ortPuan: 270, yuzde1Esik: 465, yuzde5Esik: 430 },
]

export const YKS_GECMIS_YILLAR = {
  SAY: [
    { yil: 2024, ilk1000Puan: 520, ilk10000Puan: 450, ilk50000Puan: 380 },
    { yil: 2023, ilk1000Puan: 515, ilk10000Puan: 445, ilk50000Puan: 375 },
  ],
  SOZ: [
    { yil: 2024, ilk1000Puan: 480, ilk10000Puan: 420, ilk50000Puan: 350 },
    { yil: 2023, ilk1000Puan: 475, ilk10000Puan: 415, ilk50000Puan: 345 },
  ],
  EA: [
    { yil: 2024, ilk1000Puan: 500, ilk10000Puan: 430, ilk50000Puan: 360 },
    { yil: 2023, ilk1000Puan: 495, ilk10000Puan: 425, ilk50000Puan: 355 },
  ],
}

