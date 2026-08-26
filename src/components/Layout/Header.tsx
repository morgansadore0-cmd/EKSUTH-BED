import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { userData } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 h-14 px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md mr-2"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Ekiti State University Teaching Hospital</span>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-slate-900">Live Capacity Dashboard</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex relative px-3 py-1 bg-slate-100 rounded-full items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Live System Sync</span>
        </div>
        <button className="relative w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
}
