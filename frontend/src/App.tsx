import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import MainLayout from './components/layout/MainLayout';
import DriverLayout from './components/layout/DriverLayout';
import GuardLayout from './components/layout/GuardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Tracking from './pages/Tracking';
import Cargo from './pages/Cargo';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import ApisSettings from './pages/ApisSettings';
import WhatsAppInstances from './pages/control/WhatsAppInstances';
import Drivers from './pages/Drivers';
import Rounds from './pages/Rounds';
import Guards from './pages/Guards';
import ThirdPartyControl from './pages/control/ThirdPartyControl';
import VisitsControl from './pages/control/VisitsControl';
import CompaniesControl from './pages/control/CompaniesControl';
import KeysControl from './pages/control/KeysControl';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverRoutes from './pages/driver/DriverRoutes';
import GuardDashboard from './pages/guard/GuardDashboard';
import GuardHistory from './pages/guard/GuardHistory';
import { DevInfoPanel } from './components/DevInfoPanel';
import OfflineBanner from './components/layout/OfflineBanner';
import { useInstallStore } from './store/useInstallStore';
import { useEffect } from 'react';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // If no specific roles required, or user has the required role
  if (!allowedRoles || (user && allowedRoles.includes(user.role))) {
    return <>{children}</>;
  }

  // If user is Motorista but trying to access admin pages, redirect to driver dashboard
  if (user?.role === 'Motorista') {
    return <Navigate to="/driver/dashboard" replace />;
  }

  // If user is Vigia but trying to access admin pages, redirect to guard dashboard
  if (user?.role === 'Vigia') {
    return <Navigate to="/guard/dashboard" replace />;
  }

  // If user is Admin but trying to access driver/guard pages, redirect to admin dashboard
  return <Navigate to="/dashboard" replace />;
};

function App() {
  const setDeferredPrompt = useInstallStore(state => state.setDeferredPrompt);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Também limpar quando instalado
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [setDeferredPrompt]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['Administrador', 'Operador']}>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="tracking" element={<Tracking />} />
          <Route path="cargo" element={<Cargo />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/apis" element={<ApisSettings />} />
          <Route path="settings/whatsapp" element={<WhatsAppInstances />} />
          <Route path="rounds" element={<Rounds />} />
          <Route path="guards" element={<Guards />} />
          <Route path="control/third-party" element={<ThirdPartyControl />} />
          <Route path="control/visits" element={<VisitsControl />} />
          <Route path="control/companies" element={<CompaniesControl />} />
          <Route path="control/keys" element={<KeysControl />} />
        </Route>

        {/* Driver Routes */}
        <Route path="/driver" element={
          <ProtectedRoute allowedRoles={['Motorista']}>
            <DriverLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/driver/dashboard" replace />} />
          <Route path="dashboard" element={<DriverDashboard />} />
          <Route path="routes" element={<DriverRoutes />} />
        </Route>

        {/* Guard Routes */}
        <Route path="/guard" element={
          <ProtectedRoute allowedRoles={['Vigia']}>
            <GuardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/guard/dashboard" replace />} />
          <Route path="dashboard" element={<GuardDashboard />} />
          <Route path="history" element={<GuardHistory />} />
        </Route>
      </Routes>
      <DevInfoPanel />
      <OfflineBanner />
    </BrowserRouter>
  );
}

export default App;
