import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { apiService } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

export const ProductivityCard = ({ refreshTrigger }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProductivity = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const prod = await apiService.getProductivity();
      setData(prod);
    } catch (err) {
      setError(err.message || 'Failed to fetch productivity score.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductivity();
  }, [fetchProductivity, refreshTrigger]);

  if (loading && !data) {
    return (
      <div className="bg-[#171717] border border-[#262626] rounded-2xl p-5 shadow-sm flex items-center justify-center min-h-[220px]">
        <LoadingSpinner text="Analyzing stats..." />
      </div>
    );
  }

  const score = data?.score || 0;
  const total = data?.total || 0;
  const completed = data?.completed || 0;
  const pending = data?.pending || 0;
  const categories = data?.by_category || {};

  let scoreColor = 'text-[#DC2626]';
  let strokeColor = 'stroke-[#DC2626]';
  let progressBg = 'bg-[#DC2626]';
  
  if (score > 40 && score <= 70) {
    scoreColor = 'text-[#F59E0B]';
    strokeColor = 'stroke-[#F59E0B]';
    progressBg = 'bg-[#F59E0B]';
  } else if (score > 70) {
    scoreColor = 'text-[#22C55E]';
    strokeColor = 'stroke-[#22C55E]';
    progressBg = 'bg-[#22C55E]';
  }

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-[#171717] border border-[#262626] rounded-2xl p-5 shadow-lg">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="text-[#DC2626] w-4.5 h-4.5" />
          <span>Productivity Analyzer</span>
        </h3>
        <button
          onClick={fetchProductivity}
          className="p-1.5 hover:bg-[#262626] rounded-lg text-[#737373] hover:text-white transition-colors focus:outline-none"
          title="Recalculate Score"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="text-center py-6">
          <p className="text-xs text-[#DC2626] font-medium mb-3">{error}</p>
          <button
            onClick={fetchProductivity}
            className="px-3.5 py-1.5 border border-[#262626] hover:border-white bg-[#0F0F0F] text-xs font-bold rounded-xl transition-all"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Circular ring & counters grid */}
          <div className="flex items-center space-x-5">
            {/* SVG Ring Progress */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-[#262626] fill-transparent"
                  strokeWidth="6"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className={`${strokeColor} fill-transparent transition-all duration-500 ease-out`}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-base font-extrabold leading-none ${scoreColor}`}>
                  {score}%
                </span>
              </div>
            </div>

            {/* Counts grid */}
            <div className="flex-1 grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-xl bg-[#0F0F0F] border border-[#262626]">
                <span className="block text-sm font-bold text-white">
                  {total}
                </span>
                <span className="text-[9px] font-bold text-[#737373] uppercase tracking-wider">
                  Total
                </span>
              </div>
              <div className="text-center p-2 rounded-xl bg-[#0F0F0F] border border-[#262626]">
                <span className="block text-sm font-bold text-[#22C55E]">
                  {completed}
                </span>
                <span className="text-[9px] font-bold text-[#22C55E]/80 uppercase tracking-wider">
                  Done
                </span>
              </div>
              <div className="text-center p-2 rounded-xl bg-[#0F0F0F] border border-[#262626]">
                <span className="block text-sm font-bold text-[#F59E0B]">
                  {pending}
                </span>
                <span className="text-[9px] font-bold text-[#F59E0B]/80 uppercase tracking-wider">
                  Open
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown table */}
          {Object.keys(categories).length > 0 && (
            <div className="pt-4 border-t border-[#262626]">
              <h4 className="text-[10px] font-extrabold text-[#737373] uppercase tracking-wider mb-3">
                Categories Breakdown
              </h4>
              <div className="space-y-2.5">
                {Object.entries(categories).map(([cat, counts]) => {
                  const catPercent = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
                  return (
                    <div key={cat} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#A3A3A3]">{cat}</span>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-[#FFFFFF]">
                          {counts.completed}/{counts.total} ({catPercent}%)
                        </span>
                        <div className="w-14 h-1 rounded-full bg-[#262626] overflow-hidden">
                          <div
                            className={`h-full ${progressBg} rounded-full transition-all duration-300`}
                            style={{ width: `${catPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default ProductivityCard;
