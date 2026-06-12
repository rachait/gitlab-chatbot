import json
import os

import faiss
import numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")

if not groq_api_key:
    raise ValueError("GROQ_API_KEY not found")

embedder = SentenceTransformer("all-MiniLM-L6-v2")

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=groq_api_key,
    temperature=0.2
)

SYSTEM_PROMPT = """
You are a helpful assistant for GitLab employees and job candidates.
You answer questions based ONLY on the provided context from
GitLab's official Handbook and Direction pages.

Rules:
- Give clear, structured answers using bullet points where helpful.
- Always mention which section your answer comes from.
- If context doesn't contain the answer, say so honestly and
  suggest the user visit handbook.gitlab.com directly.
- Never invent GitLab policies or facts.
- GitLab's core values are: Results, Iteration, Transparency,
  Efficiency, Diversity/Inclusion/Belonging, Collaboration (CREDIT).
- GitLab is an all-remote company with async-first communication.
- Keep answers concise but complete.
"""


def build_index(
    chunks_path="chunks.json",
    index_path="faiss.index"
):
    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    texts = [chunk["text"] for chunk in chunks]

    print(f"Embedding {len(texts)} chunks locally with SentenceTransformers...")
    embeddings = embedder.encode(
        texts,
        convert_to_numpy=True,
        show_progress_bar=True,
        batch_size=64
    )
    print("Embeddings done!")

    embeddings = embeddings.astype("float32")
    faiss.normalize_L2(embeddings)

    index = faiss.IndexFlatIP(embeddings.shape[1])
    index.add(embeddings)

    faiss.write_index(index, index_path)
    print("Index created successfully")


def retrieve(
    query,
    k=5,
    index_path="faiss.index",
    chunks_path="chunks.json"
):
    index = faiss.read_index(index_path)

    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    query_embedding = embedder.encode(
        [query],
        convert_to_numpy=True
    ).astype("float32")

    faiss.normalize_L2(query_embedding)

    scores, indices = index.search(query_embedding, k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < len(chunks):
            results.append({
                **chunks[idx],
                "score": float(score)
            })

    return results


def answer(query, chat_history=None):
    if chat_history is None:
        chat_history = []

    # Guardrail: only answer GitLab-related questions
    gitlab_keywords = [
        "gitlab", "handbook", "remote", "values", "engineering", "hiring",
        "culture", "team", "work", "process", "direction", "product", "career",
        "performance", "review", "okr", "compensation", "benefits", "policy",
        "transparency", "iteration", "collaboration", "efficiency", "diversity",
        "leadership", "onboarding", "manager", "allremote", "communication"
    ]
    is_relevant = any(kw in query.lower() for kw in gitlab_keywords)
    if not is_relevant and len(query.split()) > 3:
        return (
            "I'm specialized for GitLab Handbook topics only. "
            "Please ask about GitLab's culture, values, hiring, "
            "engineering, remote work, or product direction.",
            [],
            0
        )

    results = retrieve(query)

    if not results:
        return (
            "I couldn't find relevant information.",
            [],
            0
        )

    context = "\n\n".join(
        [
            f"Source: {r['source']}\nTitle: {r['title']}\n\n{r['text']}"
            for r in results
        ]
    )

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        *chat_history,
        HumanMessage(
            content=f"Context:\n\n{context}\n\nQuestion:\n{query}"
        )
    ]

    response = llm.invoke(messages)

    confidence = round(results[0]["score"] * 100, 2)
    sources = list({r["source"] for r in results})

    return (response.content, sources, confidence)


if __name__ == "__main__":
    build_index()