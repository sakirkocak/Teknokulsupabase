export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { SITE_URL } from '@/lib/site'

export default function GizlilikPolitikasi() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🎓</span>
            </div>
            <span className="text-xl font-bold">
              Tekn<span className="text-orange-500">okul</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Gizlilik Politikası</h1>
        
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6 text-gray-600">
          <p className="text-sm text-gray-500">Son güncelleme: 12 Ocak 2026</p>

          <p>
            Bu gizlilik politikası, Teknokul tarafından sunulan web sitesi ve mobil uygulamanın kullanımına ilişkin olarak
            kullanıcıların kişisel verilerinin işlenmesine dair esasları açıklamaktadır.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Veri Sorumlusu</h2>
            <p>
              6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca veri sorumlusu <strong>Teknokul</strong>&apos;dur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Uygulamanın Niteliği</h2>
            <p>
              Teknokul mobil uygulaması bir <strong>WebView uygulamasıdır</strong> ve yalnızca{' '}
              <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                {SITE_URL}
              </a>{' '}
              adresinde yer alan web sitesinin mobil cihazlar üzerinden görüntülenmesini sağlar.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Toplanan Kişisel Veriler</h2>
            
            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">3.1 Web Sitesi Üzerinden Toplanan Veriler</h3>
            <p className="mb-3">Platformumuzda aşağıdaki kişisel veriler toplanmaktadır:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, e-posta adresi, telefon numarası</li>
              <li><strong>Eğitim Bilgileri:</strong> Okul adı, sınıf düzeyi, hedef sınav türü</li>
              <li><strong>Kullanım Verileri:</strong> Platform kullanım istatistikleri, görev tamamlama bilgileri</li>
              <li><strong>Deneme Sonuçları:</strong> Yüklenen deneme sınav sonuçları ve analizleri</li>
              <li><strong>İletişim Verileri:</strong> Koç-öğrenci arasındaki mesajlaşmalar</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">3.2 Mobil Uygulama Üzerinden</h3>
            <p className="mb-3">
              Mobil uygulamamız tarafından kullanıcıların cihazlarından aşağıdaki verilere{' '}
              <strong>erişilmemekte ve toplanmamaktadır</strong>:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Kamera</li>
              <li>Mikrofon</li>
              <li>Konum bilgisi</li>
              <li>Rehber</li>
              <li>Depolama alanı</li>
            </ul>
            <p className="mt-3">
              WebView aracılığıyla görüntülenen web sitesinde gerçekleştirilen işlemler,
              bu gizlilik politikası kapsamında değerlendirilir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Verilerin Kullanım Amaçları</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Eğitim koçluğu hizmetinin sunulması</li>
              <li>Kişiselleştirilmiş öğrenme deneyimi sağlanması</li>
              <li>Yapay zeka destekli analiz ve önerilerin oluşturulması</li>
              <li>Platform güvenliğinin sağlanması</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Çerezler (Cookies)</h2>
            <p>
              Platformumuz ve mobil uygulamamız, teknik zorunluluklar ve kullanıcı deneyiminin
              iyileştirilmesi amacıyla <strong>standart tarayıcı çerezleri</strong> kullanmaktadır.
              Bu çerezler kullanıcıyı doğrudan tanımlamaya yönelik değildir.
            </p>
            <p className="mt-2">
              Çerez politikamız hakkında detaylı bilgi için{' '}
              <Link href="/yasal/cerezler" className="text-orange-500 hover:underline">
                Çerez Politikası
              </Link>{' '}
              sayfamızı ziyaret edebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Kişisel Verilerin Aktarımı</h2>
            <p>
              Kullanıcılara ait kişisel veriler, yasal zorunluluklar dışında yurt içi veya yurt dışındaki 
              üçüncü kişi ya da kuruluşlarla <strong>paylaşılmamaktadır</strong>.
              Hizmet sağlayıcılarımız (sunucu, veritabanı) ile yapılan paylaşımlar veri işleme sözleşmeleri 
              çerçevesinde gerçekleştirilmektedir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Hukuki Sebep</h2>
            <p>
              Kişisel veri işlemleri, KVKK&apos;nın 5. maddesinde belirtilen{' '}
              <strong>kanunda açıkça öngörülmesi</strong> ve <strong>meşru menfaat</strong>{' '}
              hukuki sebeplerine dayanılarak gerçekleştirilmektedir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Veri Güvenliği</h2>
            <p>
              Teknokul, kişisel verilerin hukuka aykırı olarak işlenmesini ve erişilmesini önlemek amacıyla
              gerekli teknik ve idari tedbirleri almaktadır. SSL şifreleme, güvenli veri tabanları ve 
              düzenli güvenlik denetimleri ile verilerinizin güvenliğini sağlıyoruz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Kullanıcı Hakları</h2>
            <p className="mb-3">KVKK&apos;nın 11. maddesi uyarınca kullanıcılar aşağıdaki haklara sahiptir:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Kişisel verilerinin işlenip işlenmediğini öğrenme</li>
              <li>Kişisel verileri işlenmişse buna ilişkin bilgi talep etme</li>
              <li>Kişisel verilerinin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında kişisel verilerinin aktarıldığı üçüncü kişileri bilme</li>
              <li>Kişisel verilerinin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
              <li>Kişisel verilerinin silinmesini veya yok edilmesini isteme</li>
              <li>Kanuna aykırı işleme hâlinde zararın giderilmesini talep etme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. İletişim</h2>
            <p>
              Gizlilik politikası ve kişisel verilerin korunmasına ilişkin her türlü soru ve talepleriniz için
              bizimle aşağıdaki e-posta adresi üzerinden iletişime geçebilirsiniz:
            </p>
            
            <p className="mt-3">
              📧 <strong>info@teknokul.com.tr</strong>
            </p>
          </section>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          © Teknokul | Tüm hakları saklıdır.
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-orange-500 hover:underline">
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </main>
    </div>
  )
}
