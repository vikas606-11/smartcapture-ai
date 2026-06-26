import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
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
      <div className="bg-[#171717] border border-[#262626] rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-[#0D0D0D] px-5.5 py-3.5 border-b border-[#262626] flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-[#DC2626]" />
            <span>AI Coach Insights</span>
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
    <div className="bg-[#171717] border border-[#262626] rounded-2xl shadow-lg overflow-hidden">
      
      {/* Header */}
      <div className="bg-[#0D0D0D] px-5.5 py-3.5 border-b border-[#262626] flex items-center justify-between">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4.5 h-4.5 text-[#DC2626] animate-pulse" />
          <span>AI Coach Insights</span>
        </h3>
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="p-1.5 hover:bg-[#262626] rounded-lg text-[#737373] hover:text-white transition-colors disabled:opacity-50 focus:outline-none"
          title="Regenerate Insights"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5.5 space-y-4">
        {error ? (
          <div className="text-center py-4">
            <p className="text-xs text-[#DC2626] font-medium mb-3.5">{error}</p>
            <button
              onClick={fetchSummary}
              className="px-3.5 py-1.5 border border-[#262626] hover:border-white bg-[#0F0F0F] text-xs font-bold rounded-xl transition-all"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-[#A3A3A3] italic bg-[#0F0F0F] p-4 rounded-xl border border-[#262626]/60">
              "{summary}"
            </p>
            
            {/* Stats list footer */}
            <div className="flex justify-between items-center text-[10px] pt-3.5 border-t border-[#262626] text-[#737373] font-extrabold uppercase tracking-wider">
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
