import React from 'react';

export const LoadingSpinner = ({ text = 'Loading...', fullScreen = false }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-12 h-12">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-brand-100 dark:border-brand-950/20"></div>
        {/* Spinning Arc */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin"></div>
      </div>
      {text && (
        <p className="mt-3.5 text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm transition-all duration-300">
        <div className="p-6 bg-white dark:bg-dark-card rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xl max-w-xs w-full">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
