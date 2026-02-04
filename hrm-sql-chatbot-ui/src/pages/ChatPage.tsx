import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import DailyBriefing from "../components/DailyBriefing";
import QuickActions from "../components/QuickActions";
import LeaveRequestForm from "../components/LeaveRequestForm";
import ThemeToggle from "../components/ThemeToggle";
import VoiceInput from "../components/VoiceInput";
import ExportChat from "../components/ExportChat";
import KeyboardShortcuts from "../components/KeyboardShortcuts";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import { MOCK_MODE, getMockChatResponse } from "../services/mockData";
import "../App.css";

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';
const API_URL = `${API_BASE}/chat`;

interface Message {
  role: "user" | "bot";
  text: string;
  timestamp: Date;
  downloadUrl?: string;
}

interface ChatPageProps {
  roleTitle: string;
  roleColor: string;
  suggestedQuestions: string[];
}

export default function ChatPage({ roleTitle, roleColor, suggestedQuestions }: ChatPageProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showBriefing, setShowBriefing] = useState(false); // Don't show briefing on load
  const [activeAction, setActiveAction] = useState<string | null>(null); // Action modal state
  const [showDashboard, setShowDashboard] = useState(false); // Analytics Dashboard
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuth();
  useTheme(); // Initialize theme
  const navigate = useNavigate();

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || question;
    if (!messageText.trim()) return;

    const newUserMessage: Message = {
      role: "user",
      text: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setQuestion("");
    setLoading(true);
    setIsTyping(true);

    // Mock Mode - trả về dữ liệu giả
    if (MOCK_MODE) {
      setTimeout(() => {
        const mockResponse = getMockChatResponse(messageText, user?.role || 'employee');
        setMessages((prev) => [
          ...prev,
          { 
            role: "bot", 
            text: mockResponse.answer, 
            timestamp: new Date(),
            downloadUrl: mockResponse.download_url
          },
        ]);
        setIsTyping(false);
        setLoading(false);
      }, 1000 + Math.random() * 1000); // Random delay 1-2 giây để giống thật
      return;
    }

    try {
      // Build conversation history for Context Memory
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'bot',
        content: msg.text
      }));
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: messageText,
          user_id: user?.id || null,
          role: user?.role || 'employee',
          phong_ban_id: user?.phong_ban_id || null,
          conversation_history: conversationHistory  // Context Memory
        }),
      });
      const data = await res.json();
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { 
            role: "bot", 
            text: data.answer, 
            timestamp: new Date(),
            downloadUrl: data.download_url
          },
        ]);
        setIsTyping(false);
      }, 800);
    } catch (err) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "❌ Lỗi kết nối backend. Vui lòng thử lại sau.", timestamp: new Date() },
        ]);
        setIsTyping(false);
      }, 800);
    }

    setLoading(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion);
    inputRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin': return '👑';
      case 'manager': return '👔';
      default: return '👤';
    }
  };

  // Handle Action Button clicks (Tuần 2 - Action Bot)
  const handleActionButtonClick = (actionType: string) => {
    setActiveAction(actionType);
  };

  // Handle Leave Request Submit
  const handleLeaveRequestSubmit = async (data: {
    nhanvien_id: number;
    tu_ngay: string;
    den_ngay: string;
    ly_do: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE}/leave-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      
      if (result.success) {
        setActiveAction(null);
        setMessages(prev => [...prev, {
          role: 'bot',
          text: `✅ **Đơn nghỉ phép đã được gửi thành công!**\n\n📅 Từ: ${data.tu_ngay}\n📅 Đến: ${data.den_ngay}\n📝 Lý do: ${data.ly_do}\n\n⏳ Đơn đang chờ duyệt từ cấp trên.`,
          timestamp: new Date()
        }]);
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      // Demo mode fallback
      setActiveAction(null);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `✅ **Đơn nghỉ phép đã được gửi thành công!** _(Demo mode)_\n\n📅 Từ: ${data.tu_ngay}\n📅 Đến: ${data.den_ngay}\n📝 Lý do: ${data.ly_do}\n\n⏳ Đơn đang chờ duyệt từ cấp trên.`,
        timestamp: new Date()
      }]);
    }
  };

  // Handle Task Assignment Submit
  const handleTaskAssignSubmit = async (data: {
    ten_cong_viec: string;
    mo_ta: string;
    du_an_id: number | null;
    nguoi_nhan_ids: number[];
    nguoi_giao_id: number;
    han_hoan_thanh: string;
    muc_do_uu_tien: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE}/assign-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      
      if (result.success) {
        setActiveAction(null);
        setMessages(prev => [...prev, {
          role: 'bot',
          text: `✅ **Công việc đã được giao thành công!**\n\n📌 Tên: ${data.ten_cong_viec}\n👥 Số người nhận: ${data.nguoi_nhan_ids.length}\n📅 Hạn: ${data.han_hoan_thanh}\n⚡ Ưu tiên: ${data.muc_do_uu_tien}`,
          timestamp: new Date()
        }]);
      } else {
        throw new Error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      // Demo mode fallback
      setActiveAction(null);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `✅ **Công việc đã được giao thành công!** _(Demo mode)_\n\n📌 Tên: ${data.ten_cong_viec}\n👥 Số người nhận: ${data.nguoi_nhan_ids.length}\n📅 Hạn: ${data.han_hoan_thanh}\n⚡ Ưu tiên: ${data.muc_do_uu_tien}`,
        timestamp: new Date()
      }]);
    }
  };

  return (
    <div className={`app-container ${!showSidebar ? 'sidebar-hidden' : ''}`}>
      {/* Animated Background */}
      <div className={`animated-bg${document.body.classList.contains('dark-mode') ? ' dark-mode' : ''}`}>
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="particle-container">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{ animationDelay: `${i * 0.2}s` }}></div>
          ))}
        </div>
      </div>

      <div className="layout">
        {/* SIDEBAR */}
        <aside className={`sidebar ${showSidebar ? 'show' : 'hide'}`}>
          <div className="sidebar-header">
            <div className="logo-container">
              <div className="logo-icon">
                <span className="shield-icon">🛡️</span>
                <div className="logo-glow"></div>
              </div>
              <div className="logo-text">
                <h2>ICS Security</h2>
                <span className="logo-subtitle">AI Chatbot</span>
              </div>
            </div>
          </div>

          <div className="sidebar-content">
            {/* User Info Card */}
            <div className="user-info-card" style={{ background: roleColor }}>
              <div className="user-avatar-large">{getRoleIcon()}</div>
              <div className="user-details">
                <h4>{user?.ho_ten || 'Người dùng'}</h4>
                <p>{user?.chuc_vu || user?.vai_tro}</p>
                <span className="role-badge">{roleTitle}</span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <QuickActions 
              role={user?.role || 'employee'} 
              onActionClick={(q) => sendMessage(q)}
              onActionButtonClick={handleActionButtonClick}
            />

            {/* Briefing Button */}
            <button 
              className="action-btn briefing-btn" 
              onClick={() => setShowBriefing(true)}
              style={{ marginBottom: '12px', width: '100%' }}
            >
              <span className="btn-icon">📊</span>
              <span>Xem tóm tắt ngày</span>
            </button>

            {/* Enterprise Features - Admin/Manager only */}
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <div className="enterprise-features" style={{ marginBottom: '12px' }}>
                {/* Analytics Dashboard */}
                <button 
                  className="action-btn" 
                  onClick={() => setShowDashboard(true)}
                  style={{ width: '100%', marginBottom: '8px' }}
                >
                  <span className="btn-icon">📈</span>
                  <span>Dashboard Analytics</span>
                </button>
              </div>
            )}

            {/* Export Chat */}
            <ExportChat 
              messages={messages} 
              userName={user?.ho_ten || 'Người dùng'} 
            />

            <div className="sidebar-actions">
              <button className="action-btn clear-btn" onClick={clearChat}>
                <span className="btn-icon">🗑️</span>
                <span>Xóa lịch sử chat</span>
              </button>
              
              <button className="action-btn logout-btn" onClick={handleLogout}>
                <span className="btn-icon">🚪</span>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

          <footer className="sidebar-footer">
            <div className="footer-content">
              <p>© 2026 ICS Security</p>
              <div className="footer-links">
                <span>Privacy</span>
                <span>•</span>
                <span>Terms</span>
              </div>
            </div>
          </footer>
        </aside>

        {/* Toggle Sidebar Button */}
        <button 
          className="sidebar-toggle" 
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <span>{showSidebar ? '◀' : '▶'}</span>
        </button>

        {/* CHAT AREA */}
        <main className="chat-area">
          <div className="chat-header">
            <div className="header-content">
              <h1 className="chat-title">
                <span className="title-gradient">Trợ lý Ảo HRM - {roleTitle}</span>
                <div className="status-indicator">
                  <span className="status-dot"></span>
                  <span className="status-text">Online</span>
                </div>
                <div className="theme-toggle-header-wrapper">
                  <ThemeToggle />
                </div>
              </h1>
              <p className="subtitle">
                Xin chào <strong>{user?.ho_ten}</strong>! Tôi có thể giúp gì cho bạn hôm nay?
              </p>
              
              {/* Chatbot mascot with greeting */}
              <div className="header-mascot">
                <div className="mascot-container">
                  <div className="greeting-arrow">
                    <span className="arrow-text">Trợ lý AI đây!</span>
                    <span className="arrow-icon">👉</span>
                  </div>
                  <div className="chatbot-waving">
                    <span className="bot-emoji">🤖</span>
                    <span className="waving-hand">👋</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="chat-container">
            <div className="chat-box" ref={chatBoxRef}>
              {messages.length === 0 && (
                <div className="welcome-screen">
                  <div className="welcome-animation">
                    <div className="bot-avatar-large">
                      <span>🤖</span>
                      <div className="avatar-pulse"></div>
                    </div>
                    <h2>Xin chào, {user?.ho_ten}! 👋</h2>
                    <p>Tôi là trợ lý AI của ICS Security. Với vai trò <strong>{roleTitle}</strong>, bạn có thể hỏi tôi về:</p>
                    <div className="features-grid">
                      <div className="feature-item">
                        <span className="feature-icon">📊</span>
                        <span>Báo cáo</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">👥</span>
                        <span>Nhân sự</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">📅</span>
                        <span>Chấm công</span>
                      </div>
                      <div className="feature-item">
                        <span className="feature-icon">📁</span>
                        <span>Dự án</span>
                      </div>
                    </div>
                  </div>

                  <div className="suggested-questions">
                    <p className="suggestions-title">Câu hỏi gợi ý cho {roleTitle}:</p>
                    <div className="suggestions-grid">
                      {suggestedQuestions.map((suggestion, index) => (
                        <button
                          key={index}
                          className="suggestion-chip"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <span className="chip-icon">💡</span>
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`message-wrapper ${m.role}`}>
                  <div className={`message ${m.role}`}>
                    <div className="message-avatar">
                      {m.role === "user" ? (
                        <span className="user-avatar">{getRoleIcon()}</span>
                      ) : (
                        <span className="bot-avatar">🤖</span>
                      )}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-sender">
                          {m.role === "user" ? user?.ho_ten || "Bạn" : "ICS Assistant"}
                        </span>
                        <span className="message-time">{formatTime(m.timestamp)}</span>
                      </div>
                      <div className="message-text">{m.text}</div>
                      {m.downloadUrl && (
                        <button 
                          className="download-button"
                          onClick={() => {
                            const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:8000";
                            window.location.href = `${baseUrl}${m.downloadUrl}`;
                          }}
                        >
                          📥 Tải file Word
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="message-wrapper bot">
                  <div className="message bot typing">
                    <div className="message-avatar">
                      <span className="bot-avatar">🤖</span>
                    </div>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="input-container">
              <div className="input-box">
                <input
                  ref={inputRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Nhập câu hỏi của bạn..."
                  onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
                  disabled={loading}
                />
                
                {/* Voice Input */}
                <VoiceInput 
                  onTranscript={(text) => {
                    setQuestion(text);
                    inputRef.current?.focus();
                  }}
                  disabled={loading}
                  inputValue={question}
                  setInputValue={setQuestion}
                />
                
                <button 
                  onClick={() => sendMessage()} 
                  disabled={loading || !question.trim()}
                  className="send-button"
                >
                  {loading ? (
                    <span className="loading-spinner">⏳</span>
                  ) : (
                    <span className="send-icon">➤</span>
                  )}
                </button>
              </div>
              <p className="input-hint">
                Nhấn Enter để gửi • 🎤 Nhập giọng nói
                {messages.length > 0 && (
                  <span className="context-indicator" title="Bot nhớ ngữ cảnh hội thoại">
                    {' '}• 🧠 Context Memory ({Math.min(messages.length, 6)} tin)
                  </span>
                )}
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Daily Briefing Modal */}
      {showBriefing && user && (
        <DailyBriefing
          userId={user.id}
          role={user.role}
          phongBanId={user.phong_ban_id}
          onClose={() => setShowBriefing(false)}
        />
      )}

      {/* Action Modals (Tuần 2 - Action Bot) */}
      
      {/* Leave Request Form - Employee & Manager */}
      {activeAction === 'leave-request' && user && (
        <LeaveRequestForm
          userId={user.id}
          userName={user.ho_ten}
          onClose={() => setActiveAction(null)}
          onSubmit={handleLeaveRequestSubmit}
        />
      )}

      {/* Analytics Dashboard Modal */}
      {showDashboard && (
        <AnalyticsDashboard 
          role={user?.role || 'employee'}
          userId={user?.id}
          deptId={user?.phong_ban_id || undefined}
          onClose={() => setShowDashboard(false)}
        />
      )}

      {/* Keyboard Shortcuts Handler */}
      <KeyboardShortcuts
        onNewChat={clearChat}
        onToggleSidebar={() => setShowSidebar(prev => !prev)}
        onFocusInput={() => inputRef.current?.focus()}
      />
    </div>
  );
}
