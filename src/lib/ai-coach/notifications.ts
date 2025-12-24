import { StudentContext, getSubjectName } from './prompts'

export interface AICoachNotification {
  id: string
  type: 'morning' | 'afternoon' | 'evening' | 'achievement' | 'streak' | 'task'
  title: string
  message: string
  icon: string
  action?: {
    label: string
    href: string
  }
}

export function getMorningNotification(context: StudentContext): AICoachNotification {
  const messages = [
    {
      title: 'Günaydın! ☀️',
      message: `Bugün ${context.weakSubjects[0] ? getSubjectName(context.weakSubjects[0]) : 'farklı konularda'} pratik yapmaya ne dersin?`,
    },
    {
      title: 'Yeni bir gün, yeni fırsatlar! 🌟',
      message: `${context.currentStreak} günlük serini korumak için bugün de soru çözmeyi unutma!`,
    },
    {
      title: 'Hazır mısın? 💪',
      message: `Hedefine ${context.daysUntilExam || 'her gün'} gün daha yakınsın. Hadi başlayalım!`,
    }
  ]
  
  const selected = messages[Math.floor(Math.random() * messages.length)]
  
  return {
    id: `morning-${Date.now()}`,
    type: 'morning',
    title: selected.title,
    message: selected.message,
    icon: '🌅',
    action: {
      label: 'Soru Çöz',
      href: '/ogrenci/sorular'
    }
  }
}

export function getAfternoonNotification(context: StudentContext): AICoachNotification {
  const today = context.weeklyActivity
  
  if (today.totalQuestions === 0) {
    return {
      id: `afternoon-${Date.now()}`,
      type: 'afternoon',
      title: 'Bugün henüz başlamadın 📚',
      message: 'Öğleden sonra biraz pratik yapmaya ne dersin? 15 dakika bile fark yaratır!',
      icon: '⏰',
      action: {
        label: 'Hemen Başla',
        href: '/ogrenci/sorular'
      }
    }
  }
  
  return {
    id: `afternoon-${Date.now()}`,
    type: 'afternoon',
    title: 'Harika gidiyorsun! 🚀',
    message: `Bugün ${today.totalQuestions} soru çözdün. Biraz daha ekleyerek rekorunu kırabilirsin!`,
    icon: '📊',
    action: {
      label: 'Devam Et',
      href: '/ogrenci/sorular'
    }
  }
}

export function getEveningNotification(context: StudentContext): AICoachNotification {
  const today = context.weeklyActivity
  
  if (today.totalQuestions >= 20) {
    return {
      id: `evening-${Date.now()}`,
      type: 'evening',
      title: 'Muhteşem bir gün! 🏆',
      message: `Bugün ${today.totalQuestions} soru çözdün ve %${Math.round((today.correctCount / today.totalQuestions) * 100)} doğruluk oranı yakaladın. Tebrikler!`,
      icon: '🎉'
    }
  }
  
  if (today.totalQuestions > 0) {
    return {
      id: `evening-${Date.now()}`,
      type: 'evening',
      title: 'Güzel bir gün geçirdin 👏',
      message: `${today.totalQuestions} soru çözdün. Her gün biraz daha fazla hedefle!`,
      icon: '✨'
    }
  }
  
  return {
    id: `evening-${Date.now()}`,
    type: 'evening',
    title: 'Yarın yeni bir gün! 🌙',
    message: 'Bugün fırsat olmadı ama yarın tekrar deneyebilirsin. İyi geceler!',
    icon: '💤'
  }
}

export function getStreakNotification(context: StudentContext): AICoachNotification | null {
  if (context.currentStreak === 0) {
    return {
      id: `streak-${Date.now()}`,
      type: 'streak',
      title: 'Serin bitti 😢',
      message: 'Dün soru çözmedin ve serin sıfırlandı. Bugün yeni bir seri başlat!',
      icon: '🔥',
      action: {
        label: 'Yeniden Başla',
        href: '/ogrenci/sorular'
      }
    }
  }
  
  if (context.currentStreak === 6) {
    return {
      id: `streak-${Date.now()}`,
      type: 'streak',
      title: '1 Gün Kaldı! 🔥',
      message: 'Yarın soru çözersen 7 günlük seriyi tamamlayacak ve rozet kazanacaksın!',
      icon: '🏅',
      action: {
        label: 'Bugünü Tamamla',
        href: '/ogrenci/sorular'
      }
    }
  }
  
  if (context.currentStreak === 7) {
    return {
      id: `streak-${Date.now()}`,
      type: 'streak',
      title: '7 Gün Serisi! 🎉',
      message: 'Tebrikler! 7 günlük seriyi tamamladın ve "Kararlı Öğrenci" rozetini kazandın!',
      icon: '🏆'
    }
  }
  
  if (context.currentStreak === 30) {
    return {
      id: `streak-${Date.now()}`,
      type: 'streak',
      title: '30 Gün Efsanesi! 👑',
      message: 'İnanılmaz! 30 gün üst üste soru çözdün. Sen bir şampiyon!',
      icon: '👑'
    }
  }
  
  return null
}

export function getTaskNotification(taskTitle: string, xpReward: number): AICoachNotification {
  return {
    id: `task-${Date.now()}`,
    type: 'task',
    title: 'Yeni AI Koç Görevi! 🎯',
    message: `"${taskTitle}" - Tamamlarsan ${xpReward} XP kazanırsın!`,
    icon: '🤖',
    action: {
      label: 'Görevi Gör',
      href: '/ogrenci/ai-koc'
    }
  }
}

export function getAchievementNotification(badgeName: string, badgeDescription: string): AICoachNotification {
  return {
    id: `achievement-${Date.now()}`,
    type: 'achievement',
    title: 'Yeni Rozet Kazandın! 🏅',
    message: `"${badgeName}" - ${badgeDescription}`,
    icon: '🎖️',
    action: {
      label: 'Rozetleri Gör',
      href: '/ogrenci/rozetler'
    }
  }
}

// Bildirimleri zamana göre al
export function getCurrentNotification(context: StudentContext): AICoachNotification {
  const hour = new Date().getHours()
  
  // Seri bildirimi öncelikli
  const streakNotif = getStreakNotification(context)
  if (streakNotif && Math.random() > 0.5) {
    return streakNotif
  }
  
  if (hour >= 6 && hour < 12) {
    return getMorningNotification(context)
  } else if (hour >= 12 && hour < 18) {
    return getAfternoonNotification(context)
  } else {
    return getEveningNotification(context)
  }
}

