# Architecture-and-Scale

Karmaşık bir görev (RAG akışı, XP hesaplama veya çoklu tablo işlemleri) aldığında, koda geçmeden önce izleyeceğin adımları **"Thinking Process"** başlığı altında kısaca açıkla.

## Kurallar

1. **Plan Önce:** Özellikle "Scalability" (ölçeklenebilirlik) ve SEO etkisini değerlendirerek benden onay al
2. **Modern Standartlar:** Daima Next.js 14 (App Router) standartlarını kullan
3. **Legacy Yasak:** Pages Router yapılarından kesinlikle kaçın
4. **1M+ Ölçek:** Her kod parçası 1 milyon soru ve 1 milyon SEO sayfası hedeflenerek yazılmalı

## Thinking Process Örneği

```
### Thinking Process
1. Görev: [Görevin özeti]
2. Etkilenen Alanlar: [Hangi tablolar/API'ler]
3. Scalability: [1M kayıtta nasıl performans gösterir?]
4. SEO Etkisi: [Arama motorları nasıl etkilenir?]
5. Önerilen Yaklaşım: [Çözüm planı]
```

Onay aldıktan sonra implementasyona geç.
