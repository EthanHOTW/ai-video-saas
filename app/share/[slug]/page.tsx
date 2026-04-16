import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Video } from '@/lib/types'
import ThemeToggle from '@/components/ThemeToggle'
import Footer from '@/components/Footer'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function fetchPublicVideo(slug: string): Promise<Video | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('videos')
    .select('*')
    .eq('share_slug', slug)
    .eq('is_public', true)
    .is('deleted_at', null)
    .single()
  return (data as Video | null) ?? null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const video = await fetchPublicVideo(slug)
  if (!video) return { title: '影片不存在' }
  const title = video.custom_title || video.topic
  return {
    title: `${title} | VideoAI`,
    description: `由 VideoAI 產生的 AI 短影片：${video.topic}`,
    openGraph: {
      title,
      description: video.topic,
      type: 'video.other',
      ...(video.video_url ? { videos: [{ url: video.video_url }] } : {}),
      ...(video.thumbnail_url ? { images: [video.thumbnail_url] } : {}),
    },
  }
}

export default async function PublicSharePage({ params }: PageProps) {
  const { slug } = await params
  const video = await fetchPublicVideo(slug)

  if (!video) notFound()

  if (video.status !== 'completed' || !video.video_url) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <ShareNavbar />
        <main className="flex-1 w-full pt-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h1 className="text-2xl font-bold text-sand-900 dark:text-sand-50 mb-2">
                影片尚未準備好
              </h1>
              <p className="text-sand-500 dark:text-sand-400">
                此影片還在生成中，請稍後再回來看看。
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const title = video.custom_title || video.topic
  const createdDate = new Date(video.created_at).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col min-h-screen w-full">
      <ShareNavbar />

      <main className="flex-1 w-full pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-sand-900 dark:text-sand-50 mb-2">
              {title}
            </h1>
            <p className="text-sand-500 dark:text-sand-400">{createdDate}</p>
          </div>

          <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg overflow-hidden mb-8">
            <div className="relative aspect-video bg-black">
              <video
                src={video.video_url}
                controls
                playsInline
                className="w-full h-full"
                poster={video.thumbnail_url || undefined}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <a
              href={video.video_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors"
            >
              <span className="mr-2">⬇️</span>下載影片
            </a>
            <Link
              href="/"
              className="flex items-center justify-center px-6 py-3 bg-sand-200 dark:bg-sand-800 hover:bg-sand-300 dark:hover:bg-sand-700 text-sand-900 dark:text-sand-50 font-semibold rounded-lg transition-colors"
            >
              <span className="mr-2">✨</span>我也要做一支
            </Link>
          </div>

          <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-sand-900 dark:text-sand-50 mb-2">主題</h2>
            <p className="text-sand-700 dark:text-sand-200">{video.topic}</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function ShareNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-sand-100 dark:bg-sand-950 border-b border-sand-200 dark:border-sand-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-sand-900 dark:text-sand-50 font-bold text-sm">VA</span>
            </div>
            <span className="text-sand-900 dark:text-sand-50 font-bold text-lg">VideoAI</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/auth"
              className="px-4 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-lg transition-colors"
            >
              免費試用
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
