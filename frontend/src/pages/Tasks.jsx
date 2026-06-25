import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Minus, Check, X, Calendar, Clock, Edit2, Trash2, MoreHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, ChevronDown, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import SearchBar from '../components/SearchBar';
import TaskForm from '../components/TaskForm';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export const Tasks = ({ showNotification }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'pending' | 'completed'
  const [sortBy, setSortBy] = useState('created_at'); // 'created_at' | 'due_date' | 'category' | 'priority'
  const [filters, setFilters] = useState({ search: '', category: 'All' });
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Inline row edits states
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editFields, setEditFields] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    due_date: '',
    due_time: '',
    tags: ''
  });

  // Collapsible task groups state
  const [collapsedGroups, setCollapsedGroups] = useState({
    overdue: false,
    today: false,
    tomorrow: false,
    thisWeek: false,
    completed: false,
    later: false
  });

  const toggleGroup = (groupKey) => {
    setCollapsedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const handleStartEdit = (task) => {
    setEditingTaskId(task.id);
    setEditFields({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority || 'Medium',
      due_date: task.due_date || '',
      due_time: task.due_time || '',
      tags: (task.tags || []).join(', ')
    });
    setActiveMenuId(null);
  };

  const handleSaveInlineEdit = async (id) => {
    const formattedTags = editFields.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    await handleTaskUpdate(id, {
      title: editFields.title,
      description: editFields.description,
      category: editFields.category,
      priority: editFields.priority,
      due_date: editFields.due_date,
      due_time: editFields.due_time,
      tags: formattedTags
    });
    setEditingTaskId(null);
  };

  const handleCancelInlineEdit = () => {
    setEditingTaskId(null);
  };

  const handleDuplicateTask = async (task) => {
    try {
      const taskData = {
        title: `${task.title} (Copy)`,
        description: task.description || '',
        category: task.category,
        priority: task.priority || 'Medium',
        due_date: task.due_date || '',
        due_time: task.due_time || '',
        tags: task.tags || []
      };
      await apiService.createTask(taskData);
      toast.success('Task duplicated successfully!');
      fetchTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to duplicate task.');
    }
    setActiveMenuId(null);
  };

  const handleCopyTaskLink = (task) => {
    const link = `${window.location.origin}/tasks?search=${encodeURIComponent(task.title)}`;
    navigator.clipboard.writeText(link);
    toast.success('Search link copied to clipboard!');
    setActiveMenuId(null);
  };

  const handleMoveCategory = async (id, newCat) => {
    await handleTaskUpdate(id, { category: newCat });
    toast.success(`Category updated to ${newCat}`);
    setActiveMenuId(null);
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const apiFilters = {
        search: filters.search,
        category: filters.category,
        status: activeTab === 'All' ? 'All' : activeTab,
      };
      
      const response = await apiService.getAllTasks(apiFilters);
      setTasks(response.tasks || []);
      setCurrentPage(1); // Reset to page 1 on filter/tab update
    } catch (err) {
      toast.error(err.message || 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  }, [filters, activeTab]);

  useEffect(() => {
    fetchTasks();
    
    // Listen for global refresh events (triggered by Quick Capture modal)
    const handleRefresh = () => {
      fetchTasks();
    };

    window.addEventListener('refresh-task-list', handleRefresh);
    return () => window.removeEventListener('refresh-task-list', handleRefresh);
  }, [fetchTasks]);

  // Sync with search parameter from URL if exists
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setFilters(prev => ({ ...prev, search: searchParam }));
      // Clear URL params to avoid locking search
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleTaskUpdate = async (id, updatedFields) => {
    try {
      await apiService.updateTask(id, updatedFields);
      toast.success('Task updated successfully.');
      fetchTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to update task.');
    }
  };

  const handleTaskDelete = async (id) => {
    try {
      await apiService.deleteTask(id);
      toast.success('Task deleted successfully.');
      fetchTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to delete task.');
    }
  };

  const handleMarkAllComplete = async () => {
    const pendingTasks = tasks.filter((t) => t.status === 'pending');
    if (pendingTasks.length === 0) {
      toast('No pending tasks to complete.', { icon: 'ℹ️' });
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        pendingTasks.map((t) => apiService.updateTask(t.id, { status: 'completed' }))
      );
      toast.success(`Successfully completed ${pendingTasks.length} tasks!`);
      fetchTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to complete all tasks.');
    } finally {
      setLoading(false);
    }
  };

  // Sorting weight definitions
  const priorityWeight = { High: 3, Medium: 2, Low: 1 };

  const getFilteredAndSortedTasks = () => {
    let filtered = [...tasks];

    // Filter by priority
    if (filters.priority && filters.priority !== 'All') {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }

    // Filter by timeframe
    if (filters.timeframe && filters.timeframe !== 'All') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const endOfWeek = new Date(todayEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(t => {
        const dueStr = (t.due_date || '').trim().toLowerCase();
        if (!dueStr) return false;

        if (filters.timeframe === 'today') {
          if (dueStr === 'today') return true;
          const d = new Date(t.due_date);
          return !isNaN(d.getTime()) && d >= todayStart && d <= todayEnd;
        }

        if (filters.timeframe === 'overdue') {
          if (t.status === 'completed') return false;
          if (dueStr === 'today' || dueStr === 'tomorrow') return false;
          const d = new Date(t.due_date);
          return !isNaN(d.getTime()) && d < todayStart;
        }

        if (filters.timeframe === 'this_week') {
          if (dueStr === 'today') return true;
          if (dueStr === 'tomorrow') return true;
          const d = new Date(t.due_date);
          return !isNaN(d.getTime()) && d >= todayStart && d <= endOfWeek;
        }

        return true;
      });
    }

    // Sort tasks
    return filtered.sort((a, b) => {
      if (sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'due_date') {
        const dateA = a.due_date || '9999-99-99';
        const dateB = b.due_date || '9999-99-99';
        return dateA.localeCompare(dateB);
      } else if (sortBy === 'category') {
        return (a.category || '').localeCompare(b.category || '');
      } else if (sortBy === 'priority') {
        return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
      } else if (sortBy === 'alphabetical') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
  };

  const handleSearchBarChange = (newFilters) => {
    if (newFilters.status && newFilters.status !== 'All') {
      setActiveTab(newFilters.status);
    }
    setFilters({
      search: newFilters.search,
      category: newFilters.category,
      priority: newFilters.priority || 'All',
      timeframe: newFilters.timeframe || 'All',
    });
  };

  // Grouping helper
  const getGroupedTasks = (tasksList) => {
    const overdue = [];
    const today = [];
    const tomorrow = [];
    const thisWeek = [];
    const completed = [];
    const later = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(todayEnd.getTime() + 24 * 60 * 60 * 1000);

    const endOfWeek = new Date(todayEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

    tasksList.forEach(task => {
      if (task.status === 'completed') {
        completed.push(task);
        return;
      }

      const dueStr = (task.due_date || '').trim().toLowerCase();
      if (!dueStr) {
        later.push(task);
        return;
      }

      if (dueStr === 'today') {
        today.push(task);
        return;
      }

      if (dueStr === 'tomorrow') {
        tomorrow.push(task);
        return;
      }

      const dueDate = new Date(task.due_date);
      if (isNaN(dueDate.getTime())) {
        later.push(task);
      } else {
        if (dueDate < todayStart) {
          overdue.push(task);
        } else if (dueDate >= todayStart && dueDate <= todayEnd) {
          today.push(task);
        } else if (dueDate >= tomorrowStart && dueDate <= tomorrowEnd) {
          tomorrow.push(task);
        } else if (dueDate > tomorrowEnd && dueDate <= endOfWeek) {
          thisWeek.push(task);
        } else {
          later.push(task);
        }
      }
    });

    return { overdue, today, tomorrow, thisWeek, completed, later };
  };

  const sortedTasksList = getFilteredAndSortedTasks();
  
  // Paginate items
  const totalPages = Math.ceil(sortedTasksList.length / itemsPerPage);
  const paginatedTasks = sortedTasksList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const categoryColors = {
    Work: 'border-blue-900/60 bg-blue-950/20 text-blue-400',
    Study: 'border-purple-900/60 bg-purple-950/20 text-purple-400',
    Personal: 'border-amber-950/80 bg-amber-950/10 text-amber-400',
    Shopping: 'border-pink-900/60 bg-pink-950/20 text-pink-400',
    Health: 'border-emerald-900/60 bg-emerald-950/20 text-emerald-400',
    Finance: 'border-yellow-900/60 bg-yellow-950/10 text-yellow-450',
    Travel: 'border-cyan-900/60 bg-cyan-950/20 text-cyan-400',
    Other: 'border-[#2B2B2B] bg-[#101010] text-[#B3B3B3]',
  };

  const priorityColors = {
    High: 'border-[#DC2626]/40 bg-red-950/20 text-[#EF4444]',
    Medium: 'border-[#F59E0B]/40 bg-amber-950/20 text-[#F59E0B]',
    Low: 'border-[#2B2B2B] bg-[#101010] text-[#808080]',
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      
      {/* Filtering Row */}
      <SearchBar onChange={handleSearchBarChange} />

      {/* Action header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#2B2B2B]">
        {/* Sort Options dropdown */}
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-[#808080] font-bold uppercase tracking-wider text-4xs flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort By:</span>
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.8 rounded-xl border border-[#2B2B2B] bg-[#171717] text-xs font-semibold text-white focus:outline-none focus:border-[#DC2626] cursor-pointer"
          >
            <option value="created_at">Date Created</option>
            <option value="due_date">Due Date</option>
            <option value="category">Category</option>
            <option value="priority">Priority Weight</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>

        {/* Status Tab selections */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-[#0F0F0F] p-1 rounded-xl border border-[#2B2B2B] text-xs">
            {['All', 'pending', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors font-semibold ${
                  activeTab === tab
                    ? 'bg-[#171717] text-white border border-[#2B2B2B]'
                    : 'text-[#808080] hover:text-white'
                }`}
              >
                {tab === 'pending' ? 'Pending' : tab === 'completed' ? 'Completed' : 'All'}
              </button>
            ))}
          </div>

          {/* Bulk Action complete all */}
          {activeTab !== 'completed' && (
            <button
              onClick={handleMarkAllComplete}
              className="px-3.5 py-2 border border-[#2B2B2B] hover:border-[#808080]/30 bg-[#171717] text-xs font-bold text-white rounded-xl transition-all flex items-center gap-1.5"
              title="Complete all pending tasks"
            >
              <Check className="w-4 h-4 text-[#22C55E]" />
              <span className="hidden md:inline">Complete All</span>
            </button>
          )}

          {/* Toggle manual form dropdown */}
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="px-3.5 py-2 border border-[#DC2626] bg-[#050505] text-xs font-bold text-white rounded-xl hover:bg-[#DC2626] transition-all flex items-center gap-1.5 ml-auto sm:ml-0 shadow-md shadow-red-950/20"
          >
            {showForm ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? 'Close Form' : 'New Task'}</span>
          </button>
        </div>
      </div>

      {/* Manual creation form drawer overlay */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <TaskForm
              onTaskCreated={() => {
                fetchTasks();
                setShowForm(false);
              }}
              showNotification={showNotification}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Task Table */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner text="Querying tasks ledger..." />
        </div>
      ) : paginatedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-[#171717] border border-[#2B2B2B] rounded-2xl shadow-xl transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-red-950/20 text-[#DC2626] flex items-center justify-center mb-4 border border-red-900/20">
            <Filter className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No tasks matched</h3>
          <p className="text-xs text-[#808080] max-w-xs leading-relaxed">
            Try resetting your filters or describe your thoughts in the capture bar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-[#2B2B2B] rounded-2xl bg-[#171717] shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2B2B2B] bg-[#101010] text-[#808080] text-3xs font-extrabold uppercase tracking-widest">
                  <th className="py-4 px-4 w-12 text-center">Status</th>
                  <th className="py-4 px-4 min-w-[200px]">Task Details</th>
                  <th className="py-4 px-4 w-28">Category</th>
                  <th className="py-4 px-4 w-28">Priority</th>
                  <th className="py-4 px-4 w-36">Timeline</th>
                  <th className="py-4 px-4 min-w-[120px]">Tags</th>
                  <th className="py-4 px-4 w-16 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B2B2B]/45">
                {(() => {
                  const grouped = getGroupedTasks(paginatedTasks);
                  const groupsDef = [
                    { key: 'overdue', title: 'Overdue', list: grouped.overdue },
                    { key: 'today', title: 'Today', list: grouped.today },
                    { key: 'tomorrow', title: 'Tomorrow', list: grouped.tomorrow },
                    { key: 'thisWeek', title: 'This Week', list: grouped.thisWeek },
                    { key: 'later', title: 'Later / Backlog', list: grouped.later },
                    { key: 'completed', title: 'Completed', list: grouped.completed }
                  ];

                  return groupsDef.map(({ key, title, list }) => {
                    if (list.length === 0) return null;
                    const isCollapsed = collapsedGroups[key];
                    
                    return (
                      <React.Fragment key={key}>
                        {/* Group Header Row */}
                        <tr 
                          onClick={() => toggleGroup(key)}
                          className="bg-[#0F0F0F] border-y border-[#2B2B2B] hover:bg-[#2B2B2B]/20 cursor-pointer select-none"
                        >
                          <td colSpan={7} className="py-2.5 px-4 font-bold text-xs text-white">
                            <div className="flex items-center space-x-2">
                              <span className="text-[#808080]">
                                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </span>
                              <span>{title}</span>
                              <span className="px-1.5 py-0.25 rounded bg-[#2B2B2B] text-5xs font-bold text-[#808080]">
                                {list.length}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Group Tasks */}
                        {!isCollapsed && list.map((task) => {
                          const isComp = task.status === 'completed';
                          const isMenuOpen = activeMenuId === task.id;
                          const isEditingRow = editingTaskId === task.id;

                          if (isEditingRow) {
                            return (
                              <tr key={task.id} className="bg-[#2B2B2B]/20">
                                <td className="py-2.5 px-4 text-center">
                                  <span className="text-4xs text-[#808080]">-</span>
                                </td>
                                <td className="py-2.5 px-4">
                                  <input
                                    type="text"
                                    value={editFields.title}
                                    onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
                                    className="w-full px-2 py-1 text-xs rounded border border-[#2B2B2B] bg-[#0F0F0F] text-white focus:outline-none focus:border-[#DC2626]"
                                  />
                                  <input
                                    type="text"
                                    value={editFields.description}
                                    onChange={(e) => setEditFields({ ...editFields, description: e.target.value })}
                                    className="w-full px-2 py-1 text-4xs rounded border border-[#2B2B2B] bg-[#0F0F0F] text-[#808080] focus:outline-none focus:border-[#DC2626] mt-1"
                                    placeholder="Description"
                                  />
                                </td>
                                <td className="py-2.5 px-4">
                                  <select
                                    value={editFields.category}
                                    onChange={(e) => setEditFields({ ...editFields, category: e.target.value })}
                                    className="px-2 py-1 text-4xs rounded border border-[#2B2B2B] bg-[#0F0F0F] text-white focus:outline-none"
                                  >
                                    {['Work', 'Study', 'Personal', 'Shopping', 'Health', 'Finance', 'Travel', 'Other'].map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2.5 px-4">
                                  <select
                                    value={editFields.priority}
                                    onChange={(e) => setEditFields({ ...editFields, priority: e.target.value })}
                                    className="px-2 py-1 text-4xs rounded border border-[#2B2B2B] bg-[#0F0F0F] text-white focus:outline-none"
                                  >
                                    {['High', 'Medium', 'Low'].map(p => (
                                      <option key={p} value={p}>{p}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2.5 px-4">
                                  <input
                                    type="text"
                                    value={editFields.due_date}
                                    onChange={(e) => setEditFields({ ...editFields, due_date: e.target.value })}
                                    className="w-full px-2 py-1 text-4xs rounded border border-[#2B2B2B] bg-[#0F0F0F] text-white focus:outline-none placeholder-[#808080]"
                                    placeholder="Due Date"
                                  />
                                  <input
                                    type="text"
                                    value={editFields.due_time}
                                    onChange={(e) => setEditFields({ ...editFields, due_time: e.target.value })}
                                    className="w-full px-2 py-1 text-4xs rounded border border-[#2B2B2B] bg-[#0F0F0F] text-white focus:outline-none placeholder-[#808080] mt-1"
                                    placeholder="Due Time"
                                  />
                                </td>
                                <td className="py-2.5 px-4">
                                  <input
                                    type="text"
                                    value={editFields.tags}
                                    onChange={(e) => setEditFields({ ...editFields, tags: e.target.value })}
                                    className="w-full px-2 py-1 text-4xs rounded border border-[#2B2B2B] bg-[#0F0F0F] text-white focus:outline-none"
                                    placeholder="tag1, tag2"
                                  />
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  <div className="flex justify-center space-x-1.5">
                                    <button
                                      onClick={() => handleSaveInlineEdit(task.id)}
                                      className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={handleCancelInlineEdit}
                                      className="p-1 bg-[#2B2B2B] text-[#B3B3B3] hover:text-white rounded transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <motion.tr
                              key={task.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`hover:bg-[#2B2B2B]/15 transition-colors group ${
                                isComp ? 'bg-[#101010]/35 text-[#808080]' : ''
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => handleTaskUpdate(task.id, { status: isComp ? 'pending' : 'completed' })}
                                  className={`w-4.5 h-4.5 mx-auto flex items-center justify-center rounded border transition-all ${
                                    isComp
                                      ? 'bg-[#22C55E] border-[#22C55E] text-white'
                                      : 'border-[#2B2B2B] hover:border-[#DC2626] bg-[#0F0F0F]'
                                  }`}
                                >
                                  {isComp && <Check className="w-3 h-3 stroke-[3px]" />}
                                </button>
                              </td>

                              {/* Details Column */}
                              <td className="py-3.5 px-4">
                                <div className="min-w-0 pr-4">
                                  <span className={`text-xs font-semibold block truncate ${isComp ? 'line-through text-[#808080]' : 'text-white'}`}>
                                    {task.title}
                                  </span>
                                  {task.description && (
                                    <span className="text-4xs text-[#808080] block truncate mt-0.5 max-w-sm">
                                      {task.description}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Category */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 text-5xs font-bold uppercase tracking-wider rounded-md border ${
                                  categoryColors[task.category] || categoryColors.Other
                                }`}>
                                  {task.category}
                                </span>
                              </td>

                              {/* Priority */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 text-5xs font-bold uppercase tracking-wider rounded-md border ${
                                  priorityColors[task.priority] || priorityColors.Medium
                                }`}>
                                  {task.priority || 'Medium'}
                                </span>
                              </td>

                              {/* Timeline */}
                              <td className="py-3.5 px-4 whitespace-nowrap text-4xs font-medium text-[#808080]">
                                <div className="flex flex-col space-y-0.5">
                                  {task.due_date && (
                                    <span className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1 flex-shrink-0 text-[#808080]" />
                                      <span>{task.due_date}</span>
                                    </span>
                                  )}
                                  {task.due_time && (
                                    <span className="flex items-center">
                                      <Clock className="w-3 h-3 mr-1 flex-shrink-0 text-[#808080]" />
                                      <span>{task.due_time}</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Tags */}
                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {task.tags && task.tags.length > 0 ? (
                                    task.tags.map((tag) => (
                                      <span key={tag} className="px-1.5 py-0.25 rounded-md bg-[#0F0F0F] border border-[#2B2B2B] text-5xs text-[#808080]">
                                        #{tag}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-5xs text-[#808080]/30 italic">None</span>
                                  )}
                                </div>
                              </td>

                              {/* Actions dropdown trigger */}
                              <td className="py-3.5 px-4 text-center relative">
                                <button
                                  onClick={() => setActiveMenuId(isMenuOpen ? null : task.id)}
                                  className="p-1 rounded hover:bg-[#2B2B2B] text-[#808080] hover:text-white transition-colors focus:outline-none"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                <AnimatePresence>
                                  {isMenuOpen && (
                                    <>
                                      <div className="fixed inset-0 z-15" onClick={() => setActiveMenuId(null)} />
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute right-4 mt-1 w-28 bg-[#171717] border border-[#2B2B2B] rounded-xl shadow-2xl overflow-hidden z-20 text-left"
                                      >
                                        <button
                                          onClick={() => {
                                            handleTaskUpdate(task.id, { status: isComp ? 'pending' : 'completed' });
                                            setActiveMenuId(null);
                                          }}
                                          className="w-full px-3 py-2 text-4xs font-bold uppercase text-[#B3B3B3] hover:text-white hover:bg-[#2B2B2B] transition-colors border-b border-[#2B2B2B] text-left"
                                        >
                                          {isComp ? 'Mark Open' : 'Complete'}
                                        </button>
                                        <button
                                          onClick={() => handleStartEdit(task)}
                                          className="w-full px-3 py-2 text-4xs font-bold uppercase text-[#B3B3B3] hover:text-white hover:bg-[#2B2B2B] transition-colors border-b border-[#2B2B2B] text-left"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDuplicateTask(task)}
                                          className="w-full px-3 py-2 text-4xs font-bold uppercase text-[#B3B3B3] hover:text-white hover:bg-[#2B2B2B] transition-colors border-b border-[#2B2B2B] text-left"
                                        >
                                          Duplicate
                                        </button>
                                        <button
                                          onClick={() => handleCopyTaskLink(task)}
                                          className="w-full px-3 py-2 text-4xs font-bold uppercase text-[#B3B3B3] hover:text-white hover:bg-[#2B2B2B] transition-colors border-b border-[#2B2B2B] text-left"
                                        >
                                          Copy Link
                                        </button>
                                        <div className="border-b border-[#2B2B2B] px-3 py-1.5 text-4xs text-[#808080] font-bold uppercase">
                                          Move To:
                                        </div>
                                        {['Work', 'Study', 'Personal', 'Shopping'].map(cat => (
                                          <button
                                            key={cat}
                                            onClick={() => handleMoveCategory(task.id, cat)}
                                            className="w-full px-4 py-1.5 text-5xs font-bold uppercase text-[#808080] hover:text-white hover:bg-[#2B2B2B] transition-colors text-left"
                                          >
                                            {cat}
                                          </button>
                                        ))}
                                        <button
                                          onClick={() => {
                                            handleTaskDelete(task.id);
                                            setActiveMenuId(null);
                                          }}
                                          className="w-full px-3 py-2 text-4xs font-bold uppercase text-[#DC2626] hover:bg-red-950/20 transition-colors text-left border-t border-[#2B2B2B]"
                                        >
                                          Delete
                                        </button>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-2 py-3 bg-[#0F0F0F] border border-[#2B2B2B] rounded-xl text-xs font-semibold">
              <span className="text-[#808080]">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded border border-[#2B2B2B] bg-[#171717] hover:border-[#DC2626] disabled:opacity-40 disabled:hover:border-[#2B2B2B] text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded border border-[#2B2B2B] bg-[#171717] hover:border-[#DC2626] disabled:opacity-40 disabled:hover:border-[#2B2B2B] text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tasks;
