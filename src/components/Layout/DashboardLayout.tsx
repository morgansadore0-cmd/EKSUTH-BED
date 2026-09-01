import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useMaintenanceMonitor } from '../../hooks/useMaintenanceMonitor';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Initialize global maintenance monitoring for admins
  useMaintenanceMonitor();

  return (
    <div className="h-screen bg-[#f8fafc] dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex font-sans overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
