from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

from rag import answer, retrieve

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str
    history: Optional[List[Message]] = []


@app.get("/")
def root():
    return {
        "status": "running",
        "service": "GitLab Handbook Assistant"
    }


@app.post("/chat")
def chat(request: ChatRequest):
    try:
        from langchain_core.messages import HumanMessage, AIMessage

        # Build chat history
        chat_history = []
        for msg in request.history or []:
            if msg.role == "user":
                chat_history.append(HumanMessage(content=msg.content))
            else:
                chat_history.append(AIMessage(content=msg.content))

        # Get answer — rag.py returns 3 values
        reply, sources, confidence = answer(
            request.question,
            chat_history
        )

        return {
            "answer": reply,
            "sources": sources,
            "confidence": confidence
        }

    except Exception as e:
        return {
            "answer": f"Something went wrong: {str(e)}",
            "sources": [],
            "confidence": 0
        }