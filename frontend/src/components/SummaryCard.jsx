import React, { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw, FiCpu } from 'react-icons/fi';
import { apiService } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

export const SummaryCard = ({ refreshTrigger }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const summaryData = await apiService.getDailySummary();
      setData(summaryData);
    } catch (err) {
      setError(err.message || 'Failed to generate AI summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, refreshTrigger]);

  if (loading && !data) {
    return (
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
        <div className="bg-gradient-to-r from-brand-600 to-indigo-600 px-5.5 py-3.5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <FiCpu className="w-4.5 h-4.5" />
            AI Coach Insights
          </h3>
        </div>
        <div className="p-6 flex justify-center items-center min-h-[140px]">
          <LoadingSpinner text="Consulting AI Coach..." />
        </div>
      </div>
    );
  }

  const summary = data?.summary || 'No tasks found. Try capturing some tasks to get AI-generated feedback.';
  const stats = data?.stats || { pending: 0, completed: 0, total: 0 };

  return (
    <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-brand-500 via-brand-600 to-indigo-650 px-5.5 py-3.5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.8">
          <FiCpu className="w-4.5 h-4.5 animate-pulse" />
          AI Coach Insights
        </h3>
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="p-1.5 hover:bg-white/10 rounded-lg text-brand-100 hover:text-white transition-all disabled:opacity-50 focus:outline-none"
          title="Regenerate Insights"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5.5 space-y-4">
        {error ? (
          <div className="text-center py-4">
            <p className="text-xs text-rose-500 font-medium mb-3.5">{error}</p>
            <button
              onClick={fetchSummary}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-slate-655 dark:text-slate-305 italic">
              "{summary}"
            </p>
            
            {/* stats overview footer */}
            <div className="flex justify-between items-center text-[10px] pt-3.5 border-t border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">
              <span>{stats.pending} Pending</span>
              <span>&bull;</span>
              <span>{stats.completed} Completed</span>
              <span>&bull;</span>
              <span>{stats.total} Total</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
