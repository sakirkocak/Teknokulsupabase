const fs = require('fs');
const path = require('path');

// Etkilenen dosya yolları
const files = [
  'src/app/(dashboard)/admin/ayarlar/page.tsx',
  'src/app/(dashboard)/admin/icerikler/page.tsx',
  'src/app/(dashboard)/admin/istatistikler/page.tsx',
  'src/app/(dashboard)/admin/kocluklar/page.tsx',
  'src/app/(dashboard)/admin/kullanicilar/page.tsx',
  'src/app/(dashboard)/admin/page.tsx',
  'src/app/(dashboard)/admin/raporlar/page.tsx',
  'src/app/(dashboard)/koc/ai-araclar/arsiv/page.tsx',
  'src/app/(dashboard)/koc/ai-araclar/odev-olustur/page.tsx',
  'src/app/(dashboard)/koc/ai-araclar/page.tsx',
  'src/app/(dashboard)/koc/ai-araclar/plan-asistani/page.tsx',
  'src/app/(dashboard)/koc/ai-araclar/rapor-olusturucu/page.tsx',
  'src/app/(dashboard)/koc/ai-araclar/soru-havuzu/page.tsx',
  'src/app/(dashboard)/koc/ai-araclar/soru-uretici/page.tsx',
  'src/app/(dashboard)/koc/degerlendirmeler/page.tsx',
  'src/app/(dashboard)/koc/gorevler/page.tsx',
  'src/app/(dashboard)/koc/gorevler/yeni/page.tsx',
  'src/app/(dashboard)/koc/kazanclar/page.tsx',
  'src/app/(dashboard)/koc/materyaller/page.tsx',
  'src/app/(dashboard)/koc/mesajlar/page.tsx',
  'src/app/(dashboard)/koc/odev-sonuclari/page.tsx',
  'src/app/(dashboard)/koc/ogrenci-denemeleri/page.tsx',
  'src/app/(dashboard)/koc/ogrenci-sorulari/page.tsx',
  'src/app/(dashboard)/koc/ogrenciler/page.tsx',
  'src/app/(dashboard)/koc/page.tsx',
  'src/app/(dashboard)/koc/profil/page.tsx',
  'src/app/(dashboard)/koc/siniflarim/page.tsx',
  'src/app/(dashboard)/koc/siniflarim/yeni/page.tsx',
  'src/app/(dashboard)/koc/veli-raporlari/page.tsx',
  'src/app/(dashboard)/ogrenci/ai-araclar/calisma-plani/page.tsx',
  'src/app/(dashboard)/ogrenci/ai-araclar/konu-anlatimi/page.tsx',
  'src/app/(dashboard)/ogrenci/ai-araclar/page.tsx',
  'src/app/(dashboard)/ogrenci/ai-araclar/soru-cozucu/page.tsx',
  'src/app/(dashboard)/ogrenci/degerlendirme/page.tsx',
  'src/app/(dashboard)/ogrenci/denemeler/page.tsx',
  'src/app/(dashboard)/ogrenci/gorevler/page.tsx',
  'src/app/(dashboard)/ogrenci/ilerleme/page.tsx',
  'src/app/(dashboard)/ogrenci/kocum/page.tsx',
  'src/app/(dashboard)/ogrenci/mesajlar/page.tsx',
  'src/app/(dashboard)/ogrenci/odevler/page.tsx',
  'src/app/(dashboard)/ogrenci/page.tsx',
  'src/app/(dashboard)/ogrenci/profil/page.tsx',
  'src/app/(dashboard)/ogrenci/siniflarim/page.tsx',
  'src/app/(dashboard)/veli/page.tsx',
  'src/app/(dashboard)/veli/profil/page.tsx',
  'src/app/(dashboard)/veli/raporlar/page.tsx',
  'src/app/koclar/page.tsx',
  'src/app/materyaller/page.tsx',
  'src/app/page.tsx',
];

const dynamicExport = "export const dynamic = 'force-dynamic'\n";

let updated = 0;
let skipped = 0;

files.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Dosya bulunamadı: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Zaten dynamic export var mı kontrol et
  if (content.includes("export const dynamic")) {
    console.log(`⏭️  Zaten var: ${filePath}`);
    skipped++;
    return;
  }
  
  // 'use client' var mı kontrol et
  if (content.startsWith("'use client'") || content.startsWith('"use client"')) {
    // 'use client' satırından sonra ekle
    content = content.replace(
      /^(['"]use client['"])\n*/,
      `$1\n\n${dynamicExport}\n`
    );
  } else {
    // Dosyanın en başına ekle
    content = dynamicExport + '\n' + content;
  }
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Güncellendi: ${filePath}`);
  updated++;
});

console.log(`\n📊 Sonuç: ${updated} dosya güncellendi, ${skipped} dosya atlandı`);

