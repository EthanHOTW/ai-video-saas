'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
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
      setError('Failed to update profile')
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    alert('Account deletion feature will be implemented with proper verification flow.')
    setShowDeleteConfirm(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <Navbar user={user} />
        <main className="flex-1 w-full pt-20 flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navbar user={user} />

      <main className="flex-1 w-full pt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Manage your account and preferences</p>
          </div>

          {/* Account Info Section */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Account Information</h2>

            <div className="space-y-6">
              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
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
                  <p className="text-green-400 text-sm">Profile updated successfully!</p>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Current Plan Section */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Billing & Plan</h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Current Plan</p>
                <p className="text-2xl font-bold text-white capitalize">{profile?.plan}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Credits Remaining</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-blue-400">{profile?.credits_remaining}</p>
                  <span className="text-gray-400">credits</span>
                </div>
              </div>
            </div>

            <Link
              href="/pricing"
              className="inline-block px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              Manage Plan
            </Link>
          </div>

          {/* Danger Zone Section */}
          <div className="bg-red-950/20 border border-red-700/30 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Danger Zone</h2>
            <p className="text-gray-400 mb-6">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={handleDeleteAccount}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                Delete Account
              </button>
            ) : (
              <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4">
                <p className="text-white mb-4">
                  Are you sure? This will permanently delete your account and all your videos.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Yes, Delete My Account
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
