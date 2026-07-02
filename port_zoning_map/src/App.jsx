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
        return <div dangerouslySetInnerHTML={{ __html: operationsHtml.replace('hidden', '') }} style={{ width: '100%', height: '100%', overflow: 'auto' }} />;
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
        {currentTab === 'digitizer' ? (
          <FreePortDigitizer user={user} />
        ) : (
          renderOldView()
        )}
      </main>
    </div>
  );
}

export default App;
