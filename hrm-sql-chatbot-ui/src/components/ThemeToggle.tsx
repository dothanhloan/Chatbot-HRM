import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle-btn"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
      aria-label="Toggle theme"
    >
      <div className="toggle-track">
        <span className="toggle-icon sun">☀️</span>
        <span className="toggle-icon moon">🌙</span>
        <div className={`toggle-thumb ${theme}`}></div>
      </div>
    </button>
  );
}
