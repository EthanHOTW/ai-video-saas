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
  status: 'pending' | 'processing' | 'completed' | 'failed'
  script_json: Script
  video_url: string | null
  thumbnail_url: string | null
  render_id: string | null
  duration_sec: number | null
  error_message: string | null
  created_at: string
  updated_at: string
}
