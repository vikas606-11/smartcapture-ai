import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiMinus, FiCheckSquare, FiAlertCircle } from 'react-icons/fi';
import { apiService } from '../services/api';
import SearchBar from '../components/SearchBar';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import LoadingSpinner from '../components/LoadingSpinner';

export const Tasks = ({ showNotification }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'pending' | 'completed'
  const [sortBy, setSortBy] = useState('created_at'); // 'created_at' | 'due_date' | 'category'
  const [filters, setFilters] = useState({ search: '', category: 'All' });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      // Build query arguments matching backend routes.py
      const apiFilters = {
        search: filters.search,
        category: filters.category,
        status: activeTab === 'All' ? 'All' : activeTab,
      };
      
      const response = await apiService.getAllTasks(apiFilters);
      setTasks(response.tasks || []);
    } catch (err) {
      showNotification(err.message || 'Failed to fetch tasks.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, activeTab, showNotification]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskUpdate = async (id, updatedFields) => {
    try {
      await apiService.updateTask(id, updatedFields);
      showNotification('Task updated successfully.', 'success');
      fetchTasks();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleTaskDelete = async (id) => {
    try {
      await apiService.deleteTask(id);
      showNotification('Task deleted successfully.', 'success');
      fetchTasks();
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  // Bulk actions: Mark all complete
  const handleMarkAllComplete = async () => {
    const pendingTasks = tasks.filter((t) => t.status === 'pending');
    if (pendingTasks.length === 0) {
      showNotification('No pending tasks to complete.', 'info');
      return;
    }

    setLoading(true);
    try {
      // Execute concurrently
      await Promise.all(
        pendingTasks.map((t) => apiService.updateTask(t.id, { status: 'completed' }))
      );
      showNotification(`Successfully completed ${pendingTasks.length} tasks!`, 'success');
      fetchTasks();
    } catch (err) {
      showNotification(err.message || 'Failed to complete all tasks.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Local sorting rules
  const getSortedTasks = () => {
    return [...tasks].sort((a, b) => {
      if (sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'due_date') {
        const dateA = a.due_date || '9999-99-99';
        const dateB = b.due_date || '9999-99-99';
        return dateA.localeCompare(dateB);
      } else if (sortBy === 'category') {
        return (a.category || '').localeCompare(b.category || '');
      }
      return 0;
    });
  };

  const handleSearchBarChange = (newFilters) => {
    // If the status dropdown changes in SearchBar, let's sync it with our tabs
    if (newFilters.status && newFilters.status !== 'All') {
      setActiveTab(newFilters.status);
    }
    setFilters({
      search: newFilters.search,
      category: newFilters.category,
    });
  };

  const sortedTasksList = getSortedTasks();

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Top Search bar filters */}
      <SearchBar onChange={handleSearchBarChange} />

      {/* Action Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        {/* Sorting options */}
        <div className="flex items-center space-x-3 text-sm">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-2xs">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-card text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="created_at">Date Created</option>
            <option value="due_date">Due Date</option>
            <option value="category">Category</option>
          </select>
        </div>

        {/* Tab Selection Row & Button actions */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl text-xs font-bold">
            {['All', 'pending', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors duration-200 ${
                  activeTab === tab
                    ? 'bg-white dark:bg-dark-card text-brand-655 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab === 'pending' ? 'Pending' : tab === 'completed' ? 'Completed' : 'All'}
              </button>
            ))}
          </div>

          {/* Bulk actions */}
          {activeTab !== 'completed' && (
            <button
              onClick={handleMarkAllComplete}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-dark-card text-xs font-extrabold text-slate-750 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-1.5"
              title="Complete all pending tasks"
            >
              <FiCheckSquare className="w-4 h-4 text-emerald-500" />
              <span className="hidden md:inline">Mark All Completed</span>
            </button>
          )}

          {/* Toggle form button */}
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-xs font-extrabold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 ml-auto sm:ml-0"
          >
            {showForm ? <FiMinus className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
            <span>{showForm ? 'Close Form' : 'Add Task'}</span>
          </button>
        </div>
      </div>

      {/* Task Creation Form dropdown view */}
      {showForm && (
        <div className="animate-slide-down">
          <TaskForm
            onTaskCreated={() => {
              fetchTasks();
              setShowForm(false);
            }}
            showNotification={showNotification}
          />
        </div>
      )}

      {/* Task Count indicator label */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest">
          Showing {sortedTasksList.length} task{sortedTasksList.length !== 1 && 's'}
        </span>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner text="Refreshing tasks list..." />
        </div>
      ) : (
        <TaskList
          tasks={sortedTasksList}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}
    </div>
  );
};

export default Tasks;
