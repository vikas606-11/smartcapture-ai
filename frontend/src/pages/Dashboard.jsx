import React, { useState, useEffect, useCallback } from 'react';
import { FiCheckSquare, FiAlertCircle, FiCheckCircle, FiFileText } from 'react-icons/fi';
import { apiService } from '../services/api';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import ProductivityCard from '../components/ProductivityCard';
import SummaryCard from '../components/SummaryCard';
import LoadingSpinner from '../components/LoadingSpinner';

export const Dashboard = ({ showNotification }) => {
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDashboardData = useCallback(async () => {
    try {
      const tasksData = await apiService.getAllTasks();
      const notesData = await apiService.getAllNotes();
      
      setTasks(tasksData.tasks || []);
      setNotes(notesData.notes || []);
    } catch (err) {
      showNotification(err.message || 'Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Callback to refresh dashboard lists and analytics cards
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

  // Calculate statistics
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const completedTasks = totalTasks - pendingTasks;
  const totalNotes = notes.length;

  // Filter tasks for Left Column
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

  if (loading && totalTasks === 0 && totalNotes === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <LoadingSpinner text="Consulting dashboard data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Top Stats Row (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-5 rounded-2xl flex items-center space-x-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <FiCheckSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xs font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none mb-1">
              Total Tasks
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100">{totalTasks}</span>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-5 rounded-2xl flex items-center space-x-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-xl">
            <FiAlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xs font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none mb-1">
              Pending Tasks
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100">{pendingTasks}</span>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-5 rounded-2xl flex items-center space-x-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <FiCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xs font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none mb-1">
              Completed Tasks
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100">{completedTasks}</span>
          </div>
        </div>

        {/* Total Notes */}
        <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-5 rounded-2xl flex items-center space-x-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl">
            <FiFileText className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xs font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest leading-none mb-1">
              Total Notes
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100">{totalNotes}</span>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left Column (60%) -> 6 cols in lg */}
        <div className="lg:col-span-6 space-y-6">
          {/* Task Form creation */}
          <TaskForm onTaskCreated={triggerRefresh} showNotification={showNotification} />

          {/* Today's Tasks */}
          <div className="space-y-3.5">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Today's Focus</span>
            </h3>
            <TaskList tasks={todayTasks} onUpdate={handleTaskUpdate} onDelete={handleTaskDelete} />
          </div>

          {/* Upcoming Tasks */}
          <div className="space-y-3.5">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
              <span>Upcoming & Backlog</span>
            </h3>
            <TaskList tasks={upcomingTasks} onUpdate={handleTaskUpdate} onDelete={handleTaskDelete} />
          </div>
        </div>

        {/* Right Column (40%) -> 4 cols in lg */}
        <div className="lg:col-span-4 space-y-6">
          {/* Productivity Circle */}
          <ProductivityCard refreshTrigger={refreshKey} />

          {/* Daily AI summary */}
          <SummaryCard refreshTrigger={refreshKey} />

          {/* Recent Notes */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-5.5 shadow-sm transition-all duration-300">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <FiFileText className="text-brand-500 w-4.5 h-4.5" />
              <span>Recent Notes</span>
            </h3>
            {recentNotes.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-450 italic py-2">
                No notes captured yet. Go to Notes tab to add snippets.
              </p>
            ) : (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40"
                  >
                    <p className="text-xs text-slate-655 dark:text-slate-350 line-clamp-2 leading-relaxed">
                      {note.content}
                    </p>
                    <div className="flex justify-between items-center mt-2.5">
                      <span className="text-4xs text-slate-400 dark:text-slate-500 font-bold uppercase">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                      {note.tags && note.tags.length > 0 && (
                        <span className="text-3xs font-semibold text-brand-500">
                          #{note.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
