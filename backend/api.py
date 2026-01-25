import os
import re
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_core.prompts import ChatPromptTemplate
from core.llm import get_llm
from core.schema_hrm import HRM_SCHEMA   # ✅ IMPORT ĐÚNG THƯ MỤC

# ==========================================================
# LOAD ENV
# ==========================================================
load_dotenv()

# ==========================================================
# CONFIG
# ==========================================================
HRM_API_URL = "https://hrm.icss.com.vn/ICSS/api/execute-sql"

# ==========================================================
# FASTAPI
# ==========================================================
app = FastAPI(
    title="ICS HRM SQL Chatbot API",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# SCHEMA REQUEST / RESPONSE
# ==========================================================
class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    sql: str
    data: list | dict | None
    answer: str

# ==========================================================
# INIT LLM
# ==========================================================
llm = get_llm()

# ==========================================================
# PROMPT SQL
# ==========================================================
SQL_PROMPT = ChatPromptTemplate.from_template("""
Bạn là AI chuyên sinh SQL cho hệ thống HRM.

QUY TẮC BẮT BUỘC:
- Chỉ dùng bảng & cột có trong schema
- Tên bảng PHẢI dùng ĐÚNG như trong schema
- Không đoán bảng, không bịa cột
- Chỉ được SELECT
- Không markdown
- Không giải thích

SCHEMA:
{schema}

CÂU HỎI:
{question}

CHỈ TRẢ VỀ SQL:
""")

# ==========================================================
# UTILS
# ==========================================================
def validate_sql(sql: str) -> str:
    sql_clean = sql.strip().lower()

    if not sql_clean.startswith("select"):
        raise HTTPException(400, "❌ Chỉ cho phép SELECT")

    if re.search(r"\b(insert|update|delete|drop|alter|truncate)\b", sql_clean):
        raise HTTPException(400, "❌ SQL nguy hiểm bị chặn")

    return sql.strip()

def execute_sql(sql: str):
    payload = {"command": sql}
    headers = {"Content-Type": "application/json"}

    try:
        res = requests.post(
            HRM_API_URL,
            json=payload,
            headers=headers,
            timeout=20
        )

        print("===== HRM API STATUS =====")
        print(res.status_code)
        print("===== HRM API RESPONSE =====")
        print(res.text)
        print("==========================")

        if res.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"HRM API error: {res.text}"
            )

        return res.json()

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================================
# API CHAT
# ==========================================================
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        print("👉 STEP 1: START CHAT")
        print("QUESTION:", request.question)

        chain = SQL_PROMPT | llm

        print("👉 STEP 2: CALL LLM TO GENERATE SQL")

        result = chain.invoke({
            "schema": HRM_SCHEMA,
            "question": request.question
        })

        print("👉 STEP 3: RAW LLM RESULT")
        print(result)

        sql = result.content.strip()

        print("===== AI GENERATED SQL =====")
        print(sql)
        print("============================")

        sql = validate_sql(sql)

        print("👉 STEP 4: EXECUTE SQL")

        data = execute_sql(sql)

        print("👉 STEP 5: DATA RECEIVED")

        # ✅ STEP 6: DÙNG LLM DIỄN GIẢI KẾT QUẢ
        answer = llm.invoke(f"""
Bạn là trợ lý HRM.

NHIỆM VỤ:
- Dựa vào dữ liệu truy vấn SQL
- Trả lời đúng câu hỏi của người dùng
- Trả lời bằng TIẾNG VIỆT
- KHÔNG trả lời "OK"
- Nếu là số liệu → diễn giải thành câu đầy đủ

DỮ LIỆU:
{data}

CÂU HỎI:
{request.question}

CÂU TRẢ LỜI:
""").content.strip()

        return ChatResponse(
            sql=sql,
            data=data,
            answer=answer
        )

    except Exception as e:
        print("❌ CHAT ERROR:", str(e))
        raise
