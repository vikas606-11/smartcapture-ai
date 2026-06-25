import React, { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

export const SearchBar = ({ onChange }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');

  // Debounce filter modifications back to parent
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      onChange({ search, category, status });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, category, status, onChange]);

  const handleClear = () => {
    setSearch('');
    setCategory('All');
    setStatus('All');
  };

  const categories = ['All', 'Work', 'Study', 'Personal', 'Shopping', 'Health', 'Other'];
  const statuses = [
    { value: 'All', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3.5 p-4 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm transition-all duration-300">
      {/* Search text field */}
      <div className="relative flex-1">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by keywords or tags..."
          className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/80 transition-all duration-200"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Dropdown Filter */}
      <div className="w-full sm:w-44">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/80 cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'All' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Status Dropdown Filter */}
      <div className="w-full sm:w-44">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/80 cursor-pointer"
        >
          {statuses.map((stat) => (
            <option key={stat.value} value={stat.value}>
              {stat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Button */}
      {(search || category !== 'All' || status !== 'All') && (
        <button
          onClick={handleClear}
          className="px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-750 dark:hover:text-slate-200 transition-colors font-semibold text-sm flex items-center justify-center gap-1.5"
        >
          <FiX className="w-4 h-4 flex-shrink-0" />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
