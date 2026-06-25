import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Calendar, Clock, Tag, CornerDownLeft } from 'lucide-react';
import { apiService } from '../services/api';

export const GlobalSearchModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }

    const handleOpen = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        if (!isOpen) {
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('open-global-search', handleOpen);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-global-search', handleOpen);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    const searchTasks = async () => {
      try {
        const filters = { search: query };
        if (categoryFilter !== 'All') filters.category = categoryFilter;
        
        const response = await apiService.getAllTasks(filters);
        let tasks = response.tasks || [];
        
        if (priorityFilter !== 'All') {
          tasks = tasks.filter(t => t.priority === priorityFilter);
        }
        
        setResults(tasks);
      } catch (err) {
        console.error(err);
      }
    };

    const delay = setTimeout(searchTasks, 200);
    return () => clearTimeout(delay);
  }, [query, categoryFilter, priorityFilter, isOpen]);

  const handleRecentClick = (s) => {
    setQuery(s);
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  const selectTask = (task) => {
    if (query.trim() && !recentSearches.includes(query.trim())) {
      const updated = [query.trim(), ...recentSearches.slice(0, 4)];
      setRecentSearches(updated);
      localStorage.setItem('recent_searches', JSON.stringify(updated));
    }
    setIsOpen(false);
    window.location.href = `/tasks?search=${encodeURIComponent(task.title)}`;
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) {
        selectTask(results[0]);
      } else if (query.trim()) {
        if (!recentSearches.includes(query.trim())) {
          const updated = [query.trim(), ...recentSearches.slice(0, 4)];
          setRecentSearches(updated);
          localStorage.setItem('recent_searches', JSON.stringify(updated));
        }
        setIsOpen(false);
        window.location.href = `/tasks?search=${encodeURIComponent(query.trim())}`;
      }
    }
  };

  const highlightMatchText = (text, search) => {
    if (!search || !search.trim()) return <span>{text}</span>;
    try {
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedSearch})`, 'gi');
      const parts = text.split(regex);
      return (
        <span>
          {parts.map((part, idx) => 
            regex.test(part) ? (
              <mark key={idx} className="bg-transparent text-[#DC2626] font-bold p-0">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </span>
      );
    } catch (e) {
      return <span>{text}</span>;
    }
  };

  const categories = ['All', 'Work', 'Study', 'Personal', 'Shopping', 'Health', 'Finance', 'Travel', 'Other'];
  const priorities = ['All', 'High', 'Medium', 'Low'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-xl bg-[#171717] border border-[#2B2B2B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] z-10"
          >
            <div className="flex items-center px-4 py-3.5 border-b border-[#2B2B2B]">
              <Search className="w-5 h-5 text-[#808080] mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search all tasks..."
                className="flex-1 bg-transparent text-white placeholder-[#808080] text-sm focus:outline-none"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-[#2B2B2B] text-[#808080] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-2 border-b border-[#2B2B2B] flex flex-wrap gap-2 text-xs bg-[#0F0F0F]/60">
              <span className="text-[#808080] flex items-center mr-1">Category:</span>
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-0.5 rounded border transition-all ${
                    categoryFilter === cat
                      ? 'border-[#DC2626] bg-[#DC2626]/10 text-white font-semibold'
                      : 'border-[#2B2B2B] bg-[#171717] text-[#B3B3B3] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="px-4 py-2 border-b border-[#2B2B2B] flex flex-wrap gap-2 text-xs bg-[#0F0F0F]/60">
              <span className="text-[#808080] flex items-center mr-1">Priority:</span>
              {priorities.map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2 py-0.5 rounded border transition-all ${
                    priorityFilter === p
                      ? 'border-[#DC2626] bg-[#DC2626]/10 text-white font-semibold'
                      : 'border-[#2B2B2B] bg-[#171717] text-[#B3B3B3] hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {query.trim() === '' && (
                <>
                  {recentSearches.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-3xs font-extrabold text-[#808080] uppercase tracking-wider">Recent Searches</h3>
                        <button onClick={handleClearRecent} className="text-4xs text-[#DC2626] hover:underline font-bold uppercase">Clear</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleRecentClick(s)}
                            className="px-2.5 py-1 rounded-xl bg-[#0F0F0F] border border-[#2B2B2B] text-xs text-[#B3B3B3] hover:text-white hover:border-[#808080]/30 transition-all"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-3xs font-extrabold text-[#808080] uppercase tracking-wider">Suggested Searches</h3>
                    <div className="flex flex-wrap gap-2">
                      {['AWS Deployment', 'Cloud Presentation', 'Weekly Report', 'Gym Workout'].map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => setQuery(s)}
                          className="px-2.5 py-1 rounded-xl bg-[#0F0F0F] border border-[#2B2B2B] text-xs text-[#B3B3B3] hover:text-white hover:border-[#808080]/30 transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-3xs font-extrabold text-[#808080] uppercase tracking-wider">Popular Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {['Work', 'Study', 'Personal', 'Shopping'].map((cat, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-xl border text-xs transition-all ${
                            categoryFilter === cat
                              ? 'border-[#DC2626] bg-[#DC2626]/10 text-white font-semibold'
                              : 'border-[#2B2B2B] bg-[#0F0F0F] text-[#B3B3B3] hover:text-white hover:border-[#808080]/30'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <h3 className="text-3xs font-extrabold text-[#808080] uppercase tracking-wider mb-2">
                  {query ? 'Results' : 'Suggestions'}
                </h3>
                
                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <div className="p-3 rounded-full bg-[#2B2B2B]/20 text-[#808080] mb-3">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-white">No results found</p>
                    <p className="text-4xs text-[#808080] mt-1 max-w-[240px]">
                      We couldn't find any tasks matching "{query}". Try checking your spelling or filters.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {results.slice(0, 8).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => selectTask(task)}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#2B2B2B]/40 border border-transparent hover:border-[#2B2B2B] text-left transition-all group"
                      >
                        <div className="flex flex-col min-w-0 pr-4">
                          <span className="text-xs font-semibold text-white group-hover:text-[#DC2626] transition-colors truncate">
                            {highlightMatchText(task.title, query)}
                          </span>
                          <div className="flex items-center space-x-3 mt-1.5 text-4xs text-[#808080]">
                            {task.due_date && (
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" /> {task.due_date}
                              </span>
                            )}
                            <span className="px-1.5 py-0.25 bg-[#0F0F0F] rounded border border-[#2B2B2B]">
                              {task.category}
                            </span>
                            <span className={`px-1.5 py-0.25 rounded font-bold ${
                              task.priority === 'High' ? 'text-[#DC2626] bg-red-950/20' :
                              task.priority === 'Medium' ? 'text-[#F59E0B] bg-amber-950/20' : 'text-[#808080] bg-[#2B2B2B]/30'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                        <span className="text-[#808080] group-hover:text-white opacity-0 group-hover:opacity-100 transition-all flex items-center text-4xs">
                          Jump to <CornerDownLeft className="w-3 h-3 ml-1" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-2 border-t border-[#2B2B2B] bg-[#0F0F0F] text-4xs text-[#808080] flex justify-between">
              <span>ESC to close</span>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearchModal;
