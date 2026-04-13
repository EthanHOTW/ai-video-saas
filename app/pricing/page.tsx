'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PricingCard from '@/components/PricingCard'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

export default function PricingPage() {
  const [user, setUser] = useState<{ email: string; display_name: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (authUser) {
          setUser({
            email: authUser.email || '',
            display_name: authUser.user_metadata?.display_name || authUser.email || '',
          })

          // Fetch profile to get current plan
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (profileData) {
            setProfile(profileData)
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [])

  const plans = [
    {
      name: 'Free',
      price: 0,
      period: 'mo',
      features: ['3 videos/month', '720p resolution', 'Watermark', 'Email support'],
      isPopular: false,
    },
    {
      name: 'Starter',
      price: 19,
      period: 'mo',
      features: ['30 videos/month', '1080p resolution', 'No watermark', 'Priority support'],
      isPopular: true,
    },
    {
      name: 'Pro',
      price: 49,
      period: 'mo',
      features: ['100 videos/month', '1080p resolution', 'No watermark', 'Priority queue', 'API access'],
      isPopular: false,
    },
  ]

  const handleSelectPlan = () => {
    alert('Stripe integration coming soon!')
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navbar user={user} />

      <main className="flex-1 w-full pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Choose the perfect plan for your video creation needs. Upgrade or downgrade anytime.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan) => (
              <PricingCard
                key={plan.name}
                name={plan.name}
                price={plan.price}
                period={plan.period}
                features={plan.features}
                isPopular={plan.isPopular}
                isCurrentPlan={profile?.plan === plan.name.toLowerCase()}
                onSelect={() => handleSelectPlan()}
              />
            ))}
          </div>

          {/* FAQ Section */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 mt-20">
            <h2 className="text-2xl font-bold text-white mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Can I change my plan anytime?</h3>
                <p className="text-gray-400">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">What happens to my videos if I downgrade?</h3>
                <p className="text-gray-400">
                  All your existing videos remain accessible. You just lose access to features exclusive to your previous plan.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Do you offer annual billing?</h3>
                <p className="text-gray-400">
                  Coming soon! Contact our team for custom enterprise pricing.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-400">
                  Yes, cancel your subscription anytime. No questions asked, no cancellation fees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
