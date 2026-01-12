'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Trophy,
  Medal,
  Bot,
  Lightbulb,
  BookOpen,
  Paintbrush,
  Cog,
  ArrowLeft,
  Loader2,
  Star,
  Users,
  Crown,
  Award
} from 'lucide-react'

interface RobotScore {
  robot_id: string
  robot_number: number
  image_url: string | null
  category: string
  avg_score: number
  evaluation_count: number
  bayesian_score?: number  // Adil sıralama için (IMDB yöntemi)
}

interface CategoryResult {
  id: string
  title: string
  subtitle: string
  icon: typeof Bot
  color: string
  bgColor: string
  gradientFrom: string
  gradientTo: string
  winners: RobotScore[]
}

const CATEGORY_CONFIG: Record<string, Omit<CategoryResult, 'winners'>> = {
  inovatif_tasarim: {
    id: 'inovatif_tasarim',
    title: 'En İnovatif Tasarım',
    subtitle: 'Yaratıcılık & Mühendislik',
    icon: Lightbulb,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-500'
  },
  en_iyi_hikaye: {
    id: 'en_iyi_hikaye',
    title: 'En İyi Hikaye',
    subtitle: 'Senaryo & Kimlik',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-500'
  },
  estetik_iscilik: {
    id: 'estetik_iscilik',
    title: 'Estetik ve İşçilik',
    subtitle: 'Görsel Tasarım',
    icon: Paintbrush,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-rose-500'
  },
  hareketli_robot: {
    id: 'hareketli_robot',
    title: 'Hareketli Robot',
    subtitle: 'Teknik Mekanizma',
    icon: Cog,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-500'
  }
}

export default function SonuclarPage() {
  const [results, setResults] = useState<CategoryResult[]>([])
  const [loading, setLoading] = useState(true)
  const [totalEvaluations, setTotalEvaluations] = useState(0)
  const [totalRobots, setTotalRobots] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadResults()
  }, [])

  async function loadResults() {
    setLoading(true)

    // Toplam robot sayısı
    const { count: robotCount } = await supabase
      .from('robots')
      .select('id', { count: 'exact', head: true })
    setTotalRobots(robotCount || 0)

    // Toplam değerlendirme sayısı
    const { count: evalCount } = await supabase
      .from('robot_evaluations')
      .select('id', { count: 'exact', head: true })
    setTotalEvaluations(evalCount || 0)

    // Her kategori için sonuçları çek
    const categoryResults: CategoryResult[] = []

    for (const [categoryId, config] of Object.entries(CATEGORY_CONFIG)) {
      // Bu kategorideki değerlendirmeleri çek
      const { data: evaluations } = await supabase
        .from('robot_evaluations')
        .select(`
          robot_id,
          robots!inner(robot_number, image_url),
          malzeme_donusumu,
          cozum_odaklilik,
          ozgunluk,
          robot_kunyesi,
          gorev_tanimi,
          temiz_iscilik,
          denge_durus,
          renk_gorunum,
          mekanizma_kullanimi,
          islevsellik
        `)
        .eq('category', categoryId)

      if (!evaluations || evaluations.length === 0) {
        categoryResults.push({
          ...config,
          winners: []
        })
        continue
      }

      // Robot bazında ortalamaları hesapla
      const robotScores: Record<string, { scores: number[], robot_number: number, image_url: string | null, count: number }> = {}

      evaluations.forEach((evaluation: any) => {
        const robotId = evaluation.robot_id
        if (!robotScores[robotId]) {
          robotScores[robotId] = {
            scores: [],
            robot_number: evaluation.robots.robot_number,
            image_url: evaluation.robots.image_url,
            count: 0
          }
        }

        // Kategoriye göre ilgili puanları topla
        let categoryScores: number[] = []
        if (categoryId === 'inovatif_tasarim') {
          categoryScores = [
            evaluation.malzeme_donusumu,
            evaluation.cozum_odaklilik,
            evaluation.ozgunluk
          ].filter(s => s !== null)
        } else if (categoryId === 'en_iyi_hikaye') {
          categoryScores = [
            evaluation.robot_kunyesi,
            evaluation.gorev_tanimi
          ].filter(s => s !== null)
        } else if (categoryId === 'estetik_iscilik') {
          categoryScores = [
            evaluation.temiz_iscilik,
            evaluation.denge_durus,
            evaluation.renk_gorunum
          ].filter(s => s !== null)
        } else if (categoryId === 'hareketli_robot') {
          categoryScores = [
            evaluation.mekanizma_kullanimi,
            evaluation.islevsellik
          ].filter(s => s !== null)
        }

        if (categoryScores.length > 0) {
          const avgScore = categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length
          robotScores[robotId].scores.push(avgScore)
          robotScores[robotId].count++
        }
      })

      // ===== BAYESIAN AVERAGE (IMDB Yöntemi) =====
      // Formül: WR = (v / (v + m)) * R + (m / (v + m)) * C
      // v = değerlendirme sayısı, m = minimum eşik, R = ortalama puan, C = genel ortalama
      
      const M = 10 // Minimum değerlendirme eşiği
      
      // Önce tüm robotların ham ortalamalarını hesapla
      const allRobots = Object.entries(robotScores).map(([robotId, data]) => ({
        robot_id: robotId,
        robot_number: data.robot_number,
        image_url: data.image_url,
        category: categoryId,
        avg_score: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        evaluation_count: data.count
      }))
      
      // Genel ortalamayı hesapla (C değeri)
      const totalScores = allRobots.reduce((sum, r) => sum + r.avg_score * r.evaluation_count, 0)
      const totalCount = allRobots.reduce((sum, r) => sum + r.evaluation_count, 0)
      const C = totalCount > 0 ? totalScores / totalCount : 7.5 // Genel ortalama
      
      // Bayesian score hesapla ve sırala
      const winners: RobotScore[] = allRobots
        .map(robot => {
          const v = robot.evaluation_count
          const R = robot.avg_score
          // Bayesian Average formülü
          const bayesianScore = (v / (v + M)) * R + (M / (v + M)) * C
          return {
            ...robot,
            bayesian_score: bayesianScore
          }
        })
        .sort((a, b) => b.bayesian_score - a.bayesian_score) // Bayesian'a göre sırala
        .slice(0, 5) // Top 5

      categoryResults.push({
        ...config,
        winners
      })
    }

    setResults(categoryResults)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Ana Sayfa
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Robot Şenliği Sonuçları</h1>
              <p className="text-white/80 mt-1">Hasandağı Ortaokulu - İnsansı Robot Şenliği 2025</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{totalRobots}</div>
              <div className="text-sm text-white/70">Toplam Robot</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{totalEvaluations}</div>
              <div className="text-sm text-white/70">Değerlendirme</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">4</div>
              <div className="text-sm text-white/70">Kategori</div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {results.map((category, categoryIndex) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="card overflow-hidden"
            >
              {/* Category Header */}
              <div className={`bg-gradient-to-r ${category.gradientFrom} ${category.gradientTo} p-5 text-white`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <category.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{category.title}</h2>
                    <p className="text-white/80 text-sm">{category.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Winners */}
              <div className="p-4">
                {category.winners.length === 0 ? (
                  <div className="text-center py-8 text-surface-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Henüz değerlendirme yapılmamış</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {category.winners.map((winner, index) => (
                      <motion.div
                        key={winner.robot_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
                        className={`flex items-center gap-3 p-3 rounded-xl ${
                          index === 0 
                            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200' 
                            : index === 1
                            ? 'bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200'
                            : index === 2
                            ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200'
                            : 'bg-surface-50'
                        }`}
                      >
                        {/* Rank */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          index === 0 
                            ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white' 
                            : index === 1
                            ? 'bg-gradient-to-br from-slate-300 to-gray-400 text-white'
                            : index === 2
                            ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white'
                            : 'bg-surface-200 text-surface-600'
                        }`}>
                          {index === 0 ? <Crown className="w-5 h-5" /> : index + 1}
                        </div>

                        {/* Robot Image */}
                        <div className="w-12 h-12 rounded-lg bg-surface-100 overflow-hidden flex-shrink-0">
                          {winner.image_url ? (
                            <img
                              src={winner.image_url}
                              alt={`Robot ${winner.robot_number}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Bot className="w-6 h-6 text-surface-300" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-surface-900">Robot #{winner.robot_number}</div>
                          <div className="text-sm text-surface-500">{winner.evaluation_count} değerlendirme</div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="w-4 h-4" fill="currentColor" />
                            <span className="font-bold">{winner.avg_score.toFixed(1)}</span>
                          </div>
                          <div className="text-xs text-surface-400">/10</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-surface-500 text-sm">
          <p>Düzenleyenler: Teknoloji Tasarım Zümresi ve Bilim Fen Teknoloji Kulübü</p>
          <p className="mt-1">Hasandağı Ortaokulu - 2025</p>
        </div>
      </div>
    </div>
  )
}
