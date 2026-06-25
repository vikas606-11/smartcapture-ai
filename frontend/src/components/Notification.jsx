import React, { useEffect, useState } from 'react';
import { FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export const Notification = ({ message, type = 'success', onClose, duration }) => {
  const [show, setShow] = useState(false);
  const finalDuration = duration || (type === 'success' ? 3000 : 5000);

  useEffect(() => {
    // Small delay to trigger transition
    const mountTimer = setTimeout(() => setShow(true), 50);
    
    // Auto-dismiss after the duration
    const dismissTimer = setTimeout(() => {
      setShow(false);
      const closeTimer = setTimeout(onClose, 300); // wait for fade-out transition
      return () => clearTimeout(closeTimer);
    }, finalDuration);

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(dismissTimer);
    };
  }, [onClose, finalDuration]);

  const handleManualClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const isSuccess = type === 'success';

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] flex items-center p-4 rounded-xl shadow-xl border transition-all duration-300 max-w-sm w-[calc(100%-2rem)] sm:w-full ${
        show ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      } ${
        isSuccess
          ? 'bg-emerald-50/95 border-emerald-200 dark:bg-emerald-950/80 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200'
          : 'bg-rose-50/95 border-rose-200 dark:bg-rose-950/80 dark:border-rose-900/50 text-rose-800 dark:text-rose-200'
      } backdrop-blur-sm`}
    >
      <div className="flex-shrink-0 mr-3">
        {isSuccess ? (
          <FiCheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
        ) : (
          <FiAlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
        )}
      </div>
      <div className="flex-1 text-sm font-semibold pr-2 break-words leading-tight">
        {message}
      </div>
      <button
        onClick={handleManualClose}
        className="flex-shrink-0 ml-auto p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none"
      >
        <FiX className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </button>
    </div>
  );
};

export default Notification;
