# app.py

import streamlit as st
from langchain_core.messages import HumanMessage, AIMessage
from rag import answer

st.set_page_config(
    page_title="GitLab Handbook Assistant",
    page_icon="🦊",
    layout="centered"
)

st.markdown("""
<style>
    .source-chip {
        background: #FC6D261A;
        color: #FC6D26;
        border: 1px solid #FC6D2640;
        border-radius: 20px;
        padding: 3px 10px;
        font-size: 12px;
        margin: 2px;
        display: inline-block;
        text-decoration: none;
    }

    .footer-note {
        font-size: 12px;
        color: gray;
        text-align: center;
        margin-top: 8px;
    }
</style>
""", unsafe_allow_html=True)

st.title("🦊 GitLab Handbook Assistant")
st.caption(
    "Ask me anything about GitLab's culture, values, remote work, hiring, or product direction."
)

# Session State
if "messages" not in st.session_state:
    st.session_state.messages = []

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []

# Suggested Questions
SUGGESTIONS = [
    "What are GitLab's core values?",
    "How does GitLab work remotely?",
    "What is GitLab's product direction?",
    "How does the GitLab hiring process work?",
    "How does GitLab handle performance reviews?",
    "What is GitLab's approach to transparency?"
]

# Show Suggestions
if not st.session_state.messages:
    st.markdown("### Try asking one of these")

    cols = st.columns(2)

    for i, suggestion in enumerate(SUGGESTIONS):
        if cols[i % 2].button(
            suggestion,
            use_container_width=True,
            key=f"suggestion_{i}"
        ):
            st.session_state.pending = suggestion
            st.rerun()

# Display Chat History
for msg in st.session_state.messages:
    avatar = "🦊" if msg["role"] == "assistant" else "👤"

    with st.chat_message(msg["role"], avatar=avatar):
        st.markdown(msg["content"])

        if msg.get("sources"):
            chips = " ".join(
                f'<a class="source-chip" href="{s}" target="_blank">'
                f'📖 Source</a>'
                for s in msg["sources"]
            )

            st.markdown(chips, unsafe_allow_html=True)

        if msg.get("confidence"):
            st.caption(
                f"Confidence Score: {msg['confidence']:.1f}%"
            )

# User Input
user_input = (
    st.session_state.pop("pending", None)
    or st.chat_input(
        "Ask about GitLab's handbook, culture, processes..."
    )
)

if user_input:

    st.session_state.messages.append({
        "role": "user",
        "content": user_input
    })

    with st.chat_message("user", avatar="👤"):
        st.markdown(user_input)

    with st.chat_message("assistant", avatar="🦊"):

        with st.spinner(
            "Searching GitLab Handbook and Direction pages..."
        ):

            try:

                reply, sources, confidence = answer(
                    user_input,
                    st.session_state.chat_history
                )

                st.markdown(reply)

                st.caption(
                    f"Confidence Score: {confidence:.1f}%"
                )

                if sources:
                    chips = " ".join(
                        f'<a class="source-chip" href="{s}" target="_blank">'
                        f'📖 Source</a>'
                        for s in sources
                    )

                    st.markdown(
                        chips,
                        unsafe_allow_html=True
                    )

                # Memory
                st.session_state.chat_history.append(
                    HumanMessage(content=user_input)
                )

                st.session_state.chat_history.append(
                    AIMessage(content=reply)
                )

                # Keep last 20 messages
                st.session_state.chat_history = (
                    st.session_state.chat_history[-20:]
                )

                st.session_state.messages.append({
                    "role": "assistant",
                    "content": reply,
                    "sources": sources,
                    "confidence": confidence
                })

            except Exception as e:
                st.error(
                    f"Something went wrong: {str(e)}"
                )

# Footer
st.markdown(
    """
    <p class="footer-note">
    🛡️ Answers are generated from GitLab Handbook and Direction pages.
    Always verify critical information from the official GitLab documentation.
    </p>
    """,
    unsafe_allow_html=True
)

# Sidebar
with st.sidebar:

    st.markdown("## 🦊 GitLab Assistant")

    st.markdown(
        """
        AI-powered GitLab knowledge assistant built using:

        - 🤖 Groq Llama 3.3 70B
        - 🔍 FAISS Vector Search
        - 🧠 Sentence Transformers
        - 📄 LangChain
        - 🖥️ Streamlit
        """
    )

    st.divider()

    if st.button("🗑️ Clear Conversation"):
        st.session_state.messages = []
        st.session_state.chat_history = []
        st.rerun()

    st.markdown("### Useful Links")

    st.markdown(
        "[GitLab Handbook](https://handbook.gitlab.com)"
    )

    st.markdown(
        "[GitLab Direction](https://about.gitlab.com/direction/)"
    )