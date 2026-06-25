import React from 'react';

// Reusable basic pulse block
const PulseBlock = ({ className = 'h-4 bg-[#2B2B2B] rounded' }) => (
  <div className={`animate-pulse ${className}`} />
);

// 1. Dashboard / Summary Stats Cards Skeleton
export const StatsSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-[#171717] border border-[#2B2B2B] p-5 rounded-2xl flex flex-col justify-between min-h-[110px] space-y-4"
        >
          <div className="flex justify-between items-start w-full">
            <PulseBlock className="h-3 w-20 bg-[#2B2B2B] rounded" />
            <PulseBlock className="h-4 w-4 bg-[#2B2B2B] rounded-full" />
          </div>
          <PulseBlock className="h-8 w-12 bg-[#2B2B2B] rounded mt-2" />
        </div>
      ))}
    </div>
  );
};

// 2. Table Rows / Task Row Skeleton
export const TaskRowSkeleton = ({ count = 5 }) => {
  return (
    <div className="border border-[#2B2B2B] bg-[#171717] rounded-2xl overflow-hidden w-full">
      {/* Table header mock */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#101010] border-b border-[#2B2B2B]">
        <div className="col-span-1"><PulseBlock className="h-3 w-4 bg-[#2B2B2B]" /></div>
        <div className="col-span-4"><PulseBlock className="h-3 w-24 bg-[#2B2B2B]" /></div>
        <div className="col-span-2"><PulseBlock className="h-3 w-16 bg-[#2B2B2B]" /></div>
        <div className="col-span-2"><PulseBlock className="h-3 w-16 bg-[#2B2B2B]" /></div>
        <div className="col-span-2"><PulseBlock className="h-3 w-16 bg-[#2B2B2B]" /></div>
        <div className="col-span-1"><PulseBlock className="h-3 w-4 bg-[#2B2B2B]" /></div>
      </div>
      
      {/* Table rows mock */}
      <div className="divide-y divide-[#2B2B2B]/60">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-4.5 items-center">
            {/* Checkbox */}
            <div className="col-span-1 flex justify-center">
              <PulseBlock className="h-4.5 w-4.5 bg-[#2B2B2B] rounded" />
            </div>
            {/* Title / Description */}
            <div className="col-span-4 space-y-1.5">
              <PulseBlock className="h-3.5 w-44 bg-[#2B2B2B]" />
              <PulseBlock className="h-2.5 w-24 bg-[#2B2B2B]/75" />
            </div>
            {/* Category */}
            <div className="col-span-2">
              <PulseBlock className="h-5 w-16 bg-[#2B2B2B] rounded-lg" />
            </div>
            {/* Priority */}
            <div className="col-span-2">
              <PulseBlock className="h-5 w-16 bg-[#2B2B2B] rounded-lg" />
            </div>
            {/* Timeline */}
            <div className="col-span-2 space-y-1">
              <PulseBlock className="h-3 w-20 bg-[#2B2B2B]" />
            </div>
            {/* More button */}
            <div className="col-span-1 flex justify-center">
              <PulseBlock className="h-4 w-1 bg-[#2B2B2B]" />
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
          className="bg-[#171717] border border-[#2B2B2B] p-5 rounded-2xl min-h-[160px] flex flex-col justify-between space-y-4"
        >
          {/* Header */}
          <div className="flex justify-between items-center w-full">
            <PulseBlock className="h-3 w-24 bg-[#2B2B2B]" />
            <div className="flex space-x-1">
              <PulseBlock className="h-6 w-6 bg-[#2B2B2B] rounded-lg" />
              <PulseBlock className="h-6 w-6 bg-[#2B2B2B] rounded-lg" />
            </div>
          </div>
          
          {/* Text block */}
          <div className="space-y-2 flex-grow mt-2">
            <PulseBlock className="h-3 w-full bg-[#2B2B2B]" />
            <PulseBlock className="h-3 w-[85%] bg-[#2B2B2B]" />
            <PulseBlock className="h-3 w-[60%] bg-[#2B2B2B]" />
          </div>
          
          {/* Tags */}
          <div className="flex gap-1.5 pt-3 border-t border-[#2B2B2B]/40">
            <PulseBlock className="h-4.5 w-12 bg-[#2B2B2B] rounded-lg" />
            <PulseBlock className="h-4.5 w-10 bg-[#2B2B2B] rounded-lg" />
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
