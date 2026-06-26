import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search, Bell, Sparkles, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export const Navbar = ({ onToggleSidebar }) => {
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));
  }, []);

  const handleNotificationClick = () => {
    toast('No new notifications.', {
      icon: '🔔',
      style: {
        background: '#171717',
        color: '#FFFFFF',
        border: '1px solid #262626',
        borderRadius: '12px',
        fontSize: '13px',
      }
    });
  };

  const handleQuickCapture = () => {
    window.dispatchEvent(new Event('open-quick-capture'));
  };

  const handleSearchTrigger = () => {
    window.dispatchEvent(new Event('open-global-search'));
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between w-full h-14 px-6 bg-[#111111] border-b border-[#262626] transition-colors duration-300">
      
      {/* Left section: wordmark + version chip + date */}
      <div className="flex items-center space-x-4">
        {/* Toggle Sidebar Button for Mobile */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg md:hidden hover:bg-[#171717] text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors focus:outline-none"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Wordmark and version chip */}
        <div className="flex items-center space-x-2.5">
          <span className="font-extrabold text-white tracking-widest text-xs uppercase whitespace-nowrap">
            SmartCapture <span className="text-[#DC2626]">AI</span>
          </span>
          <span className="px-1.5 py-0.25 text-[9px] bg-[#171717] rounded border border-[#262626] text-[#737373] font-bold">
            v2.1
          </span>
        </div>

        {/* Date Display */}
        <span className="hidden lg:inline text-xs text-[#737373] font-medium pl-2 border-l border-[#262626]">
          {currentDate}
        </span>
      </div>

      {/* Center: Global Search trigger */}
      <div className="flex-1 max-w-md mx-6">
        <button
          onClick={handleSearchTrigger}
          className="w-full flex items-center space-x-2.5 px-3.5 py-2 rounded-lg border border-[#262626] bg-[#0F0F0F] text-[#737373] hover:text-[#A3A3A3] hover:border-[#737373]/30 transition-all text-xs font-medium text-left focus:outline-none"
        >
          <Search className="w-4 h-4 text-[#737373]" />
          <span className="text-xs">Search anything...</span>
          <span className="ml-auto px-1.5 py-0.5 text-[9px] bg-[#171717] rounded border border-[#262626] text-[#737373] font-bold">⌘K</span>
        </button>
      </div>

      {/* Right side items */}
      <div className="flex items-center space-x-3.5">
        
        {/* Quick Capture Button (Red CTA) */}
        <button
          onClick={handleQuickCapture}
          className="px-3 py-1.5 bg-[#DC2626] text-white rounded-lg text-xs font-bold hover:bg-[#EF4444] transition-all flex items-center gap-1.5 active:scale-95 duration-150"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span className="hidden sm:inline">Quick Capture</span>
        </button>

        {/* Notification Icon */}
        <button
          onClick={handleNotificationClick}
          className="p-2 rounded-lg border border-[#262626] bg-[#0F0F0F] text-[#A3A3A3] hover:text-white hover:border-[#737373]/30 transition-all relative focus:outline-none"
          aria-label="View notifications"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#DC2626] ring-1 ring-[#111111]" />
        </button>

        {/* User Profile Avatar */}
        <div className="w-8 h-8 rounded-full border border-[#262626] bg-[#171717] flex items-center justify-center text-xs font-bold text-white hover:border-[#DC2626] cursor-pointer transition-all relative">
          JD
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-[#111111]" />
        </div>

      </div>
    </header>
  );
};

export default Navbar;
