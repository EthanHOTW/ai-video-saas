-- Migration: Add dropdown fields + script JSON to videos table
-- Run this in Supabase SQL Editor (Database → SQL Editor → New query)
-- Target project ref: see MEMORY (project_supabase_keys.md)

-- 1. Add new columns (idempotent — safe to re-run)
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS theme      text    NOT NULL DEFAULT 'life',
  ADD COLUMN IF NOT EXISTS style      text    NOT NULL DEFAULT 'cinematic',
  ADD COLUMN IF NOT EXISTS voice      text    NOT NULL DEFAULT 'rachel',
  ADD COLUMN IF NOT EXISTS bgm_mood   text    NOT NULL DEFAULT 'upbeat',
  ADD COLUMN IF NOT EXISTS script     jsonb;

-- 2. Constrain values to the 7/8/5/6 allowed options
--    (drop first so the migration is rerunnable)
ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_theme_check;
ALTER TABLE public.videos
  ADD CONSTRAINT videos_theme_check
  CHECK (theme IN ('life','knowledge','marketing','comedy','inspiring','thriller','kids'));

ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_style_check;
ALTER TABLE public.videos
  ADD CONSTRAINT videos_style_check
  CHECK (style IN ('cinematic','anime','3d_cartoon','watercolor','cyberpunk','vintage_film','minimal_line','fantasy'));

ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_voice_check;
ALTER TABLE public.videos
  ADD CONSTRAINT videos_voice_check
  CHECK (voice IN ('rachel','bella','adam','josh','antoni'));

ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_bgm_mood_check;
ALTER TABLE public.videos
  ADD CONSTRAINT videos_bgm_mood_check
  CHECK (bgm_mood IN ('none','upbeat','warm','epic','mysterious','lofi'));

-- 3. Optional: index script for future search/debug
CREATE INDEX IF NOT EXISTS videos_script_gin_idx ON public.videos USING gin (script);

-- 4. Verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'videos'
ORDER BY ordinal_position;
