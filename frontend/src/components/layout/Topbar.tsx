import { NavLink } from 'react-router-dom';
import { Bell, User, Contact, LayoutDashboard, Box, Truck, FileText, Settings, Navigation, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import clsx from 'clsx';

const navItems = [
  { icon: LayoutDashboard, path: '/dashboard' },
  { icon: Box, path: '/cargo' },
  { icon: Truck, path: '/vehicles' },
  { icon: Contact, path: '/drivers' },
  { icon: FileText, path: '/reports' },
  { icon: Settings, path: '/settings' },
];

export default function Topbar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-20 w-full flex items-center justify-between px-8 bg-transparent shrink-0">
      {/* Logo Area */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
          <Navigation className="w-6 h-6" />
        </div>
        <span className="text-2xl font-bold text-slate-800 tracking-tight">Frota &amp; Patrimônio</span>
      </div>

      {/* Center Pill Navigation */}
      <nav className="flex items-center gap-2 bg-white/50 backdrop-blur-md px-3 py-2 rounded-full border border-white/40 shadow-sm">
        {navItems.map((item, i) => (
          <NavLink
            key={i}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300',
                isActive 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-white hover:text-slate-900'
              )
            }
          >
            <item.icon className="w-5 h-5" />
          </NavLink>
        ))}
      </nav>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white/60 backdrop-blur-sm border border-white/40 text-slate-500 hover:bg-white hover:text-slate-900 transition-all shadow-sm">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm border border-white/40 pl-2 pr-4 py-1.5 rounded-full shadow-sm">
          <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
             <User className="w-5 h-5 text-slate-500" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name || 'Administrador'}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
          title="Sair do sistema"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
