import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-sand-100 dark:bg-sand-950 border-t border-sand-200 dark:border-sand-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          {/* Left */}
          <p className="text-sand-500 dark:text-sand-400 text-sm">
            © 2026 VideoAI. 版權所有。
          </p>

          {/* Right */}
          <div className="flex items-center space-x-6">
            <Link
              href="#pricing"
              className="text-sand-500 dark:text-sand-400 hover:text-sand-900 dark:hover:text-sand-50 transition-colors text-sm"
            >
              方案價格
            </Link>
            <Link
              href="#terms"
              className="text-sand-500 dark:text-sand-400 hover:text-sand-900 dark:hover:text-sand-50 transition-colors text-sm"
            >
              服務條款
            </Link>
            <Link
              href="#privacy"
              className="text-sand-500 dark:text-sand-400 hover:text-sand-900 dark:hover:text-sand-50 transition-colors text-sm"
            >
              隱私政策
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
