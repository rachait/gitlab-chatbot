import { useState, useRef, useEffect } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://gitlab-chatbot-production.up.railway.app/chat";

const TOPICS = [
  { label: "All Topics", value: "", emoji: "🦊" },
  { label: "Values", value: "values", emoji: "💎" },
  { label: "Remote Work", value: "remote work", emoji: "🌍" },
  { label: "Hiring", value: "hiring", emoji: "👥" },
  { label: "Engineering", value: "engineering", emoji: "⚙️" },
  { label: "Leadership", value: "leadership", emoji: "🎯" },
  { label: "Culture", value: "culture", emoji: "🌱" },
  { label: "Product", value: "product direction", emoji: "🚀" },
  { label: "OKRs", value: "OKRs", emoji: "📊" },
];

const SUGGESTIONS = {
  "": [
    "What are GitLab's core values?",
    "How does GitLab work remotely?",
    "What is GitLab's product direction?",
    "How does the GitLab hiring process work?",
  ],
  values: [
    "What are GitLab's CREDIT values?",
    "How does GitLab practice transparency?",
    "What does iteration mean at GitLab?",
    "How does GitLab define results?",
  ],
  "remote work": [
    "How does GitLab manage async communication?",
    "What are the benefits of working at GitLab remotely?",
    "How does GitLab handle time zones?",
    "What is GitLab's non-linear workday policy?",
  ],
  hiring: [
    "What is GitLab's hiring process?",
    "How does GitLab conduct interviews?",
    "What does GitLab look for in candidates?",
    "How long does the GitLab hiring process take?",
  ],
  engineering: [
    "How does GitLab do code reviews?",
    "What is GitLab's engineering workflow?",
    "How does GitLab handle on-call rotations?",
    "What are GitLab's engineering principles?",
  ],
  leadership: [
    "What is expected of GitLab managers?",
    "How does GitLab develop leaders?",
    "What is the GitLab leadership handbook?",
    "How does skip-level feedback work at GitLab?",
  ],
  culture: [
    "What makes GitLab's culture unique?",
    "How does GitLab promote inclusion?",
    "What is GitLab's approach to mental health?",
    "How does GitLab celebrate team members?",
  ],
  "product direction": [
    "What is GitLab's product vision?",
    "What are GitLab's product categories?",
    "How does GitLab prioritize features?",
    "What is GitLab's DevSecOps direction?",
  ],
  OKRs: [
    "How does GitLab use OKRs?",
    "How are OKRs set at GitLab?",
    "What is the OKR review process at GitLab?",
    "How do team OKRs align with company OKRs?",
  ],
};

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "10px 4px", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "#FC6D26",
          animation: "bounce 0.9s infinite", animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </div>
  );
}

function ConfidenceBar({ score }) {
  // score is already 0-100 (cosine similarity * 100 from backend)
  // cosine similarity is 0-1, so score is 0-100 directly
  const confidence = Math.max(5, Math.min(99, Math.round(score)));
  const color = confidence > 70 ? "#22c55e" : confidence > 45 ? "#f59e0b" : "#ef4444";
  const label = confidence > 70 ? "High" : confidence > 45 ? "Medium" : "Low";
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: "#888" }}>Confidence</span>
        <span style={{ fontSize: 10, color, fontWeight: 600 }}>
          {label} · {confidence}%
        </span>
      </div>
      <div style={{ height: 4, background: "#1a1f2e", borderRadius: 2 }}>
        <div style={{
          height: "100%",
          width: `${confidence}%`,
          background: color,
          borderRadius: 2,
          transition: "width 1s ease",
        }} />
      </div>
    </div>
  );
}

function Message({ msg, onFeedback }) {
  const isUser = msg.role === "user";
  const [feedback, setFeedback] = useState(null);

  function handleFeedback(type) {
    setFeedback(type);
    onFeedback(msg.id, type);
  }

  return (
    <div style={{
      display: "flex", flexDirection: isUser ? "row-reverse" : "row",
      gap: 10, alignItems: "flex-start", marginBottom: 20,
    }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        background: isUser ? "#2d2b55" : "#FC6D26",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: "white",
      }}>
        {isUser ? "You" : "GL"}
      </div>

      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Bubble */}
        <div style={{
          background: isUser ? "#1a1f2e" : "#111827",
          border: `1px solid ${isUser ? "#2d2b55" : "#FC6D2625"}`,
          borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          padding: "12px 16px",
          fontSize: 14, lineHeight: 1.75, color: "#e2e2e2",
        }}>
          {/* Response time badge */}
          {msg.responseTime && (
            <div style={{ marginBottom: 8 }}>
              <span style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 20,
                background: "#FC6D2615", color: "#FC6D26",
                border: "1px solid #FC6D2630",
              }}>
                ⚡ {msg.responseTime}s · {msg.wordCount} words · {msg.sourceCount} sources
              </span>
            </div>
          )}

          {/* Message content */}
          <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>

          {/* Confidence bar */}
          {msg.confidence !== undefined && (
            <ConfidenceBar score={msg.confidence} />
          )}

          {/* Sources */}
          {msg.sources && msg.sources.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {msg.sources.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noreferrer" style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: 20,
                  background: "#FC6D2612", color: "#FC6D26",
                  border: "1px solid #FC6D2635", textDecoration: "none",
                  transition: "background 0.2s",
                }}
                  onMouseEnter={e => e.target.style.background = "#FC6D2625"}
                  onMouseLeave={e => e.target.style.background = "#FC6D2612"}
                >
                  📖 {src.replace("https://", "").slice(0, 38)}...
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Feedback buttons (only for assistant) */}
        {!isUser && (
          <div style={{ display: "flex", gap: 6, paddingLeft: 4 }}>
            <button onClick={() => handleFeedback("up")} style={{
              background: feedback === "up" ? "#22c55e20" : "transparent",
              border: `1px solid ${feedback === "up" ? "#22c55e" : "#2d2b55"}`,
              borderRadius: 8, padding: "3px 10px", cursor: "pointer",
              fontSize: 12, color: feedback === "up" ? "#22c55e" : "#666",
              transition: "all 0.2s",
            }}>
              👍 Helpful
            </button>
            <button onClick={() => handleFeedback("down")} style={{
              background: feedback === "down" ? "#ef444420" : "transparent",
              border: `1px solid ${feedback === "down" ? "#ef4444" : "#2d2b55"}`,
              borderRadius: 8, padding: "3px 10px", cursor: "pointer",
              fontSize: 12, color: feedback === "down" ? "#ef4444" : "#666",
              transition: "all 0.2s",
            }}>
              👎 Not helpful
            </button>
            {feedback && (
              <span style={{ fontSize: 11, color: "#666", alignSelf: "center" }}>
                Thanks for the feedback!
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feedbackLog, setFeedbackLog] = useState([]);
  const [stats, setStats] = useState({ totalQuestions: 0, helpful: 0, avgTime: 0 });
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleFeedback(msgId, type) {
    setFeedbackLog(prev => [...prev, { msgId, type, time: new Date() }]);
    if (type === "up") {
      setStats(prev => ({ ...prev, helpful: prev.helpful + 1 }));
    }
  }

  function exportChat() {
    const text = messages.map(m =>
      `[${m.role.toUpperCase()}]: ${m.content}${m.sources?.length ? "\nSources: " + m.sources.join(", ") : ""}`
    ).join("\n\n---\n\n");
    const blob = new Blob([`GitLab Handbook Chat Export\n${new Date().toLocaleString()}\n\n${text}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `gitlab-chat-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  async function sendMessage(text) {
    const question = text || input.trim();
    if (!question || loading) return;

    // Prepend topic context if selected
    const finalQuestion = activeTopic && !question.toLowerCase().includes(activeTopic)
      ? `[Topic: ${activeTopic}] ${question}`
      : question;

    setInput("");
    const userMsg = { id: Date.now(), role: "user", content: question };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);
    const startTime = Date.now();

    try {
      const history = updated.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: finalQuestion, history }),
      });
      const data = await res.json();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const wordCount = data.answer.split(" ").length;

      setMessages(prev => [...prev, {
        id: Date.now(),
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        confidence: data.confidence || 5,
        responseTime: elapsed,
        wordCount,
        sourceCount: (data.sources || []).length,
      }]);

      setStats(prev => ({
        totalQuestions: prev.totalQuestions + 1,
        helpful: prev.helpful,
        avgTime: ((prev.avgTime * prev.totalQuestions + parseFloat(elapsed)) / (prev.totalQuestions + 1)).toFixed(1),
      }));

    } catch (error) {
  console.error(error);

  setMessages(prev => [...prev, {
    id: Date.now(),
    role: "assistant",
    content: "⚠️ Unable to connect to the GitLab Assistant backend.",
    sources: [],
  }]);
}

    setLoading(false);
    inputRef.current?.focus();
  }

  const currentSuggestions = SUGGESTIONS[activeTopic] || SUGGESTIONS[""];

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", display: "flex", flexDirection: "column", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#FC6D26 0%,#E24329 100%)",
        padding: "12px 20px", display: "flex", alignItems: "center", gap: 12,
        boxShadow: "0 2px 20px #FC6D2640", flexShrink: 0,
      }}>
        <button onClick={() => setSidebarOpen(o => !o)} style={{
          background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8,
          width: 32, height: 32, cursor: "pointer", color: "white", fontSize: 16,
        }}>☰</button>
        <span style={{ fontSize: 24 }}>🦊</span>
        <div>
          <div style={{ color: "white", fontWeight: 700, fontSize: 17 }}>GitLab Handbook Assistant</div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>RAG-powered · handbook.gitlab.com</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {messages.length > 0 && (
            <button onClick={exportChat} style={{
              background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8,
              padding: "5px 12px", color: "white", cursor: "pointer", fontSize: 12,
            }}>📤 Export</button>
          )}
          <div style={{ fontSize: 11, background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: 20, color: "white" }}>
            🛡️ Guardrails on
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Sidebar */}
        {sidebarOpen && (
          <div style={{
            width: 220, background: "#0d1117", borderRight: "1px solid #1e1e2e",
            display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto",
          }}>
            <div style={{ padding: "16px 12px 8px", fontSize: 11, color: "#555", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
              Filter by topic
            </div>
            {TOPICS.map(t => (
              <button key={t.value} onClick={() => { setActiveTopic(t.value); setMessages([]); }} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px", background: activeTopic === t.value ? "#FC6D2615" : "transparent",
                border: "none", borderLeft: activeTopic === t.value ? "3px solid #FC6D26" : "3px solid transparent",
                color: activeTopic === t.value ? "#FC6D26" : "#888",
                cursor: "pointer", fontSize: 13, textAlign: "left", transition: "all 0.15s",
              }}>
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}

            {/* Stats panel */}
            <div style={{ marginTop: "auto", padding: 16, borderTop: "1px solid #1e1e2e" }}>
              <div style={{ fontSize: 11, color: "#555", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                Session stats
              </div>
              {[
                { label: "Questions", value: stats.totalQuestions },
                { label: "Helpful", value: feedbackLog.filter(f => f.type === "up").length },
                { label: "Avg time", value: `${stats.avgTime}s` },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#666" }}>{s.label}</span>
                  <span style={{ fontSize: 12, color: "#FC6D26", fontWeight: 600 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Topic badge */}
          {activeTopic && (
            <div style={{
              padding: "8px 20px", background: "#FC6D2610",
              borderBottom: "1px solid #FC6D2625",
              fontSize: 12, color: "#FC6D26",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>🗂️ Filtering by: <strong>{activeTopic}</strong></span>
              <button onClick={() => setActiveTopic("")} style={{
                background: "none", border: "none", color: "#FC6D26",
                cursor: "pointer", fontSize: 14, padding: 0,
              }}>✕</button>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", maxWidth: 800, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

            {messages.length === 0 && (
              <div style={{ textAlign: "center", marginTop: 30 }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🦊</div>
                <h2 style={{ color: "#e2e2e2", fontWeight: 600, marginBottom: 6, fontSize: 20 }}>
                  {activeTopic ? `Ask me about ${activeTopic}` : "Ask me anything about GitLab"}
                </h2>
                <p style={{ color: "#666", fontSize: 13, marginBottom: 28 }}>
                  Powered by RAG · Answers grounded in the official GitLab Handbook
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {currentSuggestions.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s)} style={{
                      background: "#111827", border: "1px solid #FC6D2635",
                      borderRadius: 20, padding: "8px 16px",
                      color: "#FC6D26", fontSize: 13, cursor: "pointer", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.target.style.background = "#FC6D2615"; e.target.style.borderColor = "#FC6D26"; }}
                      onMouseLeave={e => { e.target.style.background = "#111827"; e.target.style.borderColor = "#FC6D2635"; }}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <Message key={i} msg={msg} onFeedback={handleFeedback} />
            ))}

            {loading && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FC6D26", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0 }}>GL</div>
                <div style={{ background: "#111827", border: "1px solid #FC6D2625", borderRadius: "4px 16px 16px 16px", padding: "4px 12px" }}>
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Footer note */}
          <div style={{ textAlign: "center", fontSize: 11, color: "#444", padding: "4px 0" }}>
            🛡️ Answers based on public GitLab Handbook content · Verify at{" "}
            <a href="https://handbook.gitlab.com" target="_blank" rel="noreferrer" style={{ color: "#FC6D26", textDecoration: "none" }}>handbook.gitlab.com</a>
          </div>

          {/* Input */}
          <div style={{ borderTop: "1px solid #1e1e2e", padding: "14px 20px", background: "#0d1117" }}>
            <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={activeTopic ? `Ask about ${activeTopic}...` : "Ask about GitLab's handbook, culture, processes…"}
                rows={1}
                style={{
                  flex: 1, background: "#161b22", border: "1px solid #30363d",
                  borderRadius: 12, padding: "12px 16px", color: "#e2e2e2",
                  fontSize: 14, fontFamily: "inherit", resize: "none", outline: "none",
                  lineHeight: 1.5, minHeight: 46, maxHeight: 120, transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#FC6D26"}
                onBlur={e => e.target.style.borderColor = "#30363d"}
              />
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{
                background: loading || !input.trim() ? "#1e1e2e" : "#FC6D26",
                border: "none", borderRadius: 12, width: 46, height: 46,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.2s",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#0d1117}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#0d1117}
        ::-webkit-scrollbar-thumb{background:#FC6D2650;border-radius:3px}
      `}</style>
    </div>
  );
}