import React, { useState } from 'react';
import { Edit2, Trash2, Check, X, Calendar, Clock, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export const TaskCard = ({ task, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Inline edit states
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editCategory, setEditCategory] = useState(task.category);
  const [editPriority, setEditPriority] = useState(task.priority || 'Medium');
  const [editDueDate, setEditDueDate] = useState(task.due_date);
  const [editDueTime, setEditDueTime] = useState(task.due_time);
  const [editTags, setEditTags] = useState(task.tags.join(', '));

  // Expanded details & activity log states
  const [isExpanded, setIsExpanded] = useState(false);
  const [relatedTasks, setRelatedTasks] = useState([]);
  const [recentAccessedList, setRecentAccessedList] = useState([]);

  const calculateRelatedTasks = (currentTask, allTasksList) => {
    if (!allTasksList || allTasksList.length === 0) return [];
    
    const currentTags = currentTask.tags || [];
    const currentTitleWords = (currentTask.title || '').toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !['the', 'and', 'for', 'with', 'your', 'this', 'that', 'from', 'have', 'will'].includes(w));
      
    const scored = allTasksList
      .filter(t => t.id !== currentTask.id)
      .map(t => {
        let score = 0;
        
        if (t.category && t.category === currentTask.category) {
          score += 2;
        }
        
        const tTags = t.tags || [];
        const commonTags = tTags.filter(tag => currentTags.includes(tag));
        score += commonTags.length * 3;
        
        const tTitleWords = (t.title || '').toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 2);
        const commonWords = tTitleWords.filter(w => currentTitleWords.includes(w));
        score += commonWords.length * 2;
        
        return { task: t, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.task);
      
    return scored;
  };

  const addToRecentlyAccessed = (taskToAdd) => {
    try {
      const saved = localStorage.getItem('recently_accessed_tasks');
      let queue = saved ? JSON.parse(saved) : [];
      
      queue = queue.filter(t => t.id !== taskToAdd.id);
      queue.unshift({
        id: taskToAdd.id,
        title: taskToAdd.title,
        category: taskToAdd.category,
        priority: taskToAdd.priority,
        status: taskToAdd.status,
        due_date: taskToAdd.due_date,
        due_time: taskToAdd.due_time,
        tags: taskToAdd.tags
      });
      
      if (queue.length > 10) {
        queue = queue.slice(0, 10);
      }
      
      localStorage.setItem('recently_accessed_tasks', JSON.stringify(queue));
      return queue;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const handleToggleExpand = async () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    if (nextState) {
      const updatedQueue = addToRecentlyAccessed(task);
      setRecentAccessedList(updatedQueue);
      
      try {
        const response = await apiService.getAllTasks();
        const tasksList = response.tasks || [];
        const related = calculateRelatedTasks(task, tasksList);
        setRelatedTasks(related);
      } catch (err) {
        console.error("Failed to fetch tasks for related suggestions", err);
      }
    }
  };

  const handleCardClick = (e) => {
    if (isEditing) return;
    handleToggleExpand();
  };

  const handleDuplicate = async (e) => {
    e.stopPropagation();
    try {
      const taskData = {
        title: `${task.title} (Copy)`,
        description: task.description,
        category: task.category,
        priority: task.priority,
        due_date: task.due_date,
        due_time: task.due_time,
        tags: task.tags
      };
      await apiService.createTask(taskData);
      toast.success('Task duplicated successfully!');
      window.dispatchEvent(new Event('refresh-task-list'));
    } catch (err) {
      toast.error(err.message || 'Failed to duplicate task.');
    }
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const link = `${window.location.origin}/tasks?search=${encodeURIComponent(task.title)}`;
    navigator.clipboard.writeText(link);
    toast.success('Search link copied to clipboard!');
  };

  const handleCategoryChange = (e, newCat) => {
    e.stopPropagation();
    onUpdate(task.id, { category: newCat });
    toast.success(`Category updated to ${newCat}`);
  };

  const categoryColors = {
    Work: 'border-blue-900/40 bg-blue-950/20 text-blue-400',
    Study: 'border-purple-900/40 bg-purple-950/20 text-purple-400',
    Personal: 'border-amber-950/40 bg-amber-950/10 text-amber-400',
    Shopping: 'border-pink-900/40 bg-pink-950/20 text-pink-400',
    Health: 'border-emerald-900/40 bg-emerald-950/20 text-emerald-400',
    Finance: 'border-yellow-900/40 bg-yellow-950/10 text-yellow-550',
    Travel: 'border-cyan-900/40 bg-cyan-950/20 text-cyan-400',
    Other: 'border-[#262626] bg-[#101010] text-[#A3A3A3]',
  };

  const priorityColors = {
    High: 'border-red-950/40 bg-red-950/20 text-[#EF4444]',
    Medium: 'border-amber-950/40 bg-amber-950/10 text-[#F59E0B]',
    Low: 'border-[#262626] bg-[#0F0F0F] text-[#737373]',
  };

  const handleStatusToggle = () => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    onUpdate(task.id, { status: newStatus });
  };

  const handleSave = () => {
    if (!editTitle.trim()) return;
    
    const formattedTags = editTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    onUpdate(task.id, {
      title: editTitle,
      description: editDescription,
      category: editCategory,
      priority: editPriority,
      due_date: editDueDate,
      due_time: editDueTime,
      tags: formattedTags,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditCategory(task.category);
    setEditPriority(task.priority || 'Medium');
    setEditDueDate(task.due_date);
    setEditDueTime(task.due_time);
    setEditTags(task.tags.join(', '));
    setIsEditing(false);
  };

  const isCompleted = task.status === 'completed';

  return (
    <div
      onClick={handleCardClick}
      className={`group relative p-5 bg-[#171717] border rounded-2xl cursor-pointer transition-all duration-300 ${
        isCompleted
          ? 'border-emerald-950/30 bg-emerald-950/5'
          : 'border-[#262626] hover:border-[#DC2626]/50 shadow-lg shadow-black/35 hover:shadow-[#DC2626]/5'
      } ${isExpanded ? 'border-[#DC2626]/50 shadow-[#DC2626]/5' : ''}`}
    >
      {/* Confirm deletion overlay */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-[#171717]/95 rounded-2xl border border-[#262626]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold text-white mb-3 text-center">
              Are you sure you want to delete this task?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                  setShowConfirmDelete(false);
                }}
                className="px-3.5 py-1.5 bg-[#DC2626] text-white rounded-xl text-3xs font-bold hover:bg-[#EF4444] transition-all"
              >
                Yes, Delete
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirmDelete(false);
                }}
                className="px-3.5 py-1.5 bg-[#0F0F0F] border border-[#262626] text-[#A3A3A3] hover:text-white rounded-xl text-3xs font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isEditing ? (
        /* Edit Mode View */
        <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center pb-2 border-b border-[#262626]">
            <span className="text-xs font-bold text-[#DC2626] tracking-wider uppercase">Edit Task Parameters</span>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
                title="Save Changes"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                className="p-1.5 bg-[#262626] text-[#A3A3A3] hover:text-white rounded-lg transition-all"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[9px] font-extrabold uppercase tracking-wider text-[#737373] mb-1">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-1.8 text-xs rounded-xl border border-[#262626] bg-[#0F0F0F] text-white focus:outline-none focus:border-[#DC2626] transition-all"
              />
            </div>

            <div>
              <label className="block text-[9px] font-extrabold uppercase tracking-wider text-[#737373] mb-1">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.8 text-xs rounded-xl border border-[#262626] bg-[#0F0F0F] text-white focus:outline-none focus:border-[#DC2626] transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-[#737373] mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-1.8 text-xs rounded-xl border border-[#262626] bg-[#0F0F0F] text-white focus:outline-none focus:border-[#DC2626]"
                >
                  <option value="Work">Work</option>
                  <option value="Study">Study</option>
                  <option value="Personal">Personal</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Health">Health</option>
                  <option value="Finance">Finance</option>
                  <option value="Travel">Travel</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-[#737373] mb-1">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="w-full px-3 py-1.8 text-xs rounded-xl border border-[#262626] bg-[#0F0F0F] text-white focus:outline-none focus:border-[#DC2626]"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-[#737373] mb-1">Tags (comma split)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3 py-1.8 text-xs rounded-xl border border-[#262626] bg-[#0F0F0F] text-white focus:outline-none focus:border-[#DC2626]"
                  placeholder="tag1, tag2"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-[#737373] mb-1">Due Time</label>
                <input
                  type="text"
                  value={editDueTime}
                  onChange={(e) => setEditDueTime(e.target.value)}
                  className="w-full px-3 py-1.8 text-xs rounded-xl border border-[#262626] bg-[#0F0F0F] text-white focus:outline-none focus:border-[#DC2626]"
                  placeholder="3:00 PM"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold uppercase tracking-wider text-[#737373] mb-1">Due Date</label>
              <input
                type="text"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full px-3 py-1.8 text-xs rounded-xl border border-[#262626] bg-[#0F0F0F] text-white focus:outline-none focus:border-[#DC2626]"
                placeholder="Tomorrow or YYYY-MM-DD"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Read-only Mode View */
        <div className="flex flex-col min-w-0 w-full">
          <div className="flex items-start space-x-4">
            
            {/* Status Checkbox */}
            <div className="flex-shrink-0 pt-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusToggle();
                }}
                className={`w-5 h-5 flex items-center justify-center rounded-md border transition-all duration-200 ${
                  isCompleted
                    ? 'bg-[#22C55E] border-[#22C55E] text-white'
                    : 'border-[#262626] hover:border-[#DC2626] bg-[#0F0F0F]'
                }`}
                title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
              >
                {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
              </button>
            </div>

            {/* Details Section */}
            <div className="flex-grow min-w-0">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                
                {/* Title & Badge row */}
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={`text-sm font-semibold leading-tight break-words transition-all duration-350 ${
                      isCompleted ? 'line-through text-[#737373]' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </h3>
                  
                  {/* Category Badge */}
                  <span
                    className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md border ${
                      categoryColors[task.category] || categoryColors.Other
                    }`}
                  >
                    {task.category || 'Other'}
                  </span>

                  {/* Priority Badge */}
                  <span
                    className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md border ${
                      priorityColors[task.priority] || priorityColors.Medium
                    }`}
                  >
                    {task.priority || 'Medium'}
                  </span>
                </div>

                {/* Action Dropdown Menu Trigger */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-1 rounded-lg hover:bg-[#262626] text-[#737373] hover:text-white transition-colors focus:outline-none"
                    aria-label="More actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  <AnimatePresence>
                    {showDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 mt-1 w-28 bg-[#171717] border border-[#262626] rounded-xl shadow-2xl overflow-hidden z-20"
                        >
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setShowDropdown(false);
                            }}
                            className="w-full flex items-center px-3.5 py-2 text-[10px] font-extrabold uppercase text-[#A3A3A3] hover:text-white hover:bg-[#262626] transition-colors border-b border-[#262626]"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-2 text-[#737373]" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setShowConfirmDelete(true);
                              setShowDropdown(false);
                            }}
                            className="w-full flex items-center px-3.5 py-2 text-[10px] font-extrabold uppercase text-[#DC2626] hover:bg-red-950/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2 text-[#DC2626]" />
                            Delete
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Description */}
              {task.description && (
                <p
                  className={`text-xs mb-3 break-words whitespace-pre-wrap leading-relaxed ${
                    isCompleted ? 'text-[#737373]' : 'text-[#A3A3A3]'
                  }`}
                >
                  {task.description}
                </p>
              )}

              {/* Badges footer row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                
                {/* Due Date */}
                {task.due_date && (
                  <div className="flex items-center text-[10px] font-bold text-[#737373] uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    <span>{task.due_date}</span>
                  </div>
                )}

                {/* Due Time */}
                {task.due_time && (
                  <div className="flex items-center text-[10px] font-bold text-[#737373] uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    <span>{task.due_time}</span>
                  </div>
                )}

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-lg bg-[#0F0F0F] border border-[#262626] text-[10px] font-semibold text-[#737373] group-hover:text-[#A3A3A3] transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Collapsible expanded section */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-[#262626] space-y-4 cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Quick Actions Panel */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold text-[#737373] uppercase tracking-wider">Quick Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleDuplicate}
                      className="px-2.5 py-1 rounded-xl bg-[#0F0F0F] border border-[#262626] text-[10px] font-bold uppercase text-[#A3A3A3] hover:text-white hover:border-[#DC2626]/40 transition-all"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="px-2.5 py-1 rounded-xl bg-[#0F0F0F] border border-[#262626] text-[10px] font-bold uppercase text-[#A3A3A3] hover:text-white hover:border-[#DC2626]/40 transition-all"
                    >
                      Copy Link
                    </button>
                    
                    <div className="flex items-center space-x-1.5 bg-[#0F0F0F] border border-[#262626] rounded-xl px-2 py-0.5">
                      <span className="text-[9px] text-[#737373] uppercase font-bold">Shift:</span>
                      <select
                        value={task.category}
                        onChange={(e) => handleCategoryChange(e, e.target.value)}
                        className="bg-transparent text-[9px] font-bold uppercase text-[#A3A3A3] hover:text-white focus:outline-none cursor-pointer"
                      >
                        {['Work', 'Study', 'Personal', 'Shopping', 'Health', 'Finance', 'Travel', 'Other'].map(cat => (
                          <option key={cat} value={cat} className="bg-[#171717]">{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Suggested Related Tasks */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold text-[#737373] uppercase tracking-wider">Suggested Related Tasks</h4>
                  {relatedTasks.length === 0 ? (
                    <p className="text-[11px] text-[#737373] italic">No related tasks found.</p>
                  ) : (
                    <div className="space-y-1">
                      {relatedTasks.map(t => (
                        <button
                          key={t.id}
                          onClick={() => {
                            window.location.href = `/tasks?search=${encodeURIComponent(t.title)}`;
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg bg-[#0F0F0F] hover:bg-[#2B2B2B]/35 border border-[#262626] text-left text-xs text-[#A3A3A3] hover:text-white transition-all"
                        >
                          <span className="truncate mr-2 text-xs">{t.title}</span>
                          <span className="text-[9px] px-1.5 py-0.25 rounded border border-[#262626] bg-[#171717]">{t.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recently Accessed Activity Log */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold text-[#737373] uppercase tracking-wider">Recent Activity Log</h4>
                  {recentAccessedList.length <= 1 ? (
                    <p className="text-[11px] text-[#737373] italic">No recent history.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {recentAccessedList.filter(t => t.id !== task.id).slice(0, 5).map(t => (
                        <button
                          key={t.id}
                          onClick={() => {
                            window.location.href = `/tasks?search=${encodeURIComponent(t.title)}`;
                          }}
                          className="px-2 py-0.5 rounded-lg bg-[#0F0F0F] border border-[#262626] text-[10px] text-[#737373] hover:text-white hover:border-[#808080]/30 transition-all truncate max-w-[120px]"
                          title={t.title}
                        >
                          {t.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
};

export default TaskCard;
