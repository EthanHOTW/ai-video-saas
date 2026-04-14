import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})

// Plan configurations
export const PLANS = {
  free: {
    name: 'Free',
    nameZh: '免費方案',
    price: 0,
    credits: 3,
    priceId: null, // no Stripe price for free
  },
  starter: {
    name: 'Starter',
    nameZh: '入門方案',
    price: 19,
    credits: 30,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || null,
  },
  pro: {
    name: 'Pro',
    nameZh: '專業方案',
    price: 49,
    credits: 100,
    priceId: process.env.STRIPE_PRO_PRICE_ID || null,
  },
} as const

export type PlanKey = keyof typeof PLANS
