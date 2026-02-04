import { useState, useEffect } from 'react';
import { MOCK_MODE, getMockBriefing } from '../services/mockData';
import './DailyBriefing.css';

const API_URL = `${import.meta.env.VITE_API_BASE}/briefing`;

interface BriefingData {
  greeting: string;
  checkin_status: {
    checked_in: boolean;
    check_in_time: string | null;
    check_out_time: string | null;
    is_late: boolean;
    status_text: string;
  } | null;
  tasks_today: Array<{
    ten_cong_viec: string;
    han_hoan_thanh: string;
    muc_do_uu_tien: string;
    trang_thai: string;
  }>;
  leave_balance: {
    tong_ngay_phep: number;
    ngay_phep_da_dung: number;
    ngay_phep_con_lai: number;
  } | null;
  alerts: Array<{
    type: 'warning' | 'info' | 'error';
    message: string;
  }>;
  team_summary: {
    total_employees: number;
    checked_in: number;
    on_leave: number;
    not_checked_in: number;
  } | null;
  dept_tasks_summary: {
    total_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
  } | null;
  dept_projects_summary: {
    total_projects: number;
    overdue_projects: number;
  } | null;
  company_summary: {
    total_employees: number;
    checked_in_today: number;
    active_projects: number;
    overdue_tasks: number;
  } | null;
}

interface DailyBriefingProps {
  userId: number;
  role: string;
  phongBanId: number | null;
  onClose: () => void;
}

export default function DailyBriefing({ userId, role, phongBanId, onClose }: DailyBriefingProps) {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBriefing();
  }, [userId, role, phongBanId]);

  const fetchBriefing = async () => {
    try {
      setLoading(true);
      
      // Mock Mode - sử dụng dữ liệu giả
      if (MOCK_MODE) {
        setTimeout(() => {
          const mockData = getMockBriefing(role);
          setBriefing(mockData);
          setLoading(false);
        }, 500);
        return;
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          role: role,
          phong_ban_id: phongBanId
        })
      });
      
      console.log('[BRIEFING] Response status:', res.status, 'OK:', res.ok);
      
      if (!res.ok) throw new Error(`Failed to fetch briefing: ${res.status}`);
      
      const data = await res.json();
      console.log('[BRIEFING] Full data:', JSON.stringify(data, null, 2));
      console.log('[BRIEFING] greeting:', data.greeting);
      console.log('[BRIEFING] team_summary:', data.team_summary);
      console.log('[BRIEFING] dept_tasks_summary:', data.dept_tasks_summary);
      
      setBriefing(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Không thể tải thông tin. ${errorMsg}`);
      console.error('[BRIEFING ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'cao': return '#ef4444';
      case 'trung bình': return '#f59e0b';
      default: return '#22c55e';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  if (loading) {
    return (
      <div className="briefing-overlay">
        <div className="briefing-modal">
          <div className="briefing-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải thông tin...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !briefing) {
    return (
      <div className="briefing-overlay">
        <div className="briefing-modal">
          <div className="briefing-error">
            <span className="error-icon">❌</span>
            <p>{error || 'Có lỗi xảy ra'}</p>
            <button onClick={onClose}>Đóng</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="briefing-overlay" onClick={onClose}>
      <div className="briefing-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="briefing-header">
          <div className="greeting-section">
            <h2>{briefing.greeting}</h2>
            <p className="briefing-date">
              📅 {new Date().toLocaleDateString('vi-VN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="briefing-content">
          {/* ADMIN VIEW - Executive Summary */}
          {role === 'admin' ? (
            <>
              {/* Alerts */}
              {briefing.alerts && briefing.alerts.length > 0 && (
                <div className="alerts-section">
                  {briefing.alerts.map((alert, idx) => (
                    <div key={idx} className={`alert-item alert-${alert.type}`}>
                      <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                      <span className="alert-message">{alert.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {briefing.company_summary && (
                <div className="stats-grid">
                  <div className="stat-card company-card">
                    <div className="stat-icon">🏢</div>
                    <div className="stat-info">
                      <h4>Chấm công hôm nay</h4>
                      <p className="stat-value">
                        {briefing.company_summary.checked_in_today}/{briefing.company_summary.total_employees}
                      </p>
                      <span className="stat-detail">nhân viên đã check-in</span>
                    </div>
                  </div>
                  
                  <div className="stat-card overdue-card">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                      <h4>Công việc quá hạn</h4>
                      <p className="stat-value" style={{ color: '#ef4444' }}>
                        {briefing.company_summary.overdue_tasks}
                      </p>
                    </div>
                  </div>

                  <div className="stat-card overdue-projects-card">
                    <div className="stat-icon">📌</div>
                    <div className="stat-info">
                      <h4>Dự án quá hạn</h4>
                      <p className="stat-value" style={{ color: '#ef4444' }}>
                        {briefing.company_summary.overdue_projects || 0}
                      </p>
                    </div>
                  </div>

                  <div className="stat-card projects-card">
                    <div className="stat-icon">📁</div>
                    <div className="stat-info">
                      <h4>Dự án đang chạy</h4>
                      <p className="stat-value">{briefing.company_summary.active_projects}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : role === 'employee' ? (
            // EMPLOYEE VIEW - Only show tasks
            <>
              {briefing.tasks_today && briefing.tasks_today.length > 0 && (
                <div className="tasks-section">
                  <h3>📝 Công việc cần hoàn thành</h3>
                  <div className="tasks-list">
                    {briefing.tasks_today.map((task, idx) => (
                      <div key={idx} className="task-item">
                        <div 
                          className="task-priority" 
                          style={{ backgroundColor: getPriorityColor(task.muc_do_uu_tien) }}
                        ></div>
                        <div className="task-content">
                          <p className="task-name">{task.ten_cong_viec}</p>
                          <span className="task-deadline">
                            📅 {task.han_hoan_thanh ? new Date(task.han_hoan_thanh).toLocaleDateString('vi-VN') : 'Chưa có deadline'}
                          </span>
                        </div>
                        <span className={`task-status status-${task.trang_thai?.toLowerCase().replace(/\s/g, '-')}`}>
                          {task.trang_thai}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!briefing.tasks_today || briefing.tasks_today.length === 0) && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
                  <p>✅ Bạn không có công việc nào hôm nay</p>
                </div>
              )}
            </>
          ) : (
            // MANAGER VIEW - Full view
            <>
              {/* Alerts */}
              {briefing.alerts && briefing.alerts.length > 0 && (
                <div className="alerts-section">
                  {briefing.alerts.map((alert, idx) => (
                    <div key={idx} className={`alert-item alert-${alert.type}`}>
                      <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                      <span className="alert-message">{alert.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Stats Grid */}
              <div className="stats-grid">
                {/* Check-in Status */}
                <div className={`stat-card checkin-card ${briefing.checkin_status?.checked_in ? 'checked-in' : 'not-checked'}`}>
                  <div className="stat-icon">⏰</div>
                  <div className="stat-info">
                    <h4>Chấm công</h4>
                    {briefing.checkin_status?.checked_in ? (
                      <>
                        <p className="stat-value">{briefing.checkin_status.check_in_time}</p>
                        <span className={`status-badge ${briefing.checkin_status.is_late ? 'late' : 'ontime'}`}>
                          {briefing.checkin_status.status_text}
                        </span>
                      </>
                    ) : (
                      <p className="stat-value">Chưa check-in</p>
                    )}
                  </div>
                </div>

                {/* Team Check-in */}
                {role === 'manager' && briefing.team_summary && (
                  <div className="stat-card team-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                      <h4>Chấm công phòng ban</h4>
                      <p className="stat-value">
                        {briefing.team_summary.checked_in}/{briefing.team_summary.total_employees}
                      </p>
                      <span className="stat-detail">
                        Nghỉ phép: {briefing.team_summary.on_leave}
                      </span>
                    </div>
                  </div>
                )}

                {/* Department Tasks */}
                {role === 'manager' && briefing.dept_tasks_summary && (
                  <div className="stat-card tasks-dept-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-info">
                      <h4>Công việc phòng ban</h4>
                      <p className="stat-value">{briefing.dept_tasks_summary.total_tasks}</p>
                      <span className="stat-detail" style={{ color: briefing.dept_tasks_summary.overdue_tasks > 0 ? '#ef4444' : '#888' }}>
                        Trễ hạn: {briefing.dept_tasks_summary.overdue_tasks}
                      </span>
                    </div>
                  </div>
                )}

                {/* Department Projects */}
                {role === 'manager' && briefing.dept_projects_summary && (
                  <div className="stat-card projects-dept-card">
                    <div className="stat-icon">📁</div>
                    <div className="stat-info">
                      <h4>Dự án phòng ban</h4>
                      <p className="stat-value">{briefing.dept_projects_summary.total_projects}</p>
                      <span className="stat-detail" style={{ color: briefing.dept_projects_summary.overdue_projects > 0 ? '#ef4444' : '#888' }}>
                        Trễ hạn: {briefing.dept_projects_summary.overdue_projects}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tasks List */}
              {briefing.tasks_today && briefing.tasks_today.length > 0 && (
                <div className="tasks-section">
                  <h3>📝 Công việc cần hoàn thành</h3>
                  <div className="tasks-list">
                    {briefing.tasks_today.map((task, idx) => (
                      <div key={idx} className="task-item">
                        <div 
                          className="task-priority" 
                          style={{ backgroundColor: getPriorityColor(task.muc_do_uu_tien) }}
                        ></div>
                        <div className="task-content">
                          <p className="task-name">{task.ten_cong_viec}</p>
                          <span className="task-deadline">
                            📅 {task.han_hoan_thanh ? new Date(task.han_hoan_thanh).toLocaleDateString('vi-VN') : 'Chưa có deadline'}
                          </span>
                        </div>
                        <span className={`task-status status-${task.trang_thai?.toLowerCase().replace(/\s/g, '-')}`}>
                          {task.trang_thai}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="briefing-footer">
          <button className="btn-secondary" onClick={onClose}>
            Đóng
          </button>
          <button className="btn-primary" onClick={onClose}>
            Bắt đầu làm việc 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
