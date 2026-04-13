'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PageTransition from '@/components/PageTransition'
import PricingCard from '@/components/PricingCard'

export default function Home() {
  const handlePricingSelect = (planName: string) => {
    // Navigate to sign-up or checkout with plan selected
    window.location.href = `/auth?plan=${planName.toLowerCase()}`
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <PageTransition>
        <main className="flex-1 w-full">
          {/* Hero Section */}
          <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background gradient effect */}
            <div className="absolute inset-0 -z-10 opacity-30">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent-dark/20 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-sand-900 dark:text-sand-50 leading-tight">
                輸入任何主題，幾分鐘內生成專業影片
              </h1>
              <p className="text-lg md:text-xl text-sand-600 dark:text-sand-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                AI 驅動的影片生成平台。只要輸入主題，我們就能自動產生旁白、配圖的專業影片。
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth"
                  className="px-8 py-4 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
                >
                  免費開始使用
                </Link>
                <a
                  href="#pricing"
                  className="px-8 py-4 border-2 border-accent hover:border-accent-dark text-accent dark:text-accent hover:text-accent-dark dark:hover:text-accent-dark font-semibold rounded-lg transition-colors duration-200 text-lg"
                >
                  查看方案
                </a>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-sand-100/50 dark:bg-sand-900/50">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-sand-900 dark:text-sand-50 mb-4">如何運作</h2>
                <p className="text-sand-500 dark:text-sand-400 text-lg">三個簡單步驟，輕鬆建立你的影片</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                      <span className="text-3xl">⌨️</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="inline-block w-8 h-8 bg-accent text-white rounded-full font-bold text-sm flex items-center justify-center">
                      1
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-sand-900 dark:text-sand-50 mb-2">輸入主題</h3>
                  <p className="text-sand-500 dark:text-sand-400">
                    告訴我們你的影片要講什麼，越詳細越好。
                  </p>
                </div>

                {/* Step 2 */}
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                      <span className="text-3xl">✨</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="inline-block w-8 h-8 bg-accent text-white rounded-full font-bold text-sm flex items-center justify-center">
                      2
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-sand-900 dark:text-sand-50 mb-2">AI 自動生成影片</h3>
                  <p className="text-sand-500 dark:text-sand-400">
                    我們的 AI 會自動產生腳本、旁白和配圖。
                  </p>
                </div>

                {/* Step 3 */}
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                      <span className="text-3xl">📥</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="inline-block w-8 h-8 bg-accent text-white rounded-full font-bold text-sm flex items-center justify-center">
                      3
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-sand-900 dark:text-sand-50 mb-2">下載與分享</h3>
                  <p className="text-sand-500 dark:text-sand-400">
                    下載 HD 影片，隨時分享到各大平台。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-sand-900 dark:text-sand-50 mb-4">強大功能</h2>
                <p className="text-sand-500 dark:text-sand-400 text-lg">打造精彩影片的一切工具</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Feature 1: AI Script Writing */}
                <div className="p-8 bg-sand-100 dark:bg-sand-900/50 border border-sand-300 dark:border-sand-700 rounded-lg hover:border-sand-400 dark:hover:border-sand-600 transition-colors">
                  <div className="text-4xl mb-4">🎬</div>
                  <h3 className="text-xl font-semibold text-sand-900 dark:text-sand-50 mb-3">AI 腳本撰寫</h3>
                  <p className="text-sand-500 dark:text-sand-400">
                    根據你的主題，自動生成引人入勝的專業腳本。
                  </p>
                </div>

                {/* Feature 2: AI Voiceover */}
                <div className="p-8 bg-sand-100 dark:bg-sand-900/50 border border-sand-300 dark:border-sand-700 rounded-lg hover:border-sand-400 dark:hover:border-sand-600 transition-colors">
                  <div className="text-4xl mb-4">🎤</div>
                  <h3 className="text-xl font-semibold text-sand-900 dark:text-sand-50 mb-3">AI 語音旁白</h3>
                  <p className="text-sand-500 dark:text-sand-400">
                    自然語調的旁白，支援多種語言與聲音風格。
                  </p>
                </div>

                {/* Feature 3: AI-Generated Images */}
                <div className="p-8 bg-sand-100 dark:bg-sand-900/50 border border-sand-300 dark:border-sand-700 rounded-lg hover:border-sand-400 dark:hover:border-sand-600 transition-colors">
                  <div className="text-4xl mb-4">🖼️</div>
                  <h3 className="text-xl font-semibold text-sand-900 dark:text-sand-50 mb-3">AI 配圖生成</h3>
                  <p className="text-sand-500 dark:text-sand-400">
                    為腳本每個段落自動產生精美配圖。
                  </p>
                </div>

                {/* Feature 4: HD Video Output */}
                <div className="p-8 bg-sand-100 dark:bg-sand-900/50 border border-sand-300 dark:border-sand-700 rounded-lg hover:border-sand-400 dark:hover:border-sand-600 transition-colors">
                  <div className="text-4xl mb-4">🎥</div>
                  <h3 className="text-xl font-semibold text-sand-900 dark:text-sand-50 mb-3">HD 高畫質輸出</h3>
                  <p className="text-sand-500 dark:text-sand-400">
                    720p 或 1080p 專業品質影片，即刻分享。
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-sand-100/50 dark:bg-sand-900/50">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-sand-900 dark:text-sand-50 mb-4">簡單透明的價格方案</h2>
                <p className="text-sand-500 dark:text-sand-400 text-lg">免費開始，隨時升級。</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Free Plan */}
                <PricingCard
                  name="Free"
                  price={0}
                  period="month"
                  features={[
                    '3 videos per month',
                    '720p resolution',
                    'Watermark included',
                    'Email support',
                  ]}
                  isCurrentPlan={false}
                  isPopular={false}
                  onSelect={() => handlePricingSelect('Free')}
                />

                {/* Starter Plan - Popular */}
                <PricingCard
                  name="Starter"
                  price={19}
                  period="month"
                  features={[
                    '30 videos per month',
                    '1080p resolution',
                    'No watermark',
                    'Priority support',
                  ]}
                  isCurrentPlan={false}
                  isPopular={true}
                  onSelect={() => handlePricingSelect('Starter')}
                />

                {/* Pro Plan */}
                <PricingCard
                  name="Pro"
                  price={49}
                  period="month"
                  features={[
                    '100 videos per month',
                    '1080p resolution',
                    'No watermark',
                    'Priority queue',
                    'API access',
                  ]}
                  isCurrentPlan={false}
                  isPopular={false}
                  onSelect={() => handlePricingSelect('Pro')}
                />
              </div>
            </div>
          </section>
        </main>
      </PageTransition>

      {/* Footer */}
      <Footer />
    </div>
  )
}
