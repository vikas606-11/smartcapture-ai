import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Summary from './pages/Summary';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  return (
    <ThemeProvider>
      <Router>
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-dark-text transition-colors duration-300">
          {/* Collapsible Left Navigation Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          {/* Main Layout Container */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Navigation Bar */}
            <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
            
            {/* Scrollable Main Content Container */}
            <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-dark-bg transition-colors duration-300">
              <Routes>
                <Route path="/" element={<Dashboard showNotification={showNotification} />} />
                <Route path="/tasks" element={<Tasks showNotification={showNotification} />} />
                <Route path="/notes" element={<Notes showNotification={showNotification} />} />
                <Route path="/summary" element={<Summary showNotification={showNotification} />} />
              </Routes>
            </main>
          </div>
          
          {/* Global Toast Notification System */}
          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={clearNotification}
            />
          )}
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
