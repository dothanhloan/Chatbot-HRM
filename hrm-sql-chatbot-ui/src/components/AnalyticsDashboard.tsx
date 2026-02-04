import { useState, useEffect } from 'react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import './AnalyticsDashboard.css';

// Định nghĩa các interface cho dữ liệu mới
interface AnalyticsStats {
  total_employees?: number;
  checked_in_today?: number;
  total_tasks?: number;
  completed_tasks?: number;
  overdue_tasks?: number;
  active_projects?: number;
}

interface TopEmployee {
  ho_ten: string;
  ten_phong: string;
  completed_tasks: number;
}

interface EmployeeWorkload {
  ho_ten: string;
  ten_phong: string;
  active_tasks: number;
}

interface ProjectHealth {
  ten_du_an: string;
  trang_thai_duan: string;
  ngay_ket_thuc: string;
  health_status: 'Completed' | 'Overdue' | 'At Risk' | 'On Track';
}

interface DepartmentStat {
  ten_phong: string;
  number_of_employees: number;
  total_tasks: number;
  completed_tasks: number;
}

interface HourlyData {
  hour: string;
  count: number;
}

// Interface cho toàn bộ dữ liệu analytics
interface AnalyticsData {
  stats: AnalyticsStats;
  task_completion_rate: number;
  top_employees: TopEmployee[];
  employee_workload: EmployeeWorkload[];
  project_health: ProjectHealth[];
  department_stats: DepartmentStat[];
  hourlyData: HourlyData[];
}

interface AnalyticsDashboardProps {
  role: string;
  userId?: number;
  deptId?: number;
  onClose: () => void;
}

const getProjectStatusColor = (status: 'Completed' | 'Overdue' | 'At Risk' | 'On Track') => {
  switch (status) {
    case 'Completed': return '#2ed573'; // Green
    case 'On Track': return '#54a0ff'; // Blue
    case 'At Risk': return '#ffa502'; // Orange
    case 'Overdue': return '#ff4757'; // Red
    default: return '#888';
  }
};

const getProjectStatusText = (status: 'Completed' | 'Overdue' | 'At Risk' | 'On Track') => {
  switch (status) {
    case 'Completed': return 'Hoàn thành';
    case 'On Track': return 'Đúng tiến độ';
    case 'At Risk': return 'Có rủi ro';
    case 'Overdue': return 'Quá hạn';
    default: return '';
  }
};

export default function AnalyticsDashboard({ role, userId, deptId, onClose }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      if (isLive) {
        fetchData();
        setLastUpdate(new Date());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isLive, role, userId, deptId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';
      
      // Hiện tại chỉ có admin analytics được nâng cấp
      const url = role === 'admin' 
        ? `${API_BASE}/admin/analytics`
        : `${API_BASE}/manager/analytics?user_id=${userId}&dept_id=${deptId}`;
      
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const result = await response.json();
      
      setData(result);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Fallback to mock data or show error state if needed
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!data) return;

    const { stats, task_completion_rate, top_employees, employee_workload, project_health, department_stats } = data;

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "BÁO CÁO PHÂN TÍCH NHÂN SỰ",
                            bold: true,
                            size: 36,
                        }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`,
                            size: 22,
                            italics: true,
                        }),
                    ],
                }),
                new Paragraph({ text: "" }), // Spacer

                // --- General Stats ---
                new Paragraph({ children: [new TextRun({ text: "THỐNG KÊ TỔNG QUAN", bold: true, size: 28 })] }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Tổng nhân viên")] }),
                                new TableCell({ children: [new Paragraph(String(stats.total_employees || 0))] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Check-in hôm nay")] }),
                                new TableCell({ children: [new Paragraph(String(stats.checked_in_today || 0))] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Tổng task")] }),
                                new TableCell({ children: [new Paragraph(String(stats.total_tasks || 0))] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Task hoàn thành")] }),
                                new TableCell({ children: [new Paragraph(String(stats.completed_tasks || 0))] }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Task quá hạn")] }),
                                new TableCell({ children: [new Paragraph(String(stats.overdue_tasks || 0))] }),
                            ],
                        }),
                         new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Dự án đang chạy")] }),
                                new TableCell({ children: [new Paragraph(String(stats.active_projects || 0))] }),
                            ],
                        }),
                         new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph("Tỉ lệ hoàn thành task (%)")] }),
                                new TableCell({ children: [new Paragraph(`${task_completion_rate}%`)] }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({ text: "" }), // Spacer

                // --- Top Employees ---
                new Paragraph({ children: [new TextRun({ text: "TOP 5 NHÂN VIÊN XUẤT SẮC", bold: true, size: 28 })] }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nhân viên", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Phòng ban", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tasks Hoàn thành", bold: true })] })] }),
                            ],
                        }),
                        ...top_employees.map(emp => new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph(emp.ho_ten)] }),
                                new TableCell({ children: [new Paragraph(emp.ten_phong)] }),
                                new TableCell({ children: [new Paragraph(String(emp.completed_tasks))] }),
                            ],
                        })),
                    ],
                }),
                new Paragraph({ text: "" }),

                // --- Department Stats ---
                new Paragraph({ children: [new TextRun({ text: "THỐNG KÊ PHÒNG BAN", bold: true, size: 28 })] }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Phòng ban", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nhân viên", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tổng Tasks", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Hoàn thành", bold: true })] })] }),
                            ],
                        }),
                        ...department_stats.map(d => new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph(d.ten_phong)] }),
                                new TableCell({ children: [new Paragraph(String(d.number_of_employees))] }),
                                new TableCell({ children: [new Paragraph(String(d.total_tasks))] }),
                                new TableCell({ children: [new Paragraph(String(d.completed_tasks))] }),
                            ],
                        })),
                    ],
                }),
                new Paragraph({ text: "" }),

                // --- Project Health ---
                new Paragraph({ children: [new TextRun({ text: "TÌNH TRẠNG DỰ ÁN", bold: true, size: 28 })] }),
                 new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Dự án", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Hạn cuối", bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tình trạng", bold: true })] })] }),
                            ],
                        }),
                        ...project_health.map(p => new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph(p.ten_du_an)] }),
                                new TableCell({ children: [new Paragraph(new Date(p.ngay_ket_thuc).toLocaleDateString('vi-VN'))] }),
                                new TableCell({ children: [new Paragraph(getProjectStatusText(p.health_status))] }),
                            ],
                        })),
                    ],
                }),
                new Paragraph({ text: "" }),

            ],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `HR_Analytics_Report_${new Date().toISOString().slice(0, 10)}.docx`);
    });
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="dashboard-modal loading" onClick={e => e.stopPropagation()}>
          <div className="loading-spinner large"></div>
          <p>Đang tải dữ liệu phân tích...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
       <div className="modal-overlay" onClick={onClose}>
        <div className="dashboard-modal loading" onClick={e => e.stopPropagation()}>
          <p>Không có dữ liệu để hiển thị.</p>
        </div>
      </div>
    )
  }

  const { stats, task_completion_rate, top_employees, employee_workload, project_health, department_stats } = data;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="dashboard-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <h2>📊 HR Analytics Dashboard</h2>
            <div className="live-indicator">
              <span className={`live-dot ${isLive ? 'active' : ''}`}></span>
              <span>{isLive ? 'LIVE' : 'PAUSED'}</span>
              <button className="live-toggle" onClick={() => setIsLive(!isLive)}>
                {isLive ? '⏸️' : '▶️'}
              </button>
            </div>
          </div>
          <div className="header-right">
            <span className="last-update">
              Cập nhật: {lastUpdate.toLocaleTimeString('vi-VN')}
            </span>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <span className="stat-value">{stats?.total_employees || 0}</span>
              <span className="stat-label">Tổng nhân viên</span>
            </div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <span className="stat-value">{stats?.total_tasks || 0}</span>
              <span className="stat-label">Tổng Task</span>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">⚠️</div>
            <div className="stat-info">
              <span className="stat-value">{stats?.overdue_tasks || 0}</span>
              <span className="stat-label">Task quá hạn</span>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">🚀</div>
            <div className="stat-info">
              <span className="stat-value">{stats?.active_projects || 0}</span>
              <span className="stat-label">Dự án đang chạy</span>
            </div>
          </div>
        </div>

        {/* New Analytics Grid */}
        <div className="analytics-grid">
            {/* Task Completion Rate */}
            <div className="analytics-card">
                <div className="card-header">
                    <h3>Tỉ Lệ Hoàn Thành Task 📊</h3>
                    <span className="value">{task_completion_rate}%</span>
                </div>
                <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${task_completion_rate}%` }}>
                        {task_completion_rate}%
                    </div>
                </div>
            </div>

            {/* Project Health */}
            <div className="analytics-card">
                <div className="card-header">
                    <h3>Projects Health Status 🎯</h3>
                </div>
                <div className="project-health-list">
                    {project_health?.slice(0, 4).map((p, i) => (
                        <div key={i} className="project-health-item">
                            <span className="health-status-dot" style={{ backgroundColor: getProjectStatusColor(p.health_status) }}></span>
                            <div className="project-info">
                                <span className="name">{p.ten_du_an}</span>
                                <span className="date">Hạn: {new Date(p.ngay_ket_thuc).toLocaleDateString('vi-VN')}
                                    {p.trang_thai_duan !== 'Đang chạy' && ` - ${p.trang_thai_duan}`}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top 5 Performers */}
            <div className="analytics-card wide-card">
                <div className="card-header">
                    <h3>Top 5 Nhân Viên Xuất Sắc 🏆</h3>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="rank">#</th>
                            <th>Nhân viên</th>
                            <th className="task-count">Tasks Hoàn thành</th>
                        </tr>
                    </thead>
                    <tbody>
                        {top_employees?.map((emp, i) => (
                            <tr key={i}>
                                <td className="rank">{i + 1}</td>
                                <td>
                                    <div className="employee-info">
                                        <span className="name">{emp.ho_ten}</span>
                                        <span className="department">{emp.ten_phong}</span>
                                    </div>
                                </td>
                                <td className="task-count">{emp.completed_tasks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Workload Per Employee */}
            <div className="analytics-card wide-card">
                <div className="card-header">
                    <h3>Workload Per Employee 👥</h3>
                </div>
                <table className="data-table">
                     <thead>
                        <tr>
                            <th>Nhân viên</th>
                            <th className="task-count">Tasks đang làm</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employee_workload?.slice(0, 5).map((emp, i) => (
                            <tr key={i}>
                                <td>
                                    <div className="employee-info">
                                        <span className="name">{emp.ho_ten}</span>
                                        <span className="department">{emp.ten_phong}</span>
                                    </div>
                                </td>
                                <td className="task-count">{emp.active_tasks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

             {/* Department Statistics */}
            <div className="analytics-card full-width-card">
                <div className="card-header">
                    <h3>Department Statistics 📈</h3>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Phòng ban</th>
                            <th className="employee-count">Nhân viên</th>
                            <th className="task-count">Tổng Tasks</th>
                            <th className="task-count">Hoàn thành</th>
                        </tr>
                    </thead>
                    <tbody>
                        {department_stats?.map((dept, i) => (
                            <tr key={i}>
                                <td>
                                    <div className="employee-info">
                                        <span className="name">{dept.ten_phong}</span>
                                    </div>
                                </td>
                                <td className="employee-count">{dept.number_of_employees}</td>
                                <td className="task-count">{dept.total_tasks}</td>
                                <td className="task-count">{dept.completed_tasks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Quick Actions */}
        {role === 'admin' && (
          <div className="dashboard-actions">
            <button className="action-btn-dash" onClick={handleExportReport}>📥 Xuất báo cáo</button>
          </div>
        )}
      </div>
    </div>
  );
}
