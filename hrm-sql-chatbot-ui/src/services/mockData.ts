// Mock Data Service - Dùng khi API server không khả dụng
// Bật/tắt mock mode tại đây
export const MOCK_MODE = false;  // 🔴 Tắt để chạy với dữ liệu thực từ API

// ===== MOCK USER DATA =====
export const MOCK_USERS = [
  {
    id: 1,
    ho_ten: 'Nguyễn Văn An',
    email: 'an.nguyen@icss.com.vn',
    so_dien_thoai: '0901234567',
    vai_tro: 'Admin',
    chuc_vu: 'Giám đốc',
    phong_ban_id: null,
    role: 'admin'
  },
  {
    id: 2,
    ho_ten: 'Trần Thị Bình',
    email: 'binh.tran@icss.com.vn',
    so_dien_thoai: '0902345678',
    vai_tro: 'Quản lý',
    chuc_vu: 'Trưởng phòng Kỹ thuật',
    phong_ban_id: 1,
    role: 'manager'
  },
  {
    id: 3,
    ho_ten: 'Lê Văn Cường',
    email: 'cuong.le@icss.com.vn',
    so_dien_thoai: '0903456789',
    vai_tro: 'Nhân viên',
    chuc_vu: 'Developer',
    phong_ban_id: 1,
    role: 'employee'
  }
];

// ===== MOCK CHAT RESPONSES =====
const MOCK_RESPONSES: Record<string, string> = {
  'default': '🤖 Xin lỗi, tôi đang ở chế độ Demo. Vui lòng thử các câu hỏi mẫu hoặc khởi động lại backend server.',
  'check-in': `📊 **Thông tin chấm công hôm nay:**

| Trạng thái | Thời gian |
|------------|-----------|
| ✅ Check-in | 08:02:15 |
| 🔲 Check-out | Chưa |

📝 Bạn đã check-in đúng giờ!`,

  'ngày phép': `🏖️ **Thông tin ngày phép năm 2026:**

| Loại | Số ngày |
|------|---------|
| Tổng phép năm | 12 ngày |
| Đã sử dụng | 3 ngày |
| **Còn lại** | **9 ngày** |

💡 Bạn vẫn còn đủ phép cho kỳ nghỉ!`,

  'công việc': `📋 **Danh sách công việc của bạn:**

| # | Tên công việc | Hạn | Ưu tiên |
|---|---------------|-----|---------|
| 1 | Hoàn thành báo cáo tháng 1 | 05/02/2026 | 🔴 Cao |
| 2 | Review code module Auth | 03/02/2026 | 🟡 Trung bình |
| 3 | Họp sprint planning | 02/02/2026 | 🟢 Thấp |

📌 Bạn có **3 công việc** đang thực hiện.`,

  'lương': `💰 **Thông tin lương tháng 1/2026:**

| Khoản mục | Số tiền |
|-----------|---------|
| Lương cơ bản | 15,000,000 ₫ |
| Phụ cấp | 2,000,000 ₫ |
| Khấu trừ | -1,500,000 ₫ |
| **Thực lĩnh** | **15,500,000 ₫** |

📅 Ngày thanh toán: 05/02/2026`,

  'phòng ban': `👥 **Thống kê nhân viên theo phòng ban:**

| Phòng ban | Số NV | Trưởng phòng |
|-----------|-------|--------------|
| Phòng Kỹ thuật | 8 | Trần Thị Bình |
| Phòng Kinh doanh | 6 | Hoàng Văn Em |
| Phòng Nhân sự | 4 | Nguyễn Thị Hoa |
| Phòng Kế toán | 3 | Phạm Văn Đức |

📊 Tổng: **21 nhân viên**`,

  'dự án': `📁 **Danh sách dự án đang triển khai:**

| Dự án | Tiến độ | Lead |
|-------|---------|------|
| HRM System v2.0 | 75% | Trần Thị Bình |
| Mobile App | 40% | Lê Văn Cường |
| Website Redesign | 90% | Nguyễn Văn An |

🚀 **3 dự án** đang hoạt động`,

  'nghỉ phép': `📅 **Nhân viên nghỉ phép hôm nay:**

| Họ tên | Phòng ban | Từ ngày | Đến ngày |
|--------|-----------|---------|----------|
| Phạm Thị Dung | Kinh doanh | 01/02 | 03/02 |

📝 Có **1 nhân viên** đang nghỉ phép.`,

  'muộn': `⏰ **Nhân viên đi muộn hôm nay:**

| Họ tên | Phòng ban | Check-in | Muộn |
|--------|-----------|----------|------|
| Ngô Văn Phú | Kỹ thuật | 08:25 | 25 phút |

⚠️ Có **1 nhân viên** đi muộn.`
};

// ===== MOCK BRIEFING DATA =====
export const getMockBriefing = (role: string) => {
  const baseBriefing = {
    greeting: '☀️ Chào buổi sáng, bạn!',
    checkin_status: {
      checked_in: true,
      check_in_time: '08:02:15',
      check_out_time: null,
      is_late: false,
      status_text: 'Đúng giờ'
    },
    tasks_today: [
      { ten_cong_viec: 'Hoàn thành báo cáo tháng 1', han_hoan_thanh: '2026-02-05', muc_do_uu_tien: 'Cao', trang_thai: 'Đang thực hiện' },
      { ten_cong_viec: 'Review code module Auth', han_hoan_thanh: '2026-02-03', muc_do_uu_tien: 'Trung bình', trang_thai: 'Đang thực hiện' }
    ],
    leave_balance: {
      tong_ngay_phep: 12,
      ngay_phep_da_dung: 3,
      ngay_phep_con_lai: 9
    },
    alerts: []
  };

  if (role === 'manager') {
    return {
      ...baseBriefing,
      team_summary: {
        total_employees: 8,
        checked_in: 6,
        on_leave: 1,
        not_checked_in: 1
      },
      alerts: [
        { type: 'warning', message: 'Có 2 công việc đang trễ hạn trong phòng' },
        { type: 'info', message: '1 nhân viên chưa check-in hôm nay' }
      ]
    };
  }

  if (role === 'admin') {
    return {
      ...baseBriefing,
      company_summary: {
        total_employees: 21,
        checked_in_today: 18,
        active_projects: 3,
        overdue_tasks: 5
      },
      alerts: [
        { type: 'warning', message: 'Có 5 công việc đang trễ hạn trong công ty' }
      ]
    };
  }

  return baseBriefing;
};

// ===== MOCK LEAVE REQUESTS =====
export const MOCK_LEAVE_REQUESTS = [
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
];

// ===== MOCK EMPLOYEES =====
export const MOCK_EMPLOYEES = [
  { id: 3, ho_ten: 'Lê Văn Cường', phong_ban: 'Phòng Kỹ thuật', chuc_vu: 'Developer' },
  { id: 4, ho_ten: 'Phạm Thị Dung', phong_ban: 'Phòng Kinh doanh', chuc_vu: 'Sales' },
  { id: 5, ho_ten: 'Hoàng Văn Em', phong_ban: 'Phòng Kinh doanh', chuc_vu: 'Trưởng phòng' },
  { id: 6, ho_ten: 'Ngô Thị Phương', phong_ban: 'Phòng Kỹ thuật', chuc_vu: 'Tester' },
  { id: 7, ho_ten: 'Vũ Văn Giang', phong_ban: 'Phòng Kỹ thuật', chuc_vu: 'Designer' }
];

// ===== MOCK PROJECTS =====
export const MOCK_PROJECTS = [
  { id: 1, ten_du_an: 'HRM System v2.0', trang_thai: 'Đang thực hiện' },
  { id: 2, ten_du_an: 'Mobile App', trang_thai: 'Đang thực hiện' },
  { id: 3, ten_du_an: 'Website Redesign', trang_thai: 'Đang thực hiện' }
];

// ===== MOCK CHAT FUNCTION =====
export const getMockChatResponse = (question: string, _role?: string): { answer: string; download_url?: string } => {
  const q = question.toLowerCase();
  
  // Tìm response phù hợp
  for (const [key, response] of Object.entries(MOCK_RESPONSES)) {
    if (q.includes(key)) {
      return { answer: response };
    }
  }
  
  // Keywords matching
  if (q.includes('check') || q.includes('chấm công') || q.includes('giờ vào')) {
    return { answer: MOCK_RESPONSES['check-in'] };
  }
  if (q.includes('phép') || q.includes('nghỉ') && q.includes('còn')) {
    return { answer: MOCK_RESPONSES['ngày phép'] };
  }
  if (q.includes('việc') || q.includes('task') || q.includes('làm')) {
    return { answer: MOCK_RESPONSES['công việc'] };
  }
  if (q.includes('lương') || q.includes('tiền')) {
    return { answer: MOCK_RESPONSES['lương'] };
  }
  if (q.includes('phòng') && q.includes('ban')) {
    return { answer: MOCK_RESPONSES['phòng ban'] };
  }
  if (q.includes('dự án') || q.includes('project')) {
    return { answer: MOCK_RESPONSES['dự án'] };
  }
  if (q.includes('nghỉ') || q.includes('vắng')) {
    return { answer: MOCK_RESPONSES['nghỉ phép'] };
  }
  if (q.includes('muộn') || q.includes('trễ')) {
    return { answer: MOCK_RESPONSES['muộn'] };
  }
  
  return { answer: MOCK_RESPONSES['default'] };
};

// ===== MOCK LOGIN =====
// Tài khoản demo: admin/123456, manager/123456, employee/123456
export const mockLogin = (username: string, password: string) => {
  const usernameMap: Record<string, number> = {
    'admin': 0,      // Nguyễn Văn An - Admin
    'manager': 1,    // Trần Thị Bình - Manager  
    'employee': 2,   // Lê Văn Cường - Employee
    'nhanvien': 2,
    'quanly': 1,
  };
  
  // Check by simple username first
  const userIndex = usernameMap[username.toLowerCase()];
  if (userIndex !== undefined) {
    return { 
      success: true, 
      user: MOCK_USERS[userIndex], 
      message: `Đăng nhập thành công (Demo Mode) - ${MOCK_USERS[userIndex].vai_tro}` 
    };
  }

  // Check by name, email or phone
  const user = MOCK_USERS.find(u => 
    u.ho_ten.toLowerCase().includes(username.toLowerCase()) ||
    u.email.toLowerCase() === username.toLowerCase() ||
    u.so_dien_thoai === username
  );
  
  if (user) {
    return { success: true, user, message: 'Đăng nhập thành công (Demo Mode)' };
  }
  
  // Default to employee for demo
  return { 
    success: true, 
    user: MOCK_USERS[2], 
    message: 'Đăng nhập Demo Mode - Mặc định là Nhân viên' 
  };
};
