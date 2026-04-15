import React, { useState } from 'react';
import { Layout, Menu, Button, theme, App } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  FileTextOutlined,
  LineChartOutlined,
  AlertOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activePPA, setActivePPA] = useState(null);
  const { message } = App.useApp();
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const handlePPAChanged = (e) => setActivePPA(e.detail);
    window.addEventListener('ppa-changed', handlePPAChanged);
    return () => window.removeEventListener('ppa-changed', handlePPAChanged);
  }, []);

  return (
    <Layout style={{ minHeight: '100vh', flexDirection: 'row' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        width={260}
        style={{
          borderRight: '1px solid #f0f0f0',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
        }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f5f5f5' }}>
           <div style={{ color: '#6d28d9', fontWeight: 'bold', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <div style={{ width: 32, height: 32, backgroundColor: '#6d28d9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px' }}>HD</div>
             {!collapsed && "ERM HD"}
           </div>
        </div>
        <Menu
          theme="light"
          mode="inline"
          defaultSelectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none', paddingTop: '16px' }}
          items={[
            {
              key: '/',
              icon: <DashboardOutlined />,
              label: 'Dashboard HD',
            },
            {
              key: '/pasien',
              icon: <UserOutlined />,
              label: 'Cari Pasien',
            },
          ]}
        />
      </Sider>
      <Layout style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Header
          style={{ 
            background: colorBgContainer, 
            padding: '0 24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            height: 64,
            lineHeight: '64px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ width: 64, height: 64 }}
            />
            <Button
               type="primary"
               icon={<SearchOutlined />}
               className="rounded-lg"
               onClick={() => {
                 if (!activePPA) {
                   message.warning('Silakan pilih PPA terlebih dahulu sebelum mencari pasien');
                   return;
                 }
                 window.dispatchEvent(new CustomEvent('open-patient-search'));
               }}
            >
               Cari Pasien
            </Button>
            <Button
               icon={<TeamOutlined />}
               className="rounded-lg"
               onClick={() => window.dispatchEvent(new CustomEvent('open-ppa-modal'))}
            >
               Ganti PPA
            </Button>
            {activePPA && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#eef2ff', borderRadius: '8px', border: '1px solid #c7d2fe' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6d28d9' }} />
                <div style={{ lineHeight: '1.2' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#4c1d95', whiteSpace: 'nowrap' }}>
                    {activePPA.nama}
                    {activePPA.ruang && (
                      <span style={{ fontWeight: '400', color: '#6d28d9', marginLeft: '6px' }}>
                        — {activePPA.ruang.klinik_name}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '10px', color: '#7c3aed', whiteSpace: 'nowrap' }}>{activePPA.nama_profesi}</div>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
             <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
               <div style={{ fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                 dr. John Doe, Sp.PD-KGH
               </div>
               <div style={{ fontSize: '12px', color: '#666' }}>Spesialis Penyakit Dalam</div>
             </div>
             <div style={{ 
               width: 40, 
               height: 40, 
               backgroundColor: '#eef2ff', 
               borderRadius: '50%', 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center', 
               color: '#6d28d9', 
               fontWeight: 'bold',
               flexShrink: 0
             }}>JD</div>
          </div>
        </Header>
        <Content style={{ margin: '24px', background: 'transparent', minHeight: 'calc(100vh - 112px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
