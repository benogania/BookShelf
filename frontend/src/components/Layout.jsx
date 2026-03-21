import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f172a] overflow-hidden font-sans transition-colors duration-200">
      {/* Sidebar fixed on the left */}
      <Sidebar />
      
      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        
        {/* Scrollable content area where nested routes render */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}