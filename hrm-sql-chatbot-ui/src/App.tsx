import { useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/chat";

interface Message {
  role: "user" | "bot";
  text: string;
}

export default function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!question.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.answer },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ Lỗi kết nối backend" },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">🎓</div>
        <h3>ICS Security</h3>

        <div className="card">
          📅 Thành lập: 03/2020<br />
          🏆 ISO 27001<br />
          🚀 Sản phẩm: VietGuard, AI SOC
        </div>

        <a
          href="https://icss.com.vn"
          target="_blank"
          className="link"
        >
          🌐 icss.com.vn
        </a>

        <footer>© 2024 ICS Security</footer>
      </aside>

      {/* CHAT AREA */}
      <main className="chat-area">
        <h1>🛡️ Trợ lý Ảo An ninh Mạng ICS</h1>
        <p className="subtitle">
          Hỗ trợ thông tin về VietGuard, AI SOC và chính sách bảo mật
        </p>

        <div className="chat-box">
          {messages.length === 0 && (
            <div className="welcome">
              👋 Chào bạn! Tôi có thể giúp gì về các giải pháp của ICS?
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <b>{m.role === "user" ? "You" : "Bot"}:</b> {m.text}
            </div>
          ))}

          {loading && <div className="loading">🤖 Bot đang trả lời...</div>}
        </div>

        <div className="input-box">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Nhập câu hỏi tại đây..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>➤</button>
        </div>
      </main>
    </div>
  );
}
