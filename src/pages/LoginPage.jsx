import React, { useState } from 'react';
import { Form, Input, Button, Typography, App } from 'antd';
import { UserOutlined, LockOutlined, ArrowRightOutlined, MedicineBoxOutlined, HeartOutlined, PlusCircleOutlined, DashboardOutlined } from '@ant-design/icons';
import axios from 'axios';
import API_BASE from '../config';
import logoRslh from '../assets/images/Logo-rslh.png';

const { Text } = Typography;

const LoginPage = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const resp = await axios.post(`${API_BASE}/app-login`, values);
      if (resp.data.success) {
        message.success('Selamat datang, ' + resp.data.data.nama);
        onLoginSuccess(resp.data.data);
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Login gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-white selection:bg-indigo-100 selection:text-indigo-900">

      {/* ── LEFT PANEL ── */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 sm:p-12 overflow-hidden bg-indigo-950 min-h-[40vh] lg:min-h-screen">
        {/* Animated Background Layers */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 animate-gradient-shift bg-[length:300%_300%]"></div>

        {/* Animated Blobs */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] bg-indigo-400/20 blur-[100px] rounded-full animate-blob"></div>
        <div className="absolute bottom-[-60px] right-[-60px] w-[200px] h-[200px] sm:w-[350px] sm:h-[350px] bg-cyan-400/15 blur-[80px] rounded-full animate-blob animation-delay-2000"></div>

        {/* Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(rgba(165,180,252,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(165,180,252,0.4)_1px,transparent_1px)] bg-[size:48px_48px]"></div>

        {/* Twinkling Stars */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full opacity-0 animate-twinkle"
              style={{
                width: `${Math.random() * 2 + 0.5}px`,
                height: `${Math.random() * 2 + 0.5}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${2 + Math.random() * 4}s`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        {/* Floating Icons & Illustration (Hospital Focused) */}
        <div className="relative z-10 w-full max-w-lg text-center animate-in fade-in zoom-in duration-1000 scale-90 sm:scale-100">
          <div className="absolute top-[-50px] left-[5%] hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white text-[9px] font-bold uppercase tracking-widest animate-float shadow-2xl">
            <MedicineBoxOutlined className="text-red-400" />
            <span>Rekam Medis Digital</span>
          </div>

          <div className="absolute bottom-[-30px] right-0 hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white text-[9px] font-bold uppercase tracking-widest animate-float-slow shadow-2xl">
            <HeartOutlined className="text-pink-400" />
            <span>Unit Hemodialisa</span>
          </div>

          <div className="absolute top-1/2 left-[-60px] hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-500/20 backdrop-blur-xl border border-white/10 rounded-2xl text-white text-[9px] font-bold uppercase tracking-widest animate-float shadow-lg">
            <PlusCircleOutlined className="text-white" />
            <span>Layanan Terintegrasi</span>
          </div>

          <div className="mb-10 relative flex justify-center">
            <div className="absolute inset-x-0 bottom-0 h-4 bg-black/20 blur-xl rounded-full scale-75"></div>
            <svg viewBox="0 0 340 280" className="w-[300px] sm:w-[400px] h-auto filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.4)] animate-float-slow">
              <rect x="54" y="44" width="232" height="205" rx="12" fill="#4f46e5" />
              <rect x="60" y="50" width="220" height="193" rx="10" fill="#eef2ff" />

              <rect x="60" y="50" width="103" height="193" rx="10" fill="white" />
              
              {/* Stethoscope Graphic inside Book (Moved after white page for visibility) */}
              <g transform="translate(82, 110) scale(0.6)" opacity="0.8">
                <path d="M10 20 C10 40, 50 40, 50 20 M30 35 L30 60" stroke="#6366f1" strokeWidth="6" fill="none" strokeLinecap="round" />
                <circle cx="30" cy="70" r="12" stroke="#6366f1" strokeWidth="4" fill="none" />
                <path d="M10 20 L5 10 M50 20 L55 10" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
              </g>
              <rect x="64" y="54" width="95" height="28" rx="6" fill="#ef4444" /> {/* Red Header for Medical */}
              <rect x="80" y="63" width="60" height="6" rx="3" fill="white" fillOpacity="0.8" />
              <rect x="177" y="50" width="103" height="193" rx="10" fill="#f8fafc" />
              <path d="M264 44 L276 44 L276 68 L270 62 L264 68 Z" fill="#ef4444" />
            </svg>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 bg-white rounded-2xl p-2.5 shadow-2xl transform rotate-3 flex items-center justify-center">
                <img src={logoRslh} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="text-left">
                <h2 className="text-white text-2xl sm:text-3xl font-black tracking-tight leading-none m-0">Electronic Medical Record </h2>
                <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">RSUD dr. Loekmono Hadi</p>
              </div>
            </div>
            <p className="text-indigo-200/60 text-[12px] leading-relaxed max-w-xs mx-auto font-medium hidden sm:block">
              Sistem Informasi Terpadu Pelayanan Pasien, <br />
              Monitoring Medik, dan Administrasi Digital Rumah Sakit.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-[440px] flex flex-col items-center justify-center p-8 sm:p-12 relative bg-white min-h-[60vh] lg:min-h-screen">
        <div className="absolute top-0 left-0 w-[4px] h-full bg-gradient-to-b from-red-500 via-indigo-600 to-blue-500 hidden lg:block"></div>

        <div className="w-full max-w-[320px] animate-in fade-in slide-in-from-right-12 duration-1000">
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <img src={logoRslh} alt="Logo" className="h-14 w-auto" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight m-0 flex items-center gap-3">
              <DashboardOutlined className="text-indigo-600" /> Akses Sistem
            </h1>
            <p className="text-slate-400 text-[10px] mt-2 font-black uppercase tracking-[0.2em] ml-1">Integrated Digital Hospital</p>
            <div className="w-10 h-1.5 bg-gradient-to-r from-red-500 to-indigo-500 rounded-full mt-6 mx-auto lg:mx-0"></div>
          </div>

          <Form
            name="auth"
            layout="vertical"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
            className="space-y-5"
          >
            <Form.Item
              label={<span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">ID Pengguna</span>}
              name="username"
              rules={[{ required: true, message: 'Harap isi username!' }]}
              className="!mb-3"
            >
              <Input
                prefix={<UserOutlined className="text-slate-300 mr-2" />}
                className="!bg-slate-50 !border-slate-200 !hover:border-indigo-400 !focus:border-indigo-500 !rounded-xl h-12 text-sm font-medium transition-all"
                placeholder="Username"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Kunci Akses</span>}
              name="password"
              rules={[{ required: true, message: 'Harap isi password!' }]}
              className="!mb-8"
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-300 mr-2" />}
                className="!bg-slate-50 !border-slate-200 !hover:border-indigo-400 !focus:border-indigo-500 !rounded-xl h-12 text-sm font-medium transition-all"
                placeholder="Password"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="h-14 bg-indigo-600 hover:bg-indigo-700 !rounded-2xl border-none shadow-[0_15px_30px_rgba(79,70,229,0.2)] flex items-center justify-center gap-4 group transform transition-all active:scale-95"
            >
              <span className="font-black text-xs uppercase tracking-[0.25em]">Masuk Sistem</span>
              <ArrowRightOutlined className="group-hover:translate-x-1.5 transition-transform text-base" />
            </Button>
          </Form>

          <div className="mt-14 text-center border-t border-slate-100 pt-8 opacity-60">
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black leading-loose">
              RSUD dr. Loekmono Hadi Kudus <br />
              <span className="text-slate-300 font-bold tracking-normal text-[8px] uppercase">Smart ERM Hospital &copy; 2026</span>
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes blob { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, -30px) scale(1.15); } }
        @keyframes twinkle { 0%, 100% { opacity: 0; transform: scale(0.6); } 50% { opacity: 0.8; transform: scale(1.3); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .animate-gradient-shift { animation: gradientShift 15s ease infinite; }
        .animate-blob { animation: blob 15s ease-in-out infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float 8s ease-in-out infinite; }
        .animate-twinkle { animation: twinkle linear infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .ant-form-item-label > label { height: auto !important; }
        .ant-input-affix-wrapper:hover, .ant-input-affix-wrapper-focused { border-color: #6366f1 !important; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.05) !important; }
      ` }} />

    </div>
  );
};

export default LoginPage;
