import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export const SearchBar = ({ onChange }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [timeframe, setTimeframe] = useState('All');

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      onChange({ search, category, status, priority, timeframe });
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, category, status, priority, timeframe, onChange]);

  const handleClear = () => {
    setSearch('');
    setCategory('All');
    setStatus('All');
    setPriority('All');
    setTimeframe('All');
  };

  const categories = ['All', 'Work', 'Study', 'Personal', 'Shopping', 'Health', 'Finance', 'Travel', 'Other'];
  const statuses = [
    { value: 'All', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-3.5 p-4 bg-[#171717] border border-[#2B2B2B] rounded-2xl shadow-lg transition-all duration-300">
      
      {/* Search text field */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#808080]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by keywords or tags..."
          className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white placeholder-[#808080] text-xs focus:outline-none focus:border-[#DC2626] transition-all duration-200"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[#2B2B2B] text-[#808080] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="w-full sm:w-44">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white text-xs focus:outline-none focus:border-[#DC2626] cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'All' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="w-full sm:w-44">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white text-xs focus:outline-none focus:border-[#DC2626] cursor-pointer"
        >
          {statuses.map((stat) => (
            <option key={stat.value} value={stat.value}>
              {stat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Priority Filter */}
      <div className="w-full sm:w-44">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white text-xs focus:outline-none focus:border-[#DC2626] cursor-pointer"
        >
          <option value="All">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>
      </div>

      {/* Timeframe Filter */}
      <div className="w-full sm:w-44">
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-white text-xs focus:outline-none focus:border-[#DC2626] cursor-pointer"
        >
          <option value="All">All Timeframes</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due Today</option>
          <option value="this_week">Due This Week</option>
        </select>
      </div>

      {/* Clear Filters Button */}
      {(search || category !== 'All' || status !== 'All' || priority !== 'All' || timeframe !== 'All') && (
        <button
          onClick={handleClear}
          className="px-4 py-2.5 rounded-xl border border-dashed border-[#2B2B2B] hover:border-[#808080]/30 text-[#808080] hover:text-white bg-[#0F0F0F] transition-all font-semibold text-xs flex items-center justify-center gap-1.5"
        >
          <X className="w-4 h-4 flex-shrink-0" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
