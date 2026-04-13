'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
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
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background gradient effect */}
          <div className="absolute inset-0 -z-10 opacity-30">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
              Turn Any Topic into a Professional Video in Minutes
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              AI-powered video generation. Just type a topic, and we&apos;ll create a narrated video with custom images.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
              >
                Get Started Free
              </Link>
              <a
                href="#pricing"
                className="px-8 py-4 border-2 border-blue-600 hover:border-blue-500 text-blue-400 hover:text-blue-300 font-semibold rounded-lg transition-colors duration-200 text-lg"
              >
                See Pricing
              </a>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-gray-400 text-lg">Three simple steps to create your video</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">⌨️</span>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="inline-block w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm flex items-center justify-center">
                    1
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Enter a Topic</h3>
                <p className="text-gray-400">
                  Tell us what your video should be about. Be as specific or general as you&apos;d like.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">✨</span>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="inline-block w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm flex items-center justify-center">
                    2
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">AI Creates Your Video</h3>
                <p className="text-gray-400">
                  Our AI generates a script, voiceover, and matching images automatically.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">📥</span>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="inline-block w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm flex items-center justify-center">
                    3
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Download &amp; Share</h3>
                <p className="text-gray-400">
                  Download your video in HD and share it everywhere instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
              <p className="text-gray-400 text-lg">Everything you need to create stunning videos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Feature 1: AI Script Writing */}
              <div className="p-8 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
                <div className="text-4xl mb-4">🎬</div>
                <h3 className="text-xl font-semibold text-white mb-3">AI Script Writing</h3>
                <p className="text-gray-400">
                  Automatically generates engaging, well-structured scripts tailored to your topic in seconds.
                </p>
              </div>

              {/* Feature 2: AI Voiceover */}
              <div className="p-8 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
                <div className="text-4xl mb-4">🎤</div>
                <h3 className="text-xl font-semibold text-white mb-3">AI Voiceover</h3>
                <p className="text-gray-400">
                  Natural-sounding narration in multiple languages and voices to match your brand.
                </p>
              </div>

              {/* Feature 3: AI-Generated Images */}
              <div className="p-8 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
                <div className="text-4xl mb-4">🖼️</div>
                <h3 className="text-xl font-semibold text-white mb-3">AI-Generated Images</h3>
                <p className="text-gray-400">
                  Beautiful custom images are created to match every part of your script automatically.
                </p>
              </div>

              {/* Feature 4: HD Video Output */}
              <div className="p-8 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
                <div className="text-4xl mb-4">🎥</div>
                <h3 className="text-xl font-semibold text-white mb-3">HD Video Output</h3>
                <p className="text-gray-400">
                  Professional-quality videos at 720p or 1080p depending on your plan. Ready to share anywhere.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
              <p className="text-gray-400 text-lg">Start free. Upgrade as you grow.</p>
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

      {/* Footer */}
      <Footer />
    </div>
  )
}
