import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';

// Importing skeleton page components
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Dues from './pages/Dues';
import Accommodations from './pages/Accommodations';
import Jobs from './pages/Jobs';
import Meals from './pages/Meals';
import Calendar from './pages/Calendar';

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
    return (
      <nav className="navbar">
        <ul>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/members">Members</Link></li>
          <li><Link to="/dues">Dues</Link></li>
          <li><Link to="/accommodations">Accommodations</Link></li>
          <li><Link to="/jobs">Jobs</Link></li>
          <li><Link to="/meals">Meals</Link></li>
          <li><Link to="/calendar">Calendar</Link></li>
        </ul>
      </nav>
    );
  }

  return (
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
            <Route path="/members" element={<Members />} />
            <Route path="/dues" element={<Dues />} />
            <Route path="/accommodations" element={<Accommodations />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/meals" element={<Meals />} />
            <Route path="/calendar" element={<Calendar />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
