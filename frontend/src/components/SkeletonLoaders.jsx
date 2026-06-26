import React from 'react';

// Reusable basic pulse block
const PulseBlock = ({ className = 'h-4 bg-[#262626] rounded animate-pulse' }) => (
  <div className={`${className}`} />
);

// 1. Dashboard / Summary Stats Cards Skeleton
export const StatsSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-[#171717] border border-[#262626] p-5 rounded-2xl flex flex-col justify-between min-h-[110px] space-y-4 shadow-lg animate-pulse"
        >
          <div className="flex justify-between items-start w-full">
            <PulseBlock className="h-3 w-20 bg-[#262626] rounded" />
            <PulseBlock className="h-4 w-4 bg-[#262626] rounded-full" />
          </div>
          <PulseBlock className="h-8 w-12 bg-[#262626] rounded mt-2" />
        </div>
      ))}
    </div>
  );
};

// 2. Table Rows / Task Row Skeleton
export const TaskRowSkeleton = ({ count = 5 }) => {
  return (
    <div className="border border-[#262626] bg-[#171717] rounded-2xl overflow-hidden w-full animate-pulse shadow-lg">
      {/* Table header mock */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#0F0F0F] border-b border-[#262626]">
        <div className="col-span-1"><PulseBlock className="h-3 w-4 bg-[#262626]" /></div>
        <div className="col-span-4"><PulseBlock className="h-3 w-24 bg-[#262626]" /></div>
        <div className="col-span-2"><PulseBlock className="h-3 w-16 bg-[#262626]" /></div>
        <div className="col-span-2"><PulseBlock className="h-3 w-16 bg-[#262626]" /></div>
        <div className="col-span-2"><PulseBlock className="h-3 w-16 bg-[#262626]" /></div>
        <div className="col-span-1"><PulseBlock className="h-3 w-4 bg-[#262626]" /></div>
      </div>
      
      {/* Table rows mock */}
      <div className="divide-y divide-[#262626]/50">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-4.5 items-center">
            {/* Checkbox */}
            <div className="col-span-1 flex justify-center">
              <PulseBlock className="h-4.5 w-4.5 bg-[#262626] rounded" />
            </div>
            {/* Title / Description */}
            <div className="col-span-4 space-y-1.5">
              <PulseBlock className="h-3.5 w-44 bg-[#262626]" />
              <PulseBlock className="h-2.5 w-24 bg-[#262626]/60" />
            </div>
            {/* Category */}
            <div className="col-span-2">
              <PulseBlock className="h-5 w-16 bg-[#262626] rounded-lg" />
            </div>
            {/* Priority */}
            <div className="col-span-2">
              <PulseBlock className="h-5 w-16 bg-[#262626] rounded-lg" />
            </div>
            {/* Timeline */}
            <div className="col-span-2 space-y-1">
              <PulseBlock className="h-3 w-20 bg-[#262626]" />
            </div>
            {/* More button */}
            <div className="col-span-1 flex justify-center">
              <PulseBlock className="h-4 w-1 bg-[#262626]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Notes Grid Cards Skeleton
export const NoteCardSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-[#171717] border border-[#262626] p-5 rounded-2xl min-h-[160px] flex flex-col justify-between space-y-4 animate-pulse shadow-lg"
        >
          {/* Header */}
          <div className="flex justify-between items-center w-full">
            <PulseBlock className="h-3 w-24 bg-[#262626]" />
            <div className="flex space-x-1">
              <PulseBlock className="h-6 w-6 bg-[#262626] rounded-lg" />
              <PulseBlock className="h-6 w-6 bg-[#262626] rounded-lg" />
            </div>
          </div>
          
          {/* Text block */}
          <div className="space-y-2 flex-grow mt-2">
            <PulseBlock className="h-3 w-full bg-[#262626]" />
            <PulseBlock className="h-3 w-[85%] bg-[#262626]" />
            <PulseBlock className="h-3 w-[60%] bg-[#262626]" />
          </div>
          
          {/* Tags */}
          <div className="flex gap-1.5 pt-3 border-t border-[#262626]/40">
            <PulseBlock className="h-4.5 w-12 bg-[#262626] rounded-lg" />
            <PulseBlock className="h-4.5 w-10 bg-[#262626] rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default {
  StatsSkeleton,
  TaskRowSkeleton,
  NoteCardSkeleton
};
