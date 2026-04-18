'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PageTransition from '@/components/PageTransition'
import TemplateGallery from '@/components/TemplateGallery'
import type { Profile, Template, DurationTier } from '@/lib/types'
import { DURATION_TIER_CONFIG, getCreditsForTier } from '@/lib/types'

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
  { value: 'life', label: '生活故事', desc: '日常小故事、有溫度的敘事' },
  { value: 'knowledge', label: '知識科普', desc: '冷知識、趣味事實' },
  { value: 'marketing', label: '商業行銷', desc: '產品介紹、促銷短片' },
  { value: 'comedy', label: '搞笑娛樂', desc: '反差梗、無厘頭' },
  { value: 'inspiring', label: '情感勵志', desc: '人生感悟、正能量' },
  { value: 'thriller', label: '驚悚懸疑', desc: '都市傳說、懸疑反轉' },
  { value: 'kids', label: '兒童故事', desc: '童話口吻、溫馨結局' },
]
const STYLE_OPTIONS = [
  { value: 'cinematic', label: '寫實電影感' },
  { value: 'anime', label: '日系動漫' },
  { value: 'anime_us', label: '美式動漫' },
  { value: '3d_cartoon', label: '3D 卡通' },
  { value: 'watercolor', label: '水彩插畫' },
  { value: 'cyberpunk', label: '賽博龐克' },
  { value: 'vintage_film', label: '復古膠片' },
  { value: 'minimal_line', label: '極簡線條' },
  { value: 'fantasy', label: '夢幻奇幻' },
]
const SUBTITLE_STYLE_OPTIONS = [
  { value: 'tiktok', label: 'TikTok 風', desc: '黃字白邊、粗體、逐句' },
  { value: 'cinematic', label: '電影風', desc: '白字黑底、整段顯示' },
  { value: 'keyword', label: '動態關鍵字', desc: '關鍵字放大彈跳' },
  { value: 'none', label: '無字幕', desc: '只保留旁白' },
]
const DURATION_SEC_OPTIONS: Record<DurationTier, number[]> = {
  flash: [15, 20, 25, 30],
  standard: [30, 45, 60],
  premium: [60, 90, 120],
}
const RESOLUTION_OPTIONS = [
  { value: '720p', label: '720p (HD)', desc: '1280×720，標準畫質' },
  { value: '1080p', label: '1080p (Full HD)', desc: '1920×1080，高畫質' },
]
const VOICE_OPTIONS = [
  { value: 'rachel', label: '女聲 — 溫柔 (Rachel)' },
  { value: 'bella', label: '女聲 — 活潑 (Bella)' },
  { value: 'adam', label: '男聲 — 穩重 (Adam)' },
  { value: 'josh', label: '男聲 — 年輕 (Josh)' },
  { value: 'antoni', label: '旁白 — 新聞播報 (Antoni)' },
]
const BGM_OPTIONS = [
  { value: 'auto', label: '自動選擇' },
  { value: 'none', label: '無背景音樂' },
  { value: 'upbeat', label: '輕鬆愉快' },
  { value: 'calm', label: '平靜舒緩' },
  { value: 'epic', label: '熱血激昂' },
  { value: 'playful', label: '活潑俏皮' },
  { value: 'dramatic', label: '戲劇張力' },
]

const TIER_ORDER: DurationTier[] = ['flash', 'standard', 'premium']
const TIER_LEVEL: Record<DurationTier, number> = { flash: 1, standard: 2, premium: 3 }

function canUseTier(userMaxTier: DurationTier, targetTier: DurationTier): boolean {
  return TIER_LEVEL[targetTier] <= TIER_LEVEL[userMaxTier]
}

export default function GeneratePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<{ email: string; display_name: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Wizard step: 1=基本設定, 2=風格選項, 3=預覽腳本
  const [step, setStep] = useState(1)

  // Step 1 state
  const [topic, setTopic] = useState('')
  const [durationTier, setDurationTier] = useState<DurationTier>('flash')
  const [durationSec, setDurationSec] = useState<number>(20)
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p')
  const [language, setLanguage] = useState('zh-TW')

  // Step 2 state
  const [theme, setTheme] = useState('life')
  const [style, setStyle] = useState('cinematic')
  const [voice, setVoice] = useState('rachel')
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [bgmMood, setBgmMood] = useState('auto')
  const [subtitleStyle, setSubtitleStyle] = useState('tiktok')

  // Step 3 state
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

  const creditsNeeded = getCreditsForTier(durationTier)
  const userMaxTier = (profile?.max_duration_tier || 'flash') as DurationTier
  const hasEnoughCredits = (profile?.credits_remaining || 0) >= creditsNeeded
  const userCanUse1080p = profile?.plan === 'starter' || profile?.plan === 'pro'

  // When tier changes, reset durationSec to the tier's default (middle value)
  useEffect(() => {
    const opts = DURATION_SEC_OPTIONS[durationTier]
    const mid = opts[Math.floor(opts.length / 2)]
    setDurationSec(mid)
  }, [durationTier])

  // Free plan can't use 1080p — force 720p
  useEffect(() => {
    if (!userCanUse1080p && resolution === '1080p') setResolution('720p')
  }, [userCanUse1080p, resolution])

  // Step 1 → 2
  const handleNext1 = () => {
    if (!topic.trim()) { setError('請輸入影片主題'); return }
    if (!hasEnoughCredits) { setError(`點數不足：需要 ${creditsNeeded} 點，剩餘 ${profile?.credits_remaining || 0} 點`); return }
    setError(null)
    setStep(2)
  }

  // Step 2 → 3: Generate preview
  const handleGeneratePreview = async () => {
    try {
      setPreviewing(true); setError(null)
      const r = await fetch('/api/generate/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          theme,
          style,
          duration_tier: durationTier,
          language,
        }),
      })
      const j = await r.json()
      if (!r.ok || !j.success) { setError(j.error || '產生劇本失敗'); return }
      setScript(j.script)
      setStep(3)
    } catch (err) {
      console.error(err); setError('產生劇本時發生錯誤')
    } finally { setPreviewing(false) }
  }

  // Regenerate script
  const handleRegenerate = async () => {
    try {
      setPreviewing(true); setError(null)
      const r = await fetch('/api/generate/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          theme,
          style,
          duration_tier: durationTier,
          language,
        }),
      })
      const j = await r.json()
      if (!r.ok || !j.success) { setError(j.error || '重新產生失敗'); return }
      setScript(j.script)
    } catch (err) {
      console.error(err); setError('重新產生劇本時發生錯誤')
    } finally { setPreviewing(false) }
  }

  // Step 3: Confirm & generate
  const handleConfirm = async () => {
    if (!script || !profile || !user) return
    try {
      setSubmitting(true); setError(null)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setError('未登入'); return }

      // Create video record
      const { data: videoData, error: videoError } = await supabase
        .from('videos').insert({
          user_id: authUser.id,
          topic: topic.trim(),
          duration_tier: durationTier,
          language,
          theme,
          style,
          voice,
          voice_enabled: voiceEnabled,
          bgm_mood: bgmMood,
          subtitle_enabled: subtitleStyle !== 'none',
          duration_sec: durationSec,
          script: script,
          status: 'pending',
          progress_step: 'queued',
          credits_consumed: creditsNeeded,
        }).select().single()

      if (videoError || !videoData) {
        console.error('Insert error:', videoError)
        setError('建立影片失敗')
        return
      }

      // Record usage log (non-blocking)
      supabase.from('usage_log').insert({
        user_id: authUser.id,
        event_type: 'video_started',
        credits_delta: -creditsNeeded,
        video_id: videoData.id,
        metadata: {
          topic: topic.trim(),
          duration_tier: durationTier,
          theme, style, voice, bgm_mood: bgmMood,
          subtitle_style: subtitleStyle,
          duration_sec: durationSec,
          resolution,
          credits_consumed: creditsNeeded,
        },
      }).then(({ error: logErr }) => {
        if (logErr) console.error('usage_log insert failed:', logErr)
      })

      // Call generate API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          videoId: videoData.id,
          duration_tier: durationTier,
          language,
          theme, style, voice,
          voice_enabled: voiceEnabled,
          bgm_mood: bgmMood,
          subtitle_style: subtitleStyle,
          duration_sec: durationSec,
          resolution,
          script,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        console.error('API error:', errData)
      }

      router.push(`/video/${videoData.id}`)
    } catch (err) {
      console.error(err); setError('發生錯誤，請重試。')
    } finally { setSubmitting(false) }
  }

  const applyTemplate = (t: Template) => {
    setTopic(t.topic)
    setTheme(t.theme)
    setStyle(t.style)
    setVoice(t.voice)
    setBgmMood(t.bgm_mood)
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen w-full bg-sand-50 dark:bg-sand-950">
        <Navbar />
        <main className="flex-1 w-full pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4" />
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
              <span className="mr-2">&larr;</span>返回儀表板
            </Link>

            <div className="mb-8">
              <h1 className="text-4xl font-bold text-sand-900 dark:text-sand-50 mb-2">
                {step === 1 ? '建立新影片' : step === 2 ? '風格設定' : '劇本預覽'}
              </h1>
              <p className="text-sand-500 dark:text-sand-400">
                {step === 1
                  ? '選擇主題與影片長度，AI 會根據你的需求量身打造'
                  : step === 2
                  ? '選擇風格與配音，打造你理想的影片風格'
                  : '確認劇本與分鏡無誤後，開始生成影片'}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center mb-8">
              {[
                { n: 1, label: '主題 & 長度' },
                { n: 2, label: '風格設定' },
                { n: 3, label: '預覽 & 生成' },
              ].map((s, i) => (
                <div key={s.n} className="flex items-center flex-1">
                  <div className={`flex items-center ${step >= s.n ? 'text-accent' : 'text-sand-400 dark:text-sand-600'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors
                      ${step > s.n ? 'border-accent bg-accent text-white' : step === s.n ? 'border-accent bg-accent text-white' : 'border-sand-300 dark:border-sand-600'}`}>
                      {step > s.n ? '✓' : s.n}
                    </div>
                    <span className="ml-2 font-medium text-sm hidden sm:inline">{s.label}</span>
                  </div>
                  {i < 2 && <div className={`flex-1 h-0.5 mx-3 ${step > s.n ? 'bg-accent' : 'bg-sand-300 dark:bg-sand-600'}`} />}
                </div>
              ))}
            </div>

            {/* Credits warning */}
            {profile && profile.credits_remaining <= 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-red-400 mb-2">點數已用完</h3>
                <p className="text-red-300 mb-4">請升級方案或加購點數包繼續建立影片。</p>
                <Link href="/pricing" className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">查看方案</Link>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* ============ STEP 1: Topic & Duration ============ */}
            {profile && profile.credits_remaining > 0 && step === 1 && (
              <>
                <TemplateGallery onApply={applyTemplate} />

                <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-8">
                  {/* Duration Tier Selection */}
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-sand-900 dark:text-sand-50 mb-3">影片長度</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {TIER_ORDER.map((tier) => {
                        const config = DURATION_TIER_CONFIG[tier]
                        const allowed = canUseTier(userMaxTier, tier)
                        const selected = durationTier === tier
                        return (
                          <button
                            key={tier}
                            type="button"
                            disabled={!allowed}
                            onClick={() => { setDurationTier(tier); setError(null) }}
                            className={`relative p-4 rounded-lg border-2 text-left transition-all
                              ${selected
                                ? 'border-accent bg-accent/10 dark:bg-accent/20'
                                : allowed
                                ? 'border-sand-300 dark:border-sand-600 hover:border-accent/50'
                                : 'border-sand-200 dark:border-sand-800 opacity-50 cursor-not-allowed'}`}
                          >
                            {!allowed && (
                              <span className="absolute top-2 right-2 text-xs bg-sand-300 dark:bg-sand-700 text-sand-600 dark:text-sand-400 px-2 py-0.5 rounded-full">
                                需升級
                              </span>
                            )}
                            <div className="text-lg mb-1">{config.icon} {config.label}</div>
                            <div className="text-sm text-accent font-semibold">{config.seconds}</div>
                            <div className="text-xs text-sand-500 dark:text-sand-400 mt-1">{config.description}</div>
                            <div className="mt-2 text-sm font-bold text-sand-900 dark:text-sand-50">
                              {config.credits} 點
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Duration fine-tune + Resolution */}
                  <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="duration_sec" className="block text-sm font-semibold text-sand-900 dark:text-sand-50 mb-2">秒數</label>
                      <select
                        id="duration_sec"
                        value={durationSec}
                        onChange={(e) => setDurationSec(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-600 rounded-lg text-sand-900 dark:text-sand-50 focus:outline-none focus:border-accent"
                      >
                        {DURATION_SEC_OPTIONS[durationTier].map((s) => (
                          <option key={s} value={s}>{s} 秒</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="resolution" className="block text-sm font-semibold text-sand-900 dark:text-sand-50 mb-2">畫質</label>
                      <select
                        id="resolution"
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value as '720p' | '1080p')}
                        className="w-full px-4 py-3 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-600 rounded-lg text-sand-900 dark:text-sand-50 focus:outline-none focus:border-accent"
                      >
                        {RESOLUTION_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value} disabled={o.value === '1080p' && !userCanUse1080p}>
                            {o.label}{o.value === '1080p' && !userCanUse1080p ? '（需升級方案）' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Topic */}
                  <div className="mb-6">
                    <label htmlFor="topic" className="block text-sm font-semibold text-sand-900 dark:text-sand-50 mb-3">影片主題</label>
                    <textarea
                      id="topic"
                      placeholder="例如：有個人在咖啡廳打翻咖啡，遇到一位神秘陌生人"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      rows={3}
                      maxLength={200}
                      className="w-full px-4 py-3 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-600 rounded-lg text-sand-900 dark:text-sand-50 placeholder-sand-400 dark:placeholder-sand-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                    />
                    <div className="text-xs text-sand-400 mt-1 text-right">{topic.length}/200</div>
                  </div>

                  {/* Language */}
                  <div className="mb-6">
                    <label htmlFor="language" className="block text-sm font-semibold text-sand-900 dark:text-sand-50 mb-2">語言</label>
                    <select
                      id="language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-3 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-600 rounded-lg text-sand-900 dark:text-sand-50 focus:outline-none focus:border-accent"
                    >
                      <option value="zh-TW">繁體中文</option>
                      <option value="zh-CN">簡體中文</option>
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-sand-300 dark:border-sand-700">
                    <div className="text-sm text-sand-500 dark:text-sand-400">
                      剩餘 <span className="font-bold text-sand-900 dark:text-sand-50">{profile.credits_remaining}</span> 點
                      {' '}|{' '}本次消耗 <span className="font-bold text-accent">{creditsNeeded} 點</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleNext1}
                      disabled={!topic.trim() || !hasEnoughCredits}
                      className="px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一步 &rarr;
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ============ STEP 2: Style & Options ============ */}
            {step === 2 && (
              <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-8">
                {/* Theme */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-sand-900 dark:text-sand-50 mb-3">故事類型</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {THEME_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setTheme(o.value)}
                        className={`p-3 rounded-lg border-2 text-left text-sm transition-all
                          ${theme === o.value
                            ? 'border-accent bg-accent/10'
                            : 'border-sand-300 dark:border-sand-600 hover:border-accent/50'}`}
                      >
                        <div className="font-semibold text-sand-900 dark:text-sand-50">{o.label}</div>
                        <div className="text-xs text-sand-500 dark:text-sand-400 mt-0.5">{o.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-sand-900 dark:text-sand-50 mb-3">視覺風格</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {STYLE_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setStyle(o.value)}
                        className={`p-3 rounded-lg border-2 text-center text-sm transition-all
                          ${style === o.value
                            ? 'border-accent bg-accent/10'
                            : 'border-sand-300 dark:border-sand-600 hover:border-accent/50'}`}
                      >
                        <span className="font-semibold text-sand-900 dark:text-sand-50">{o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voice toggle + select */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-sand-900 dark:text-sand-50">AI 配音</label>
                    <button
                      type="button"
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${voiceEnabled ? 'bg-accent' : 'bg-sand-300 dark:bg-sand-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${voiceEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  {voiceEnabled && (
                    <select
                      value={voice}
                      onChange={(e) => setVoice(e.target.value)}
                      className="w-full px-4 py-3 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-600 rounded-lg text-sand-900 dark:text-sand-50 focus:outline-none focus:border-accent"
                    >
                      {VOICE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )}
                </div>

                {/* BGM */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-sand-900 dark:text-sand-50 mb-2">背景音樂</label>
                  <select
                    value={bgmMood}
                    onChange={(e) => setBgmMood(e.target.value)}
                    className="w-full px-4 py-3 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-600 rounded-lg text-sand-900 dark:text-sand-50 focus:outline-none focus:border-accent"
                  >
                    {BGM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* Subtitle Style */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-sand-900 dark:text-sand-50 mb-3">字幕樣式（繁體中文）</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SUBTITLE_STYLE_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setSubtitleStyle(o.value)}
                        className={`px-3 py-3 rounded-lg border-2 text-left transition-all ${
                          subtitleStyle === o.value
                            ? 'border-accent bg-accent/10 text-sand-900 dark:text-sand-50'
                            : 'border-sand-300 dark:border-sand-700 text-sand-500 dark:text-sand-400 hover:border-sand-400 dark:hover:border-sand-500'
                        }`}
                      >
                        <div className="text-sm font-medium">{o.label}</div>
                        <div className="text-xs text-sand-500 dark:text-sand-400 mt-0.5">{o.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary bar */}
                <div className="bg-sand-50 dark:bg-sand-800 rounded-lg p-4 mb-6 text-sm">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sand-600 dark:text-sand-300">
                    <span>{DURATION_TIER_CONFIG[durationTier].icon} {DURATION_TIER_CONFIG[durationTier].label} ({DURATION_TIER_CONFIG[durationTier].seconds})</span>
                    <span>消耗 <strong className="text-accent">{creditsNeeded} 點</strong></span>
                    <span>預計 {durationTier === 'flash' ? '2-3' : durationTier === 'standard' ? '5-8' : '8-12'} 分鐘</span>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-sand-300 dark:border-sand-700">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(null) }}
                    className="px-4 py-3 bg-sand-200 dark:bg-sand-800 hover:bg-sand-300 dark:hover:bg-sand-700 text-sand-900 dark:text-sand-50 rounded-lg transition-colors"
                  >
                    &larr; 上一步
                  </button>
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={previewing}
                    className="flex items-center space-x-2 px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {previewing && <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                    <span>{previewing ? '產生劇本中...' : '產生劇本預覽 →'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ============ STEP 3: Script Preview ============ */}
            {step === 3 && script && (
              <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-8">
                {/* Title */}
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-sand-500 dark:text-sand-400 mb-1">影片標題</h2>
                  <p className="text-2xl font-bold text-sand-900 dark:text-sand-50">{script.title}</p>
                </div>

                {/* Hook */}
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-sand-500 dark:text-sand-400 mb-1">前 3 秒鉤子</h2>
                  <p className="text-lg text-sand-900 dark:text-sand-50">{script.hook}</p>
                </div>

                {/* Narration */}
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-sand-500 dark:text-sand-400 mb-1">旁白</h2>
                  <p className="text-sand-900 dark:text-sand-50 leading-relaxed whitespace-pre-wrap">{script.narration}</p>
                </div>

                {/* Scenes */}
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-sand-500 dark:text-sand-400 mb-3">
                    分鏡（{script.scenes.length} 段）
                  </h2>
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

                {/* Cost summary */}
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6">
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <span className="text-sand-700 dark:text-sand-300">
                      {DURATION_TIER_CONFIG[durationTier].icon} {DURATION_TIER_CONFIG[durationTier].label}
                    </span>
                    <span className="text-sand-700 dark:text-sand-300">
                      消耗 <strong className="text-accent">{creditsNeeded} 點</strong>
                    </span>
                    <span className="text-sand-700 dark:text-sand-300">
                      剩餘 <strong>{(profile?.credits_remaining || 0) - creditsNeeded}</strong> 點
                    </span>
                  </div>
                </div>

                {/* Navigation */}
                <div className="pt-6 border-t border-sand-300 dark:border-sand-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep(2); setScript(null); setError(null) }}
                    disabled={submitting || previewing}
                    className="px-4 py-3 bg-sand-200 dark:bg-sand-800 hover:bg-sand-300 dark:hover:bg-sand-700 text-sand-900 dark:text-sand-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    &larr; 回上一步
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={submitting || previewing}
                      className="flex items-center space-x-2 px-4 py-3 bg-sand-200 dark:bg-sand-800 hover:bg-sand-300 dark:hover:bg-sand-700 text-sand-900 dark:text-sand-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {previewing && <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current" />}
                      <span>{previewing ? '重新產生中...' : '重新產生劇本'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={submitting || previewing}
                      className="flex items-center space-x-2 px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting && <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                      <span>{submitting ? '送出中...' : `確認生成（${creditsNeeded} 點）`}</span>
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
