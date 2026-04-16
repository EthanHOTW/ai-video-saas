'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Template } from '@/lib/types'

interface Props {
  onApply: (t: Template) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  all: '全部',
  life: '生活故事',
  knowledge: '知識科普',
  marketing: '商業行銷',
  comedy: '搞笑娛樂',
  inspiring: '情感勵志',
  thriller: '驚悚懸疑',
  kids: '兒童故事',
}

export default function TemplateGallery({ onApply }: Props) {
  const supabase = createClient()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('all')
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('templates')
        .select('*')
        .order('sort_order', { ascending: true })
      if (!cancelled) {
        setTemplates((data as Template[] | null) || [])
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [supabase])

  const categories = ['all', ...Array.from(new Set(templates.map((t) => t.category)))]
  const visible = category === 'all' ? templates : templates.filter((t) => t.category === category)

  if (!loading && templates.length === 0) return null

  return (
    <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-6 mb-6">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left mb-4"
      >
        <div>
          <h2 className="text-lg font-semibold text-sand-900 dark:text-sand-50 flex items-center gap-2">
            <span>💡</span>
            <span>從範本開始</span>
          </h2>
          <p className="text-sm text-sand-500 dark:text-sand-400 mt-1">
            一鍵套用精選模板，快速上手
          </p>
        </div>
        <span
          className={`text-sand-500 dark:text-sand-400 text-sm transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <>
          {loading ? (
            <div className="py-6 text-center text-sand-500 dark:text-sand-400 text-sm">
              載入範本中...
            </div>
          ) : (
            <>
              {/* Category tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      category === c
                        ? 'bg-accent text-white'
                        : 'bg-sand-200 dark:bg-sand-800 text-sand-700 dark:text-sand-200 hover:bg-sand-300 dark:hover:bg-sand-700'
                    }`}
                  >
                    {CATEGORY_LABELS[c] || c}
                  </button>
                ))}
              </div>

              {/* Template cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visible.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onApply(t)}
                    className="text-left p-4 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-700 rounded-lg hover:border-accent hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl">{t.emoji || '🎬'}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sand-900 dark:text-sand-50 text-sm group-hover:text-accent transition-colors">
                          {t.title}
                        </h3>
                        {t.description && (
                          <p className="text-xs text-sand-500 dark:text-sand-400 mt-0.5 line-clamp-2">
                            {t.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-sand-600 dark:text-sand-300 line-clamp-2 font-mono bg-sand-100 dark:bg-sand-900 rounded px-2 py-1.5">
                      {t.topic}
                    </p>
                  </button>
                ))}
              </div>
              {visible.length === 0 && (
                <div className="py-6 text-center text-sand-500 dark:text-sand-400 text-sm">
                  此分類尚無範本
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
