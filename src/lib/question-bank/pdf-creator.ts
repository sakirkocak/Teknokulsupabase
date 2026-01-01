/**
 * Server-side PDF Creator
 * Puppeteer ile HTML'den PDF oluşturur
 */

import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

// Vercel production ortamında chromium path
async function getBrowser() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    // Vercel/Lambda ortamı
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 720 },
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  } else {
    // Local development - sistem Chrome'u kullan
    const possiblePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
      '/usr/bin/google-chrome', // Linux
      '/usr/bin/chromium-browser', // Linux Chromium
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
    ]
    
    let executablePath = ''
    for (const path of possiblePaths) {
      try {
        const fs = await import('fs')
        if (fs.existsSync(path)) {
          executablePath = path
          break
        }
      } catch {}
    }
    
    if (!executablePath) {
      throw new Error('Chrome bulunamadı. Lütfen Chrome yükleyin.')
    }
    
    return puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }
}

export interface PDFResult {
  buffer: Buffer
  sizeKb: number
}

/**
 * HTML'den PDF oluşturur
 */
export async function createPDFFromHtml(html: string): Promise<PDFResult> {
  let browser = null
  
  try {
    console.log('🚀 Starting browser...')
    browser = await getBrowser()
    
    console.log('📄 Creating page...')
    const page = await browser.newPage()
    
    // HTML içeriğini yükle
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    
    // KaTeX'in yüklenmesini bekle
    await page.waitForFunction(() => {
      return document.fonts.ready
    }, { timeout: 10000 }).catch(() => {
      console.log('⚠️ Font loading timeout, continuing anyway...')
    })
    
    // Ekstra bekleme (görseller ve fontlar için)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log('📝 Generating PDF...')
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm'
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true
    })
    
    const sizeKb = Math.round(pdfBuffer.length / 1024)
    console.log(`✅ PDF created: ${sizeKb}KB`)
    
    return {
      buffer: Buffer.from(pdfBuffer),
      sizeKb
    }
    
  } finally {
    if (browser) {
      await browser.close()
      console.log('🔒 Browser closed')
    }
  }
}
