'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Shield, AlertTriangle, Ban, Eye, RefreshCw, 
  Activity, Globe, Clock, UserX, Check, X,
  TrendingUp, Filter, Search, Download
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SuspiciousIP {
  ip_address: string
  total_requests: number
  blocked_requests: number
  avg_risk_score: number
  max_risk_score: number
  first_seen: string
  last_seen: string
  is_currently_blocked: boolean
}

interface BlockedIP {
  id: string
  ip_address: string
  reason: string
  blocked_at: string
  expires_at: string | null
  is_active: boolean
}

interface HoneypotTrigger {
  id: string
  ip_address: string
  user_agent: string
  trap_type: string
  trap_path: string
  created_at: string
}

interface SecurityStats {
  totalRequests24h: number
  blockedRequests24h: number
  suspiciousIPs: number
  honeypotTriggers: number
  activeBlocks: number
}

export default function SecurityPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SecurityStats>({
    totalRequests24h: 0,
    blockedRequests24h: 0,
    suspiciousIPs: 0,
    honeypotTriggers: 0,
    activeBlocks: 0
  })
  const [suspiciousIPs, setSuspiciousIPs] = useState<SuspiciousIP[]>([])
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([])
  const [honeypotTriggers, setHoneypotTriggers] = useState<HoneypotTrigger[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'suspicious' | 'blocked' | 'honeypot'>('overview')
  const [blockingIP, setBlockingIP] = useState<string | null>(null)
  const [blockDuration, setBlockDuration] = useState<number>(24)
  const [blockReason, setBlockReason] = useState('')
  
  const supabase = createClient()

  const loadData = async () => {
    setLoading(true)
    try {
      // Şüpheli IP'leri yükle
      const { data: suspicious } = await supabase.rpc('get_suspicious_ips', { p_hours: 24 })
      if (suspicious) setSuspiciousIPs(suspicious)

      // Engelli IP'leri yükle
      const { data: blocked } = await supabase
        .from('blocked_ips')
        .select('*')
        .eq('is_active', true)
        .order('blocked_at', { ascending: false })
      if (blocked) setBlockedIPs(blocked)

      // Honeypot tetiklemelerini yükle
      const { data: honeypot } = await supabase
        .from('honeypot_triggers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (honeypot) setHoneypotTriggers(honeypot)

      // İstatistikleri hesapla
      const { count: totalLogs } = await supabase
        .from('security_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      
      const { count: blockedLogs } = await supabase
        .from('security_logs')
        .select('*', { count: 'exact', head: true })
        .eq('is_blocked', true)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const { count: honeypotCount } = await supabase
        .from('honeypot_triggers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      setStats({
        totalRequests24h: totalLogs || 0,
        blockedRequests24h: blockedLogs || 0,
        suspiciousIPs: suspicious?.length || 0,
        honeypotTriggers: honeypotCount || 0,
        activeBlocks: blocked?.length || 0
      })
    } catch (error) {
      console.error('Güvenlik verileri yüklenemedi:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // Her 30 saniyede yenile
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleBlockIP = async (ip: string) => {
    if (!blockReason.trim()) {
      alert('Engel sebebi giriniz')
      return
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase.rpc('block_ip', {
        p_ip_address: ip,
        p_reason: blockReason,
        p_admin_id: user?.id,
        p_duration_hours: blockDuration
      })
      
      setBlockingIP(null)
      setBlockReason('')
      loadData()
    } catch (error) {
      console.error('IP engellenemedi:', error)
    }
  }

  const handleUnblockIP = async (ip: string) => {
    try {
      await supabase.rpc('unblock_ip', { p_ip_address: ip })
      loadData()
    } catch (error) {
      console.error('Engel kaldırılamadı:', error)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-100'
    if (score >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-yellow-600 bg-yellow-100'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <Shield className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Güvenlik Merkezi
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Anti-scraping ve bot koruma sistemi
              </p>
            </div>
          </div>
          
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalRequests24h.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Toplam İstek (24s)
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {stats.blockedRequests24h.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Engellenen (24s)
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.suspiciousIPs}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Şüpheli IP
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.honeypotTriggers}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Honeypot (24s)
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <UserX className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeBlocks}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Aktif Engel
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Genel Bakış', icon: TrendingUp },
            { id: 'suspicious', label: 'Şüpheli IP\'ler', icon: AlertTriangle },
            { id: 'blocked', label: 'Engelli IP\'ler', icon: Ban },
            { id: 'honeypot', label: 'Honeypot Logları', icon: Eye },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {/* Şüpheli IP'ler */}
          {activeTab === 'suspicious' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">IP Adresi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">İstek</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Engellenen</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Risk</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Son Görülme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {suspiciousIPs.map((ip, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{ip.ip_address}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{ip.total_requests.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-red-600">{ip.blocked_requests.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(ip.max_risk_score)}`}>
                          {ip.max_risk_score}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(ip.last_seen)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ip.is_currently_blocked ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Engelli</span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">İzleniyor</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!ip.is_currently_blocked && (
                          <button
                            onClick={() => setBlockingIP(ip.ip_address)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Engelle
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {suspiciousIPs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Şüpheli aktivite tespit edilmedi</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Engelli IP'ler */}
          {activeTab === 'blocked' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">IP Adresi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sebep</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Engellenme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Bitiş</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {blockedIPs.map(ip => (
                    <tr key={ip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{ip.ip_address}</td>
                      <td className="px-6 py-4 text-sm max-w-xs truncate">{ip.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(ip.blocked_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {ip.expires_at ? formatDate(ip.expires_at) : <span className="text-red-600">Kalıcı</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleUnblockIP(ip.ip_address)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          Engeli Kaldır
                        </button>
                      </td>
                    </tr>
                  ))}
                  {blockedIPs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <Check className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                        <p>Aktif IP engeli yok</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Honeypot Logları */}
          {activeTab === 'honeypot' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">IP Adresi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tuzak Tipi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Path</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tarih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {honeypotTriggers.map(trigger => (
                    <tr key={trigger.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{trigger.ip_address}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {trigger.trap_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{trigger.trap_path}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{trigger.user_agent}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(trigger.created_at)}</td>
                    </tr>
                  ))}
                  {honeypotTriggers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Honeypot tetiklemesi yok</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Genel Bakış */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Koruma Durumu */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Koruma Durumu
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Bot User-Agent Engeli</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Aktif</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Rate Limiting</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Aktif</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Honeypot Tuzakları</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Aktif</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Headless Browser Tespiti</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Aktif</span>
                    </div>
                  </div>
                </div>

                {/* Son Aktivite */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Özet (Son 24 Saat)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Toplam API İsteği</span>
                      <span className="font-mono font-bold">{stats.totalRequests24h.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Engellenen İstek</span>
                      <span className="font-mono font-bold text-red-600">{stats.blockedRequests24h.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Engel Oranı</span>
                      <span className="font-mono font-bold">
                        {stats.totalRequests24h > 0 
                          ? ((stats.blockedRequests24h / stats.totalRequests24h) * 100).toFixed(1) 
                          : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Bot Tespiti</span>
                      <span className="font-mono font-bold text-purple-600">{stats.honeypotTriggers}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bilgilendirme */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                  🛡️ Anti-Scraping Koruma Sistemi
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Bu sistem web kazıma (scraping) ve bot saldırılarına karşı koruma sağlar. 
                  Şüpheli aktiviteler otomatik tespit edilir ve engellenir. Honeypot tuzakları 
                  sayesinde botlar erken aşamada yakalanır.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* IP Engelleme Modal */}
        <AnimatePresence>
          {blockingIP && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setBlockingIP(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">IP Engelle</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{blockingIP}</span> adresini engellemek üzeresiniz.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Engel Sebebi</label>
                    <input
                      type="text"
                      value={blockReason}
                      onChange={e => setBlockReason(e.target.value)}
                      placeholder="örn: Bot aktivitesi tespit edildi"
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Engel Süresi</label>
                    <select
                      value={blockDuration}
                      onChange={e => setBlockDuration(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value={1}>1 Saat</option>
                      <option value={6}>6 Saat</option>
                      <option value={24}>24 Saat</option>
                      <option value={72}>3 Gün</option>
                      <option value={168}>1 Hafta</option>
                      <option value={720}>30 Gün</option>
                      <option value={0}>Kalıcı</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setBlockingIP(null)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    İptal
                  </button>
                  <button
                    onClick={() => handleBlockIP(blockingIP)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Engelle
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
