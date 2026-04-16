'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { Video } from '@/lib/types'
import StatusBadge from './StatusBadge'

type SortKey = 'newest' | 'oldest' | 'title'
type StatusFilter = 'all' | 'completed' | 'processing' | 'pending' | 'failed'

interface Props {
  initialVideos: Video[]
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'completed', label: '已完成' },
  { value: 'processing', label: '處理中' },
  { value: 'pending', label: '等待中' },
  { value: 'failed', label: '失敗' },
]

export default function DashboardVideos({ initialVideos }: Props) {
  const supabase = createClient()
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const titleOf = (v: Video) => v.custom_title?.trim() || v.topic

  const visibleVideos = useMemo(() => {
    const term = search.trim().toLowerCase()
    let list = videos.filter((v) => !v.deleted_at)
    if (statusFilter !== 'all') list = list.filter((v) => v.status === statusFilter)
    if (term) {
      list = list.filter((v) => titleOf(v).toLowerCase().includes(term))
    }
    list = [...list]
    if (sortKey === 'newest') list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    if (sortKey === 'oldest') list.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
    if (sortKey === 'title') list.sort((a, b) => titleOf(a).localeCompare(titleOf(b), 'zh-Hant'))
    return list
  }, [videos, search, statusFilter, sortKey])

  const startRename = (v: Video) => {
    setRenameId(v.id)
    setRenameValue(titleOf(v))
  }

  const submitRename = async (id: string) => {
    const next = renameValue.trim()
    if (!next) {
      setRenameId(null)
      return
    }
    const prev = videos
    setVideos((vs) => vs.map((v) => (v.id === id ? { ...v, custom_title: next } : v)))
    setRenameId(null)
    startTransition(async () => {
      const { error } = await supabase.from('videos').update({ custom_title: next }).eq('id', id)
      if (error) {
        setError('重新命名失敗：' + error.message)
        setVideos(prev)
      }
    })
  }

  const softDelete = async (id: string) => {
    const prev = videos
    setVideos((vs) => vs.map((v) => (v.id === id ? { ...v, deleted_at: new Date().toISOString() } : v)))
    setConfirmDeleteId(null)
    startTransition(async () => {
      const { error } = await supabase
        .from('videos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) {
        setError('刪除失敗：' + error.message)
        setVideos(prev)
      }
    })
  }

  const hasFilter =
    search.trim() !== '' || statusFilter !== 'all' || sortKey !== 'newest'

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setSortKey('newest')
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋影片標題或主題..."
            className="w-full px-4 py-2.5 pl-10 bg-sand-50 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg text-sand-900 dark:text-sand-50 placeholder-sand-400 dark:placeholder-sand-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
          </svg>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-4 py-2.5 bg-sand-50 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg text-sand-900 dark:text-sand-50 focus:outline-none focus:border-accent"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="px-4 py-2.5 bg-sand-50 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg text-sand-900 dark:text-sand-50 focus:outline-none focus:border-accent"
        >
          <option value="newest">最新優先</option>
          <option value="oldest">最舊優先</option>
          <option value="title">依標題排序</option>
        </select>
        {hasFilter && (
          <button
            onClick={resetFilters}
            className="px-4 py-2.5 text-sm text-sand-600 dark:text-sand-300 hover:text-sand-900 dark:hover:text-sand-50 transition-colors"
          >
            清除篩選
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-300 hover:text-red-100">✕</button>
        </div>
      )}

      {/* Results */}
      {visibleVideos.length === 0 ? (
        <div className="bg-sand-100 dark:bg-sand-900 border-2 border-dashed border-sand-300 dark:border-sand-700 rounded-lg p-12 text-center">
          <div className="text-6xl opacity-50 mb-4">{hasFilter ? '🔍' : '🎬'}</div>
          <h3 className="text-xl font-semibold text-sand-900 dark:text-sand-50 mb-2">
            {hasFilter ? '沒有符合條件的影片' : '尚無影片'}
          </h3>
          <p className="text-sand-500 dark:text-sand-400 mb-6 max-w-sm mx-auto">
            {hasFilter ? '試試調整搜尋或篩選條件' : '建立你的第一支 AI 影片！只要輸入主題，AI 就會幫你完成。'}
          </p>
          {hasFilter ? (
            <button
              onClick={resetFilters}
              className="inline-block px-6 py-3 bg-sand-200 dark:bg-sand-800 hover:bg-sand-300 dark:hover:bg-sand-700 text-sand-900 dark:text-sand-50 font-semibold rounded-lg transition-colors"
            >
              清除篩選
            </button>
          ) : (
            <Link
              href="/generate"
              className="inline-block px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors"
            >
              建立第一支影片
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-sand-500 dark:text-sand-400 mb-3">
            顯示 {visibleVideos.length} / {videos.filter((v) => !v.deleted_at).length} 支影片
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleVideos.map((video) => (
              <VideoRow
                key={video.id}
                video={video}
                title={titleOf(video)}
                isRenaming={renameId === video.id}
                renameValue={renameValue}
                onRenameChange={setRenameValue}
                onStartRename={() => startRename(video)}
                onSubmitRename={() => submitRename(video.id)}
                onCancelRename={() => setRenameId(null)}
                onAskDelete={() => setConfirmDeleteId(video.id)}
                pending={pending}
              />
            ))}
          </div>
        </>
      )}

      {/* Delete confirm modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-sand-50 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-sand-900 dark:text-sand-50 mb-2">刪除影片？</h3>
            <p className="text-sand-500 dark:text-sand-400 text-sm mb-5">
              此影片將從你的儀表板移除。已消耗的點數不會退還。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sand-700 dark:text-sand-200 hover:bg-sand-200 dark:hover:bg-sand-800 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => softDelete(confirmDeleteId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface VideoRowProps {
  video: Video
  title: string
  isRenaming: boolean
  renameValue: string
  onRenameChange: (v: string) => void
  onStartRename: () => void
  onSubmitRename: () => void
  onCancelRename: () => void
  onAskDelete: () => void
  pending: boolean
}

function VideoRow({
  video,
  title,
  isRenaming,
  renameValue,
  onRenameChange,
  onStartRename,
  onSubmitRename,
  onCancelRename,
  onAskDelete,
}: VideoRowProps) {
  const formattedDate = new Date(video.created_at).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return (
    <div className="bg-sand-100 dark:bg-sand-900 rounded-lg border border-sand-300 dark:border-sand-700 overflow-hidden hover:border-sand-400 dark:hover:border-sand-600 transition-colors group relative">
      <Link href={`/video/${video.id}`} className="block">
        <div className="relative aspect-video bg-gradient-to-br from-sand-200 to-sand-300 dark:from-sand-800 dark:to-sand-900 overflow-hidden">
          {video.thumbnail_url ? (
            <Image src={video.thumbnail_url} alt={title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent-dark/20 flex items-center justify-center">
              <svg className="w-16 h-16 text-sand-400 dark:text-sand-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-1.5">
            {video.is_public && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-500/20 text-green-300 border border-green-500/40">
                公開
              </span>
            )}
            <StatusBadge status={video.status} />
          </div>
        </div>
      </Link>

      <div className="p-4">
        {isRenaming ? (
          <div className="mb-2">
            <input
              autoFocus
              type="text"
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onBlur={onSubmitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmitRename()
                if (e.key === 'Escape') onCancelRename()
              }}
              className="w-full px-2 py-1 text-sm bg-sand-50 dark:bg-sand-800 border border-accent rounded text-sand-900 dark:text-sand-50 focus:outline-none"
            />
          </div>
        ) : (
          <Link href={`/video/${video.id}`}>
            <h3 className="text-sand-900 dark:text-sand-50 font-semibold text-sm line-clamp-2 mb-2 hover:text-accent transition-colors">
              {title}
            </h3>
          </Link>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sand-500 dark:text-sand-400 text-xs">{formattedDate}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={onStartRename}
              title="重新命名"
              className="p-1.5 rounded hover:bg-sand-200 dark:hover:bg-sand-800 text-sand-500 hover:text-sand-900 dark:hover:text-sand-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onAskDelete}
              title="刪除"
              className="p-1.5 rounded hover:bg-red-500/20 text-sand-500 hover:text-red-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
