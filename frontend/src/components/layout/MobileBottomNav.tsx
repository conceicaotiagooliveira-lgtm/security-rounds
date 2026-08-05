import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Truck, Contact, Shield, Menu, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

// Optional: A simple slide-up menu for the "Mais" option
export default function MobileBottomNav() {
  const [showMore, setShowMore] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
    { icon: Truck, label: 'Veículos', path: '/vehicles' },
    { icon: Shield, label: 'Rondas', path: '/rounds' },
    { icon: Contact, label: 'Motoristas', path: '/drivers' },
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 flex items-center justify-around px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                isActive ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
        
        <button
          onClick={() => setShowMore(!showMore)}
          className={clsx(
            'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
            showMore ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'
          )}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </nav>

      {/* "Mais" Menu Overlay */}
      {showMore && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/20" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-xl border-t border-slate-200 p-4 space-y-2 animate-in slide-in-from-bottom-8">
            <h3 className="text-sm font-bold text-slate-800 mb-3 px-2">Outras Opções</h3>
            <div className="grid grid-cols-2 gap-2">
              <NavLink to="/cargo" onClick={() => setShowMore(false)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-700 font-medium text-sm">
                Entrada/Saída Veículos
              </NavLink>
              <NavLink to="/guards" onClick={() => setShowMore(false)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-700 font-medium text-sm">
                Vigias
              </NavLink>
              <NavLink to="/control/third-party" onClick={() => setShowMore(false)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-700 font-medium text-sm">
                Controle Terceiros
              </NavLink>
              <NavLink to="/control/companies" onClick={() => setShowMore(false)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-700 font-medium text-sm">
                Empresas
              </NavLink>
              <NavLink to="/control/keys" onClick={() => setShowMore(false)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-700 font-medium text-sm">
                Controle Chaves
              </NavLink>
              <NavLink to="/reports" onClick={() => setShowMore(false)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-700 font-medium text-sm">
                Relatórios
              </NavLink>
              <NavLink to="/settings" onClick={() => setShowMore(false)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-700 font-medium text-sm">
                Configurações
              </NavLink>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-100">
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/login';
                }} 
                className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair do Sistema
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
