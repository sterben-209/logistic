import React, { useState, useEffect } from 'react';
import FreePortDigitizer from './components/FreePortDigitizer';
import { supabase, loginWithEmail, signUpWithEmail } from './services/supabaseService';
import { operationsHtml, inventoryHtml, analyticsHtml, logisticsHtml } from './oldViews';
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isLoginMode) {
        await loginWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
        alert('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
        setIsLoginMode(true);
      }
    } catch (err) {
      setAuthError(err.message || 'Có lỗi xảy ra!');
    } finally {
      setAuthLoading(false);
    }
  };

  const user = session?.user;

  const [currentTab, setCurrentTab] = useState('digitizer');

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'SYNC_FLEET_DATA') {
        const fleet = event.data.payload.fleet;
        const tbody = document.getElementById('operations-fleet-tbody');
        if (tbody) {
           tbody.innerHTML = fleet.map(v => `
              <tr class="border-b border-outline-variant/10 text-sm">
                 <td class="py-2 text-primary font-bold">${v.id}</td>
                 <td class="py-2 text-secondary">${v.type === 'truck' ? 'Tractor' : 'AGV'}</td>
                 <td class="py-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${v.status === 'moving' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}">${v.status.toUpperCase()}</span>
                 </td>
                 <td class="py-2">
                    <div class="w-full bg-surface-container-highest h-2 rounded overflow-hidden">
                       <div class="bg-primary h-full" style="width: ${Math.round(v.progress)}%"></div>
                    </div>
                 </td>
              </tr>
           `).join('');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (loading) {
    return (
      <div className="login-container">
         <div className="loading-spinner"></div>
         <p style={{ marginTop: '20px', color: '#cbd5e1', fontWeight: 500, letterSpacing: '1px' }}>ĐANG KẾT NỐI HỆ THỐNG...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-container">
        <div className="glass-card">
          <div className="logo-wrapper">
            <span className="material-symbols-outlined logo-icon">directions_boat</span>
          </div>
          <h1 className="brand-title">Free Port Digitizer</h1>
          <p className="brand-subtitle">Hệ thống Số hóa Bãi cảng Thông minh</p>
          
          <form onSubmit={handleAuth} className="auth-form">
            <div className="input-group">
              <span className="material-symbols-outlined input-icon">mail</span>
              <input 
                type="email" 
                placeholder="Email của bạn" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="glass-input"
              />
            </div>
            <div className="input-group">
              <span className="material-symbols-outlined input-icon">lock</span>
              <input 
                type="password" 
                placeholder="Mật khẩu" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="glass-input"
              />
            </div>
            
            {authError && <div className="auth-error">{authError}</div>}
            
            <button type="submit" disabled={authLoading} className="btn-supabase-login">
              <span className="material-symbols-outlined text-[20px]">
                {isLoginMode ? 'login' : 'person_add'}
              </span>
              <span>{authLoading ? 'Đang xử lý...' : (isLoginMode ? 'Đăng nhập' : 'Đăng ký tài khoản')}</span>
            </button>
            
            <div className="auth-switch">
              <span onClick={() => {setIsLoginMode(!isLoginMode); setAuthError('');}}>
                {isLoginMode ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
              </span>
            </div>
          </form>
        </div>
        
        <div className="ocean-bg">
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
        </div>
      </div>
    );
  }



  const renderOldView = () => {
    switch (currentTab) {
      case 'operations':
        return (
          <div style={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div dangerouslySetInnerHTML={{ __html: operationsHtml.replace('hidden', '') }} style={{ flex: 1 }} />
            <div className="bg-surface-container m-4 p-4 rounded-xl border border-outline-variant/30 text-white shadow-lg">
               <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined">local_shipping</span> Active Fleet Monitor
               </h2>
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-outline-variant/30 text-xs text-outline-variant uppercase tracking-wider">
                        <th className="py-2">Vehicle ID</th>
                        <th className="py-2">Type</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 w-1/3">Progress</th>
                     </tr>
                  </thead>
                  <tbody id="operations-fleet-tbody">
                     <tr><td colSpan="4" className="text-center py-4 text-outline-variant">Waiting for fleet data...</td></tr>
                  </tbody>
               </table>
            </div>
          </div>
        );
      case 'inventory':
        return <div dangerouslySetInnerHTML={{ __html: inventoryHtml.replace('hidden', '') }} style={{ width: '100%', height: '100%', overflow: 'auto' }} />;
      case 'analytics':
        return <div dangerouslySetInnerHTML={{ __html: analyticsHtml.replace('hidden', '') }} style={{ width: '100%', height: '100%', overflow: 'auto' }} />;
      case 'logistics':
        return <div dangerouslySetInnerHTML={{ __html: logisticsHtml.replace('hidden', '') }} style={{ width: '100%', height: '100%', overflow: 'auto' }} />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-layout" style={{ display: 'block' }}>
      <main className="main-content" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
        <div style={{ display: currentTab === 'digitizer' ? 'block' : 'none', width: '100%', height: '100%' }}>
          <FreePortDigitizer user={user} isActive={currentTab === 'digitizer'} />
        </div>
        <div style={{ display: currentTab !== 'digitizer' ? 'block' : 'none', width: '100%', height: '100%', overflow: 'hidden' }}>
          {renderOldView()}
        </div>
      </main>
    </div>
  );
}

export default App;
