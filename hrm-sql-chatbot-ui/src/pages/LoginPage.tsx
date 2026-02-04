import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MOCK_MODE, mockLogin } from '../services/mockData';
import './LoginPage.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (MOCK_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500));
        data = mockLogin(username, password);
      } else {
        const res = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        data = await res.json();
      }
      const user = data.user || (data.data && data.data[0]);
      if (data.success && user) {
        login(user);
        switch (user.role || user.vai_tro) {
          case 'admin':
          case 'Admin':
            navigate('/admin');
            break;
          case 'manager':
          case 'Manager':
            navigate('/manager');
            break;
          default:
            navigate('/employee');
        }
      } else {
        setError(data.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      if (MOCK_MODE) {
        const demoUser = mockLogin(username, password);
        // Ép kiểu role về đúng union type
        const user = { ...demoUser.user, role: demoUser.user.role as 'admin' | 'manager' | 'employee' };
        login(user);
          
      } else {
        setError('Lỗi kết nối. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
        <div className="login-intro-on-bg">
          <div className="login-welcome">
            <div className="welcome-img">
              <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=200&q=80" alt="ICS Welcome" />
            </div>
            <h2 className="welcome-title">ICS HRM - Quản Lý Nhân Sự Thông Minh</h2>
            <p className="welcome-desc">Đơn giản hóa quy trình, kết nối đội ngũ, nâng tầm doanh nghiệp với giải pháp số toàn diện từ ICS.</p>
            <div className="welcome-features">
              <div className="feature-card blue">
                <span className="feature-icon">🤖</span>
                <div>
                  <div className="feature-title">Tự Động & Cá Nhân Hóa</div>
                  <div className="feature-desc">AI hỗ trợ tối ưu hóa công việc nhân sự.</div>
                </div>
              </div>
              <div className="feature-card purple">
                <span className="feature-icon">🌐</span>
                <div>
                  <div className="feature-title">Kết Nối Mọi Người</div>
                  <div className="feature-desc">Cộng đồng doanh nghiệp năng động, chia sẻ tri thức.</div>
                </div>
              </div>
              <div className="feature-card orange">
                <span className="feature-icon">🏅</span>
                <div>
                  <div className="feature-title">Chứng Nhận Uy Tín</div>
                  <div className="feature-desc">Được tin dùng bởi hàng trăm doanh nghiệp.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="login-form-float">
          <div className="login-combobox">
            <div className="login-card">
              <div className="login-header">
              <div style={{width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 18}}>
                <div className="logo-icon">
                  <span className="shield-icon">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <radialGradient id="shieldBg" cx="50%" cy="50%" r="60%" fx="50%" fy="50%">
                          <stop offset="0%" stopColor="#a18cd1" />
                          <stop offset="100%" stopColor="#6dd5ed" />
                        </radialGradient>
                      </defs>
                      <rect x="0" y="0" width="40" height="40" rx="12" fill="url(#shieldBg)" />
                      <path d="M20 10L28 14V20C28 26 20 30 20 30C20 30 12 26 12 20V14L20 10Z" fill="#3b82f6" stroke="#fff" strokeWidth="2"/>
                    </svg>
                  </span>
                </div>
              </div>
              <h1 style={{textAlign: 'center'}}>ICS HRM Chatbot</h1>
              <p style={{textAlign: 'center'}}>Đăng nhập để tiếp tục</p>
              </div>
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="username">Họ tên hoặc Email</label>
                  
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Nhập email..."
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Mật khẩu</label>
                  
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    required
                    disabled={loading}
                  />
                  
                </div>
                {error && (
                  <div className="error-message">
                    <span>⚠️</span> {error}
                  </div>
                )}
                <button type="submit" className="login-button" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="loading-spinner">⏳</span>
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      Đăng nhập <span style={{marginLeft: 8}}>→</span>
                    </>
                  )}
                </button>
              </form>
              <div className="login-footer">
                <p> </p>
                <p>© 2026 ICS Security</p>
                <p className="hint">💡 Mật khẩu mặc định là số điện thoại của bạn</p>
                {MOCK_MODE && (
                  <div className="demo-badge">
                    🎮 DEMO MODE - Nhập bất kỳ để đăng nhập
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      
    </div>
  );
}
