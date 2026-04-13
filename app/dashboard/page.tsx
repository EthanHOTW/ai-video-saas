import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import VideoCard from '@/components/VideoCard'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/auth')
  }

  // Fetch user's videos
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const userVideos = videos || []

  // Count stats
  const totalVideos = userVideos.length

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navbar
        user={{
          email: profile.email,
          display_name: profile.display_name,
        }}
      />

      <main className="flex-1 w-full pt-20">
        <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold text-sand-900 dark:text-sand-50 mb-2">
                儀表板
              </h1>
              <p className="text-sand-500 dark:text-sand-400">
                歡迎回來，{profile.display_name}
              </p>
            </div>
            <Link
              href="/generate"
              className="px-6 py-3 bg-accent hover:bg-accent-dark text-sand-50 font-semibold rounded-lg transition-colors duration-200"
            >
              + 建立新影片
            </Link>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Credits Remaining Card */}
            <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sand-500 dark:text-sand-400 text-sm font-medium mb-1">
                    剩餘點數
                  </p>
                  <p className="text-3xl font-bold text-accent">
                    {profile.credits_remaining}
                  </p>
                </div>
                <div className="text-4xl opacity-50">⚡</div>
              </div>
            </div>

            {/* Videos Created Card */}
            <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sand-500 dark:text-sand-400 text-sm font-medium mb-1">
                    已建立影片
                  </p>
                  <p className="text-3xl font-bold text-sand-900 dark:text-sand-50">
                    {totalVideos}
                  </p>
                </div>
                <div className="text-4xl opacity-50">🎬</div>
              </div>
            </div>

            {/* Current Plan Card */}
            <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sand-500 dark:text-sand-400 text-sm font-medium mb-1">
                    目前方案
                  </p>
                  <p className="text-3xl font-bold text-sand-900 dark:text-sand-50 capitalize">
                    {profile.plan}
                  </p>
                </div>
                <div className="text-4xl opacity-50">📊</div>
              </div>
            </div>
          </div>

          {/* Videos Section */}
          <div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-sand-900 dark:text-sand-50 mb-2">
                你的影片
              </h2>
              <p className="text-sand-500 dark:text-sand-400">
                {totalVideos === 0
                  ? '建立你的第一支影片開始使用'
                  : `共 ${totalVideos} 支影片`}
              </p>
            </div>

            {userVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="bg-sand-100 dark:bg-sand-900 border-2 border-dashed border-sand-300 dark:border-sand-700 rounded-lg p-12 text-center">
                <div className="flex justify-center mb-4">
                  <div className="text-6xl opacity-50">🎬</div>
                </div>
                <h3 className="text-xl font-semibold text-sand-900 dark:text-sand-50 mb-2">
                  尚無影片
                </h3>
                <p className="text-sand-500 dark:text-sand-400 mb-6 max-w-sm mx-auto">
                  建立你的第一支 AI 影片！只要輸入主題，AI 就會幫你完成。
                </p>
                <Link
                  href="/generate"
                  className="inline-block px-6 py-3 bg-accent hover:bg-accent-dark text-sand-50 font-semibold rounded-lg transition-colors duration-200"
                >
                  建立第一支影片
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
