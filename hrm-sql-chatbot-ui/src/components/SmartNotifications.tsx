import { useState, useEffect } from 'react';
import { MOCK_MODE } from '../services/mockData';
import './SmartNotifications.css';

interface Notification {
  id: number;
  type: 'warning' | 'info' | 'success' | 'urgent' | 'reminder';
  title: string;
  message: string;
  time: string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface Insight {
  id: number;
  type: 'productivity' | 'attendance' | 'task' | 'leave' | 'trend';
  title: string;
  value: string | number;
  change?: number; // percentage change
  description: string;
  icon: string;
}

interface SmartNotificationsProps {
  userId: number;
  role: string;
}

// Mock notifications based on role
const getMockNotifications = (role: string): Notification[] => {
  const baseNotifications: Notification[] = [
    {
      id: 1,
      type: 'reminder',
      title: '⏰ Nhắc nhở Check-out',
      message: 'Đừng quên check-out trước khi về nhé!',
      time: '5 phút trước',
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: '📋 Công việc mới',
      message: 'Bạn có 1 công việc mới được giao',
      time: '30 phút trước',
      read: false
    },
    {
      id: 3,
      type: 'success',
      title: '✅ Đơn phép được duyệt',
      message: 'Đơn xin nghỉ ngày 10/02 đã được duyệt',
      time: '2 giờ trước',
      read: true
    }
  ];

  if (role === 'admin') {
    return [
      {
        id: 10,
        type: 'urgent',
        title: '🔴 Cần duyệt gấp',
        message: '3 đơn nghỉ phép đang chờ duyệt',
        time: 'Vừa xong',
        read: false
      },
      {
        id: 11,
        type: 'warning',
        title: '⚠️ Task quá hạn',
        message: '5 công việc đã quá hạn hoàn thành',
        time: '1 giờ trước',
        read: false
      },
      {
        id: 12,
        type: 'info',
        title: '📊 Báo cáo tuần',
        message: 'Báo cáo tổng hợp tuần đã sẵn sàng',
        time: '3 giờ trước',
        read: true
      },
      ...baseNotifications
    ];
  }

  if (role === 'manager') {
    return [
      {
        id: 20,
        type: 'warning',
        title: '👥 Nhân viên chưa check-in',
        message: '2 nhân viên trong team chưa check-in',
        time: '15 phút trước',
        read: false
      },
      {
        id: 21,
        type: 'info',
        title: '📈 Sprint sắp kết thúc',
        message: 'Sprint hiện tại còn 3 ngày',
        time: '1 giờ trước',
        read: false
      },
      ...baseNotifications
    ];
  }

  return baseNotifications;
};

// Mock insights based on role
const getMockInsights = (role: string): Insight[] => {
  const employeeInsights: Insight[] = [
    {
      id: 1,
      type: 'productivity',
      title: 'Năng suất tuần này',
      value: '87%',
      change: 5,
      description: 'Tăng 5% so với tuần trước',
      icon: '📈'
    },
    {
      id: 2,
      type: 'task',
      title: 'Hoàn thành công việc',
      value: '12/15',
      change: 0,
      description: '3 việc còn lại cần hoàn thành',
      icon: '✅'
    },
    {
      id: 3,
      type: 'attendance',
      title: 'Đi làm đúng giờ',
      value: '95%',
      change: 2,
      description: 'Tháng này bạn đi làm rất đúng giờ!',
      icon: '⏰'
    },
    {
      id: 4,
      type: 'leave',
      title: 'Ngày phép còn lại',
      value: 9,
      description: 'Đủ cho 1 kỳ nghỉ dài',
      icon: '🏖️'
    }
  ];

  if (role === 'admin') {
    return [
      {
        id: 10,
        type: 'attendance',
        title: 'Tỷ lệ đi làm hôm nay',
        value: '92%',
        change: 3,
        description: '46/50 nhân viên đã check-in',
        icon: '👥'
      },
      {
        id: 11,
        type: 'task',
        title: 'Tiến độ dự án',
        value: '78%',
        change: -2,
        description: '3 dự án đang trễ tiến độ',
        icon: '📊'
      },
      {
        id: 12,
        type: 'productivity',
        title: 'KPI công ty',
        value: '85%',
        change: 4,
        description: 'Tăng trưởng tốt so với tháng trước',
        icon: '🎯'
      },
      {
        id: 13,
        type: 'trend',
        title: 'Xu hướng nghỉ phép',
        value: '↑ 15%',
        description: 'Nhiều đơn xin nghỉ hơn tuần trước',
        icon: '📉'
      },
      ...employeeInsights.slice(0, 2)
    ];
  }

  if (role === 'manager') {
    return [
      {
        id: 20,
        type: 'attendance',
        title: 'Team đi làm',
        value: '8/10',
        description: '2 người đang nghỉ phép',
        icon: '👥'
      },
      {
        id: 21,
        type: 'task',
        title: 'Task team hoàn thành',
        value: '24/30',
        change: 8,
        description: 'Team đang làm rất tốt!',
        icon: '🚀'
      },
      {
        id: 22,
        type: 'productivity',
        title: 'Hiệu suất team',
        value: '91%',
        change: 6,
        description: 'Cao hơn trung bình công ty',
        icon: '⭐'
      },
      ...employeeInsights
    ];
  }

  return employeeInsights;
};

export default function SmartNotifications({ userId, role }: SmartNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [activeTab, setActiveTab] = useState<'notifications' | 'insights'>('notifications');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId, role]);

  const fetchData = async () => {
    setLoading(true);
    
    if (MOCK_MODE) {
      setTimeout(() => {
        setNotifications(getMockNotifications(role));
        setInsights(getMockInsights(role));
        setLoading(false);
      }, 300);
      return;
    }

    // Real API calls would go here
    try {
      // TODO: Implement real API
      setNotifications(getMockNotifications(role));
      setInsights(getMockInsights(role));
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationClass = (type: Notification['type']) => {
    switch (type) {
      case 'urgent': return 'notification-urgent';
      case 'warning': return 'notification-warning';
      case 'success': return 'notification-success';
      case 'reminder': return 'notification-reminder';
      default: return 'notification-info';
    }
  };

  const getInsightTrend = (change?: number) => {
    if (!change) return null;
    if (change > 0) return <span className="trend-up">↑ {change}%</span>;
    if (change < 0) return <span className="trend-down">↓ {Math.abs(change)}%</span>;
    return null;
  };

  if (loading) {
    return (
      <div className="smart-notifications loading">
        <div className="loading-spinner"></div>
        <span>Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="smart-notifications">
      {/* Tab Headers */}
      <div className="sn-tabs">
        <button 
          className={`sn-tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Thông báo
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>
        <button 
          className={`sn-tab ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          💡 Insights
        </button>
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="sn-content notifications-content">
          {unreadCount > 0 && (
            <button className="mark-all-read" onClick={markAllAsRead}>
              ✓ Đánh dấu tất cả đã đọc
            </button>
          )}
          
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <span>🎉</span>
                <p>Không có thông báo mới</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${getNotificationClass(notification.type)} ${notification.read ? 'read' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="notification-header">
                    <span className="notification-title">{notification.title}</span>
                    <span className="notification-time">{notification.time}</span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  {notification.action && (
                    <button 
                      className="notification-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        notification.action?.onClick();
                      }}
                    >
                      {notification.action.label}
                    </button>
                  )}
                  {!notification.read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="sn-content insights-content">
          <div className="insights-grid">
            {insights.map(insight => (
              <div key={insight.id} className={`insight-card insight-${insight.type}`}>
                <div className="insight-icon">{insight.icon}</div>
                <div className="insight-info">
                  <span className="insight-title">{insight.title}</span>
                  <div className="insight-value">
                    <span className="value">{insight.value}</span>
                    {getInsightTrend(insight.change)}
                  </div>
                  <span className="insight-description">{insight.description}</span>
                </div>
              </div>
            ))}
          </div>

          {/* AI Suggestions */}
          <div className="ai-suggestions">
            <h4>🤖 Gợi ý thông minh</h4>
            <ul>
              {role === 'admin' && (
                <>
                  <li>💡 Có 3 đơn nghỉ phép cần duyệt gấp trong hôm nay</li>
                  <li>📊 Nên xem xét phân công lại task cho dự án "HRM Mobile"</li>
                  <li>⚡ 2 nhân viên có KPI thấp cần được hỗ trợ</li>
                </>
              )}
              {role === 'manager' && (
                <>
                  <li>💡 Team của bạn đang làm rất tốt, hãy khen ngợi họ!</li>
                  <li>📋 Có 2 task sắp hết hạn trong 2 ngày tới</li>
                  <li>👥 Nguyễn Văn A đã làm việc overtime 3 ngày liên tiếp</li>
                </>
              )}
              {role === 'employee' && (
                <>
                  <li>💡 Bạn có 3 task cần hoàn thành trong tuần này</li>
                  <li>⏰ Thời điểm tốt để đăng ký nghỉ phép: tuần sau ít việc</li>
                  <li>🎯 Tập trung vào task "Review code" để tăng KPI</li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
