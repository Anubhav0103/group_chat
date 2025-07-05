import React, { useState, useEffect } from "react";

function GroupChat({ currentUser, currentUserId, selectedGroup }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [userRole, setUserRole] = useState(null);

  // Fetch group members every second
  useEffect(() => {
    if (!selectedGroup || !currentUserId) return;
    const fetchMembers = () => {
      fetch(`http://54.252.209.202:5000/api/groups/members?groupId=${selectedGroup.id}`)
        .then(res => res.json())
        .then(data => {
          setGroupMembers(data);
          const me = data.find(u => u.id === Number(currentUserId));
          setUserRole(me ? me.role : null);
        });
    };
    fetchMembers();
    const interval = setInterval(fetchMembers, 1000);
    return () => clearInterval(interval);
  }, [selectedGroup, currentUserId]);

  // Load cached messages for the selected group from localStorage on mount or group change
  useEffect(() => {
    if (!selectedGroup) return;
    const cachedMessages = localStorage.getItem(`chatMessages_${selectedGroup.id}`);
    if (cachedMessages) {
      setMessages(JSON.parse(cachedMessages));
    } else {
      setMessages([]);
    }
  }, [selectedGroup]);

  // Fetch messages for the selected group every 1 second
  useEffect(() => {
    if (!selectedGroup) return;
    const fetchData = () => {
      // Get last message timestamp for fetching only new messages
      const cachedMessages = JSON.parse(localStorage.getItem(`chatMessages_${selectedGroup.id}`) || '[]');
      const lastMessageTime = cachedMessages.length > 0 ? cachedMessages[cachedMessages.length - 1].created_at : null;
      const cachedIds = new Set(cachedMessages.map(msg => msg.id));

      // Fetch messages for the group
      const url = lastMessageTime 
        ? `http://54.252.209.202:5000/api/messages?after=${lastMessageTime}&groupId=${selectedGroup.id}&userId=${currentUserId}`
        : `http://54.252.209.202:5000/api/messages?groupId=${selectedGroup.id}&userId=${currentUserId}`;
      
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
            localStorage.setItem(`chatMessages_${selectedGroup.id}`, JSON.stringify(uniqueMessages));
          }
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [selectedGroup, currentUserId]);

  // Invite/add user to group by email (only for admins)
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !selectedGroup) return;
    // Find user by email
    const res = await fetch(`http://54.252.209.202:5000/api/users/by-email?email=${encodeURIComponent(inviteEmail)}`);
    const user = await res.json();
    if (!user || !user.id) {
      alert('User not found');
      return;
    }
    // Add user to group (send requesterId)
    await fetch('http://54.252.209.202:5000/api/groups/add-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: selectedGroup.id, userId: user.id, requesterId: Number(currentUserId) })
    });
    setInviteEmail("");
  };

  // Promote member to admin (only for admins)
  const handlePromote = async (userId) => {
    if (!selectedGroup) return;
    await fetch('http://54.252.209.202:5000/api/groups/promote-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: selectedGroup.id, userId, requesterId: Number(currentUserId) })
    });
  };

  // Remove member to admin (only for admins)
  const handleRemove = async (userId) => {
    if (!selectedGroup) return;
    await fetch('http://54.252.209.202:5000/api/groups/remove-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: selectedGroup.id, userId, requesterId: Number(currentUserId) })
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (input.trim() && selectedGroup) {
      setMessages((prev) => [...prev, { user: currentUser, text: input }]);
      // Send message to backend
      try {
        await fetch('http://54.252.209.202:5000/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: Number(currentUserId), message: input, groupId: selectedGroup.id }),
        });
      } catch (err) {
        // Optionally handle error
      }
      setInput("");
    }
  };

  if (!selectedGroup) {
    return <div style={{ padding: 20 }}>Select a group to start chatting.</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Group: {selectedGroup.name}</h2>
      <div>
        <strong>Members:</strong>
        <ul>
          {groupMembers.map((u) => (
            <li key={u.id}>
              {u.name} {u.role === 'admin' ? <span style={{ color: 'green' }}>(admin)</span> : null}
              {userRole === 'admin' && u.id !== Number(currentUserId) && (
                <>
                  {u.role !== 'admin' && (
                    <button style={{ marginLeft: 8 }} onClick={() => handlePromote(u.id)}>Promote to admin</button>
                  )}
                  <button style={{ marginLeft: 8, color: 'red' }} onClick={() => handleRemove(u.id)}>Remove</button>
                </>
              )}
            </li>
          ))}
        </ul>
        {userRole === 'admin' && (
          <form onSubmit={handleInvite} style={{ marginBottom: 20 }}>
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="Invite user by email"
              style={{ marginRight: 8 }}
            />
            <button type="submit">Invite</button>
          </form>
        )}
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