import { redirect } from 'next/navigation'

// Ana /soru-bankasi sayfası -> /soru-bankasi/olustur'a yönlendir
export default function SoruBankasiPage() {
  redirect('/soru-bankasi/olustur')
}
