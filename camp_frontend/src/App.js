import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import './App.css';
// Import all page components at the very top
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Dues from './pages/Dues';
import Accommodations from './pages/Accommodations';
import Jobs from './pages/Jobs';
import Meals from './pages/Meals';
import Calendar from './pages/Calendar';
import Account from './pages/Account';
import ArrivalDeparture from './pages/ArrivalDeparture';
import { AuthProvider, useAuth } from './AuthContext';

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // PUBLIC_INTERFACE
  function Navbar() {
    // Render login/logout/account links based on auth state
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    // Helper for active nav detection
    const isActive = (path) =>
      location.pathname === path ||
      (path !== "/" && location.pathname.startsWith(path));

    return (
      <nav className="navbar">
        <ul>
          <li>
            <Link className={isActive("/dashboard") ? "active" : ""} to="/dashboard">
              Dashboard
            </Link>
          </li>
          <li>
            <Link className={isActive("/arrivals") ? "active" : ""} to="/arrivals">
              Arrivals/Departures
            </Link>
          </li>
          <li>
            <Link className={isActive("/members") ? "active" : ""} to="/members">
              Members
            </Link>
          </li>
          <li>
            <Link className={isActive("/dues") ? "active" : ""} to="/dues">
              Dues
            </Link>
          </li>
          <li>
            <Link className={isActive("/accommodations") ? "active" : ""} to="/accommodations">
              Accommodations
            </Link>
          </li>
          <li>
            <Link className={isActive("/jobs") ? "active" : ""} to="/jobs">
              Jobs
            </Link>
          </li>
          <li>
            <Link className={isActive("/meals") ? "active" : ""} to="/meals">
              Meals
            </Link>
          </li>
          <li>
            <Link className={isActive("/calendar") ? "active" : ""} to="/calendar">
              Calendar
            </Link>
          </li>
          <li>
            <Link className={location.pathname.startsWith('/account') ? "active" : ""} to="/account">
              {isAuthenticated ? "Account" : "Login"}
            </Link>
          </li>
        </ul>
      </nav>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <header className="App-header" style={{ alignItems: 'flex-start' }}>
            <button 
              className="theme-toggle" 
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
            <Navbar />
          </header>
          <main style={{ width: '100%', padding: '2rem 0' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/arrivals" element={<ArrivalDeparture />} />
              <Route path="/members" element={<Members />} />
              <Route path="/dues" element={<Dues />} />
              <Route path="/accommodations" element={<Accommodations />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/meals" element={<Meals />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/account" element={<Account />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
