const XLSX = require('xlsx')

// Excel dosyasını oku
const filePath = '/Users/sakirkocak/Desktop/okullar/KurumListeTüm.xlsx'
const workbook = XLSX.readFile(filePath)
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) // header: 1 = array olarak al

// İlk 2 satır header, 3. satırdan itibaren veri
const headers = ['IL_ADI', 'ILCE_ADI', 'KURUM_ADI', 'ADRES', 'TEL', 'FAX', 'MERNIS_KODU', 'WEB_ADRES', 'KURUM_TUR_ADI', 'KURUM_TUR_KODU', 'OKUL_TURU']
const data = rawData.slice(2).map(row => ({
  il: row[0],
  ilce: row[1],
  kurum_adi: row[2],
  adres: row[3],
  telefon: row[4],
  fax: row[5],
  mernis_kodu: row[6],
  web_adres: row[7],
  kurum_tur_adi: row[8],
  kurum_tur_kodu: row[9],
  okul_turu: row[10]
})).filter(row => row.il && row.ilce && row.kurum_adi) // Boş satırları filtrele

console.log('📊 İlk 5 satır örnek veri:')
console.log(JSON.stringify(data.slice(0, 5), null, 2))

console.log('\n📈 Toplam geçerli okul sayısı:', data.length)

// Benzersiz iller
const cities = [...new Set(data.map(row => row.il))].sort()
console.log('\n🏙️ Benzersiz il sayısı:', cities.length)
console.log('İller:', cities.slice(0, 10).join(', '), '...')

// Benzersiz ilçeler
const districts = [...new Set(data.map(row => `${row.il}|${row.ilce}`))].sort()
console.log('\n🏘️ Benzersiz ilçe sayısı:', districts.length)

// Kurum türleri
const types = [...new Set(data.map(row => row.kurum_tur_adi))].filter(Boolean).sort()
console.log('\n🏫 Kurum türleri (', types.length, 'adet):')
types.slice(0, 30).forEach(t => console.log('  -', t))

// Okul türleri (Devlet/Özel)
const schoolTypes = [...new Set(data.map(row => row.okul_turu))].filter(Boolean)
console.log('\n🎓 Okul türleri:', schoolTypes)

// İl bazlı okul sayıları
console.log('\n📊 İl bazlı okul sayıları (ilk 10):')
const cityStats = {}
data.forEach(row => {
  cityStats[row.il] = (cityStats[row.il] || 0) + 1
})
Object.entries(cityStats).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([city, count]) => {
  console.log(`  ${city}: ${count} okul`)
})
