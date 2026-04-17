-- ============================================
-- V3 Migration: Duration Tier + Credits Rework
-- LTX-centric short video SaaS restructure
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Videos table: add duration_tier + progress tracking
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS duration_tier TEXT NOT NULL DEFAULT 'flash'
    CHECK (duration_tier IN ('flash', 'standard', 'premium')),
  ADD COLUMN IF NOT EXISTS progress_step TEXT DEFAULT 'queued'
    CHECK (progress_step IN ('queued', 'script', 'voice', 'visuals', 'compositing', 'finalizing', 'done', 'error')),
  ADD COLUMN IF NOT EXISTS credits_consumed INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'zh-TW',
  ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS subtitle_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Update existing bgm_mood constraint to include new options
ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_bgm_mood_check;
ALTER TABLE public.videos
  ADD CONSTRAINT videos_bgm_mood_check
  CHECK (bgm_mood IN ('none', 'auto', 'upbeat', 'warm', 'calm', 'epic', 'dramatic', 'mysterious', 'playful', 'lofi'));

-- Index for filtering by duration_tier
CREATE INDEX IF NOT EXISTS idx_videos_duration_tier ON public.videos(user_id, duration_tier);
CREATE INDEX IF NOT EXISTS idx_videos_status_created ON public.videos(user_id, status, created_at DESC);

-- 2. Profiles table: add new plan fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credits_monthly_reset INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_duration_tier TEXT NOT NULL DEFAULT 'flash'
    CHECK (max_duration_tier IN ('flash', 'standard', 'premium')),
  ADD COLUMN IF NOT EXISTS priority_queue BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS api_access BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive'
    CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'inactive'));

-- 3. Plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  yearly_price_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  stripe_monthly_price_id TEXT,
  stripe_yearly_price_id TEXT,
  monthly_credits INTEGER NOT NULL DEFAULT 5,
  max_duration_tier TEXT NOT NULL DEFAULT 'flash'
    CHECK (max_duration_tier IN ('flash', 'standard', 'premium')),
  resolution TEXT NOT NULL DEFAULT '720p',
  watermark BOOLEAN DEFAULT true,
  priority_queue BOOLEAN DEFAULT false,
  api_access BOOLEAN DEFAULT false,
  max_concurrent_jobs INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view plans" ON public.plans;
CREATE POLICY "Anyone can view plans"
  ON public.plans FOR SELECT
  USING (true);

-- Seed plans (idempotent)
INSERT INTO public.plans (id, name, description, monthly_price_usd, yearly_price_usd, monthly_credits, max_duration_tier, resolution, watermark, priority_queue, api_access, max_concurrent_jobs, sort_order)
VALUES
  ('free',    'Free',    '免費體驗 AI 短影片',   0,    0,   5,   'flash',    '720p',  true,  false, false, 1, 0),
  ('starter', 'Starter', '適合個人創作者',       19,  182,  50,  'standard', '1080p', false, false, false, 2, 1),
  ('pro',     'Pro',     '適合專業團隊',         49,  470, 150,  'premium',  '1080p', false, true,  true,  5, 2)
ON CONFLICT (id) DO UPDATE SET
  monthly_price_usd = EXCLUDED.monthly_price_usd,
  yearly_price_usd = EXCLUDED.yearly_price_usd,
  monthly_credits = EXCLUDED.monthly_credits,
  max_duration_tier = EXCLUDED.max_duration_tier,
  resolution = EXCLUDED.resolution,
  watermark = EXCLUDED.watermark,
  priority_queue = EXCLUDED.priority_queue,
  api_access = EXCLUDED.api_access,
  max_concurrent_jobs = EXCLUDED.max_concurrent_jobs;

-- 4. Credit packs table
CREATE TABLE IF NOT EXISTS public.credit_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view credit packs" ON public.credit_packs;
CREATE POLICY "Anyone can view credit packs"
  ON public.credit_packs FOR SELECT
  USING (true);

INSERT INTO public.credit_packs (id, name, credits, price_usd, sort_order)
VALUES
  ('pack_10',  '10 點',  10,   4.99, 0),
  ('pack_50',  '50 點',  50,  19.99, 1),
  ('pack_200', '200 點', 200, 59.99, 2)
ON CONFLICT (id) DO NOTHING;

-- 5. Update usage_log event types to include new events
ALTER TABLE public.usage_log DROP CONSTRAINT IF EXISTS usage_log_event_type_check;
ALTER TABLE public.usage_log
  ADD CONSTRAINT usage_log_event_type_check
  CHECK (event_type IN (
    'video_generated', 'video_started', 'video_completed', 'video_failed',
    'credits_purchased', 'credits_monthly',
    'plan_upgraded', 'plan_downgraded', 'plan_canceled'
  ));

-- 6. Update existing profiles to match new plan structure
UPDATE public.profiles SET
  credits_monthly_reset = 5,
  max_duration_tier = 'flash'
WHERE plan = 'free' AND max_duration_tier IS NULL;

UPDATE public.profiles SET
  credits_monthly_reset = 50,
  max_duration_tier = 'standard'
WHERE plan = 'starter' AND max_duration_tier IS NULL;

UPDATE public.profiles SET
  credits_monthly_reset = 150,
  max_duration_tier = 'premium'
WHERE plan = 'pro' AND max_duration_tier IS NULL;

-- 7. Backfill existing videos with default duration_tier
UPDATE public.videos SET
  duration_tier = 'flash',
  credits_consumed = 1
WHERE duration_tier IS NULL OR duration_tier = 'flash';

-- 8. Create Supabase Storage bucket for BGM (if not exists)
-- NOTE: Run this separately via Supabase dashboard or API:
-- Storage → New Bucket → Name: "bgm" → Public: true
-- Storage → New Bucket → Name: "videos" → Public: true
-- Storage → New Bucket → Name: "thumbnails" → Public: true

-- 9. Verify
SELECT 'plans' AS tbl, COUNT(*) AS rows FROM public.plans
UNION ALL SELECT 'credit_packs', COUNT(*) FROM public.credit_packs
UNION ALL SELECT 'videos (with duration_tier)', COUNT(*) FROM public.videos WHERE duration_tier IS NOT NULL;
