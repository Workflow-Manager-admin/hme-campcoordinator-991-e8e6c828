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
import EventCalendar from './pages/EventCalendar';
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
            {/* Meals Planning is always visible and prominently styled */}
            <Link
              className={"nav-meals-link" + (isActive("/meals") ? " active prominent" : "")}
              to="/meals"
              aria-current={isActive("/meals") ? "page" : undefined}
              data-testid="nav-meals"
              style={{
                fontWeight: 'bold',
                color: isActive("/meals") ? "var(--text-secondary)" : "var(--text-primary)",
                background: isActive("/meals") ? "var(--button-bg)" : "transparent",
                borderRadius: isActive("/meals") ? "7px" : "0",
                padding: "8px 18px",
                boxShadow: isActive("/meals") ? "0 2px 10px #beaeef30" : "none",
                transition: "background 0.2s, color 0.2s"
              }}
            >
              🍽️ Meals
            </Link>
          </li>
          <li>
            <Link className={isActive("/calendar") ? "active" : ""} to="/calendar">
              Calendar
            </Link>
          </li>
          <li>
            <Link className={isActive("/events") ? "active" : ""} to="/events">
              Events
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
          <header className="App-header">
            <button 
              className="theme-toggle" 
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
            
            <div className="header-content">
              <div className="hero-section">
                <div className="hero-image-placeholder">
                  🏕️ Hero Image: Burning Man Camp Scene
                </div>
                <h1 className="hero-title">HME Camp Coordinator</h1>
                <p className="hero-subtitle">High Maintenance Entertainment • Black Rock City 2024</p>
              </div>
              
              <Navbar />
            </div>
          </header>
          
          <main>
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
              <Route path="/events" element={<EventCalendar />} />
              <Route path="/account" element={<Account />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
