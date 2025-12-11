import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name?: string | null): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Türkçe karakterleri normalize et
export function normalizeTurkish(str: string): string {
  return str
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c')
    .trim()
}

// İki string arasındaki benzerlik skorunu hesapla (Levenshtein distance based)
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeTurkish(str1)
  const s2 = normalizeTurkish(str2)
  
  if (s1 === s2) return 100
  
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  if (longer.length === 0) return 100
  
  // Levenshtein distance
  const costs: number[] = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }
  
  const distance = costs[s2.length]
  return Math.round(((longer.length - distance) / longer.length) * 100)
}

// Bekleyenler listesinde eşleşen öğrenciyi bul
export function findMatchingStudent(
  inputName: string, 
  pendingStudents: { id: string; student_name: string }[]
): { id: string; student_name: string; similarity: number } | null {
  const threshold = 80 // %80 benzerlik eşiği
  
  let bestMatch: { id: string; student_name: string; similarity: number } | null = null
  
  for (const student of pendingStudents) {
    const similarity = calculateSimilarity(inputName, student.student_name)
    
    if (similarity >= threshold) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { ...student, similarity }
      }
    }
  }
  
  return bestMatch
}

