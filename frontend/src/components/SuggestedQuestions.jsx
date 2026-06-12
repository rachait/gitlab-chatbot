const suggestions = [
  "What are GitLab's core values?",
  "How does GitLab work remotely?",
  "What is GitLab's product direction?",
  "How does GitLab handle performance reviews?"
];

function SuggestedQuestions({ onSelect }) {
  return (
    <div className="suggestions">
      {suggestions.map((question) => (
        <button
          key={question}
          onClick={() => onSelect(question)}
        >
          {question}
        </button>
      ))}
    </div>
  );
}

export default SuggestedQuestions;