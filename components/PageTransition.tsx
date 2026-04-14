'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [transitionStage, setTransitionStage] = useState<'enter' | 'idle'>('enter')

  // Only trigger the slide-in animation when the route changes,
  // NOT on every re-render (e.g. typing in an input).
  // Depending on `children` here broke IME composition because every
  // keystroke re-ran the effect and re-mounted the animated wrapper.
  useEffect(() => {
    setTransitionStage('enter')
    const timer = setTimeout(() => {
      setTransitionStage('idle')
    }, 50)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        transitionStage === 'enter'
          ? 'opacity-0 translate-x-8'
          : 'opacity-100 translate-x-0'
      }`}
    >
      {children}
    </div>
  )
}
