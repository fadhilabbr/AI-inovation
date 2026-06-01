import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    try:
        print("Mencoba list model yang tersedia:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Name: {m.name}, Display Name: {m.display_name}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print("GEMINI_API_KEY tidak ditemukan di .env")
