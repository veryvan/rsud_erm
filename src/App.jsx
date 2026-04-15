import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import DashboardHD from './pages/DashboardHD';
import { ConfigProvider, App as AntdApp } from 'antd';

function App() {
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
          <MainLayout>
            <Routes>
              <Route path="/" element={<DashboardHD />} />
            </Routes>
          </MainLayout>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
