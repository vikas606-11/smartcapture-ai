import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  Zap, 
  Search, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  X,
  Brain,
  BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Sidebar = ({ isOpen, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const handleSettingsClick = (e) => {
    e.preventDefault();
    window.dispatchEvent(new Event('open-settings-modal'));
    if (onClose) onClose();
  };

  const handleSearchClick = (e) => {
    e.preventDefault();
    window.dispatchEvent(new Event('open-global-search'));
    if (onClose) onClose();
  };

  const handleAnalyticsClick = (e) => {
    e.preventDefault();
    // Navigate to Summary page which acts as the core analytics panel
    window.location.href = '/summary';
    if (onClose) onClose();
  };

  const handleSmartCaptureFocus = (e) => {
    e.preventDefault();
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

  const menuItems = [
    { type: 'link', name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { type: 'action', name: 'Smart Capture', onClick: handleSmartCaptureFocus, icon: Zap },
    { type: 'link', name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { type: 'link', name: 'Notes', path: '/notes', icon: FileText },
    { type: 'link', name: 'AI Insights', path: '/summary', icon: Brain },
    { type: 'action', name: 'Search', onClick: handleSearchClick, icon: Search },
    { type: 'action', name: 'Analytics', onClick: handleAnalyticsClick, icon: BarChart2 },
    { type: 'action', name: 'Settings', onClick: handleSettingsClick, icon: Settings },
  ];

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
        animate={{ width: isCollapsed ? 72 : 240 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0D0D0D] text-[#FFFFFF] border-r border-[#262626] md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } overflow-hidden h-screen`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-[#262626] flex-shrink-0">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-[#DC2626] flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-950/40">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="font-extrabold text-xs tracking-wider uppercase text-white whitespace-nowrap"
              >
                SmartCapture <span className="text-[#DC2626]">AI</span>
              </motion.span>
            )}
          </div>
          
          {/* Close button for Mobile screen size */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#171717] text-[#737373] hover:text-[#FFFFFF] md:hidden focus:outline-none"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Collapse sidebar button for desktop screens */}
          {!isOpen && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1 rounded-lg hover:bg-[#171717] text-[#737373] hover:text-[#FFFFFF] focus:outline-none"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Items list */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.type === 'link' && (
              location.pathname === item.path || 
              (item.path === '/summary' && location.pathname === '/summary')
            );
            
            const commonClasses = `flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
              isActive
                ? 'text-white bg-[#171717]'
                : 'text-[#A3A3A3] hover:bg-[#171717]/40 hover:text-white'
            }`;

            const iconElement = (
              <Icon className={`w-[20px] h-[20px] mr-3.5 flex-shrink-0 transition-transform group-hover:scale-105 duration-200 ${
                isActive ? 'text-[#DC2626]' : 'text-[#737373] group-hover:text-[#A3A3A3]'
              }`} />
            );

            if (item.type === 'link') {
              return (
                <NavLink
                  key={idx}
                  to={item.path}
                  onClick={onClose}
                  className={commonClasses}
                >
                  {/* Active Accent Left Border Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute left-0 top-3 bottom-3 w-0.5 bg-[#DC2626]"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  {iconElement}
                  {!isCollapsed && <span>{item.name}</span>}
                </NavLink>
              );
            } else {
              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className={`${commonClasses} w-full text-left`}
                >
                  {iconElement}
                  {!isCollapsed && <span>{item.name}</span>}
                </button>
              );
            }
          })}
        </nav>

        {/* Sidebar Footer - User Profile Block */}
        <div className="p-3 border-t border-[#262626] flex-shrink-0 bg-[#0A0A0A]/50">
          {isCollapsed ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-[#171717] border border-[#262626] flex items-center justify-center text-xs font-bold text-white relative">
                JD
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0D0D0D]" />
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 px-1.5 py-1">
              <div className="w-8.5 h-8.5 rounded-full bg-[#171717] border border-[#262626] flex items-center justify-center text-xs font-bold text-white relative flex-shrink-0">
                JD
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0D0D0D]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate leading-none mb-1">John Doe</p>
                <p className="text-[10px] text-[#737373] truncate leading-none uppercase tracking-wider font-medium">Administrator</p>
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
