import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiCheckSquare, FiFileText, FiTrendingUp, FiX } from 'react-icons/fi';

export const Sidebar = ({ isOpen, onClose }) => {
  const links = [
    { name: 'Dashboard', path: '/', icon: FiHome },
    { name: 'Tasks', path: '/tasks', icon: FiCheckSquare },
    { name: 'Notes', path: '/notes', icon: FiFileText },
    { name: 'Summary', path: '/summary', icon: FiTrendingUp },
  ];

  return (
    <>
      {/* Backdrop layer for Mobile view */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar navigation container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-950 text-slate-100 border-r border-slate-900 transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header Logo Section */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-900">
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl animate-pulse">🧠</span>
            <span className="font-extrabold text-lg tracking-tight text-white">
              SmartCapture <span className="text-brand-500">AI</span>
            </span>
          </div>
          {/* Close button for Mobile menu */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white md:hidden focus:outline-none"
            aria-label="Close menu"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-xl font-semibold transition-all duration-200 group ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-5 h-5 mr-3.5 flex-shrink-0 transition-transform group-hover:scale-110 duration-200" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-slate-900 text-center">
          <p className="text-2xs font-semibold text-slate-600 uppercase tracking-widest">
            Personal AI Coach
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
