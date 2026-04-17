// ============================================
// Duration Tiers & Credits
// ============================================

export type DurationTier = 'flash' | 'standard' | 'premium'

export const DURATION_TIER_CONFIG: Record<DurationTier, {
  label: string
  labelEn: string
  seconds: string
  description: string
  credits: number
  maxScenes: number
  targetSeconds: number
  icon: string
}> = {
  flash: {
    label: '閃電短片',
    labelEn: 'Flash',
    seconds: '15-30 秒',
    description: '社群限動、短影音、廣告素材',
    credits: 1,
    maxScenes: 4,
    targetSeconds: 20,
    icon: '⚡',
  },
  standard: {
    label: '商業標準',
    labelEn: 'Standard',
    seconds: '30-60 秒',
    description: '產品介紹、品牌故事、教學內容',
    credits: 3,
    maxScenes: 6,
    targetSeconds: 45,
    icon: '🎬',
  },
  premium: {
    label: '高品質長片',
    labelEn: 'Premium',
    seconds: '60-120 秒',
    description: '完整品牌影片、深度內容',
    credits: 8,
    maxScenes: 8,
    targetSeconds: 90,
    icon: '👑',
  },
}

export function getCreditsForTier(tier: DurationTier): number {
  return DURATION_TIER_CONFIG[tier].credits
}

// ============================================
// Profile
// ============================================

export type PlanId = 'free' | 'starter' | 'pro'

export interface Profile {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  plan: PlanId
  credits_remaining: number
  credits_monthly_reset: number
  credits_reset_at: string | null
  max_duration_tier: DurationTier
  priority_queue: boolean
  api_access: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: 'active' | 'past_due' | 'canceled' | 'inactive'
  created_at: string
  updated_at: string
}

// ============================================
// Video / Job
// ============================================

export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ProgressStep = 'queued' | 'script' | 'voice' | 'visuals' | 'compositing' | 'finalizing' | 'done' | 'error'

export interface Script {
  title?: string
  hook?: string
  narration?: string
  scenes?: Array<{
    scene: number
    visual_zh: string
    visual_prompt: string
    narration?: string
  }>
  [key: string]: unknown
}

export interface Video {
  id: string
  user_id: string
  topic: string
  custom_title: string | null
  duration_tier: DurationTier
  language: string
  style: string
  theme: string
  voice: string
  voice_enabled: boolean
  bgm_mood: string
  subtitle_enabled: boolean
  script_json: Script | null
  status: VideoStatus
  progress_step: ProgressStep
  credits_consumed: number
  video_url: string | null
  thumbnail_url: string | null
  srt_url: string | null
  render_id: string | null
  duration_sec: number | null
  error_message: string | null
  is_public: boolean
  share_slug: string | null
  deleted_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// ============================================
// Plans
// ============================================

export interface Plan {
  id: PlanId
  name: string
  description: string | null
  monthly_price_usd: number
  yearly_price_usd: number
  monthly_credits: number
  max_duration_tier: DurationTier
  resolution: string
  watermark: boolean
  priority_queue: boolean
  api_access: boolean
  max_concurrent_jobs: number
  sort_order: number
  is_active: boolean
}

export interface CreditPack {
  id: string
  name: string
  credits: number
  price_usd: number
  is_active: boolean
}

// ============================================
// Usage Log
// ============================================

export type UsageEvent =
  | 'video_generated'
  | 'video_started'
  | 'video_completed'
  | 'video_failed'
  | 'credits_purchased'
  | 'credits_monthly'
  | 'plan_upgraded'
  | 'plan_downgraded'
  | 'plan_canceled'

export interface UsageLogEntry {
  id: string
  user_id: string
  event_type: UsageEvent
  credits_delta: number
  video_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// ============================================
// Templates
// ============================================

export interface Template {
  id: string
  slug: string
  category: string
  title: string
  description: string | null
  topic: string
  theme: string
  style: string
  voice: string
  bgm_mood: string
  emoji: string | null
  sort_order: number
  created_at: string
}
