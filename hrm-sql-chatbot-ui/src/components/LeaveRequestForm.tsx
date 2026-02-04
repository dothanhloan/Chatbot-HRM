import { useState } from 'react';
import './ActionForms.css';

interface LeaveRequestFormProps {
  userId: number;
  userName: string;
  onClose: () => void;
  onSubmit: (data: LeaveRequestData) => void;
}

interface LeaveRequestData {
  nhanvien_id: number;
  tu_ngay: string;
  den_ngay: string;
  ly_do: string;
}

export default function LeaveRequestForm({ userId, userName, onClose, onSubmit }: LeaveRequestFormProps) {
  const [formData, setFormData] = useState({
    tu_ngay: '',
    den_ngay: '',
    ly_do: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDays = () => {
    if (!formData.tu_ngay || !formData.den_ngay) return 0;
    const start = new Date(formData.tu_ngay);
    const end = new Date(formData.den_ngay);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!formData.tu_ngay || !formData.den_ngay) {
      setError('Vui lòng chọn ngày bắt đầu và kết thúc');
      return;
    }

    if (new Date(formData.tu_ngay) > new Date(formData.den_ngay)) {
      setError('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    if (!formData.ly_do.trim()) {
      setError('Vui lòng nhập lý do nghỉ phép');
      return;
    }

    setLoading(true);
    
    try {
      await onSubmit({
        nhanvien_id: userId,
        tu_ngay: formData.tu_ngay,
        den_ngay: formData.den_ngay,
        ly_do: formData.ly_do.trim()
      });
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="action-modal-overlay" onClick={onClose}>
      <div className="action-modal" onClick={e => e.stopPropagation()}>
        <div className="action-modal-header">
          <div className="header-icon">🏖️</div>
          <div className="header-text">
            <h2>Đăng ký nghỉ phép</h2>
            <p>Nhân viên: {userName}</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="action-form">
          {error && (
            <div className="form-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>📅 Từ ngày</label>
              <input
                type="date"
                value={formData.tu_ngay}
                onChange={e => setFormData({...formData, tu_ngay: e.target.value})}
                min={today}
                required
              />
            </div>
            <div className="form-group">
              <label>📅 Đến ngày</label>
              <input
                type="date"
                value={formData.den_ngay}
                onChange={e => setFormData({...formData, den_ngay: e.target.value})}
                min={formData.tu_ngay || today}
                required
              />
            </div>
          </div>

          {calculateDays() > 0 && (
            <div className="days-preview">
              <span className="days-count">{calculateDays()}</span>
              <span className="days-label">ngày nghỉ</span>
            </div>
          )}

          <div className="form-group">
            <label>📝 Lý do nghỉ phép</label>
            <textarea
              value={formData.ly_do}
              onChange={e => setFormData({...formData, ly_do: e.target.value})}
              placeholder="Nhập lý do nghỉ phép..."
              rows={3}
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Đang gửi...
                </>
              ) : (
                <>
                  <span>📤</span>
                  Gửi đơn
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
