'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Zap, TrendingUp, Trophy, Flame, Star, Sparkles } from 'lucide-react'
import { LeaderboardDiff } from '@/hooks/useLeaderboardPolling'

interface LiveActivityFeedProps {
  activities: LeaderboardDiff[]
  maxItems?: number
  className?: string
}

export function LiveActivityFeed({ 
  activities, 
  maxItems = 5,
  className = '' 
}: LiveActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems)

  if (displayActivities.length === 0) {
    return (
      <div className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="relative">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span className="text-sm font-medium text-white/70">Canlı Aktivite</span>
        </div>
        <div className="text-center py-6 text-white/40 text-sm">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Aktivite bekleniyor...
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <Zap className="w-5 h-5 text-amber-400" />
          <motion.span 
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
          />
        </div>
        <span className="text-sm font-medium text-white/70">Canlı Aktivite</span>
        <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          CANLI
        </span>
      </div>
      
      <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {displayActivities.map((activity, index) => (
            <ActivityItem 
              key={`${activity.studentId}-${activity.timestamp}`} 
              activity={activity}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface ActivityItemProps {
  activity: LeaderboardDiff
  index: number
}

function ActivityItem({ activity, index }: ActivityItemProps) {
  const getActivityIcon = () => {
    if (activity.rankChange === 'new') {
      return <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
    }
    if (activity.rankDelta >= 3) {
      return <Flame className="w-4 h-4 text-orange-400" />
    }
    if (activity.newRank <= 3 && activity.oldRank > 3) {
      return <Trophy className="w-4 h-4 text-yellow-400" />
    }
    if (activity.rankChange === 'up') {
      return <TrendingUp className="w-4 h-4 text-green-400" />
    }
    return <Zap className="w-4 h-4 text-blue-400" />
  }

  const getActivityText = () => {
    const name = activity.studentName.split(' ')[0] // Sadece ilk isim
    
    if (activity.rankChange === 'new') {
      return `${name} tabloya girdi!`
    }
    if (activity.newRank === 1 && activity.oldRank !== 1) {
      return `${name} zirveye çıktı! 👑`
    }
    if (activity.newRank <= 3 && activity.oldRank > 3) {
      return `${name} podyuma çıktı!`
    }
    if (activity.rankDelta >= 3 && activity.rankChange === 'up') {
      return `${name} ${activity.rankDelta} sıra atladı! 🚀`
    }
    if (activity.pointsGained > 0) {
      return `${name} +${activity.pointsGained} XP kazandı`
    }
    if (activity.rankChange === 'up') {
      return `${name} ${activity.newRank}. sıraya yükseldi`
    }
    return `${name} puan güncelledi`
  }

  const timeDiff = Math.round((Date.now() - activity.timestamp) / 1000)
  const timeText = timeDiff < 60 
    ? `${timeDiff}sn önce` 
    : `${Math.round(timeDiff / 60)}dk önce`

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ 
        duration: 0.3,
        delay: index * 0.05
      }}
      className="flex items-center gap-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 10 }}
        className="flex-shrink-0"
      >
        {getActivityIcon()}
      </motion.div>
      
      <span className="text-sm text-white/80 flex-1 truncate">
        {getActivityText()}
      </span>
      
      {activity.pointsGained > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-xs font-medium text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded"
        >
          +{activity.pointsGained}
        </motion.span>
      )}
      
      <span className="text-xs text-white/30 flex-shrink-0">
        {timeText}
      </span>
    </motion.div>
  )
}

export default LiveActivityFeed

