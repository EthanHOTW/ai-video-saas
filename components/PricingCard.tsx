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
          ? 'border-blue-500 bg-gray-800 ring-2 ring-blue-500/20 scale-105'
          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          {isPopular && (
            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
              POPULAR
            </span>
          )}
          {isCurrentPlan && (
            <span className="px-3 py-1 bg-green-600/20 text-green-400 text-xs font-bold rounded-full">
              Current Plan
            </span>
          )}
        </div>

        <div className="mb-2">
          <span className="text-4xl font-bold text-white">${price}</span>
          <span className="text-gray-400 text-sm ml-2">/{period}</span>
        </div>
      </div>

      {/* Features */}
      <div className="p-6 border-b border-gray-700">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-gray-300">{feature}</span>
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
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : isPopular
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
        </button>
      </div>
    </div>
  )
}
