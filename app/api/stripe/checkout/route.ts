import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS, type PlanKey } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未登入' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { plan } = body as { plan: string }

    if (!plan || !['starter', 'pro'].includes(plan)) {
      return NextResponse.json({ error: '無效的方案' }, { status: 400 })
    }

    const planKey = plan as PlanKey
    const planConfig = PLANS[planKey]

    if (!planConfig.priceId) {
      return NextResponse.json({ error: '該方案無法進行結帳' }, { status: 400 })
    }

    // Get user's profile to check for existing Stripe customer
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      return NextResponse.json({ error: '無法獲取用戶資料' }, { status: 400 })
    }

    let customerId = profileData?.stripe_customer_id

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Save the customer ID to the profile
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    // Get the origin for redirect URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000'

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
      metadata: {
        supabase_user_id: user.id,
        plan: planKey,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: '無法建立付款連結' }, { status: 500 })
  }
}
