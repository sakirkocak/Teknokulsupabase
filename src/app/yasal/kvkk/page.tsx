export const dynamic = 'force-dynamic'

import Link from 'next/link'

export default function KVKK() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">KVKK Aydınlatma Metni</h1>
        
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6 text-gray-600">
          <p className="text-sm text-gray-500">Son güncelleme: 10 Aralık 2024</p>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-orange-800">
              Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında 
              veri sorumlusu sıfatıyla Teknokul tarafından hazırlanmıştır.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Veri Sorumlusu</h2>
            <p>
              <strong>Teknokul</strong><br />
              Adres: İstanbul, Türkiye<br />
              E-posta: kvkk@teknokul.com
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. İşlenen Kişisel Veriler</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 mt-3">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-3 text-left">Veri Kategorisi</th>
                    <th className="border border-gray-200 p-3 text-left">Veri Türleri</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-3">Kimlik Bilgileri</td>
                    <td className="border border-gray-200 p-3">Ad, soyad, T.C. kimlik numarası (opsiyonel)</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">İletişim Bilgileri</td>
                    <td className="border border-gray-200 p-3">E-posta adresi, telefon numarası</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">Eğitim Bilgileri</td>
                    <td className="border border-gray-200 p-3">Okul adı, sınıf, hedef sınav, deneme sonuçları</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">İşlem Güvenliği</td>
                    <td className="border border-gray-200 p-3">IP adresi, çerez verileri, giriş kayıtları</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">Görsel/İşitsel</td>
                    <td className="border border-gray-200 p-3">Profil fotoğrafı, yüklenen görseller</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Kişisel Verilerin İşlenme Amaçları</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Eğitim koçluğu hizmetlerinin sunulması</li>
              <li>Üyelik işlemlerinin gerçekleştirilmesi</li>
              <li>Koç-öğrenci eşleştirmelerinin yapılması</li>
              <li>Kişiselleştirilmiş eğitim önerilerinin sunulması</li>
              <li>Yapay zeka destekli analizlerin yapılması</li>
              <li>İlerleme ve performans raporlarının oluşturulması</li>
              <li>Platform güvenliğinin sağlanması</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              <li>İletişim faaliyetlerinin yürütülmesi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Kişisel Verilerin Aktarımı</h2>
            <p className="mb-3">Kişisel verileriniz aşağıdaki taraflara aktarılabilir:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Hizmet Sağlayıcılar:</strong> Sunucu, veritabanı ve bulut hizmet sağlayıcıları (Supabase, Vercel)</li>
              <li><strong>AI Hizmetleri:</strong> Yapay zeka analiz hizmetleri (Google Gemini API)</li>
              <li><strong>Yasal Merciler:</strong> Kanuni zorunluluk halinde yetkili kamu kurum ve kuruluşları</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>
            <p className="mb-3">Kişisel verileriniz aşağıdaki yöntemlerle toplanmaktadır:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Platform üzerinden yapılan kayıt ve üyelik işlemleri</li>
              <li>Görev, deneme ve değerlendirme yüklemeleri</li>
              <li>Koç-öğrenci iletişimleri</li>
              <li>Otomatik veri toplama araçları (çerezler)</li>
            </ul>
            <p className="mt-3">
              <strong>Hukuki Sebepler:</strong> KVKK m.5/2-a (Kanunlarda açıkça öngörülmesi), 
              m.5/2-c (Sözleşmenin ifası), m.5/2-f (Meşru menfaat), Açık rıza
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Kişisel Veri Sahibinin Hakları</h2>
            <p className="mb-3">KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
              <li>Kişisel verilerin işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
              <li>KVKK m.7 kapsamında silinmesini veya yok edilmesini isteme</li>
              <li>Düzeltme, silme veya yok edilme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme</li>
              <li>Münhasıran otomatik sistemler vasıtasıyla analiz edilmesi sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>Kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Veri Saklama Süresi</h2>
            <p>
              Kişisel verileriniz, işleme amaçlarının gerektirdiği süre boyunca ve yasal 
              saklama süreleri çerçevesinde muhafaza edilmektedir. Hesap kapatma talebiniz 
              halinde, yasal zorunluluklar saklı kalmak kaydıyla verileriniz silinir veya 
              anonim hale getirilir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Başvuru Yöntemi</h2>
            <p>
              KVKK kapsamındaki haklarınızı kullanmak için aşağıdaki yöntemlerle başvurabilirsiniz:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li><strong>E-posta:</strong> kvkk@teknokul.com</li>
              <li><strong>Yazılı Başvuru:</strong> Kimlik fotokopisi ile birlikte ıslak imzalı dilekçe</li>
            </ul>
            <p className="mt-3">
              Başvurular en geç 30 gün içinde ücretsiz olarak sonuçlandırılacaktır. 
              İşlemin ayrıca bir maliyet gerektirmesi halinde, Kişisel Verileri Koruma 
              Kurulu tarafından belirlenen tarife uygulanacaktır.
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

