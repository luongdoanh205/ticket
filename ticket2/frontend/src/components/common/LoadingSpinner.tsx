import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  message = 'Đang tải dữ liệu...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div
        className={`${sizeClasses[size]} border-rose-500/20 border-t-rose-500 rounded-full animate-spin`}
      />
      {message && <p className="text-sm font-medium text-slate-400">{message}</p>}
    </div>
  );
};
