'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { getInitials } from '@/lib/utils'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Star,
  Clock,
  Award,
  MessageSquare,
  Target,
  CheckCircle,
  Play,
  ExternalLink,
  Users,
  BookOpen,
  GraduationCap,
  Send,
  Loader2,
  ThumbsUp,
  User
} from 'lucide-react'

export default function CoachDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useProfile()
  const { studentProfile } = useStudentProfile(profile?.id || '')
  const [coach, setCoach] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [relationshipStatus, setRelationshipStatus] = useState<'none' | 'pending' | 'active'>('none')
  const [showVideo, setShowVideo] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadCoach()
      loadReviews()
    }
  }, [params.id])

  useEffect(() => {
    if (studentProfile?.id && params.id) {
      checkExistingApplication()
    }
  }, [studentProfile?.id, params.id])

  async function loadCoach() {
    setLoading(true)

    const { data } = await supabase
      .from('teacher_profiles')
      .select(`
        *,
        profile:profiles!teacher_profiles_user_id_fkey(id, full_name, avatar_url, email)
      `)
      .eq('id', params.id)
      .single()

    if (data) {
      setCoach(data)
    }

    setLoading(false)
  }

  async function loadReviews() {
    const { data } = await supabase
      .from('reviews')
      .select(`
        *,
        student:student_profiles!reviews_student_id_fkey(
          profile:profiles!student_profiles_user_id_fkey(full_name, avatar_url)
        )
      `)
      .eq('teacher_id', params.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (data) {
      setReviews(data)
    }
  }

  async function checkExistingApplication() {
    const { data } = await supabase
      .from('coaching_relationships')
      .select('id, status')
      .eq('coach_id', params.id)
      .eq('student_id', studentProfile?.id)
      .in('status', ['pending', 'active'])
      .single()

    if (data) {
      setRelationshipStatus(data.status as 'pending' | 'active')
    } else {
      setRelationshipStatus('none')
    }
  }

  async function handleApply() {
    if (!profile) {
      // Giriş sayfasına yönlendir, geri dönüş URL'si ile
      router.push(`/giris?redirect=/koclar/${params.id}`)
      return
    }

    if (profile.role !== 'ogrenci') {
      alert('Koçluk başvurusu yapmak için öğrenci hesabıyla giriş yapmalısınız.')
      return
    }

    if (!studentProfile) {
      alert('Öğrenci profiliniz yüklenemedi. Lütfen sayfayı yenileyin.')
      return
    }

    setApplying(true)

    const { error } = await supabase
      .from('coaching_relationships')
      .insert({
        coach_id: params.id,
        student_id: studentProfile.id,
        status: 'pending',
      })

    if (!error) {
      setRelationshipStatus('pending')
    } else {
      alert('Hata: ' + error.message)
    }

    setApplying(false)
  }

  // İstatistikler hesapla
  const avgOverall = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.overall_rating, 0) / reviews.length
    : 0
  const avgCommunication = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.communication_rating, 0) / reviews.length
    : 0
  const avgKnowledge = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.knowledge_rating, 0) / reviews.length
    : 0
  const avgPunctuality = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.punctuality_rating, 0) / reviews.length
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-surface-900 mb-2">Koç bulunamadı</h2>
          <Link href="/koclar" className="text-primary-500">
            Koçlara dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-surface-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">
                Tekn<span className="text-primary-500">okul</span>
              </span>
            </Link>
            
            {profile ? (
              <Link 
                href={`/${profile.role === 'ogretmen' ? 'koc' : profile.role}`}
                className="btn btn-primary btn-sm"
              >
                Dashboard
              </Link>
            ) : (
              <Link href="/giris" className="btn btn-primary btn-sm">
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link href="/koclar" className="inline-flex items-center gap-2 text-surface-600 hover:text-primary-500 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Koçlara Dön
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Section */}
            {coach.video_url && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card overflow-hidden"
              >
                <div className="aspect-video bg-black relative">
                  {showVideo ? (
                    <iframe
                      src={coach.video_url.replace('watch?v=', 'embed/')}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      onClick={() => setShowVideo(true)}
                      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-500/20 to-accent-500/20"
                    >
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                        <Play className="w-10 h-10 text-primary-500 ml-1" />
                      </div>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Profile Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden flex-shrink-0">
                  {coach.profile?.avatar_url ? (
                    <img src={coach.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(coach.profile?.full_name)
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold text-surface-900">{coach.profile?.full_name}</h1>
                    {coach.is_verified && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-surface-600 mb-4">{coach.headline || 'Eğitim Koçu'}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className={`w-5 h-5 ${avgOverall > 0 ? 'text-yellow-400 fill-yellow-400' : 'text-surface-300'}`} />
                      <span className="font-bold text-surface-900">{avgOverall > 0 ? avgOverall.toFixed(1) : '-'}</span>
                      <span className="text-surface-500">({reviews.length} değerlendirme)</span>
                    </div>
                    <div className="flex items-center gap-1 text-surface-500">
                      <Clock className="w-4 h-4" />
                      {coach.experience_years || 0} yıl deneyim
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Specializations */}
            {coach.specializations && coach.specializations.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card p-6"
              >
                <h2 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary-500" />
                  Uzmanlık Alanları
                </h2>
                <div className="flex flex-wrap gap-2">
                  {coach.specializations.map((spec: string, i: number) => (
                    <span 
                      key={i}
                      className="px-3 py-1.5 bg-primary-50 text-primary-600 font-medium rounded-full"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Bio & Teaching Style */}
            {(coach.bio || coach.teaching_style) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card p-6 space-y-6"
              >
                {coach.bio && (
                  <div>
                    <h2 className="text-lg font-semibold text-surface-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary-500" />
                      Hakkında
                    </h2>
                    <p className="text-surface-600 leading-relaxed whitespace-pre-line">{coach.bio}</p>
                  </div>
                )}
                
                {coach.teaching_style && (
                  <div>
                    <h2 className="text-lg font-semibold text-surface-900 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary-500" />
                      Öğretim Tarzı
                    </h2>
                    <p className="text-surface-600 leading-relaxed whitespace-pre-line">{coach.teaching_style}</p>
                  </div>
                )}

                {coach.target_students && (
                  <div>
                    <h2 className="text-lg font-semibold text-surface-900 mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary-500" />
                      Hedef Öğrenci Kitlesi
                    </h2>
                    <p className="text-surface-600 leading-relaxed">{coach.target_students}</p>
                  </div>
                )}

                {coach.achievements && (
                  <div>
                    <h2 className="text-lg font-semibold text-surface-900 mb-3 flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary-500" />
                      Başarılar
                    </h2>
                    <p className="text-surface-600 leading-relaxed whitespace-pre-line">{coach.achievements}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Certificates */}
            {coach.certificates && coach.certificates.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card p-6"
              >
                <h2 className="text-lg font-semibold text-surface-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Sertifikalar
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {coach.certificates.map((cert: any, i: number) => (
                    <div key={i} className="p-4 bg-yellow-50 rounded-xl flex items-center gap-3">
                      <Award className="w-8 h-8 text-yellow-500" />
                      <div className="flex-1">
                        <div className="font-medium text-surface-900">{cert.name}</div>
                        {cert.issuer && <div className="text-sm text-surface-500">{cert.issuer}</div>}
                      </div>
                      {cert.url && (
                        <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-primary-500">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Reviews */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <div className="p-6 border-b border-surface-100">
                <h2 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-500" />
                  Değerlendirmeler ({reviews.length})
                </h2>
              </div>

              {/* Rating Summary */}
              {reviews.length > 0 && (
                <div className="p-6 border-b border-surface-100 bg-surface-50">
                  <div className="grid sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-surface-900">{avgOverall.toFixed(1)}</div>
                      <div className="text-sm text-surface-500">Genel</div>
                      <div className="flex justify-center mt-1">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`w-4 h-4 ${i <= avgOverall ? 'text-yellow-400 fill-yellow-400' : 'text-surface-200'}`} />
                        ))}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-surface-900">{avgCommunication.toFixed(1)}</div>
                      <div className="text-sm text-surface-500">İletişim</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-surface-900">{avgKnowledge.toFixed(1)}</div>
                      <div className="text-sm text-surface-500">Bilgi</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-surface-900">{avgPunctuality.toFixed(1)}</div>
                      <div className="text-sm text-surface-500">Dakiklik</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              <div className="divide-y divide-surface-100">
                {reviews.length > 0 ? reviews.map((review) => (
                  <div key={review.id} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                        {review.is_anonymous ? '?' : getInitials(review.student?.profile?.full_name)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium text-surface-900">
                              {review.is_anonymous ? 'Anonim' : review.student?.profile?.full_name}
                            </div>
                            <div className="text-sm text-surface-500">
                              {new Date(review.created_at).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="font-medium">{review.overall_rating}</span>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-surface-600">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-surface-300" />
                    <p className="text-surface-500">Henüz değerlendirme yok</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6 sticky top-24"
            >
              {relationshipStatus === 'active' ? (
                <>
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="font-semibold text-surface-900 mb-2">Bu Sizin Koçunuz!</h3>
                    <p className="text-sm text-surface-500 mb-4">
                      {coach?.profile?.full_name} ile aktif koçluk ilişkiniz var.
                    </p>
                    <Link 
                      href="/ogrenci/mesajlar"
                      className="btn btn-primary btn-md w-full mb-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Mesaj Gönder
                    </Link>
                    <Link 
                      href="/ogrenci/degerlendirme"
                      className="btn btn-outline btn-md w-full"
                    >
                      <Star className="w-5 h-5" />
                      Değerlendirme Yap
                    </Link>
                  </div>
                </>
              ) : relationshipStatus === 'pending' ? (
                <>
                  <h3 className="font-semibold text-surface-900 mb-4">Koçluk Başvurusu</h3>
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                    <p className="font-medium text-yellow-600">Başvurunuz Değerlendiriliyor</p>
                    <p className="text-sm text-surface-500 mt-2">
                      Koç başvurunuzu inceliyor. En kısa sürede size dönüş yapacak.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-surface-900 mb-4">Koçluk Başvurusu</h3>
                  <p className="text-sm text-surface-500 mb-4">
                    Bu koçla çalışmak için başvuru yapın. Koç başvurunuzu kabul ederse 
                    sizinle iletişime geçecek ve detayları konuşacaksınız.
                  </p>
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="btn btn-primary btn-lg w-full"
                  >
                    {applying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Başvuru Yap
                      </>
                    )}
                  </button>
                </>
              )}
            </motion.div>

            {/* Quick Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <h3 className="font-semibold text-surface-900 mb-4">Hızlı Bilgiler</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <div className="font-medium text-surface-900">{coach.experience_years || 0} Yıl</div>
                    <div className="text-sm text-surface-500">Deneyim</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <div className="font-medium text-surface-900">{avgOverall > 0 ? avgOverall.toFixed(1) : '-'}/5</div>
                    <div className="text-sm text-surface-500">Ortalama Puan</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-medium text-surface-900">{reviews.length}</div>
                    <div className="text-sm text-surface-500">Değerlendirme</div>
                  </div>
                </div>

                {coach.certificates && coach.certificates.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <div className="font-medium text-surface-900">{coach.certificates.length}</div>
                      <div className="text-sm text-surface-500">Sertifika</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
