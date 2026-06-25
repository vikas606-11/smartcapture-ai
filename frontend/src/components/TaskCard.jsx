import React, { useState } from 'react';
import { FiEdit, FiTrash2, FiCheck, FiX, FiCalendar, FiClock } from 'react-icons/fi';

export const TaskCard = ({ task, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Inline edit states
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editCategory, setEditCategory] = useState(task.category);
  const [editDueDate, setEditDueDate] = useState(task.due_date);
  const [editDueTime, setEditDueTime] = useState(task.due_time);
  const [editTags, setEditTags] = useState(task.tags.join(', '));

  const categoryColors = {
    Work: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/30 dark:text-blue-300',
    Study: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:border-purple-900/30 dark:text-purple-300',
    Personal: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/30 dark:text-orange-300',
    Shopping: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/30 dark:border-pink-900/30 dark:text-pink-300',
    Health: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/30 dark:text-emerald-300',
    Other: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/40 dark:text-slate-400',
  };

  const getCategoryClass = (cat) => {
    return categoryColors[cat] || categoryColors.Other;
  };

  const handleStatusToggle = () => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    onUpdate(task.id, { status: newStatus });
  };

  const handleSave = () => {
    if (!editTitle.strip) {
      if (!editTitle.trim()) return;
    }
    
    const formattedTags = editTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    onUpdate(task.id, {
      title: editTitle,
      description: editDescription,
      category: editCategory,
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
    setEditDueDate(task.due_date);
    setEditDueTime(task.due_time);
    setEditTags(task.tags.join(', '));
    setIsEditing(false);
  };

  const isCompleted = task.status === 'completed';

  return (
    <div
      className={`group relative p-5 bg-white dark:bg-dark-card border rounded-2xl transition-all duration-300 hover:shadow-md ${
        isCompleted
          ? 'border-emerald-200/80 dark:border-emerald-900/30 bg-emerald-50/10 dark:bg-emerald-950/5'
          : 'border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-850'
      }`}
    >
      {/* Confirm deletion overlay */}
      {showConfirmDelete && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-white/95 dark:bg-dark-card/95 rounded-2xl transition-all duration-200">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 text-center">
            Are you sure you want to delete this task?
          </p>
          <div className="flex space-x-3.5">
            <button
              onClick={() => {
                onDelete(task.id);
                setShowConfirmDelete(false);
              }}
              className="px-4 py-1.5 bg-rose-550 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isEditing ? (
        /* Edit Mode View */
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-bold text-brand-655 dark:text-brand-400">Edit Task</span>
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                title="Save Changes"
              >
                <FiCheck className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-655 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Cancel"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-1.8 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1.5 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.8 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1.5 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-1.8 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-150 focus:outline-none"
                >
                  <option value="Work">Work</option>
                  <option value="Study">Study</option>
                  <option value="Personal">Personal</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Health">Health</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">Tags (separated by comma)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3 py-1.8 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-150 focus:outline-none"
                  placeholder="tag1, tag2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">Due Date</label>
                <input
                  type="text"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-3 py-1.8 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-150 focus:outline-none"
                  placeholder="e.g. Tomorrow or YYYY-MM-DD"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">Due Time</label>
                <input
                  type="text"
                  value={editDueTime}
                  onChange={(e) => setEditDueTime(e.target.value)}
                  className="w-full px-3 py-1.8 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-150 focus:outline-none"
                  placeholder="e.g. 3:00 PM"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Read-only Mode View */
        <div className="flex items-start space-x-3.5">
          {/* Complete Status Checkbox */}
          <div className="flex-shrink-0 pt-1">
            <button
              onClick={handleStatusToggle}
              className={`w-6 h-6 flex items-center justify-center rounded-lg border transition-all duration-200 ${
                isCompleted
                  ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600'
                  : 'border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 bg-transparent'
              }`}
              title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
            >
              {isCompleted && <FiCheck className="w-4 h-4 stroke-[3px]" />}
            </button>
          </div>

          {/* Details Column */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              {/* Title & Category Badge */}
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={`text-base font-semibold leading-snug break-words transition-all duration-300 ${
                    isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {task.title}
                </h3>
                <span
                  className={`px-2 py-0.5 text-3xs font-bold uppercase tracking-wider rounded-md border ${getCategoryClass(
                    task.category
                  )}`}
                >
                  {task.category || 'Other'}
                </span>
              </div>

              {/* Action Buttons (Visible on hover on desktop) */}
              <div className="flex items-center space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-750 dark:hover:text-slate-200 transition-colors"
                  title="Edit task"
                >
                  <FiEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                  title="Delete task"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p
                className={`text-sm mb-3 break-words whitespace-pre-wrap leading-relaxed ${
                  isCompleted ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Due Date, Time and Tags Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
              {/* Due Date Badge */}
              {task.due_date && (
                <div className="flex items-center text-xs font-medium text-slate-400 dark:text-slate-500">
                  <FiCalendar className="w-3.5 h-3.5 mr-1" />
                  <span>{task.due_date}</span>
                </div>
              )}

              {/* Due Time Badge */}
              {task.due_time && (
                <div className="flex items-center text-xs font-medium text-slate-400 dark:text-slate-500">
                  <FiClock className="w-3.5 h-3.5 mr-1" />
                  <span>{task.due_time}</span>
                </div>
              )}

              {/* Tags List */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-3xs font-semibold text-slate-500 dark:text-slate-400"
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
