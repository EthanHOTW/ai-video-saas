'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PageTransition from '@/components/PageTransition'
import TemplateGallery from '@/components/TemplateGallery'
import type { Profile, Template } from '@/lib/types'

type Scene = {
  scene: number
  visual_zh: string
  visual_prompt: string
}
type Script = {
  title: string
  hook: string
  narration: string
  scenes: Scene[]
}

const THEME_OPTIONS = [
  { value: 'life', label: '生活故事 — 日常小故事、有溫度的敘事' },
  { value: 'knowledge', label: '知識科普 — 冷知識、趣味事實' },
  { value: 'marketing', label: '商業行銷 — 產品介紹、促銷短片' },
  { value: 'comedy', label: '搞笑娛樂 — 反差梗、無厘頭' },
  { value: 'inspiring', label: '情感勵志 — 人生感悟、正能量' },
  { value: 'thriller', label: '驚悚懸疑 — 都市傳說、懸疑反轉' },
  { value: 'kids', label: '兒童故事 — 童話口吻、溫馨結局' },
]
const STYLE_OPTIONS = [
  { value: 'cinematic', label: '寫實電影感' },
  { value: 'anime', label: '日系動漫' },
  { value: '3d_cartoon', label: '3D 卡通' },
  { value: 'watercolor', label: '水彩插畫' },
  { value: 'cyberpunk', label: '賽博龐克' },
  { value: 'vintage_film', label: '復古膠片' },
  { value: 'minimal_line', label: '極簡線條' },
  { value: 'fantasy', label: '夢幻奇幻' },
]
const VOICE_OPTIONS = [
  { value: 'rachel', label: '女聲 — 溫柔 (Rachel)' },
  { value: 'bella', label: '女聲 — 活潑 (Bella)' },
  { value: 'adam', label: '男聲 — 穩重 (Adam)' },
  { value: 'josh', label: '男聲 — 年輕 (Josh)' },
  { value: 'antoni', label: '旁白 — 新聞播報 (Antoni)' },
]
const BGM_OPTIONS = [
  { value: 'none', label: '無背景音樂' },
  { value: 'upbeat', label: '輕鬆愉快' },
  { value: 'warm', label: '情感溫馨' },
  { value: 'epic', label: '熱血激昂' },
  { value: 'mysterious', label: '神祕懸疑' },
  { value: 'lofi', label: 'Lo-Fi 放鬆' },
]

export default function GeneratePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<{ email: string; display_name: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [topic, setTopic] = useState('')
  const [theme, setTheme] = useState('life')
  const [style, setStyle] = useState('cinematic')
  const [voice, setVoice] = useState('rachel')
  const [bgmMood, setBgmMood] = useState('upbeat')

  // Flow state: 'form' → 'preview' → (confirm) → redirect
  const [stage, setStage] = useState<'form' | 'preview'>('form')
  const [previewing, setPreviewing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [script, setScript] = useState<Script | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) { router.push('/auth'); return }
        setUser({
          email: authUser.email || '',
          display_name: authUser.user_metadata?.display_name || authUser.email || 'User',
        })
        const { data: profileData, error: profileError } = await supabase
          .from('profiles').select('*').eq('id', authUser.id).single()
        if (profileError || !profileData) { setError('無法載入個人資料'); return }
        setProfile(profileData)
      } catch (err) {
        console.error(err); setError('載入個人資料時發生錯誤')
      } finally { setLoading(false) }
    }
    fetchUserData()
  }, [router, supabase])

  // Stage 1 → 2: call preview API
  const handlePreview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!topic.trim()) { setError('請輸入主題'); return }
    if (!profile || !user) { setError('無法載入個人資料'); return }
    if (profile.credits_remaining <= 0) { setError('點數已用完，請升級方案。'); return }

    try {
      setPreviewing(true); setError(null)
      const r = await fetch('/api/generate/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), theme, style }),
      })
      const j = await r.json()
      if (!r.ok || !j.success) { setError(j.error || '產生劇本失敗'); return }
      setScript(j.script)
      setStage('preview')
    } catch (err) {
      console.error(err); setError('產生劇本時發生錯誤')
    } finally { setPreviewing(false) }
  }

  // Regenerate script (same topic, different variation)
  const handleRegenerate = async () => {
    if (!topic.trim()) return
    try {
      setPreviewing(true); setError(null)
      const r = await fetch('/api/generate/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), theme, style }),
      })
      const j = await r.json()
      if (!r.ok || !j.success) { setError(j.error || '重新產生失敗'); return }
      setScript(j.script)
    } catch (err) {
      console.error(err); setError('重新產生劇本時發生錯誤')
    } finally { setPreviewing(false) }
  }

  // Stage 2: confirm & kick off full generation
  const handleConfirm = async () => {
    if (!script || !profile || !user) return
    try {
      setSubmitting(true); setError(null)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setError('未登入'); return }

      const { data: videoData, error: videoError } = await supabase
        .from('videos').insert({
          user_id: authUser.id,
          topic: topic.trim(),
          theme, style, voice,
          bgm_mood: bgmMood,
          script,
          status: 'pending',
        }).select().single()
      if (videoError || !videoData) { setError('建立影片失敗'); return }

      await supabase.from('profiles')
        .update({ credits_remaining: profile.credits_remaining - 1 })
        .eq('id', authUser.id)

      // Record usage log entry (non-blocking)
      supabase.from('usage_log').insert({
        user_id: authUser.id,
        event_type: 'video_generated',
        credits_delta: -1,
        video_id: videoData.id,
        metadata: { topic: topic.trim(), theme, style, voice, bgm_mood: bgmMood },
      }).then(({ error: logErr }) => {
        if (logErr) console.error('usage_log insert failed:', logErr)
      })

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          videoId: videoData.id,
          theme, style, voice, bgm_mood: bgmMood,
          script,
        }),
      })
      if (!response.ok) console.error('API error:', response.statusText)
      router.push(`/video/${videoData.id}`)
    } catch (err) {
      console.error(err); setError('發生錯誤，請重試。')
    } finally { setSubmitting(false) }
  }

  const handleBack = () => { setStage('form'); setScript(null); setError(null) }

  const applyTemplate = (t: Template) => {
    setTopic(t.topic)
    setTheme(t.theme)
    setStyle(t.style)
    setVoice(t.voice)
    setBgmMood(t.bgm_mood)
    setError(null)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-sand-50 dark:bg-sand-950">
        <Navbar />
        <main className="flex-1 w-full pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <p className="text-sand-500 dark:text-sand-400">載入中...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-sand-50 dark:bg-sand-950">
      <Navbar user={user} />
      <PageTransition>
        <main className="flex-1 w-full pt-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link href="/dashboard" className="inline-flex items-center text-sand-500 dark:text-sand-400 hover:text-sand-700 dark:hover:text-sand-200 transition-colors mb-8">
              <span className="mr-2">←</span>返回儀表板
            </Link>

            <div className="mb-8">
              <h1 className="text-4xl font-bold text-sand-900 dark:text-sand-50 mb-2">
                {stage === 'form' ? '建立新影片' : '劇本預覽'}
              </h1>
              <p className="text-sand-500 dark:text-sand-400">
                {stage === 'form'
                  ? '填寫資訊，AI 會先產生劇本與分鏡讓你檢查'
                  : '確認劇本與分鏡無誤後，再產生影片（產影片需 6-10 分鐘）'}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center mb-8">
              <div className={`flex items-center ${stage === 'form' ? 'text-accent' : 'text-sand-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${stage === 'form' ? 'border-accent bg-accent text-white' : 'border-sand-300 dark:border-sand-600'}`}>1</div>
                <span className="ml-2 font-medium">填寫主題</span>
              </div>
              <div className="flex-1 h-0.5 bg-sand-300 dark:bg-sand-600 mx-4" />
              <div className={`flex items-center ${stage === 'preview' ? 'text-accent' : 'text-sand-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${stage === 'preview' ? 'border-accent bg-accent text-white' : 'border-sand-300 dark:border-sand-600'}`}>2</div>
                <span className="ml-2 font-medium">預覽劇本</span>
              </div>
              <div className="flex-1 h-0.5 bg-sand-300 dark:bg-sand-600 mx-4" />
              <div className="flex items-center text-sand-500">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-sand-300 dark:border-sand-600">3</div>
                <span className="ml-2 font-medium">產生影片</span>
              </div>
            </div>

            {profile && profile.credits_remaining <= 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-red-400 mb-2">點數已用完</h3>
                <p className="text-red-300 mb-4">本月點數已全部用完，請升級方案繼續建立影片。</p>
                <Link href="/pricing" className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">查看方案價格</Link>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {profile && profile.credits_remaining > 0 && stage === 'form' && (
              <TemplateGallery onApply={applyTemplate} />
            )}

            {profile && profile.credits_remaining > 0 && stage === 'form' && (
              <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-8">
                <form onSubmit={handlePreview}>
                  <div className="mb-6">
                    <label htmlFor="topic" className="block text-sm font-semibold text-sand-900 dark:text-sand-50 mb-3">影片主題</label>
                    <textarea id="topic" placeholder="例如：有個人在咖啡廳打翻咖啡，遇到一位神秘陌生人" value={topic} onChange={(e) => setTopic(e.target.value)} disabled={previewing} rows={3}
                      className="w-full px-4 py-3 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-600 rounded-lg text-sand-900 dark:text-sand-50 placeholder-sand-400 dark:placeholder-sand-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50 resize-none" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label htmlFor="theme" className="block text-sm font-semibold text-sand-900 dark:text-sand-50 mb-2">故事主題</label>
                      <select id="theme" value={theme} onChange={(e) => setTheme(e.target.value)} disabled={previewing}
                        className="w-full px-4 py-3 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-600 rounded-lg text-sand-900 dark:text-sand-50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50">
                        {THEME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="style" className="block text-sm font-semibold text-sand-900 dark:text-sand-50 mb-2">視頻風格</label>
                      <select id="style" value={style} onChange={(e) => setStyle(e.target.value)} disabled={previewing}
                        className="w-full px-4 py-3 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-600 rounded-lg text-sand-900 dark:text-sand-50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50">
                        {STYLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="voice" className="block text-sm font-semibold text-sand-900 dark:text-sand-50 mb-2">視頻音色</label>
                      <select id="voice" value={voice} onChange={(e) => setVoice(e.target.value)} disabled={previewing}
                        className="w-full px-4 py-3 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-600 rounded-lg text-sand-900 dark:text-sand-50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50">
                        {VOICE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        <option value="clone" disabled>🔒 我的克隆音色（Phase 2 即將推出）</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="bgm" className="block text-sm font-semibold text-sand-900 dark:text-sand-50 mb-2">背景音樂</label>
                      <select id="bgm" value={bgmMood} onChange={(e) => setBgmMood(e.target.value)} disabled={previewing}
                        className="w-full px-4 py-3 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-600 rounded-lg text-sand-900 dark:text-sand-50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50">
                        {BGM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-sand-300 dark:border-sand-700">
                    <p className="text-sand-500 dark:text-sand-400 text-sm">
                      剩餘點數：<span className="text-sand-900 dark:text-sand-50 font-semibold">{profile.credits_remaining}</span>
                    </p>
                    <button type="submit" disabled={previewing || !topic.trim()}
                      className="flex items-center space-x-2 px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                      {previewing && <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                      <span>{previewing ? '產生劇本中...' : '產生劇本預覽'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {stage === 'preview' && script && (
              <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-8">
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-sand-500 dark:text-sand-400 mb-1">標題</h2>
                  <p className="text-2xl font-bold text-sand-900 dark:text-sand-50">{script.title}</p>
                </div>

                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-sand-500 dark:text-sand-400 mb-1">前 3 秒鉤子</h2>
                  <p className="text-lg text-sand-900 dark:text-sand-50">{script.hook}</p>
                </div>

                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-sand-500 dark:text-sand-400 mb-1">旁白</h2>
                  <p className="text-sand-900 dark:text-sand-50 leading-relaxed whitespace-pre-wrap">{script.narration}</p>
                </div>

                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-sand-500 dark:text-sand-400 mb-3">分鏡（{script.scenes.length} 段 × 5 秒 = {script.scenes.length * 5} 秒）</h2>
                  <div className="space-y-3">
                    {script.scenes.map((s) => (
                      <div key={s.scene} className="bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-700 rounded-lg p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/20 text-accent font-bold flex items-center justify-center mr-4">{s.scene}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sand-900 dark:text-sand-50 mb-1">{s.visual_zh}</p>
                            <p className="text-xs text-sand-500 dark:text-sand-400 font-mono break-words">{s.visual_prompt}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-sand-300 dark:border-sand-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button type="button" onClick={handleBack} disabled={submitting || previewing}
                    className="px-4 py-3 bg-sand-200 dark:bg-sand-800 hover:bg-sand-300 dark:hover:bg-sand-700 text-sand-900 dark:text-sand-50 rounded-lg transition-colors disabled:opacity-50">
                    ← 回上一步改設定
                  </button>
                  <div className="flex gap-3">
                    <button type="button" onClick={handleRegenerate} disabled={submitting || previewing}
                      className="flex items-center space-x-2 px-4 py-3 bg-sand-200 dark:bg-sand-800 hover:bg-sand-300 dark:hover:bg-sand-700 text-sand-900 dark:text-sand-50 rounded-lg transition-colors disabled:opacity-50">
                      {previewing && <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>}
                      <span>{previewing ? '重新產生中...' : '🔄 重新產生劇本'}</span>
                    </button>
                    <button type="button" onClick={handleConfirm} disabled={submitting || previewing}
                      className="flex items-center space-x-2 px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting && <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                      <span>{submitting ? '送出中...' : '✓ 確認產生影片'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </PageTransition>
      <Footer />
    </div>
  )
}
