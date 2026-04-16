export interface Profile {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  plan: 'free' | 'starter' | 'pro'
  credits_remaining: number
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface Script {
  [key: string]: unknown
}

export interface Video {
  id: string
  user_id: string
  topic: string
  custom_title: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  script_json: Script
  video_url: string | null
  thumbnail_url: string | null
  render_id: string | null
  duration_sec: number | null
  error_message: string | null
  is_public: boolean
  share_slug: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type UsageEvent =
  | 'video_generated'
  | 'video_failed'
  | 'credits_purchased'
  | 'plan_upgraded'
  | 'plan_downgraded'

export interface UsageLogEntry {
  id: string
  user_id: string
  event_type: UsageEvent
  credits_delta: number
  video_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

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
