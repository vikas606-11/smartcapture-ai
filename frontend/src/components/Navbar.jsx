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

  const getPageTitle = (path) => {
    switch (path) {
      case '/':
        return 'Analytics Dashboard';
      case '/tasks':
        return 'Workspace Tasks';
      case '/notes':
        return 'Notes Ledger';
      case '/summary':
        return 'AI Summaries';
      default:
        return 'SmartCapture Platform';
    }
  };

  const handleNotificationClick = () => {
    toast('No new notifications.', {
      icon: '🔔',
      style: {
        background: '#171717',
        color: '#FFFFFF',
        border: '1px solid #2B2B2B',
        borderRadius: '12px',
      }
    });
  };

  const handleQuickCapture = () => {
    // Open Quick Capture modal
    window.dispatchEvent(new Event('open-quick-capture'));
  };

  const handleSearchTrigger = () => {
    window.dispatchEvent(new Event('open-global-search'));
  };

  return (
    <header className="sticky top-0 z-45 flex items-center justify-between w-full h-16 px-6 bg-[#0D0D0D]/90 border-b border-[#2B2B2B] backdrop-blur-md transition-colors duration-300">
      
      {/* Left side info */}
      <div className="flex items-center space-x-4">
        {/* Toggle Sidebar Button for Mobile */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl md:hidden hover:bg-[#171717] text-[#B3B3B3] hover:text-[#FFFFFF] transition-colors focus:outline-none"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title */}
        <h1 className="text-sm font-bold tracking-wider uppercase text-white hidden md:block">
          {getPageTitle(location.pathname)}
        </h1>
        
        {/* Mobile Header Logo */}
        <div className="flex items-center space-x-2 md:hidden">
          <div className="w-6 h-6 rounded-md bg-[#DC2626] flex items-center justify-center">
            <span className="text-white text-xs font-black">AI</span>
          </div>
          <span className="font-extrabold text-white tracking-widest text-xs uppercase">
            SmartCapture
          </span>
        </div>
      </div>

      {/* Middle Global Search trigger */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <button
          onClick={handleSearchTrigger}
          className="w-full flex items-center space-x-2.5 px-3 py-1.8 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-[#808080] hover:text-[#B3B3B3] hover:border-[#808080]/30 transition-all text-xs font-medium text-left focus:outline-none"
        >
          <Search className="w-4 h-4 text-[#808080]" />
          <span>Search tasks, categories, or tags... (Ctrl+K)</span>
          <span className="ml-auto px-1.5 py-0.5 text-4xs bg-[#171717] rounded border border-[#2B2B2B] text-[#808080]">⌘K</span>
        </button>
      </div>

      {/* Right side items */}
      <div className="flex items-center space-x-4">
        
        {/* Date Display */}
        <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-[#B3B3B3] text-xs font-bold">
          <Calendar className="w-3.5 h-3.5 text-[#808080]" />
          <span>{currentDate}</span>
        </div>

        {/* Quick Capture Button */}
        <button
          onClick={handleQuickCapture}
          className="px-3.5 py-1.8 border border-[#DC2626] bg-[#050505] text-xs font-bold text-white rounded-xl hover:bg-[#DC2626] transition-all flex items-center gap-1.5 shadow-md shadow-red-950/20"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Quick Capture</span>
        </button>

        {/* Notification Icon */}
        <button
          onClick={handleNotificationClick}
          className="p-2.5 rounded-xl border border-[#2B2B2B] bg-[#0F0F0F] text-[#B3B3B3] hover:text-white hover:border-[#808080]/30 transition-all relative focus:outline-none"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#DC2626] ring-1 ring-[#0F0F0F]" />
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center space-x-2 pl-1 border-l border-[#2B2B2B]">
          <div className="w-8 h-8 rounded-full border border-[#2B2B2B] bg-[#171717] flex items-center justify-center text-xs font-black text-white hover:border-[#DC2626] cursor-pointer transition-all relative">
            JD
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0D0D0D]" />
          </div>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
