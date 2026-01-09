'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import {
  Bot,
  Plus,
  Trash2,
  Download,
  QrCode,
  Image as ImageIcon,
  Upload,
  Trophy,
  X,
  Check,
  Loader2,
  FileDown,
  Eye,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface Robot {
  id: string
  robot_number: number
  image_url: string | null
  qr_code: string
  created_at: string
  evaluation_count?: number
}

const SITE_URL = 'https://sakirkocak.com'

export default function RobotSenligiPage() {
  const [robots, setRobots] = useState<Robot[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null)
  const [newRobotNumber, setNewRobotNumber] = useState('')
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadRobots()
  }, [])

  async function loadRobots() {
    setLoading(true)
    
    // Robotları ve değerlendirme sayılarını çek
    const { data: robotsData, error } = await supabase
      .from('robots')
      .select('*')
      .order('robot_number', { ascending: true })

    if (error) {
      console.error('❌ Robotlar yüklenirken hata:', error)
      setLoading(false)
      return
    }

    // Her robot için değerlendirme sayısını çek
    const robotsWithCounts = await Promise.all(
      (robotsData || []).map(async (robot) => {
        const { count } = await supabase
          .from('robot_evaluations')
          .select('id', { count: 'exact', head: true })
          .eq('robot_id', robot.id)
        
        return { ...robot, evaluation_count: count || 0 }
      })
    )

    setRobots(robotsWithCounts)
    setLoading(false)
  }

  async function addRobot() {
    const number = parseInt(newRobotNumber)
    if (isNaN(number) || number < 1) {
      alert('Geçerli bir robot numarası girin')
      return
    }

    // Numara kontrolü
    if (robots.some(r => r.robot_number === number)) {
      alert('Bu numara zaten kullanılıyor!')
      return
    }

    const { data, error } = await supabase
      .from('robots')
      .insert({ robot_number: number })
      .select()
      .single()

    if (error) {
      console.error('❌ Robot eklenirken hata:', error)
      alert('Robot eklenirken hata oluştu')
      return
    }

    setRobots([...robots, { ...data, evaluation_count: 0 }].sort((a, b) => a.robot_number - b.robot_number))
    setNewRobotNumber('')
    setShowAddModal(false)
  }

  async function addMultipleRobots(start: number, end: number) {
    const existingNumbers = robots.map(r => r.robot_number)
    const newRobots = []
    
    for (let i = start; i <= end; i++) {
      if (!existingNumbers.includes(i)) {
        newRobots.push({ robot_number: i })
      }
    }

    if (newRobots.length === 0) {
      alert('Eklenecek yeni robot yok, tüm numaralar zaten mevcut.')
      return
    }

    const { data, error } = await supabase
      .from('robots')
      .insert(newRobots)
      .select()

    if (error) {
      console.error('❌ Robotlar eklenirken hata:', error)
      alert('Robotlar eklenirken hata oluştu')
      return
    }

    await loadRobots()
    setShowAddModal(false)
    alert(`${data.length} robot başarıyla eklendi!`)
  }

  async function deleteRobot(id: string) {
    if (!confirm('Bu robotu silmek istediğinize emin misiniz? Tüm değerlendirmeler de silinecek!')) return

    const { error } = await supabase
      .from('robots')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Robot silinirken hata:', error)
      alert('Robot silinirken hata oluştu')
      return
    }

    setRobots(robots.filter(r => r.id !== id))
    setSelectedRobot(null)
  }

  async function deleteAllRobots() {
    if (!confirm(`Tüm ${robots.length} robotu silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz ve TÜM değerlendirmeler de silinecek!`)) return
    if (!confirm('GERÇEKTEN EMİN MİSİNİZ? Bu işlem geri alınamaz!')) return

    const { error } = await supabase
      .from('robots')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Tümünü sil

    if (error) {
      console.error('❌ Robotlar silinirken hata:', error)
      alert('Robotlar silinirken hata oluştu')
      return
    }

    setRobots([])
    alert('Tüm robotlar silindi!')
  }

  async function uploadImage(robotId: string, file: File) {
    setUploading(true)
    
    const fileExt = file.name.split('.').pop()
    const fileName = `robot-${robotId}.${fileExt}`
    const filePath = `robots/${fileName}`

    // Supabase Storage'a yükle
    const { error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      console.error('❌ Resim yüklenirken hata:', uploadError)
      alert('Resim yüklenirken hata oluştu')
      setUploading(false)
      return
    }

    // Public URL al
    const { data: { publicUrl } } = supabase.storage
      .from('public')
      .getPublicUrl(filePath)

    // Robot'u güncelle
    const { error: updateError } = await supabase
      .from('robots')
      .update({ image_url: publicUrl })
      .eq('id', robotId)

    if (updateError) {
      console.error('❌ Robot güncellenirken hata:', updateError)
      setUploading(false)
      return
    }

    // State güncelle
    setRobots(robots.map(r => 
      r.id === robotId ? { ...r, image_url: publicUrl } : r
    ))
    if (selectedRobot?.id === robotId) {
      setSelectedRobot({ ...selectedRobot, image_url: publicUrl })
    }
    
    setUploading(false)
  }

  async function generateQRCodeDataURL(qrCode: string): Promise<string> {
    const url = `${SITE_URL}/degerlendirme/${qrCode}`
    return await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    })
  }

  async function downloadSingleQR(robot: Robot) {
    const dataUrl = await generateQRCodeDataURL(robot.qr_code)
    const link = document.createElement('a')
    link.download = `robot-${robot.robot_number}-qr.png`
    link.href = dataUrl
    link.click()
  }

  async function downloadAllQRCodes() {
    if (robots.length === 0) {
      alert('İndirilecek robot yok!')
      return
    }

    setDownloadingPDF(true)
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210
      const pageHeight = 297
      const qrSize = 30 // 3cm QR kod
      const margin = 10
      const cols = 5
      const rows = 8
      const gapX = (pageWidth - 2 * margin - cols * qrSize) / (cols - 1)
      const gapY = (pageHeight - 2 * margin - rows * (qrSize + 8)) / (rows - 1)

      let currentCol = 0
      let currentRow = 0

      for (let i = 0; i < robots.length; i++) {
        const robot = robots[i]
        
        if (currentRow >= rows) {
          pdf.addPage()
          currentCol = 0
          currentRow = 0
        }

        const x = margin + currentCol * (qrSize + gapX)
        const y = margin + currentRow * (qrSize + 8 + gapY)

        // QR kod oluştur
        const qrDataUrl = await generateQRCodeDataURL(robot.qr_code)
        
        // QR kodu ekle
        pdf.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize)
        
        // Robot numarasını ekle
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`#${robot.robot_number}`, x + qrSize / 2, y + qrSize + 5, { align: 'center' })

        currentCol++
        if (currentCol >= cols) {
          currentCol = 0
          currentRow++
        }
      }

      pdf.save('robot-senligi-qr-kodlar.pdf')
    } catch (error) {
      console.error('❌ PDF oluşturulurken hata:', error)
      alert('PDF oluşturulurken hata oluştu')
    }

    setDownloadingPDF(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Bot className="w-8 h-8" />
              Robot Şenliği Yönetimi
            </h1>
            <p className="text-cyan-100 mt-1">
              {robots.length} robot kayıtlı • QR kodları oluşturun ve değerlendirmeleri takip edin
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/robot-senligi/sonuclar"
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            >
              <Trophy className="w-5 h-5" />
              Sonuçlar
            </Link>
            <button
              onClick={downloadAllQRCodes}
              disabled={downloadingPDF || robots.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors disabled:opacity-50"
            >
              {downloadingPDF ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileDown className="w-5 h-5" />
              )}
              Tüm QR Kodları İndir
            </button>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Robot Ekle
        </button>
        <button
          onClick={() => addMultipleRobots(1, 80)}
          className="btn-secondary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          1-80 Arası Toplu Ekle
        </button>
        {robots.length > 0 && (
          <button
            onClick={deleteAllRobots}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Tümünü Sil ({robots.length})
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-primary-600">{robots.length}</div>
          <div className="text-sm text-surface-500">Toplam Robot</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-green-600">
            {robots.filter(r => r.image_url).length}
          </div>
          <div className="text-sm text-surface-500">Fotoğraflı</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {robots.reduce((sum, r) => sum + (r.evaluation_count || 0), 0)}
          </div>
          <div className="text-sm text-surface-500">Toplam Değerlendirme</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-amber-600">
            {robots.filter(r => (r.evaluation_count || 0) > 0).length}
          </div>
          <div className="text-sm text-surface-500">Değerlendirilmiş</div>
        </div>
      </div>

      {/* Robot Grid */}
      {robots.length === 0 ? (
        <div className="card p-12 text-center">
          <Bot className="w-16 h-16 mx-auto text-surface-300 mb-4" />
          <h3 className="text-lg font-medium text-surface-700">Henüz robot eklenmemiş</h3>
          <p className="text-surface-500 mt-1">İlk robotu eklemek için yukarıdaki butonu kullanın</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {robots.map((robot, index) => (
            <motion.div
              key={robot.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => setSelectedRobot(robot)}
              className={`card p-3 cursor-pointer hover:shadow-lg transition-all ${
                selectedRobot?.id === robot.id ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              {/* Robot Image or Placeholder */}
              <div className="aspect-square rounded-lg bg-surface-100 overflow-hidden mb-2">
                {robot.image_url ? (
                  <img
                    src={robot.image_url}
                    alt={`Robot ${robot.robot_number}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Bot className="w-8 h-8 text-surface-300" />
                  </div>
                )}
              </div>
              
              {/* Robot Number */}
              <div className="text-center">
                <div className="text-lg font-bold text-surface-900">#{robot.robot_number}</div>
                <div className="text-xs text-surface-500">
                  {robot.evaluation_count || 0} değerlendirme
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Robot Detail Modal */}
      <AnimatePresence>
        {selectedRobot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedRobot(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Robot #{selectedRobot.robot_number}</h2>
                <button
                  onClick={() => setSelectedRobot(null)}
                  className="p-2 hover:bg-surface-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Robot Image */}
              <div className="aspect-square rounded-xl bg-surface-100 overflow-hidden mb-4 relative">
                {selectedRobot.image_url ? (
                  <img
                    src={selectedRobot.image_url}
                    alt={`Robot ${selectedRobot.robot_number}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <Bot className="w-16 h-16 text-surface-300 mb-2" />
                    <span className="text-surface-400">Fotoğraf yüklenmemiş</span>
                  </div>
                )}
                
                {/* Upload Button */}
                <label className="absolute bottom-3 right-3 p-3 bg-white rounded-full shadow-lg cursor-pointer hover:bg-surface-50 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-primary-500" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadImage(selectedRobot.id, file)
                    }}
                  />
                </label>
              </div>

              {/* QR Code */}
              <div className="text-center mb-4">
                <QRCodeDisplay qrCode={selectedRobot.qr_code} />
                <p className="text-xs text-surface-500 mt-2">
                  Değerlendirme Linki: {SITE_URL}/degerlendirme/{selectedRobot.qr_code}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => downloadSingleQR(selectedRobot)}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  QR İndir
                </button>
                <Link
                  href={`/degerlendirme/${selectedRobot.qr_code}`}
                  target="_blank"
                  className="flex-1 btn-secondary flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Önizle
                </Link>
                <button
                  onClick={() => deleteRobot(selectedRobot.id)}
                  className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Stats */}
              <div className="mt-4 p-4 bg-surface-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-surface-600">Değerlendirme Sayısı</span>
                  <span className="font-bold text-surface-900">{selectedRobot.evaluation_count || 0}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Robot Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Yeni Robot Ekle</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">
                    Robot Numarası
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newRobotNumber}
                    onChange={(e) => setNewRobotNumber(e.target.value)}
                    placeholder="Örn: 1"
                    className="input w-full"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    İptal
                  </button>
                  <button
                    onClick={addRobot}
                    disabled={!newRobotNumber}
                    className="flex-1 btn-primary"
                  >
                    Ekle
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// QR Code Display Component
function QRCodeDisplay({ qrCode }: { qrCode: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const url = `${SITE_URL}/degerlendirme/${qrCode}`

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    }).then(setQrDataUrl)
  }, [url])

  if (!qrDataUrl) return <div className="w-48 h-48 bg-surface-100 animate-pulse rounded-lg mx-auto" />

  return (
    <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
  )
}
