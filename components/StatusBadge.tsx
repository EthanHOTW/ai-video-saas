interface StatusBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const baseClasses = 'inline-block px-3 py-1 rounded-full text-xs font-semibold'

  const statusConfig = {
    pending: {
      classes: `${baseClasses} bg-yellow-500/20 text-yellow-300`,
      label: '等待中',
    },
    processing: {
      classes: `${baseClasses} bg-blue-500/20 text-blue-300 animate-pulse`,
      label: '處理中',
    },
    completed: {
      classes: `${baseClasses} bg-green-500/20 text-green-300`,
      label: '已完成',
    },
    failed: {
      classes: `${baseClasses} bg-red-500/20 text-red-300`,
      label: '失敗',
    },
  }

  const config = statusConfig[status]

  return <span className={config.classes}>{config.label}</span>
}
