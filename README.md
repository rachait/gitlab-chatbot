# 🦊 GitLab Handbook Assistant

An AI-powered Retrieval-Augmented Generation (RAG) chatbot that answers questions about GitLab's Handbook, company culture, remote work practices, values, hiring process, and product direction using official GitLab documentation.

## 🚀 Live Demo

**Frontend (Vercel):**  
https://gitlab-chatbot-one.vercel.app

**Backend API (Railway):**  
https://gitlab-chatbot-production.up.railway.app

**API Documentation:**  
https://gitlab-chatbot-production.up.railway.app/docs

---

## 📌 Features

- 🔍 Retrieval-Augmented Generation (RAG)
- 🤖 AI-powered GitLab Handbook Assistant
- 📚 Answers based on official GitLab documentation
- ⚡ Fast semantic search using FAISS
- 💬 Conversational chat interface
- 🧠 Follow-up conversation support
- 📖 Source citations
- 📊 Confidence scoring
- 🌐 Fully deployed frontend and backend

---

## 🏗️ Architecture

```text
User Query
    │
    ▼
React Frontend (Vercel)
    │
    ▼
FastAPI Backend (Railway)
    │
    ▼
Sentence Transformers
    │
    ▼
FAISS Vector Search
    │
    ▼
Relevant GitLab Handbook Chunks
    │
    ▼
Groq LLM
    │
    ▼
Answer + Sources + Confidence
```

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- Axios
- CSS

### Backend
- FastAPI
- Python
- LangChain
- Groq API

### Vector Database
- FAISS

### Embeddings
- all-MiniLM-L6-v2

### Deployment
- Railway
- Vercel

---

## 📂 Project Structure

```text
gitlab-chatbot/
│
├── backend/
│   ├── api.py
│   ├── rag.py
│   ├── scraper.py
│   ├── chunks.json
│   ├── faiss.index
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
└── README.md
```

---

## ⚙️ Backend Setup

### Clone Repository

```bash
git clone https://github.com/rachait/gitlab-chatbot.git
cd gitlab-chatbot/backend
```

### Create Virtual Environment

```bash
python -m venv .venv
```

### Activate Virtual Environment

#### Windows

```bash
.venv\Scripts\activate
```

#### Linux / macOS

```bash
source .venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Create .env File

```env
GROQ_API_KEY=your_groq_api_key
```

### Run Backend

```bash
uvicorn api:app --reload --port 8000
```

Backend URL:

```text
http://localhost:8000
```

Swagger Docs:

```text
http://localhost:8000/docs
```

---

## 🎨 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## 🔎 Example Questions

- What are GitLab's core values?
- How does GitLab support remote work?
- What is GitLab's hiring process?
- How are performance reviews conducted?
- What is GitLab's product direction?
- How does GitLab approach transparency?

---

## 📡 API Example

### Request

```json
{
  "question": "What are GitLab's core values?",
  "history": []
}
```

### Response

```json
{
  "answer": "GitLab follows the CREDIT values...",
  "sources": [
    "https://handbook.gitlab.com/handbook/values/"
  ],
  "confidence": 71.2
}
```

---

## 🚀 Deployment

### Backend Deployment

- Railway
- FastAPI
- Uvicorn

### Frontend Deployment

- Vercel
- React + Vite

---

## 📈 Future Enhancements

- User Authentication
- Persistent Chat History
- Redis Caching
- Hybrid Search (BM25 + FAISS)
- Streaming Responses
- Multi-Document Support
- Advanced Memory System

---

## 👨‍💻 Author

**Rachait Talwar**

GitHub:  
https://github.com/rachait

Project Repository:  
https://github.com/rachait/gitlab-chatbot

---

## 📄 License

This project is developed for educational and portfolio purposes.

GitLab trademarks, logos, and documentation belong to GitLab Inc.
