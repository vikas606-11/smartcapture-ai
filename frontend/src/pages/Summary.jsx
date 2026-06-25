import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  PieChart, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Flame, 
  Sparkles, 
  RefreshCw, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Check, 
  ArrowRight,
  FolderOpen,
  PlusCircle,
  TrendingDown
} from 'lucide-react';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export const Summary = () => {
  const [tasks, setTasks] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 mins Pomodoro
  const [timerTotal, setTimerTotal] = useState(1500);

  // Stagger Animations for Dashboard Cards
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  // Main loader for tasks and AI coach insights
  const loadData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const [tasksData, insightsData] = await Promise.all([
        apiService.getAllTasks(),
        apiService.getCoachingInsights(forceRefresh)
      ]);
      
      setTasks(tasksData.tasks || []);
      setInsights(insightsData);
      
      if (forceRefresh) {
        toast.success('AI Coach insights refreshed successfully.', {
          icon: '✨',
          style: {
            background: '#171717',
            color: '#FFFFFF',
            border: '1px solid #2B2B2B',
            borderRadius: '12px',
          }
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load coaching insights.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Pomodoro countdown timer logic
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      toast.success("Focus session completed! Take a short break.", {
        icon: '🎉',
        style: {
          background: '#171717',
          color: '#FFFFFF',
          border: '1px solid #2B2B2B',
          borderRadius: '12px',
        }
      });
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Handle Pomodoro preset adjustments
  const setPomodoroDuration = (mins) => {
    const secs = mins * 60;
    setTimeLeft(secs);
    setTimerTotal(secs);
    setTimerActive(false);
  };

  // Mark task completed directly from Coach Dashboard
  const handleToggleTaskComplete = async (taskId, title) => {
    try {
      await apiService.updateTask(taskId, { status: 'completed' });
      toast.success(`Completed "${title}"!`, {
        icon: '🎉',
        style: {
          background: '#171717',
          color: '#FFFFFF',
          border: '1px solid #2B2B2B',
          borderRadius: '12px',
        }
      });
      // reload everything to trigger caching hash updates
      loadData(false);
    } catch (err) {
      toast.error(`Failed to update task: ${err.message}`);
    }
  };

  if (loading && !insights) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <LoadingSpinner text="Consulting AI productivity coach..." />
      </div>
    );
  }

  // Local statistics computations from current tasks state
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const pendingTasksCount = pendingTasks.length;
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const endOfWeek = new Date(todayEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

  let overdueCount = 0;
  let dueTodayCount = 0;
  let dueThisWeekCount = 0;
  let highPriorityCount = 0;

  pendingTasks.forEach(t => {
    if (t.priority === 'High') {
      highPriorityCount++;
    }
    
    const dueStr = (t.due_date || '').trim().toLowerCase();
    if (!dueStr) return;
    
    if (dueStr === 'today') {
      dueTodayCount++;
      dueThisWeekCount++;
      return;
    }
    
    if (dueStr === 'tomorrow') {
      dueThisWeekCount++;
      return;
    }
    
    try {
      const d = new Date(t.due_date + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        if (d < todayStart) {
          overdueCount++;
        } else if (d >= todayStart && d <= todayEnd) {
          dueTodayCount++;
          dueThisWeekCount++;
        } else if (d > todayEnd && d <= endOfWeek) {
          dueThisWeekCount++;
        }
      }
    } catch (e) {}
  });

  const score = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Productivity classification
  let scoreBadge = "Needs Improvement";
  let scoreColor = "text-[#DC2626]";
  let scoreBorder = "border-[#DC2626]/20 bg-red-950/10";
  let scoreStroke = "#DC2626";
  
  if (score >= 75) {
    scoreBadge = "Excellent";
    scoreColor = "text-[#22C55E]";
    scoreBorder = "border-[#22C55E]/20 bg-emerald-950/10";
    scoreStroke = "#22C55E";
  } else if (score >= 45) {
    scoreBadge = "Good";
    scoreColor = "text-[#F59E0B]";
    scoreBorder = "border-[#F59E0B]/20 bg-amber-950/10";
    scoreStroke = "#F59E0B";
  }

  // Category statistics breakdown
  const categoryStats = {};
  tasks.forEach((t) => {
    const cat = t.category || 'Other';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { completed: 0, total: 0 };
    }
    categoryStats[cat].total++;
    if (t.status === 'completed') {
      categoryStats[cat].completed++;
    }
  });

  // Timeline activities log (last 10 items)
  const recentActivities = [...tasks]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  // Recommended tasks list
  const recommendedTasks = insights?.recommended_order || [];

  // Filter top 3 tasks for Focus Mode
  const topFocusTasks = recommendedTasks
    .map(rec => {
      const fullTask = tasks.find(task => task.id === rec.id);
      return {
        id: rec.id,
        title: rec.title,
        reason: rec.reason,
        completed: fullTask ? fullTask.status === 'completed' : false
      };
    })
    .filter(t => !t.completed)
    .slice(0, 3);

  // SVG parameters for productivity ring
  const scoreRadius = 45;
  const scoreCircumference = 2 * Math.PI * scoreRadius;
  const scoreStrokeDashoffset = scoreCircumference * (1 - score / 100);

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto relative">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#2B2B2B]">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#DC2626]" />
            <span>AI Productivity Coach</span>
          </h1>
          <p className="text-xs text-[#808080] font-medium mt-1">
            AI-powered daily briefing, priority suggestions, workload metrics, and structured focus execution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsFocusMode(true);
              setPomodoroDuration(25);
            }}
            className="px-4 py-2 border border-[#DC2626] hover:border-red-500 bg-red-950/10 hover:bg-[#DC2626]/20 text-[#DC2626] hover:text-white font-extrabold uppercase tracking-wider text-2xs rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Enter Focus Mode</span>
          </button>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="px-3 py-2 border border-[#2B2B2B] hover:border-white bg-[#171717] hover:bg-[#2B2B2B] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Coach'}</span>
          </button>
        </div>
      </div>

      {/* 2. Stats Grid Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4"
      >
        {[
          { name: "Total Tasks", val: totalTasks, icon: Activity, color: "text-[#B3B3B3] border-[#2B2B2B]" },
          { name: "Completed", val: completedTasks, icon: CheckCircle2, color: "text-[#22C55E] border-emerald-950/40" },
          { name: "Pending", val: pendingTasksCount, icon: Clock, color: "text-[#F59E0B] border-amber-950/40" },
          { name: "Overdue", val: overdueCount, icon: AlertCircle, color: overdueCount > 0 ? "text-[#DC2626] border-[#DC2626]/50 shadow-[0_0_15px_rgba(220,38,38,0.1)]" : "text-[#808080] border-[#2B2B2B]" },
          { name: "Due Today", val: dueTodayCount, icon: Calendar, color: dueTodayCount > 0 ? "text-[#06B6D4] border-cyan-950/80 shadow-[0_0_15px_rgba(6,182,212,0.1)]" : "text-[#808080] border-[#2B2B2B]" },
          { name: "Due This Week", val: dueThisWeekCount, icon: Calendar, color: "text-[#8B5CF6] border-violet-950/40" },
          { name: "High Priority", val: highPriorityCount, icon: Flame, color: highPriorityCount > 0 ? "text-[#F97316] border-orange-950/80 shadow-[0_0_15px_rgba(249,115,22,0.1)]" : "text-[#808080] border-[#2B2B2B]" }
        ].map((s) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.name}
              variants={itemVariants}
              className={`cyber-card flex flex-col justify-between p-4.5 min-h-[110px] ${s.color}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-4xs font-extrabold uppercase tracking-widest text-[#808080] leading-none">
                  {s.name}
                </span>
                <Icon className="w-4 h-4 opacity-70" />
              </div>
              <div className="text-2xl font-black tracking-tight mt-3 text-white">
                {s.val}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 3. Primary Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (66% Width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Briefing Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="border border-[#2B2B2B] bg-[#171717] rounded-2xl shadow-xl overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-950/15 rounded-full blur-3xl pointer-events-none" />
            <div className="bg-[#101010] px-5 py-4 border-b border-[#2B2B2B] flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-[#DC2626]" />
                <span>Coach Daily Briefing</span>
              </h3>
              <span className="text-[10px] font-extrabold text-[#22C55E] uppercase tracking-widest bg-emerald-950/30 border border-emerald-900/40 px-2 py-0.5 rounded-lg">
                AI Active
              </span>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="text-xs leading-relaxed text-[#D4D4D4] bg-[#0F0F0F] border border-[#2B2B2B]/40 p-5 rounded-2xl relative overflow-hidden font-medium">
                <span className="absolute top-3 left-4 text-4xl text-[#2B2B2B] select-none font-serif leading-none">“</span>
                <p className="pl-6 relative z-10 leading-normal">
                  {insights?.daily_briefing || "Your coaching briefing is empty. Try capturing a few tasks!"}
                </p>
              </div>

              {/* Workload Estimations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#0F0F0F] border border-[#2B2B2B] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="block text-5xs font-extrabold text-[#808080] uppercase tracking-widest">
                      Estimated Workload Today
                    </span>
                    <span className="text-lg font-black text-white mt-1 block">
                      {insights?.workload_estimation_today || 0} hrs
                    </span>
                  </div>
                  <Clock className="w-8 h-8 text-[#DC2626] opacity-35" />
                </div>
                <div className="p-4 bg-[#0F0F0F] border border-[#2B2B2B] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="block text-5xs font-extrabold text-[#808080] uppercase tracking-widest">
                      Estimated Workload Week
                    </span>
                    <span className="text-lg font-black text-white mt-1 block">
                      {insights?.workload_estimation_week || 0} hrs
                    </span>
                  </div>
                  <Calendar className="w-8 h-8 text-[#DC2626] opacity-35" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI Recommended Tasks List */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="border border-[#2B2B2B] bg-[#171717] rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="bg-[#101010] px-5 py-4 border-b border-[#2B2B2B]">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4.5 h-4.5 text-[#DC2626]" />
                <span>AI Suggested Task Priority Order</span>
              </h3>
              <p className="text-[10px] text-[#808080] font-medium mt-1">
                A custom queue sorted dynamically based on your workload load and priorities.
              </p>
            </div>
            
            <div className="p-6">
              {recommendedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-[#808080] italic">No pending recommendations left. Add tasks to calculate priority.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendedTasks.map((t, idx) => {
                    const fullTask = tasks.find(task => task.id === t.id);
                    const isCompleted = fullTask ? fullTask.status === 'completed' : false;
                    const priorityClass = fullTask?.priority === 'High' 
                      ? 'text-[#DC2626] border-red-950/20 bg-red-950/10'
                      : fullTask?.priority === 'Medium'
                      ? 'text-[#F59E0B] border-amber-950/20 bg-amber-950/10'
                      : 'text-[#B3B3B3] border-[#2B2B2B] bg-[#0F0F0F]';

                    return (
                      <div
                        key={t.id}
                        className={`flex items-start space-x-4 p-4 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F]/60 hover:border-red-900/30 transition-all duration-200 group relative ${isCompleted ? 'opacity-55' : ''}`}
                      >
                        {/* Queue Indicator Badge */}
                        <div className="w-6 h-6 rounded-full bg-[#101010] border border-[#2B2B2B] text-white flex items-center justify-center text-4xs font-black flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>

                        {/* Complete Task trigger check */}
                        <button
                          onClick={() => handleToggleTaskComplete(t.id, t.title)}
                          disabled={isCompleted}
                          className="w-5.5 h-5.5 rounded-full border-2 border-[#2B2B2B] group-hover:border-[#DC2626] flex items-center justify-center text-transparent hover:text-emerald-500 hover:border-emerald-500 transition-all flex-shrink-0 mt-0.5"
                        >
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-500" />
                          ) : (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`text-xs font-semibold text-white group-hover:text-[#EF4444] transition-colors leading-tight ${isCompleted ? 'line-through text-[#808080]' : ''}`}>
                              {t.title}
                            </h4>
                            {fullTask && (
                              <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 border rounded-lg ${priorityClass}`}>
                                {fullTask.priority || 'Medium'}
                              </span>
                            )}
                            {fullTask?.category && (
                              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 border border-[#2B2B2B] bg-[#101010] rounded-lg text-[#808080]">
                                {fullTask.category}
                              </span>
                            )}
                          </div>
                          
                          {/* Recommended order explanation reason */}
                          <div className="mt-2.5 bg-[#101010] border-l-2 border-[#DC2626] pl-3 py-1.5 rounded-r-lg">
                            <p className="text-[11px] leading-relaxed text-[#A3A3A3] italic">
                              <span className="font-bold text-white text-4xs uppercase tracking-wider mr-1.5 not-italic">Coach Note:</span>
                              {t.reason || "Backlog schedule item."}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

        </div>

        {/* Right Column (33% Width) */}
        <div className="space-y-8">
          
          {/* Progress Analytics circle */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="border border-[#2B2B2B] bg-[#171717] p-6 rounded-2xl shadow-xl flex flex-col items-center text-center relative"
          >
            <div className="w-full flex justify-between items-center pb-4 border-b border-[#2B2B2B] mb-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="text-[#DC2626] w-4.5 h-4.5" />
                <span>Workspace Progress</span>
              </h3>
            </div>

            {/* SVG Circle Progress */}
            <div className="relative w-36 h-36 flex items-center justify-center mt-2">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r={scoreRadius}
                  className="stroke-[#0F0F0F] stroke-[6]"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r={scoreRadius}
                  stroke={scoreStroke}
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray={scoreCircumference}
                  strokeDashoffset={scoreStrokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="text-center">
                <span className={`text-3xl font-black tracking-tight ${scoreColor}`}>
                  {score}%
                </span>
                <span className="block text-[9px] font-extrabold text-[#808080] uppercase tracking-wider mt-1">
                  Score
                </span>
              </div>
            </div>

            {/* Score Class Badge */}
            <div className={`mt-4 px-3 py-1 border text-xs font-extrabold uppercase tracking-widest rounded-xl ${scoreBorder} ${scoreColor}`}>
              {scoreBadge}
            </div>

            <p className="text-4xs text-[#808080] leading-normal uppercase tracking-wider mt-5 border-t border-[#2B2B2B]/40 pt-4 w-full text-center">
              Completion score calculated across all active dashboard items.
            </p>
          </motion.div>

          {/* Actionable suggestions list */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="border border-[#2B2B2B] bg-[#171717] p-6 rounded-2xl shadow-xl"
          >
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-4 border-b border-[#2B2B2B] mb-5 flex items-center gap-2">
              <Sparkles className="text-[#DC2626] w-4.5 h-4.5" />
              <span>Smart Suggestions</span>
            </h3>

            <div className="space-y-3.5">
              {(insights?.smart_suggestions || []).map((s, idx) => (
                <div key={idx} className="flex items-start space-x-3 bg-[#0F0F0F] border border-[#2B2B2B]/60 p-3.5 rounded-xl">
                  <Sparkles className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-xs text-[#B3B3B3] leading-normal font-medium">
                    {s}
                  </p>
                </div>
              ))}
              {(!insights?.smart_suggestions || insights.smart_suggestions.length === 0) && (
                <p className="text-xs text-[#808080] italic">No suggestions compiled yet.</p>
              )}
            </div>
          </motion.div>

          {/* Weekly Highlights & Trends */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="border border-[#2B2B2B] bg-[#171717] p-6 rounded-2xl shadow-xl"
          >
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-4 border-b border-[#2B2B2B] mb-5 flex items-center gap-2">
              <FolderOpen className="text-[#DC2626] w-4.5 h-4.5" />
              <span>Weekly Insights</span>
            </h3>

            <div className="space-y-4">
              {/* Productive Cat */}
              <div className="flex justify-between items-center p-3 bg-[#0F0F0F] border border-[#2B2B2B] rounded-xl">
                <div>
                  <span className="block text-5xs font-extrabold text-[#808080] uppercase tracking-widest">
                    Most Productive Category
                  </span>
                  <span className="text-xs font-extrabold text-white mt-1 block">
                    {insights?.weekly_insights?.most_productive_category || "None"}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center text-emerald-500 font-extrabold">
                  P
                </div>
              </div>

              {/* Delayed Cat */}
              <div className="flex justify-between items-center p-3 bg-[#0F0F0F] border border-[#2B2B2B] rounded-xl">
                <div>
                  <span className="block text-5xs font-extrabold text-[#808080] uppercase tracking-widest">
                    Most Delayed Category
                  </span>
                  <span className="text-xs font-extrabold text-white mt-1 block">
                    {insights?.weekly_insights?.most_delayed_category || "None"}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-red-950/20 border border-red-900/30 flex items-center justify-center text-[#DC2626] font-extrabold">
                  D
                </div>
              </div>

              {/* Weekly Trend direction */}
              <div className="flex justify-between items-center p-3 bg-[#0F0F0F] border border-[#2B2B2B] rounded-xl">
                <div>
                  <span className="block text-5xs font-extrabold text-[#808080] uppercase tracking-widest">
                    Productivity Trend
                  </span>
                  <span className="text-xs font-extrabold text-white mt-1 block uppercase tracking-wide">
                    {insights?.weekly_insights?.improvement_trend || "Stable"}
                  </span>
                </div>
                {insights?.weekly_insights?.improvement_trend === "improving" ? (
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center text-emerald-500">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                ) : insights?.weekly_insights?.improvement_trend === "needs improvement" ? (
                  <div className="w-8 h-8 rounded-lg bg-red-950/20 border border-red-900/30 flex items-center justify-center text-[#DC2626]">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-amber-950/20 border border-amber-900/30 flex items-center justify-center text-amber-500">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </div>

      </div>

      {/* 4. Bottom Grid for breakdown & activity logs (Maintains previous layout features) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t border-[#2B2B2B] pt-8">
        
        {/* Category breakdown progress list */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="border border-[#2B2B2B] bg-[#171717] p-6 rounded-2xl shadow-xl space-y-4"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <PieChart className="text-[#DC2626] w-4.5 h-4.5" />
            <span>Category Performance Breakdown</span>
          </h3>
          
          {Object.keys(categoryStats).length === 0 ? (
            <p className="text-xs text-[#808080] italic py-6 text-center">
              No categories mapped yet. Add tasks with categories to analyze.
            </p>
          ) : (
            <div className="space-y-4 pt-2">
              {Object.entries(categoryStats).map(([cat, counts]) => {
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

        {/* Recent Activity Logs Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="border border-[#2B2B2B] bg-[#171717] p-6 rounded-2xl shadow-xl space-y-4"
        >
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="text-[#DC2626] w-4.5 h-4.5" />
            <span>Workspace Activity Logs</span>
          </h3>

          {recentActivities.length === 0 ? (
            <p className="text-xs text-[#808080] italic py-6 text-center">
              No recent task activities logged yet.
            </p>
          ) : (
            <div className="flow-root pt-2 overflow-y-auto max-h-[350px]">
              <ul className="-mb-8">
                {recentActivities.map((act, actIdx) => {
                  const isDone = act.status === 'completed';
                  return (
                    <li key={act.id}>
                      <div className="relative pb-8">
                        {/* Timeline vertical bar */}
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

      {/* 5. Full Screen Distraction-Free Focus Mode Overlay */}
      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-[#050505] flex flex-col p-6 overflow-y-auto"
          >
            {/* Overlay Header */}
            <div className="flex justify-between items-center max-w-5xl w-full mx-auto pb-6 border-b border-[#2B2B2B] mb-8">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-[#DC2626] animate-pulse" />
                <span className="font-extrabold uppercase tracking-widest text-white text-sm">Focus Mode</span>
              </div>
              <button
                onClick={() => {
                  setIsFocusMode(false);
                  setTimerActive(false);
                }}
                className="p-2 border border-[#2B2B2B] hover:border-white rounded-full bg-[#171717] hover:bg-[#2B2B2B] transition-all text-white flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-4 py-2"
              >
                <X className="w-4 h-4" />
                <span>Exit Focus</span>
              </button>
            </div>

            {/* Overlay Content Body */}
            <div className="flex-1 max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              
              {/* Pomodoro circular indicator and controls */}
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative w-72 h-72 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle
                      cx="144"
                      cy="144"
                      r="120"
                      className="stroke-[#171717] stroke-[8]"
                      fill="transparent"
                    />
                    <circle
                      cx="144"
                      cy="144"
                      r="120"
                      stroke="#DC2626"
                      strokeWidth="8"
                      strokeLinecap="round"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 120}
                      strokeDashoffset={(2 * Math.PI * 120) * (1 - timeLeft / timerTotal)}
                      className="transition-all duration-300 ease-linear"
                    />
                  </svg>
                  <div className="text-center z-10">
                    <div className="text-5xl font-black font-mono tracking-tighter text-white">
                      {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                      {(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-5xs font-extrabold uppercase tracking-widest text-[#808080] mt-2">
                      Timer Remaining
                    </div>
                  </div>
                </div>

                {/* Focus Duration Selectors */}
                <div className="flex space-x-2">
                  {[15, 25, 45, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPomodoroDuration(m)}
                      className={`px-3.5 py-1.5 border text-xs font-bold rounded-xl transition-all ${
                        timerTotal === m * 60
                          ? 'border-[#DC2626] bg-red-950/20 text-white shadow-[0_0_15px_rgba(220,38,38,0.1)]'
                          : 'border-[#2B2B2B] hover:border-[#808080] text-[#B3B3B3]'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>

                {/* Timing actions */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setTimerActive(!timerActive)}
                    className="px-6 py-3 bg-[#DC2626] hover:bg-[#EF4444] text-white font-extrabold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-red-950/40 transition-all flex items-center gap-2"
                  >
                    {timerActive ? <Pause className="w-4 h-4 fill-white text-white" /> : <Play className="w-4 h-4 fill-white text-white" />}
                    <span>{timerActive ? 'Pause Session' : 'Start Focus'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setTimerActive(false);
                      setTimeLeft(timerTotal);
                    }}
                    className="p-3 border border-[#2B2B2B] hover:border-white bg-[#171717] hover:bg-[#2B2B2B] text-white rounded-xl transition-all"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Focus List: Top 3 objectives */}
              <div className="space-y-6">
                <div className="border border-[#2B2B2B] bg-[#171717] p-6 rounded-2xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-950/10 rounded-full blur-2xl pointer-events-none" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Flame className="w-4.5 h-4.5 text-[#DC2626]" />
                    <span>Focus Objectives</span>
                  </h3>
                  <p className="text-4xs font-bold text-[#808080] uppercase tracking-widest mb-6">
                    Top 3 items. Focus completely on completing them in order.
                  </p>

                  {topFocusTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-[#808080] italic">No pending focus objectives left. Great job!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topFocusTasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-start space-x-3.5 p-4 rounded-xl border border-[#2B2B2B]/60 bg-[#0F0F0F] hover:border-red-900/40 transition-all group"
                        >
                          <button
                            onClick={() => handleToggleTaskComplete(t.id, t.title)}
                            className="w-5.5 h-5.5 rounded-full border-2 border-[#2B2B2B] group-hover:border-[#DC2626] flex items-center justify-center text-transparent hover:text-emerald-500 hover:border-emerald-500 transition-all flex-shrink-0 mt-0.5"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white group-hover:text-[#EF4444] transition-colors leading-tight">
                              {t.title}
                            </p>
                            <p className="text-4xs text-[#808080] leading-snug mt-1.5 italic">
                              {t.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-6 pt-4 border-t border-[#2B2B2B] flex justify-between items-center text-4xs font-extrabold text-[#808080] uppercase tracking-wider">
                    <span>Session workload: {topFocusTasks.length * 25} mins</span>
                    <span>&bull;</span>
                    <span>Total Backlog: {pendingTasksCount}</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
};

export default Summary;
