import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  ChevronRight, 
  Clock, 
  Calendar, 
  GraduationCap, 
  ArrowLeft,
  Share2,
  BookOpen,
  Sparkles
} from 'lucide-react'
import { ArticleSchema, FAQSchema } from '@/components/JsonLdSchema'

// Makale verileri (statik, sonra Supabase'den çekilebilir)
const MAKALELER: Record<string, {
  baslik: string
  ozet: string
  icerik: string
  kategori: string
  sure: string
  tarih: string
  etiketler: string[]
  faqs?: { question: string; answer: string }[]
}> = {
  'pomodoro-teknigi-ile-verimli-ders-calisma': {
    baslik: 'Pomodoro Tekniği ile Verimli Ders Çalışma',
    ozet: '25 dakika odaklanma, 5 dakika mola. Bu basit teknik ile ders çalışma verimliliğinizi %40 artırın.',
    kategori: 'Verimli Çalışma',
    sure: '8 dk',
    tarih: '2025-12-23',
    etiketler: ['pomodoro', 'verimlilik', 'odaklanma'],
    icerik: `
## Pomodoro Tekniği Nedir?

Pomodoro Tekniği, 1980'lerin sonunda Francesco Cirillo tarafından geliştirilen bir zaman yönetimi yöntemidir. İtalyanca'da "domates" anlamına gelen bu teknik, adını Cirillo'nun kullandığı domates şeklindeki mutfak zamanlayıcısından almıştır.

## Nasıl Uygulanır?

### 1. Görev Seçimi
Çalışacağınız konuyu veya görevi belirleyin. Bu bir matematik konusu, İngilizce kelime çalışması veya herhangi bir ders olabilir.

### 2. Zamanlayıcıyı Ayarlayın
25 dakikalık bir zamanlayıcı kurun. Bu süreye "bir pomodoro" denir.

### 3. Odaklanın
25 dakika boyunca sadece seçtiğiniz göreve odaklanın. Hiçbir dikkat dağıtıcıya izin vermeyin:
- Telefonunuzu sessize alın
- Sosyal medya bildirimlerini kapatın
- Çalışma alanınızı düzenleyin

### 4. Kısa Mola
25 dakika dolduğunda 5 dakikalık bir mola verin. Bu sürede:
- Su için
- Gerinin
- Pencereden dışarı bakın
- Gözlerinizi dinlendirin

### 5. Tekrarlayın
4 pomodoro tamamladıktan sonra 15-30 dakikalık uzun bir mola verin.

## Neden Etkili?

### Bilimsel Temeli
- **Dikkat Süresi**: İnsan beyni ortalama 25-30 dakika yoğun odaklanabilir.
- **Dopamin Döngüsü**: Kısa molalar, beynin ödül sistemini aktive eder.
- **Çalışma Belleği**: Molalar, öğrenilen bilginin uzun süreli belleğe aktarılmasına yardımcı olur.

### Araştırma Sonuçları
Yapılan araştırmalar, Pomodoro Tekniği kullanan öğrencilerin:
- **%40 daha verimli** çalıştığını
- **Daha az yorulduğunu**
- **Daha fazla konuyu tamamladığını** göstermektedir.

## Öğrenciler İçin İpuçları

1. **Ders Başına Pomodoro Sayısı**: Her derse 2-3 pomodoro ayırın.
2. **Zor Konular**: Zor konuları enerjinizin yüksek olduğu saatlere planlayın.
3. **Not Alma**: Her pomodoro sonunda öğrendiklerinizi kısaca not edin.
4. **Hedef Belirleme**: Günlük pomodoro hedefi koyun (örn: 8-10 pomodoro).

## Teknokul ile Pomodoro

Teknokul'da soru çözerken Pomodoro Tekniği'ni uygulayabilirsiniz:
- 25 dakikada kaç soru çözdüğünüzü takip edin
- Her pomodoro'da farklı bir konu çalışın
- Günlük seri ve rozetlerle motivasyonunuzu koruyun

## Sonuç

Pomodoro Tekniği, basit ama son derece etkili bir yöntemdir. Düzenli uygulama ile ders çalışma alışkanlıklarınızı tamamen değiştirebilir ve sınav başarınızı artırabilirsiniz.

Hemen bugün deneyin: Bir zamanlayıcı kurun ve ilk pomodoro'nuzu başlatın!
    `,
    faqs: [
      {
        question: 'Pomodoro süresi değiştirilebilir mi?',
        answer: 'Evet, 25 dakika bir başlangıç noktasıdır. Kendinize göre 20-45 dakika arasında ayarlayabilirsiniz. Ancak araştırmalar 25 dakikanın optimal olduğunu göstermektedir.',
      },
      {
        question: 'Pomodoro sırasında mola vermek gerekir mi?',
        answer: 'Hayır, 25 dakika kesintisiz çalışmalısınız. Acil olmayan her şey pomodoro bitene kadar bekleyebilir. Acil bir durum olursa pomodoro\'yu iptal edip baştan başlamalısınız.',
      },
      {
        question: 'Günde kaç pomodoro yapmalıyım?',
        answer: 'Bu kişiden kişiye değişir. Öğrenciler için günde 8-12 pomodoro (4-6 saat etkili çalışma) ideal bir hedeftir. Yeni başlayanlar 4-6 pomodoro ile başlayabilir.',
      },
    ],
  },
  'lgs-hazirlik-rehberi-8-sinif': {
    baslik: 'LGS\'ye Nasıl Hazırlanılır? 8. Sınıf Rehberi',
    ozet: 'LGS\'de başarılı olmak için adım adım hazırlık rehberi. Hangi konulara ne kadar zaman ayırmalısınız?',
    kategori: 'Sınav Hazırlık',
    sure: '12 dk',
    tarih: '2025-12-23',
    etiketler: ['LGS', '8. sınıf', 'sınav'],
    icerik: `
## LGS Nedir?

Liselere Geçiş Sistemi (LGS), 8. sınıf öğrencilerinin lise tercihlerinde kullanılan merkezi sınavdır. Sınav 90 sorudan oluşur ve öğrencilerin 6 temel dersten aldıkları puanlarla değerlendirilir.

## LGS Soru Dağılımı

| Ders | Soru Sayısı | Katsayı |
|------|-------------|---------|
| Türkçe | 20 | 4 |
| Matematik | 20 | 4 |
| Fen Bilimleri | 20 | 4 |
| Sosyal Bilgiler | 20 | 4 |
| Din Kültürü | 10 | 2 |
| İngilizce | 10 | 2 |

## Aylık Hazırlık Planı

### Eylül - Ekim: Temel Atma
- 7. sınıf konularını tekrar edin
- Eksik konuları belirleyin
- Düzenli çalışma alışkanlığı oluşturun
- Günde en az 2 saat ders çalışın

### Kasım - Aralık: Konu Tamamlama
- 8. sınıf konularını öğrenin
- Her konudan test çözün
- Zor konulara ekstra zaman ayırın
- Günde 3-4 saat çalışmaya çıkın

### Ocak - Şubat: Pekiştirme
- Tüm konuları tekrar edin
- Deneme sınavlarına başlayın
- Yanlış sorularınızı analiz edin
- Günde 4-5 saat çalışın

### Mart - Nisan: Yoğun Çalışma
- Haftada 2-3 deneme çözün
- Eksik konulara odaklanın
- Soru çözme hızınızı artırın
- Günde 5-6 saat çalışın

### Mayıs - Haziran: Final
- Son tekrarlar
- Motivasyonunuzu koruyun
- Sınav stratejinizi belirleyin
- Uyku düzeninize dikkat edin

## Ders Bazlı Öneriler

### Matematik
- Formülleri ezberleyin değil, anlayın
- Her gün en az 15-20 soru çözün
- Geometri ve cebirde zayıfsanız ekstra çalışın
- Problem çözme stratejileri öğrenin

### Türkçe
- Her gün en az 30 dakika kitap okuyun
- Paragraf sorularına önem verin
- Dil bilgisi kurallarını öğrenin
- Sözcük haznenizi geliştirin

### Fen Bilimleri
- Deneyleri ve formülleri anlayın
- Görsel materyaller kullanın
- Güncel bilim haberlerini takip edin
- Fizik, Kimya, Biyoloji dengeli çalışın

### Sosyal Bilgiler
- Haritalarla çalışın
- Tarih olaylarını kronolojik öğrenin
- Güncel olayları takip edin
- Vatandaşlık konularını atlama

## Teknokul ile LGS Hazırlık

Teknokul'un sunduğu avantajlar:
- **10.000+ LGS sorusu** ile pratik yapın
- **AI destekli analiz** ile eksiklerinizi görün
- **Günlük seri** ile düzenli çalışın
- **Liderlik yarışı** ile motivasyonunuzu koruyun
- **Koçluk desteği** ile rehberlik alın

## Başarı İçin Altın Kurallar

1. **Düzenli çalışın**: Her gün aynı saatte çalışmaya başlayın
2. **Plan yapın**: Haftalık ve günlük planlar oluşturun
3. **Soru çözün**: Teori kadar pratik de önemli
4. **Dinlenin**: Kaliteli uyku başarının anahtarı
5. **Sosyalleşin**: Arkadaşlarınızla vakit geçirin
6. **Spor yapın**: Fiziksel aktivite zihinsel performansı artırır

Unutmayın: LGS bir maraton, sprint değil. Kendinize zaman tanıyın ve motivasyonunuzu kaybetmeyin!
    `,
    faqs: [
      {
        question: 'LGS\'de kaç net yapmak gerekir?',
        answer: 'İyi bir liseye yerleşmek için genellikle 80+ net hedeflenmelidir. Fen liseleri için 85-90+ net, nitelikli Anadolu liseleri için 75-85 net yapmanız önerilir.',
      },
      {
        question: 'LGS\'ye ne zaman hazırlanmaya başlamalıyım?',
        answer: '8. sınıfın başından itibaren hazırlanmaya başlamak idealdir. Ancak 7. sınıftan itibaren temel konuları sağlam öğrenmek, 8. sınıftaki hazırlığı kolaylaştırır.',
      },
      {
        question: 'Günde kaç saat çalışmalıyım?',
        answer: 'Dönemlere göre değişir: Eylül-Ekim\'de 2-3 saat, Kasım-Şubat\'ta 3-4 saat, Mart-Mayıs\'ta 5-6 saat önerilir. Ancak kaliteli çalışma, uzun ama verimsiz çalışmadan daha önemlidir.',
      },
    ],
  },
  'yks-calisma-programi-nasil-yapilir': {
    baslik: 'YKS Çalışma Programı Nasıl Yapılır?',
    ozet: 'Kendi öğrenme hızınıza uygun, gerçekçi ve sürdürülebilir bir YKS çalışma programı oluşturma rehberi.',
    kategori: 'Planlama',
    sure: '10 dk',
    tarih: '2025-12-23',
    etiketler: ['YKS', 'planlama', 'program'],
    icerik: `
## Neden Çalışma Programı Önemli?

YKS maratonu yaklaşık 1-2 yıl sürer. Bu uzun süreçte:
- Motivasyonunuzu korumak
- Tüm konuları zamanında bitirmek
- Dengeli çalışmak
- Yorgunluğu yönetmek için bir plana ihtiyacınız var.

## Adım Adım Program Oluşturma

### 1. Mevcut Durumunuzu Analiz Edin
- Hangi derslerde iyisiniz?
- Hangi konularda eksiksiniz?
- Günde kaç saat çalışabilirsiniz?
- Hafta sonları ek zamanınız var mı?

### 2. Hedeflerinizi Belirleyin
- Hangi bölümü istiyorsunuz?
- Bu bölüm için kaç puan gerekiyor?
- Puan türünüz nedir? (SAY, SOZ, EA, DİL)

### 3. Konuları Listeleyin
TYT ve AYT için tüm konuları listeleyin ve öncelik sıralaması yapın:
- **Yüksek öncelik**: Çok soru çıkan ve zayıf olduğunuz konular
- **Orta öncelik**: Ortalama soru çıkan konular
- **Düşük öncelik**: Az soru çıkan ve güçlü olduğunuz konular

### 4. Haftalık Şablon Oluşturun

**Örnek Sayısal Öğrenci Programı:**

| Gün | Sabah (3 saat) | Öğlen (2 saat) | Akşam (2 saat) |
|-----|---------------|----------------|----------------|
| Pazartesi | Matematik | Fizik | TYT Türkçe |
| Salı | Kimya | Matematik | TYT Sosyal |
| Çarşamba | Fizik | Biyoloji | TYT Matematik |
| Perşembe | Matematik | Kimya | Deneme Çözümü |
| Cuma | Biyoloji | Fizik | TYT Fen |
| Cumartesi | Deneme Sınavı | Deneme Analiz | Serbest |
| Pazar | Tekrar | Tekrar | Dinlenme |

### 5. Esneklik Payı Bırakın
- Her hafta 2-3 saat "tampon" zaman ayırın
- Beklenmedik durumlar için plan B hazırlayın
- Yorgun hissettiğinizde programı hafifletin

## Etkili Program İpuçları

### Zaman Blokları
- Zor konuları enerjik olduğunuz saatlere koyun
- Benzer dersleri art arda yapmayın
- Her 50 dakikada 10 dakika mola verin

### Tekrar Planı
- Yeni öğrenilen konu: 24 saat içinde tekrar
- Haftalık tekrar: Her pazar günü
- Aylık tekrar: Her ayın son haftası

### Deneme Sınavları
- Haftada en az 1 TYT, 1 AYT denemesi
- Her deneme sonrası analiz yapın
- Yanlışlarınızı konu bazlı kaydedin

## Sık Yapılan Hatalar

1. **Çok iddialı program**: Günde 12 saat çalışma planlamayın
2. **Tek derse odaklanma**: Tüm derslere zaman ayırın
3. **Dinlenmeyi ihmal etme**: Mola ve uyku şart
4. **Esnek olmamak**: Program bir rehber, kelepçe değil
5. **Analiz yapmamak**: Denemelerinizi mutlaka inceleyin

## Motivasyon Teknikleri

- **Küçük hedefler**: Günlük ve haftalık hedefler koyun
- **Ödüller**: Hedeflere ulaştığınızda kendinizi ödüllendirin
- **Çalışma ortağı**: Arkadaşlarınızla birlikte çalışın
- **Görselleştirme**: Hedef üniversitenizin fotoğrafını asın

## Teknokul Desteği

Teknokul ile programınızı destekleyin:
- **İlerleme takibi**: Çözdüğünüz soru sayısını görün
- **Konu bazlı analiz**: Zayıf konularınızı tespit edin
- **AI koçluk**: Kişiselleştirilmiş öneriler alın
- **Günlük hedefler**: Motivasyonunuzu koruyun

Unutmayın: En iyi program, uygulayabileceğiniz programdır. Gerçekçi olun ve kendinize güvenin!
    `,
    faqs: [
      {
        question: 'Günde kaç saat çalışmalıyım?',
        answer: '11. sınıf için günde 4-5 saat, 12. sınıf için 6-8 saat önerilir. Ancak kalite, miktardan önemlidir. Verimli 5 saat, verimsiz 10 saatten iyidir.',
      },
      {
        question: 'TYT mi AYT mi önce çalışmalıyım?',
        answer: '11. sınıfta TYT ağırlıklı çalışıp temel atmanız, 12. sınıfta AYT\'ye ağırlık vermeniz önerilir. Ancak her gün her iki sınava da zaman ayırmalısınız.',
      },
      {
        question: 'Program tutturamıyorum, ne yapmalıyım?',
        answer: 'Programınız muhtemelen çok iddialı. Daha gerçekçi hedeflerle başlayın. Günde 3-4 saatle başlayıp, alıştıkça artırın. Ayrıca esnek tampon zamanlar bırakın.',
      },
    ],
  },
  'sinav-kaygisi-nasil-yenilir': {
    baslik: 'Sınav Kaygısı Nasıl Yenilir?',
    ozet: 'Sınav öncesi stres ve kaygıyı azaltmak için bilimsel olarak kanıtlanmış 7 etkili yöntem.',
    kategori: 'Motivasyon',
    sure: '7 dk',
    tarih: '2025-12-23',
    etiketler: ['kaygı', 'stres', 'motivasyon'],
    icerik: `
## Sınav Kaygısı Nedir?

Sınav kaygısı, sınav öncesinde ve sırasında yaşanan aşırı endişe, korku ve stres halidir. Belirtileri:
- Kalp çarpıntısı
- Terleme
- Mide bulantısı
- Konsantrasyon güçlüğü
- Uyku problemleri
- Öğrenilenleri unutma

## Neden Kaygı Yaşarız?

Kaygı, aslında vücudumuzun "savaş ya da kaç" tepkisidir. Evrimsel olarak tehlikeli durumlarda hayatta kalmamızı sağlar. Ancak sınav gibi modern stres kaynaklarında bu tepki işe yaramaz, hatta zararlı olabilir.

## 7 Etkili Kaygı Yönetimi Tekniği

### 1. Derin Nefes Egzersizi (4-7-8 Tekniği)
1. 4 saniye boyunca burundan nefes alın
2. 7 saniye nefesinizi tutun
3. 8 saniye boyunca ağızdan yavaşça verin
4. 4-5 kez tekrarlayın

**Bilimsel temel**: Derin nefes, parasempatik sinir sistemini aktive ederek kalp atış hızını düşürür ve sakinleşmeyi sağlar.

### 2. Kas Gevşetme Tekniği
1. Ayak parmaklarınızdan başlayın
2. Her kas grubunu 5 saniye kasın
3. Sonra 10 saniye gevşetin
4. Vücudunuzda yukarı doğru ilerleyin

### 3. Pozitif Görselleştirme
- Sınavda başarılı olduğunuzu hayal edin
- Soruları rahatlıkla çözdüğünüzü düşünün
- Sınavdan çıktıktan sonraki mutluluğu hissedin

### 4. Bilişsel Yeniden Yapılandırma
Olumsuz düşünceleri sorgulayın:
- "Kesin başarısız olacağım" → "Elimden gelenin en iyisini yapacağım"
- "Hiçbir şey bilmiyorum" → "Çok çalıştım, bilgilerim var"
- "Herkes benden iyi" → "Herkesin güçlü ve zayıf yanları var"

### 5. Fiziksel Aktivite
Sınav öncesi günlerde:
- 30 dakika yürüyüş
- Hafif egzersiz
- Germe hareketleri

**Bilimsel temel**: Egzersiz, endorfin salgılatarak doğal bir stres giderici görevi görür.

### 6. Uyku Hijyeni
- Sınav öncesi gece erken yatın
- En az 7-8 saat uyuyun
- Uyumadan önce ekran kullanmayın
- Karanlık ve sessiz bir ortam sağlayın

### 7. Hazırlıklı Olun
Kaygının en büyük nedeni belirsizliktir:
- Sınav formatını bilin
- Yeterince çalışın
- Deneme sınavları çözün
- Sınav günü rutininizi planlayın

## Sınav Günü İpuçları

### Sabah
- Erken kalkın, aceleniz olmasın
- Hafif ve besleyici kahvaltı yapın
- Sınav malzemelerinizi kontrol edin
- Pozitif düşüncelerle evinizden çıkın

### Sınav Sırasında
- İlk 2-3 dakika derin nefes alın
- Kolay sorulardan başlayın
- Zor sorularda takılmayın, geçin
- Zamanı kontrol edin ama panik yapmayın

### Soru Okurken
- Soruyu iki kez okuyun
- Anahtar kelimeleri işaretleyin
- Emin olmadığınız soruları işaretleyip geçin
- Son 10 dakikada işaretlilere dönün

## Ne Zaman Profesyonel Yardım Almalı?

Eğer kaygınız:
- Günlük yaşamınızı etkiliyorsa
- Uyumanızı engelliyorsa
- Panik atağa neden oluyorsa
- Fiziksel belirtiler çok şiddetliyse

...bir psikoloğa veya psikolojik danışmana başvurmanız önerilir.

## Sonuç

Sınav kaygısı yaşamak normaldir. Önemli olan bu kaygıyı yönetmeyi öğrenmektir. Bu teknikler düzenli uygulandığında, kaygınızı kontrol altına alabilir ve gerçek potansiyelinizi gösterebilirsiniz.

Unutmayın: Bir sınav, hayatınızın tamamını belirlemez. Elinizden gelenin en iyisini yapın ve sonucu kabullenin.
    `,
    faqs: [
      {
        question: 'Sınav kaygısı normal mi?',
        answer: 'Evet, hafif düzeyde sınav kaygısı normaldir ve hatta performansı artırabilir. Ancak aşırı kaygı zararlıdır. Önemli olan kaygıyı yönetmeyi öğrenmektir.',
      },
      {
        question: 'Sınav gecesi uyuyamıyorum, ne yapmalıyım?',
        answer: 'Uyumaya zorlamayın. Yatak dışında sakin bir aktivite yapın (kitap okuma gibi). 4-7-8 nefes tekniğini uygulayın. Bir gece az uyku performansınızı çok düşürmez, stresinizi artırmayın.',
      },
      {
        question: 'Sınav sırasında panik atak geçiriyorum, ne yapmalıyım?',
        answer: 'Derin nefes alın, ayaklarınızı yere basın ve çevrenizdeki 5 şeyi sayın (grounding tekniği). Eğer sık yaşıyorsanız, mutlaka bir uzmana başvurun.',
      },
    ],
  },
  'feynman-teknigi-ile-ogrenme': {
    baslik: 'Feynman Tekniği ile Kalıcı Öğrenme',
    ozet: 'Nobel ödüllü fizikçi Richard Feynman\'ın öğrenme tekniği ile konuları gerçekten anlayın ve unutmayın.',
    kategori: 'Verimli Çalışma',
    sure: '6 dk',
    tarih: '2025-12-23',
    etiketler: ['feynman', 'öğrenme', 'teknik'],
    icerik: `
## Feynman Tekniği Nedir?

Richard Feynman, 20. yüzyılın en parlak fizikçilerinden biriydi. Nobel ödüllü bu bilim insanı, karmaşık konuları basit bir şekilde açıklama yeteneğiyle ünlüydü. Feynman Tekniği, onun öğrenme felsefesine dayanır: **"Bir şeyi gerçekten anladıysanız, onu basitçe açıklayabilirsiniz."**

## Feynman Tekniği'nin 4 Adımı

### Adım 1: Konuyu Seçin
Öğrenmek istediğiniz konuyu belirleyin ve boş bir kağıdın üstüne yazın.

Örnek: "Fotosentez"

### Adım 2: Basit Bir Dille Açıklayın
Konuyu sanki 10 yaşındaki birine anlatıyormuş gibi açıklayın. Teknik terimler kullanmayın, basit kelimeler tercih edin.

**Kötü örnek:** "Fotosentez, kloroplastlarda gerçekleşen ve ışık enerjisinin kimyasal enerjiye dönüştürüldüğü anabolik bir süreçtir."

**İyi örnek:** "Fotosentez, bitkilerin güneş ışığını kullanarak yemek yapmasıdır. Bitkiler havadan karbondioksit alır, topraktan su çeker ve güneş ışığıyla bunları şekere dönüştürür. Bu şeker bitkinin yemeğidir."

### Adım 3: Boşlukları Tespit Edin
Açıklama yaparken takıldığınız, basitleştiremediğiniz yerler var mı? Bu noktalar, gerçekten anlamadığınız yerlerdir.

- Bu boşlukları not edin
- Kaynaklara geri dönün
- Anlamadığınız kısımları tekrar çalışın

### Adım 4: Sadeleştirin ve Analoji Kullanın
Açıklamanızı daha da basitleştirin. Benzetmeler ve örnekler kullanın.

**Fotosentez için analoji:** "Fotosentez, bitkilerin mutfağıdır. Güneş ocak, su ve karbondioksit malzemeler, şeker ise pişen yemektir."

## Neden Etkili?

### 1. Aktif Öğrenme
Pasif okuma yerine, bilgiyi aktif olarak işlersiniz.

### 2. Anlama Testi
Basit açıklama yapabilmek, gerçek anlamanın göstergesidir.

### 3. Boşluk Tespiti
Bilmediğiniz şeyleri hızlıca fark edersiniz.

### 4. Uzun Süreli Hafıza
Kendi kelimelerinizle açıklamak, bilgiyi uzun süreli hafızaya yerleştirir.

## Öğrenciler İçin Uygulama

### Matematik
- Formülü ezberlemek yerine, neden işe yaradığını açıklayın
- "Pisagor teoremi neden doğru?" sorusunu cevaplayın

### Fen Bilimleri
- Deneylerin mantığını açıklayın
- Süreçleri adım adım basit kelimelerle anlatın

### Sosyal Bilimler
- Tarihi olayları neden-sonuç ilişkisiyle açıklayın
- Kavramları günlük hayat örnekleriyle bağlayın

## Feynman'dan Öğrenme İpuçları

1. **"Bilmiyorum" demekten korkmayın** - Bilmediğinizi kabul etmek, öğrenmenin ilk adımıdır.

2. **Merak edin** - Her şeyi sorgulayın. "Neden?" sorusu en güçlü öğrenme aracıdır.

3. **Analojiler kurun** - Yeni bilgiyi bildiklerinize bağlayın.

4. **Başkalarına anlatın** - En iyi öğrenme yöntemi öğretmektir.

## Sonuç

Feynman Tekniği, ezber yerine anlama odaklı bir öğrenme yöntemidir. Bu tekniği düzenli kullanarak:

- Konuları gerçekten anlarsınız
- Sınavlarda farklı soru tiplerine uyum sağlarsınız
- Bilgileriniz kalıcı olur

Bugün bir konu seçin ve Feynman Tekniği'ni deneyin!
    `,
    faqs: [
      {
        question: 'Feynman Tekniği her ders için uygun mu?',
        answer: 'Evet, özellikle kavram ağırlıklı dersler (Fen, Matematik, Sosyal) için çok etkilidir. Dil öğreniminde de kelime ve gramer kurallarını açıklamak için kullanılabilir.',
      },
      {
        question: 'Ne kadar sürede sonuç alırım?',
        answer: 'İlk uygulamadan itibaren fark edeceksiniz. Düzenli kullanımda 2-3 hafta içinde öğrenme hızınızda belirgin artış olur.',
      },
    ],
  },
  'aktif-tekrar-ve-spaced-repetition': {
    baslik: 'Aktif Tekrar ve Aralıklı Tekrar Yöntemi',
    ozet: 'Bilimsel araştırmalara göre en etkili ezber ve hatırlama tekniği: Spaced Repetition (Aralıklı Tekrar).',
    kategori: 'Verimli Çalışma',
    sure: '9 dk',
    tarih: '2025-12-23',
    etiketler: ['ezber', 'tekrar', 'hafıza'],
    icerik: `
## Unutma Eğrisi

1885'te Alman psikolog Hermann Ebbinghaus, "Unutma Eğrisi"ni keşfetti. Bu araştırmaya göre:

- 1 saat sonra: Öğrenilenlerin %50'si unutulur
- 1 gün sonra: %70'i unutulur
- 1 hafta sonra: %90'ı unutulur

Bu karamsar tablo, düzenli tekrar yapmadan öğrenmenin neredeyse imkansız olduğunu gösteriyor.

## Aralıklı Tekrar (Spaced Repetition) Nedir?

Aralıklı tekrar, bilgiyi tam unutmadan önce tekrar etme stratejisidir. Her başarılı tekrarda, bir sonraki tekrar aralığı uzar.

**Örnek tekrar programı:**
- 1. tekrar: Öğrendikten 1 gün sonra
- 2. tekrar: 3 gün sonra
- 3. tekrar: 1 hafta sonra
- 4. tekrar: 2 hafta sonra
- 5. tekrar: 1 ay sonra

## Aktif Tekrar vs Pasif Tekrar

### Pasif Tekrar (Etkisiz)
- Notları tekrar tekrar okumak
- Kitabı baştan sona geçmek
- Altını çizmek

### Aktif Tekrar (Etkili)
- Kendine soru sormak
- Flash kartlar kullanmak
- Test çözmek
- Özet çıkarmak

**Araştırma sonucu:** Aktif tekrar, pasif tekrara göre %50 daha etkilidir.

## Flash Kart Tekniği

Flash kartlar, aralıklı tekrarın en pratik uygulamasıdır.

### Nasıl Hazırlanır?
- Ön yüz: Soru veya kavram
- Arka yüz: Cevap veya açıklama

### Leitner Sistemi
Flash kartları 5 kutuya ayırın:

1. **Kutu 1:** Her gün çalışılacak kartlar
2. **Kutu 2:** 2 günde bir
3. **Kutu 3:** Haftada bir
4. **Kutu 4:** 2 haftada bir
5. **Kutu 5:** Ayda bir

**Kural:** Doğru bildiğiniz kart bir sonraki kutuya geçer. Yanlış bildiğiniz kart 1. kutuya geri döner.

## Dijital Araçlar

### Anki
- Ücretsiz flash kart uygulaması
- Otomatik aralıklı tekrar algoritması
- Bilgisayar ve telefon senkronizasyonu

### Quizlet
- Hazır kart setleri
- Oyunlaştırma özellikleri
- Arkadaşlarla yarışma

## Ders Bazlı Uygulama

### Matematik
- Formül kartları
- Problem çözüm adımları
- Teorem isimleri ve açıklamaları

### İngilizce
- Kelime-anlam kartları
- Gramer kuralları
- İrregular verbs

### Tarih
- Tarih-olay kartları
- Neden-sonuç ilişkileri
- Önemli isimler ve katkıları

### Fen Bilimleri
- Tanım kartları
- Formül kartları
- Deney sonuçları

## Haftalık Tekrar Planı

| Gün | Aktivite |
|-----|----------|
| Pazartesi | Yeni konuları öğren |
| Salı | Dünkü konuları tekrar et |
| Çarşamba | Yeni konuları öğren |
| Perşembe | Salı + Çarşamba tekrarı |
| Cuma | Yeni konuları öğren |
| Cumartesi | Haftalık genel tekrar |
| Pazar | Zayıf konulara odaklan |

## Sık Yapılan Hatalar

1. **Çok fazla kart yapmak** - Günde 20-30 yeni kart yeterli
2. **Kartları atlamak** - Zor kartları atlamayın, tekrarlayın
3. **Düzensizlik** - Her gün kısa süreli çalışma, haftada bir uzun çalışmadan iyidir
4. **Pasif okuma** - Kartı okumadan önce cevabı tahmin etmeye çalışın

## Sonuç

Aralıklı tekrar ve aktif tekrar, bilimsel olarak kanıtlanmış en etkili öğrenme yöntemleridir. Bu teknikleri kullanarak:

- Daha az zamanda daha çok öğrenirsiniz
- Öğrendiklerinizi uzun süre hatırlarsınız
- Sınav stresi azalır

Bugün ilk flash kart setinizi oluşturun ve farkı görün!
    `,
    faqs: [
      {
        question: 'Günde kaç yeni kart öğrenmeliyim?',
        answer: 'Başlangıçta günde 10-15 yeni kart yeterlidir. Alıştıkça 20-30 karta çıkabilirsiniz. Önemli olan tutarlılıktır.',
      },
      {
        question: 'Hangi uygulama daha iyi: Anki mi Quizlet mı?',
        answer: 'Anki algoritma olarak daha güçlüdür ve uzun vadeli öğrenme için idealdir. Quizlet daha kullanıcı dostudur ve hazır setler sunar. Başlangıç için Quizlet, ileri seviye için Anki önerilir.',
      },
    ],
  },
  'gunluk-ders-calisma-programi': {
    baslik: 'Günlük Ders Çalışma Programı Örneği',
    ozet: 'Sabahtan akşama kadar verimli bir gün geçirmek için örnek ders çalışma programı ve ipuçları.',
    kategori: 'Planlama',
    sure: '5 dk',
    tarih: '2025-12-23',
    etiketler: ['günlük', 'program', 'rutin'],
    icerik: `
## Neden Günlük Program Önemli?

Düzenli bir program:
- Zamanı verimli kullanmanızı sağlar
- Prokrastinasyonu (ertelemeyi) azaltır
- Motivasyonunuzu korur
- Stresi azaltır

## Örnek Günlük Program (Hafta İçi)

### Sabah Rutini (07:00 - 08:00)
- 07:00 - Uyanış, yüz yıkama
- 07:15 - Hafif egzersiz veya germe
- 07:30 - Kahvaltı
- 07:45 - Okula hazırlık

### Okul Sonrası (15:00 - 15:30)
- Dinlenme ve atıştırmalık
- Günün yorgunluğunu atma

### Çalışma Bloğu 1 (15:30 - 17:00)
- **15:30 - 16:00:** Zor ders (Matematik/Fen)
- **16:00 - 16:05:** Kısa mola
- **16:05 - 16:35:** Zor ders devam
- **16:35 - 16:45:** Mola
- **16:45 - 17:00:** Ödev kontrolü

### Mola (17:00 - 17:30)
- Dışarı çıkma, hava alma
- Atıştırmalık

### Çalışma Bloğu 2 (17:30 - 19:00)
- **17:30 - 18:00:** Orta zorluk ders (Türkçe/Sosyal)
- **18:00 - 18:05:** Kısa mola
- **18:05 - 18:35:** Orta zorluk ders devam
- **18:35 - 18:45:** Mola
- **18:45 - 19:00:** Test çözümü

### Akşam Yemeği (19:00 - 19:45)
- Aile ile yemek
- Sohbet ve dinlenme

### Çalışma Bloğu 3 (20:00 - 21:00)
- **20:00 - 20:30:** Kolay ders (İngilizce/Din)
- **20:30 - 21:00:** Günün tekrarı

### Gece Rutini (21:00 - 22:30)
- 21:00 - Serbest zaman (TV, oyun, kitap)
- 22:00 - Yatmaya hazırlık
- 22:30 - Uyku

## Hafta Sonu Programı

### Cumartesi
- **09:00 - 12:00:** Yoğun çalışma (eksik konular)
- **12:00 - 14:00:** Öğle yemeği ve dinlenme
- **14:00 - 16:00:** Test/deneme çözümü
- **16:00 - :** Serbest zaman

### Pazar
- **10:00 - 12:00:** Haftalık tekrar
- **12:00 - :** Serbest zaman ve dinlenme

## Verimli Çalışma İpuçları

### Çalışma Ortamı
- Sessiz ve düzenli bir masa
- İyi aydınlatma
- Telefon uzakta veya sessize
- Su ve sağlıklı atıştırmalık yakında

### Pomodoro Entegrasyonu
Her çalışma seansını Pomodoro tekniği ile yapın:
- 25 dakika odaklanma
- 5 dakika mola
- 4 pomodoro sonrası 15-30 dakika uzun mola

### Ders Sıralaması
1. **En zor ders:** Enerjinin en yüksek olduğu zaman
2. **Orta zorluk:** Ortada
3. **Kolay ders:** Yorgun olduğunuzda

## Esnek Olun

Program bir rehberdir, kelepçe değil:
- Yorgun hissediyorsanız molayı uzatın
- Çok verimli hissediyorsanız devam edin
- Beklenmedik durumlar için tampon zaman bırakın

## Takip ve Değerlendirme

Her gün sonunda kendinize sorun:
- Planladığım her şeyi yaptım mı?
- En verimli zaman dilimim hangisiydi?
- Yarın neyi farklı yapabilirim?

## Sonuç

İyi bir günlük program, başarının temelidir. Bu örnek programı kendi ihtiyaçlarınıza göre uyarlayın ve tutarlı olmaya çalışın.

Unutmayın: Mükemmel program yoktur, size uygun program vardır!
    `,
    faqs: [
      {
        question: 'Günde kaç saat çalışmalıyım?',
        answer: 'Ortaokul için günde 2-3 saat, lise için 3-5 saat yeterlidir. Önemli olan süre değil, verimliliktir.',
      },
      {
        question: 'Çalışırken müzik dinleyebilir miyim?',
        answer: 'Sözsüz, sakin müzikler odaklanmayı artırabilir. Ancak sözlü şarkılar dikkat dağıtır. Herkes farklıdır, kendiniz deneyin.',
      },
    ],
  },
  'matematik-korkusu-nasil-asilir': {
    baslik: 'Matematik Korkusu Nasıl Aşılır?',
    ozet: 'Matematikten korkmayı bırakıp sevmeye başlamak için pratik öneriler ve zihinsel teknikler.',
    kategori: 'Motivasyon',
    sure: '8 dk',
    tarih: '2025-12-23',
    etiketler: ['matematik', 'korku', 'özgüven'],
    icerik: `
## Matematik Korkusu (Math Anxiety) Nedir?

Matematik korkusu, matematik ile karşılaşıldığında yaşanan gerginlik, endişe ve korku halidir. Araştırmalara göre öğrencilerin yaklaşık %50'si bir düzeyde matematik korkusu yaşar.

### Belirtiler
- Matematik dersinden önce gerginlik
- Sınav sırasında zihin boşalması
- "Ben matematiği yapamam" inancı
- Matematik ödevlerini erteleme
- Fiziksel belirtiler (terleme, kalp çarpıntısı)

## Matematik Korkusunun Nedenleri

### 1. Olumsuz Deneyimler
- Geçmişte yaşanan başarısızlıklar
- Öğretmen veya ebeveynden olumsuz geri bildirim
- Sınıfta utandırılma

### 2. Yanlış İnançlar
- "Matematik yeteneği doğuştandır"
- "Ya anlarsın ya anlamazsın"
- "Kızlar matematikten anlamaz" (tamamen yanlış!)

### 3. Eksik Temel
- Önceki konuları tam anlamamak
- Üst konularda zorlanmak
- Kötü döngüye girmek

## Matematik Korkusunu Yenme Stratejileri

### 1. Zihniyetinizi Değiştirin

**Sabit Zihniyet → Gelişim Zihniyeti**

- "Matematiği yapamıyorum" → "Henüz yapamıyorum, öğreneceğim"
- "Zeki değilim" → "Çalışarak gelişebilirim"
- "Hata yapmak kötü" → "Hatalar öğrenme fırsatı"

### 2. Temelden Başlayın

Eksik konularınızı tespit edin ve oradan başlayın:
- Çarpım tablosu
- Kesirler
- Denklemler
- Temel geometri

### 3. Küçük Adımlarla İlerleyin

Büyük hedefler yerine küçük hedefler koyun:
- ❌ "Tüm matematiği öğreneceğim"
- ✅ "Bugün 5 kesir sorusu çözeceğim"

### 4. Hataları Kucaklayın

Her hata bir öğrenme fırsatıdır:
- Yanlış çözümü inceleyin
- Nerede hata yaptığınızı bulun
- Doğru çözümü anlayın
- Benzer soru çözün

### 5. Matematiği Günlük Hayata Bağlayın

- Market alışverişinde hesap yapın
- Yemek tariflerinde ölçüleri hesaplayın
- Sporla ilgiliyseniz istatistikleri inceleyin
- Oyunlardaki matematiksel kalıpları keşfedin

### 6. Olumlu Öz Konuşma

Olumsuz düşünceleri değiştirin:
- "Bu çok zor" → "Bu zorlayıcı ama başarabilirim"
- "Anlayamayacağım" → "Adım adım anlayacağım"
- "Herkes benden iyi" → "Herkesin hızı farklı"

### 7. Yardım İsteyin

- Öğretmeninize soru sorun
- Arkadaşlarınızla çalışın
- Online kaynaklardan faydalanın
- Gerekirse özel ders alın

## Pratik Egzersizler

### Günlük Matematik Rutini
1. **5 dakika:** Zihinsel matematik (çarpma, toplama)
2. **10 dakika:** Kolay sorular (özgüven için)
3. **15 dakika:** Orta zorluk sorular
4. **5 dakika:** Zor soru (meydan okuma)

### Nefes Egzersizi (Sınav Öncesi)
1. 4 saniye nefes alın
2. 4 saniye tutun
3. 4 saniye verin
4. 3-5 kez tekrarlayın

### Görselleştirme
Sınavda başarılı olduğunuzu hayal edin:
- Soruları rahatlıkla çözüyorsunuz
- Doğru cevapları işaretliyorsunuz
- Sınavdan mutlu çıkıyorsunuz

## Başarı Hikayeleri

Birçok ünlü matematikçi ve bilim insanı başlangıçta matematikle zorlanmıştır:

- **Albert Einstein:** Okul yıllarında matematikle mücadele etti
- **Maryam Mirzakhani:** Başlangıçta matematikten hoşlanmıyordu, sonra Fields Madalyası kazandı

## Sonuç

Matematik korkusu gerçektir ama yenilebilir. Doğru strateji, sabır ve düzenli çalışma ile matematiği sevmeye başlayabilirsiniz.

**Unutmayın:** Matematik bir yetenek değil, bir beceridir. Beceriler çalışarak gelişir!

Bugün küçük bir adım atın: Sadece bir soru çözün ve kendinizi tebrik edin!
    `,
    faqs: [
      {
        question: 'Matematik korkusu kalıtsal mı?',
        answer: 'Hayır, matematik korkusu öğrenilmiş bir tepkidir. Olumsuz deneyimler ve yanlış inançlardan kaynaklanır. Doğru yaklaşımla tamamen aşılabilir.',
      },
      {
        question: 'Ne kadar sürede matematiği sevebilirim?',
        answer: 'Bu kişiye göre değişir. Düzenli ve olumlu deneyimlerle birkaç hafta içinde tutumunuz değişmeye başlar. 2-3 ay içinde belirgin fark hissedersiniz.',
      },
      {
        question: 'Özel ders almam gerekir mi?',
        answer: 'Şart değil. Online kaynaklar, YouTube videoları ve kendi kendine çalışma ile de başarılı olabilirsiniz. Ancak çok gerideyseniz veya motivasyon sorunu yaşıyorsanız özel ders faydalı olabilir.',
      },
    ],
  },
}

// Statik params oluştur
export function generateStaticParams() {
  return Object.keys(MAKALELER).map((slug) => ({
    slug: slug,
  }))
}

// Dinamik metadata
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params
  const makale = MAKALELER[slug]
  
  if (!makale) {
    return {
      title: 'Makale Bulunamadı',
    }
  }

  return {
    title: makale.baslik,
    description: makale.ozet,
    keywords: makale.etiketler,
    alternates: {
      canonical: `https://www.teknokul.com.tr/rehberler/${slug}`,
    },
    openGraph: {
      title: makale.baslik,
      description: makale.ozet,
      type: 'article',
      publishedTime: makale.tarih,
      authors: ['Teknokul'],
      tags: makale.etiketler,
    },
    twitter: {
      card: 'summary_large_image',
      title: makale.baslik,
      description: makale.ozet,
    },
  }
}

export default async function MakaleDetayPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const makale = MAKALELER[slug]

  if (!makale) {
    notFound()
  }

  // Markdown benzeri içeriği HTML'e dönüştür (basit)
  const formatIcerik = (icerik: string) => {
    return icerik
      .split('\n')
      .map((line, i) => {
        // Başlıklar
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-2xl font-bold text-white mt-8 mb-4">{line.replace('## ', '')}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-xl font-semibold text-white mt-6 mb-3">{line.replace('### ', '')}</h3>
        }
        // Liste öğeleri
        if (line.startsWith('- ')) {
          return <li key={i} className="text-gray-300 ml-4">{line.replace('- ', '')}</li>
        }
        // Numaralı liste
        if (/^\d+\. /.test(line)) {
          return <li key={i} className="text-gray-300 ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>
        }
        // Kalın metin
        if (line.includes('**')) {
          const parts = line.split('**')
          return (
            <p key={i} className="text-gray-300 my-2">
              {parts.map((part, j) => 
                j % 2 === 1 ? <strong key={j} className="text-white">{part}</strong> : part
              )}
            </p>
          )
        }
        // Tablo (basit gösterim)
        if (line.includes('|') && !line.startsWith('|---')) {
          const cells = line.split('|').filter(c => c.trim())
          if (cells.length > 0) {
            return (
              <div key={i} className="grid grid-cols-4 gap-2 text-sm text-gray-300 py-1 border-b border-white/10">
                {cells.map((cell, j) => (
                  <span key={j} className={j === 0 ? 'font-medium text-white' : ''}>{cell.trim()}</span>
                ))}
              </div>
            )
          }
        }
        // Normal paragraf
        if (line.trim()) {
          return <p key={i} className="text-gray-300 my-3 leading-relaxed">{line}</p>
        }
        return null
      })
      .filter(Boolean)
  }

  return (
    <>
      {/* JSON-LD Schemas */}
      <ArticleSchema
        title={makale.baslik}
        description={makale.ozet}
        slug={slug}
        publishedAt={makale.tarih}
      />
      {makale.faqs && <FAQSchema faqs={makale.faqs} />}

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Teknokul</span>
              </Link>

              <Link
                href="/rehberler"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Tüm Rehberler
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-white transition">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/rehberler" className="hover:text-white transition">Rehberler</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-emerald-400 truncate">{makale.baslik}</span>
          </nav>

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-full">
                {makale.kategori}
              </span>
              <span className="flex items-center gap-1 text-gray-500 text-sm">
                <Clock className="w-4 h-4" />
                {makale.sure} okuma
              </span>
              <span className="flex items-center gap-1 text-gray-500 text-sm">
                <Calendar className="w-4 h-4" />
                {new Date(makale.tarih).toLocaleDateString('tr-TR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {makale.baslik}
            </h1>

            <p className="text-xl text-gray-400">
              {makale.ozet}
            </p>
          </header>

          {/* Article Content */}
          <article className="prose prose-invert prose-emerald max-w-none">
            {formatIcerik(makale.icerik)}
          </article>

          {/* FAQ Section */}
          {makale.faqs && makale.faqs.length > 0 && (
            <section className="mt-12 bg-white/5 rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Sık Sorulan Sorular
              </h2>
              <div className="space-y-4">
                {makale.faqs.map((faq, index) => (
                  <div key={index} className="border-b border-white/10 pb-4 last:border-0">
                    <h3 className="text-white font-semibold mb-2">{faq.question}</h3>
                    <p className="text-gray-400 text-sm">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tags */}
          <div className="mt-8 flex flex-wrap gap-2">
            {makale.etiketler.map((etiket) => (
              <span
                key={etiket}
                className="px-3 py-1 bg-white/5 text-gray-400 text-sm rounded-full"
              >
                #{etiket}
              </span>
            ))}
          </div>

          {/* CTA */}
          <section className="mt-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">
              Öğrendiklerini Uygula!
            </h3>
            <p className="text-emerald-100 mb-6">
              Bu rehberdeki teknikleri kullanarak Teknokul&apos;da pratik yap.
            </p>
            <Link
              href="/hizli-coz"
              className="inline-flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition"
            >
              <BookOpen className="w-5 h-5" />
              Soru Çözmeye Başla
            </Link>
          </section>

          {/* Related Articles */}
          <section className="mt-12">
            <h2 className="text-xl font-bold text-white mb-6">
              Benzer Rehberler
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {Object.entries(MAKALELER)
                .filter(([key]) => key !== slug)
                .slice(0, 2)
                .map(([key, article]) => (
                  <Link
                    key={key}
                    href={`/rehberler/${key}`}
                    className="bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition"
                  >
                    <h3 className="text-white font-semibold mb-2">{article.baslik}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{article.ozet}</p>
                  </Link>
                ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 mt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-semibold">Teknokul</span>
              </Link>
              
              <p className="text-gray-500 text-sm">
                © 2026 Teknokul. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

