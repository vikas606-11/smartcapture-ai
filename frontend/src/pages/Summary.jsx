import React, { useState, useEffect, useCallback } from 'react';
import { FiTrendingUp, FiCpu, FiPieChart, FiActivity, FiCheckCircle, FiPlusCircle } from 'react-icons/fi';
import { apiService } from '../services/api';
import SummaryCard from '../components/SummaryCard';
import LoadingSpinner from '../components/LoadingSpinner';

export const Summary = ({ showNotification }) => {
  const [tasks, setTasks] = useState([]);
  const [productivity, setProductivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadSummaryData = useCallback(async () => {
    try {
      const tasksData = await apiService.getAllTasks();
      const prodData = await apiService.getProductivity();
      
      setTasks(tasksData.tasks || []);
      setProductivity(prodData);
    } catch (err) {
      showNotification(err.message || 'Failed to fetch summary data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadSummaryData();
  }, [loadSummaryData, refreshTrigger]);

  const handleRefresh = () => {
    loadSummaryData();
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading && !productivity) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <LoadingSpinner text="Analyzing productivity logs..." />
      </div>
    );
  }

  const score = productivity?.score || 0;
  const completed = productivity?.completed || 0;
  const pending = productivity?.pending || 0;
  const total = productivity?.total || 0;
  const categories = productivity?.by_category || {};

  // Sort tasks to extract recent activity (last 10 tasks)
  const recentActivities = [...tasks]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  // Score status colors
  let scoreColor = 'text-rose-500';
  let progressColor = 'bg-rose-550';
  if (score > 40 && score <= 70) {
    scoreColor = 'text-amber-500';
    progressColor = 'bg-amber-500';
  } else if (score > 70) {
    scoreColor = 'text-emerald-500';
    progressColor = 'bg-emerald-500';
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Section 1 - AI Summary card */}
      <SummaryCard refreshTrigger={refreshTrigger} />

      {/* Section 2 - Score Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Productivity score overview */}
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-6 rounded-2xl shadow-sm md:col-span-2 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <FiTrendingUp className="text-brand-500 w-4.5 h-4.5" />
              Progress Analytics
            </h3>
            <button
              onClick={handleRefresh}
              className="text-xs font-bold text-brand-600 dark:text-brand-455 hover:underline"
            >
              Recalculate Stats
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8">
            {/* Big percentage view */}
            <div className="text-center sm:text-left flex flex-col justify-center">
              <span className={`text-5xl font-black ${scoreColor} tracking-tight`}>
                {score}%
              </span>
              <span className="text-3xs font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest mt-1">
                Productivity Score
              </span>
            </div>

            {/* Progress bar */}
            <div className="flex-grow w-full space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-655 dark:text-slate-350">
                <span>Completed: {completed} tasks</span>
                <span>Goal: {total} tasks</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-800">
                <div
                  className={`h-full ${progressColor} rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-2xs text-slate-450 dark:text-slate-500 leading-normal">
                Score is calculated as completed tasks divided by total tasks multiplied by 100.
              </p>
            </div>
          </div>
        </div>

        {/* Overview Numbers Card */}
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <FiPieChart className="text-brand-500 w-4.5 h-4.5" />
            Completed vs Pending
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/10 text-center">
              <span className="block text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {completed}
              </span>
              <span className="text-3xs font-extrabold text-emerald-500 uppercase tracking-wider">
                Completed
              </span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/10 text-center">
              <span className="block text-3xl font-black text-amber-600 dark:text-amber-400">
                {pending}
              </span>
              <span className="text-3xs font-extrabold text-amber-500 uppercase tracking-wider">
                Pending
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid for breakdown and recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 3 - Category Breakdown (Bars constructed with tailwind/css) */}
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <FiPieChart className="text-brand-500 w-4.5 h-4.5" />
            Category Performance
          </h3>
          
          {Object.keys(categories).length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-450 italic py-6 text-center">
              No categories mapped yet. Add tasks with categories to analyze.
            </p>
          ) : (
            <div className="space-y-4 pt-2">
              {Object.entries(categories).map(([cat, counts]) => {
                const pct = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-705 dark:text-slate-350">
                      <span>{cat}</span>
                      <span>
                        {counts.completed} / {counts.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-800">
                      <div
                        className="bg-brand-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 4 - Recent Activity Timeline (Vertical layout) */}
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <FiActivity className="text-brand-500 w-4.5 h-4.5" />
            Recent Activity Log
          </h3>

          {recentActivities.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-450 italic py-6 text-center">
              No recent task activities logged yet.
            </p>
          ) : (
            <div className="flow-root pt-2">
              <ul className="-mb-8">
                {recentActivities.map((act, actIdx) => {
                  const isDone = act.status === 'completed';
                  return (
                    <li key={act.id}>
                      <div className="relative pb-8">
                        {/* Timeline line connector */}
                        {actIdx !== recentActivities.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800"
                            aria-hidden="true"
                          />
                        ) : null}
                        
                        <div className="relative flex space-x-3">
                          {/* Indicator icon */}
                          <div>
                            {isDone ? (
                              <span className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500">
                                <FiCheckCircle className="w-5 h-5 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-500">
                                <FiPlusCircle className="w-5 h-5 stroke-[2.5]" />
                              </span>
                            )}
                          </div>

                          {/* Detail text */}
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {isDone ? 'Completed task' : 'Captured new task'}{' '}
                                <span className="font-extrabold text-slate-800 dark:text-slate-100">
                                  "{act.title}"
                                </span>
                              </p>
                            </div>
                            <div className="text-right text-[10px] font-bold text-slate-400 dark:text-slate-550 whitespace-nowrap uppercase">
                              {new Date(act.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Summary;
