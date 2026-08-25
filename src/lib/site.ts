/**
 * Site adresi - tek kaynak.
 *
 * Soru Dunyasi sorudunyasi.teknokul.com.tr uzerinden yayinda.
 * teknokul.com.tr ana domaini okul/veli iletisim uygulamasina devredildi,
 * bu yuzden canonical/sitemap/OG adreslerinde ASLA kullanilmamali.
 *
 * Domain tekrar degisirse sadece NEXT_PUBLIC_SITE_URL guncellenir.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://sorudunyasi.teknokul.com.tr'
).replace(/\/+$/, '')

/** Protokolsuz gosterim - footer, watermark, paylasim metinleri icin */
export const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, '')

/** Marka e-postalari - domain tasinsa da degismez */
export const CONTACT_EMAIL = 'info@teknokul.com.tr'
export const SUPPORT_EMAIL = 'destek@teknokul.com.tr'
