import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, activeTab, setActiveTab, user, logout, darkMode, toggleTheme, handleOpenAssistant, handleOpenDataManagement }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <>
      <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
          logout={logout}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            user={user}
            logout={logout}
            darkMode={darkMode}
            toggleTheme={toggleTheme}
            onOpenAssistant={handleOpenAssistant || (() => {})}
            onOpenDataManagement={handleOpenDataManagement || (() => {})}
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Layout;