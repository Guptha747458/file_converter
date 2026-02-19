import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import ConvertPage from './pages/ConvertPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

const PAGES = {
  dashboard: <Dashboard />,
  convert: <ConvertPage />,
  history: <HistoryPage />,
  settings: <SettingsPage />,
};

export default function App() {
  const [activeNav, setActiveNav] = useState('dashboard');

  return (
    <div className="app-layout">
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />
      <div className="app-layout__main">
        <Topbar activeNav={activeNav} />
        <div className="app-layout__page" key={activeNav}>
          {PAGES[activeNav] ?? <Dashboard />}
        </div>
      </div>
    </div>
  );
}
