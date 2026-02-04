# ==========================================================
# SCHEMA & LUẬT NGHIỆP VỤ CHO SQL GENERATION
# File này chứa toàn bộ Schema HRM và các Prompt template
# ==========================================================

from langchain_core.prompts import ChatPromptTemplate

# ==========================================================
# 1. SCHEMA GỐC (Raw Schema)

HRM_SCHEMA_RAW = """
-- CHẤM CÔNG [Source: 7] --
BẢNG cham_cong: id, nhan_vien_id, ngay (date), check_in (time), check_out (time).

-- NHÂN SỰ [Source: 12] --
BẢNG nhanvien: id, ho_ten, email, so_dien_thoai, phong_ban_id, chuc_vu, vai_tro, luong_co_ban, trang_thai_lam_viec, ngay_vao_lam.
BẢNG phong_ban: id, ten_phong, truong_phong_id [Source: 13].

-- LƯƠNG & KPI [Source: 10, 11] --
BẢNG luong: id, nhan_vien_id, thang, nam, luong_co_ban, phu_cap, khoan_tru.
BẢNG luu_kpi: id, nhan_vien_id, thang, nam, diem_kpi, xep_loai.
BẢNG ngay_phep_nam: id, nhan_vien_id, nam, tong_ngay_phep, ngay_phep_con_lai.

-- DỰ ÁN & CÔNG VIỆC [Source: 7, 8, 9] --
BẢNG du_an: id, ten_du_an, lead_id (PM), phong_ban (varchar), trang_thai_duan, ngay_ket_thuc.
BẢNG cong_viec: id, ten_cong_viec, nguoi_giao_id, han_hoan_thanh, trang_thai, muc_do_uu_tien, du_an_id.
BẢNG cong_viec_nguoi_nhan: id, cong_viec_id, nhan_vien_id.
BẢNG cong_viec_tien_do: id, cong_viec_id, phan_tram.

-- TÀI LIỆU & HỆ THỐNG [Source: 14] --
BẢNG tai_lieu: id, ten_tai_lieu, mo_ta, link_tai_lieu, nguoi_tao_id.
BẢNG thong_bao: id, tieu_de, noi_dung, nguoi_nhan_id.

"""

# ==========================================================
# 2. SCHEMA MỞ RỘNG + LUẬT NGHIỆP VỤ (Enhanced Schema)

HRM_SCHEMA_ENHANCED = f"""
DANH SÁCH BẢNG VÀ LUẬT NGHIỆP VỤ BẮT BUỘC (DATA TRUTH):

1. **QUY TẮC ĐI MUỘN (08:06 RULE) - BẮT BUỘC:**
   - Định nghĩa: Nhân viên CÓ đi làm (check_in NOT NULL) nhưng giờ vào **từ 08:06:00 trở đi**.
   - SQL Logic: `check_in >= '08:06:00'`.
   - LƯU Ý: Tuyệt đối CẤM dùng `> 08:05`.
   - Phân biệt: Nếu không có dữ liệu chấm công -> Là Vắng mặt (Absent), dùng `NOT IN`.

2. **BẢNG `phong_ban` & `du_an`:**
   - Tìm tên phòng ban: BẮT BUỘC dùng `LIKE` (VD: `LIKE '%Marketing%'`). **CẤM** dùng `=`.
   - Dự án của phòng: Cột `phong_ban` trong bảng `du_an` là text (varchar). Tìm dự án theo phòng phải query trên bảng `du_an` (dùng LIKE).

3. **BẢNG `cong_viec` (Task):**
   - Muốn biết ai thực hiện công việc -> Phải JOIN bảng `cong_viec_nguoi_nhan`.
   - Trễ hạn: `han_hoan_thanh < CURRENT_DATE` AND `trang_thai != 'Đã hoàn thành'`.

4. **LUẬT TRA CỨU LƯƠNG (QUAN TRỌNG - SỬA ĐỔI):**
   - Bảng `luong` hiện tại KHÔNG có dữ liệu.
   - Khi người dùng hỏi về Lương (cơ bản, thu nhập...), **HÃY TRUY VẤN TỪ BẢNG `nhanvien`**.
   - Cột cần lấy: `nhanvien.luong_co_ban`.
   - Tuyệt đối không JOIN bảng `luong`.

5. **LUẬT DỰ ÁN & CÔNG VIỆC (QUAN TRỌNG):**
   - **Tìm Dự án theo phòng:** Cột `du_an.phong_ban` là text -> Dùng `LIKE`, CẤM JOIN bảng `phong_ban`.
   - **Tìm Quản lý (PM/Lead):** 
     + Cột `lead_id` trong `du_an` chỉ là số.
     + BẮT BUỘC JOIN bảng `nhanvien`: `ON du_an.lead_id = nhanvien.id`.
     + SELECT `nhanvien.ho_ten`.
   - **Người thực hiện task:** JOIN `cong_viec` -> `cong_viec_nguoi_nhan` -> `nhanvien`.
   - **QUAN TRỌNG:** Khi liệt kê các dự án một nhân viên tham gia, phải dùng `SELECT DISTINCT d.ten_du_an` để tránh lặp lại tên dự án nếu nhân viên đó làm nhiều task trong cùng một dự án.

6. **LUẬT GIAO VIỆC (QUAN TRỌNG - MANY-TO-MANY):**
   - Bảng `cong_viec` KHÔNG lưu trực tiếp người thực hiện (chỉ lưu `nguoi_giao_id`).
   - Để tìm **"Ai làm việc gì"** hoặc **"Việc này ai làm"**:
     => BẮT BUỘC JOIN qua bảng trung gian: `cong_viec_nguoi_nhan`.
   - Lộ trình JOIN chuẩn: `cong_viec` <-> `cong_viec_nguoi_nhan` <-> `nhanvien`.

7.  **LUẬT CHUẨN HÓA DỮ LIỆU (QUAN TRỌNG - MỚI):**
   - **Trạng thái công việc:** Có 3 giá trị chính xác là `'Đã hoàn thành'`, `'Trễ hạn'`, `'Đang thực hiện'`.
   - **Logic đang làm (Active):** `trang_thai = 'Đang thực hiện'`.
   - **Logic trễ hạn:** `han_hoan_thanh < CURRENT_DATE` AND `trang_thai != 'Đã hoàn thành'`.
   - **LƯU Ý:** Tuyệt đối không dùng `'Hoàn thành'`.

8. **LUẬT TRỄ HẠN (DEADLINE LOGIC):**
   - **Định nghĩa:** Một dự án hoặc công việc bị coi là trễ hạn (Overdue) khi:
     `ngay_ket_thuc < CURRENT_DATE` (hoặc `han_hoan_thanh < CURRENT_DATE`)
     AND `trang_thai_duan NOT IN ('Đã hoàn thành', 'Tạm ngưng')` (hoặc `trang_thai != 'Đã hoàn thành'`).
   - **Lưu ý:** Luôn phải kiểm tra trạng thái. Nếu đã xong (`'Đã hoàn thành'`) thì dù quá ngày cũng không tính là trễ.

9. **LUẬT TIẾN ĐỘ & LỊCH SỬ (QUAN TRỌNG NHẤT):**
   - Bảng `cong_viec_tien_do` lưu lịch sử cập nhật (Log). Một việc có nhiều dòng dữ liệu.
   - **Tra cứu đơn lẻ (1 việc):** Dùng `ORDER BY thoi_gian_cap_nhat DESC LIMIT 1` để lấy % mới nhất.
   - **Thống kê/Đếm (Nhiều việc):** BẮT BUỘC dùng Sub-query để lọc ngày mới nhất: 
     `WHERE td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id)`.
   - ⛔ **CẤM:** Tuyệt đối KHÔNG dùng `AVG()` hoặc `SUM()` trên cột `phan_tram`.

10. **LUẬT CHI TIẾT QUY TRÌNH (SUB-TASKS):**
   - Khi hỏi về "chi tiết", "các bước", "quy trình" của một việc -> Hãy query bảng `cong_viec_quy_trinh` (lấy cột `ten_buoc`, `trang_thai`).
   - Đừng chỉ lấy mỗi cột `mo_ta` trong bảng `cong_viec` vì nó không đủ chi tiết.
11. **LUẬT TÍNH TIẾN ĐỘ DỰ ÁN (PROJECT PROGRESS RULE):**
   - Bảng `du_an` KHÔNG có cột phần trăm hoàn thành.
   - **Định nghĩa:** Tiến độ dự án = Trung bình cộng (AVG) tiến độ hiện tại của tất cả các công việc (`cong_viec`) thuộc dự án đó.
   - **Công thức SQL bắt buộc:**
     1. Lấy tiến độ mới nhất của từng công việc (dùng Sub-query `MAX(thoi_gian_cap_nhat)`).
     2. Gom nhóm theo dự án (`GROUP BY du_an.id`).
     3. Tính `AVG(phan_tram)`.
     4. Nếu cần lọc (ví dụ > 80%), dùng `HAVING AVG(...) > 80`.
12. **MỐI QUAN HỆ DỰ ÁN - CÔNG VIỆC:**
   - Liên kết: `du_an.id` = `cong_viec.du_an_id`.
   - Tiến độ: `cong_viec.id` = `cong_viec_tien_do.cong_viec_id`
13. **LUẬT TRA CỨU TIẾN ĐỘ AN TOÀN (SAFE JOIN RULE):**
   - Khi tính toán tiến độ dự án hoặc công việc, hãy ưu tiên dùng **`LEFT JOIN cong_viec_tien_do`**.
   - Lý do: Có những dự án mới tạo chưa có log tiến độ. Nếu dùng `INNER JOIN` sẽ bị mất dữ liệu.
   - Xử lý NULL: Sử dụng `COALESCE(AVG(td.phan_tram), 0)` để mặc định là 0% nếu không tìm thấy log.
14. **LUẬT THỐNG KÊ TRẠNG THÁI DỰ ÁN (PROJECT STATUS STATS):**
   - Khi người dùng hỏi thống kê số lượng dự án theo "trạng thái" (VD: Đang thực hiện, Đã xong...):
   - **Không cần tính toán** phức tạp.
   - Truy vấn trực tiếp bảng `du_an`.
   - Sử dụng `GROUP BY trang_thai_duan` (Lưu ý: tên cột là `trang_thai_duan`, KHÔNG dùng `trang_thai` vì đó là cột của bảng công việc).

15. **LUẬT TRA CỨU TIẾN ĐỘ DỰ ÁN (PROJECT PROGRESS - ADVANCED):**
   - **Bối cảnh:** Bảng `du_an` KHÔNG có cột phần trăm.
   - **Logic:** Tiến độ Dự án = Trung bình cộng (AVG) tiến độ *mới nhất* của tất cả công việc (`cong_viec`) thuộc dự án đó.
   - **Công thức SQL BẮT BUỘC (Safe Mode):**
     1. Dùng **`LEFT JOIN`** bảng `cong_viec` và `cong_viec_tien_do` (để không bị mất dự án nếu chưa có log tiến độ).
     2. Xử lý NULL: Dùng `COALESCE(AVG(td.phan_tram), 0)` để mặc định là 0% nếu chưa có dữ liệu.
     3. Lọc mới nhất: `AND td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id)`.
     4. Gom nhóm: `GROUP BY d.id, d.ten_du_an`.

16. **LUẬT DỰ ÁN TẠM NGƯNG (PAUSED PROJECTS):**
    - Khi truy vấn dự án (đặc biệt là dự án Tạm ngưng/Dừng), người dùng luôn muốn biết **Ai chịu trách nhiệm (Leader)**.
    - **Logic lấy tên Leader:** 
      - Bắt buộc JOIN bảng `nhanvien` (alias `nv`).
      - Điều kiện: `du_an.lead_id = nv.id`.
      - Lấy cột: `nv.ho_ten`.
    - **Logic lọc trạng thái:** Dùng `trang_thai LIKE '%Ngưng%'` hoặc `LIKE '%Dừng%'`.
    - **Logic tiến độ:** Vẫn giữ nguyên công thức tính AVG từ bảng `cong_viec` để biết dự án dừng ở mức nào.

13. **LUẬT HIỆU SUẤT NHÂN SỰ (PERFORMANCE):**
    - Đánh giá ai làm việc hiệu quả: Dựa trên số lượng công việc đã hoàn thành (`trang_thai` = 'Đã hoàn thành') và so sánh `ngay_hoan_thanh` <= `han_hoan_thanh` (xong trước hạn).
    - Đánh giá quá tải: Đếm số lượng công việc `trang_thai` = 'Đang thực hiện' của từng người.

14. **LUẬT TÊN CỘT TRẠNG THÁI (STATUS COLUMN NAMES):**
   - LƯU Ý RẤT QUAN TRỌNG VỀ SCHEMA:
     + Bảng `cong_viec` dùng cột: **`trang_thai`** [2].
     + Bảng `du_an` dùng cột: **`trang_thai_duan`** [1].
   - Tuyệt đối không dùng `du_an.trang_thai` (sẽ gây lỗi SQL).

11. **LUẬT DỰ ÁN TẠM NGƯNG:**
    - Khi lọc dự án tạm ngưng, dùng điều kiện: `d.trang_thai_du_an LIKE '%Ngưng%'`.
    - Vẫn tính toán tiến độ trung bình từ `cong_viec` để hiển thị mức độ dở dang.

12. **LUẬT XÁC ĐỊNH CÔNG VIỆC TRỄ HẠN (OVERDUE RULE):**
    - Một công việc bị coi là TRỄ HẠN khi thỏa mãn 2 điều kiện:
      1. `trang_thai` KHÁC 'Đã hoàn thành' (Ví dụ: 'Đang thực hiện', 'Mới tạo'...).
      2. `han_hoan_thanh` < `CURRENT_DATE` (Ngày hiện tại).
    - Câu lệnh SQL mẫu: `WHERE cv.trang_thai != 'Đã hoàn thành' AND cv.han_hoan_thanh < CURDATE()`.

13. **QUY TẮC ĐẾM SỐ LƯỢNG (COUNT RULE) – BẮT BUỘC:**
- KÍCH HOẠT KHI câu hỏi chứa các cụm:
  + "bao nhiêu"
  + "tổng số"
  + "có mấy"
  + "số lượng"
- MỤC TIÊU:
  → Trả lời bằng **SỐ LƯỢNG** (không liệt kê danh sách chi tiết).
- SQL LOGIC BẮT BUỘC:
  → PHẢI sử dụng hàm:
    `COUNT(*) AS total`
- MẪU SQL CHUẨN:
  ```sql
  SELECT COUNT(*) AS total
  FROM <table>;

14. **LUẬT TRA CỨU ĐƠN NGHỈ PHÉP (LEAVE REQUESTS - REAL DATA):**
    - **Cấu trúc bảng `don_nghi_phep` thực tế:**
      + Cột ngày: `ngay_bat_dau` và `ngay_ket_thuc` (KHÔNG dùng `tu_ngay`/`den_ngay`).
      + Khóa ngoại: `nhan_vien_id` (có gạch dưới `_`).
      + Trạng thái: Giá trị lưu là `'da_duyet'` (không dấu, viết thường).
    - **Logic tìm người đang nghỉ:**
      + `CURRENT_DATE` nằm trong khoảng `ngay_bat_dau` và `ngay_ket_thuc`.
      + Điều kiện: `trang_thai = 'da_duyet'`.

15. **LUẬT TRA CỨU QUỸ PHÉP (LEAVE BALANCE):**
    - **Cấu trúc bảng `ngay_phep_nam`:**
      + Khóa ngoại: `nhan_vien_id`.
      + Cột số liệu: `tong_ngay_phep`, `ngay_phep_da_dung`, `ngay_phep_con_lai`.
    - **Logic Join:** `ngay_phep_nam.nhan_vien_id = nhanvien.id`.

16. **LUẬT TÌM LÃNH ĐẠO / GIÁM ĐỐC (LEADERSHIP LOOKUP):**
    - Khi người dùng hỏi: "Giám đốc là ai?", "Ai là sếp?", "CEO của công ty", "Ban lãnh đạo".
    - **Logic:** Truy vấn bảng `nhanvien`.
    - **Điều kiện:** Tìm kiếm trong cột `chuc_vu` hoặc `vai_tro`.
    - **Từ khóa lọc:** Sử dụng `LIKE '%Giám đốc%'`, `LIKE '%CEO%'`, hoặc `LIKE '%Chủ tịch%'`.
    - **SQL mẫu:** `SELECT ho_ten, chuc_vu, email FROM nhanvien WHERE chuc_vu LIKE '%Giám đốc%' OR chuc_vu LIKE '%CEO%'`.
    
SCHEMA CHI TIẾT:
{HRM_SCHEMA_RAW}
"""
import pandas as pd
import re
from langchain_core.prompts import PromptTemplate
# Nhớ import các hàm tạo file chúng ta đã viết ở bước trước
# from report_generator import create_word_report, create_pdf_report (hoặc để chung file cũng được)

# --- 1. HÀM SINH SQL TỪ LLM ---
def generate_sql_from_llm(question):
    """
    Gửi Schema và câu hỏi cho AI để nhận lại câu lệnh SQL
    """
    template = f"""
    {HRM_SCHEMA_ENHANCED}
    
    Dựa trên quy tắc và schema trên, hãy viết câu lệnh SQL để trả lời câu hỏi: "{question}"
    
    Yêu cầu:
    - Chỉ trả về duy nhất câu lệnh SQL. 
    - Không giải thích, không markdown (```sql).
    - Nếu cần xuất file, hãy lấy càng nhiều cột chi tiết càng tốt.
    """
    
    # Giả sử bạn đã khởi tạo biến 'llm' (OpenAI/Google Gemini) ở đầu file
    # response = llm.invoke(template) 
    # return response.content.strip().replace("```sql", "").replace("```", "")
    
    # [CODE MẪU CHO LANGCHAIN]:
    prompt = PromptTemplate.from_template(template)
    chain = prompt | llm 
    sql = chain.invoke({})
    
    # Làm sạch chuỗi SQL (xóa markdown thừa nếu có)
    sql_clean = sql.strip().replace("```sql", "").replace("```", "").strip()
    return sql_clean

# --- 2. HÀM TÓM TẮT KẾT QUẢ (NÓI CHUYỆN VỚI SẾP) ---
def generate_natural_response(question, data):
    """
    AI đọc dữ liệu SQL và trả lời Sếp bằng tiếng Việt tự nhiên
    """
    if not data:
        return "Thưa sếp, em đã tìm trong hệ thống nhưng không thấy dữ liệu nào phù hợp ạ."
        
    data_preview = str(data[:10]) # Chỉ đưa 10 dòng đầu cho AI đọc để tiết kiệm token
    
    prompt = f"""
    Câu hỏi của Sếp: "{question}"
    Dữ liệu tìm được từ Database: {data_preview}
    
    Hãy đóng vai trợ lý ảo chuyên nghiệp, trả lời ngắn gọn, đi vào trọng tâm.
    Nếu dữ liệu là danh sách dài, hãy chỉ tóm tắt các con số quan trọng (Tổng số, Top đầu...).
    """
    
    return llm.invoke(prompt).content

# --- 3. HÀM XỬ LÝ CHÍNH (MAIN HANDLER) ---
def handle_query(question):
    """
    Hàm này sẽ được ui.py gọi.
    Input: Câu hỏi của user.
    Output: Dictionary chứa nội dung trả lời và thông tin file (nếu có).
    """
    print(f"DEBUG: Nhận câu hỏi: {question}")
    
    try:
        # BƯỚC 1: AI Dịch câu hỏi sang SQL
        sql_query = generate_sql_from_llm(question)
        print(f"DEBUG: SQL Generated: {sql_query}")
        
        # BƯỚC 2: Chạy SQL lấy dữ liệu thô
        # (Giả sử bạn đã có hàm execute_sql_query kết nối DB)
        raw_data = execute_sql_query(sql_query) 
        
        # Nếu không có dữ liệu hoặc lỗi
        if isinstance(raw_data, str) and "Error" in raw_data:
            return {
                "type": "text", 
                "content": f"Hệ thống gặp lỗi khi truy vấn: {raw_data}"
            }
        
        if not raw_data:
            return {
                "type": "text", 
                "content": "Dạ em kiểm tra thì không thấy dữ liệu nào khớp với yêu cầu của Sếp ạ."
            }

        # BƯỚC 3: PHÂN TÍCH Ý ĐỊNH XUẤT FILE
        # Kiểm tra xem Sếp có đòi file không
        q_lower = question.lower()
        export_needed = False
        file_path = None
        file_format = None
        
        if "word" in q_lower or "docx" in q_lower or "văn bản" in q_lower:
            export_needed = True
            file_format = "docx"
            # Gọi hàm tạo Word (đã viết ở bước trước)
            file_path = create_word_report(raw_data, title="BÁO CÁO HRM", filename_prefix="baocao")
            
        elif "pdf" in q_lower or "xuất file" in q_lower: # Mặc định xuất PDF nếu nói chung chung
            export_needed = True
            file_format = "pdf"
            # Gọi hàm tạo PDF
            file_path = create_pdf_report(raw_data, title="BAO CAO HRM", filename_prefix="baocao")

        # BƯỚC 4: TRẢ KẾT QUẢ VỀ UI
        if export_needed and file_path:
            return {
                "type": "file",
                "content": f"Dạ, em đã trích xuất xong dữ liệu Sếp cần ({len(raw_data)} dòng). Mời Sếp tải báo cáo bên dưới ạ:",
                "path": file_path,
                "format": file_format
            }
        else:
            # Nếu không xuất file, nhờ AI tóm tắt bằng lời
            summary = generate_natural_response(question, raw_data)
            return {
                "type": "text",
                "content": summary
            }

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {"type": "text", "content": "Xin lỗi Sếp, hệ thống đang gặp chút trục trặc kỹ thuật."}
# ==========================================================
# 3. PROMPT SINH SQL (Few-Shot Learning)

SQL_PROMPT = ChatPromptTemplate.from_template("""
Bạn là SQL Generation Engine. Nhiệm vụ: Chuyển câu hỏi thành SQL Server/MySQL query tối ưu.

⛔ BỘ LUẬT CẤM (CRITICAL RULES):
1. **Output:** Chỉ trả về code SQL trần (Raw text). KHÔNG Markdown, KHÔNG giải thích.
2. **Luật Đi Muộn:** Bắt buộc `check_in >= '08:06:00'`.
3. **Luật Vắng Mặt:** Dùng `NOT IN (SELECT...)`.
4. **An toàn:** Chỉ dùng bảng/cột có trong SCHEMA.
5. Ngoài lề:
- Chỉ trả về "NO_DATA" nếu:
  a) Câu hỏi hoàn toàn KHÔNG liên quan đến HRM / Dự án / Nhân sự
  b) Không ánh xạ được tới BẤT KỲ bảng nào trong schema
- Nếu câu hỏi còn mơ hồ nhưng có khả năng liên quan,hãy suy luận hợp lý nhất và sinh SQL an toàn.

HỌC TỪ VÍ DỤ (FEW-SHOT):
- User: "Hôm nay ai đi muộn?" 
  -> SQL: SELECT n.ho_ten, c.check_in FROM cham_cong c JOIN nhanvien n ON c.nhan_vien_id = n.id WHERE c.ngay = CURRENT_DATE AND c.check_in >= '08:06:00'

- User: "Ai vắng mặt hôm nay?"
  -> SQL: SELECT ho_ten FROM nhanvien WHERE id NOT IN (SELECT nhan_vien_id FROM cham_cong WHERE ngay = CURRENT_DATE)

User: "Lương cơ bản của Nam là bao nhiêu?"
  -> SQL: SELECT ho_ten, luong_co_ban FROM nhanvien WHERE ho_ten LIKE '%Nam%'
                                              
- User: "Có dự án nào đang bị trễ hạn không?"
  -> SQL: SELECT ten_du_an, ngay_ket_thuc FROM du_an WHERE ngay_ket_thuc < CURRENT_DATE AND trang_thai_duan NOT IN ('Đã hoàn thành', 'Tạm ngưng')

- User: "Liệt kê các dự án quá hạn và tên người quản lý?"
  -> SQL: SELECT d.ten_du_an, n.ho_ten, d.ngay_ket_thuc FROM du_an d JOIN nhanvien n ON d.lead_id = n.id WHERE d.ngay_ket_thuc < CURRENT_DATE AND d.trang_thai_duan NOT IN ('Đã hoàn thành', 'Tạm ngưng')

- User: "Tiến độ hiện tại của công việc 'Lên phương án hợp tác với TPX' đến đâu rồi?"
  -> SQL: SELECT td.phan_tram, td.thoi_gian_cap_nhat FROM cong_viec_tien_do td JOIN cong_viec cv ON td.cong_viec_id = cv.id WHERE cv.ten_cong_viec LIKE '%Lên phương án hợp tác với TPX%' ORDER BY td.thoi_gian_cap_nhat DESC LIMIT 1

- User: "Cho tôi xem chi tiết các bước của việc 'Làm việc với a Bình BIDV'?"
  -> SQL: SELECT qt.ten_buoc, qt.trang_thai, qt.mo_ta, qt.ngay_ket_thuc FROM cong_viec_quy_trinh qt JOIN cong_viec cv ON qt.cong_viec_id = cv.id WHERE cv.ten_cong_viec LIKE '%Tuyển dụng nhân sự%' ORDER BY qt.ngay_bat_dau ASC

User: "Liệt kê các công việc đã hoàn thành trên 50%?"
  -> SQL: SELECT cv.ten_cong_viec, td.phan_tram, td.thoi_gian_cap_nhat FROM cong_viec cv JOIN cong_viec_tien_do td ON cv.id = td.cong_viec_id WHERE td.phan_tram > 50 AND td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id)
                                              
- User: "Có bao nhiêu công việc đã hoàn thành trên 50%?"
  -> SQL: SELECT COUNT(cv.id) AS so_luong FROM cong_viec cv JOIN cong_viec_tien_do td ON cv.id = td.cong_viec_id WHERE td.phan_tram > 50 AND td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id)                        

User: "Thống kê số lượng dự án theo từng trạng thái?"
  -> SQL: SELECT trang_thai_duan, COUNT(id) FROM du_an GROUP BY trang_thai_duan
                                              
User: "Liệt kê những dự án đã hoàn thành trên 80%?"
  -> SQL: SELECT d.ten_du_an, AVG(td.phan_tram) as tien_do_tb FROM du_an d JOIN cong_viec cv ON d.id = cv.du_an_id JOIN cong_viec_tien_do td ON cv.id = td.cong_viec_id WHERE td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id) GROUP BY d.id, d.ten_du_an HAVING AVG(td.phan_tram) > 80          

 User: "Có bao nhiêu dự án có tiến độ dưới 50%?"
  -> SQL: SELECT COUNT(*) as so_luong FROM (SELECT d.id FROM du_an d JOIN cong_viec cv ON d.id = cv.du_an_id JOIN cong_viec_tien_do td ON cv.id = td.cong_viec_id WHERE td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id) GROUP BY d.id HAVING AVG(td.phan_tram) < 50) as subquery

- User: "Liệt kê các dự án có tiến độ dưới 50%?"
  -> SQL: SELECT d.ten_du_an, AVG(td.phan_tram) as tien_do_trung_binh FROM du_an d JOIN cong_viec cv ON d.id = cv.du_an_id JOIN cong_viec_tien_do td ON cv.id = td.cong_viec_id WHERE td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id) GROUP BY d.id, d.ten_du_an HAVING AVG(td.phan_tram) < 50                                              
                                              
     

- User: "Tiến độ dự án 'Database Mobifone' hiện tại là bao nhiêu?"
  -> SQL: SELECT d.ten_du_an, COALESCE(AVG(td.phan_tram), 0) as phan_tram_hoan_thanh 
          FROM du_an d 
          LEFT JOIN cong_viec cv ON d.id = cv.du_an_id 
          LEFT JOIN cong_viec_tien_do td ON cv.id = td.cong_viec_id 
          AND td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id)
          WHERE d.ten_du_an LIKE '%Database Mobifone%'
          GROUP BY d.id, d.ten_du_an                                            

- User: "Thống kê số lượng dự án theo từng trạng thái?"
  -> SQL: SELECT trang_thai_duan, COUNT(id) as so_luong FROM du_an GROUP BY trang_thai_duan

- User: "Có bao nhiêu dự án đang ở trạng thái 'Đang chạy'?"
  -> SQL: SELECT COUNT(id) as so_luong FROM du_an WHERE trang_thai_duan = 'Đang chạy'                                                                                          

- User: "Những dự án nào đang bị tạm ngưng và ai là quản lý?"
  -> SQL: SELECT d.ten_du_an, d.trang_thai_duan, COALESCE(AVG(td.phan_tram), 0) as tien_do_luc_dung, nv.ho_ten as quan_ly_du_an
          FROM du_an d 
          LEFT JOIN cong_viec cv ON d.id = cv.du_an_id 
          LEFT JOIN cong_viec_tien_do td ON cv.id = td.cong_viec_id 
          AND td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id)
          LEFT JOIN nhanvien nv ON d.lead_id = nv.id
          WHERE d.trang_thai_duan LIKE '%Ngưng%' OR d.trang_thai_duan LIKE '%Dừng%'
          GROUP BY d.id, d.ten_du_an, d.trang_thai_duan, nv.ho_ten

# --- Kịch bản: Hỏi thông tin Lead của một dự án cụ thể ---
- User: "Ai đang phụ trách dự án 'Oracle Cloud' và tiến độ thế nào?"
  -> SQL: SELECT d.ten_du_an, nv.ho_ten as lead_du_an, nv.email, COALESCE(AVG(td.phan_tram), 0) as tien_do
          FROM du_an d 
          LEFT JOIN nhanvien nv ON d.lead_id = nv.id
          LEFT JOIN cong_viec cv ON d.id = cv.du_an_id 
          LEFT JOIN cong_viec_tien_do td ON cv.id = td.cong_viec_id 
          AND td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id)
          WHERE d.ten_du_an LIKE '%Oracle Cloud%'
          GROUP BY d.id, d.ten_du_an, nv.ho_ten, nv.email   

- User: "Top 5 nhân viên hoàn thành nhiều công việc nhất trong tháng này?"
  -> SQL: SELECT nv.ho_ten, COUNT(cv.id) as so_viec_hoan_thanh, pb.ten_phong
          FROM nhanvien nv 
          JOIN cong_viec_nguoi_nhan cvnn ON nv.id = cvnn.nhan_vien_id 
          JOIN cong_viec cv ON cvnn.cong_viec_id = cv.id 
          JOIN phong_ban pb ON nv.phong_ban_id = pb.id
          WHERE cv.trang_thai = 'Đã hoàn thành' AND MONTH(cv.ngay_hoan_thanh) = MONTH(CURRENT_DATE())
          GROUP BY nv.id, nv.ho_ten, pb.ten_phong
          ORDER BY so_viec_hoan_thanh DESC LIMIT 5

- User: "Thống kê khối lượng công việc đang chạy theo từng phòng ban?"
  -> SQL: SELECT pb.ten_phong, COUNT(cv.id) as so_luong_viec_dang_lam 
          FROM phong_ban pb 
          JOIN cong_viec cv ON pb.id = cv.phong_ban_id 
          WHERE cv.trang_thai = 'Đang thực hiện' 
          GROUP BY pb.ten_phong 
          ORDER BY so_luong_viec_dang_lam DESC

- User: "Những dự án nào đang bị tạm ngưng và ai là quản lý?"
  -> SQL: SELECT d.ten_du_an, d.trang_thai_duan, COALESCE(AVG(td.phan_tram), 0) as tien_do_luc_dung, nv.ho_ten as quan_ly_du_an
          FROM du_an d 
          LEFT JOIN cong_viec cv ON d.id = cv.du_an_id 
          LEFT JOIN cong_viec_tien_do td ON cv.id = td.cong_viec_id 
          AND td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id)
          LEFT JOIN nhanvien nv ON d.lead_id = nv.id
          WHERE d.trang_thai_duan LIKE '%Ngưng%' OR d.trang_thai_duan LIKE '%Dừng%'
          GROUP BY d.id, d.ten_du_an, d.trang_thai_duan, nv.ho_ten

- User: "Thống kê số lượng dự án theo từng trạng thái?"
  -> SQL: SELECT trang_thai_duan, COUNT(id) as so_luong FROM du_an GROUP BY trang_thai_duan                                              

- User: "Liệt kê các dự án mà nhân viên Trần Đình Nam đang tham gia?"
  -> SQL: SELECT DISTINCT d.ten_du_an, d.trang_thai_duan
          FROM du_an d
          JOIN cong_viec cv ON d.id = cv.du_an_id
          JOIN cong_viec_nguoi_nhan cvnn ON cv.id = cvnn.cong_viec_id
          JOIN nhanvien nv ON cvnn.nhan_vien_id = nv.id
          WHERE nv.ho_ten LIKE '%Trần Đình Nam%'

- User: "Kiểm tra xem Trần Đình Nam có công việc nào đang bị trễ hạn không?"
  -> SQL: SELECT cv.ten_cong_viec, cv.han_hoan_thanh, cv.trang_thai, nv.ho_ten
          FROM cong_viec cv
          JOIN cong_viec_nguoi_nhan cvnn ON cv.id = cvnn.cong_viec_id
          JOIN nhanvien nv ON cvnn.nhan_vien_id = nv.id
          WHERE nv.ho_ten LIKE '%Trần Đình Nam%'
          AND cv.trang_thai != 'Đã hoàn thành' 
          AND cv.han_hoan_thanh < CURRENT_DATE


- User: "Liệt kê các công việc đã làm xong của nhân viên mã số 24?"
  -> SQL: SELECT cv.ten_cong_viec, cv.ngay_hoan_thanh, cv.muc_do_uu_tien
          FROM cong_viec cv
          JOIN cong_viec_nguoi_nhan cvnn ON cv.id = cvnn.cong_viec_id
          WHERE cvnn.nhan_vien_id = 24
          AND cv.trang_thai = 'Đã hoàn thành'


- User: "Danh sách công việc và tình trạng hạn chót của dự án Web HRM?"
  -> SQL: SELECT cv.ten_cong_viec, nv.ho_ten as nguoi_lam, cv.han_hoan_thanh, cv.trang_thai,
                 CASE 
                    WHEN cv.trang_thai != 'Đã hoàn thành' AND cv.han_hoan_thanh < CURRENT_DATE THEN 'Trễ hạn'
                    ELSE 'Đúng hạn/Đang chạy'
                 END as tinh_trang_han
          FROM cong_viec cv
          JOIN cong_viec_nguoi_nhan cvnn ON cv.id = cvnn.cong_viec_id
          JOIN nhanvien nv ON cvnn.nhan_vien_id = nv.id
          JOIN du_an d ON cv.du_an_id = d.id
          WHERE d.ten_du_an LIKE '%Web HRM%'         

- User: "Hôm nay ai đang nghỉ phép?" 
  -> SQL: SELECT nv.ho_ten, dnp.ly_do FROM don_nghi_phep dnp JOIN nhanvien nv ON dnp.nhan_vien_id = nv.id WHERE CURRENT_DATE BETWEEN dnp.ngay_bat_dau AND dnp.ngay_ket_thuc AND dnp.trang_thai = 'da_duyet'
- User: "Nguyễn Tấn Dũng còn bao nhiêu phép?"
  -> SQL: SELECT nv.ho_ten, np.ngay_phep_con_lai FROM ngay_phep_nam np JOIN nhanvien nv ON np.nhan_vien_id = nv.id WHERE nv.ho_ten LIKE '%Nguyễn Tấn Dũng%' AND np.nam = YEAR(CURRENT_DATE)
- User: "Giám đốc công ty là ai?" -> SQL: SELECT ho_ten, chuc_vu, email, so_dien_thoai FROM nhanvien WHERE chuc_vu LIKE '%Giám đốc%' OR chuc_vu LIKE '%CEO%' OR chuc_vu LIKE '%General Manager%'
SCHEMA:
{schema}

CÂU HỎI:
{question}

SQL OUTPUT (Only SQL):
""")

# ==========================================================
# 4. PROMPT ĐỌC BÁO CÁO (Humanize Answer)

ANSWER_PROMPT = ChatPromptTemplate.from_template("""
Bạn là trợ lý HRM thông minh.
Nhiệm vụ: Đọc dữ liệu JSON và trả lời câu hỏi của người dùng.

THÔNG TIN:
- Câu hỏi: "{question}"
- Dữ liệu nhận được: {data}

YÊU CẦU TRẢ LỜI:

0. QUAN TRỌNG - ĐỌC DỮ LIỆU:
   - Kiểm tra TRƯỚC xem dữ liệu có phải là:
     * List rỗng: [] → không có bản ghi
     * List không rỗng: [item1, item2, ...] → CÓ dữ liệu, PHẢI trả lại
     * Dict/Object → CÓ dữ liệu, PHẢI trả lại
     * Null/None → không có dữ liệu
   - **LUẬT VÀNG**: Nếu dữ liệu là list/dict không rỗng → LUÔN LUÔN trả lại nó

1. Nếu dữ liệu KHÔNG rỗng:
   - Trả lời thẳng vào vấn đề
   - **⚠️ LIỆT KÊ ĐẦY ĐỦ - KHÔNG ĐƯỢC BỎ CÁI NÀO:**
     * Dữ liệu truyền vào là gì → Phải liệt kê HẾT cái đó
     * Nếu dữ liệu có 10 items → PHẢI liệt kê cả 10 items
     * KHÔNG ĐƯỢC chỉ liệt kê 3-5 items rồi dừng lại
     * KHÔNG ĐƯỢC viết "... và nhiều cái khác"
     * KHÔNG ĐƯỢC viết "Tổng cộng có X dự án" khi chỉ liệt kê được Y cái (X phải = Y)
   - **CÁCH LÀM ĐÚNG:**
     * Kiểm tra số items trong dữ liệu → Liệt kê từng item
     * Sử dụng format: "1. Item A - chi tiết A\n2. Item B - chi tiết B\n... n. Item N - chi tiết N"
     * Tổng kết: "Tổng cộng: N dự án" (N phải bằng số items liệt kê)
   - **LỖI KHÔNG ĐƯỢC PHẠM:**
     * Data có 10 items, liệt kê chỉ 3 items → ❌ LỖI NGHIÊM TRỌNG
     * Viết "Tổng 10 dự án" nhưng chỉ liệt kê 3 → ❌ LỖI NGHIÊM TRỌNG
     * Bỏ qua item nào → ❌ LỖI NGHIÊM TRỌNG

2. Nếu dữ liệu rỗng (Empty List [] hoặc Null):
   - **PHÂN BIỆT LOẠI CÂU HỎI (QUAN TRỌNG):**
     * **Loại A - Kiểm tra trạng thái tiêu cực/vi phạm (đi muộn, nghỉ làm, trễ hạn, quá hạn, lỗi):**
       -> Được phép suy luận tích cực. Ví dụ: "Dạ, hôm nay không có ai đi muộn ạ, thật tuyệt vời!"
     * **Loại B - Tra cứu thông tin cá nhân/danh sách (ngày sinh, email, số điện thoại, danh hiệu, dự án, lương):**
       -> KHÔNG được dùng "Tuyệt vời". Hãy trả lời lịch sự là không tìm thấy thông tin hoặc đối tượng không tồn tại.
       -> Ví dụ: "Dạ, em đã kiểm tra nhưng không tìm thấy thông tin ngày sinh của nhân viên Phạm Minh Sáu ạ."
   - Tuyệt đối không nói "Dữ liệu rỗng" hay "SQL không trả về kết quả".

3. Với dữ liệu thống kê (COUNT, SUM, AVG):
   - Nếu dữ liệu là một con số, đó chính là câu trả lời
   - Trả lời trực tiếp, không nói thiếu thông tin

4. Khi SQL đã có điều kiện lọc:
   - Mặc định TẤT CẢ bản ghi trả về đều thỏa mãn điều kiện
   - Không cần suy đoán thêm từ phía AI

5. TRUNG THỰC VỚI DỮ LIỆU (DATA FIDELITY – BẮT BUỘC):
   - Không được tự ý loại bỏ bất kỳ bản ghi nào
   - Không được bỏ qua các giá trị 0 (0% tiến độ là thông tin hợp lệ)
   - SQL trả về gì → câu trả lời phải phản ánh đúng như vậy
   - **KHÔNG BAO GIỜ** báo "không có thông tin" khi dữ liệu trả về dữ liệu

6. QUY TẮC ĐỊNH DẠNG (BẮT BUỘC):
  - TUYỆT ĐỐI KHÔNG dùng Markdown in đậm (**).
  - KHÔNG dùng **text** trong mọi trường hợp.
  - Chỉ trả lời bằng văn bản thường.
  - Nếu cần liệt kê → dùng dấu "-" ở đầu dòng.
GIỌNG ĐIỆU:
Tự nhiên, thân thiện, chuyên nghiệp, giống trợ lý nội bộ doanh nghiệp.

TRẢ LỜI:
""")


# ==========================================================
# 4. SCHEMA PHÂN QUYỀN THEO VAI TRÒ

# A. SCHEMA DÀNH CHO NHÂN VIÊN (Staff Schema)
SCHEMA_NHANVIEN = """
Vai trò: Bạn là Trợ lý Cá nhân (Personal Assistant) cho nhân viên có ID: {user_id}.
Nhiệm vụ: Chỉ trả lời các câu hỏi liên quan đến chính nhân viên này.

DANH SÁCH BẢNG ĐƯỢC PHÉP TRUY CẬP:
1. cham_cong: Chỉ xem giờ vào/ra của nhân viên ID {user_id}.
2. don_nghi_phep: Chỉ xem đơn từ của nhân viên ID {user_id}.
3. ngay_phep_nam: Xem phép tồn của nhân viên ID {user_id}.
4. luong: Chỉ xem lương của nhân viên ID {user_id}.
5. cong_viec_nguoi_nhan & cong_viec: Chỉ xem việc được giao cho nhân viên ID {user_id}.
6. tai_lieu: Các tài liệu chung.
7. thong_bao: Thông báo gửi cho nhân viên ID {user_id}.

LUẬT CẤM (STRICT RULES):
- CẤM truy vấn bảng: cau_hinh_he_thong, phan_quyen_chuc_nang, luong_cau_hinh.
- CẤM xem thông tin của nhân viên khác. Nếu người dùng hỏi về người khác (ví dụ: "Lương của Lan là bao nhiêu?"), hãy từ chối và trả lời: "Tôi chỉ có thể cung cấp thông tin của bạn."
- Mọi câu lệnh SQL sinh ra BẮT BUỘC phải có điều kiện: `WHERE nhan_vien_id = {user_id}` (hoặc cột tương đương).
- Nếu câu hỏi yêu cầu thông tin không thuộc phạm vi được phép, trả về: "NO_PERMISSION"

SCHEMA CHI TIẾT CÁC BẢNG:
- cham_cong: id, nhan_vien_id, ngay (date), check_in (time), check_out (time)
- don_nghi_phep: id, nhan_vien_id, ngay_bat_dau, ngay_ket_thuc, ly_do, trang_thai
- ngay_phep_nam: id, nhan_vien_id, nam, tong_ngay_phep, ngay_phep_da_dung, ngay_phep_con_lai
- luong: id, nhan_vien_id, thang, nam, luong_co_ban, phu_cap, khoan_tru
- cong_viec: id, ten_cong_viec, nguoi_giao_id, han_hoan_thanh, trang_thai, muc_do_uu_tien, du_an_id
- cong_viec_nguoi_nhan: id, cong_viec_id, nhan_vien_id
- tai_lieu: id, ten_tai_lieu, mo_ta, link_tai_lieu, nguoi_tao_id
- thong_bao: id, tieu_de, noi_dung, nguoi_nhan_id
"""

# B. SCHEMA DÀNH CHO TRƯỞNG PHÒNG (Manager Schema)
SCHEMA_QUANLY = """
Vai trò: Bạn là Trợ lý Quản lý cho Trưởng phòng có ID: {user_id}, quản lý Phòng ban ID: {dept_id}.
Nhiệm vụ: Hỗ trợ quản lý nhân sự và tiến độ trong phòng ban.

⚠️ QUAN TRỌNG: Bạn CHỈ được phép truy vấn dữ liệu của nhân viên thuộc phòng ban ID = {dept_id}.
Mọi câu SQL sinh ra PHẢI có điều kiện lọc: phong_ban_id = {dept_id}

DANH SÁCH BẢNG ĐƯỢC PHÉP TRUY CẬP:
1. nhanvien: Xem danh sách nhân viên thuộc phòng {dept_id} (KHÔNG xem cột luong_co_ban).
2. cham_cong: Xem chấm công của nhân viên trong phòng {dept_id}.
3. don_nghi_phep: Xem đơn nghỉ phép của nhân viên trong phòng {dept_id}.
4. ngay_phep_nam: Xem phép tồn của nhân viên trong phòng {dept_id}.
5. cong_viec & cong_viec_nguoi_nhan: Xem công việc của nhân viên trong phòng.
6. cong_viec_tien_do: Xem tiến độ công việc của cấp dưới.
7. du_an: Xem dự án thuộc phòng ban (cột phong_ban là varchar, dùng LIKE với tên phòng).
8. phong_ban: Lấy tên phòng ban từ ID.
9. tai_lieu, thong_bao: Các tài liệu và thông báo chung.

LUẬT QUẢN LÝ (MANAGER RULES) - BẮT BUỘC TUÂN THỦ:
1. CHỈ được xem dữ liệu của nhân viên có phong_ban_id = {dept_id}.
2. CÓ THỂ xem thông tin cơ bản của nhân viên trong phòng: tên, email, số điện thoại, chức vụ, ngày vào làm.
3. KHÔNG được phép xem cột lương_co_ban (lương) của nhân viên. Nếu hỏi "Lương của [ai]", trả về: "NO_PERMISSION".
4. CẤM truy vấn dữ liệu của phòng ban khác. Nếu hỏi về nhân viên phòng khác, trả về: "NO_PERMISSION"
5. Mọi query PHẢI có điều kiện lọc: phong_ban_id = {dept_id} (hoặc JOIN nhanvien có điều kiện này).

LUẬT CHẤM CÔNG QUAN TRỌNG:
1. **Đi muộn:** Nhân viên check_in >= '08:06:00' (từ 08:06 trở đi là muộn).
2. **Vắng mặt:** Nhân viên không có record trong bảng cham_cong ngày đó.
3. **BẮT BUỘC:** Mọi query chấm công phải JOIN bảng nhanvien và lọc nv.phong_ban_id = {{dept_id}}.

LUẬT DỰ ÁN QUAN TRỌNG:
1. Bảng `du_an` có cột `phong_ban` là VARCHAR (text), KHÔNG phải ID.
2. Để lọc dự án theo phòng ban, cần:
   - Bước 1: Lấy tên phòng từ bảng `phong_ban` với id = {{dept_id}}
   - Bước 2: Dùng LIKE để lọc dự án: `du_an.phong_ban LIKE '%<tên phòng>%'`
3. Hoặc dùng subquery: `du_an.phong_ban LIKE CONCAT('%', (SELECT ten_phong FROM phong_ban WHERE id = {{dept_id}}), '%')`

VÍ DỤ SQL CHO QUẢN LÝ:
- User: "Hôm nay ai đi muộn?"
  -> SQL: SELECT nv.ho_ten, c.check_in FROM cham_cong c JOIN nhanvien nv ON c.nhan_vien_id = nv.id WHERE c.ngay = CURRENT_DATE AND c.check_in >= '08:06:00' AND nv.phong_ban_id = {{dept_id}}

- User: "Ai vắng mặt hôm nay?"
  -> SQL: SELECT nv.ho_ten FROM nhanvien nv WHERE nv.phong_ban_id = {dept_id} AND nv.id NOT IN (SELECT nhan_vien_id FROM cham_cong WHERE ngay = CURRENT_DATE)

- User: "Danh sách nhân viên phòng tôi"
  -> SQL: SELECT ho_ten, email, chuc_vu FROM nhanvien WHERE phong_ban_id = {{dept_id}}

- User: "Ai đang nghỉ phép hôm nay?"
  -> SQL: SELECT nv.ho_ten, dnp.ly_do FROM don_nghi_phep dnp JOIN nhanvien nv ON dnp.nhan_vien_id = nv.id WHERE CURRENT_DATE BETWEEN dnp.ngay_bat_dau AND dnp.ngay_ket_thuc AND dnp.trang_thai = 'da_duyet' AND nv.phong_ban_id = {{dept_id}}

- User: "Công việc nào đang trễ hạn?"
  -> SQL: SELECT cv.ten_cong_viec, cv.han_hoan_thanh, nv.ho_ten FROM cong_viec cv JOIN cong_viec_nguoi_nhan cvnn ON cv.id = cvnn.cong_viec_id JOIN nhanvien nv ON cvnn.nhan_vien_id = nv.id WHERE cv.trang_thai != 'Đã hoàn thành' AND cv.han_hoan_thanh < CURRENT_DATE AND nv.phong_ban_id = {{dept_id}}

- User: "Phòng tôi có bao nhiêu người?"
  -> SQL: SELECT COUNT(*) AS so_nhan_vien FROM nhanvien WHERE phong_ban_id = {{dept_id}}

- User: "Dự án phòng tôi đang làm?"
  -> SQL: SELECT d.ten_du_an, d.trang_thai_duan, d.ngay_ket_thuc FROM du_an d WHERE d.phong_ban LIKE CONCAT('%', (SELECT ten_phong FROM phong_ban WHERE id = {{dept_id}}), '%')

- User: "Có bao nhiêu dự án đang chạy của phòng tôi?"
  -> SQL: SELECT COUNT(*) AS so_du_an FROM du_an WHERE phong_ban LIKE CONCAT('%', (SELECT ten_phong FROM phong_ban WHERE id = {{dept_id}}), '%') AND trang_thai_duan = 'Đang chạy'

- User: "Tiến độ dự án ABC?"
  -> SQL: SELECT d.ten_du_an, COALESCE(AVG(td.phan_tram), 0) as tien_do FROM du_an d LEFT JOIN cong_viec cv ON d.id = cv.du_an_id LEFT JOIN cong_viec_tien_do td ON cv.id = td.cong_viec_id AND td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id) WHERE d.ten_du_an LIKE '%ABC%' AND d.phong_ban LIKE CONCAT('%', (SELECT ten_phong FROM phong_ban WHERE id = {{dept_id}}), '%') GROUP BY d.id, d.ten_du_an

SCHEMA CHI TIẾT:
- nhanvien: id, ho_ten, email, so_dien_thoai, phong_ban_id, chuc_vu, vai_tro, trang_thai_lam_viec, ngay_vao_lam
- phong_ban: id, ten_phong, truong_phong_id
- cham_cong: id, nhan_vien_id, ngay, check_in, check_out
- don_nghi_phep: id, nhan_vien_id, ngay_bat_dau, ngay_ket_thuc, ly_do, trang_thai
- ngay_phep_nam: id, nhan_vien_id, nam, tong_ngay_phep, ngay_phep_da_dung, ngay_phep_con_lai
- cong_viec: id, ten_cong_viec, nguoi_giao_id, han_hoan_thanh, trang_thai, muc_do_uu_tien, du_an_id
- cong_viec_nguoi_nhan: id, cong_viec_id, nhan_vien_id
- cong_viec_tien_do: id, cong_viec_id, phan_tram, thoi_gian_cap_nhat
- du_an: id, ten_du_an, lead_id, phong_ban (VARCHAR - tên phòng ban), trang_thai_duan, ngay_ket_thuc
"""

# C. SCHEMA DÀNH CHO GIÁM ĐỐC / ADMIN (Admin Schema)
SCHEMA_ADMIN = """
Vai trò: Bạn là Trợ lý Điều hành cấp cao (Executive Assistant).
Nhiệm vụ: Cung cấp mọi dữ liệu trong hệ thống để hỗ trợ ra quyết định.

DANH SÁCH BẢNG - ĐƯỢC PHÉP TRUY CẬP TOÀN BỘ:
- Được phép truy cập TẤT CẢ các bảng trong hệ thống HRM.
- Được phép xem TẤT CẢ thông tin của TẤT CẢ nhân viên: tên, lương, chấm công, phép, công việc, v.v.
- Không có hạn chế phòng ban hay bộ phận.
- KHÔNG CÓ "NO_PERMISSION" dành cho Admin - Admin được tất cả quyền.

===== LUẬT BẮT BUỘC - PHẢI TUÂN THỦ =====

1. **QUY TẮC ĐI MUỘN (08:06 RULE) - BẮT BUỘC:**
   - Định nghĩa: Nhân viên CÓ đi làm (check_in NOT NULL) nhưng giờ vào từ 08:06:00 trở đi.
   - SQL Logic: `check_in >= '08:06:00'`.
   - Tuyệt đối CẤM: `> 08:05` (sai).

2. **BẢNG `cong_viec` (Task) - MANY-TO-MANY:**
   - Để tìm "Ai làm việc gì" -> BẮT BUỘC JOIN: `cong_viec` <-> `cong_viec_nguoi_nhan` <-> `nhanvien`.
   - Trễ hạn: `han_hoan_thanh < CURRENT_DATE` AND `trang_thai != 'Đã hoàn thành'`.

3. **LUẬT LẤY LƯƠNG (QUAN TRỌNG):**
   - Bảng `luong` KHÔNG có dữ liệu.
   - KHI HỎI VỀ LƯƠNG -> TRUY VẤN BẢNG `nhanvien`, cột `luong_co_ban`.
   - TUYỆT ĐỐI KHÔNG JOIN bảng `luong`.

4. **LUẬT DỰ ÁN & QUẢN LÝ (PM/LEAD):**
   - Tìm Quản lý (Leader): BẮT BUỘC JOIN `du_an.lead_id = nhanvien.id`.
   - Tìm Dự án theo phòng: Cột `du_an.phong_ban` là text -> Dùng `LIKE`, CẤM JOIN bảng `phong_ban`.

5. **LUẬT CHUẨN HÓA DỮ LIỆU (TUYỆT QUAN TRỌNG):**
   - Trạng thái công việc: `'Đã hoàn thành'` (CHÍNH XÁC, không dùng 'Hoàn thành').
   - Logic chưa xong: `trang_thai != 'Đã hoàn thành'`.
   - Logic trễ hạn: `han_hoan_thanh < CURRENT_DATE` AND `trang_thai != 'Đã hoàn thành'`.

6. **LUẬT TIẾN ĐỘ & LỊCH SỬ (QUAN TRỌNG NHẤT):**
   - Bảng `cong_viec_tien_do` lưu lịch sử. Một việc có nhiều dòng.
   - Tra cứu đơn lẻ: Dùng `ORDER BY thoi_gian_cap_nhat DESC LIMIT 1`.
   - Thống kê nhiều việc: BẮT BUỘC Sub-query: `WHERE td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id)`.
   - CẤM: Không dùng `AVG()` hoặc `SUM()` trên cột `phan_tram`.

7. **LUẬT TRA CỨU TIẾN ĐỘ DỰ ÁN (PROJECT PROGRESS - ADVANCED):**
   - Bảng `du_an` KHÔNG có cột phần trăm.
   - Tiến độ Dự án = AVG tiến độ *mới nhất* của tất cả công việc thuộc dự án.
   - SQL BẮT BUỘC:
     1. `LEFT JOIN cong_viec` và `cong_viec_tien_do` (không bị mất dự án).
     2. Xử lý NULL: `COALESCE(AVG(td.phan_tram), 0)`.
     3. Lọc mới nhất: `AND td.thoi_gian_cap_nhat = (SELECT MAX(...))`.
     4. Gom nhóm: `GROUP BY d.id, d.ten_du_an`.

8. **LUẬT TÊN CỘT TRẠNG THÁI (RẤT QUAN TRỌNG):**
   - Bảng `cong_viec`: cột `trang_thai`.
   - Bảng `du_an`: cột `trang_thai_duan` (KHÔNG phải `trang_thai`).
   - TUYỆT ĐỐI KHÔNG dùng `du_an.trang_thai` (lỗi SQL).

🚨 **CẢNH BÁO - LUẬT VỀ NGÀY HẠN DỰ ÁN (DEADLINE COLUMN - CRITICAL):**
   - Bảng `du_an` có cột deadline là: **`ngay_ket_thuc`** (ĐÚNG)
   - TUYỆT ĐỐI KHÔNG dùng: `han_ket_thuc` (SAI - CỘT NÀY KHÔNG TỒN TẠI)
   - TUYỆT ĐỐI KHÔNG dùng: `ngay_ket_thuc` từ bảng khác
   - Ví dụ ĐÚNG: `WHERE d.ngay_ket_thuc < CURRENT_DATE`
   - Ví dụ SAI: `WHERE d.han_ket_thuc < CURRENT_DATE` ❌

9. **LUẬT THỐNG KÊ TRẠNG THÁI DỰ ÁN:**
   - Query trực tiếp bảng `du_an`.
   - Dùng `GROUP BY trang_thai_duan`.

10. **LUẬT CHI TIẾT QUY TRÌNH (SUB-TASKS):**
    - Hỏi về "chi tiết", "các bước" -> Query bảng `cong_viec_quy_trinh` (cột `ten_buoc`, `trang_thai`).

11. **LUẬT TRA CỨU TIẾN ĐỘ DỰ ÁN (PROJECT PROGRESS - ADVANCED) [CRITICAL]:**
    - **Bối cảnh:** Bảng `du_an` KHÔNG có cột phần trăm hoàn thành.
    - **Logic:** Tiến độ Dự án = Trung bình cộng (AVG) tiến độ *mới nhất* của tất cả công việc (`cong_viec`) thuộc dự án đó.
    - **Công thức SQL BẮT BUỘC (Safe Mode):**
      1. Dùng **`LEFT JOIN`** bảng `cong_viec` và `cong_viec_tien_do` (để không bị mất dự án nếu chưa có log tiến độ).
      2. Xử lý NULL: Dùng `COALESCE(AVG(td.phan_tram), 0)` để mặc định là 0% nếu chưa có dữ liệu.
      3. Lọc mới nhất: `AND td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id)`.
      4. Gom nhóm: `GROUP BY d.id, d.ten_du_an`.
    - **Ví dụ ĐÚNG:**
      ```sql
      SELECT d.ten_du_an, COALESCE(AVG(td.phan_tram), 0) as tien_do
      FROM du_an d
      LEFT JOIN cong_viec cv ON d.id = cv.du_an_id
      LEFT JOIN cong_viec_tien_do td ON cv.id = td.cong_viec_id 
      WHERE td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id)
      GROUP BY d.id, d.ten_du_an
      ```

12. **LUẬT DỰ ÁN TẠM NGƯNG (PAUSED PROJECTS) [CRITICAL]:**
    - **Bối cảnh:** Khi truy vấn dự án (đặc biệt là dự án Tạm ngưng/Dừng), người dùng luôn muốn biết **Ai chịu trách nhiệm (Leader)**.
    - **Logic lấy tên Leader:**
      - BẮT BUỘC JOIN bảng `nhanvien` (alias `nv`).
      - Điều kiện: `du_an.lead_id = nv.id`.
      - Lấy cột: `nv.ho_ten`.
    - **Logic lọc trạng thái:** Dùng `trang_thai_duan LIKE '%Ngưng%'` hoặc `LIKE '%Dừng%'`.
    - **Logic tiến độ:** Vẫn giữ nguyên công thức tính AVG từ bảng `cong_viec` để biết dự án dừng ở mức nào.
    - **Ví dụ ĐÚNG:**
      ```sql
      SELECT d.ten_du_an, d.trang_thai_duan, nv.ho_ten as quan_ly_du_an, COALESCE(AVG(td.phan_tram), 0) as tien_do
      FROM du_an d
      LEFT JOIN cong_viec cv ON d.id = cv.du_an_id
      LEFT JOIN cong_viec_tien_do td ON cv.id = td.cong_viec_id
      AND td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id)
      LEFT JOIN nhanvien nv ON d.lead_id = nv.id
      WHERE d.trang_thai_duan LIKE '%Ngưng%' OR d.trang_thai_duan LIKE '%Dừng%'
      GROUP BY d.id, d.ten_du_an, d.trang_thai_duan, nv.ho_ten
      ```
"""


# ==========================================================
# 6B. GET SQL PROMPT BY ROLE (Role-specific Few-Shot Examples)
# ==========================================================

def get_sql_prompt_by_role(role: str = 'employee') -> ChatPromptTemplate:
    """
    Trả về SQL_PROMPT phù hợp với vai trò người dùng.
    - Employee: Ví dụ về câu hỏi cá nhân (check-in, lương, công việc của tôi)
    - Manager: Ví dụ về câu hỏi quản lý phòng ban (ai đi muộn, ai vắng mặt, nhân viên phòng)
    - Admin: Ví dụ về câu hỏi toàn công ty (thống kê, dự án, nhân sự toàn bộ)
    """
    base_prompt = """Bạn là SQL Generation Engine. Nhiệm vụ: Chuyển câu hỏi thành SQL Server/MySQL query tối ưu.

⛔ BỘ LUẬT CẤM (CRITICAL RULES):
1. **Output:** Chỉ trả về code SQL trần (Raw text). KHÔNG Markdown, KHÔNG giải thích.
2. **Luật Đi Muộn:** Bắt buộc `check_in >= '08:06:00'`.
3. **Luật Vắng Mặt:** Dùng `NOT IN (SELECT...)`.
4. **An toàn:** Chỉ dùng bảng/cột có trong SCHEMA.
5. Ngoài lề:
- Chỉ trả về "NO_DATA" nếu:
  a) Câu hỏi hoàn toàn KHÔNG liên quan đến HRM / Dự án / Nhân sự
  b) Không ánh xạ được tới BẤT KỲ bảng nào trong schema
- Nếu câu hỏi còn mơ hồ nhưng có khả năng liên quan, hãy suy luận hợp lý nhất và sinh SQL an toàn.

🧠 NGỮ CẢNH HỘI THOẠI (CONTEXT MEMORY):
{conversation_context}

HƯỚNG DẪN XỬ LÝ NGỮ CẢNH:
- Nếu câu hỏi hiện tại có từ như "còn", "thế còn", "còn...thì sao", "so sánh với", "chi tiết hơn", "cụ thể hơn":
  → Phải tham chiếu lại chủ đề/đối tượng từ câu hỏi trước.
- Ví dụ ngữ cảnh:
  + Hỏi trước: "Ai đi muộn hôm nay?" → Hỏi sau: "Còn hôm qua?" → Sinh SQL với ngay = CURRENT_DATE - 1
  + Hỏi trước: "Liệt kê dự án Marketing" → Hỏi sau: "Chi tiết hơn" → Lấy thêm nhiều cột thông tin
  + Hỏi trước: "Lương của Nam" → Hỏi sau: "Còn Hùng?" → Query lương của Hùng
- Nếu không có ngữ cảnh hoặc câu hỏi độc lập, xử lý bình thường.
"""
    
    if role == 'employee':
        few_shot = """HỌC TỪ VÍ DỤ (FEW-SHOT - EMPLOYEE):
[VÍ DỤ CHO NHÂN VIÊN - CHỈ TRUY VẤN DỮ LIỆU CỦA CHÍNH MÌNH]

- User: "Tôi đã check-in hôm nay chưa?"
  -> SQL: SELECT check_in FROM cham_cong WHERE nhan_vien_id = {{user_id}} AND DATE(ngay) = CURDATE()

- User: "Thông tin cá nhân của tôi?"
  -> SQL: SELECT ho_ten, email, so_dien_thoai, chuc_vu FROM nhanvien WHERE id = {{user_id}}

- User: "Lương cơ bản của tôi là bao nhiêu?"
  -> SQL: SELECT luong_co_ban FROM nhanvien WHERE id = {{user_id}}

- User: "Tôi còn bao nhiêu ngày phép?"
  -> SQL: SELECT ngay_phep_con_lai FROM ngay_phep_nam WHERE nhan_vien_id = {{user_id}} AND nam = YEAR(CURRENT_DATE)

- User: "Công việc nào được giao cho tôi?"
  -> SQL: SELECT cv.ten_cong_viec, cv.han_hoan_thanh, cv.trang_thai FROM cong_viec cv JOIN cong_viec_nguoi_nhan cvnn ON cv.id = cvnn.cong_viec_id WHERE cvnn.nhan_vien_id = {{user_id}} AND cv.trang_thai = 'Đang thực hiện'

- User: "Tôi có công việc nào bị trễ hạn không?"
  -> SQL: SELECT cv.ten_cong_viec, cv.han_hoan_thanh, cv.trang_thai FROM cong_viec cv JOIN cong_viec_nguoi_nhan cvnn ON cv.id = cvnn.cong_viec_id WHERE cvnn.nhan_vien_id = {{user_id}} AND cv.trang_thai != 'Đã hoàn thành' AND cv.han_hoan_thanh < CURDATE()

- User: "Lịch sử chấm công của tôi?"
  -> SQL: SELECT ngay, check_in, check_out FROM cham_cong WHERE nhan_vien_id = {{user_id}} ORDER BY ngay DESC LIMIT 30
"""
    elif role == 'manager':
        few_shot = """HỌC TỪ VÍ DỤ (FEW-SHOT - MANAGER):
[VÍ DỤ CHO TRƯỞNG PHÒNG - TRỎ VẤN DỮ LIỆU NHÂN VIÊN TRONG PHÒNG BAN]

- User: "Hôm nay ai đi muộn?"
  -> SQL: SELECT nv.ho_ten, c.check_in FROM cham_cong c JOIN nhanvien nv ON c.nhan_vien_id = nv.id WHERE c.ngay = CURDATE() AND c.check_in >= '08:06:00' AND nv.phong_ban_id = {{dept_id}}

- User: "Ai vắng mặt hôm nay?"
  -> SQL: SELECT nv.ho_ten FROM nhanvien nv WHERE nv.phong_ban_id = {{dept_id}} AND nv.id NOT IN (SELECT nhan_vien_id FROM cham_cong WHERE DATE(ngay) = CURDATE())

- User: "Danh sách nhân viên phòng tôi"
  -> SQL: SELECT ho_ten, email, chuc_vu FROM nhanvien WHERE phong_ban_id = {{dept_id}}

- User: "Ai đang nghỉ phép hôm nay?"
  -> SQL: SELECT nv.ho_ten, dnp.ly_do FROM don_nghi_phep dnp JOIN nhanvien nv ON dnp.nhan_vien_id = nv.id WHERE CURDATE() BETWEEN dnp.ngay_bat_dau AND dnp.ngay_ket_thuc AND dnp.trang_thai = 'da_duyet' AND nv.phong_ban_id = {{dept_id}}

- User: "Công việc nào đang trễ hạn?"
  -> SQL: SELECT cv.ten_cong_viec, cv.han_hoan_thanh, nv.ho_ten FROM cong_viec cv JOIN cong_viec_nguoi_nhan cvnn ON cv.id = cvnn.cong_viec_id JOIN nhanvien nv ON cvnn.nhan_vien_id = nv.id WHERE cv.trang_thai != 'Đã hoàn thành' AND cv.han_hoan_thanh < CURDATE() AND nv.phong_ban_id = {{dept_id}}

- User: "Phòng tôi có bao nhiêu người?"
  -> SQL: SELECT COUNT(*) AS so_nhan_vien FROM nhanvien WHERE phong_ban_id = {{dept_id}}

- User: "Dự án phòng tôi đang làm?"
  -> SQL: SELECT d.ten_du_an, d.trang_thai_duan, d.ngay_ket_thuc FROM du_an d WHERE d.phong_ban LIKE CONCAT('%', (SELECT ten_phong FROM phong_ban WHERE id = {{dept_id}}), '%')

- User: "Nguyễn Ngọc Tuyền dùng số điện thoại gì?" (Hỏi thông tin nhân viên trong phòng)
  -> SQL: SELECT ho_ten, so_dien_thoai FROM nhanvien WHERE ho_ten LIKE '%Nguyễn Ngọc Tuyền%' AND phong_ban_id = {{dept_id}}

- User: "Email của Nguyễn Ngọc Tuyền?" (Hỏi thông tin nhân viên trong phòng)
  -> SQL: SELECT ho_ten, email FROM nhanvien WHERE ho_ten LIKE '%Nguyễn Ngọc Tuyền%' AND phong_ban_id = {{dept_id}}

- User: "Lương của Nguyễn Ngọc Tuyền?" (Hỏi lương)
  -> Trả về: "NO_PERMISSION - Tôi không có quyền xem lương của nhân viên khác."
"""
    else:  # admin
        few_shot = """⛔⛔⛔ FORBIDDEN PATTERNS (NHỮNG PATTERN SAI - KHÔNG ĐƯỢC DÙNG) ⛔⛔⛔

❌ **FORBIDDEN #1 - Dự án trễ hạn lọc sai:**
   - SAI❌: WHERE ngay_ket_thuc < CURDATE() AND trang_thai_duan != 'Đã hoàn thành'
   - LỖI: Sẽ trả về dự án 'Tạm ngưng' (SAISAI)
   - ĐÚNG✅: WHERE ngay_ket_thuc < CURDATE() AND trang_thai_duan NOT IN ('Đã hoàn thành', 'Tạm ngưng')

❌ **FORBIDDEN #2 - Lý do:**
   - 'Tạm ngưng' = Dự án bị dừng (paused), KHÔNG phải "trễ hạn ứng động"
   - Nếu chỉ lọc 1 trạng thái → Sẽ count nhầm 'Tạm ngưng' vào "trễ hạn" (SAI LOGIC BUSINESS)
   - PHẢI LOẠI TRỪ: ('Đã hoàn thành', 'Kết thúc', 'Tạm ngưng')

❌ **FORBIDDEN #3 - Tìm kiếm tên (TEXT SEARCH):**
   - SAI❌: WHERE ten_cong_viec = 'Làm việc với a Bình BIDV'
   - LỖI: = là exact match, sẽ không tìm thấy nếu tên không hoàn toàn giống
   - ĐÚNG✅: WHERE ten_cong_viec LIKE '%Làm việc%' OR ten_cong_viec LIKE '%Bình%'
   - **LUẬT:** TÁT CẢ truy vấn tìm theo tên (ten_*, ho_ten, etc.) PHẢI dùng LIKE '%keyword%'

❌ **FORBIDDEN #4 - Subquery scalar (có thể trả > 1 record):**
   - SAI❌: WHERE cong_viec_id = (SELECT id FROM cong_viec WHERE ten_cong_viec LIKE '%..%')
   - LỖI: Nếu subquery trả nhiều hơn 1 công việc → ERROR, hoặc chỉ lấy record đầu (sai logic)
   - ĐÚNG✅ (Cách 1): WHERE cong_viec_id IN (SELECT id FROM cong_viec WHERE ten_cong_viec LIKE '%..%' OR ten_cong_viec LIKE '%..%')
   - ĐÚNG✅ (Cách 2 - TỐT HƠN): Dùng JOIN thay vì subquery
     ```sql
     SELECT cvq.ten_buoc, cvq.trang_thai
     FROM cong_viec_quy_trinh cvq
     JOIN cong_viec cv ON cvq.cong_viec_id = cv.id
     WHERE cv.ten_cong_viec LIKE '%keyword1%' OR cv.ten_cong_viec LIKE '%keyword2%'
     ```
   - **LUẬT:** Subquery khi có LIKE phải dùng IN, hoặc dùng JOIN (hiệu suất tốt hơn)

❌ **FORBIDDEN #5 - COUNT vs COUNT(DISTINCT):**
   - SAI❌: SELECT nv.ho_ten, COUNT(cv.id) FROM ... GROUP BY ... (nếu 1 công việc được assign for many people)
   - LỖI: 1 công việc được count nhiều lần → kết quả nhân đôi
   - ĐÚNG✅: SELECT nv.ho_ten, COUNT(DISTINCT cv.id) as so_viec FROM ... GROUP BY ...
   - **LUẬT:** Khi GROUP BY + COUNT trên bảng JOIN → phải dùng DISTINCT để tránh trùng lặp

❌ **FORBIDDEN #6 - LIMIT không cần thiết:**
   - SAI❌: "Liệt kê các dự án trễ hạn" → SQL có LIMIT 5
   - LỖI: Người dùng muốn danh sách đầy đủ, không phải top 5
   - ĐÚNG✅: Chỉ dùng LIMIT khi user yêu cầu "Top N" hoặc "Hàng đầu"
   - **LUẬT 1:** "Danh sách / Liệt kê / Có những cái nào" → KHÔNG LIMIT
   - **LUẬT 2:** "Top N / Hàng đầu / Xếp hạng" → LIMIT N
   - **LUẬT 3:** "Hôm nay / Công việc cần làm" (time-based) → LIMIT 5 OK
   - **VÍ DỤ:**
     * "Liệt kê dự án trễ hạn" → SELECT ... GROUP BY ... (NO LIMIT)
     * "Top 5 nhân viên hoàn thành nhiều nhất" → SELECT ... ORDER BY ... LIMIT 5 ✅
     * "Công việc cần làm hôm nay" → SELECT ... LIMIT 5 ✅

HỌC TỪ VÍ DỤ (FEW-SHOT - ADMIN):
[VÍ DỤ CHO QUẢN TRỊ VIÊN - TRUY VẤN DỮ LIỆU TOÀN CÔNG TY]

- User: "Có bao nhiêu người đi muộn hôm nay?"
  -> SQL: SELECT COUNT(DISTINCT nv.id) FROM cham_cong c JOIN nhanvien nv ON c.nhan_vien_id = nv.id WHERE DATE(c.ngay) = CURDATE() AND c.check_in >= '08:06:00'

- User: "Ai vắng mặt hôm nay?"
  -> SQL: SELECT ho_ten FROM nhanvien WHERE id NOT IN (SELECT nhan_vien_id FROM cham_cong WHERE DATE(ngay) = CURDATE())

- User: "Thống kê số lượng dự án theo từng trạng thái?"
  -> SQL: SELECT trang_thai_duan, COUNT(id) as so_luong FROM du_an GROUP BY trang_thai_duan

- User: "Có bao nhiêu dự án đang bị trễ hạn?"
  -> SQL: SELECT COUNT(id) as so_du_an FROM du_an WHERE ngay_ket_thuc < CURDATE() AND trang_thai_duan NOT IN ('Đã hoàn thành', 'Tạm ngưng')

- User: "Liệt kê những dự án nào đang bị trễ hạn (hiển thị tiến độ và quản lý)?"
  -> SQL: SELECT d.ten_du_an, COALESCE(AVG(td.phan_tram), 0) as tien_do, nv.ho_ten as quan_ly FROM du_an d LEFT JOIN cong_viec cv ON d.id = cv.du_an_id LEFT JOIN cong_viec_tien_do td ON cv.id = td.cong_viec_id AND td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id) LEFT JOIN nhanvien nv ON d.lead_id = nv.id WHERE d.ngay_ket_thuc < CURDATE() AND d.trang_thai_duan NOT IN ('Đã hoàn thành', 'Tạm ngưng') GROUP BY d.id, d.ten_du_an, nv.ho_ten

- User: "Những dự án nào đang bị tạm ngưng và ai là quản lý?"
  -> SQL: SELECT d.ten_du_an, COALESCE(AVG(td.phan_tram), 0) as tien_do, nv.ho_ten as quan_ly FROM du_an d LEFT JOIN cong_viec cv ON d.id = cv.du_an_id LEFT JOIN cong_viec_tien_do td ON cv.id = td.cong_viec_id AND td.thoi_gian_cap_nhat = (SELECT MAX(thoi_gian_cap_nhat) FROM cong_viec_tien_do WHERE cong_viec_id = cv.id) LEFT JOIN nhanvien nv ON d.lead_id = nv.id WHERE d.trang_thai_duan LIKE '%Ngưng%' OR d.trang_thai_duan LIKE '%Dừng%' GROUP BY d.id, d.ten_du_an, nv.ho_ten

- User: "Các bước thực hiện của công việc Soạn hợp đồng với Đồ Sơn?"
  -> SQL: SELECT cvq.ten_buoc, cvq.trang_thai FROM cong_viec_quy_trinh cvq JOIN cong_viec cv ON cvq.cong_viec_id = cv.id WHERE cv.ten_cong_viec LIKE '%Soạn hợp đồng%' OR cv.ten_cong_viec LIKE '%Đồ Sơn%'

- User: "Top 5 nhân viên hoàn thành nhiều công việc nhất?"
  -> SQL: SELECT nv.ho_ten, COUNT(DISTINCT cv.id) as so_viec FROM nhanvien nv JOIN cong_viec_nguoi_nhan cvnn ON nv.id = cvnn.nhan_vien_id JOIN cong_viec cv ON cvnn.cong_viec_id = cv.id WHERE cv.trang_thai = 'Đã hoàn thành' GROUP BY nv.id, nv.ho_ten ORDER BY so_viec DESC LIMIT 5

- User: "Thống kê khối lượng công việc đang chạy theo từng phòng ban?"
  -> SQL: SELECT pb.ten_phong, COUNT(cv.id) as so_viec FROM phong_ban pb LEFT JOIN nhanvien nv ON pb.id = nv.phong_ban_id LEFT JOIN cong_viec_nguoi_nhan cvnn ON nv.id = cvnn.nhan_vien_id LEFT JOIN cong_viec cv ON cvnn.cong_viec_id = cv.id WHERE cv.trang_thai = 'Đang thực hiện' GROUP BY pb.id, pb.ten_phong ORDER BY so_viec DESC
"""
    
    prompt_text = base_prompt + few_shot + """
SCHEMA DỮ LIỆU:
{schema}

Câu hỏi người dùng:
{question}

SQL OUTPUT (Only SQL):
"""
    
    return ChatPromptTemplate.from_template(prompt_text)


# ==========================================================
# 6C. GET SCHEMA BY ROLE
# ==========================================================

def get_schema_by_role(role: str, user_id: int = None, dept_id: int = None) -> str:
    """
    Trả về schema phù hợp với vai trò người dùng.
    
    Args:
        role: 'admin', 'manager', hoặc 'employee'
        user_id: ID của nhân viên đang đăng nhập
        dept_id: ID phòng ban (chỉ cần cho manager)
    
    Returns:
        Schema string đã được điền thông tin user_id/dept_id
    """
    if role == 'admin':
        return SCHEMA_ADMIN
    elif role == 'manager':
        return SCHEMA_QUANLY.format(user_id=user_id, dept_id=dept_id)
    else:  # employee
        return SCHEMA_NHANVIEN.format(user_id=user_id)
