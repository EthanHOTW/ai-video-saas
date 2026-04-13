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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-gray-400">
                Welcome back, {profile.display_name}
              </p>
            </div>
            <Link
              href="/generate"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              + Create New Video
            </Link>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Credits Remaining Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">
                    Credits Remaining
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {profile.credits_remaining}
                  </p>
                </div>
                <div className="text-4xl opacity-50">⚡</div>
              </div>
            </div>

            {/* Videos Created Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">
                    Videos Created
                  </p>
                  <p className="text-3xl font-bold text-white">{totalVideos}</p>
                </div>
                <div className="text-4xl opacity-50">🎬</div>
              </div>
            </div>

            {/* Current Plan Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">
                    Current Plan
                  </p>
                  <p className="text-3xl font-bold text-white capitalize">
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
              <h2 className="text-2xl font-bold text-white mb-2">Your Videos</h2>
              <p className="text-gray-400">
                {totalVideos === 0
                  ? 'Create your first video to get started'
                  : `You have ${totalVideos} video${totalVideos !== 1 ? 's' : ''}`}
              </p>
            </div>

            {userVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-12 text-center">
                <div className="flex justify-center mb-4">
                  <div className="text-6xl opacity-50">🎬</div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No videos yet
                </h3>
                <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                  Create your first AI video! Just enter a topic and let our AI
                  do the work.
                </p>
                <Link
                  href="/generate"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  Create First Video
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
