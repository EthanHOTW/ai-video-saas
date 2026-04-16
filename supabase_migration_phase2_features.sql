-- ============================================
-- Phase 2 Features Migration
-- Adds: soft delete, public share, custom title, usage_log table
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Videos: soft delete + public share + custom title
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS deleted_at   timestamptz,
  ADD COLUMN IF NOT EXISTS is_public    boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_slug   text        UNIQUE,
  ADD COLUMN IF NOT EXISTS custom_title text;

CREATE INDEX IF NOT EXISTS idx_videos_deleted_at ON public.videos(deleted_at);
CREATE INDEX IF NOT EXISTS idx_videos_share_slug ON public.videos(share_slug) WHERE share_slug IS NOT NULL;

-- 2. Public read policy — anyone can read a video with is_public=true AND share_slug set
DROP POLICY IF EXISTS "Public can view shared videos" ON public.videos;
CREATE POLICY "Public can view shared videos"
  ON public.videos FOR SELECT
  USING (is_public = true AND share_slug IS NOT NULL AND deleted_at IS NULL);

-- 3. Allow owners to update their own videos (for rename, share toggle, delete)
DROP POLICY IF EXISTS "Users can update own videos" ON public.videos;
CREATE POLICY "Users can update own videos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Usage log — every credit-consuming or billing event
CREATE TABLE IF NOT EXISTS public.usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('video_generated', 'video_failed', 'credits_purchased', 'plan_upgraded', 'plan_downgraded')),
  credits_delta INTEGER NOT NULL DEFAULT 0,
  video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_log_user_id ON public.usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_created_at ON public.usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_log_event_type ON public.usage_log(event_type);

ALTER TABLE public.usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_log;
CREATE POLICY "Users can view own usage"
  ON public.usage_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_log;
CREATE POLICY "Users can insert own usage"
  ON public.usage_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Template library — shared across all users (read-only)
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT NOT NULL,
  theme TEXT NOT NULL,
  style TEXT NOT NULL,
  voice TEXT NOT NULL,
  bgm_mood TEXT NOT NULL,
  emoji TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view templates" ON public.templates;
CREATE POLICY "Anyone can view templates"
  ON public.templates FOR SELECT
  USING (true);

-- 6. Seed templates (idempotent)
INSERT INTO public.templates (slug, category, title, description, topic, theme, style, voice, bgm_mood, emoji, sort_order) VALUES
  ('story-cafe-stranger',    'life',      '咖啡廳的陌生人',     '都市日常的溫暖邂逅，適合抒情短片',                   '一位上班族在咖啡廳遇到陌生人，因為一杯打翻的拿鐵而展開對話',       'life',      'cinematic',   'rachel', 'warm',      '☕', 10),
  ('story-morning-run',      'life',      '清晨的慢跑',         '清新治癒系，日常運動主題',                           '一位都市人決定開始每天清晨慢跑，慢慢愛上運動的感覺',                'life',      'watercolor',  'bella',  'upbeat',    '🏃', 20),
  ('knowledge-ocean-fact',   'knowledge', '海洋冷知識',         '科普類冷知識，適合做資訊型短影片',                   '關於深海生物的 5 個令人驚奇的冷知識',                                'knowledge', 'cinematic',   'adam',   'mysterious','🌊', 30),
  ('knowledge-space-myth',   'knowledge', '宇宙的秘密',         '天文知識科普，充滿奇幻感',                           '太陽系中最令人著迷的 5 個天文現象',                                  'knowledge', 'fantasy',     'antoni', 'epic',      '🪐', 40),
  ('marketing-new-product',  'marketing', '新品上市宣傳',       '產品發表、電商促銷模板',                             '介紹一款全新上市的智慧型手錶，強調 3 個核心功能',                    'marketing', '3d_cartoon',  'josh',   'upbeat',    '🛍️', 50),
  ('marketing-brand-story',  'marketing', '品牌故事',           '品牌使命與價值觀敘事',                               '一個手工皮革品牌從小工作室到全球品牌的奮鬥故事',                     'marketing', 'vintage_film','antoni', 'warm',      '✨', 60),
  ('comedy-cat-office',      'comedy',    '貓咪上班日記',       '萌寵搞笑，高互動性',                                 '一隻貓咪假裝去上班，結果製造一連串爆笑事件',                         'comedy',    'anime',       'bella',  'upbeat',    '😸', 70),
  ('inspiring-late-bloomer', 'inspiring', '大器晚成',           '勵志正能量，人物故事',                               '一個 40 歲才開始學鋼琴的素人，在 50 歲時登上卡內基音樂廳',         'inspiring', 'cinematic',   'rachel', 'epic',      '🎹', 80),
  ('thriller-urban-legend',  'thriller',  '都市傳說',           '懸疑驚悚，高點閱潛力',                               '某個社區流傳著一個關於凌晨 3 點的詭異都市傳說',                      'thriller',  'cyberpunk',   'adam',   'mysterious','🌙', 90),
  ('kids-brave-bunny',       'kids',      '勇敢的小兔子',       '童話溫馨，親子向',                                   '一隻害羞的小兔子為了尋找生病的奶奶，踏上了勇敢的冒險旅程',           'kids',      '3d_cartoon',  'bella',  'warm',      '🐰', 100)
ON CONFLICT (slug) DO NOTHING;

-- 7. Verify
SELECT 'videos' AS table_name, COUNT(*) AS rows FROM public.videos
UNION ALL SELECT 'usage_log', COUNT(*) FROM public.usage_log
UNION ALL SELECT 'templates', COUNT(*) FROM public.templates;
