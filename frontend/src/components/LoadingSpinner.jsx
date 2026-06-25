import React from 'react';

export const LoadingSpinner = ({ text = 'Loading...', fullScreen = false }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-10 h-10">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-[#2B2B2B]"></div>
        {/* Spinning Arc */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#DC2626] animate-spin"></div>
      </div>
      {text && (
        <p className="mt-3.5 text-xs font-semibold text-[#808080] animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300">
        <div className="p-6 bg-[#171717] rounded-2xl border border-[#2B2B2B] shadow-2xl max-w-xs w-full">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
