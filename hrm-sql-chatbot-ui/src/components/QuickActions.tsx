import './QuickActions.css';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  question: string;
  color: string;
}

// Action Bot - Các hành động mở form
interface ActionButton {
  id: string;
  icon: string;
  label: string;
  actionType: 'leave-request';
  color: string;
}

interface QuickActionsProps {
  role: string;
  onActionClick: (question: string) => void;
  onActionButtonClick?: (actionType: string) => void;
}

export default function QuickActions({ role, onActionClick, onActionButtonClick }: QuickActionsProps) {
  
  // === ACTION BUTTONS (Tuần 2 - Action Bot) ===
  
  // Đăng ký nghỉ phép - cho Employee và Manager
  const leaveRequestAction: ActionButton = {
    id: 'action-leave-request',
    icon: '📝',
    label: 'Đăng ký nghỉ phép',
    actionType: 'leave-request',
    color: '#8b5cf6'
  };

  // Lấy action buttons theo role
  const getActionButtons = (): ActionButton[] => {
    switch (role) {
      case 'admin':
        return [];
      case 'manager':
        return [];
      case 'employee':
        return [];
      default:
        return [];
    }
  };

  const actionButtons = getActionButtons();
  
  // Actions cho tất cả roles
  const commonActions: QuickAction[] = [
    {
      id: 'checkin',
      icon: '⏰',
      label: 'Chấm công',
      question: 'Hôm nay tôi check-in lúc mấy giờ?',
      color: '#22c55e'
    },
    {
      id: 'leave',
      icon: '🏖️',
      label: 'Ngày phép',
      question: 'Tôi còn bao nhiêu ngày phép?',
      color: '#3b82f6'
    },
    {
      id: 'tasks',
      icon: '📋',
      label: 'Việc của tôi',
      question: 'Liệt kê công việc tôi cần làm',
      color: '#f59e0b'
    },
    {
      id: 'salary',
      icon: '💰',
      label: 'Lương',
      question: 'Lương tháng này của tôi là bao nhiêu?',
      color: '#10b981'
    }
  ];

  // Actions cho Manager
  const managerActions: QuickAction[] = [
    {
      id: 'team-attendance',
      icon: '👥',
      label: 'Phòng ban',
      question: 'Hôm nay ai trong phòng đi muộn?',
      color: '#8b5cf6'
    },
    {
      id: 'team-leave',
      icon: '📅',
      label: 'Nghỉ phép',
      question: 'Ai đang nghỉ phép hôm nay?',
      color: '#ec4899'
    },
    {
      id: 'overdue',
      icon: '⚠️',
      label: 'Trễ hạn',
      question: 'Công việc nào đang trễ hạn?',
      color: '#ef4444'
    },
    {
      id: 'projects',
      icon: '📁',
      label: 'Dự án',
      question: 'Tiến độ các dự án phòng tôi đang làm?',
      color: '#06b6d4'
    }
  ];

  // Actions cho Admin
  const adminActions: QuickAction[] = [
    {
      id: 'company-attendance',
      icon: '🏢',
      label: 'Toàn công ty',
      question: 'Thống kê chấm công toàn công ty hôm nay',
      color: '#8b5cf6'
    },
    {
      id: 'dept-stats',
      icon: '📊',
      label: 'Theo phòng',
      question: 'Thống kê nhân viên theo phòng ban',
      color: '#ec4899'
    },
    {
      id: 'all-projects',
      icon: '📁',
      label: 'Dự án',
      question: 'Liệt kê tất cả dự án đang chạy',
      color: '#06b6d4'
    },
    {
      id: 'overdue-all',
      icon: '⚠️',
      label: 'Trễ hạn',
      question: 'Có bao nhiêu công việc đang trễ hạn?',
      color: '#ef4444'
    },
    {
      id: 'report',
      icon: '📄',
      label: 'Báo cáo',
      question: 'Xuất báo cáo nhân sự tháng này ra Word',
      color: '#22c55e'
    }
  ];

  // Chọn actions theo role
  const getActions = () => {
    switch (role) {
      case 'admin':
        return [...commonActions.slice(0, 2), ...adminActions];
      case 'manager':
        return [...commonActions.slice(0, 2), ...managerActions];
      default:
        return commonActions;
    }
  };

  const actions = getActions();

  return (
    <div className="quick-actions-container">
      {/* === ACTION BUTTONS (Tuần 2) === */}
      {actionButtons.length > 0 && (
        <>
          <div className="quick-actions-header">
            <span className="quick-icon">🚀</span>
            <span className="quick-title">Hành động</span>
          </div>
          <div className="action-buttons-grid">
            {actionButtons.map((action) => (
              <button
                key={action.id}
                className="action-btn primary"
                onClick={() => onActionButtonClick?.(action.actionType)}
                style={{ '--action-color': action.color } as React.CSSProperties}
              >
                <span className="action-icon">{action.icon}</span>
                <span className="action-label">{action.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
