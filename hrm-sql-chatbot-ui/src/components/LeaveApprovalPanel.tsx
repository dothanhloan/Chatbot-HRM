import { useState, useEffect } from 'react';
import './ActionForms.css';

interface LeaveRequest {
  id: number;
  nhan_vien_id: number;
  ho_ten: string;
  phong_ban: string;
  tu_ngay: string;
  den_ngay: string;
  so_ngay: number;
  ly_do: string;
  trang_thai: string;
  ngay_tao: string;
}

interface LeaveApprovalPanelProps {
  adminId: number;
  onClose: () => void;
}

export default function LeaveApprovalPanel({ adminId, onClose }: LeaveApprovalPanelProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/leave-requests?status=${filter}`);
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      // Demo data
      setRequests([
        {
          id: 1,
          nhan_vien_id: 3,
          ho_ten: 'Lê Văn Cường',
          phong_ban: 'Phòng Kỹ thuật',
          tu_ngay: '2026-02-05',
          den_ngay: '2026-02-07',
          so_ngay: 3,
          ly_do: 'Về quê có việc gia đình',
          trang_thai: 'Chờ duyệt',
          ngay_tao: '2026-02-01'
        },
        {
          id: 2,
          nhan_vien_id: 4,
          ho_ten: 'Phạm Thị Dung',
          phong_ban: 'Phòng Kinh doanh',
          tu_ngay: '2026-02-10',
          den_ngay: '2026-02-12',
          so_ngay: 3,
          ly_do: 'Khám sức khỏe định kỳ',
          trang_thai: 'Chờ duyệt',
          ngay_tao: '2026-02-01'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number, approved: boolean) => {
    setProcessing(requestId);
    try {
      const response = await fetch(`${API_BASE}/leave-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          admin_id: adminId,
          approved: approved
        })
      });
      const data = await response.json();
      if (data.success) {
        // Update local state
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? {...req, trang_thai: approved ? 'Đã duyệt' : 'Từ chối'}
            : req
        ));
      }
    } catch (error) {
      console.error('Error approving request:', error);
      // Demo mode - update locally
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? {...req, trang_thai: approved ? 'Đã duyệt' : 'Từ chối'}
          : req
      ));
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Chờ duyệt': return 'status-pending';
      case 'Đã duyệt': return 'status-approved';
      case 'Từ chối': return 'status-rejected';
      default: return '';
    }
  };

  const pendingCount = requests.filter(r => r.trang_thai === 'Chờ duyệt').length;

  return (
    <div className="action-modal-overlay" onClick={onClose}>
      <div className="action-modal large" onClick={e => e.stopPropagation()}>
        <div className="action-modal-header">
          <div className="header-icon">📋</div>
          <div className="header-text">
            <h2>Quản lý đơn nghỉ phép</h2>
            <p>{pendingCount} đơn chờ duyệt</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            ⏳ Chờ duyệt ({pendingCount})
          </button>
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            📑 Tất cả
          </button>
        </div>

        <div className="approval-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner large"></div>
              <p>Đang tải danh sách...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>Không có đơn nào {filter === 'pending' ? 'chờ duyệt' : ''}</p>
            </div>
          ) : (
            <div className="request-list">
              {requests.map(request => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <div className="employee-info">
                      <span className="employee-avatar">👤</span>
                      <div>
                        <strong>{request.ho_ten}</strong>
                        <span className="department">{request.phong_ban}</span>
                      </div>
                    </div>
                    <span className={`status-badge ${getStatusClass(request.trang_thai)}`}>
                      {request.trang_thai}
                    </span>
                  </div>

                  <div className="request-details">
                    <div className="detail-row">
                      <span className="detail-label">📅 Thời gian:</span>
                      <span className="detail-value">
                        {formatDate(request.tu_ngay)} → {formatDate(request.den_ngay)}
                        <span className="days-badge">{request.so_ngay} ngày</span>
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">📝 Lý do:</span>
                      <span className="detail-value">{request.ly_do}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">🕐 Ngày gửi:</span>
                      <span className="detail-value">{formatDate(request.ngay_tao)}</span>
                    </div>
                  </div>

                  {request.trang_thai === 'Chờ duyệt' && (
                    <div className="request-actions">
                      <button 
                        className="btn-reject"
                        onClick={() => handleApprove(request.id, false)}
                        disabled={processing === request.id}
                      >
                        ❌ Từ chối
                      </button>
                      <button 
                        className="btn-approve"
                        onClick={() => handleApprove(request.id, true)}
                        disabled={processing === request.id}
                      >
                        {processing === request.id ? (
                          <span className="spinner"></span>
                        ) : (
                          <>✅ Duyệt</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
