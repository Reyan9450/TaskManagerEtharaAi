interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
}

/**
 * Reusable loading spinner.
 * Usage: <Spinner /> or <Spinner size="lg" />
 * Requirements: 11.2
 */
export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-spin rounded-full border-gray-200 border-t-blue-600 ${sizeMap[size]} ${className}`}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64 w-full">
      <Spinner size="lg" />
    </div>
  )
}
