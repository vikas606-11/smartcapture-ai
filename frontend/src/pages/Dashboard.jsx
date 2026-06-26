import React, { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Clock, CheckCircle, AlertTriangle, Calendar, Zap, Sparkles, BookOpen, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import ProductivityCard from '../components/ProductivityCard';
import SummaryCard from '../components/SummaryCard';
import { StatsSkeleton } from '../components/SkeletonLoaders';

// Spring counter animation helper on mount
const AnimatedCounter = ({ value }) => {
  const [count, setCount] = useState(0);
  const isPercent = typeof value === 'string' && value.endsWith('%');
  const endVal = parseInt(value, 10);
  
  useEffect(() => {
    if (isNaN(endVal) || endVal <= 0) {
      setCount(value);
      return;
    }
    let start = 0;
    const duration = 600; // ms
    const increment = Math.max(1, Math.ceil(endVal / 25));
    const stepTime = 20; // ms
    const timer = setInterval(() => {
      start += increment;
      if (start >= endVal) {
        clearInterval(timer);
        setCount(endVal);
      } else {
        setCount(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [endVal, value]);

  return <span>{count}{isPercent ? '%' : ''}</span>;
};

const StatCard = ({ label, value, icon: Icon, borderClass = 'border-[#262626]', iconColor = 'text-[#737373]' }) => {
  return (
    <motion.div
      whileHover={{ borderColor: '#333333' }}
      className={`bg-[#171717] border p-5 rounded-xl flex flex-col justify-between min-h-[110px] transition-all duration-200 ${borderClass}`}
    >
      <div className="flex justify-between items-start">
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="mt-3">
        <div className="text-2xl font-semibold text-white tracking-tight leading-none mb-1">
          <AnimatedCounter value={value} />
        </div>
        <span className="caption-label text-[11px] uppercase tracking-wider font-semibold">
          {label}
        </span>
      </div>
    </motion.div>
  );
};

export const Dashboard = ({ showNotification }) => {
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [productivity, setProductivity] = useState({ score: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, notesData, productivityData] = await Promise.all([
        apiService.getAllTasks(),
        apiService.getAllNotes(),
        apiService.getProductivity()
      ]);
      
      setTasks(tasksData.tasks || []);
      setNotes(notesData.notes || []);
      setProductivity(productivityData || { score: 0 });
    } catch (err) {
      setError(err.message || 'Unable to connect to the backend server. Please verify it is running.');
      showNotification(err.message || 'Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadDashboardData();

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

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const completedTasks = totalTasks - pendingTasks;
  
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

  const todayTasks = tasks.filter((t) => {
    if (t.status === 'completed') return false;
    const due = (t.due_date || '').toLowerCase();
    return due === 'today' || due.includes('today');
  });

  const previewTasks = tasks.slice(0, 5);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="bg-[#171717] border border-[#DC2626]/30 p-8 rounded-xl max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-950/20 text-[#DC2626] border border-red-950/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="section-heading text-white">Network Connection Failure</h3>
          <p className="body-text">
            {error}
          </p>
          <button
            onClick={() => loadDashboardData()}
            className="w-full py-2.5 bg-[#DC2626] hover:bg-[#EF4444] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 duration-150"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-8 p-8 max-w-7xl mx-auto"
    >
      {/* 1. Stat Cards Row */}
      {loading && totalTasks === 0 ? (
        <StatsSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Tasks" value={totalTasks} icon={CheckSquare} />
          <StatCard label="Pending" value={pendingTasks} icon={Clock} iconColor="text-[#F59E0B]" />
          <StatCard label="Completed" value={completedTasks} icon={CheckCircle} iconColor="text-[#22C55E]" />
          <StatCard 
            label="Overdue" 
            value={overdueTasks} 
            icon={AlertTriangle} 
            borderClass={overdueTasks > 0 ? 'border-[#DC2626]/55 bg-red-950/5' : 'border-[#262626]'} 
            iconColor={overdueTasks > 0 ? 'text-[#DC2626]' : 'text-[#737373]'}
          />
          <StatCard label="Today's Tasks" value={todayTasks.length} icon={Calendar} />
          <StatCard label="AI Score" value={`${productivity.score}%`} icon={Zap} iconColor="text-[#22C55E]" />
        </div>
      )}

      {/* 2. Hero Smart Capture Input centerpiece */}
      <div>
        <TaskForm onTaskCreated={triggerRefresh} showNotification={showNotification} />
      </div>

      {/* 3. Two-Column preview layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
        
        {/* Left Column: Recent Tasks preview list */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="section-heading flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-[#DC2626]" />
            <span>Active Task Tracker</span>
          </h3>
          
          <div className="border border-[#262626] rounded-xl bg-[#171717] p-5 shadow-lg">
            <TaskList tasks={previewTasks} onUpdate={handleTaskUpdate} onDelete={handleTaskDelete} />
          </div>
        </div>

        {/* Right Column: AI Insights panel */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="section-heading flex items-center space-x-2">
            <Brain className="w-5 h-5 text-[#DC2626]" />
            <span>AI Insights Engine</span>
          </h3>
          
          <SummaryCard refreshTrigger={refreshKey} />
          <ProductivityCard refreshTrigger={refreshKey} />
        </div>

      </div>
    </motion.div>
  );
};

export default Dashboard;
