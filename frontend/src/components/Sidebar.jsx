import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  Sparkles, 
  Search, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  X,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Sidebar = ({ isOpen, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Notes', path: '/notes', icon: FileText },
    { name: 'AI Summary', path: '/summary', icon: Sparkles },
  ];

  const handleSettingsClick = (e) => {
    e.preventDefault();
    toast('Settings are coming soon in Commit #3!', {
      icon: '⚙️',
      style: {
        background: '#171717',
        color: '#FFFFFF',
        border: '1px solid #2B2B2B',
        borderRadius: '12px',
      }
    });
  };

  const handleSearchClick = (e) => {
    e.preventDefault();
    // Dispatch a custom event to open the global search modal
    window.dispatchEvent(new Event('open-global-search'));
    if (onClose) onClose();
  };

  const handleSmartCaptureFocus = (e) => {
    e.preventDefault();
    // If we're not on dashboard, go to dashboard first
    if (location.pathname !== '/') {
      window.location.href = '/?focus-capture=true';
    } else {
      const captureInput = document.getElementById('smart-capture-input');
      if (captureInput) {
        captureInput.focus();
        captureInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar container */}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#101010] text-[#FFFFFF] border-r border-[#2B2B2B] md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } overflow-hidden h-screen`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-[#2B2B2B] flex-shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#DC2626] flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-950/50">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-extrabold text-sm tracking-widest uppercase text-white whitespace-nowrap"
              >
                SmartCapture <span className="text-[#DC2626]">AI</span>
              </motion.span>
            )}
          </div>
          
          {/* Close button for Mobile screen size */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#171717] text-[#808080] hover:text-[#FFFFFF] md:hidden focus:outline-none"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Collapse sidebar button for desktop screens */}
          {!isOpen && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg hover:bg-[#171717] text-[#808080] hover:text-[#FFFFFF] focus:outline-none"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Items list */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? 'text-white bg-[#171717]'
                    : 'text-[#B3B3B3] hover:bg-[#171717]/40 hover:text-white'
                }`}
              >
                {/* Active Accent Left Border Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute left-0 top-3 bottom-3 w-1 bg-[#DC2626] rounded-r-md"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                
                <Icon className={`w-5 h-5 mr-3.5 flex-shrink-0 transition-transform group-hover:scale-110 duration-200 ${
                  isActive ? 'text-[#DC2626]' : 'text-[#808080] group-hover:text-[#B3B3B3]'
                }`} />
                {!isCollapsed && <span>{link.name}</span>}
              </NavLink>
            );
          })}

          <div className="border-t border-[#2B2B2B] my-4" />

          {/* Smart Capture trigger nav */}
          <a
            href="/"
            onClick={handleSmartCaptureFocus}
            className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-[#B3B3B3] hover:bg-[#171717]/40 hover:text-white group"
          >
            <Sparkles className="w-5 h-5 mr-3.5 flex-shrink-0 text-[#808080] group-hover:text-[#DC2626] transition-colors" />
            {!isCollapsed && <span>Smart Capture</span>}
          </a>

          {/* Search Trigger */}
          <a
            href="#search"
            onClick={handleSearchClick}
            className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-[#B3B3B3] hover:bg-[#171717]/40 hover:text-white group"
          >
            <Search className="w-5 h-5 mr-3.5 flex-shrink-0 text-[#808080] group-hover:text-white transition-colors" />
            {!isCollapsed && <span>Search</span>}
          </a>

          {/* Settings Trigger */}
          <a
            href="#settings"
            onClick={handleSettingsClick}
            className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-[#B3B3B3] hover:bg-[#171717]/40 hover:text-white group"
          >
            <Settings className="w-5 h-5 mr-3.5 flex-shrink-0 text-[#808080] group-hover:text-white transition-colors" />
            {!isCollapsed && <span>Settings</span>}
          </a>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#2B2B2B] text-center flex-shrink-0">
          {!isCollapsed ? (
            <p className="text-3xs font-extrabold text-[#808080] uppercase tracking-widest">
              SaaS AI Engine v2.0
            </p>
          ) : (
            <div className="text-xs font-black text-[#DC2626]">AI</div>
          )}
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
