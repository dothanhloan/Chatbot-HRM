import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()  # 👈 BẮT BUỘC

def get_llm():
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise RuntimeError("❌ GROQ_API_KEY chưa được load")

    return ChatGroq(
        model="llama-3.1-8b-instant",
        api_key=api_key,
        temperature=0
    )
