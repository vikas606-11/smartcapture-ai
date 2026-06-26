import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export const QuickCaptureModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    window.addEventListener('open-quick-capture', handleOpen);
    return () => window.removeEventListener('open-quick-capture', handleOpen);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    const loadingToast = toast.loading('AI is extracting your tasks...');
    try {
      const response = await apiService.captureText(text);
      toast.success(`AI successfully extracted ${response.count} tasks!`, { id: loadingToast });
      setText('');
      setIsOpen(false);
      
      // Dispatch refresh event to update dashboard and task list
      window.dispatchEvent(new Event('refresh-task-list'));
    } catch (err) {
      toast.error(err.message || 'AI capture failed.', { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-lg bg-[#171717] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden z-10 p-5 space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#262626]">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#DC2626]" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-white">AI Quick Capture</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-[#262626] text-[#737373] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe what you want to achieve... (e.g. Call dentist tomorrow at 10 AM, buy groceries, and finalize slides before Friday)"
                rows={4}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl border border-[#262626] bg-[#0F0F0F] text-white placeholder-[#737373] text-xs focus:outline-none focus:border-[#DC2626] leading-relaxed resize-none transition-all"
              />

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-[#262626] bg-[#171717] text-[#A3A3A3] hover:text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !text.trim()}
                  className="px-4 py-2 border border-[#DC2626] bg-[#DC2626] text-white rounded-xl text-xs font-bold hover:bg-[#EF4444] hover:border-[#EF4444] transition-all flex items-center space-x-1.5 shadow-md shadow-red-950/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <span>Extract Tasks</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuickCaptureModal;
