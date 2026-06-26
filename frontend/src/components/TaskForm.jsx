import React, { useState, useEffect } from 'react';
import { Sliders, Cpu, Sparkles, Trash2, Brain, Send, Plus } from 'lucide-react';
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

  const suggestionChips = [
    "Schedule team standup",
    "Draft project proposal",
    "Review Q3 metrics",
    "Follow up with client"
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('focus-capture') === 'true') {
      setTimeout(() => {
        const input = document.getElementById('smart-capture-input');
        input?.focus();
      }, 300);
    }
  }, []);

  const handleSmartSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!smartText.trim()) return;

    setIsLoading(true);
    const loadToast = toast.loading('AI is parsing capture payload...');
    try {
      const response = await apiService.captureText(smartText);
      toast.success(`AI successfully extracted ${response.count} tasks!`, { id: loadToast });
      setSmartText('');
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to parse tasks.', { id: loadToast });
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
    <div className="bg-[#171717] border border-[#262626] rounded-xl p-6 relative overflow-hidden transition-all duration-300">
      
      {/* Smart/Manual Switch Toggle tab */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex bg-[#0F0F0F] p-0.5 rounded-lg border border-[#262626]">
          <button
            type="button"
            onClick={() => setMode('smart')}
            className={`flex items-center px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              mode === 'smart'
                ? 'bg-[#171717] text-white border border-[#262626]'
                : 'text-[#737373] hover:text-[#FFFFFF]'
            }`}
          >
            <Brain className="mr-1.5 w-3.5 h-3.5 text-[#DC2626]" />
            Smart Capture
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex items-center px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              mode === 'manual'
                ? 'bg-[#171717] text-white border border-[#262626]'
                : 'text-[#737373] hover:text-[#FFFFFF]'
            }`}
          >
            <Sliders className="mr-1.5 w-3.5 h-3.5 text-[#737373]" />
            Manual Form
          </button>
        </div>
      </div>

      {mode === 'smart' ? (
        /* MODE 1: Smart capture input (Hero centerpiece layout) */
        <div className="space-y-4 relative z-10">
          
          {isLoading ? (
            /* Loading shimmer skeleton */
            <div className="space-y-3.5 py-2">
              <div className="h-4 bg-[#262626]/60 rounded-md w-3/4 animate-pulse" />
              <div className="h-24 bg-[#0F0F0F]/80 rounded-xl border border-[#262626] w-full animate-pulse" />
              <div className="flex space-x-2">
                <div className="h-6 bg-[#262626]/50 rounded-lg w-24 animate-pulse" />
                <div className="h-6 bg-[#262626]/50 rounded-lg w-28 animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              {/* Input Area */}
              <form onSubmit={handleSmartSubmit} className="relative flex items-center bg-[#0F0F0F] rounded-xl border border-[#262626] focus-within:border-[#DC2626]/60 transition-all px-4 py-3.5">
                <Brain className="w-5 h-5 text-[#737373] mr-3.5 flex-shrink-0" />
                <input
                  id="smart-capture-input"
                  type="text"
                  value={smartText}
                  onChange={(e) => setSmartText(e.target.value)}
                  placeholder="What would you like to accomplish today?"
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-white placeholder-[#737373] text-sm focus:outline-none"
                />
                
                {/* Actions row inside input */}
                <div className="flex items-center space-x-2 pl-3 border-l border-[#262626] flex-shrink-0">
                  {smartText && (
                    <button
                      type="button"
                      onClick={() => setSmartText('')}
                      className="px-2.5 py-1 text-xs text-[#737373] hover:text-white hover:bg-[#262626]/30 rounded-lg transition-all"
                    >
                      Clear
                    </button>
                  )}
                  
                  {/* Voice recording Mic */}
                  <VoiceInput onTranscript={handleVoiceTranscript} onError={handleVoiceError} />
                  
                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={!smartText.trim() || isLoading}
                    className="p-2 bg-[#DC2626] hover:bg-[#EF4444] text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 duration-100"
                    title="Capture"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </form>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                {suggestionChips.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSmartText(sug)}
                    className="px-3 py-1 rounded-lg border border-[#262626] bg-transparent text-xs text-[#A3A3A3] hover:bg-[#1C1C1C] hover:text-white transition-all duration-200"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </>
          )}

        </div>
      ) : (
        /* MODE 2: Manual Form inputs */
        <form onSubmit={handleManualSubmit} className="space-y-4 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-1.5">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Prepare presentation slides"
                disabled={isLoading}
                className={`w-full px-3.5 py-2 rounded-lg border bg-[#0F0F0F] text-white text-xs placeholder-[#737373] focus:outline-none focus:border-[#DC2626] transition-all ${
                  manualError ? 'border-[#DC2626]' : 'border-[#262626]'
                }`}
              />
              {manualError && (
                <p className="mt-1.5 text-2xs font-semibold text-[#DC2626]">{manualError}</p>
              )}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details or outline notes..."
                rows={2}
                disabled={isLoading}
                className="w-full px-3.5 py-2 rounded-lg border border-[#262626] bg-[#0F0F0F] text-white text-xs placeholder-[#737373] focus:outline-none focus:border-[#DC2626] transition-all resize-none"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border border-[#262626] bg-[#0F0F0F] text-white text-xs focus:outline-none focus:border-[#DC2626] cursor-pointer"
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
              <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border border-[#262626] bg-[#0F0F0F] text-white text-xs focus:outline-none focus:border-[#DC2626] cursor-pointer"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="project, core"
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border border-[#262626] bg-[#0F0F0F] text-white text-xs placeholder-[#737373] focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            {/* Due date picker input */}
            <div>
              <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g. Tomorrow or Friday"
                disabled={isLoading}
                className="w-full px-3 py-2 rounded-lg border border-[#262626] bg-[#0F0F0F] text-white text-xs placeholder-[#737373] focus:outline-none focus:border-[#DC2626]"
              />
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#DC2626] hover:bg-[#EF4444] text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 active:scale-97"
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
