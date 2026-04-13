'use client'

import { useTheme } from '@/lib/theme'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-sand-400/50 bg-sand-200 dark:bg-sand-700"
      aria-label={theme === 'dark' ? '切換淺色模式' : '切換深色模式'}
    >
      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center text-xs shadow-md ${
          theme === 'dark'
            ? 'translate-x-7 bg-sand-900 text-yellow-300'
            : 'translate-x-0.5 bg-white text-amber-500'
        }`}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
