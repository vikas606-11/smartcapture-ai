import React from 'react';
import { useLocation } from 'react-router-dom';
import { FiMenu } from 'react-icons/fi';
import DarkModeToggle from './DarkModeToggle';

export const Navbar = ({ onToggleSidebar }) => {
  const location = useLocation();

  const getPageTitle = (path) => {
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/tasks':
        return 'Tasks Management';
      case '/notes':
        return 'Notes & Snippets';
      case '/summary':
        return 'AI Summary & Analytics';
      default:
        return 'SmartCapture AI';
    }
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between w-full h-16 px-6 bg-white/80 dark:bg-dark-card/85 border-b border-slate-200 dark:border-dark-border backdrop-blur-md transition-colors duration-300">
      <div className="flex items-center space-x-3">
        {/* Toggle Sidebar Button for Mobile */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Toggle Sidebar"
        >
          <FiMenu className="w-5.5 h-5.5" />
        </button>

        {/* Dynamic Page Title */}
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 hidden md:block">
          {getPageTitle(location.pathname)}
        </h1>

        {/* Brand Header for Mobile View */}
        <div className="flex items-center space-x-2 md:hidden">
          <span className="text-2xl">🧠</span>
          <span className="font-extrabold text-slate-855 dark:text-slate-100 tracking-tight text-base sm:text-lg">
            SmartCapture <span className="text-brand-500">AI</span>
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Status Indicator */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-brand-50/50 border border-brand-100/60 dark:bg-brand-950/20 dark:border-brand-900/35">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
          </span>
          <span className="text-xs font-semibold text-brand-700 dark:text-brand-350">
            AI Assistant Online
          </span>
        </div>

        {/* Dark Mode Toggle */}
        <DarkModeToggle />
      </div>
    </header>
  );
};

export default Navbar;
