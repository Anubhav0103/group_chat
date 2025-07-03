import React, { useState, useEffect } from "react";

function GroupChat({ currentUser, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Fetch all messages and online users on mount and every 1 second
  useEffect(() => {
    const fetchData = () => {
      // Fetch messages
      fetch('http://localhost:5000/api/messages')
        .then(res => res.json())
        .then(data => {
          setMessages(data.map(msg => ({
            user: msg.senderName,
            text: msg.message,
            isNotification: false,
            created_at: msg.created_at
          })));
        });

      // Fetch online users
      fetch('http://localhost:5000/api/online-users')
        .then(res => res.json())
        .then(data => {
          setUsers(data.map(user => user.name));
        });
    };

    // Initial fetch
    fetchData();

    // Set up interval to fetch every 1 second
    const interval = setInterval(fetchData, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages((prev) => [...prev, { user: currentUser, text: input }]);
      // Send message to backend
      try {
        await fetch('http://localhost:5000/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: Number(currentUserId), message: input }),
        });
      } catch (err) {
        // Optionally handle error
      }
      setInput("");
    }
  };

  return (
    <div>
      <h2>Group Chat</h2>
      <div>
        <strong>Online users:</strong>
        <ul>
          {users.map((u, i) => (
            <li key={i}>{u}</li>
          ))}
        </ul>
      </div>
      <div style={{ border: "1px solid #ccc", minHeight: 100, margin: "1em 0", padding: 10 }}>
        {messages.map((msg, i) => (
          msg.isNotification ? (
            <div key={i} style={{ color: "green" }}>{msg.text}</div>
          ) : (
            <div key={i}><strong>{msg.user}:</strong> {msg.text}</div>
          )
        ))}
      </div>
      <form onSubmit={handleSend}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default GroupChat; 