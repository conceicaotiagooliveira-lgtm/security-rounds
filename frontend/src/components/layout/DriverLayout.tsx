import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LogOut, MapPin, Truck, Bell } from 'lucide-react';
import clsx from 'clsx';
import { useWeather } from '../../hooks/useWeather';

export default function DriverLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const weather = useWeather();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        
        {/* Left Side: Logo and Title */}
        <div className="flex items-center gap-3">
          <img src="/florestal.png" alt="Florestal" className="h-7 w-auto object-contain" />
          
          <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
          
          <div className="flex flex-col">
            <span className="text-blue-600 font-bold text-sm leading-tight">Frota & Patrimônio</span>
            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
              Florestal Alimentos SA
            </span>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
            <Bell className="w-4 h-4 text-blue-500" />
          </button>
          
          <div className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full font-bold text-[11px] sm:text-xs ${weather.style.colorClass}`}>
            {weather.style.icon}
            <span>{weather.temp}°C</span>
          </div>
          
          <button 
            onClick={logout}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-50 hover:bg-red-50 flex items-center justify-center transition-colors group"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="bg-slate-100 border-t border-slate-300 px-6 py-3 flex justify-around items-center fixed bottom-0 w-full pb-safe shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] z-50">
        <button 
          onClick={() => navigate('/driver/dashboard')}
          className={clsx(
            "flex flex-col items-center gap-1 transition-all px-6 py-2 rounded-2xl",
            location.pathname === '/driver/dashboard' ? "text-blue-700 bg-blue-200/60 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
          )}
        >
          <Truck className="w-6 h-6" />
          <span className="text-[11px] font-bold">Veículo</span>
        </button>
        <button 
          onClick={() => navigate('/driver/routes')}
          className={clsx(
            "flex flex-col items-center gap-1 transition-all px-6 py-2 rounded-2xl",
            location.pathname === '/driver/routes' ? "text-blue-700 bg-blue-200/60 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
          )}
        >
          <MapPin className="w-6 h-6" />
          <span className="text-[11px] font-bold">Rotas</span>
        </button>
      </nav>
    </div>
  );
}
