import React, { useState, useEffect } from "react";

function GroupChat({ currentUser, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Load cached messages from localStorage on mount
  useEffect(() => {
    const cachedMessages = localStorage.getItem('chatMessages');
    if (cachedMessages) {
      setMessages(JSON.parse(cachedMessages));
    }
  }, []);

  // Fetch all messages and online users on mount and every 1 second
  useEffect(() => {
    const fetchData = () => {
      // Get last message timestamp for fetching only new messages
      const cachedMessages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
      const lastMessageTime = cachedMessages.length > 0 ? cachedMessages[cachedMessages.length - 1].created_at : null;
      const cachedIds = new Set(cachedMessages.map(msg => msg.id));

      // Fetch messages (only new ones if we have cached messages)
      const url = lastMessageTime 
        ? `http://localhost:5000/api/messages?after=${lastMessageTime}`
        : 'http://localhost:5000/api/messages';
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data.length > 0) {
            const newMessages = data
              .filter(msg => !cachedIds.has(msg.id))
              .map(msg => ({
                id: msg.id,
                user: msg.senderName,
                text: msg.message,
                isNotification: false,
                created_at: msg.created_at
              }));

            // Combine cached and new messages, deduplicated
            const allMessages = [...cachedMessages, ...newMessages];
            // Keep only the last 10 unique messages
            const uniqueMessages = [];
            const seenIds = new Set();
            for (let i = allMessages.length - 1; i >= 0 && uniqueMessages.length < 10; i--) {
              if (!seenIds.has(allMessages[i].id)) {
                uniqueMessages.unshift(allMessages[i]);
                seenIds.add(allMessages[i].id);
              }
            }
            // Update state and localStorage
            setMessages(uniqueMessages);
            localStorage.setItem('chatMessages', JSON.stringify(uniqueMessages));
          }
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