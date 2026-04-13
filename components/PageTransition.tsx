'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState<'enter' | 'idle'>('enter')

  useEffect(() => {
    setTransitionStage('enter')
    setDisplayChildren(children)
    const timer = setTimeout(() => {
      setTransitionStage('idle')
    }, 50)
    return () => clearTimeout(timer)
  }, [pathname, children])

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        transitionStage === 'enter'
          ? 'opacity-0 translate-x-8'
          : 'opacity-100 translate-x-0'
      }`}
    >
      {displayChildren}
    </div>
  )
}
