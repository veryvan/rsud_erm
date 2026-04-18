import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import DashboardHD from './pages/DashboardHD';
import LoginPage from './pages/LoginPage';
import UserManagement from './pages/UserManagement';
import { ConfigProvider, App as AntdApp } from 'antd';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const idleTimeout = 30 * 60 * 1000; // 30 Minutes

  useEffect(() => {
    const savedUser = localStorage.getItem('app_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;

    let timer;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        handleLogout();
        window.location.reload(); // Force refresh to clear states
      }, idleTimeout);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('app_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('app_user');
  };

  if (loading) return null;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6d28d9',
          borderRadius: 12,
          fontFamily: 'Inter, system-ui, sans-serif',
        },
      }}
    >
      <AntdApp>
        <Router>
          {!user ? (
            <Routes>
              <Route path="*" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
            </Routes>
          ) : (
            <MainLayout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<DashboardHD user={user} />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          )}
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
