import streamlit as st
import os
import sys

# ============================================
# 1. CẤU HÌNH TRANG WEB (PHẢI ĐỂ ĐẦU TIÊN)
# ============================================
st.set_page_config(
    page_title="ICS Assistant - Trợ lý An ninh mạng",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ============================================
# 2. CẤU HÌNH KEY & MÔI TRƯỜNG
# ============================================
KEY_GOOGLE_MOI = "" 
KEY_GROQ_CUA_BAN = ""

os.environ["GOOGLE_API_KEY"] = KEY_GOOGLE_MOI
GROQ_API_KEY = KEY_GROQ_CUA_BAN

sys.stdout.reconfigure(encoding='utf-8')
os.environ["PYTHONIOENCODING"] = "utf-8"

# ============================================
# 3. CUSTOM CSS
# ============================================
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    
    /* Bong bóng chat trái/phải */
    .stChatMessage { border-radius: 15px; padding: 10px 15px; margin-bottom: 12px; display: flex !important; width: fit-content !important; max-width: 80% !important; }
    div[data-testid="stChatMessage"]:has(div[aria-label="chat message by user"]) { margin-left: auto !important; flex-direction: row-reverse !important; background-color: #DCF8C6 !important; border: 1px solid #c3e6cb !important; }
    div[data-testid="stChatMessage"]:has(div[aria-label="chat message by assistant"]) { margin-right: auto !important; background-color: #F0F2F5 !important; border: 1px solid #d1d5db !important; }
    div[data-testid="chatAvatarIcon-user"], div[data-testid="chatAvatarIcon-assistant"] { display: none; }

    /* Định dạng Sidebar */
    .sidebar-section { font-size: 1rem; font-weight: bold; color: #1E3A8A; margin-top: 15px; margin-bottom: 5px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    .status-text { color: #10B981; font-weight: bold; font-size: 0.9rem; }
</style>
""", unsafe_allow_html=True)

# ============================================
# 4. XỬ LÝ LOGIC AI
# ============================================
try:
    from langchain_community.document_loaders import Docx2txtLoader
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from langchain_community.vectorstores import FAISS
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
except ImportError:
    st.error("❌ Thiếu thư viện! Vui lòng chạy: pip install -r requirements.txt")
    st.stop()

@st.cache_resource
def load_and_process_data():
    file_path = "data/input.docx"
    if not os.path.exists(file_path):
        return None
    loader = Docx2txtLoader(file_path)
    docs = loader.load()
    splits = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200).split_documents(docs)
    embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=KEY_GOOGLE_MOI, transport="rest")
    return FAISS.from_documents(splits, embeddings)

with st.spinner("🔄 Đang khởi động hệ thống bảo mật ICS..."):
    try:
        vectorstore = load_and_process_data()
    except Exception as e:
        st.error(f"❌ Lỗi kết nối AI: {e}")
        st.stop()

if vectorstore is None:
    st.error("❌ Không tìm thấy dữ liệu 'data/input.docx'")
    st.stop()

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
llm = ChatGroq(temperature=0, model_name="llama-3.3-70b-versatile", api_key=GROQ_API_KEY)

# ============================================
# 5. GIAO DIỆN CHÍNH (ĐÃ SỬA ĐỔI)
# ============================================

with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/512/9004/9004869.png", width=70)
    st.markdown("### **HỆ THỐNG ICS**")
    
    # 1. Trạng thái hệ thống
    #st.markdown('<p class="sidebar-section">⚡ Trạng thái</p>', unsafe_allow_html=True)
    #st.markdown("🟢 <span class='status-text'>AI SOC: Hoạt động</span>", unsafe_allow_html=True)
    #st.caption("Cập nhật dữ liệu: 20/01/2026")

    # 2. Thông tin công ty
    st.markdown('<p class="sidebar-section">🏢 Về chúng tôi</p>', unsafe_allow_html=True)
    st.info("**Công ty CP An ninh Mạng Quốc tế (ICS)**\n\nLà đơn vị tiên phong trong lĩnh vực an ninh mạng tại Việt Nam và khu vực, chuyên cung cấp các giải pháp bảo mật toàn diện cho thời đại công nghệ số.")

    # 3. Mạng lưới văn phòng
    with st.expander("📍 Địa điểm văn phòng"):
        st.write("**Hà Nội:**TT3-5 Khu đô thị Đại Kim mới, Định Công, Hà Nội.")
    

    # 4. Thông tin liên hệ
    st.markdown('<p class="sidebar-section">📞 Hỗ trợ kỹ thuật</p>', unsafe_allow_html=True)
    st.markdown("**Hotline:** 0707.806.860")

    st.markdown("**Website:** [icss.com.vn](www.icss.com.vn)")

    # 5. Nút chức năng
    st.markdown("---")
    if st.button("🗑️ Xóa lịch sử Chat"):
        st.session_state.messages = [{"role": "assistant", "content": "Hội thoại đã được làm mới. Tôi hỗ trợ được gì cho bạn?"}]
        st.rerun()

# --- HEADER TRANG CHÍNH ---
col_h1, col_h2 = st.columns([1, 8])
with col_h1:
    st.markdown("## 🛡️")
with col_h2:
    st.title("Trợ lý ảo ICS")
    st.write("*Hệ thống tra cứu giải pháp và quy trình làm việc của công ty")



# --- CHAT UI ---
if "messages" not in st.session_state:
    st.session_state.messages = [{"role": "assistant", "content": "Xin chào! Tôi là trợ lý nội bộ của ICS. Tôi hỗ trợ gì cho bạn."}]

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

if prompt := st.chat_input("Nhập câu hỏi về ICS tại đây..."):
    st.chat_message("user").markdown(prompt)
    st.session_state.messages.append({"role": "user", "content": prompt})

    try:
        relevant_docs = retriever.invoke(prompt)
        context = "\n\n".join([d.page_content for d in relevant_docs])
        
        sys_prompt = ChatPromptTemplate.from_template(
            """Bạn là trợ lý ảo nội bộ của công ty ICS. 
            Nhiệm vụ của bạn là CHỈ trả lời câu hỏi dựa trên thông tin được cung cấp.

            QUY TẮC:
            1. Nếu không liên quan đến công ty ICS, trả lời: "Xin lỗi, câu hỏi nằm ngoài phạm vi hỗ trợ của tôi. Tôi chỉ hỗ trợ thông tin nội bộ ICS."
            2. Trả lời bằng tiếng Việt chuyên nghiệp, ngắn gọn.
            
            CONTEXT: {context}
            CÂU HỎI: {question}"""
        )
        
        chain = sys_prompt | llm
        response = chain.invoke({"context": context, "question": prompt})
        
        with st.chat_message("assistant"):
            st.markdown(response.content)
        st.session_state.messages.append({"role": "assistant", "content": response.content})

    except Exception as e:
        st.error(f"Đã xảy ra lỗi: {e}")