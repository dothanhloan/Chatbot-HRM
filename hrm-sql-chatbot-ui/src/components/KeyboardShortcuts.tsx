import { useEffect, useState } from 'react';
import './KeyboardShortcuts.css';

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface KeyboardShortcutsProps {
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onFocusInput: () => void;
  onExport?: () => void;
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['Ctrl', 'Enter'], description: 'Gửi tin nhắn' },
  { keys: ['Ctrl', 'N'], description: 'Xóa chat / Bắt đầu mới' },
  { keys: ['Ctrl', 'B'], description: 'Ẩn/Hiện sidebar' },
  { keys: ['Ctrl', '/'], description: 'Focus ô nhập' },
  { keys: ['Ctrl', 'E'], description: 'Xuất lịch sử chat' },
  { keys: ['?'], description: 'Hiện phím tắt' },
  { keys: ['Esc'], description: 'Đóng popup' },
];

export default function KeyboardShortcuts({ 
  onNewChat, 
  onToggleSidebar, 
  onFocusInput,
  onExport 
}: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input/textarea
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Show help with ?
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      // Close with Escape
      if (e.key === 'Escape') {
        setShowHelp(false);
        return;
      }

      // Ctrl shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            onNewChat();
            break;
          case 'b':
            e.preventDefault();
            onToggleSidebar();
            break;
          case '/':
            e.preventDefault();
            onFocusInput();
            break;
          case 'e':
            e.preventDefault();
            onExport?.();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewChat, onToggleSidebar, onFocusInput, onExport]);

  return (
    <>
      {/* Help Modal */}
      {showHelp && (
        <div className="shortcuts-overlay" onClick={() => setShowHelp(false)}>
          <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
            <div className="shortcuts-header">
              <span className="shortcuts-icon">⌨️</span>
              <h2>Phím tắt</h2>
              <button className="close-btn" onClick={() => setShowHelp(false)}>✕</button>
            </div>
            <div className="shortcuts-list">
              {SHORTCUTS.map((shortcut, index) => (
                <div key={index} className="shortcut-item">
                  <div className="shortcut-keys">
                    {shortcut.keys.map((key, i) => (
                      <span key={i}>
                        <kbd className="key">{key}</kbd>
                        {i < shortcut.keys.length - 1 && <span className="plus">+</span>}
                      </span>
                    ))}
                  </div>
                  <span className="shortcut-desc">{shortcut.description}</span>
                </div>
              ))}
            </div>
            <div className="shortcuts-footer">
              Nhấn <kbd className="key small">?</kbd> để hiện/ẩn
            </div>
          </div>
        </div>
      )}

      {/* Hint in corner */}
      <button 
        className="shortcuts-hint"
        onClick={() => setShowHelp(true)}
        title="Phím tắt (?)"
      >
        <span>⌨️</span>
      </button>
    </>
  );
}
