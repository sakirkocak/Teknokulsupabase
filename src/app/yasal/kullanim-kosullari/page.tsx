export const dynamic = 'force-dynamic'

import Link from 'next/link'

export default function KullanimKosullari() {
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
              Tekno<span className="text-orange-500">kul</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Kullanım Koşulları</h1>
        
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6 text-gray-600">
          <p className="text-sm text-gray-500">Son güncelleme: 10 Aralık 2024</p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Hizmet Tanımı</h2>
            <p>
              Teknokul, öğrencileri eğitim koçlarıyla buluşturan, yapay zeka destekli kişiselleştirilmiş 
              eğitim deneyimi sunan bir platformdur. Platform; görev takibi, deneme analizi, ilerleme 
              raporları ve AI destekli öneriler gibi hizmetler sunmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Hesap Oluşturma</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Platform'u kullanmak için hesap oluşturmanız gerekmektedir.</li>
              <li>Kayıt sırasında doğru ve güncel bilgiler vermeyi kabul edersiniz.</li>
              <li>Hesap güvenliğinizden siz sorumlusunuz.</li>
              <li>18 yaşından küçük kullanıcılar, veli/vasi onayı ile kayıt olabilir.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Kullanıcı Rolleri</h2>
            <p className="mb-3">Platform'da üç farklı kullanıcı rolü bulunmaktadır:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Öğrenci:</strong> Koçlardan destek alan, görevleri tamamlayan ve gelişimini takip eden kullanıcılar</li>
              <li><strong>Koç:</strong> Öğrencilere rehberlik eden, görev atayan ve değerlendirme yapan eğitimciler</li>
              <li><strong>Veli:</strong> Öğrencinin gelişimini takip eden veliler</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Kabul Edilebilir Kullanım</h2>
            <p className="mb-3">Platform kullanımında aşağıdaki kurallara uymanız gerekmektedir:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Yasalara ve bu koşullara uygun davranmak</li>
              <li>Diğer kullanıcılara saygılı olmak</li>
              <li>Yanıltıcı veya yanlış bilgi paylaşmamak</li>
              <li>Platform güvenliğini tehlikeye atacak eylemlerden kaçınmak</li>
              <li>Telif hakkı ihlali yapmamak</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Yasaklanan Davranışlar</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Spam veya istenmeyen içerik paylaşmak</li>
              <li>Zararlı yazılım dağıtmak</li>
              <li>Başka kullanıcıların hesaplarına yetkisiz erişim sağlamak</li>
              <li>Platform'u ticari amaçlarla izinsiz kullanmak</li>
              <li>Hakaret, tehdit veya taciz içerikli mesajlar göndermek</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Fikri Mülkiyet</h2>
            <p>
              Platform'daki tüm içerik, tasarım, logo ve yazılımlar Teknokul'a aittir veya lisanslıdır. 
              Bu içeriklerin izinsiz kullanımı, kopyalanması veya dağıtılması yasaktır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Yapay Zeka Kullanımı</h2>
            <p>
              Platform, yapay zeka teknolojileri kullanmaktadır. AI tarafından üretilen içerikler 
              bilgilendirme amaçlıdır ve profesyonel eğitim danışmanlığının yerini almaz. 
              AI önerileri, kullanıcı verilerine dayalı olarak oluşturulmaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Sorumluluk Sınırı</h2>
            <p>
              Teknokul, platform kullanımından kaynaklanan dolaylı zararlardan sorumlu değildir. 
              Eğitim sonuçları, kullanıcının çabasına ve koşullara bağlı olarak değişebilir. 
              Platform, kesintisiz hizmet garantisi vermemektedir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Hesap Askıya Alma ve Sonlandırma</h2>
            <p>
              Kullanım koşullarını ihlal eden hesaplar uyarı almadan askıya alınabilir veya 
              sonlandırılabilir. Kullanıcılar, hesaplarını istedikleri zaman kapatabilirler.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Değişiklikler</h2>
            <p>
              Bu kullanım koşulları zaman zaman güncellenebilir. Önemli değişiklikler 
              kullanıcılara bildirilecektir. Platform'u kullanmaya devam etmeniz, 
              güncel koşulları kabul ettiğiniz anlamına gelir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Uygulanacak Hukuk</h2>
            <p>
              Bu koşullar Türkiye Cumhuriyeti yasalarına tabidir. Uyuşmazlıklarda 
              İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. İletişim</h2>
            <p>
              Kullanım koşulları hakkında sorularınız için:
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

