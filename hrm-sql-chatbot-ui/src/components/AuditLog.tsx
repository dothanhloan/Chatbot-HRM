import { useState, useEffect } from 'react';
import { MOCK_MODE } from '../services/mockData';
import './AuditLog.css';

interface AuditEntry {
  id: number;
  timestamp: string;
  user: string;
  userId: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'QUERY' | 'LOGIN' | 'LOGOUT' | 'EXPORT';
  resource: string;
  details: string;
  ipAddress: string;
  userAgent?: string;
}

interface AuditLogProps {
  onClose: () => void;
}

// Mock audit data
const getMockAuditLog = (): AuditEntry[] => [
  {
    id: 1,
    timestamp: '2026-02-01 14:45:23',
    user: 'Nguyễn Văn An',
    userId: 1,
    action: 'APPROVE',
    resource: 'Đơn nghỉ phép #127',
    details: 'Duyệt đơn nghỉ phép của Trần Thị B (10/02 - 12/02)',
    ipAddress: '192.168.1.100'
  },
  {
    id: 2,
    timestamp: '2026-02-01 14:32:15',
    user: 'Trần Thị Bình',
    userId: 2,
    action: 'CREATE',
    resource: 'Công việc "Review code module Auth"',
    details: 'Giao việc cho Lê Văn C, hạn 05/02/2026',
    ipAddress: '192.168.1.105'
  },
  {
    id: 3,
    timestamp: '2026-02-01 14:25:18',
    user: 'Lê Văn Cường',
    userId: 3,
    action: 'QUERY',
    resource: 'Chatbot HRM',
    details: 'Hỏi: "Xem lương tháng 1 của tôi"',
    ipAddress: '192.168.1.110'
  },
  {
    id: 4,
    timestamp: '2026-02-01 14:20:45',
    user: 'Nguyễn Văn An',
    userId: 1,
    action: 'UPDATE',
    resource: 'Nhân viên #15',
    details: 'Chuyển phòng ban: Kỹ thuật → Marketing',
    ipAddress: '192.168.1.100'
  },
  {
    id: 5,
    timestamp: '2026-02-01 14:15:33',
    user: 'System',
    userId: 0,
    action: 'CREATE',
    resource: 'Cảnh báo tự động',
    details: '3 công việc đã quá hạn hoàn thành',
    ipAddress: '127.0.0.1'
  },
  {
    id: 6,
    timestamp: '2026-02-01 13:50:12',
    user: 'Phạm Văn D',
    userId: 4,
    action: 'EXPORT',
    resource: 'Báo cáo chấm công',
    details: 'Xuất báo cáo tháng 1/2026 (Excel)',
    ipAddress: '192.168.1.112'
  },
  {
    id: 7,
    timestamp: '2026-02-01 13:30:05',
    user: 'Trần Thị Bình',
    userId: 2,
    action: 'REJECT',
    resource: 'Đơn nghỉ phép #125',
    details: 'Từ chối đơn nghỉ phép của Nguyễn E (lý do: thiếu người)',
    ipAddress: '192.168.1.105'
  },
  {
    id: 8,
    timestamp: '2026-02-01 09:05:22',
    user: 'Nguyễn Văn An',
    userId: 1,
    action: 'LOGIN',
    resource: 'Hệ thống',
    details: 'Đăng nhập thành công',
    ipAddress: '192.168.1.100'
  },
  {
    id: 9,
    timestamp: '2026-02-01 08:55:10',
    user: 'Lê Văn Cường',
    userId: 3,
    action: 'UPDATE',
    resource: 'Công việc #45',
    details: 'Cập nhật tiến độ: 60% → 80%',
    ipAddress: '192.168.1.110'
  },
  {
    id: 10,
    timestamp: '2026-02-01 08:30:00',
    user: 'System',
    userId: 0,
    action: 'CREATE',
    resource: 'Daily Briefing',
    details: 'Tạo báo cáo tổng hợp ngày 01/02/2026',
    ipAddress: '127.0.0.1'
  }
];

export default function AuditLog({ onClose }: AuditLogProps) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    action: 'all',
    dateRange: 'today',
    search: ''
  });
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    setLoading(true);
    
    if (MOCK_MODE) {
      setTimeout(() => {
        let filtered = getMockAuditLog();
        
        if (filter.action !== 'all') {
          filtered = filtered.filter(log => log.action === filter.action);
        }
        
        if (filter.search) {
          const search = filter.search.toLowerCase();
          filtered = filtered.filter(log => 
            log.user.toLowerCase().includes(search) ||
            log.resource.toLowerCase().includes(search) ||
            log.details.toLowerCase().includes(search)
          );
        }
        
        setLogs(filtered);
        setLoading(false);
      }, 300);
      return;
    }

    // Real API would go here
    setLogs(getMockAuditLog());
    setLoading(false);
  };

  const getActionBadge = (action: AuditEntry['action']) => {
    const badges: Record<string, { color: string; icon: string }> = {
      CREATE: { color: '#2ed573', icon: '➕' },
      UPDATE: { color: '#ffa502', icon: '✏️' },
      DELETE: { color: '#ff4757', icon: '🗑️' },
      APPROVE: { color: '#2ed573', icon: '✅' },
      REJECT: { color: '#ff4757', icon: '❌' },
      QUERY: { color: '#54a0ff', icon: '🔍' },
      LOGIN: { color: '#667eea', icon: '🔐' },
      LOGOUT: { color: '#a0a0a0', icon: '🚪' },
      EXPORT: { color: '#9b59b6', icon: '📥' }
    };
    
    const badge = badges[action] || { color: '#888', icon: '📌' };
    return (
      <span 
        className="action-badge" 
        style={{ background: badge.color }}
      >
        {badge.icon} {action}
      </span>
    );
  };

  const exportLogs = (format: 'csv' | 'json') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_log_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } else {
      const headers = ['Thời gian', 'Người dùng', 'Hành động', 'Đối tượng', 'Chi tiết', 'IP'];
      const rows = logs.map(log => [
        log.timestamp,
        log.user,
        log.action,
        log.resource,
        log.details,
        log.ipAddress
      ]);
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="audit-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="audit-header">
          <div className="header-info">
            <h2>🔐 Audit Log</h2>
            <span className="subtitle">Theo dõi mọi hoạt động trong hệ thống</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Filters */}
        <div className="audit-filters">
          <div className="filter-group">
            <label>Hành động:</label>
            <select 
              value={filter.action}
              onChange={e => setFilter({ ...filter, action: e.target.value })}
            >
              <option value="all">Tất cả</option>
              <option value="CREATE">Tạo mới</option>
              <option value="UPDATE">Cập nhật</option>
              <option value="DELETE">Xóa</option>
              <option value="APPROVE">Duyệt</option>
              <option value="REJECT">Từ chối</option>
              <option value="QUERY">Truy vấn</option>
              <option value="LOGIN">Đăng nhập</option>
              <option value="EXPORT">Xuất dữ liệu</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Thời gian:</label>
            <select 
              value={filter.dateRange}
              onChange={e => setFilter({ ...filter, dateRange: e.target.value })}
            >
              <option value="today">Hôm nay</option>
              <option value="week">7 ngày qua</option>
              <option value="month">30 ngày qua</option>
              <option value="all">Tất cả</option>
            </select>
          </div>

          <div className="filter-group search">
            <label>🔍</label>
            <input 
              type="text"
              placeholder="Tìm kiếm..."
              value={filter.search}
              onChange={e => setFilter({ ...filter, search: e.target.value })}
            />
          </div>

          <div className="export-buttons">
            <button onClick={() => exportLogs('csv')}>📥 CSV</button>
            <button onClick={() => exportLogs('json')}>📥 JSON</button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="audit-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <span>Đang tải...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <span>📭</span>
              <p>Không có log nào phù hợp</p>
            </div>
          ) : (
            <div className="logs-list">
              {logs.map(log => (
                <div 
                  key={log.id} 
                  className={`log-entry ${selectedLog?.id === log.id ? 'selected' : ''}`}
                  onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                >
                  <div className="log-time">
                    <span className="time">{log.timestamp.split(' ')[1]}</span>
                    <span className="date">{log.timestamp.split(' ')[0]}</span>
                  </div>
                  
                  <div className="log-main">
                    <div className="log-header">
                      <span className="log-user">
                        {log.user === 'System' ? '🤖' : '👤'} {log.user}
                      </span>
                      {getActionBadge(log.action)}
                    </div>
                    <div className="log-resource">{log.resource}</div>
                    <div className="log-details">{log.details}</div>
                  </div>

                  <div className="log-meta">
                    <span className="ip-address">🌐 {log.ipAddress}</span>
                  </div>

                  {/* Expanded Details */}
                  {selectedLog?.id === log.id && (
                    <div className="log-expanded">
                      <div className="expanded-row">
                        <span className="label">User ID:</span>
                        <span className="value">{log.userId}</span>
                      </div>
                      <div className="expanded-row">
                        <span className="label">IP Address:</span>
                        <span className="value">{log.ipAddress}</span>
                      </div>
                      <div className="expanded-row">
                        <span className="label">Timestamp:</span>
                        <span className="value">{log.timestamp}</span>
                      </div>
                      <div className="expanded-row">
                        <span className="label">Full Details:</span>
                        <span className="value">{log.details}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="audit-footer">
          <span className="log-count">📋 {logs.length} bản ghi</span>
          <span className="compliance-note">
            ✅ ISO 27001 Compliant | GDPR Ready
          </span>
        </div>
      </div>
    </div>
  );
}
