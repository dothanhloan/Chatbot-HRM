import { useState } from 'react';
import './ExportChat.css';

interface Message {
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface ExportChatProps {
  messages: Message[];
  userName: string;
}

export default function ExportChat({ messages, userName }: ExportChatProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString('vi-VN');
  };

  const exportAsText = () => {
    if (messages.length === 0) return;

    let content = `═══════════════════════════════════════════\n`;
    content += `   LỊCH SỬ CHAT - HRM CHATBOT\n`;
    content += `   Người dùng: ${userName}\n`;
    content += `   Xuất lúc: ${formatTimestamp(new Date())}\n`;
    content += `═══════════════════════════════════════════\n\n`;

    messages.forEach((msg, index) => {
      const sender = msg.role === 'user' ? `👤 ${userName}` : '🤖 Bot';
      const time = formatTimestamp(msg.timestamp);
      content += `[${index + 1}] ${sender} - ${time}\n`;
      content += `${msg.text}\n`;
      content += `───────────────────────────────────────────\n\n`;
    });

    content += `\n═══════════════════════════════════════════\n`;
    content += `   Tổng số tin nhắn: ${messages.length}\n`;
    content += `   © 2026 ICS Security - HRM Chatbot\n`;
    content += `═══════════════════════════════════════════\n`;

    downloadFile(content, `chat-history-${Date.now()}.txt`, 'text/plain');
    setShowMenu(false);
  };

  const exportAsJSON = () => {
    if (messages.length === 0) return;

    const data = {
      exportedAt: new Date().toISOString(),
      userName: userName,
      totalMessages: messages.length,
      messages: messages.map((msg, index) => ({
        id: index + 1,
        role: msg.role,
        text: msg.text,
        timestamp: msg.timestamp
      }))
    };

    const content = JSON.stringify(data, null, 2);
    downloadFile(content, `chat-history-${Date.now()}.json`, 'application/json');
    setShowMenu(false);
  };

  const exportAsHTML = () => {
    if (messages.length === 0) return;

    let content = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Lịch sử Chat - HRM Chatbot</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #eee; }
    h1 { text-align: center; color: #8b5cf6; }
    .meta { text-align: center; color: #888; margin-bottom: 30px; }
    .message { margin: 16px 0; padding: 16px; border-radius: 12px; }
    .user { background: linear-gradient(135deg, #6366f1, #8b5cf6); margin-left: 20%; }
    .bot { background: #2d2d44; margin-right: 20%; }
    .sender { font-weight: bold; margin-bottom: 8px; }
    .time { font-size: 12px; color: #aaa; }
    .text { white-space: pre-wrap; line-height: 1.6; }
    .footer { text-align: center; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; }
  </style>
</head>
<body>
  <h1>🤖 Lịch sử Chat - HRM Chatbot</h1>
  <div class="meta">
    <p>Người dùng: <strong>${userName}</strong></p>
    <p>Xuất lúc: ${formatTimestamp(new Date())}</p>
    <p>Tổng: ${messages.length} tin nhắn</p>
  </div>
`;

    messages.forEach(msg => {
      const roleClass = msg.role === 'user' ? 'user' : 'bot';
      const sender = msg.role === 'user' ? `👤 ${userName}` : '🤖 Bot';
      content += `
  <div class="message ${roleClass}">
    <div class="sender">${sender} <span class="time">${formatTimestamp(msg.timestamp)}</span></div>
    <div class="text">${escapeHtml(msg.text)}</div>
  </div>`;
    });

    content += `
  <div class="footer">
    <p>© 2026 ICS Security - HRM Chatbot</p>
  </div>
</body>
</html>`;

    downloadFile(content, `chat-history-${Date.now()}.html`, 'text/html');
    setShowMenu(false);
  };

  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="export-chat-container">
      <button 
        className="export-btn"
        onClick={() => messages.length > 0 && setShowMenu(!showMenu)}
        title={messages.length > 0 ? "Xuất lịch sử chat" : "Không có tin nhắn để xuất"}
        disabled={messages.length === 0}
      >
        <span className="export-icon">📥</span>
        <span className="export-label">Xuất lịch sử chat</span>
      </button>

      {showMenu && (
        <>
          <div className="export-backdrop" onClick={() => setShowMenu(false)} />
          <div className="export-menu">
            <div className="export-menu-header">
              <span>📥</span> Xuất lịch sử chat
            </div>
            <button className="export-option" onClick={exportAsText}>
              <span className="option-icon">📄</span>
              <div className="option-info">
                <span className="option-name">Text (.txt)</span>
                <span className="option-desc">Dạng văn bản thuần</span>
              </div>
            </button>
            <button className="export-option" onClick={exportAsHTML}>
              <span className="option-icon">🌐</span>
              <div className="option-info">
                <span className="option-name">HTML (.html)</span>
                <span className="option-desc">Mở trong trình duyệt</span>
              </div>
            </button>
            <button className="export-option" onClick={exportAsJSON}>
              <span className="option-icon">📊</span>
              <div className="option-info">
                <span className="option-name">JSON (.json)</span>
                <span className="option-desc">Dữ liệu có cấu trúc</span>
              </div>
            </button>
            <div className="export-menu-footer">
              {messages.length} tin nhắn
            </div>
          </div>
        </>
      )}
    </div>
  );
}
