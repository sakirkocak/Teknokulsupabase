export const dynamic = 'force-dynamic'

import Link from 'next/link'

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
          <p className="text-sm text-gray-500">Son güncelleme: 10 Aralık 2024</p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Giriş</h2>
            <p>
              Teknokul olarak, kullanıcılarımızın gizliliğini korumayı taahhüt ediyoruz. Bu Gizlilik Politikası, 
              kişisel verilerinizi nasıl topladığımızı, kullandığımızı, sakladığımızı ve koruduğumuzu açıklamaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Toplanan Veriler</h2>
            <p className="mb-3">Platformumuzda aşağıdaki kişisel veriler toplanmaktadır:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, e-posta adresi, telefon numarası</li>
              <li><strong>Eğitim Bilgileri:</strong> Okul adı, sınıf düzeyi, hedef sınav türü</li>
              <li><strong>Kullanım Verileri:</strong> Platform kullanım istatistikleri, görev tamamlama bilgileri</li>
              <li><strong>Deneme Sonuçları:</strong> Yüklenen deneme sınav sonuçları ve analizleri</li>
              <li><strong>İletişim Verileri:</strong> Koç-öğrenci arasındaki mesajlaşmalar</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Verilerin Kullanım Amaçları</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Eğitim koçluğu hizmetinin sunulması</li>
              <li>Kişiselleştirilmiş öğrenme deneyimi sağlanması</li>
              <li>Yapay zeka destekli analiz ve önerilerin oluşturulması</li>
              <li>Platform güvenliğinin sağlanması</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Veri Güvenliği</h2>
            <p>
              Kişisel verileriniz, endüstri standardı güvenlik önlemleri ile korunmaktadır. SSL şifreleme, 
              güvenli veri tabanları ve düzenli güvenlik denetimleri ile verilerinizin güvenliğini sağlıyoruz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Üçüncü Taraflarla Paylaşım</h2>
            <p>
              Kişisel verileriniz, yasal zorunluluklar dışında üçüncü taraflarla paylaşılmamaktadır. 
              Hizmet sağlayıcılarımız (sunucu, veritabanı) ile yapılan paylaşımlar veri işleme sözleşmeleri 
              çerçevesinde gerçekleştirilmektedir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Çerezler</h2>
            <p>
              Platformumuz, kullanıcı deneyimini iyileştirmek için çerezler kullanmaktadır. 
              Çerez politikamız hakkında detaylı bilgi için <Link href="/yasal/cerezler" className="text-orange-500 hover:underline">Çerez Politikası</Link> sayfamızı ziyaret edebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Haklarınız</h2>
            <p className="mb-3">KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
              <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
              <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
              <li>Kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. İletişim</h2>
            <p>
              Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:
            </p>
            <p className="mt-2">
              <strong>E-posta:</strong> info@teknokul.com<br />
              <strong>Adres:</strong> İstanbul, Türkiye
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-orange-500 hover:underline">
            ← Ana Sayfaya Dön
          </Link>
        </div>
      </main>
    </div>
  )
}

