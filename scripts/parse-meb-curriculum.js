/**
 * MEB Müfredat Dosyası Parse Script
 * Milli Eğitim Sistemi Ders Konuları Kazanımlar.txt dosyasını parse eder
 */

const fs = require('fs')
const path = require('path')

// Ders kodu eşleştirme
const SUBJECT_CODES = {
  'Türkçe': 'turkce',
  'Türkçe Dersi': 'turkce',
  'Matematik': 'matematik',
  'Matematik Dersi': 'matematik',
  'Türk Dili ve Edebiyatı': 'edebiyat',
  'Edebiyat': 'edebiyat',
  'Hayat Bilgisi': 'hayat_bilgisi',
  'Hayat Bilgisi Dersi': 'hayat_bilgisi',
  'Fen Bilimleri': 'fen_bilimleri',
  'Fen Bilimleri Dersi': 'fen_bilimleri',
  'Fizik': 'fizik',
  'Fizik Dersi': 'fizik',
  'Kimya': 'kimya',
  'Kimya Dersi': 'kimya',
  'Biyoloji': 'biyoloji',
  'Biyoloji Dersi': 'biyoloji',
  'Sosyal Bilgiler': 'sosyal_bilgiler',
  'Sosyal Bilgiler Dersi': 'sosyal_bilgiler',
  'T.C. İnkılap Tarihi ve Atatürkçülük': 'inkilap_tarihi',
  'İnkılap Tarihi': 'inkilap_tarihi',
  'Tarih': 'tarih',
  'Tarih Dersi': 'tarih',
  'Coğrafya': 'cografya',
  'Coğrafya Dersi': 'cografya',
  'Felsefe': 'felsefe',
  'Felsefe Dersi': 'felsefe',
  'Din Kültürü ve Ahlak Bilgisi': 'din_kulturu',
  'Din Kültürü': 'din_kulturu',
  'İngilizce': 'ingilizce',
  'İngilizce Dersi': 'ingilizce',
}

// Sınıf seviyesi çıkarma
function extractGrade(text) {
  const patterns = [
    /(\d+)\.\s*[Ss]ınıf/,
    /(\d+)\s*\.\s*[Ss]ınıf/,
    /[Ss]ınıf\s*(\d+)/,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const grade = parseInt(match[1])
      if (grade >= 1 && grade <= 12) return grade
    }
  }
  return null
}

// Ders adı çıkarma
function extractSubject(text) {
  for (const [name, code] of Object.entries(SUBJECT_CODES)) {
    if (text.includes(name)) {
      return { name, code }
    }
  }
  return null
}

// Ana fonksiyon
function parseMEBCurriculum(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  
  const curriculum = {
    units: [],
    topics: []
  }
  
  let currentGrade = null
  let currentSubject = null
  let currentUnit = null
  let unitNumber = 0
  let topicNumber = 0
  
  console.log('📚 MEB Müfredat Dosyası Parse Ediliyor...\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Sınıf seviyesi tespiti
    const gradeMatch = line.match(/^(\d+)\.\d*\s*(\d+)\.\s*Sınıf|^2\.\d+\.\s*(\d+)\.\s*Sınıf|^(\d+)\.\s*Sınıf\s*Müfredatı/i)
    if (gradeMatch || line.includes('Sınıf Müfredatı') || line.match(/^\d+\.\d+\.\s*\d+\.\s*Sınıf/)) {
      const grade = extractGrade(line)
      if (grade) {
        currentGrade = grade
        unitNumber = 0
        console.log(`\n📖 ${currentGrade}. Sınıf bulundu`)
      }
    }
    
    // Ders adı tespiti
    const subjectInfo = extractSubject(line)
    if (subjectInfo && (line.includes('Dersi') || line.match(/^[A-ZÇĞİÖŞÜ]/))) {
      currentSubject = subjectInfo
      unitNumber = 0
      console.log(`  📚 ${currentSubject.name} (${currentSubject.code})`)
    }
    
    // Ünite/Tema tespiti
    const unitMatch = line.match(/^(\d+)\.\s*(Tema|Ünite|Öğrenme Alanı)\s*[:\-]?\s*(.+)/i) ||
                      line.match(/^Ünite\s*(\d+)\s*[:\-]?\s*(.+)/i) ||
                      line.match(/^(\d+)\.\s*(.+)/i) && line.length < 100 && !line.includes('Kazanım')
    
    if (unitMatch && currentGrade && currentSubject && line.length < 150) {
      const possibleUnitNumber = parseInt(unitMatch[1]) || ++unitNumber
      const unitName = (unitMatch[3] || unitMatch[2] || '').trim()
      
      if (unitName && unitName.length > 3 && !unitName.match(/^(Konu|Alt|Kazanım)/i)) {
        currentUnit = {
          subject_code: currentSubject.code,
          grade: currentGrade,
          unit_number: possibleUnitNumber,
          name: unitName.replace(/^\d+\.\s*/, '').trim()
        }
        
        // Duplikasyon kontrolü
        const exists = curriculum.units.find(u => 
          u.subject_code === currentUnit.subject_code && 
          u.grade === currentUnit.grade && 
          u.name === currentUnit.name
        )
        
        if (!exists && currentUnit.name.length > 2) {
          curriculum.units.push(currentUnit)
          console.log(`    📁 Ünite ${currentUnit.unit_number}: ${currentUnit.name}`)
        }
        topicNumber = 0
      }
    }
    
    // Konu/Kazanım tespiti - daha kapsamlı
    const topicPatterns = [
      /^[•\-\*]\s*(.+)/,  // Madde işaretleri
      /^Kazanım[lar]*\s*[:\-]?\s*(.+)/i,
      /^Hedef\s*[:\-]?\s*(.+)/i,
      /^\d+\.\d+\.\s*(.+)/,  // Numaralı kazanımlar
    ]
    
    for (const pattern of topicPatterns) {
      const topicMatch = line.match(pattern)
      if (topicMatch && currentGrade && currentSubject) {
        let topicText = topicMatch[1].trim()
        
        // Kısa veya anlamsız girişleri atla
        if (topicText.length < 10 || topicText.match(/^(Tablo|Şekil|Grafik|Not|Kaynak)/i)) {
          continue
        }
        
        // Ana konu ve alt konu ayırma
        let mainTopic = topicText
        let subTopic = null
        let learningOutcome = null
        
        // Parantez içi alt konu olabilir
        const parenMatch = topicText.match(/(.+?)\s*\((.+)\)/)
        if (parenMatch) {
          mainTopic = parenMatch[1].trim()
          subTopic = parenMatch[2].trim()
        }
        
        // Noktalı virgül veya virgül ile ayrılmış olabilir
        const commaMatch = topicText.match(/(.+?)[;,]\s*(.+)/)
        if (commaMatch && !subTopic) {
          mainTopic = commaMatch[1].trim()
          learningOutcome = commaMatch[2].trim()
        }
        
        const topic = {
          subject_code: currentSubject.code,
          grade: currentGrade,
          unit_name: currentUnit?.name || null,
          unit_number: currentUnit?.unit_number || null,
          main_topic: mainTopic.substring(0, 200),
          sub_topic: subTopic?.substring(0, 200) || null,
          learning_outcome: learningOutcome?.substring(0, 500) || topicText.substring(0, 500)
        }
        
        // Duplikasyon kontrolü
        const exists = curriculum.topics.find(t => 
          t.subject_code === topic.subject_code && 
          t.grade === topic.grade && 
          t.main_topic === topic.main_topic
        )
        
        if (!exists) {
          curriculum.topics.push(topic)
          topicNumber++
        }
        break
      }
    }
  }
  
  // Özel parse - tablo formatındaki veriler için
  parseTableData(lines, curriculum)
  
  console.log('\n✅ Parse tamamlandı!')
  console.log(`   Ünite sayısı: ${curriculum.units.length}`)
  console.log(`   Konu/Kazanım sayısı: ${curriculum.topics.length}`)
  
  return curriculum
}

// Tablo formatındaki verileri parse et
function parseTableData(lines, curriculum) {
  let inTable = false
  let currentGrade = null
  let currentSubject = null
  let headers = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Tablo başlığı kontrolü
    if (line.includes('Tema') && line.includes('Konu') || 
        line.includes('Ünite') && line.includes('Kazanım') ||
        line.includes('Öğrenme Alanı') && line.includes('Alt')) {
      inTable = true
      headers = line.split('\t').map(h => h.trim())
      continue
    }
    
    // Tablo satırı
    if (inTable && line.includes('\t')) {
      const cells = line.split('\t').map(c => c.trim())
      
      if (cells.length >= 2 && cells[0] && cells[1]) {
        // İlk sütun genellikle tema/ünite, ikinci konu
        const unitOrTopic = cells[0]
        const topicOrOutcome = cells[1]
        
        // Sınıf kontrolü
        const grade = extractGrade(lines.slice(Math.max(0, i-10), i).join(' '))
        if (grade) currentGrade = grade
        
        // Ders kontrolü
        const subject = extractSubject(lines.slice(Math.max(0, i-10), i).join(' '))
        if (subject) currentSubject = subject
        
        if (currentGrade && currentSubject && topicOrOutcome.length > 5) {
          const topic = {
            subject_code: currentSubject.code,
            grade: currentGrade,
            unit_name: unitOrTopic.length < 100 ? unitOrTopic : null,
            main_topic: topicOrOutcome.substring(0, 200),
            sub_topic: cells[2]?.substring(0, 200) || null,
            learning_outcome: cells[3]?.substring(0, 500) || cells[2]?.substring(0, 500) || null
          }
          
          const exists = curriculum.topics.find(t => 
            t.subject_code === topic.subject_code && 
            t.grade === topic.grade && 
            t.main_topic === topic.main_topic
          )
          
          if (!exists) {
            curriculum.topics.push(topic)
          }
        }
      }
    }
    
    // Tablo sonu
    if (inTable && !line.includes('\t') && line.length > 0) {
      inTable = false
    }
  }
}

// Manuel olarak MEB müfredatından temel konuları ekle
function addCoreCurriculum(curriculum) {
  const coreTopics = [
    // 1. SINIF
    { grade: 1, subject_code: 'turkce', unit_number: 1, unit_name: 'İlk Okuma Yazma', main_topic: 'Ses Grupları ve Harfler', learning_outcome: 'Yeni harf grupları sıralaması ile sesleri tanır, ayırt eder, hece, kelime ve cümle oluşturur' },
    { grade: 1, subject_code: 'turkce', unit_number: 2, unit_name: 'Güzel Davranışlarımız', main_topic: 'İletişim ve Nezaket', learning_outcome: 'Dinleme kurallarını uygulama, nezaket ifadelerini yerinde kullanma' },
    { grade: 1, subject_code: 'matematik', unit_number: 1, unit_name: 'Sayılar ve Nicelikler', main_topic: 'Doğal Sayılar', learning_outcome: '20\'ye kadar olan sayıları nesnelerle eşleştirerek sayar, rakamları okur ve yazar' },
    { grade: 1, subject_code: 'matematik', unit_number: 2, unit_name: 'İşlemlerle Cebirsel Düşünme', main_topic: 'Toplama İşlemi', learning_outcome: 'Toplamları 20\'yi geçmeyen sayılarla toplama yapar, sembolleri kullanır' },
    { grade: 1, subject_code: 'matematik', unit_number: 3, unit_name: 'İşlemlerle Cebirsel Düşünme', main_topic: 'Çıkarma İşlemi', learning_outcome: '20\'ye kadar olan sayılarla çıkarma yapar, zihinden çıkarma stratejileri geliştirir' },
    { grade: 1, subject_code: 'matematik', unit_number: 4, unit_name: 'Nesnelerin Geometrisi', main_topic: 'Geometrik Şekiller', learning_outcome: 'Üçgen, kare, dikdörtgen ve çemberi tanır ve modeller üzerinde gösterir' },
    { grade: 1, subject_code: 'hayat_bilgisi', unit_number: 1, unit_name: 'Ben ve Okulum', main_topic: 'Okula Uyum', learning_outcome: 'Sınıfını ve okulunun bölümlerini tanır, okul kurallarına uyar' },
    
    // 2. SINIF
    { grade: 2, subject_code: 'turkce', unit_number: 1, unit_name: 'Okuma ve Anlama', main_topic: 'Metin Anlama', learning_outcome: 'Okuduğu metinle ilgili 5N1K sorularını cevaplar, metnin ana fikrini belirler' },
    { grade: 2, subject_code: 'matematik', unit_number: 1, unit_name: 'Doğal Sayılar', main_topic: 'Sayılar ve Basamaklar', learning_outcome: '100 içinde nesne sayısını belirler, deste ve düzine kavramlarını öğrenir' },
    { grade: 2, subject_code: 'matematik', unit_number: 2, unit_name: 'Doğal Sayılarla İşlemler', main_topic: 'Toplama ve Çıkarma', learning_outcome: 'Eldeli toplama ve onluk bozarak çıkarma işlemini yapar' },
    { grade: 2, subject_code: 'ingilizce', unit_number: 1, unit_name: 'Words', main_topic: 'Kelimeler', learning_outcome: 'Alfabeyi tanır, basit kelimeleri resimlerle eşleştirir' },
    
    // 3. SINIF
    { grade: 3, subject_code: 'fen_bilimleri', unit_number: 1, unit_name: 'Gezegenimizi Tanıyalım', main_topic: 'Dünya\'nın Yapısı', learning_outcome: 'Dünya\'nın şeklinin küreye benzediğini kavrar, katmanlarını model üzerinde gösterir' },
    { grade: 3, subject_code: 'fen_bilimleri', unit_number: 2, unit_name: 'Beş Duyumuz', main_topic: 'Duyu Organları', learning_outcome: 'Duyu organlarını tanır ve görevlerini açıklar' },
    { grade: 3, subject_code: 'matematik', unit_number: 1, unit_name: 'Sayılar', main_topic: 'Doğal Sayılar', learning_outcome: '3 basamaklı doğal sayıları okur ve yazar, Romen rakamlarını tanır' },
    
    // 4. SINIF
    { grade: 4, subject_code: 'sosyal_bilgiler', unit_number: 1, unit_name: 'Birey ve Toplum', main_topic: 'Kimlik Bilinci', learning_outcome: 'Resmi kimlik belgesini inceler, kronolojik sıralama becerisi kazanır' },
    { grade: 4, subject_code: 'sosyal_bilgiler', unit_number: 2, unit_name: 'Kültür ve Miras', main_topic: 'Milli Kültürümüz', learning_outcome: 'Aile tarihini sözlü tarih yöntemiyle araştırır, milli kültür ögelerini tanır' },
    { grade: 4, subject_code: 'fen_bilimleri', unit_number: 1, unit_name: 'Yer Kabuğu', main_topic: 'Kayaçlar ve Madenler', learning_outcome: 'Yer kabuğunun yapısını açıklar, kayaç, maden ve fosil kavramlarını ilişkilendirir' },
    { grade: 4, subject_code: 'din_kulturu', unit_number: 1, unit_name: 'Günlük Konuşmalar', main_topic: 'Dini İfadeler', learning_outcome: 'Besmele, selamlaşma, hamd, şükür gibi ifadelerin anlamlarını ve kullanım yerlerini öğrenir' },
    
    // 5. SINIF
    { grade: 5, subject_code: 'matematik', unit_number: 1, unit_name: 'Geometrik Şekiller', main_topic: 'Temel Çizimler ve Açı', learning_outcome: 'Doğru, doğru parçası ve ışını çizer, açıyı açıölçerle ölçer' },
    { grade: 5, subject_code: 'matematik', unit_number: 2, unit_name: 'Sayılar ve Nicelikler', main_topic: 'Doğal Sayılar ve İşlemler', learning_outcome: 'Milyonlu sayıları okur ve yazar, bölük ve basamak kavramlarını pekiştirir' },
    { grade: 5, subject_code: 'matematik', unit_number: 3, unit_name: 'Kesirler', main_topic: 'Kesirler ve Ondalık', learning_outcome: 'Birim kesirleri sıralar, bileşik ve tam sayılı kesirleri birbirine dönüştürür' },
    { grade: 5, subject_code: 'fen_bilimleri', unit_number: 1, unit_name: 'Gökyüzündeki Komşular', main_topic: 'Astronomi', learning_outcome: 'Güneş\'in yapısını ve dönme hareketini kavrar, Ay\'ın evrelerini modeller' },
    { grade: 5, subject_code: 'sosyal_bilgiler', unit_number: 1, unit_name: 'Birlikte Yaşamak', main_topic: 'Toplumsal Uyum', learning_outcome: 'Dahil olduğu gruplardaki rollerini ve sorumluluklarını fark eder' },
    
    // 6. SINIF
    { grade: 6, subject_code: 'matematik', unit_number: 1, unit_name: 'Sayılar', main_topic: 'Üslü İfadeler', learning_outcome: 'Üslü ifadeler, işlem önceliği, dağılma özelliği kavramlarını öğrenir' },
    { grade: 6, subject_code: 'matematik', unit_number: 2, unit_name: 'Sayılar', main_topic: 'Bölünebilme Kuralları', learning_outcome: 'Bölünebilme kurallarını, asal sayıları, çarpanları ve katları öğrenir' },
    { grade: 6, subject_code: 'matematik', unit_number: 3, unit_name: 'Tam Sayılar', main_topic: 'Tam Sayıları Tanıma', learning_outcome: 'Tam sayıları tanır, mutlak değer ve sayı doğrusunda sıralama yapar' },
    { grade: 6, subject_code: 'sosyal_bilgiler', unit_number: 1, unit_name: 'Kültür ve Miras', main_topic: 'Orta Asya İlk Türk Devletleri', learning_outcome: 'Hun, Göktürk, Uygur devletlerini öğrenir' },
    
    // 7. SINIF
    { grade: 7, subject_code: 'matematik', unit_number: 1, unit_name: 'Tam Sayılar', main_topic: 'Tam Sayılarla İşlemler', learning_outcome: 'Negatif sayılarla çarpma/bölme yapar, rasyonel sayılarla çok adımlı işlemler çözer' },
    { grade: 7, subject_code: 'matematik', unit_number: 2, unit_name: 'Cebir', main_topic: 'Cebirsel İfadeler', learning_outcome: 'Cebirsel ifadelerle toplama-çıkarma, doğrusal denklemler çözer' },
    { grade: 7, subject_code: 'fen_bilimleri', unit_number: 1, unit_name: 'Hücre Bölünmeleri', main_topic: 'Mitoz ve Mayoz', learning_outcome: 'Mitoz ve mayoz bölünmeleri ayırt eder ve açıklar' },
    { grade: 7, subject_code: 'sosyal_bilgiler', unit_number: 1, unit_name: 'Osmanlı Devleti', main_topic: 'Kuruluş ve Yükseliş', learning_outcome: 'Osmanlı Devleti\'nin kuruluşu ve yükselişini öğrenir' },
    
    // 8. SINIF (LGS)
    { grade: 8, subject_code: 'matematik', unit_number: 1, unit_name: 'Çarpanlar ve Katlar', main_topic: 'EBOB - EKOK', learning_outcome: 'Pozitif tam sayıların çarpanlarını bulur, EBOB ve EKOK hesaplar' },
    { grade: 8, subject_code: 'matematik', unit_number: 2, unit_name: 'Üslü İfadeler', main_topic: 'Üslü Sayı İşlemleri', learning_outcome: 'Tam sayıların tam sayı kuvvetlerini hesaplar, bilimsel gösterimle ifade eder' },
    { grade: 8, subject_code: 'matematik', unit_number: 3, unit_name: 'Kareköklü İfadeler', main_topic: 'Kök Hesaplama', learning_outcome: 'Tam kare sayıları tanır, kareköklü ifadelerle dört işlem yapar' },
    { grade: 8, subject_code: 'matematik', unit_number: 4, unit_name: 'Veri Analizi', main_topic: 'Grafikler', learning_outcome: 'Çizgi, sütun ve daire grafiklerini çizer ve dönüşüm yapar' },
    { grade: 8, subject_code: 'matematik', unit_number: 5, unit_name: 'Olasılık', main_topic: 'Basit Olayların Olasılığı', learning_outcome: 'Bir olayın olma olasılığını hesaplar' },
    { grade: 8, subject_code: 'matematik', unit_number: 6, unit_name: 'Cebirsel İfadeler', main_topic: 'Özdeşlikler', learning_outcome: 'Cebirsel ifadeleri çarpar, özdeşlikleri modeller, çarpanlarına ayırır' },
    { grade: 8, subject_code: 'matematik', unit_number: 7, unit_name: 'Doğrusal Denklemler', main_topic: 'Denklem ve Eğim', learning_outcome: 'Birinci dereceden denklemleri çözer, doğrunun eğimini hesaplar' },
    { grade: 8, subject_code: 'matematik', unit_number: 8, unit_name: 'Geometri', main_topic: 'Üçgenler ve Cisimler', learning_outcome: 'Pisagor bağıntısını kullanır, eşlik ve benzerlik kurallarını uygular' },
    { grade: 8, subject_code: 'fen_bilimleri', unit_number: 1, unit_name: 'Mevsimler ve İklim', main_topic: 'Mevsimlerin Oluşumu', learning_outcome: 'Eksen eğikliği ve mevsimlerin oluşumunu açıklar' },
    { grade: 8, subject_code: 'fen_bilimleri', unit_number: 2, unit_name: 'DNA ve Genetik Kod', main_topic: 'Kalıtım', learning_outcome: 'Nükleotid, gen, kromozom ilişkisini açıklar, Mendel çaprazlamaları yapar' },
    { grade: 8, subject_code: 'fen_bilimleri', unit_number: 3, unit_name: 'Basınç', main_topic: 'Katı, Sıvı ve Gaz Basıncı', learning_outcome: 'Pascal prensibini ve günlük hayattaki uygulamalarını açıklar' },
    { grade: 8, subject_code: 'fen_bilimleri', unit_number: 4, unit_name: 'Madde ve Endüstri', main_topic: 'Periyodik Sistem', learning_outcome: 'Metal-ametal-yarı metal özelliklerini açıklar, asit ve bazları tanır' },
    { grade: 8, subject_code: 'fen_bilimleri', unit_number: 5, unit_name: 'Basit Makineler', main_topic: 'Mekanik Sistemler', learning_outcome: 'Makaralar, kaldıraçlar, eğik düzlem prensiplerini açıklar' },
    { grade: 8, subject_code: 'inkilap_tarihi', unit_number: 1, unit_name: 'Bir Kahraman Doğuyor', main_topic: 'Mustafa Kemal\'in Hayatı', learning_outcome: 'Mustafa Kemal\'in çocukluğu, öğrenim ve askerlik hayatını öğrenir' },
    { grade: 8, subject_code: 'inkilap_tarihi', unit_number: 2, unit_name: 'Milli Uyanış', main_topic: 'I. Dünya Savaşı', learning_outcome: 'I. Dünya Savaşı\'nın sebeplerini ve sonuçlarını açıklar' },
    { grade: 8, subject_code: 'inkilap_tarihi', unit_number: 3, unit_name: 'Ya İstiklal Ya Ölüm', main_topic: 'Kurtuluş Savaşı', learning_outcome: 'Kurtuluş Savaşı cephelerini ve önemli olayları öğrenir' },
    { grade: 8, subject_code: 'inkilap_tarihi', unit_number: 4, unit_name: 'Atatürkçülük', main_topic: 'İnkılaplar', learning_outcome: 'Atatürk ilke ve inkılaplarını öğrenir' },
    
    // 9. SINIF
    { grade: 9, subject_code: 'matematik', unit_number: 1, unit_name: 'Sayılar', main_topic: 'Sayı Kümeleri', learning_outcome: 'Sayı kümelerini (N, Z, Q, R) tanır, aralık kavramını kullanır' },
    { grade: 9, subject_code: 'matematik', unit_number: 2, unit_name: 'Fonksiyonlar', main_topic: 'Doğrusal Fonksiyonlar', learning_outcome: 'Doğrusal fonksiyonları tanır ve grafiğini çizer' },
    { grade: 9, subject_code: 'matematik', unit_number: 3, unit_name: 'Algoritma', main_topic: 'Algoritmik Düşünme', learning_outcome: 'Problem çözme sürecinde algoritma mantığını kullanır' },
    { grade: 9, subject_code: 'matematik', unit_number: 4, unit_name: 'Geometri', main_topic: 'Üçgenler', learning_outcome: 'Üçgende açı ve kenar bağıntılarını kurar, trigonometrik oranlara giriş yapar' },
    { grade: 9, subject_code: 'fizik', unit_number: 1, unit_name: 'Fizik Bilimi', main_topic: 'Temel Kavramlar', learning_outcome: 'Fiziğin alt dallarını ve fiziksel büyüklükleri sınıflandırır' },
    { grade: 9, subject_code: 'fizik', unit_number: 2, unit_name: 'Kuvvet ve Hareket', main_topic: 'Newton Yasaları', learning_outcome: 'Newton\'un hareket yasalarını günlük hayat örnekleriyle açıklar' },
    { grade: 9, subject_code: 'kimya', unit_number: 1, unit_name: 'Atom ve Periyodik Sistem', main_topic: 'Atom Modelleri', learning_outcome: 'Dalton\'dan günümüze atom modellerini inceler' },
    { grade: 9, subject_code: 'biyoloji', unit_number: 1, unit_name: 'Yaşam Bilimi', main_topic: 'Canlıların Özellikleri', learning_outcome: 'Canlıların ortak özelliklerini açıklar' },
    { grade: 9, subject_code: 'tarih', unit_number: 1, unit_name: 'Tarih ve Zaman', main_topic: 'Tarih Bilimi', learning_outcome: 'Tarih biliminin yöntemi, kaynakları ve takvim sistemlerini öğrenir' },
    
    // 10. SINIF (TYT)
    { grade: 10, subject_code: 'matematik', unit_number: 1, unit_name: 'Sayma', main_topic: 'Permütasyon ve Kombinasyon', learning_outcome: 'Permütasyon ve kombinasyon kavramlarını öğrenir ve uygular' },
    { grade: 10, subject_code: 'matematik', unit_number: 2, unit_name: 'Fonksiyonlar', main_topic: 'Fonksiyon Grafikleri', learning_outcome: 'Fonksiyon grafiklerini çizer, bileşke ve ters fonksiyonu bulur' },
    { grade: 10, subject_code: 'matematik', unit_number: 3, unit_name: 'Polinomlar', main_topic: 'Polinomlar ve Çarpanlara Ayırma', learning_outcome: 'Polinomlarda işlem yapar ve çarpanlara ayırır' },
    { grade: 10, subject_code: 'fizik', unit_number: 1, unit_name: 'Elektrik', main_topic: 'Elektrik Devreleri', learning_outcome: 'Akım, direnç, potansiyel fark ve Ohm yasasını uygular' },
    { grade: 10, subject_code: 'kimya', unit_number: 1, unit_name: 'Kimyanın Temel Kanunları', main_topic: 'Mol Kavramı', learning_outcome: 'Mol kavramını ve kimyasal hesaplamaları öğrenir' },
    { grade: 10, subject_code: 'biyoloji', unit_number: 1, unit_name: 'Hücre Bölünmeleri', main_topic: 'Mitoz ve Mayoz', learning_outcome: 'Hücre bölünmelerini detaylı olarak inceler' },
    
    // 11. SINIF
    { grade: 11, subject_code: 'matematik', unit_number: 1, unit_name: 'Trigonometri', main_topic: 'Birim Çember', learning_outcome: 'Birim çember ve trigonometrik fonksiyonları öğrenir' },
    { grade: 11, subject_code: 'matematik', unit_number: 2, unit_name: 'Analitik Geometri', main_topic: 'Nokta ve Doğru', learning_outcome: 'Nokta ve doğru analitiğini öğrenir' },
    { grade: 11, subject_code: 'fizik', unit_number: 1, unit_name: 'Dinamik', main_topic: 'Newton\'un Hareket Yasaları', learning_outcome: 'Dinamik problemlerini çözer' },
    { grade: 11, subject_code: 'kimya', unit_number: 1, unit_name: 'Modern Atom Teorisi', main_topic: 'Kuantum Sayıları', learning_outcome: 'Kuantum sayıları ve elektron dizilimlerini öğrenir' },
    { grade: 11, subject_code: 'biyoloji', unit_number: 1, unit_name: 'İnsan Fizyolojisi', main_topic: 'Sistemler', learning_outcome: 'İnsan vücut sistemlerini öğrenir' },
    
    // 12. SINIF (AYT)
    { grade: 12, subject_code: 'matematik', unit_number: 1, unit_name: 'Üstel ve Logaritmik Fonksiyonlar', main_topic: 'Logaritma', learning_outcome: 'Logaritma fonksiyonunu tanır ve denklem çözer' },
    { grade: 12, subject_code: 'matematik', unit_number: 2, unit_name: 'Diziler', main_topic: 'Aritmetik ve Geometrik Diziler', learning_outcome: 'Dizilerin özelliklerini kavrar ve formüllerini uygular' },
    { grade: 12, subject_code: 'matematik', unit_number: 3, unit_name: 'Türev', main_topic: 'Türev Alma', learning_outcome: 'Limit, süreklilik ve türev kavramlarını öğrenir, uygular' },
    { grade: 12, subject_code: 'matematik', unit_number: 4, unit_name: 'İntegral', main_topic: 'Belirsiz ve Belirli İntegral', learning_outcome: 'İntegral hesabı ve alan bulma işlemlerini yapar' },
    { grade: 12, subject_code: 'fizik', unit_number: 1, unit_name: 'Çembersel Hareket', main_topic: 'Düzgün Çembersel Hareket', learning_outcome: 'Çembersel hareket ve açısal momentum kavramlarını öğrenir' },
    { grade: 12, subject_code: 'fizik', unit_number: 2, unit_name: 'Modern Fizik', main_topic: 'Özel Görelilik', learning_outcome: 'Özel görelilik ve kuantum fiziğine giriş yapar' },
    { grade: 12, subject_code: 'kimya', unit_number: 1, unit_name: 'Organik Kimya', main_topic: 'Hidrokarbonlar', learning_outcome: 'Organik bileşikleri ve fonksiyonel grupları öğrenir' },
    { grade: 12, subject_code: 'biyoloji', unit_number: 1, unit_name: 'Genden Proteine', main_topic: 'DNA ve Protein Sentezi', learning_outcome: 'DNA, RNA ve protein sentezini detaylı öğrenir' },
  ]
  
  // Her bir core topic için unit ve topic ekle
  for (const item of coreTopics) {
    // Unit kontrolü ve ekleme
    if (item.unit_name) {
      const existingUnit = curriculum.units.find(u => 
        u.subject_code === item.subject_code && 
        u.grade === item.grade && 
        u.name === item.unit_name
      )
      
      if (!existingUnit) {
        curriculum.units.push({
          subject_code: item.subject_code,
          grade: item.grade,
          unit_number: item.unit_number,
          name: item.unit_name
        })
      }
    }
    
    // Topic kontrolü ve ekleme
    const existingTopic = curriculum.topics.find(t => 
      t.subject_code === item.subject_code && 
      t.grade === item.grade && 
      t.main_topic === item.main_topic
    )
    
    if (!existingTopic) {
      curriculum.topics.push({
        subject_code: item.subject_code,
        grade: item.grade,
        unit_name: item.unit_name,
        unit_number: item.unit_number,
        main_topic: item.main_topic,
        sub_topic: null,
        learning_outcome: item.learning_outcome
      })
    }
  }
  
  console.log(`\n📌 Temel müfredat eklendi: ${coreTopics.length} konu`)
}

// Ana çalıştırma
const filePath = process.argv[2] || '/Users/sakirkocak/Desktop/Milli Eğitim Sistemi Ders Konuları Kazanımlar.txt'

if (!fs.existsSync(filePath)) {
  console.error('❌ Dosya bulunamadı:', filePath)
  process.exit(1)
}

const curriculum = parseMEBCurriculum(filePath)

// Temel müfredatı ekle
addCoreCurriculum(curriculum)

// Sonuçları JSON olarak kaydet
const outputPath = path.join(__dirname, 'parsed-curriculum.json')
fs.writeFileSync(outputPath, JSON.stringify(curriculum, null, 2), 'utf-8')

console.log(`\n📄 Sonuç kaydedildi: ${outputPath}`)
console.log(`\n📊 Özet:`)
console.log(`   Toplam Ünite: ${curriculum.units.length}`)
console.log(`   Toplam Konu: ${curriculum.topics.length}`)

// Sınıf bazlı özet
const gradeStats = {}
for (const topic of curriculum.topics) {
  if (!gradeStats[topic.grade]) {
    gradeStats[topic.grade] = { count: 0, subjects: new Set() }
  }
  gradeStats[topic.grade].count++
  gradeStats[topic.grade].subjects.add(topic.subject_code)
}

console.log('\n📈 Sınıf Bazlı Dağılım:')
for (const grade of Object.keys(gradeStats).sort((a, b) => a - b)) {
  const stats = gradeStats[grade]
  console.log(`   ${grade}. Sınıf: ${stats.count} konu (${stats.subjects.size} ders)`)
}

module.exports = { parseMEBCurriculum, curriculum }

