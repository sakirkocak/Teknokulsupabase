'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useProfile, useStudentProfile } from '@/hooks/useProfile'
import { useLetterSpeech } from '@/hooks/useSpeech'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Volume2, 
  ChevronLeft, 
  ChevronRight, 
  Star,
  Sparkles,
  BookOpen,
  Loader2,
  Check,
  X,
  RefreshCw,
  Trophy,
  Target
} from 'lucide-react'
import confetti from 'canvas-confetti'

// Türk Alfabesi
const TURKISH_ALPHABET = [
  { letter: 'A', word: 'Araba', emoji: '🚗' },
  { letter: 'B', word: 'Balon', emoji: '🎈' },
  { letter: 'C', word: 'Cep', emoji: '👖' },
  { letter: 'Ç', word: 'Çiçek', emoji: '🌸' },
  { letter: 'D', word: 'Deniz', emoji: '🌊' },
  { letter: 'E', word: 'Elma', emoji: '🍎' },
  { letter: 'F', word: 'Fil', emoji: '🐘' },
  { letter: 'G', word: 'Gül', emoji: '🌹' },
  { letter: 'Ğ', word: 'Dağ', emoji: '⛰️' },
  { letter: 'H', word: 'Havuç', emoji: '🥕' },
  { letter: 'I', word: 'Işık', emoji: '💡' },
  { letter: 'İ', word: 'İnek', emoji: '🐄' },
  { letter: 'J', word: 'Jilet', emoji: '🪒' },
  { letter: 'K', word: 'Kedi', emoji: '🐱' },
  { letter: 'L', word: 'Limon', emoji: '🍋' },
  { letter: 'M', word: 'Masa', emoji: '🪑' },
  { letter: 'N', word: 'Nar', emoji: '🍑' },
  { letter: 'O', word: 'Okul', emoji: '🏫' },
  { letter: 'Ö', word: 'Öğretmen', emoji: '👩‍🏫' },
  { letter: 'P', word: 'Portakal', emoji: '🍊' },
  { letter: 'R', word: 'Resim', emoji: '🖼️' },
  { letter: 'S', word: 'Su', emoji: '💧' },
  { letter: 'Ş', word: 'Şapka', emoji: '🎩' },
  { letter: 'T', word: 'Top', emoji: '⚽' },
  { letter: 'U', word: 'Uçak', emoji: '✈️' },
  { letter: 'Ü', word: 'Üzüm', emoji: '🍇' },
  { letter: 'V', word: 'Vazo', emoji: '🏺' },
  { letter: 'Y', word: 'Yıldız', emoji: '⭐' },
  { letter: 'Z', word: 'Zürafa', emoji: '🦒' },
]

// Temel Heceler
const SYLLABLES = [
  { syllable: 'ba', words: ['baba', 'balon', 'balık'] },
  { syllable: 'be', words: ['bebek', 'bere'] },
  { syllable: 'bi', words: ['bisiklet', 'biber'] },
  { syllable: 'bo', words: ['boya', 'boğa'] },
  { syllable: 'bu', words: ['burun', 'bulut'] },
  { syllable: 'ma', words: ['mama', 'masa', 'mavi'] },
  { syllable: 'me', words: ['merdiven', 'melek'] },
  { syllable: 'mi', words: ['misafir', 'mısır'] },
  { syllable: 'mo', words: ['motor', 'mor'] },
  { syllable: 'mu', words: ['muz', 'mutlu'] },
  { syllable: 'ne', words: ['nene', 'nehir'] },
  { syllable: 'ka', words: ['kalem', 'kapı', 'karpuz'] },
  { syllable: 'ke', words: ['kedi', 'kelebek'] },
  { syllable: 'ki', words: ['kitap', 'kivi'] },
  { syllable: 'ko', words: ['kova', 'koşu'] },
  { syllable: 'ku', words: ['kuş', 'kutu', 'kurbağa'] },
  { syllable: 'la', words: ['lale', 'lamba'] },
  { syllable: 'le', words: ['leyla', 'leke'] },
  { syllable: 'li', words: ['limon', 'liste'] },
  { syllable: 'sa', words: ['saat', 'sandık'] },
  { syllable: 'se', words: ['sema', 'sepet'] },
  { syllable: 'si', words: ['silgi', 'sincap'] },
  { syllable: 'ta', words: ['tabak', 'tarla'] },
  { syllable: 'te', words: ['tepe', 'terlik'] },
  { syllable: 'ti', words: ['tilki', 'tiyatro'] },
  { syllable: 'to', words: ['top', 'tokaç'] },
  { syllable: 'tu', words: ['tuz', 'turuncu'] },
]

// Basit Kelimeler
const SIMPLE_WORDS = [
  { word: 'anne', emoji: '👩' },
  { word: 'baba', emoji: '👨' },
  { word: 'ev', emoji: '🏠' },
  { word: 'su', emoji: '💧' },
  { word: 'at', emoji: '🐴' },
  { word: 'it', emoji: '🐕' },
  { word: 'el', emoji: '✋' },
  { word: 'göz', emoji: '👁️' },
  { word: 'diş', emoji: '🦷' },
  { word: 'ayak', emoji: '🦶' },
  { word: 'kuş', emoji: '🐦' },
  { word: 'balık', emoji: '🐟' },
  { word: 'kedi', emoji: '🐱' },
  { word: 'köpek', emoji: '🐕' },
  { word: 'arı', emoji: '🐝' },
  { word: 'çiçek', emoji: '🌸' },
  { word: 'ağaç', emoji: '🌳' },
  { word: 'güneş', emoji: '☀️' },
  { word: 'ay', emoji: '🌙' },
  { word: 'yıldız', emoji: '⭐' },
  { word: 'bulut', emoji: '☁️' },
  { word: 'yağmur', emoji: '🌧️' },
  { word: 'kar', emoji: '❄️' },
  { word: 'elma', emoji: '🍎' },
  { word: 'armut', emoji: '🍐' },
  { word: 'muz', emoji: '🍌' },
  { word: 'portakal', emoji: '🍊' },
  { word: 'ekmek', emoji: '🍞' },
  { word: 'süt', emoji: '🥛' },
  { word: 'kalem', emoji: '✏️' },
  { word: 'kitap', emoji: '📚' },
  { word: 'okul', emoji: '🏫' },
]

type Mode = 'letters' | 'syllables' | 'words' | 'quiz'

export default function HarfOgrenmePage() {
  const { profile } = useProfile()
  const { studentProfile } = useStudentProfile(profile?.id || '')
  const { speakLetter, speakSyllable, speakWord, speaking, supported } = useLetterSpeech()
  
  const [mode, setMode] = useState<Mode>('letters')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [quizTotal, setQuizTotal] = useState(0)
  const [quizQuestion, setQuizQuestion] = useState<any>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(false)

  // Öğrenci sınıfı kontrolü
  const studentGrade = studentProfile?.grade || 1

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }

  const generateQuizQuestion = () => {
    setLoading(true)
    setSelectedAnswer(null)
    setShowResult(false)
    
    const questionTypes = ['letter', 'syllable', 'word']
    const type = questionTypes[Math.floor(Math.random() * questionTypes.length)]
    
    if (type === 'letter') {
      const correctLetter = TURKISH_ALPHABET[Math.floor(Math.random() * TURKISH_ALPHABET.length)]
      const wrongOptions = TURKISH_ALPHABET
        .filter(l => l.letter !== correctLetter.letter)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
      
      const options = [...wrongOptions, correctLetter].sort(() => Math.random() - 0.5)
      
      setQuizQuestion({
        type: 'letter',
        question: `"${correctLetter.word}" kelimesinde hangi harf var?`,
        hint: correctLetter.emoji,
        correctAnswer: correctLetter.letter,
        options: options.map(o => o.letter),
        speakText: correctLetter.word
      })
    } else if (type === 'syllable') {
      const correctSyllable = SYLLABLES[Math.floor(Math.random() * SYLLABLES.length)]
      const wrongOptions = SYLLABLES
        .filter(s => s.syllable !== correctSyllable.syllable)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
      
      const options = [...wrongOptions, correctSyllable].sort(() => Math.random() - 0.5)
      
      setQuizQuestion({
        type: 'syllable',
        question: `Hangi hece "${correctSyllable.words[0]}" kelimesinin başında var?`,
        correctAnswer: correctSyllable.syllable,
        options: options.map(o => o.syllable),
        speakText: correctSyllable.words[0]
      })
    } else {
      const correctWord = SIMPLE_WORDS[Math.floor(Math.random() * SIMPLE_WORDS.length)]
      const wrongOptions = SIMPLE_WORDS
        .filter(w => w.word !== correctWord.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
      
      const options = [...wrongOptions, correctWord].sort(() => Math.random() - 0.5)
      
      setQuizQuestion({
        type: 'word',
        question: `Bu emoji ${correctWord.emoji} hangi kelimeyi gösteriyor?`,
        correctAnswer: correctWord.word,
        options: options.map(o => o.word),
        speakText: correctWord.word
      })
    }
    
    setLoading(false)
  }

  const handleQuizAnswer = (answer: string) => {
    if (showResult) return
    
    setSelectedAnswer(answer)
    setShowResult(true)
    setQuizTotal(prev => prev + 1)
    
    if (answer === quizQuestion.correctAnswer) {
      setQuizScore(prev => prev + 1)
      triggerConfetti()
    }
  }

  const handleLetterClick = (letter: string) => {
    speakLetter(letter)
  }

  const handleSyllableClick = (syllable: string) => {
    speakSyllable(syllable)
  }

  const handleWordClick = (word: string) => {
    speakWord(word)
  }

  useEffect(() => {
    if (mode === 'quiz' && !quizQuestion) {
      generateQuizQuestion()
    }
  }, [mode])

  const currentLetter = TURKISH_ALPHABET[currentIndex]
  const currentSyllable = SYLLABLES[currentIndex % SYLLABLES.length]
  const currentWord = SIMPLE_WORDS[currentIndex % SIMPLE_WORDS.length]

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                Harf & Hece Öğrenme
              </h1>
              <p className="text-gray-600">
                Harfleri ve heceleri eğlenerek öğren! 🎉
              </p>
            </div>
          </div>
        </motion.div>

        {/* Mode Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'letters', label: '🔤 Harfler', color: 'pink' },
            { id: 'syllables', label: '📝 Heceler', color: 'purple' },
            { id: 'words', label: '📚 Kelimeler', color: 'blue' },
            { id: 'quiz', label: '🎯 Quiz', color: 'green' },
          ].map(({ id, label, color }) => (
            <button
              key={id}
              onClick={() => {
                setMode(id as Mode)
                setCurrentIndex(0)
                if (id === 'quiz') {
                  setQuizScore(0)
                  setQuizTotal(0)
                  setQuizQuestion(null)
                }
              }}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                mode === id
                  ? `bg-${color}-500 text-white shadow-lg`
                  : `bg-${color}-100 text-${color}-700 hover:bg-${color}-200`
              }`}
              style={{
                backgroundColor: mode === id 
                  ? color === 'pink' ? '#ec4899' : color === 'purple' ? '#8b5cf6' : color === 'blue' ? '#3b82f6' : '#22c55e'
                  : undefined
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {!supported && (
          <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-xl">
            ⚠️ Tarayıcınız ses özelliğini desteklemiyor. Lütfen Chrome veya Safari kullanın.
          </div>
        )}

        {/* Letters Mode */}
        {mode === 'letters' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            {/* Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="p-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-full transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <span className="text-gray-500">
                {currentIndex + 1} / {TURKISH_ALPHABET.length}
              </span>
              
              <button
                onClick={() => setCurrentIndex(Math.min(TURKISH_ALPHABET.length - 1, currentIndex + 1))}
                disabled={currentIndex === TURKISH_ALPHABET.length - 1}
                className="p-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-full transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Letter Card */}
            <div className="text-center">
              <motion.button
                key={currentLetter.letter}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleLetterClick(currentLetter.letter)}
                className="relative w-48 h-48 mx-auto bg-gradient-to-br from-pink-400 to-orange-400 rounded-3xl shadow-2xl flex items-center justify-center mb-6 cursor-pointer"
              >
                <span className="text-9xl font-bold text-white drop-shadow-lg">
                  {currentLetter.letter}
                </span>
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <Volume2 className={`w-6 h-6 text-pink-500 ${speaking ? 'animate-pulse' : ''}`} />
                </div>
              </motion.button>

              <div className="text-6xl mb-4">{currentLetter.emoji}</div>
              
              <button
                onClick={() => handleWordClick(currentLetter.word)}
                className="text-3xl font-bold text-gray-800 hover:text-pink-600 transition-colors cursor-pointer"
              >
                {currentLetter.word}
                <Volume2 className="inline-block w-6 h-6 ml-2 text-pink-500" />
              </button>
            </div>

            {/* Letter Grid */}
            <div className="mt-8 grid grid-cols-10 gap-2">
              {TURKISH_ALPHABET.map((item, i) => (
                <button
                  key={item.letter}
                  onClick={() => {
                    setCurrentIndex(i)
                    handleLetterClick(item.letter)
                  }}
                  className={`w-10 h-10 rounded-lg font-bold transition-all ${
                    i === currentIndex
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 hover:bg-pink-100 text-gray-700'
                  }`}
                >
                  {item.letter}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Syllables Mode */}
        {mode === 'syllables' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="text-center mb-8">
              <motion.button
                key={currentSyllable.syllable}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSyllableClick(currentSyllable.syllable)}
                className="relative w-40 h-40 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl shadow-2xl flex items-center justify-center mb-6 cursor-pointer"
              >
                <span className="text-6xl font-bold text-white">
                  {currentSyllable.syllable}
                </span>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <Volume2 className={`w-5 h-5 text-purple-500 ${speaking ? 'animate-pulse' : ''}`} />
                </div>
              </motion.button>

              <p className="text-gray-600 mb-4">Bu hece ile başlayan kelimeler:</p>
              
              <div className="flex flex-wrap justify-center gap-3">
                {currentSyllable.words.map(word => (
                  <button
                    key={word}
                    onClick={() => handleWordClick(word)}
                    className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-medium transition-all flex items-center gap-2"
                  >
                    {word}
                    <Volume2 className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Syllable Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
              {SYLLABLES.map((item, i) => (
                <button
                  key={item.syllable}
                  onClick={() => {
                    setCurrentIndex(i)
                    handleSyllableClick(item.syllable)
                  }}
                  className={`p-2 rounded-lg font-medium text-sm transition-all ${
                    i === currentIndex % SYLLABLES.length
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 hover:bg-purple-100 text-gray-700'
                  }`}
                >
                  {item.syllable}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Words Mode */}
        {mode === 'words' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            {/* Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="p-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-full transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <span className="text-gray-500">
                {currentIndex + 1} / {SIMPLE_WORDS.length}
              </span>
              
              <button
                onClick={() => setCurrentIndex(Math.min(SIMPLE_WORDS.length - 1, currentIndex + 1))}
                disabled={currentIndex === SIMPLE_WORDS.length - 1}
                className="p-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-full transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Word Card */}
            <div className="text-center">
              <div className="text-8xl mb-6">{currentWord.emoji}</div>
              
              <motion.button
                key={currentWord.word}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleWordClick(currentWord.word)}
                className="relative inline-block px-8 py-4 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl shadow-2xl cursor-pointer"
              >
                <span className="text-4xl font-bold text-white">
                  {currentWord.word}
                </span>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <Volume2 className={`w-5 h-5 text-blue-500 ${speaking ? 'animate-pulse' : ''}`} />
                </div>
              </motion.button>

              {/* Spell out */}
              <div className="mt-6 flex justify-center gap-2">
                {currentWord.word.split('').map((char, i) => (
                  <button
                    key={i}
                    onClick={() => handleLetterClick(char)}
                    className="w-12 h-12 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-bold text-xl transition-all"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </div>

            {/* Word Grid */}
            <div className="mt-8 grid grid-cols-4 sm:grid-cols-6 gap-2">
              {SIMPLE_WORDS.map((item, i) => (
                <button
                  key={item.word}
                  onClick={() => {
                    setCurrentIndex(i)
                    handleWordClick(item.word)
                  }}
                  className={`p-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-1 ${
                    i === currentIndex % SIMPLE_WORDS.length
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-blue-100 text-gray-700'
                  }`}
                >
                  <span>{item.emoji}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quiz Mode */}
        {mode === 'quiz' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            {/* Score */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-green-600">
                <Trophy className="w-6 h-6" />
                <span className="text-xl font-bold">{quizScore} / {quizTotal}</span>
              </div>
              <button
                onClick={() => {
                  setQuizScore(0)
                  setQuizTotal(0)
                  generateQuizQuestion()
                }}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">Soru hazırlanıyor...</p>
              </div>
            ) : quizQuestion && (
              <>
                {/* Question */}
                <div className="text-center mb-8">
                  {quizQuestion.hint && (
                    <div className="text-6xl mb-4">{quizQuestion.hint}</div>
                  )}
                  
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <p className="text-xl font-medium text-gray-800">
                      {quizQuestion.question}
                    </p>
                    <button
                      onClick={() => {
                        if (quizQuestion.type === 'letter') {
                          handleWordClick(quizQuestion.speakText)
                        } else {
                          handleWordClick(quizQuestion.speakText)
                        }
                      }}
                      className="p-2 bg-green-100 hover:bg-green-200 rounded-full transition-all"
                    >
                      <Volume2 className={`w-5 h-5 text-green-600 ${speaking ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {quizQuestion.options.map((option: string) => {
                    const isCorrect = option === quizQuestion.correctAnswer
                    const isSelected = option === selectedAnswer
                    
                    let bgColor = 'bg-gray-100 hover:bg-gray-200'
                    if (showResult) {
                      if (isCorrect) bgColor = 'bg-green-500 text-white'
                      else if (isSelected) bgColor = 'bg-red-500 text-white'
                    } else if (isSelected) {
                      bgColor = 'bg-green-200'
                    }
                    
                    return (
                      <button
                        key={option}
                        onClick={() => handleQuizAnswer(option)}
                        disabled={showResult}
                        className={`p-6 rounded-xl font-bold text-2xl transition-all ${bgColor} ${
                          showResult ? 'cursor-default' : 'cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {option}
                          {showResult && isCorrect && <Check className="w-6 h-6" />}
                          {showResult && isSelected && !isCorrect && <X className="w-6 h-6" />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Next Button */}
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <p className={`text-xl font-bold mb-4 ${
                      selectedAnswer === quizQuestion.correctAnswer ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedAnswer === quizQuestion.correctAnswer 
                        ? '🎉 Tebrikler! Doğru cevap!' 
                        : `😔 Yanlış! Doğru cevap: ${quizQuestion.correctAnswer}`
                      }
                    </p>
                    <button
                      onClick={generateQuizQuestion}
                      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all flex items-center gap-2 mx-auto"
                    >
                      <ChevronRight className="w-5 h-5" />
                      Sonraki Soru
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
}

