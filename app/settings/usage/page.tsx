import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import type { UsageLogEntry, Video, Profile } from '@/lib/types'

const EVENT_META: Record<
  string,
  { icon: string; label: string; color: string }
> = {
  video_generated: { icon: '🎬', label: '產生影片', color: 'text-blue-400' },
  video_failed: { icon: '⚠️', label: '影片失敗', color: 'text-red-400' },
  credits_purchased: { icon: '💳', label: '購買點數', color: 'text-green-400' },
  plan_upgraded: { icon: '⬆️', label: '升級方案', color: 'text-accent' },
  plan_downgraded: { icon: '⬇️', label: '降級方案', color: 'text-yellow-400' },
}

export default async function UsagePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()
  if (!profile) redirect('/auth')

  // Fetch all videos (for stats) and usage log
  const [{ data: videos }, { data: logs }] = await Promise.all([
    supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('usage_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const allVideos: Video[] = (videos as Video[] | null) || []
  const usageLogs: UsageLogEntry[] = (logs as UsageLogEntry[] | null) || []

  // Stats from videos (since usage_log may be empty on first run)
  const completedVideos = allVideos.filter((v) => v.status === 'completed').length
  const failedVideos = allVideos.filter((v) => v.status === 'failed').length
  const totalDurationSec = allVideos.reduce(
    (sum, v) => sum + (v.duration_sec || 0),
    0,
  )
  const creditsConsumed = completedVideos // 1 credit per video

  // 30-day bucket for the simple bar chart
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const buckets: { date: string; count: number }[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(d.getDate() + i)
    buckets.push({ date: d.toISOString().slice(0, 10), count: 0 })
  }
  for (const v of allVideos) {
    const day = v.created_at.slice(0, 10)
    const b = buckets.find((x) => x.date === day)
    if (b) b.count++
  }
  const maxBucket = Math.max(1, ...buckets.map((b) => b.count))

  const thirtyDayTotal = buckets.reduce((sum, b) => sum + b.count, 0)

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navbar
        user={{ email: profile.email, display_name: profile.display_name }}
      />

      <main className="flex-1 w-full pt-20">
        <div className="page-enter max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/settings"
            className="inline-flex items-center text-sand-500 dark:text-sand-400 hover:text-sand-900 dark:hover:text-sand-50 transition-colors mb-6"
          >
            <span className="mr-2">←</span>返回設定
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl font-bold text-sand-900 dark:text-sand-50 mb-2">
              使用量歷史
            </h1>
            <p className="text-sand-500 dark:text-sand-400">
              查看你的點數使用、影片產出與付費紀錄
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCard icon="⚡" label="剩餘點數" value={profile.credits_remaining} accent />
            <StatCard icon="✅" label="已完成影片" value={completedVideos} />
            <StatCard icon="⚠️" label="失敗影片" value={failedVideos} />
            <StatCard icon="⏱️" label="總時長(秒)" value={totalDurationSec} />
          </div>

          {/* 30-day chart */}
          <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-6 mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-sand-900 dark:text-sand-50">
                  最近 30 天影片產出
                </h2>
                <p className="text-sm text-sand-500 dark:text-sand-400">
                  共 {thirtyDayTotal} 支
                </p>
              </div>
              <p className="text-xs text-sand-500 dark:text-sand-400">
                目前方案：<span className="font-semibold capitalize text-sand-900 dark:text-sand-50">{profile.plan}</span>
              </p>
            </div>
            <div className="flex items-end gap-[2px] h-32 overflow-x-auto">
              {buckets.map((b) => (
                <div key={b.date} className="flex-1 min-w-[8px] flex flex-col items-center group relative">
                  <div
                    className="w-full bg-accent/70 hover:bg-accent rounded-t transition-all"
                    style={{ height: `${(b.count / maxBucket) * 100}%`, minHeight: b.count > 0 ? '4px' : '1px' }}
                  />
                  <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-sand-900 dark:text-sand-50 bg-sand-200 dark:bg-sand-800 px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                    {b.date}：{b.count}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-sand-500 dark:text-sand-400">
              <span>{buckets[0].date}</span>
              <span>{buckets[buckets.length - 1].date}</span>
            </div>
          </div>

          {/* Activity log */}
          <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-sand-900 dark:text-sand-50 mb-4">
              活動紀錄
            </h2>

            {usageLogs.length === 0 && allVideos.length === 0 ? (
              <div className="py-10 text-center text-sand-500 dark:text-sand-400">
                目前還沒有任何活動，
                <Link href="/generate" className="text-accent hover:underline ml-1">
                  建立你的第一支影片
                </Link>
                。
              </div>
            ) : (
              <div className="divide-y divide-sand-300 dark:divide-sand-700">
                {/* Prefer usage_log entries; fall back to video history if empty */}
                {usageLogs.length > 0
                  ? usageLogs.map((e) => (
                      <LogRow
                        key={e.id}
                        icon={EVENT_META[e.event_type]?.icon || '•'}
                        label={EVENT_META[e.event_type]?.label || e.event_type}
                        color={EVENT_META[e.event_type]?.color || 'text-sand-500'}
                        date={e.created_at}
                        delta={e.credits_delta}
                      />
                    ))
                  : allVideos.slice(0, 50).map((v) => (
                      <LogRow
                        key={v.id}
                        icon={v.status === 'failed' ? '⚠️' : '🎬'}
                        label={v.custom_title || v.topic}
                        color={
                          v.status === 'failed'
                            ? 'text-red-400'
                            : v.status === 'completed'
                            ? 'text-blue-400'
                            : 'text-sand-500'
                        }
                        date={v.created_at}
                        delta={v.status === 'completed' ? -1 : 0}
                        href={`/video/${v.id}`}
                      />
                    ))}
              </div>
            )}

            {usageLogs.length === 0 && allVideos.length > 0 && (
              <p className="mt-4 text-xs text-sand-500 dark:text-sand-400 italic">
                * 顯示歷史影片紀錄（usage_log 從下一次產生影片後開始累積）
              </p>
            )}
          </div>

          <div className="mt-6 text-xs text-sand-500 dark:text-sand-400">
            總消耗點數估算：{creditsConsumed}（每支完成影片計 1 點）
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl opacity-70">{icon}</span>
        <p className="text-xs font-medium text-sand-500 dark:text-sand-400">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${accent ? 'text-accent' : 'text-sand-900 dark:text-sand-50'}`}>
        {value}
      </p>
    </div>
  )
}

function LogRow({
  icon,
  label,
  color,
  date,
  delta,
  href,
}: {
  icon: string
  label: string
  color: string
  date: string
  delta: number
  href?: string
}) {
  const content = (
    <div className="py-3 flex items-center gap-4 hover:bg-sand-200/30 dark:hover:bg-sand-800/30 px-2 -mx-2 rounded transition-colors">
      <div className={`text-xl ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-sand-900 dark:text-sand-50 truncate">{label}</p>
        <p className="text-xs text-sand-500 dark:text-sand-400">
          {new Date(date).toLocaleString('zh-TW')}
        </p>
      </div>
      {delta !== 0 && (
        <div
          className={`text-sm font-semibold ${
            delta > 0 ? 'text-green-400' : 'text-sand-500 dark:text-sand-400'
          }`}
        >
          {delta > 0 ? '+' : ''}
          {delta} 點
        </div>
      )}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
