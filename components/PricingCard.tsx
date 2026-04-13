'use client'

interface PricingCardProps {
  name: string
  price: number
  period: string
  features: string[]
  isCurrentPlan?: boolean
  isPopular?: boolean
  onSelect: () => void
}

export default function PricingCard({
  name,
  price,
  period,
  features,
  isCurrentPlan = false,
  isPopular = false,
  onSelect,
}: PricingCardProps) {
  return (
    <div
      className={`rounded-lg border transition-all duration-300 ${
        isPopular
          ? 'border-accent bg-sand-100 dark:bg-sand-900 ring-2 ring-accent/20 scale-105'
          : 'border-sand-300 dark:border-sand-700 bg-sand-100 dark:bg-sand-900 hover:border-sand-400 dark:hover:border-sand-600'
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-sand-300 dark:border-sand-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-sand-900 dark:text-sand-50">{name}</h3>
          {isPopular && (
            <span className="px-3 py-1 bg-accent text-white text-xs font-bold rounded-full">
              熱門
            </span>
          )}
          {isCurrentPlan && (
            <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded-full">
              目前方案
            </span>
          )}
        </div>

        <div className="mb-2">
          <span className="text-4xl font-bold text-sand-900 dark:text-sand-50">${price}</span>
          <span className="text-sand-500 dark:text-sand-400 text-sm ml-2">/{period}</span>
        </div>
      </div>

      {/* Features */}
      <div className="p-6 border-b border-sand-300 dark:border-sand-700">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-sand-600 dark:text-sand-300">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <div className="p-6">
        <button
          onClick={onSelect}
          disabled={isCurrentPlan}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors text-sm ${
            isCurrentPlan
              ? 'bg-sand-200 dark:bg-sand-700 text-sand-500 dark:text-sand-400 cursor-not-allowed'
              : isPopular
                ? 'bg-accent text-white hover:bg-accent/90'
                : 'bg-sand-200 dark:bg-sand-700 text-sand-900 dark:text-sand-50 hover:bg-sand-300 dark:hover:bg-sand-600'
          }`}
        >
          {isCurrentPlan ? '目前方案' : '選擇方案'}
        </button>
      </div>
    </div>
  )
}
