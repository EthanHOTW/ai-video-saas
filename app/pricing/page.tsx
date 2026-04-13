'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PageTransition from '@/components/PageTransition'
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
      features: ['每月 3 支影片', '720p 解析度', '含浮水印', '信箱客服'],
      isPopular: false,
    },
    {
      name: 'Starter',
      price: 19,
      period: 'mo',
      features: ['每月 30 支影片', '1080p 解析度', '無浮水印', '優先客服'],
      isPopular: true,
    },
    {
      name: 'Pro',
      price: 49,
      period: 'mo',
      features: ['每月 100 支影片', '1080p 解析度', '無浮水印', '優先排隊', 'API 存取'],
      isPopular: false,
    },
  ]

  const handleSelectPlan = () => {
    alert('Stripe 付款功能即將上線！')
  }

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full">
        <Navbar user={user} />

        <main className="flex-1 w-full pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header Section */}
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl font-bold text-sand-900 dark:text-sand-50 mb-4">
                簡單透明的價格方案
              </h1>
              <p className="text-sand-500 dark:text-sand-400 text-lg max-w-2xl mx-auto">
                選擇最適合你的方案，隨時可以升級或降級。
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
            <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-8 mt-20">
              <h2 className="text-2xl font-bold text-sand-900 dark:text-sand-50 mb-8">常見問題</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-sand-900 dark:text-sand-50 mb-2">可以隨時更換方案嗎？</h3>
                  <p className="text-sand-500 dark:text-sand-400">
                    可以，隨時升級或降級方案，變更即時生效。
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-sand-900 dark:text-sand-50 mb-2">降級後我的影片會怎樣？</h3>
                  <p className="text-sand-500 dark:text-sand-400">
                    所有現有影片仍可存取，只是無法使用前一方案的專屬功能。
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-sand-900 dark:text-sand-50 mb-2">有提供年繳方案嗎？</h3>
                  <p className="text-sand-500 dark:text-sand-400">
                    即將推出！如需企業客製方案，請聯繫我們的團隊。
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-sand-900 dark:text-sand-50 mb-2">可以隨時取消嗎？</h3>
                  <p className="text-sand-500 dark:text-sand-400">
                    可以，隨時取消訂閱，無需任何理由，也不收取取消費用。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </PageTransition>
  )
}
