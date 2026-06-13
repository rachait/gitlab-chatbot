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

# Load embedding model once
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Faster Groq model
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=groq_api_key,
    temperature=0.2
)

SYSTEM_PROMPT = """
You are a helpful assistant for GitLab employees and job candidates.

You answer questions ONLY using the provided GitLab Handbook
and Direction page context.

Rules:
- Be concise and accurate.
- Use bullet points when helpful.
- Mention the relevant handbook section when possible.
- Never hallucinate policies or facts.
- If the answer isn't in the context, say so.
- GitLab values are:
  Collaboration,
  Results,
  Efficiency,
  Diversity/Inclusion/Belonging,
  Iteration,
  Transparency (CREDIT).
"""

# ---------------------------
# LOAD FAISS + CHUNKS ONCE
# ---------------------------

INDEX_PATH = "faiss.index"
CHUNKS_PATH = "chunks.json"

INDEX = faiss.read_index(INDEX_PATH)

with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
    CHUNKS = json.load(f)

print(f"Loaded {len(CHUNKS)} chunks")


# ---------------------------
# BUILD INDEX
# ---------------------------

def build_index(
    chunks_path="chunks.json",
    index_path="faiss.index"
):
    with open(chunks_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    texts = [chunk["text"] for chunk in chunks]

    print(f"Embedding {len(texts)} chunks...")

    embeddings = embedder.encode(
        texts,
        convert_to_numpy=True,
        show_progress_bar=True,
        batch_size=64
    )

    embeddings = embeddings.astype("float32")

    faiss.normalize_L2(embeddings)

    index = faiss.IndexFlatIP(embeddings.shape[1])

    index.add(embeddings)

    faiss.write_index(index, index_path)

    print("FAISS index created successfully")


# ---------------------------
# RETRIEVE
# ---------------------------

def retrieve(query, k=3):
    query_embedding = embedder.encode(
        [query],
        convert_to_numpy=True
    ).astype("float32")

    faiss.normalize_L2(query_embedding)

    scores, indices = INDEX.search(
        query_embedding,
        k
    )

    results = []

    for score, idx in zip(scores[0], indices[0]):
        if idx < len(CHUNKS):
            results.append({
                **CHUNKS[idx],
                "score": float(score)
            })

    return results


# ---------------------------
# ANSWER
# ---------------------------

def answer(query, chat_history=None):
    if chat_history is None:
        chat_history = []

    gitlab_keywords = [
        "gitlab",
        "handbook",
        "remote",
        "values",
        "engineering",
        "hiring",
        "culture",
        "team",
        "work",
        "process",
        "direction",
        "product",
        "career",
        "performance",
        "review",
        "okr",
        "compensation",
        "benefits",
        "policy",
        "transparency",
        "iteration",
        "collaboration",
        "efficiency",
        "diversity",
        "leadership",
        "onboarding",
        "manager",
        "allremote",
        "communication"
    ]

    is_relevant = any(
        kw in query.lower()
        for kw in gitlab_keywords
    )

    if not is_relevant and len(query.split()) > 3:
        return (
            "I'm specialized for GitLab Handbook topics only. "
            "Please ask about GitLab culture, values, hiring, "
            "engineering, remote work, or product direction.",
            [],
            0
        )

    # Reduced retrieval from 5 -> 3
    results = retrieve(query, k=3)

    if not results:
        return (
            "I couldn't find relevant information.",
            [],
            0
        )

    context = "\n\n".join(
        [
            f"Source: {r['source']}\n"
            f"Title: {r['title']}\n\n"
            f"{r['text']}"
            for r in results
        ]
    )

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        *chat_history,
        HumanMessage(
            content=f"""
Context:

{context}

Question:
{query}
"""
        )
    ]

    response = llm.invoke(messages)

    confidence = round(
        results[0]["score"] * 100,
        2
    )

    sources = list(
        {
            r["source"]
            for r in results
        }
    )

    return (
        response.content,
        sources,
        confidence
    )


if __name__ == "__main__":
    build_index()