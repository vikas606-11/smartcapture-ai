import React, { useState, useEffect } from 'react';
import { Sliders, Cpu, Plus, Sparkles, Trash2 } from 'lucide-react';
import { apiService } from '../services/api';
import VoiceInput from './VoiceInput';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

export const TaskForm = ({ onTaskCreated, showNotification }) => {
  const [mode, setMode] = useState('smart'); // 'smart' | 'manual'
  const [isLoading, setIsLoading] = useState(false);

  // Mode 1: Smart input state
  const [smartText, setSmartText] = useState('');

  // Mode 2: Manual form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [tags, setTags] = useState('');
  const [manualError, setManualError] = useState('');

  useEffect(() => {
    // If the window URL specifies focus-capture, focus on the smart input
    const params = new URLSearchParams(window.location.search);
    if (params.get('focus-capture') === 'true') {
      setTimeout(() => {
        const input = document.getElementById('smart-capture-input');
        input?.focus();
      }, 300);
    }
  }, []);

  const handleSmartSubmit = async (e) => {
    e.preventDefault();
    if (!smartText.trim()) {
      toast.error('Please describe your tasks.');
      return;
    }

    setIsLoading(true);
    const loadToast = toast.loading('AI is capturing your tasks...');
    try {
      const response = await apiService.captureText(smartText);
      toast.success(`AI successfully extracted ${response.count} tasks!`, { id: loadToast });
      setSmartText('');
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to capture tasks.', { id: loadToast });
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
      priority,
      due_date: dueDate.trim(),
      due_time: dueTime.trim(),
      tags: tags ? tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0) : []
    };

    try {
      await apiService.createTask(taskData);
      toast.success('Task successfully created!');
      // Reset manual fields
      setTitle('');
      setDescription('');
      setCategory('Work');
      setPriority('Medium');
      setDueDate('');
      setDueTime('');
      setTags('');
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create task.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceTranscript = (transcriptText) => {
    setSmartText((prevText) => {
      const cleanPrev = prevText.trim();
      if (!cleanPrev) return transcriptText;
      return `${cleanPrev} and ${transcriptText.toLowerCase()}`;
    });
    toast.success('Voice captured!');
  };

  const handleVoiceError = (errorMsg) => {
    toast.error(errorMsg);
  };

  return (
    <div className="bg-[#171717] border border-[#2B2B2B] rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300">
      {/* Background neon highlight */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-[#DC2626]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Form Tabs & Loader */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex bg-[#0F0F0F] p-1 rounded-xl border border-[#2B2B2B]">
          <button
            type="button"
            onClick={() => setMode('smart')}
            className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all duration-200 ${
              mode === 'smart'
                ? 'bg-[#171717] text-white border border-[#2B2B2B]'
                : 'text-[#808080] hover:text-[#FFFFFF]'
            }`}
          >
            <Cpu className="mr-2 w-3.5 h-3.5" />
            Smart Capture
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition-all duration-200 ${
              mode === 'manual'
                ? 'bg-[#171717] text-white border border-[#2B2B2B]'
                : 'text-[#808080] hover:text-[#FFFFFF]'
            }`}
          >
            <Sliders className="mr-2 w-3.5 h-3.5" />
            Manual Form
          </button>
        </div>
        
        {isLoading && (
          <div className="flex items-center space-x-2">
            <LoadingSpinner text="" />
            <span className="text-4xs text-[#808080] uppercase tracking-wider hidden sm:inline">Processing request</span>
          </div>
        )}
      </div>

      {mode === 'smart' ? (
        /* MODE 1: Smart capture input (Hero Visual Focus) */
        <form onSubmit={handleSmartSubmit} className="space-y-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#DC2626] fill-[#DC2626]/20 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                What would you like to accomplish today?
              </h2>
            </div>
            <p className="text-xs text-[#808080]">
              Describe one or multiple tasks in plain English. AI will automatically infer priorities, categories, tags, dates, and times.
            </p>
          </div>

          <div className="relative">
            <textarea
              id="smart-capture-input"
              value={smartText}
              onChange={(e) => setSmartText(e.target.value)}
              placeholder="e.g. Finish AWS Cloud assignment tomorrow, call Rahul at 6 PM, and buy groceries when possible"
              rows={4}
              disabled={isLoading}
              className="w-full px-4 py-3.5 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white placeholder-[#808080] text-sm focus:outline-none focus:border-[#DC2626] transition-all leading-relaxed resize-none shadow-inner"
            />
          </div>

          <div className="flex justify-between items-center">
            {/* Voice input mic widget */}
            <VoiceInput onTranscript={handleVoiceTranscript} onError={handleVoiceError} />
            
            <div className="flex space-x-3">
              {smartText && (
                <button
                  type="button"
                  onClick={() => setSmartText('')}
                  className="px-4 py-2 border border-[#2B2B2B] bg-[#171717] hover:bg-[#2B2B2B] text-[#B3B3B3] hover:text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading || !smartText.trim()}
                className="px-5 py-2.5 bg-[#050505] text-white border border-[#DC2626] rounded-xl text-xs font-bold hover:bg-[#DC2626] shadow-lg shadow-red-950/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Smart Capture</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* MODE 2: Manual fields */
        <form onSubmit={handleManualSubmit} className="space-y-4 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-3xs font-extrabold text-[#808080] uppercase tracking-widest mb-1.5">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Prepare presentation slides"
                disabled={isLoading}
                className={`w-full px-4 py-2.5 rounded-xl border bg-[#0F0F0F] text-white text-xs placeholder-[#808080] focus:outline-none focus:border-[#DC2626] transition-all ${
                  manualError ? 'border-[#DC2626]' : 'border-[#2B2B2B]'
                }`}
              />
              {manualError && (
                <p className="mt-1.5 text-2xs font-bold text-[#DC2626]">{manualError}</p>
              )}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-3xs font-extrabold text-[#808080] uppercase tracking-widest mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details or brief outline notes..."
                rows={2}
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white text-xs placeholder-[#808080] focus:outline-none focus:border-[#DC2626] transition-all resize-none"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-3xs font-extrabold text-[#808080] uppercase tracking-widest mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white text-xs focus:outline-none focus:border-[#DC2626]"
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

            {/* Priority selection */}
            <div>
              <label className="block text-3xs font-extrabold text-[#808080] uppercase tracking-widest mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white text-xs focus:outline-none focus:border-[#DC2626]"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Tags (comma separated) */}
            <div>
              <label className="block text-3xs font-extrabold text-[#808080] uppercase tracking-widest mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="project, cloud"
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white text-xs placeholder-[#808080] focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            {/* Due date picker input */}
            <div>
              <label className="block text-3xs font-extrabold text-[#808080] uppercase tracking-widest mb-1.5">
                Due Date
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g. Tomorrow or Friday"
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white text-xs placeholder-[#808080] focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            {/* Due time picker input */}
            <div>
              <label className="block text-3xs font-extrabold text-[#808080] uppercase tracking-widest mb-1.5">
                Due Time
              </label>
              <input
                type="text"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                placeholder="e.g. 3:00 PM"
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white text-xs placeholder-[#808080] focus:outline-none focus:border-[#DC2626]"
              />
            </div>

          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-[#DC2626] bg-[#050505] text-white rounded-xl text-xs font-bold hover:bg-[#DC2626] transition-all flex items-center space-x-1 shadow-md shadow-red-950/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TaskForm;
