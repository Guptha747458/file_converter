import { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import ConvertPage from './pages/ConvertPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import FormatsPage from './pages/FormatsPage';
import AuthPage from './pages/AuthPage';
import './App.css';

function AppShell() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  if (!user) return <AuthPage />;

  const PAGES = {
    dashboard: <Dashboard />,
    convert:   <ConvertPage />,
    history:   <HistoryPage />,
    formats:   <FormatsPage />,
    settings:  <SettingsPage />,
  };

  const handleNavSelect = (id) => {
    setActiveNav(id);
    setMobileOpen(false); // close sidebar on nav pick (mobile)
  };

  return (
    <div
      className={`app-layout${sidebarCollapsed ? ' app-layout--collapsed' : ''}`}
      data-theme={theme}
    >
      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          className="app-layout__overlay app-layout__overlay--visible"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        activeNav={activeNav}
        setActiveNav={handleNavSelect}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="app-layout__main">
        <Topbar
          activeNav={activeNav}
          toggleTheme={toggleTheme}
          theme={theme}
          onMenuClick={() => setMobileOpen(o => !o)}
        />
        <div className="app-layout__page" key={activeNav}>
          {activeNav === 'dashboard'
            ? <Dashboard onNavigate={handleNavSelect} />
            : (PAGES[activeNav] ?? <Dashboard onNavigate={handleNavSelect} />)}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
