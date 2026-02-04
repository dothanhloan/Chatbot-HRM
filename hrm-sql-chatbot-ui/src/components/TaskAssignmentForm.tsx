import { useState, useEffect } from 'react';
import './ActionForms.css';

interface Employee {
  id: number;
  ho_ten: string;
  phong_ban: string;
  chuc_vu: string;
}

interface Project {
  id: number;
  ten_du_an: string;
  trang_thai: string;
}

interface TaskAssignmentFormProps {
  userId: number;
  userRole: string;
  userPhongBanId?: number | null;
  onClose: () => void;
  onSubmit: (data: TaskData) => void;
}

interface TaskData {
  ten_cong_viec: string;
  mo_ta: string;
  du_an_id: number | null;
  nguoi_nhan_ids: number[];
  nguoi_giao_id: number;
  han_hoan_thanh: string;
  muc_do_uu_tien: string;
}

export default function TaskAssignmentForm({ userId, userRole, userPhongBanId, onClose, onSubmit }: TaskAssignmentFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    ten_cong_viec: '',
    mo_ta: '',
    du_an_id: '',
    nguoi_nhan_ids: [] as number[],
    han_hoan_thanh: '',
    muc_do_uu_tien: 'Trung bình'
  });

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch employees and projects
      const [empRes, projRes] = await Promise.all([
        fetch(`${API_BASE}/employees?role=${userRole}&phong_ban_id=${userPhongBanId || ''}`),
        fetch(`${API_BASE}/projects`)
      ]);
      
      const empData = await empRes.json();
      const projData = await projRes.json();
      
      if (empData.success) setEmployees(empData.employees);
      if (projData.success) setProjects(projData.projects);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Demo data
      setEmployees([
        { id: 3, ho_ten: 'Lê Văn Cường', phong_ban: 'Phòng Kỹ thuật', chuc_vu: 'Nhân viên' },
        { id: 4, ho_ten: 'Phạm Thị Dung', phong_ban: 'Phòng Kinh doanh', chuc_vu: 'Nhân viên' },
        { id: 6, ho_ten: 'Ngô Thị Phương', phong_ban: 'Phòng Kỹ thuật', chuc_vu: 'Nhân viên' }
      ]);
      setProjects([
        { id: 1, ten_du_an: 'Hệ thống quản lý nhân sự', trang_thai: 'Đang thực hiện' },
        { id: 2, ten_du_an: 'Website công ty', trang_thai: 'Đang thực hiện' },
        { id: 3, ten_du_an: 'App mobile', trang_thai: 'Lên kế hoạch' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeToggle = (empId: number) => {
    setFormData(prev => ({
      ...prev,
      nguoi_nhan_ids: prev.nguoi_nhan_ids.includes(empId)
        ? prev.nguoi_nhan_ids.filter(id => id !== empId)
        : [...prev.nguoi_nhan_ids, empId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!formData.ten_cong_viec.trim()) {
      setError('Vui lòng nhập tên công việc');
      return;
    }
    if (formData.nguoi_nhan_ids.length === 0) {
      setError('Vui lòng chọn ít nhất một người nhận');
      return;
    }
    if (!formData.han_hoan_thanh) {
      setError('Vui lòng chọn hạn hoàn thành');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ten_cong_viec: formData.ten_cong_viec.trim(),
        mo_ta: formData.mo_ta.trim(),
        du_an_id: formData.du_an_id ? parseInt(formData.du_an_id) : null,
        nguoi_nhan_ids: formData.nguoi_nhan_ids,
        nguoi_giao_id: userId,
        han_hoan_thanh: formData.han_hoan_thanh,
        muc_do_uu_tien: formData.muc_do_uu_tien
      });
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const priorityColors: Record<string, string> = {
    'Thấp': '#10b981',
    'Trung bình': '#f59e0b',
    'Cao': '#ef4444',
    'Khẩn cấp': '#dc2626'
  };

  return (
    <div className="action-modal-overlay" onClick={onClose}>
      <div className="action-modal large" onClick={e => e.stopPropagation()}>
        <div className="action-modal-header">
          <div className="header-icon">📋</div>
          <div className="header-text">
            <h2>Giao việc thông minh</h2>
            <p>Tạo và phân công công việc mới</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner large"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="action-form task-form">
            {error && (
              <div className="form-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="form-group">
              <label>📌 Tên công việc <span className="required">*</span></label>
              <input
                type="text"
                value={formData.ten_cong_viec}
                onChange={e => setFormData({...formData, ten_cong_viec: e.target.value})}
                placeholder="VD: Hoàn thành báo cáo tháng 2"
                required
              />
            </div>

            <div className="form-group">
              <label>📝 Mô tả chi tiết</label>
              <textarea
                value={formData.mo_ta}
                onChange={e => setFormData({...formData, mo_ta: e.target.value})}
                placeholder="Mô tả yêu cầu, hướng dẫn thực hiện..."
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>📁 Dự án (tùy chọn)</label>
                <select
                  value={formData.du_an_id}
                  onChange={e => setFormData({...formData, du_an_id: e.target.value})}
                >
                  <option value="">-- Không thuộc dự án --</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>
                      {proj.ten_du_an}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>📅 Hạn hoàn thành <span className="required">*</span></label>
                <input
                  type="date"
                  value={formData.han_hoan_thanh}
                  onChange={e => setFormData({...formData, han_hoan_thanh: e.target.value})}
                  min={minDate}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>⚡ Mức độ ưu tiên</label>
              <div className="priority-selector">
                {['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp'].map(priority => (
                  <button
                    key={priority}
                    type="button"
                    className={`priority-btn ${formData.muc_do_uu_tien === priority ? 'active' : ''}`}
                    style={{
                      '--priority-color': priorityColors[priority]
                    } as React.CSSProperties}
                    onClick={() => setFormData({...formData, muc_do_uu_tien: priority})}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>
                👥 Người thực hiện <span className="required">*</span>
                <span className="selected-count">
                  ({formData.nguoi_nhan_ids.length} đã chọn)
                </span>
              </label>
              <div className="employee-grid">
                {employees.map(emp => (
                  <div
                    key={emp.id}
                    className={`employee-card ${formData.nguoi_nhan_ids.includes(emp.id) ? 'selected' : ''}`}
                    onClick={() => handleEmployeeToggle(emp.id)}
                  >
                    <div className="emp-avatar">👤</div>
                    <div className="emp-info">
                      <span className="emp-name">{emp.ho_ten}</span>
                      <span className="emp-dept">{emp.phong_ban}</span>
                    </div>
                    <div className="emp-check">
                      {formData.nguoi_nhan_ids.includes(emp.id) ? '✅' : '⬜'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
                Hủy
              </button>
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="spinner"></span>
                    Đang giao việc...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Giao việc
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
