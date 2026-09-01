import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bed, 
  Users, 
  Search, 
  Building2, 
  ArrowRightLeft, 
  BarChart3, 
  Bell, 
  UserCog, 
  ShieldAlert, 
  Settings, 
  LogOut,
  X,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/images/1146_company_logo.jpg';
import { clsx } from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { userData, isAdmin, logoutMock } = useAuth();

  const handleLogout = async () => {
    logoutMock();
  };

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Beds', to: '/beds', icon: Bed },
    { name: 'Patients', to: '/patients', icon: Users },
    { name: 'Bed Allocation', to: '/allocation', icon: Search },
    { name: 'Wards', to: '/wards', icon: Building2 },
    { name: 'Admissions', to: '/admissions', icon: Bed },
    { name: 'Transfers', to: '/transfers', icon: ArrowRightLeft },
    { name: 'Reports', to: '/reports', icon: BarChart3 },
    { name: 'Notifications', to: '/notifications', icon: Bell },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Pending Approvals', to: '/approvals', icon: ShieldCheck });
    navItems.push({ name: 'Staff Management', to: '/staff', icon: UserCog });
    navItems.push({ name: 'Staff Registry', to: '/staff-registry', icon: Users });
    navItems.push({ name: 'Audit Logs', to: '/audit-logs', icon: ShieldAlert });
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/80 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#004d40] text-white transition-transform duration-300 lg:static lg:translate-x-0 flex flex-col shrink-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-5 border-b border-[#00695c]">
          <div className="flex items-center gap-3">
            <img src={logo} alt="EKSUTH Logo" className="w-10 h-10 rounded p-1 shadow-sm object-contain bg-white shrink-0" />
            <div className="flex flex-col">
              <h1 className="font-bold text-white text-sm leading-tight">EKSUTH</h1>
              <span className="text-[10px] uppercase text-emerald-200 tracking-wider">Bed Management</span>
            </div>
          </div>
          <button 
            className="lg:hidden text-emerald-200 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors",
                isActive 
                  ? "bg-[#00695c] text-white" 
                  : "text-emerald-100 hover:bg-[#00695c] hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#00695c]">
          <div className="flex items-center gap-3 p-2 bg-[#003d33] rounded-lg mb-4">
            <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-xs text-white font-bold shrink-0">
              {userData?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <span className="text-xs font-semibold text-white truncate">{userData?.name}</span>
              <span className="text-[10px] text-emerald-300 truncate underline">{userData?.role.replace('_', ' ')}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded text-sm font-medium text-emerald-100 hover:bg-red-500/20 hover:text-red-200 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
