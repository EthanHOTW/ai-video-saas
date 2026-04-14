'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PageTransition from '@/components/PageTransition'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export default function SettingsPage() {
  const [user, setUser] = useState<{ email: string; display_name: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/signin')
          return
        }

        setUser({
          email: authUser.email || '',
          display_name: authUser.user_metadata?.display_name || authUser.email || '',
        })

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profileError || !profileData) {
          router.push('/signin')
          return
        }

        setProfile(profileData)
        setDisplayName(profileData.display_name)
      } catch (error) {
        console.error('Error loading user data:', error)
        router.push('/signin')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const handleSaveProfile = async () => {
    if (!profile) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', profile.id)

      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        setProfile({ ...profile, display_name: displayName })
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      setError('更新個人資料失敗')
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    alert('帳號刪除功能將在完整驗證流程後實作。')
    setShowDeleteConfirm(false)
  }

  const handleManageSubscription = async () => {
    setLoadingPortal(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || '無法開啟管理頁面')
      }
    } catch (err) {
      console.error(err)
      alert('發生錯誤，請稍後再試')
    } finally {
      setLoadingPortal(false)
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="flex flex-col min-h-screen w-full">
          <Navbar user={user} />
          <main className="flex-1 w-full pt-20 flex items-center justify-center">
            <div className="text-sand-500 dark:text-sand-400">載入中...</div>
          </main>
          <Footer />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full">
        <Navbar user={user} />

        <main className="flex-1 w-full pt-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header Section */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-sand-900 dark:text-sand-50 mb-2">設定</h1>
              <p className="text-sand-500 dark:text-sand-400">管理你的帳號與偏好設定</p>
            </div>

            {/* Account Info Section */}
            <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-sand-900 dark:text-sand-50 mb-6">帳號資訊</h2>

              <div className="space-y-6">
                {/* Display Name */}
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-sand-600 dark:text-sand-300 mb-2">
                    顯示名稱
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-600 rounded-lg text-sand-900 dark:text-sand-50 placeholder-sand-400 dark:placeholder-sand-500 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-sand-600 dark:text-sand-300 mb-2">
                    電子郵件
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-4 py-2 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-600 rounded-lg text-sand-500 dark:text-sand-400 cursor-not-allowed"
                  />
                </div>

                {/* Error and Success Messages */}
                {error && (
                  <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="p-4 bg-green-600/10 border border-green-600/20 rounded-lg">
                    <p className="text-green-400 text-sm">個人資料已更新！</p>
                  </div>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-6 py-2 bg-accent hover:bg-accent-dark disabled:bg-sand-300 dark:disabled:bg-sand-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  {saving ? '儲存中...' : '儲存變更'}
                </button>
              </div>
            </div>

            {/* Current Plan Section */}
            <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-sand-900 dark:text-sand-50 mb-6">帳單與方案</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sand-500 dark:text-sand-400 text-sm mb-1">目前方案</p>
                  <p className="text-2xl font-bold text-sand-900 dark:text-sand-50 capitalize">{profile?.plan}</p>
                </div>

                <div>
                  <p className="text-sand-500 dark:text-sand-400 text-sm mb-1">剩餘點數</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold text-accent">{profile?.credits_remaining}</p>
                    <span className="text-sand-500 dark:text-sand-400">點</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/pricing"
                  className="inline-block px-6 py-2 bg-sand-200 dark:bg-sand-700 hover:bg-sand-300 dark:hover:bg-sand-600 text-sand-900 dark:text-sand-50 font-semibold rounded-lg transition-colors"
                >
                  管理方案
                </Link>
                {profile?.plan && profile.plan !== 'free' && (
                  <button
                    onClick={handleManageSubscription}
                    disabled={loadingPortal}
                    className="px-6 py-2 bg-accent hover:bg-accent-dark disabled:bg-sand-300 dark:disabled:bg-sand-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                  >
                    {loadingPortal ? '載入中...' : '管理訂閱'}
                  </button>
                )}
              </div>
            </div>

            {/* Danger Zone Section */}
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-700/30 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-sand-900 dark:text-sand-50 mb-4">危險區域</h2>
              <p className="text-sand-500 dark:text-sand-400 mb-6">
                永久刪除你的帳號及所有相關資料，此操作無法復原。
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={handleDeleteAccount}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                >
                  刪除帳號
                </button>
              ) : (
                <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4">
                  <p className="text-sand-900 dark:text-sand-50 mb-4">
                    確定要刪除嗎？這將永久刪除你的帳號和所有影片。
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleConfirmDelete}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      是的，刪除我的帳號
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-sand-200 dark:bg-sand-700 hover:bg-sand-300 dark:hover:bg-sand-600 text-sand-900 dark:text-sand-50 font-semibold rounded-lg transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </PageTransition>
  )
}
