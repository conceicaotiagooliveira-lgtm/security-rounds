import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  User,
  LayoutDashboard,
  Box,
  Truck,
  Contact,
  FileText,
  Settings,
  Navigation,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  MapPin,
  Users,
  Key,
  ClipboardList,
  Building,
  Link2,
  Smartphone,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import clsx from 'clsx';

type NavItem = {
  icon: any;
  label: string;
  path?: string;
  children?: { icon: any; label: string; path: string }[];
};

const navItems: NavItem[] = [
  {
    icon: Truck,
    label: 'Frota',
    children: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Box, label: 'Entrada / Saída Veículos', path: '/cargo' },
      { icon: Truck, label: 'Veículos', path: '/vehicles' },
      { icon: Contact, label: 'Motoristas', path: '/drivers' },
    ],
  },
  {
    icon: Shield,
    label: 'Rondas',
    children: [
      { icon: User, label: 'Vigias', path: '/guards' },
      { icon: MapPin, label: 'Roteiro', path: '/rounds' },
    ],
  },
  {
    icon: ClipboardList,
    label: 'Controle',
    children: [
      { icon: Users, label: 'Controle de Terceiros', path: '/control/third-party' },
      { icon: Contact, label: 'Controle de Visitas', path: '/control/visits' },
      { icon: Building, label: 'Cadastro de Empresas', path: '/control/companies' },
      { icon: Key, label: 'Controle de Chaves', path: '/control/keys' },
    ],
  },
  { icon: FileText, label: 'Relatórios', path: '/reports' },
  { 
    icon: Settings, 
    label: 'Configurações', 
    children: [
      { icon: Settings, label: 'Geral', path: '/settings' },
      { icon: Link2, label: "API's", path: '/settings/apis' },
      { icon: Smartphone, label: "WhatsApp", path: '/settings/whatsapp' },
    ]
  },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const [expanded, setExpanded] = useState(true);
  const [openGroups, setOpenGroups] = useState<string[]>(['Frota']);
  const location = useLocation();

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  const hasPermission = (path?: string) => {
    if (user?.role === 'Administrador') return true;
    if (!path) return false;
    return user?.permissions?.includes(path) || false;
  };

  const filteredNavItems = navItems.map(item => {
    if (item.children) {
      const filteredChildren = item.children.filter(child => hasPermission(child.path));
      if (filteredChildren.length > 0) {
        return { ...item, children: filteredChildren };
      }
      return null;
    } else {
      if (hasPermission(item.path)) {
        return item;
      }
      return null;
    }
  }).filter(Boolean) as NavItem[];

  const isGroupActive = (item: NavItem) =>
    item.children?.some((child) => location.pathname === child.path) ?? false;

  const renderNavItem = (item: NavItem) => {
    // Group with children
    if (item.children) {
      const groupOpen = openGroups.includes(item.label);
      const active = isGroupActive(item);

      return (
        <div key={item.label}>
          <button
            onClick={() => {
              if (expanded) {
                toggleGroup(item.label);
              }
            }}
            className={clsx(
              'flex items-center gap-3 rounded-xl transition-all duration-200 w-full',
              expanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center',
              active
                ? 'text-white bg-white/5'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            )}
            title={item.label}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {expanded && (
              <>
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden flex-1 text-left">
                  {item.label}
                </span>
                <ChevronDown
                  className={clsx(
                    'w-4 h-4 shrink-0 transition-transform duration-200',
                    groupOpen ? 'rotate-0' : '-rotate-90'
                  )}
                />
              </>
            )}
          </button>

          {/* Sub-items */}
          {expanded && groupOpen && (
            <div className="ml-4 pl-3 border-l border-white/10 mt-1 space-y-0.5">
              {item.children.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-xl transition-all duration-200 px-3 py-2',
                      isActive
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    )
                  }
                  title={child.label}
                >
                  <child.icon className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium whitespace-normal leading-tight">
                    {child.label}
                  </span>
                </NavLink>
              ))}
            </div>
          )}

          {/* Collapsed: show dot indicator if active */}
          {!expanded && active && (
            <div className="flex justify-center mt-1">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
            </div>
          )}
        </div>
      );
    }

    // Single item
    return (
      <NavLink
        key={item.path}
        to={item.path!}
        className={({ isActive }) =>
          clsx(
            'flex items-center gap-3 rounded-xl transition-all duration-200 group',
            expanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center',
            isActive
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          )
        }
        title={item.label}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        {expanded && (
          <span className="text-sm font-medium whitespace-normal leading-tight">
            {item.label}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <aside
      className={clsx(
        'hidden md:flex h-screen flex-col bg-[#0f172a] text-white shrink-0 transition-all duration-300 ease-in-out relative',
        expanded ? 'w-72' : 'w-[72px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-4 h-32 shrink-0 border-b border-white/10">
        {expanded ? (
          <img src="/florestal.png" alt="Florestal Alimentos SA" className="max-h-28 w-full object-contain drop-shadow-md py-2" />
        ) : (
          <img src="/florestal.png" alt="Florestal" className="max-h-14 w-full object-contain drop-shadow-sm" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
        {filteredNavItems.map(renderNavItem)}
      </nav>

      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-3 top-24 w-6 h-6 bg-[#0f172a] border-2 border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-purple-500 transition-all z-50"
      >
        {expanded ? (
          <ChevronLeft className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </button>
    </aside>
  );
}
