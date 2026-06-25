import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, PieChart, Activity, CheckCircle2, PlusCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import SummaryCard from '../components/SummaryCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

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
      toast.error(err.message || 'Failed to fetch summary data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummaryData();
  }, [loadSummaryData, refreshTrigger]);

  const handleRefresh = () => {
    loadSummaryData();
    setRefreshTrigger((prev) => prev + 1);
    toast.success('Productivity metrics updated.');
  };

  if (loading && !productivity) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <LoadingSpinner text="Analyzing productivity metrics..." />
      </div>
    );
  }

  const score = productivity?.score || 0;
  const completed = productivity?.completed || 0;
  const pending = productivity?.pending || 0;
  const total = productivity?.total || 0;
  const categories = productivity?.by_category || {};

  // Recent activity log (last 10 items)
  const recentActivities = [...tasks]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  // Score status color mappings
  let scoreColor = 'text-[#DC2626]';
  let progressColor = 'bg-[#DC2626]';
  if (score > 40 && score <= 70) {
    scoreColor = 'text-[#F59E0B]';
    progressColor = 'bg-[#F59E0B]';
  } else if (score > 70) {
    scoreColor = 'text-[#22C55E]';
    progressColor = 'bg-[#22C55E]';
  }

  // Animation constants
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6 max-w-7xl mx-auto"
    >
      {/* Section 1 - AI summary Insights block */}
      <motion.div variants={itemVariants}>
        <SummaryCard refreshTrigger={refreshTrigger} />
      </motion.div>

      {/* Section 2 - Analytical Cards */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Productivity score card */}
        <motion.div
          variants={itemVariants}
          className="bg-[#171717] border border-[#2B2B2B] p-6 rounded-2xl shadow-lg md:col-span-2 flex flex-col justify-between space-y-4"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="text-[#DC2626] w-4.5 h-4.5" />
              <span>Progress Analytics</span>
            </h3>
            <button
              onClick={handleRefresh}
              className="text-4xs font-bold uppercase tracking-wider text-[#DC2626] hover:text-[#EF4444]"
            >
              Recalculate Stats
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8">
            <div className="text-center sm:text-left flex flex-col justify-center">
              <span className={`text-5xl font-black ${scoreColor} tracking-tighter`}>
                {score}%
              </span>
              <span className="text-5xs font-extrabold text-[#808080] uppercase tracking-widest mt-1.5">
                Productivity Score
              </span>
            </div>

            <div className="flex-grow w-full space-y-3">
              <div className="flex justify-between text-xs font-semibold text-[#B3B3B3]">
                <span>Completed: {completed} tasks</span>
                <span>Workspace: {total} tasks</span>
              </div>
              <div className="w-full bg-[#0F0F0F] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#2B2B2B]">
                <div
                  className={`h-full ${progressColor} rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-4xs text-[#808080] leading-normal uppercase tracking-wider">
                Score corresponds to completed tasks divided by total recorded capture entries.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Totals chart block */}
        <motion.div
          variants={itemVariants}
          className="bg-[#171717] border border-[#2B2B2B] p-6 rounded-2xl shadow-lg flex flex-col justify-between"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <PieChart className="text-[#DC2626] w-4.5 h-4.5" />
            <span>Completed vs Pending</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-4 rounded-xl bg-[#0F0F0F] border border-[#2B2B2B] text-center">
              <span className="block text-2xl font-black text-[#22C55E]">
                {completed}
              </span>
              <span className="text-5xs font-extrabold text-[#22C55E] uppercase tracking-wider">
                Completed
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#0F0F0F] border border-[#2B2B2B] text-center">
              <span className="block text-2xl font-black text-[#F59E0B]">
                {pending}
              </span>
              <span className="text-5xs font-extrabold text-[#F59E0B] uppercase tracking-wider">
                Pending
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Grid for breakdowns and activity logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown panel */}
        <motion.div
          variants={itemVariants}
          className="bg-[#171717] border border-[#2B2B2B] p-6 rounded-2xl shadow-lg space-y-4"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <PieChart className="text-[#DC2626] w-4.5 h-4.5" />
            <span>Category Performance</span>
          </h3>
          
          {Object.keys(categories).length === 0 ? (
            <p className="text-xs text-[#808080] italic py-6 text-center">
              No categories mapped yet. Add tasks with categories to analyze breakdown.
            </p>
          ) : (
            <div className="space-y-4 pt-2">
              {Object.entries(categories).map(([cat, counts]) => {
                const pct = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-[#B3B3B3]">
                      <span>{cat}</span>
                      <span className="text-white font-bold">
                        {counts.completed} / {counts.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#0F0F0F] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#2B2B2B]">
                      <div
                        className="bg-[#DC2626] h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Recent Activity Log */}
        <motion.div
          variants={itemVariants}
          className="bg-[#171717] border border-[#2B2B2B] p-6 rounded-2xl shadow-lg space-y-4"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="text-[#DC2626] w-4.5 h-4.5" />
            <span>Recent Activity Log</span>
          </h3>

          {recentActivities.length === 0 ? (
            <p className="text-xs text-[#808080] italic py-6 text-center">
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
                        {/* Vertical line connector */}
                        {actIdx !== recentActivities.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-[#2B2B2B]"
                            aria-hidden="true"
                          />
                        ) : null}
                        
                        <div className="relative flex space-x-3.5">
                          <div>
                            {isDone ? (
                              <span className="h-8 w-8 rounded-full bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center text-[#22C55E]">
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="h-8 w-8 rounded-full bg-red-950/20 border border-red-900/30 flex items-center justify-center text-[#DC2626]">
                                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-xs font-semibold text-[#B3B3B3]">
                                {isDone ? 'Completed task' : 'Captured new task'}{' '}
                                <span className="font-bold text-white">
                                  "{act.title}"
                                </span>
                              </p>
                            </div>
                            <div className="text-right text-[10px] font-bold text-[#808080] whitespace-nowrap uppercase">
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
        </motion.div>

      </div>
    </motion.div>
  );
};

export default Summary;
