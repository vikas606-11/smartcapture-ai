import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Minus, Check, X, Calendar, Clock, Edit2, Trash2, Eye, ArrowUpDown, ChevronLeft, ChevronRight, Filter, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import SearchBar from '../components/SearchBar';
import TaskForm from '../components/TaskForm';
import { TaskRowSkeleton } from '../components/SkeletonLoaders';
import toast from 'react-hot-toast';

export const Tasks = ({ showNotification }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'pending' | 'in-progress' | 'completed'
  
  // DataTable States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState({ field: 'created_at', direction: 'desc' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // 10/25/50

  // Task viewing modal
  const [viewingTask, setViewingTask] = useState(null);

  // Inline row edits states
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editFields, setEditFields] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    due_date: '',
    due_time: '',
    tags: '',
    status: ''
  });

  const handleStartEdit = (task) => {
    setEditingTaskId(task.id);
    setEditFields({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority || 'Medium',
      due_date: task.due_date || '',
      due_time: task.due_time || '',
      tags: (task.tags || []).join(', '),
      status: task.status || 'pending'
    });
  };

  const handleSaveInlineEdit = async (id) => {
    const formattedTags = editFields.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    try {
      await apiService.updateTask(id, {
        title: editFields.title,
        description: editFields.description,
        category: editFields.category,
        priority: editFields.priority,
        due_date: editFields.due_date,
        due_time: editFields.due_time,
        tags: formattedTags,
        status: editFields.status
      });
      toast.success('Task parameters updated.');
      setEditingTaskId(null);
      fetchTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to update task.');
    }
  };

  const handleCancelInlineEdit = () => {
    setEditingTaskId(null);
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // API call
      const response = await apiService.getAllTasks();
      setTasks(response.tasks || []);
    } catch (err) {
      setError(err.message || 'Unable to connect to the backend server. Please verify it is running.');
      toast.error(err.message || 'Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    
    const handleRefresh = () => {
      fetchTasks();
    };

    window.addEventListener('refresh-task-list', handleRefresh);
    return () => window.removeEventListener('refresh-task-list', handleRefresh);
  }, [fetchTasks]);

  const handleTaskDelete = async (id) => {
    try {
      await apiService.deleteTask(id);
      toast.success('Task deleted successfully.');
      fetchTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to delete task.');
    }
  };

  const isOverdue = (dueDateStr, status) => {
    if (status === 'completed' || !dueDateStr) return false;
    const cleanDate = dueDateStr.toLowerCase().trim();
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
  };

  // Sorting & Filtering logic using useMemo for performance
  const processedTasksList = useMemo(() => {
    let result = [...tasks];

    // Text Search Title or Tags
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q) ||
        (t.tags || []).some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Status Filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'overdue') {
        result = result.filter(t => isOverdue(t.due_date, t.status));
      } else {
        result = result.filter(t => t.status === statusFilter);
      }
    }

    // Priority Filter
    if (priorityFilter !== 'All') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    // Category Filter
    if (categoryFilter !== 'All') {
      result = result.filter(t => t.category === categoryFilter);
    }

    // Sorting
    const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    
    result.sort((a, b) => {
      let valA = a[sortBy.field];
      let valB = b[sortBy.field];

      if (sortBy.field === 'priority') {
        valA = priorityWeight[a.priority] || 2;
        valB = priorityWeight[b.priority] || 2;
      }

      if (typeof valA === 'string') {
        return sortBy.direction === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortBy.direction === 'asc' ? valA - valB : valB - valA;
      }
    });

    return result;
  }, [tasks, searchQuery, statusFilter, priorityFilter, categoryFilter, sortBy]);

  // Paginated chunk
  const totalPages = Math.ceil(processedTasksList.length / itemsPerPage);
  const paginatedTasks = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return processedTasksList.slice(startIdx, startIdx + itemsPerPage);
  }, [processedTasksList, currentPage, itemsPerPage]);

  const toggleSort = (field) => {
    setSortBy(prev => {
      if (prev.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { field, direction: 'asc' };
    });
  };

  const priorityColors = {
    Critical: 'border-red-900/40 bg-red-950/20 text-[#EF4444]',
    High: 'border-orange-900/40 bg-orange-950/20 text-orange-400',
    Medium: 'border-yellow-900/40 bg-yellow-950/20 text-yellow-500',
    Low: 'border-[#262626] bg-[#101010] text-[#737373]',
  };

  const statusColors = {
    pending: 'border-blue-900/40 bg-blue-950/20 text-blue-400',
    'in-progress': 'border-purple-900/40 bg-purple-950/20 text-purple-400',
    completed: 'border-emerald-900/40 bg-emerald-950/20 text-[#22C55E]',
    overdue: 'border-red-900/40 bg-red-950/20 text-[#DC2626]',
  };

  const categoriesList = ['All', 'Work', 'Study', 'Personal', 'Shopping', 'Health', 'Finance', 'Travel', 'Other'];
  const prioritiesList = ['All', 'Critical', 'High', 'Medium', 'Low'];
  const statusesList = [
    { value: 'All', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' }
  ];

  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto">
      
      {/* 1. Header Area with toggler */}
      <div className="flex justify-between items-center pb-4 border-b border-[#262626]">
        <h2 className="section-heading text-white uppercase tracking-wider">
          Task Ledger
        </h2>
        
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="px-3.5 py-1.8 border border-[#DC2626] bg-[#050505] text-xs font-bold text-white rounded-lg hover:bg-[#DC2626] transition-all flex items-center gap-1.5 active:scale-95 shadow-lg shadow-red-950/20"
        >
          {showForm ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? 'Close Form' : 'New Task'}</span>
        </button>
      </div>

      {/* Form Drawer */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
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

      {/* 2. Filter Bar above table */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-[#171717] border border-[#262626] rounded-xl shadow-lg">
        {/* Search */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords or tags..."
            className="w-full px-3 py-2 rounded-lg border border-[#262626] bg-[#0F0F0F] text-white placeholder-[#737373] text-xs focus:outline-none focus:border-[#DC2626]"
          />
        </div>
        
        {/* Category */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#262626] bg-[#0F0F0F] text-white text-xs focus:outline-none focus:border-[#DC2626] cursor-pointer"
          >
            {categoriesList.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#262626] bg-[#0F0F0F] text-white text-xs focus:outline-none focus:border-[#DC2626] cursor-pointer"
          >
            {prioritiesList.map(p => (
              <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#262626] bg-[#0F0F0F] text-white text-xs focus:outline-none focus:border-[#DC2626] cursor-pointer"
          >
            {statusesList.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Table Container */}
      {error ? (
        <div className="flex items-center justify-center p-8 bg-[#171717] border border-[#DC2626]/20 rounded-xl text-center">
          <div className="max-w-md mx-auto py-4">
            <div className="w-12 h-12 rounded-full bg-red-950/20 text-[#DC2626] border border-red-950/30 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="card-heading text-white">Load Error</h3>
            <p className="body-text mb-4">{error}</p>
            <button
              onClick={fetchTasks}
              className="px-4 py-2 bg-[#DC2626] hover:bg-[#EF4444] text-white rounded-lg text-xs font-bold uppercase transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      ) : loading ? (
        <TaskRowSkeleton count={5} />
      ) : paginatedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-[#171717] border border-[#262626] rounded-xl shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-red-950/20 text-[#DC2626] flex items-center justify-center mb-4 border border-red-950/20">
            <Filter className="w-5 h-5 animate-pulse" />
          </div>
          <h3 className="card-heading text-white mb-1">No matching tasks found</h3>
          <p className="caption-label max-w-xs">Try clearing filters or search terms.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-[#262626] rounded-xl bg-[#171717] shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#262626] bg-[#0F0F0F] text-[#737373] text-[10px] font-extrabold uppercase tracking-widest">
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-4 min-w-[200px] cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('title')}>
                    <div className="flex items-center space-x-1.5">
                      <span>Title</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-4 w-28 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('priority')}>
                    <div className="flex items-center space-x-1.5">
                      <span>Priority</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-4 w-32 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('category')}>
                    <div className="flex items-center space-x-1.5">
                      <span>Category</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-4 w-36 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('due_date')}>
                    <div className="flex items-center space-x-1.5">
                      <span>Due Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-4 min-w-[120px]">AI Tags</th>
                  <th className="py-3 px-4 w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]/50">
                {paginatedTasks.map((task) => {
                  const isEditingRow = editingTaskId === task.id;
                  const isTaskOverdue = isOverdue(task.due_date, task.status);

                  if (isEditingRow) {
                    return (
                      <tr key={task.id} className="bg-[#1C1C1C]">
                        <td className="py-3 px-4 text-center">-</td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editFields.title}
                            onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs rounded border border-[#262626] bg-[#0F0F0F] text-white focus:outline-none focus:border-[#DC2626]"
                          />
                          <input
                            type="text"
                            value={editFields.description}
                            onChange={(e) => setEditFields({ ...editFields, description: e.target.value })}
                            className="w-full px-2 py-1 text-[11px] rounded border border-[#262626] bg-[#0F0F0F] text-[#737373] focus:outline-none focus:border-[#DC2626] mt-1.5"
                            placeholder="Description"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={editFields.priority}
                            onChange={(e) => setEditFields({ ...editFields, priority: e.target.value })}
                            className="w-full px-2 py-1.5 text-[11px] rounded border border-[#262626] bg-[#0F0F0F] text-white focus:outline-none"
                          >
                            {['Critical', 'High', 'Medium', 'Low'].map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={editFields.category}
                            onChange={(e) => setEditFields({ ...editFields, category: e.target.value })}
                            className="w-full px-2 py-1.5 text-[11px] rounded border border-[#262626] bg-[#0F0F0F] text-white focus:outline-none"
                          >
                            {categoriesList.slice(1).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editFields.due_date}
                            onChange={(e) => setEditFields({ ...editFields, due_date: e.target.value })}
                            className="w-full px-2 py-1.5 text-[11px] rounded border border-[#262626] bg-[#0F0F0F] text-white focus:outline-none placeholder-[#737373]"
                            placeholder="Due Date"
                          />
                          <input
                            type="text"
                            value={editFields.due_time}
                            onChange={(e) => setEditFields({ ...editFields, due_time: e.target.value })}
                            className="w-full px-2 py-1 text-[11px] rounded border border-[#262626] bg-[#0F0F0F] text-white focus:outline-none placeholder-[#737373] mt-1"
                            placeholder="Due Time"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editFields.tags}
                            onChange={(e) => setEditFields({ ...editFields, tags: e.target.value })}
                            className="w-full px-2 py-1.5 text-[11px] rounded border border-[#262626] bg-[#0F0F0F] text-white focus:outline-none"
                            placeholder="tag1, tag2"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center space-x-1.5">
                            <button
                              onClick={() => handleSaveInlineEdit(task.id)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelInlineEdit}
                              className="p-1.5 bg-[#262626] text-[#A3A3A3] hover:text-white rounded-lg transition-colors"
                              title="Cancel"
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
                      className="hover:bg-[#1C1C1C] transition-colors group"
                    >
                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            const next = task.status === 'completed' ? 'pending' : 'completed';
                            apiService.updateTask(task.id, { status: next }).then(fetchTasks);
                          }}
                          className={`w-5 h-5 mx-auto flex items-center justify-center rounded-md border transition-all ${
                            task.status === 'completed'
                              ? 'bg-[#22C55E] border-[#22C55E] text-white'
                              : 'border-[#262626] hover:border-[#DC2626] bg-[#0F0F0F]'
                          }`}
                        >
                          {task.status === 'completed' && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                        </button>
                      </td>

                      {/* Title & Description */}
                      <td className="py-3.5 px-4">
                        <div className="min-w-0 pr-4">
                          <span className={`text-xs font-semibold block truncate ${task.status === 'completed' ? 'line-through text-[#737373]' : 'text-white'}`}>
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="text-[11px] text-[#737373] block truncate mt-0.5 max-w-sm">
                              {task.description}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Priority badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border ${
                          priorityColors[task.priority] || priorityColors.Medium
                        }`}>
                          {task.priority || 'Medium'}
                        </span>
                      </td>

                      {/* Category chip (border only) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border border-[#262626] text-[#A3A3A3]">
                          {task.category || 'Other'}
                        </span>
                      </td>

                      {/* Due Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] font-medium text-[#737373]">
                        <div className="flex flex-col space-y-0.5">
                          {task.due_date && (
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1 text-[#737373]" />
                              <span>{task.due_date}</span>
                            </span>
                          )}
                          {task.due_time && (
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1 text-[#737373]" />
                              <span>{task.due_time}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* AI Tags */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {task.tags && task.tags.length > 0 ? (
                            task.tags.map((tag) => (
                              <span key={tag} className="px-1.5 py-0.25 rounded-md bg-[#0F0F0F] border border-[#262626] text-[10px] text-[#737373]">
                                #{tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-[#737373]/30 italic">None</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setViewingTask(task)}
                            className="p-1 rounded hover:bg-[#262626] text-[#737373] hover:text-white"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(task)}
                            className="p-1 rounded hover:bg-[#262626] text-[#737373] hover:text-white"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleTaskDelete(task.id)}
                            className="p-1 rounded hover:bg-[#262626] text-[#737373] hover:text-[#DC2626]"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Controls */}
          <div className="flex justify-between items-center px-4 py-3 bg-[#0F0F0F] border border-[#262626] rounded-xl text-xs font-semibold">
            {/* Left page count */}
            <span className="text-[#737373]">
              Page {currentPage} of {totalPages || 1}
            </span>
            
            {/* Right page items & prev/next */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <span className="text-[#737373] text-[10px] font-bold uppercase tracking-wider">Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value, 10));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded bg-[#171717] border border-[#262626] text-white text-[11px] font-bold"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex space-x-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-[#262626] bg-[#171717] hover:border-[#DC2626] disabled:opacity-40 disabled:hover:border-[#262626] text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 rounded-lg border border-[#262626] bg-[#171717] hover:border-[#DC2626] disabled:opacity-40 disabled:hover:border-[#262626] text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Dialog Modal */}
      <AnimatePresence>
        {viewingTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingTask(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative bg-[#171717] border border-[#262626] rounded-xl shadow-2xl max-w-xl w-full flex flex-col max-h-[80vh] z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#262626]">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#737373] flex items-center">
                  Task Parameters View
                </span>
                <button
                  onClick={() => setViewingTask(null)}
                  className="p-1.5 rounded-lg hover:bg-[#262626] text-[#737373] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <h3 className="text-sm font-bold text-white leading-tight">{viewingTask.title}</h3>
                {viewingTask.description && (
                  <p className="text-xs text-[#A3A3A3] leading-relaxed break-words whitespace-pre-wrap">{viewingTask.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="block text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-1">Priority</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                      priorityColors[viewingTask.priority]
                    }`}>
                      {viewingTask.priority}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-1">Category</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#262626] text-[#A3A3A3]">
                      {viewingTask.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[#262626] bg-[#0D0D0D] flex justify-end">
                <button
                  onClick={() => setViewingTask(null)}
                  className="px-4 py-2 border border-[#262626] bg-[#171717] text-white rounded-lg text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Tasks;
