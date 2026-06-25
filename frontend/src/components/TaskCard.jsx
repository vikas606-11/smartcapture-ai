import React, { useState } from 'react';
import { Edit2, Trash2, Check, X, Calendar, Clock, MoreVertical, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      className={`group relative p-5 bg-[#171717] border rounded-2xl transition-all duration-300 ${
        isCompleted
          ? 'border-emerald-900/20 bg-emerald-950/5'
          : 'border-[#2B2B2B] hover:border-[#DC2626]/60 shadow-lg shadow-black/35 hover:shadow-[#DC2626]/5'
      }`}
    >
      {/* Confirm deletion overlay */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-[#171717]/95 rounded-2xl border border-[#2B2B2B]"
          >
            <p className="text-xs font-semibold text-white mb-3 text-center">
              Are you sure you want to delete this task?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  onDelete(task.id);
                  setShowConfirmDelete(false);
                }}
                className="px-3.5 py-1.5 bg-[#DC2626] text-white rounded-xl text-3xs font-bold hover:bg-[#EF4444] transition-all"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-3.5 py-1.5 bg-[#0F0F0F] border border-[#2B2B2B] text-[#B3B3B3] hover:text-white rounded-xl text-3xs font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isEditing ? (
        /* Edit Mode View */
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#2B2B2B]">
            <span className="text-xs font-bold text-[#DC2626] tracking-wider uppercase">Edit Task Parameters</span>
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all"
                title="Save Changes"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 bg-[#2B2B2B] text-[#B3B3B3] hover:text-white rounded-lg transition-all"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-4xs font-extrabold uppercase tracking-widest text-[#808080] mb-1">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-1.8 text-xs rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white focus:outline-none focus:border-[#DC2626] transition-all"
              />
            </div>

            <div>
              <label className="block text-4xs font-extrabold uppercase tracking-widest text-[#808080] mb-1">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.8 text-xs rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white focus:outline-none focus:border-[#DC2626] transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-4xs font-extrabold uppercase tracking-widest text-[#808080] mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-1.8 text-xs rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white focus:outline-none focus:border-[#DC2626]"
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
                <label className="block text-4xs font-extrabold uppercase tracking-widest text-[#808080] mb-1">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="w-full px-3 py-1.8 text-xs rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white focus:outline-none focus:border-[#DC2626]"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-4xs font-extrabold uppercase tracking-widest text-[#808080] mb-1">Tags (separated by comma)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3 py-1.8 text-xs rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white focus:outline-none focus:border-[#DC2626]"
                  placeholder="tag1, tag2"
                />
              </div>

              <div>
                <label className="block text-4xs font-extrabold uppercase tracking-widest text-[#808080] mb-1">Due Time</label>
                <input
                  type="text"
                  value={editDueTime}
                  onChange={(e) => setEditDueTime(e.target.value)}
                  className="w-full px-3 py-1.8 text-xs rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white focus:outline-none"
                  placeholder="3:00 PM"
                />
              </div>
            </div>

            <div>
              <label className="block text-4xs font-extrabold uppercase tracking-widest text-[#808080] mb-1">Due Date</label>
              <input
                type="text"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full px-3 py-1.8 text-xs rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white focus:outline-none"
                placeholder="Tomorrow or YYYY-MM-DD"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Read-only Mode View */
        <div className="flex items-start space-x-4">
          
          {/* Status Checkbox */}
          <div className="flex-shrink-0 pt-0.5">
            <button
              onClick={handleStatusToggle}
              className={`w-5 h-5 flex items-center justify-center rounded-md border transition-all duration-200 ${
                isCompleted
                  ? 'bg-[#22C55E] border-[#22C55E] text-white'
                  : 'border-[#2B2B2B] hover:border-[#DC2626] bg-[#0F0F0F]'
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
                  className={`text-sm font-semibold leading-tight break-words transition-all duration-300 ${
                    isCompleted ? 'line-through text-[#808080]' : 'text-white'
                  }`}
                >
                  {task.title}
                </h3>
                
                {/* Category Badge */}
                <span
                  className={`px-2 py-0.5 text-4xs font-bold uppercase tracking-wider rounded-md border ${
                    categoryColors[task.category] || categoryColors.Other
                  }`}
                >
                  {task.category || 'Other'}
                </span>

                {/* Priority Badge */}
                <span
                  className={`px-2 py-0.5 text-4xs font-bold uppercase tracking-wider rounded-md border ${
                    priorityColors[task.priority] || priorityColors.Medium
                  }`}
                >
                  {task.priority || 'Medium'}
                </span>
              </div>

              {/* Action Dropdown Menu Trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-1 rounded-lg hover:bg-[#2B2B2B] text-[#808080] hover:text-white transition-colors focus:outline-none"
                  aria-label="More actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                <AnimatePresence>
                  {showDropdown && (
                    <>
                      <div className="fixed inset-0 z-15" onClick={() => setShowDropdown(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 mt-1 w-28 bg-[#171717] border border-[#2B2B2B] rounded-xl shadow-2xl overflow-hidden z-20"
                      >
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowDropdown(false);
                          }}
                          className="w-full flex items-center px-3.5 py-2.5 text-4xs font-bold uppercase text-[#B3B3B3] hover:text-white hover:bg-[#2B2B2B] transition-colors border-b border-[#2B2B2B]"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-2 text-[#808080]" />
                          Edit Task
                        </button>
                        <button
                          onClick={() => {
                            setShowConfirmDelete(true);
                            setShowDropdown(false);
                          }}
                          className="w-full flex items-center px-3.5 py-2.5 text-4xs font-bold uppercase text-[#DC2626] hover:bg-red-950/20 transition-colors"
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
                  isCompleted ? 'text-[#808080]' : 'text-[#B3B3B3]'
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Badges footer row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
              
              {/* Due Date */}
              {task.due_date && (
                <div className="flex items-center text-4xs font-medium text-[#808080]">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  <span>{task.due_date}</span>
                </div>
              )}

              {/* Due Time */}
              {task.due_time && (
                <div className="flex items-center text-4xs font-medium text-[#808080]">
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
                      className="px-2 py-0.5 rounded-lg bg-[#0F0F0F] border border-[#2B2B2B] text-4xs font-semibold text-[#808080] group-hover:text-[#B3B3B3] transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default TaskCard;
