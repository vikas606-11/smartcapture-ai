import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Summary from './pages/Summary';
import toast, { Toaster } from 'react-hot-toast';
import GlobalSearchModal from './components/GlobalSearchModal';
import QuickCaptureModal from './components/QuickCaptureModal';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showNotification = (message, type = 'success') => {
    const toastOptions = {
      style: {
        background: '#171717',
        color: '#FFFFFF',
        border: '1px solid #2B2B2B',
        fontSize: '14px',
        fontWeight: '500',
        borderRadius: '12px',
      },
      duration: 4000,
    };
    
    if (type === 'success') {
      toast.success(message, {
        ...toastOptions,
        iconTheme: {
          primary: '#22C55E',
          secondary: '#171717',
        },
      });
    } else if (type === 'error') {
      toast.error(message, {
        ...toastOptions,
        style: {
          ...toastOptions.style,
          border: '1px solid #DC2626',
        },
      });
    } else {
      toast(message, toastOptions);
    }
  };

  return (
    <ThemeProvider>
      <Router>
        <div className="flex h-screen overflow-hidden bg-[#050505] text-[#FFFFFF] font-sans antialiased">
          {/* Collapsible Left Navigation Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          {/* Main Layout Container */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Navigation Bar */}
            <Navbar onToggleSidebar={() => setSidebarOpen(true)} />
            
            {/* Scrollable Main Content Container */}
            <main className="flex-1 overflow-y-auto bg-[#050505] transition-all duration-300">
              <Routes>
                <Route path="/" element={<Dashboard showNotification={showNotification} />} />
                <Route path="/tasks" element={<Tasks showNotification={showNotification} />} />
                <Route path="/notes" element={<Notes showNotification={showNotification} />} />
                <Route path="/summary" element={<Summary showNotification={showNotification} />} />
              </Routes>
            </main>
          </div>
          
          {/* Global React Hot Toast System */}
          <Toaster position="bottom-right" reverseOrder={false} />

          {/* Global Search and Capture Modals */}
          <GlobalSearchModal />
          <QuickCaptureModal />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
