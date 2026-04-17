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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          setUser({
            email: authUser.email || '',
            display_name: authUser.user_metadata?.display_name || authUser.email || '',
          })
          const { data: profileData } = await supabase
            .from('profiles').select('*').eq('id', authUser.id).single()
          if (profileData) setProfile(profileData)
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
      monthlyPrice: 0,
      yearlyPrice: 0,
      credits: 5,
      maxTier: 'Flash (15-30秒)',
      features: [
        '每月 5 點',
        '最多 5 支 Flash 短影片',
        '720p 解析度',
        '含浮水印',
        '信箱客服',
      ],
      isPopular: false,
    },
    {
      name: 'Starter',
      monthlyPrice: 19,
      yearlyPrice: 182,
      credits: 50,
      maxTier: 'Standard (30-60秒)',
      features: [
        '每月 50 點',
        'Flash (1點) + Standard (3點)',
        '1080p 解析度',
        '無浮水印',
        '優先客服',
        '同時 2 個任務',
      ],
      isPopular: true,
    },
    {
      name: 'Pro',
      monthlyPrice: 49,
      yearlyPrice: 470,
      credits: 150,
      maxTier: 'Premium (60-120秒)',
      features: [
        '每月 150 點',
        '全部長度等級',
        '1080p 解析度',
        '無浮水印',
        '優先排隊',
        '同時 5 個任務',
        'API 存取',
      ],
      isPopular: false,
    },
  ]

  const creditPacks = [
    { name: '10 點', credits: 10, price: 4.99 },
    { name: '50 點', credits: 50, price: 19.99 },
    { name: '200 點', credits: 200, price: 59.99 },
  ]

  const handleSelectPlan = async (planName: string) => {
    const plan = planName.toLowerCase()
    if (plan === 'free') return
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing_cycle: billingCycle }),
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || '建立付款連結失敗')
    } catch (err) {
      console.error(err)
      alert('發生錯誤，請稍後再試')
    }
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || '無法開啟管理頁面')
    } catch (err) {
      console.error(err)
      alert('發生錯誤，請稍後再試')
    }
  }

  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen w-full">
        <Navbar user={user} />

        <main className="flex-1 w-full pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-sand-900 dark:text-sand-50 mb-4">
                簡單透明的點數制
              </h1>
              <p className="text-sand-500 dark:text-sand-400 text-lg max-w-2xl mx-auto mb-8">
                選擇方案獲得每月點數，依影片長度消耗不同點數。不夠用時隨時加購。
              </p>

              {/* Billing toggle */}
              <div className="inline-flex items-center bg-sand-200 dark:bg-sand-800 rounded-full p-1">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${billingCycle === 'monthly'
                      ? 'bg-white dark:bg-sand-700 text-sand-900 dark:text-sand-50 shadow-sm'
                      : 'text-sand-500 dark:text-sand-400'}`}
                >
                  月繳
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                    ${billingCycle === 'yearly'
                      ? 'bg-white dark:bg-sand-700 text-sand-900 dark:text-sand-50 shadow-sm'
                      : 'text-sand-500 dark:text-sand-400'}`}
                >
                  年繳 <span className="text-accent font-bold">省 20%</span>
                </button>
              </div>
            </div>

            {/* Credits explanation */}
            <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-6 mb-12">
              <h3 className="text-lg font-semibold text-sand-900 dark:text-sand-50 mb-3">點數消耗說明</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="font-semibold text-sand-900 dark:text-sand-50">Flash (15-30秒)</div>
                    <div className="text-sm text-accent font-bold">1 點/支</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🎬</span>
                  <div>
                    <div className="font-semibold text-sand-900 dark:text-sand-50">Standard (30-60秒)</div>
                    <div className="text-sm text-accent font-bold">3 點/支</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👑</span>
                  <div>
                    <div className="font-semibold text-sand-900 dark:text-sand-50">Premium (60-120秒)</div>
                    <div className="text-sm text-accent font-bold">8 點/支</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {plans.map((plan) => (
                <PricingCard
                  key={plan.name}
                  name={plan.name}
                  price={billingCycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)}
                  period="mo"
                  features={plan.features}
                  isPopular={plan.isPopular}
                  isCurrentPlan={profile?.plan === plan.name.toLowerCase()}
                  onSelect={() => handleSelectPlan(plan.name)}
                />
              ))}
            </div>

            {/* Credit Packs */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-sand-900 dark:text-sand-50 text-center mb-8">加購點數包</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {creditPacks.map((pack) => (
                  <div key={pack.name} className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-6 text-center">
                    <div className="text-3xl font-bold text-sand-900 dark:text-sand-50 mb-1">{pack.credits} 點</div>
                    <div className="text-2xl font-bold text-accent mb-2">${pack.price}</div>
                    <div className="text-sm text-sand-500 dark:text-sand-400 mb-4">
                      ${(pack.price / pack.credits).toFixed(2)} / 點
                    </div>
                    <button className="w-full px-4 py-2 bg-sand-200 dark:bg-sand-800 hover:bg-sand-300 dark:hover:bg-sand-700 text-sand-900 dark:text-sand-50 rounded-lg transition-colors text-sm font-medium">
                      加購
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-sand-400 dark:text-sand-500 mt-4">加購點數永不過期，每月方案點數到期不累計</p>
            </div>

            {/* Manage Subscription */}
            {profile?.plan && profile.plan !== 'free' && (
              <div className="mb-16 text-center">
                <button
                  onClick={handleManageSubscription}
                  className="px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-lg transition-colors"
                >
                  管理訂閱
                </button>
              </div>
            )}

            {/* FAQ */}
            <div className="bg-sand-100 dark:bg-sand-900 border border-sand-300 dark:border-sand-700 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-sand-900 dark:text-sand-50 mb-8">常見問題</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-sand-900 dark:text-sand-50 mb-2">點數怎麼計算？</h3>
                  <p className="text-sand-500 dark:text-sand-400">
                    根據影片長度消耗不同點數：Flash (15-30秒) 消耗 1 點，Standard (30-60秒) 消耗 3 點，Premium (60-120秒) 消耗 8 點。生成失敗會自動退還全部點數。
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-sand-900 dark:text-sand-50 mb-2">可以隨時更換方案嗎？</h3>
                  <p className="text-sand-500 dark:text-sand-400">
                    可以，隨時升級或降級方案，變更即時生效。升級後立即獲得新方案的點數額度。
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-sand-900 dark:text-sand-50 mb-2">加購的點數會過期嗎？</h3>
                  <p className="text-sand-500 dark:text-sand-400">
                    不會。加購的點數包永不過期。只有每月方案附贈的點數會在月底重設。
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-sand-900 dark:text-sand-50 mb-2">免費方案可以用 Standard 或 Premium 嗎？</h3>
                  <p className="text-sand-500 dark:text-sand-400">
                    免費方案僅支援 Flash (15-30秒)。升級到 Starter 可使用 Standard，升級到 Pro 可使用全部長度。
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
