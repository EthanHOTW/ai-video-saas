'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from './ThemeToggle'

interface User {
  email: string
  display_name: string
}

interface NavbarProps {
  user?: User | null
}

export default function Navbar({ user }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setDropdownOpen(false)
    window.location.href = '/'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-sand-100 dark:bg-sand-950 border-b border-sand-200 dark:border-sand-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent dark:bg-accent rounded-lg flex items-center justify-center">
              <span className="text-sand-900 dark:text-sand-50 font-bold text-sm">VA</span>
            </div>
            <span className="text-sand-900 dark:text-sand-50 font-bold text-lg hidden sm:inline">
              VideoAI
            </span>
          </Link>

          {/* Right: Navigation */}
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sand-600 dark:text-sand-300 hover:text-sand-900 dark:hover:text-sand-50 transition-colors text-sm font-medium"
                >
                  儀表板
                </Link>
                <Link
                  href="/pricing"
                  className="text-sand-600 dark:text-sand-300 hover:text-sand-900 dark:hover:text-sand-50 transition-colors text-sm font-medium"
                >
                  方案價格
                </Link>

                <ThemeToggle />

                {/* User Avatar Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-sand-200 dark:hover:bg-sand-800 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-accent/80 to-accent dark:from-accent/80 dark:to-accent rounded-full flex items-center justify-center">
                      <span className="text-sand-900 dark:text-sand-50 text-sm font-semibold">
                        {user.display_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-sand-200 dark:bg-sand-800 rounded-lg shadow-lg border border-sand-300 dark:border-sand-700 py-2">
                      <div className="px-4 py-2 border-b border-sand-300 dark:border-sand-700">
                        <p className="text-sm text-sand-900 dark:text-sand-50 font-medium truncate">
                          {user.display_name}
                        </p>
                        <p className="text-xs text-sand-500 dark:text-sand-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/settings"
                        className="block w-full text-left px-4 py-2 text-sm text-sand-600 dark:text-sand-300 hover:bg-sand-300 dark:hover:bg-sand-700 hover:text-sand-900 dark:hover:text-sand-50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        設定
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-sand-600 dark:text-sand-300 hover:bg-sand-300 dark:hover:bg-sand-700 hover:text-sand-900 dark:hover:text-sand-50 transition-colors border-t border-sand-300 dark:border-sand-700 mt-2 pt-2"
                      >
                        登出
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/pricing"
                  className="text-sand-600 dark:text-sand-300 hover:text-sand-900 dark:hover:text-sand-50 transition-colors text-sm font-medium"
                >
                  方案價格
                </Link>

                <ThemeToggle />

                <Link
                  href="/signin"
                  className="px-4 py-2 bg-accent dark:bg-accent hover:opacity-90 text-sand-900 dark:text-sand-50 rounded-lg font-medium transition-opacity text-sm"
                >
                  登入
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
