import React, { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
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

  // Reload when parent triggers a re-render
  useEffect(() => {
    fetchProductivity();
  }, [fetchProductivity, refreshTrigger]);

  if (loading && !data) {
    return (
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-5.5 shadow-sm flex items-center justify-center min-h-[220px] transition-all duration-300">
        <LoadingSpinner text="Computing score..." />
      </div>
    );
  }

  const score = data?.score || 0;
  const total = data?.total || 0;
  const completed = data?.completed || 0;
  const pending = data?.pending || 0;
  const categories = data?.by_category || {};

  // Score status colors
  let scoreColor = 'text-rose-500';
  let strokeColor = 'stroke-rose-500';
  let progressBg = 'bg-rose-500';
  
  if (score > 40 && score <= 70) {
    scoreColor = 'text-amber-500';
    strokeColor = 'stroke-amber-500';
    progressBg = 'bg-amber-500';
  } else if (score > 70) {
    scoreColor = 'text-emerald-500';
    strokeColor = 'stroke-emerald-500';
    progressBg = 'bg-emerald-500';
  }

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-5.5 shadow-sm transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-4.5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <FiTrendingUp className="text-brand-500 w-4.5 h-4.5" />
          Productivity Analyzer
        </h3>
        <button
          onClick={fetchProductivity}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition-all focus:outline-none"
          title="Recalculate Score"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="text-center py-6">
          <p className="text-xs text-rose-500 font-medium mb-3">{error}</p>
          <button
            onClick={fetchProductivity}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Ring + Counts */}
          <div className="flex items-center space-x-5">
            {/* SVG Ring Progress */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-slate-100 dark:stroke-slate-800/80 fill-transparent"
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

            {/* Micro Cards Grid */}
            <div className="flex-1 grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <span className="block text-base font-extrabold text-slate-800 dark:text-slate-100">
                  {total}
                </span>
                <span className="text-4xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Total
                </span>
              </div>
              <div className="text-center p-2 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/10">
                <span className="block text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {completed}
                </span>
                <span className="text-4xs font-bold text-emerald-500 dark:text-emerald-500 uppercase tracking-widest">
                  Done
                </span>
              </div>
              <div className="text-center p-2 rounded-xl bg-amber-50/40 dark:bg-amber-950/10">
                <span className="block text-base font-extrabold text-amber-600 dark:text-amber-400">
                  {pending}
                </span>
                <span className="text-4xs font-bold text-amber-500 dark:text-amber-500 uppercase tracking-widest">
                  Open
                </span>
              </div>
            </div>
          </div>

          {/* Categories Grid Table */}
          {Object.keys(categories).length > 0 && (
            <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-2xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
                Categories Breakdown
              </h4>
              <div className="space-y-2">
                {Object.entries(categories).map(([cat, counts]) => {
                  const catPercent = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
                  return (
                    <div key={cat} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-705 dark:text-slate-350">{cat}</span>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-slate-450 dark:text-slate-400">
                          {counts.completed}/{counts.total} ({catPercent}%)
                        </span>
                        <div className="w-14 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
