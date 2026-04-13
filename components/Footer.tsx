import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          {/* Left */}
          <p className="text-gray-400 text-sm">
            © 2026 VideoAI. All rights reserved.
          </p>

          {/* Right */}
          <div className="flex items-center space-x-6">
            <Link
              href="#pricing"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Pricing
            </Link>
            <Link
              href="#terms"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Terms
            </Link>
            <Link
              href="#privacy"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
