import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

export const DarkModeToggle = () => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {isDark ? (
          <FiSun className="w-5 h-5 text-amber-400 transition-transform duration-300 hover:rotate-45" />
        ) : (
          <FiMoon className="w-5 h-5 text-slate-600 transition-transform duration-300 hover:-rotate-12" />
        )}
      </div>
    </button>
  );
};

export default DarkModeToggle;
