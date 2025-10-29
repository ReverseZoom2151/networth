export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

export function LoadingSkeleton({ className = '', width = 'w-full', height = 'h-4' }: { className?: string; width?: string; height?: string }) {
  return <div className={`skeleton ${width} ${height} ${className}`} />;
}

export function LoadingCard() {
  return (
    <div className="card p-6 space-y-4 animate-pulse">
      <div className="flex items-center gap-4">
        <LoadingSkeleton width="w-12" height="h-12" className="rounded-full" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton width="w-1/2" height="h-4" />
          <LoadingSkeleton width="w-3/4" height="h-3" />
        </div>
      </div>
      <div className="space-y-2">
        <LoadingSkeleton width="w-full" height="h-3" />
        <LoadingSkeleton width="w-5/6" height="h-3" />
        <LoadingSkeleton width="w-4/6" height="h-3" />
      </div>
    </div>
  );
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <div className="text-center space-y-4 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full" />
          <LoadingSpinner size="lg" className="relative mx-auto text-primary-600" />
        </div>
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
}
