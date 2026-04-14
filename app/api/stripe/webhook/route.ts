import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe, PLANS, type PlanKey } from '@/lib/stripe'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Read the raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    // Construct the event using the raw body
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      )
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const plan = session.metadata?.plan as PlanKey | undefined

        if (!userId || !plan || !PLANS[plan]) {
          console.error('Invalid metadata in checkout session:', session.metadata)
          break
        }

        const planConfig = PLANS[plan]

        // Update user's plan and credits
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            plan: plan,
            credits_remaining: planConfig.credits,
            stripe_customer_id: session.customer as string,
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Error updating profile after checkout:', updateError)
        } else {
          console.log(`User ${userId} upgraded to ${plan} plan`)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get the user by stripe_customer_id
        const { data: profiles, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (fetchError || !profiles) {
          console.error('Could not find user for subscription update:', fetchError)
          break
        }

        // Find the new plan from subscription items
        const priceId = subscription.items.data[0]?.price.id

        let newPlan: PlanKey | null = null
        for (const [key, config] of Object.entries(PLANS)) {
          if (config.priceId === priceId) {
            newPlan = key as PlanKey
            break
          }
        }

        if (newPlan && PLANS[newPlan]) {
          const planConfig = PLANS[newPlan]
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              plan: newPlan,
              credits_remaining: planConfig.credits,
            })
            .eq('id', profiles.id)

          if (updateError) {
            console.error('Error updating profile on subscription update:', updateError)
          } else {
            console.log(`Subscription for user ${profiles.id} updated to ${newPlan}`)
          }
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get the user by stripe_customer_id
        const { data: profiles, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (fetchError || !profiles) {
          console.error('Could not find user for subscription deletion:', fetchError)
          break
        }

        // Downgrade to free plan
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            plan: 'free',
            credits_remaining: PLANS.free.credits,
          })
          .eq('id', profiles.id)

        if (updateError) {
          console.error('Error downgrading user on subscription deletion:', updateError)
        } else {
          console.log(`User ${profiles.id} downgraded to free plan`)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
