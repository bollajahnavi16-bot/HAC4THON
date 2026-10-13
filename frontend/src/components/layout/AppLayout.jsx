import React from 'react';
import { Navbar } from '../common/Navbar';
import { Sidebar } from '../common/Sidebar';

export const AppLayout = ({ children }) => {
  return (
    <div className="h-screen flex flex-col bg-surface-base text-ink-primary overflow-hidden">
      <Navbar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-screen-2xl mx-auto space-y-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

