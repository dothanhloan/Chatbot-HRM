import { useState, useEffect } from 'react';
import { MOCK_MODE } from '../services/mockData';
import './OKRTracking.css';

interface KeyResult {
  id: number;
  title: string;
  target: number;
  current: number;
  unit: string;
  status: 'on-track' | 'at-risk' | 'behind';
}

interface Objective {
  id: number;
  title: string;
  quarter: string;
  progress: number;
  keyResults: KeyResult[];
  owner: string;
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
}

interface KPIMetric {
  id: number;
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  category: 'performance' | 'attendance' | 'quality' | 'growth';
}

interface OKRTrackingProps {
  userId: number;
  role: string;
  onClose: () => void;
}

// Mock OKR data
const getMockObjectives = (role: string): Objective[] => {
  const companyOKRs: Objective[] = [
    {
      id: 1,
      title: 'Nâng cao chất lượng sản phẩm',
      quarter: 'Q1/2026',
      progress: 75,
      status: 'on-track',
      owner: 'Tech Team',
      keyResults: [
        { id: 1, title: 'Bug rate < 5%', target: 5, current: 4.2, unit: '%', status: 'on-track' },
        { id: 2, title: 'Test coverage > 80%', target: 80, current: 82, unit: '%', status: 'on-track' },
        { id: 3, title: 'Deploy time < 30 phút', target: 30, current: 45, unit: 'phút', status: 'at-risk' }
      ]
    },
    {
      id: 2,
      title: 'Tăng hiệu suất team',
      quarter: 'Q1/2026',
      progress: 68,
      status: 'at-risk',
      owner: 'All Teams',
      keyResults: [
        { id: 4, title: 'Sprint velocity +20%', target: 20, current: 14, unit: '%', status: 'at-risk' },
        { id: 5, title: 'Meeting time -30%', target: 30, current: 28, unit: '%', status: 'on-track' },
        { id: 6, title: 'Task completion rate > 90%', target: 90, current: 85, unit: '%', status: 'at-risk' }
      ]
    },
    {
      id: 3,
      title: 'Phát triển năng lực nhân sự',
      quarter: 'Q1/2026',
      progress: 55,
      status: 'behind',
      owner: 'HR Team',
      keyResults: [
        { id: 7, title: 'Training hours/người >= 20h', target: 20, current: 12, unit: 'giờ', status: 'behind' },
        { id: 8, title: 'Tỷ lệ promote nội bộ > 30%', target: 30, current: 25, unit: '%', status: 'at-risk' },
        { id: 9, title: 'Employee satisfaction > 4.0', target: 4.0, current: 3.8, unit: '/5', status: 'at-risk' }
      ]
    }
  ];

  const personalOKRs: Objective[] = [
    {
      id: 10,
      title: 'Hoàn thành dự án HRM Chatbot',
      quarter: 'Q1/2026',
      progress: 80,
      status: 'on-track',
      owner: 'Bạn',
      keyResults: [
        { id: 10, title: 'Hoàn thành 100% features', target: 100, current: 85, unit: '%', status: 'on-track' },
        { id: 11, title: 'Code review đạt > 95%', target: 95, current: 98, unit: '%', status: 'on-track' },
        { id: 12, title: 'Zero critical bugs', target: 0, current: 0, unit: 'bugs', status: 'on-track' }
      ]
    },
    {
      id: 11,
      title: 'Phát triển kỹ năng cá nhân',
      quarter: 'Q1/2026',
      progress: 60,
      status: 'at-risk',
      owner: 'Bạn',
      keyResults: [
        { id: 13, title: 'Hoàn thành 2 khóa học', target: 2, current: 1, unit: 'khóa', status: 'at-risk' },
        { id: 14, title: 'Mentoring 2 junior', target: 2, current: 2, unit: 'người', status: 'on-track' }
      ]
    }
  ];

  if (role === 'admin') {
    return [...companyOKRs, ...personalOKRs];
  }
  if (role === 'manager') {
    return [companyOKRs[0], companyOKRs[1], ...personalOKRs];
  }
  return personalOKRs;
};

const getMockKPIs = (role: string): KPIMetric[] => {
  const personalKPIs: KPIMetric[] = [
    { id: 1, name: 'Task hoàn thành', value: 87, target: 90, trend: 'up', trendValue: 5, category: 'performance' },
    { id: 2, name: 'Đúng deadline', value: 92, target: 95, trend: 'stable', trendValue: 0, category: 'performance' },
    { id: 3, name: 'Đi làm đúng giờ', value: 95, target: 100, trend: 'up', trendValue: 3, category: 'attendance' },
    { id: 4, name: 'Code quality', value: 88, target: 85, trend: 'up', trendValue: 8, category: 'quality' },
  ];

  const teamKPIs: KPIMetric[] = [
    { id: 5, name: 'Team velocity', value: 78, target: 80, trend: 'up', trendValue: 12, category: 'performance' },
    { id: 6, name: 'Tỷ lệ đi làm', value: 92, target: 95, trend: 'down', trendValue: 3, category: 'attendance' },
    { id: 7, name: 'Sprint completion', value: 85, target: 90, trend: 'stable', trendValue: 0, category: 'performance' },
    { id: 8, name: 'Customer satisfaction', value: 4.2, target: 4.5, trend: 'up', trendValue: 0.3, category: 'quality' },
  ];

  if (role === 'admin' || role === 'manager') {
    return [...personalKPIs, ...teamKPIs];
  }
  return personalKPIs;
};

export default function OKRTracking({ userId, role, onClose }: OKRTrackingProps) {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [kpis, setKPIs] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'okr' | 'kpi'>('okr');
  const [expandedOKR, setExpandedOKR] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [userId, role]);

  const fetchData = async () => {
    if (MOCK_MODE) {
      setTimeout(() => {
        setObjectives(getMockObjectives(role));
        setKPIs(getMockKPIs(role));
        setLoading(false);
      }, 400);
      return;
    }

    setObjectives(getMockObjectives(role));
    setKPIs(getMockKPIs(role));
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
      case 'completed': return '#2ed573';
      case 'at-risk': return '#ffa502';
      case 'behind': return '#ff4757';
      default: return '#888';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on-track': return '🟢 Đúng tiến độ';
      case 'at-risk': return '🟡 Có rủi ro';
      case 'behind': return '🔴 Chậm tiến độ';
      case 'completed': return '✅ Hoàn thành';
      default: return status;
    }
  };

  const getTrendIcon = (trend: string, value: number) => {
    if (trend === 'up') return <span className="trend up">↑ {value}%</span>;
    if (trend === 'down') return <span className="trend down">↓ {value}%</span>;
    return <span className="trend stable">→ 0%</span>;
  };

  const calculateOverallProgress = () => {
    if (objectives.length === 0) return 0;
    return Math.round(objectives.reduce((sum, obj) => sum + obj.progress, 0) / objectives.length);
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="okr-modal loading" onClick={e => e.stopPropagation()}>
          <div className="loading-spinner large"></div>
          <p>Đang tải OKR & KPI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="okr-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="okr-header">
          <h2>🎯 OKR & KPI Tracking</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="okr-tabs">
          <button 
            className={`tab ${activeTab === 'okr' ? 'active' : ''}`}
            onClick={() => setActiveTab('okr')}
          >
            🎯 OKRs
          </button>
          <button 
            className={`tab ${activeTab === 'kpi' ? 'active' : ''}`}
            onClick={() => setActiveTab('kpi')}
          >
            📊 KPIs
          </button>
        </div>

        {/* OKR Tab */}
        {activeTab === 'okr' && (
          <div className="okr-content">
            {/* Overall Progress */}
            <div className="overall-progress">
              <div className="progress-ring">
                <svg viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#333"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${calculateOverallProgress() * 3.14} 314`}
                    transform="rotate(-90 60 60)"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="progress-text">
                  <span className="progress-value">{calculateOverallProgress()}%</span>
                  <span className="progress-label">Overall</span>
                </div>
              </div>
              <div className="progress-summary">
                <h3>Q1/2026 Progress</h3>
                <p>{objectives.length} Objectives | {objectives.reduce((sum, o) => sum + o.keyResults.length, 0)} Key Results</p>
                <div className="status-summary">
                  <span className="status-item on-track">
                    🟢 {objectives.filter(o => o.status === 'on-track').length}
                  </span>
                  <span className="status-item at-risk">
                    🟡 {objectives.filter(o => o.status === 'at-risk').length}
                  </span>
                  <span className="status-item behind">
                    🔴 {objectives.filter(o => o.status === 'behind').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Objectives List */}
            <div className="objectives-list">
              {objectives.map(objective => (
                <div 
                  key={objective.id} 
                  className={`objective-card ${expandedOKR === objective.id ? 'expanded' : ''}`}
                >
                  <div 
                    className="objective-header"
                    onClick={() => setExpandedOKR(expandedOKR === objective.id ? null : objective.id)}
                  >
                    <div className="objective-info">
                      <h4>{objective.title}</h4>
                      <span className="objective-owner">👤 {objective.owner}</span>
                    </div>
                    <div className="objective-meta">
                      <span 
                        className="status-badge"
                        style={{ background: getStatusColor(objective.status) }}
                      >
                        {getStatusLabel(objective.status)}
                      </span>
                      <div className="objective-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${objective.progress}%`,
                              background: getStatusColor(objective.status)
                            }}
                          ></div>
                        </div>
                        <span className="progress-percent">{objective.progress}%</span>
                      </div>
                      <span className="expand-icon">{expandedOKR === objective.id ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Key Results */}
                  {expandedOKR === objective.id && (
                    <div className="key-results">
                      {objective.keyResults.map(kr => (
                        <div key={kr.id} className="kr-item">
                          <div className="kr-info">
                            <span 
                              className="kr-status"
                              style={{ color: getStatusColor(kr.status) }}
                            >
                              {kr.status === 'on-track' ? '✅' : kr.status === 'at-risk' ? '⚠️' : '❌'}
                            </span>
                            <span className="kr-title">{kr.title}</span>
                          </div>
                          <div className="kr-progress">
                            <span className="kr-current">{kr.current}</span>
                            <span className="kr-separator">/</span>
                            <span className="kr-target">{kr.target} {kr.unit}</span>
                            <div className="kr-bar">
                              <div 
                                className="kr-fill"
                                style={{ 
                                  width: `${Math.min((kr.current / kr.target) * 100, 100)}%`,
                                  background: getStatusColor(kr.status)
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Tab */}
        {activeTab === 'kpi' && (
          <div className="kpi-content">
            <div className="kpi-grid">
              {kpis.map(kpi => (
                <div key={kpi.id} className={`kpi-card ${kpi.category}`}>
                  <div className="kpi-header">
                    <span className="kpi-name">{kpi.name}</span>
                    {getTrendIcon(kpi.trend, kpi.trendValue)}
                  </div>
                  <div className="kpi-value-row">
                    <span className="kpi-value">{kpi.value}</span>
                    <span className="kpi-target">/ {kpi.target}</span>
                  </div>
                  <div className="kpi-bar">
                    <div 
                      className="kpi-fill"
                      style={{ 
                        width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%`,
                        background: kpi.value >= kpi.target ? '#2ed573' : 
                                   kpi.value >= kpi.target * 0.8 ? '#ffa502' : '#ff4757'
                      }}
                    ></div>
                  </div>
                  <div className="kpi-footer">
                    <span className={`kpi-status ${kpi.value >= kpi.target ? 'good' : 'pending'}`}>
                      {kpi.value >= kpi.target ? '✅ Đạt' : '⏳ Đang theo dõi'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* KPI Summary */}
            <div className="kpi-summary">
              <h4>📈 Tổng quan KPI</h4>
              <div className="summary-stats">
                <div className="summary-item">
                  <span className="summary-value">{kpis.filter(k => k.value >= k.target).length}</span>
                  <span className="summary-label">Đạt mục tiêu</span>
                </div>
                <div className="summary-item">
                  <span className="summary-value">{kpis.filter(k => k.value < k.target).length}</span>
                  <span className="summary-label">Cần cải thiện</span>
                </div>
                <div className="summary-item">
                  <span className="summary-value">{kpis.filter(k => k.trend === 'up').length}</span>
                  <span className="summary-label">Xu hướng tăng</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="okr-footer">
          <button className="footer-btn">📝 Cập nhật OKR</button>
          <button className="footer-btn">📊 Xuất báo cáo</button>
          <button className="footer-btn primary">💬 Thảo luận</button>
        </div>
      </div>
    </div>
  );
}
