import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LogOut, Shield, Clock } from 'lucide-react';
import clsx from 'clsx';
import InstallButton from './InstallButton';

export default function GuardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Frota & Patrimônio</h1>
            <p className="text-xs text-slate-400 font-medium">Florestal Alimentos SA • {user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <InstallButton />
          <button 
            onClick={logout}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <LogOut className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center fixed bottom-0 w-full pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-50">
        <button 
          onClick={() => navigate('/guard/dashboard')}
          className={clsx(
            "flex flex-col items-center gap-1 transition-colors",
            location.pathname === '/guard/dashboard' ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Shield className="w-6 h-6" />
          <span className="text-[10px] font-bold">Ronda</span>
        </button>
        <button 
          onClick={() => navigate('/guard/history')}
          className={clsx(
            "flex flex-col items-center gap-1 transition-colors",
            location.pathname === '/guard/history' ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Clock className="w-6 h-6" />
          <span className="text-[10px] font-bold">Histórico</span>
        </button>
      </nav>
    </div>
  );
}
