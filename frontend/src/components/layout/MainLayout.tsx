import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import { useAuthStore } from '@/store/authStore';
import { LogOut, User } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const weather = useWeather();

  const hasPermission = (path: string) => {
    if (user?.role === 'Administrador') return true;
    if (path === '/') return true; // Root redirects automatically
    return user?.permissions?.includes(path) || false;
  };

  if (!hasPermission(location.pathname)) {
    const firstAllowed = user?.permissions?.[0];
    if (firstAllowed && firstAllowed !== location.pathname) {
      return <Navigate to={firstAllowed} replace />;
    }
    
    if (!firstAllowed) {
      return (
        <div className="flex h-[100dvh] bg-[#f3f4f6] relative overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-16 bg-white border-b border-slate-200 shrink-0 flex items-center justify-end px-6 gap-6 z-10 hidden md:flex">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm ${weather.style.colorClass}`}>
                {weather.style.icon}
                <span>{weather.temp}°C</span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-700 leading-tight">{user?.name || 'Usuário'}</span>
                  <span className="text-[11px] font-medium text-slate-500">{user?.email}</span>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                  <User className="w-5 h-5" />
                </div>
                <button 
                  onClick={logout}
                  className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </header>
            <main className="flex-1 overflow-auto flex items-center justify-center p-8">
              <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm w-full">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Acesso Restrito</h2>
                <p className="text-slate-500 mt-2 text-sm">Você não possui permissão para acessar o sistema. Solicite acesso ao administrador.</p>
              </div>
            </main>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex h-[100dvh] bg-[#f3f4f6] relative overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 shrink-0 flex items-center justify-end px-6 gap-6 z-10 hidden md:flex">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm ${weather.style.colorClass}`}>
            {weather.style.icon}
            <span>{weather.temp}°C</span>
          </div>
          
          <div className="h-6 w-px bg-slate-200"></div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-slate-700 leading-tight">{user?.name || 'Administrador'}</span>
              <span className="text-[11px] font-medium text-slate-500">{user?.email}</span>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
              <User className="w-5 h-5" />
            </div>
            <button 
              onClick={logout}
              className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto overflow-x-hidden p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
