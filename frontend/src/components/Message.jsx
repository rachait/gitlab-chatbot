function Message({ message }) {
  return (
    <div className={`message ${message.role}`}>
      <div className="bubble">
        {message.content}
      </div>

      {message.sources && (
        <div className="sources">
          {message.sources.map((source, index) => (
            <a
              key={index}
              href={source}
              target="_blank"
              rel="noreferrer"
            >
              📚 Source
            </a>
          ))}
        </div>
      )}

      {message.confidence && (
        <div className="confidence">
          Confidence: {message.confidence}%
        </div>
      )}
    </div>
  );
}

export default Message;