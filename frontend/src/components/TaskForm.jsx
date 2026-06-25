import React, { useState } from 'react';
import { FiSliders, FiCpu, FiPlus } from 'react-icons/fi';
import { apiService } from '../services/api';
import VoiceInput from './VoiceInput';
import LoadingSpinner from './LoadingSpinner';

export const TaskForm = ({ onTaskCreated, showNotification }) => {
  const [mode, setMode] = useState('smart'); // 'smart' | 'manual'
  const [isLoading, setIsLoading] = useState(false);

  // Mode 1: Smart input state
  const [smartText, setSmartText] = useState('');

  // Mode 2: Manual form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [tags, setTags] = useState('');
  const [manualError, setManualError] = useState('');

  const handleSmartSubmit = async (e) => {
    e.preventDefault();
    if (!smartText.trim()) {
      showNotification('Please enter a natural language task description.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.captureText(smartText);
      showNotification(`AI successfully extracted ${response.count} tasks!`, 'success');
      setSmartText('');
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setManualError('Task title is required.');
      return;
    }
    setManualError('');
    setIsLoading(true);

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      category,
      due_date: dueDate.trim(),
      due_time: dueTime.trim(),
      tags: tags ? tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0) : []
    };

    try {
      await apiService.createTask(taskData);
      showNotification('Task successfully created!', 'success');
      // Reset form fields
      setTitle('');
      setDescription('');
      setCategory('Work');
      setDueDate('');
      setDueTime('');
      setTags('');
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceTranscript = (transcriptText) => {
    setSmartText((prevText) => {
      const cleanPrev = prevText.trim();
      if (!cleanPrev) return transcriptText;
      // Connect transcripts naturally
      return `${cleanPrev} and ${transcriptText.toLowerCase()}`;
    });
    showNotification('Voice captured!', 'success');
  };

  const handleVoiceError = (errorMsg) => {
    showNotification(errorMsg, 'error');
  };

  return (
    <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-5.5 shadow-sm transition-all duration-300">
      {/* Form Tabs */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMode('smart')}
            className={`flex items-center px-4 py-2 rounded-lg text-xs font-extrabold tracking-wide uppercase transition-all duration-200 ${
              mode === 'smart'
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FiCpu className="mr-2 w-3.5 h-3.5" />
            Smart Capture
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex items-center px-4 py-2 rounded-lg text-xs font-extrabold tracking-wide uppercase transition-all duration-200 ${
              mode === 'manual'
                ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FiSliders className="mr-2 w-3.5 h-3.5" />
            Manual Form
          </button>
        </div>
        {isLoading && (
          <div className="flex items-center scale-75">
            <LoadingSpinner text="" />
          </div>
        )}
      </div>

      {mode === 'smart' ? (
        /* MODE 1: Smart capture input */
        <form onSubmit={handleSmartSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={smartText}
              onChange={(e) => setSmartText(e.target.value)}
              placeholder="Describe tasks in plain English... (e.g. Call dentist tomorrow at 10 AM, buy groceries, and finalize slides before Friday)"
              rows={3}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/80 transition-all leading-relaxed"
            />
          </div>
          <div className="flex justify-between items-center">
            {/* VoiceInput widget */}
            <VoiceInput onTranscript={handleVoiceTranscript} onError={handleVoiceError} />
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-brand-600/20 hover:shadow-brand-600/35 transition-all flex items-center gap-1.5"
            >
              <span>✨</span>
              <span>Smart Capture</span>
            </button>
          </div>
        </form>
      ) : (
        /* MODE 2: Manual fields */
        <form onSubmit={handleManualSubmit} className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-2xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Prepare presentation slides"
                disabled={isLoading}
                className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/80 transition-all ${
                  manualError ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              />
              {manualError && (
                <p className="mt-1 text-2xs font-bold text-rose-500">{manualError}</p>
              )}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-2xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Keep brief outline details..."
                rows={2}
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/80 transition-all"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-2xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/80"
              >
                <option value="Work">Work</option>
                <option value="Study">Study</option>
                <option value="Personal">Personal</option>
                <option value="Shopping">Shopping</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Tags (comma delimited) */}
            <div>
              <label className="block text-2xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="project, cloud"
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/80"
              />
            </div>

            {/* Due date picker input */}
            <div>
              <label className="block text-2xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                Due Date
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g. Tomorrow or Friday"
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/80"
              />
            </div>

            {/* Due time picker input */}
            <div>
              <label className="block text-2xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                Due Time
              </label>
              <input
                type="text"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                placeholder="e.g. 3:00 PM"
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/80"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-slate-905 hover:bg-slate-850 dark:bg-brand-600 dark:hover:bg-brand-700 disabled:bg-slate-400 text-white rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TaskForm;
