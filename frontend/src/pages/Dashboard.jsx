import React, { useState, useEffect, useCallback } from 'react';
import { CheckSquare, AlertCircle, CheckCircle2, FileText, Sparkles, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import ProductivityCard from '../components/ProductivityCard';
import SummaryCard from '../components/SummaryCard';
import { StatsSkeleton } from '../components/SkeletonLoaders';

export const Dashboard = ({ showNotification }) => {
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, notesData] = await Promise.all([
        apiService.getAllTasks(),
        apiService.getAllNotes()
      ]);
      
      setTasks(tasksData.tasks || []);
      setNotes(notesData.notes || []);
    } catch (err) {
      setError(err.message || 'Unable to connect to the backend server. Please verify it is running on http://localhost:5000.');
      showNotification(err.message || 'Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadDashboardData();

    // Listen for global refresh events (triggered by Quick Capture modal)
    const handleRefresh = () => {
      loadDashboardData();
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener('refresh-task-list', handleRefresh);
    return () => window.removeEventListener('refresh-task-list', handleRefresh);
  }, [loadDashboardData]);

  const triggerRefresh = () => {
    loadDashboardData();
    setRefreshKey((prev) => prev + 1);
  };

  const handleTaskUpdate = async (id, updatedFields) => {
    try {
      await apiService.updateTask(id, updatedFields);
      showNotification('Task updated successfully.', 'success');
      triggerRefresh();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleTaskDelete = async (id) => {
    try {
      await apiService.deleteTask(id);
      showNotification('Task deleted successfully.', 'success');
      triggerRefresh();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Stats computation
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const completedTasks = totalTasks - pendingTasks;
  
  // Overdue check (if date exists and is in the past, status is pending)
  const overdueTasks = tasks.filter((t) => {
    if (t.status !== 'pending' || !t.due_date) return false;
    const cleanDate = t.due_date.toLowerCase().trim();
    if (cleanDate === 'today' || cleanDate === 'tomorrow') return false;
    try {
      const parsed = new Date(cleanDate);
      if (isNaN(parsed.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return parsed < today;
    } catch {
      return false;
    }
  }).length;

  const totalNotes = notes.length;

  // Filter tasks for Today and Upcoming focus areas
  const todayTasks = tasks.filter((t) => {
    if (t.status === 'completed') return false;
    const due = (t.due_date || '').toLowerCase();
    return due === 'today' || due.includes('today');
  });

  const upcomingTasks = tasks.filter((t) => {
    if (t.status === 'completed') return false;
    const due = (t.due_date || '').toLowerCase();
    return due !== 'today' && !due.includes('today');
  });

  const recentNotes = notes.slice(0, 3);

  // Network connection failure view
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px] p-6">
        <div className="bg-[#171717] border border-[#DC2626]/40 p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-950/20 text-[#DC2626] border border-red-900/30 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Network Connection Failure</h3>
          <p className="text-xs text-[#808080] leading-relaxed">
            {error}
          </p>
          <button
            onClick={() => loadDashboardData()}
            className="w-full py-2.5 bg-[#DC2626] hover:bg-[#EF4444] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 duration-150"
            aria-label="Retry network connection"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Dashboard skeleton loaders
  if (loading && totalTasks === 0 && totalNotes === 0) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div className="bg-[#171717]/40 border border-[#2B2B2B] rounded-2xl p-6 h-32 flex flex-col justify-center space-y-3">
          <div className="h-3.5 bg-[#2B2B2B] rounded w-32 animate-pulse"></div>
          <div className="h-6 bg-[#2B2B2B] rounded w-64 animate-pulse"></div>
          <div className="h-3 bg-[#2B2B2B] rounded w-96 animate-pulse mt-1"></div>
        </div>
        
        <StatsSkeleton count={4} />

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#171717] border border-[#2B2B2B] p-6 rounded-2xl h-44 animate-pulse flex flex-col justify-between">
              <div className="h-4 bg-[#2B2B2B] rounded w-28"></div>
              <div className="h-8 bg-[#2B2B2B] rounded w-full"></div>
              <div className="h-4 bg-[#2B2B2B] rounded w-20"></div>
            </div>
            <div className="space-y-3">
              <div className="h-3.5 bg-[#2B2B2B] rounded w-20 animate-pulse"></div>
              <div className="bg-[#171717] border border-[#2B2B2B] p-6 rounded-2xl h-60 animate-pulse"></div>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#171717] border border-[#2B2B2B] p-6 rounded-2xl h-56 animate-pulse"></div>
            <div className="bg-[#171717] border border-[#2B2B2B] p-6 rounded-2xl h-40 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Animation constants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6 max-w-7xl mx-auto"
    >
      
      {/* Dynamic welcome hero panel */}
      <motion.div variants={cardVariants} className="bg-[#171717]/40 border border-[#2B2B2B] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#DC2626]/5 to-transparent rounded-r-2xl pointer-events-none" />
        <div className="flex items-center space-x-3 mb-2">
          <Sparkles className="w-5 h-5 text-[#DC2626]" />
          <span className="text-4xs font-bold text-[#DC2626] uppercase tracking-widest">Enterprise Command Center</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
          Welcome back to SmartCapture.
        </h2>
        <p className="text-xs text-[#B3B3B3] mt-1 max-w-xl">
          Your tasks have been parsed, categorised, and prioritized by your AI productivity coach. Capture your mind to organize your workflow.
        </p>
      </motion.div>

      {/* Top Stats Row (4 Cards) */}
      <motion.div variants={containerVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Tasks */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -3, borderColor: '#DC2626' }}
          className="bg-[#171717] border border-[#2B2B2B] p-5 rounded-2xl flex items-center space-x-4 shadow-lg transition-all duration-300"
        >
          <div className="p-3 bg-red-950/20 text-[#DC2626] rounded-xl border border-red-900/30">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-4xs font-extrabold text-[#808080] uppercase tracking-widest mb-1">
              Total Tasks
            </span>
            <span className="text-lg font-black text-white">{totalTasks}</span>
          </div>
        </motion.div>

        {/* Pending Tasks */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -3, borderColor: '#DC2626' }}
          className="bg-[#171717] border border-[#2B2B2B] p-5 rounded-2xl flex items-center space-x-4 shadow-lg transition-all duration-300"
        >
          <div className="p-3 bg-amber-950/20 text-[#F59E0B] rounded-xl border border-amber-900/30">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-4xs font-extrabold text-[#808080] uppercase tracking-widest mb-1">
              Pending Tasks
            </span>
            <span className="text-lg font-black text-white">{pendingTasks}</span>
          </div>
        </motion.div>

        {/* Completed Tasks */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -3, borderColor: '#DC2626' }}
          className="bg-[#171717] border border-[#2B2B2B] p-5 rounded-2xl flex items-center space-x-4 shadow-lg transition-all duration-300"
        >
          <div className="p-3 bg-emerald-950/20 text-[#22C55E] rounded-xl border border-emerald-900/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-4xs font-extrabold text-[#808080] uppercase tracking-widest mb-1">
              Completed Tasks
            </span>
            <span className="text-lg font-black text-white">{completedTasks}</span>
          </div>
        </motion.div>

        {/* Overdue/Notes count */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -3, borderColor: '#DC2626' }}
          className="bg-[#171717] border border-[#2B2B2B] p-5 rounded-2xl flex items-center space-x-4 shadow-lg transition-all duration-300"
        >
          {overdueTasks > 0 ? (
            <>
              <div className="p-3 bg-red-950/35 text-red-400 rounded-xl border border-red-900/40 animate-pulse">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-4xs font-extrabold text-[#808080] uppercase tracking-widest mb-1">
                  Overdue
                </span>
                <span className="text-lg font-black text-red-500">{overdueTasks}</span>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-neutral-900 text-[#B3B3B3] rounded-xl border border-[#2B2B2B]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-4xs font-extrabold text-[#808080] uppercase tracking-widest mb-1">
                  Total Notes
                </span>
                <span className="text-lg font-black text-white">{totalNotes}</span>
              </div>
            </>
          )}
        </motion.div>

      </motion.div>

      {/* Grid Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Left Column (Smart capture + focus cards) - 6 cols in lg */}
        <div className="lg:col-span-6 space-y-6">
          <motion.div variants={cardVariants}>
            <TaskForm onTaskCreated={triggerRefresh} showNotification={showNotification} />
          </motion.div>

          {/* Today's Focus List */}
          <motion.div variants={cardVariants} className="space-y-3.5">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span>Today's Focus</span>
            </h3>
            <TaskList tasks={todayTasks} onUpdate={handleTaskUpdate} onDelete={handleTaskDelete} />
          </motion.div>

          {/* Upcoming & Backlog List */}
          <motion.div variants={cardVariants} className="space-y-3.5">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
              <span>Upcoming & Backlog</span>
            </h3>
            <TaskList tasks={upcomingTasks} onUpdate={handleTaskUpdate} onDelete={handleTaskDelete} />
          </motion.div>
        </div>

        {/* Right Column (Productivity circle + AI insights + Notes) - 4 cols in lg */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div variants={cardVariants}>
            <ProductivityCard refreshTrigger={refreshKey} />
          </motion.div>

          <motion.div variants={cardVariants}>
            <SummaryCard refreshTrigger={refreshKey} />
          </motion.div>

          {/* Recent Notes Snippets */}
          <motion.div
            variants={cardVariants}
            className="bg-[#171717] border border-[#2B2B2B] rounded-2xl p-5 shadow-lg"
          >
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <BookOpen className="text-[#DC2626] w-4.5 h-4.5" />
              <span>Recent Notes</span>
            </h3>
            
            {recentNotes.length === 0 ? (
              <p className="text-xs text-[#808080] italic py-2">
                No notes captured yet. Capture notes under Notes tab to populate ledger.
              </p>
            ) : (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-xl border border-[#2B2B2B]/40 bg-[#0F0F0F]/80 hover:border-[#DC2626]/40 transition-all duration-300"
                  >
                    <p className="text-xs text-[#B3B3B3] line-clamp-2 leading-relaxed">
                      {note.content}
                    </p>
                    <div className="flex justify-between items-center mt-2.5">
                      <span className="text-5xs text-[#808080] font-bold uppercase">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                      {note.tags && note.tags.length > 0 && (
                        <span className="text-5xs font-bold text-[#DC2626] uppercase">
                          #{note.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
};

export default Dashboard;
