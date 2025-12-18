export const dynamic = 'force-dynamic'

import Link from 'next/link'

export default function CerezPolitikasi() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Çerez Politikası</h1>
        
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6 text-gray-600">
          <p className="text-sm text-gray-500">Son güncelleme: 10 Aralık 2024</p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Çerez Nedir?</h2>
            <p>
              Çerezler (cookies), web sitelerinin tarayıcınıza gönderdiği küçük metin dosyalarıdır. 
              Bu dosyalar, web sitesinin sizi tanımasını, tercihlerinizi hatırlamasını ve size 
              daha iyi bir kullanıcı deneyimi sunmasını sağlar.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Kullandığımız Çerez Türleri</h2>
            
            <div className="space-y-4 mt-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🔒 Zorunlu Çerezler</h3>
                <p className="text-sm">
                  Platform'un temel işlevlerinin çalışması için gereklidir. Oturum yönetimi, 
                  güvenlik ve kimlik doğrulama için kullanılır.
                </p>
                <p className="text-xs text-gray-500 mt-2">Süre: Oturum süresince</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">⚙️ İşlevsel Çerezler</h3>
                <p className="text-sm">
                  Dil tercihi, tema seçimi gibi ayarlarınızı hatırlamak için kullanılır. 
                  Bu çerezler olmadan platform çalışır ancak deneyiminiz kişiselleştirilmez.
                </p>
                <p className="text-xs text-gray-500 mt-2">Süre: 1 yıl</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">📊 Analitik Çerezler</h3>
                <p className="text-sm">
                  Platform kullanımını analiz etmek, ziyaretçi sayısını ölçmek ve hizmetlerimizi 
                  iyileştirmek için kullanılır. Bu veriler anonim olarak toplanır.
                </p>
                <p className="text-xs text-gray-500 mt-2">Süre: 2 yıl</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Çerez Listesi</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 mt-3 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-3 text-left">Çerez Adı</th>
                    <th className="border border-gray-200 p-3 text-left">Amaç</th>
                    <th className="border border-gray-200 p-3 text-left">Süre</th>
                    <th className="border border-gray-200 p-3 text-left">Tür</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 p-3">sb-auth-token</td>
                    <td className="border border-gray-200 p-3">Oturum kimlik doğrulama</td>
                    <td className="border border-gray-200 p-3">7 gün</td>
                    <td className="border border-gray-200 p-3">Zorunlu</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">sb-refresh-token</td>
                    <td className="border border-gray-200 p-3">Oturum yenileme</td>
                    <td className="border border-gray-200 p-3">30 gün</td>
                    <td className="border border-gray-200 p-3">Zorunlu</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">theme</td>
                    <td className="border border-gray-200 p-3">Tema tercihi</td>
                    <td className="border border-gray-200 p-3">1 yıl</td>
                    <td className="border border-gray-200 p-3">İşlevsel</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 p-3">_vercel_analytics</td>
                    <td className="border border-gray-200 p-3">Site analizi</td>
                    <td className="border border-gray-200 p-3">1 yıl</td>
                    <td className="border border-gray-200 p-3">Analitik</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Üçüncü Taraf Çerezleri</h2>
            <p className="mb-3">Platformumuzda aşağıdaki üçüncü taraf hizmetlerinin çerezleri kullanılabilir:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase:</strong> Kimlik doğrulama ve oturum yönetimi</li>
              <li><strong>Vercel:</strong> Performans ve analitik</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Çerezleri Yönetme</h2>
            <p className="mb-3">
              Çerezleri tarayıcı ayarlarınızdan kontrol edebilirsiniz. Çoğu tarayıcı şu seçenekleri sunar:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tüm çerezleri kabul et</li>
              <li>Çerez geldiğinde bildirim al</li>
              <li>Tüm çerezleri reddet</li>
              <li>Mevcut çerezleri sil</li>
            </ul>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
              <p className="text-yellow-800 text-sm">
                ⚠️ <strong>Uyarı:</strong> Zorunlu çerezleri devre dışı bırakırsanız, 
                platform'un bazı özellikleri düzgün çalışmayabilir.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Tarayıcı Çerez Ayarları</h2>
            <p className="mb-3">Popüler tarayıcılarda çerez ayarlarına erişim:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Chrome:</strong> Ayarlar → Gizlilik ve güvenlik → Çerezler</li>
              <li><strong>Firefox:</strong> Ayarlar → Gizlilik ve Güvenlik → Çerezler</li>
              <li><strong>Safari:</strong> Tercihler → Gizlilik → Çerezler</li>
              <li><strong>Edge:</strong> Ayarlar → Gizlilik → Çerezler</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Politika Güncellemeleri</h2>
            <p>
              Bu çerez politikası zaman zaman güncellenebilir. Önemli değişiklikler 
              platform üzerinden duyurulacaktır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. İletişim</h2>
            <p>
              Çerez politikamız hakkında sorularınız için:
            </p>
            <p className="mt-2">
              <strong>E-posta:</strong> info@teknokul.com
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

