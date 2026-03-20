import { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import ConvertPage from './pages/ConvertPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import FormatsPage from './pages/FormatsPage';
import './App.css';

function AppShell() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const { theme, toggleTheme } = useTheme();

  const PAGES = {
    dashboard: <Dashboard />,
    convert: <ConvertPage />,
    history: <HistoryPage />,
    formats: <FormatsPage />,
    settings: <SettingsPage />,
  };

  return (
    <div className="app-layout" data-theme={theme}>
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />
      <div className="app-layout__main">
        <Topbar activeNav={activeNav} toggleTheme={toggleTheme} theme={theme} />
        <div className="app-layout__page" key={activeNav}>
          {activeNav === 'dashboard' ? <Dashboard onNavigate={setActiveNav} /> : (PAGES[activeNav] ?? <Dashboard onNavigate={setActiveNav} />)}
        </div>
      </div>
    </div>
  );

}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
