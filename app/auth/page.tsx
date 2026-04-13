'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageTransition from '@/components/PageTransition'

export default function AuthPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')

  // Sign Up state
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
        },
      })
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('Google 登入失敗')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      })

      if (error) {
        setError(error.message)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('發生未預期的錯誤')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      if (signUpPassword !== confirmPassword) {
        setError('密碼不一致')
        return
      }

      if (signUpPassword.length < 6) {
        setError('密碼至少需要 6 個字元')
        return
      }

      const { error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
      })

      if (error) {
        setError(error.message)
        return
      }

      setSignUpSuccess(true)
      setSignUpEmail('')
      setSignUpPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError('發生未預期的錯誤')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (newTab: 'signin' | 'signup') => {
    setTab(newTab)
    setError(null)
    setSignUpSuccess(false)
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-sand-50 dark:bg-sand-950 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-sand-100 dark:bg-sand-900 border border-sand-200 dark:border-sand-800 rounded-xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-sand-900 dark:text-sand-50 font-bold text-lg">VA</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-sand-200 dark:bg-sand-800 rounded-lg p-1">
            <button
              onClick={() => handleTabChange('signin')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors text-sm ${
                tab === 'signin'
                  ? 'bg-accent text-sand-900 dark:text-sand-50'
                  : 'text-sand-500 dark:text-sand-400 hover:text-sand-600 dark:hover:text-sand-300'
              }`}
            >
              登入
            </button>
            <button
              onClick={() => handleTabChange('signup')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors text-sm ${
                tab === 'signup'
                  ? 'bg-accent text-sand-900 dark:text-sand-50'
                  : 'text-sand-500 dark:text-sand-400 hover:text-sand-600 dark:hover:text-sand-300'
              }`}
            >
              註冊
            </button>
          </div>

          {/* Content */}
          {signUpSuccess && tab === 'signup' ? (
            <div className="space-y-4">
              <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg p-4">
                <p className="text-green-700 dark:text-green-300 text-sm text-center">
                  請查看你的電子郵件，點擊確認連結以驗證帳號。
                </p>
              </div>
              <button
                onClick={() => handleTabChange('signin')}
                className="w-full py-2 px-4 bg-sand-200 dark:bg-sand-800 hover:bg-sand-300 dark:hover:bg-sand-700 text-sand-900 dark:text-sand-50 rounded-lg font-medium transition-colors text-sm"
              >
                返回登入
              </button>
            </div>
          ) : (
            <>
              {/* Google Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 bg-sand-200 dark:bg-sand-800 hover:bg-sand-300 dark:hover:bg-sand-700 disabled:opacity-50 disabled:cursor-not-allowed text-sand-900 dark:text-sand-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mb-4"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                使用 Google 帳號繼續
              </button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-sand-300 dark:border-sand-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-sand-100 dark:bg-sand-900 text-sand-500 dark:text-sand-400">或</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Sign In Form */}
              {tab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-sand-900 dark:text-sand-50 mb-2">
                      電子郵件
                    </label>
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-2.5 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-700 rounded-lg text-sand-900 dark:text-sand-50 placeholder-sand-400 dark:placeholder-sand-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-sand-900 dark:text-sand-50 mb-2">
                      密碼
                    </label>
                    <input
                      type="password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-2.5 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-700 rounded-lg text-sand-900 dark:text-sand-50 placeholder-sand-400 dark:placeholder-sand-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                    />
                  </div>

                  <div className="text-right">
                    <a
                      href="#"
                      className="text-sm text-accent hover:text-accent-dark transition-colors"
                    >
                      忘記密碼？
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-accent hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed text-sand-900 dark:text-sand-50 rounded-lg font-medium transition-colors"
                  >
                    {loading ? '登入中...' : '登入'}
                  </button>
                </form>
              )}

              {/* Sign Up Form */}
              {tab === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-sand-900 dark:text-sand-50 mb-2">
                      電子郵件
                    </label>
                    <input
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-2.5 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-700 rounded-lg text-sand-900 dark:text-sand-50 placeholder-sand-400 dark:placeholder-sand-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-sand-900 dark:text-sand-50 mb-2">
                      密碼
                    </label>
                    <input
                      type="password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-2.5 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-700 rounded-lg text-sand-900 dark:text-sand-50 placeholder-sand-400 dark:placeholder-sand-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-sand-900 dark:text-sand-50 mb-2">
                      確認密碼
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-2.5 bg-sand-50 dark:bg-sand-800 border border-sand-300 dark:border-sand-700 rounded-lg text-sand-900 dark:text-sand-50 placeholder-sand-400 dark:placeholder-sand-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-accent hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed text-sand-900 dark:text-sand-50 rounded-lg font-medium transition-colors"
                  >
                    {loading ? '建立帳號中...' : '註冊'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
