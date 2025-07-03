import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import Signup from "./Signup";
import Login from "./Login";
import GroupChat from "./GroupChat";

function Sidebar({ groups, onSelectGroup, onCreateGroup, selectedGroupId }) {
  const [groupName, setGroupName] = useState("");

  const handleCreate = (e) => {
    e.preventDefault();
    if (groupName.trim()) {
      onCreateGroup(groupName);
      setGroupName("");
    }
  };

  return (
    <div style={{ width: 220, borderRight: "1px solid #ccc", padding: 10, height: "100vh" }}>
      <h3>Groups</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {groups.map((g) => (
          <li key={g.id} style={{ margin: "8px 0" }}>
            <button
              style={{
                background: g.id === selectedGroupId ? "#e0e0e0" : "#fff",
                border: "none",
                width: "100%",
                textAlign: "left",
                padding: 6,
                cursor: "pointer"
              }}
              onClick={() => onSelectGroup(g)}
            >
              {g.name}
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreate} style={{ marginTop: 20 }}>
        <input
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          placeholder="New group name"
          style={{ width: "100%", marginBottom: 6 }}
        />
        <button type="submit" style={{ width: "100%" }}>Create Group</button>
      </form>
    </div>
  );
}

function ProtectedChat({ currentUser, currentUserId, groups, selectedGroup }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!currentUser || !currentUserId) {
      navigate("/");
    }
  }, [currentUser, currentUserId, navigate]);
  return <GroupChat currentUser={currentUser} currentUserId={currentUserId} groups={groups} selectedGroup={selectedGroup} />;
}

function MainLayout({ currentUser, currentUserId, groups, selectedGroup, setSelectedGroup, handleCreateGroup, handleSelectGroup, children }) {
  const location = useLocation();
  const showSidebar = currentUser && currentUserId && location.pathname !== '/' && location.pathname !== '/signup';
  return (
    <div style={{ display: "flex" }}>
      {showSidebar && (
        <Sidebar
          groups={groups}
          onSelectGroup={handleSelectGroup}
          onCreateGroup={handleCreateGroup}
          selectedGroupId={selectedGroup ? selectedGroup.id : null}
        />
      )}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('userName') || "");
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem('userId') || null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Fetch groups for the user every second
  useEffect(() => {
    if (!currentUserId) return;
    const fetchGroups = () => {
      fetch(`http://localhost:5000/api/groups/my?userId=${currentUserId}`)
        .then(res => res.json())
        .then(data => {
          setGroups(data);
          if ((!selectedGroup || !data.find(g => g.id === selectedGroup.id)) && data.length > 0) {
            setSelectedGroup(data[0]);
          }
          if (data.length === 0) {
            setSelectedGroup(null);
          }
        });
    };
    fetchGroups();
    const interval = setInterval(fetchGroups, 1000);
    return () => clearInterval(interval);
  }, [currentUserId, selectedGroup]);

  // Create a new group
  const handleCreateGroup = (groupName) => {
    fetch('http://localhost:5000/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: groupName, userId: Number(currentUserId) })
    })
      .then(res => res.json())
      .then(data => {
        if (data.groupId) {
          // Refetch groups
          fetch(`http://localhost:5000/api/groups/my?userId=${currentUserId}`)
            .then(res => res.json())
            .then(data => {
              setGroups(data);
              setSelectedGroup(data.find(g => g.id === data.groupId) || data[0]);
            });
        }
      });
  };

  // Select a group
  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
  };

  return (
    <Router>
      <MainLayout
        currentUser={currentUser}
        currentUserId={currentUserId}
        groups={groups}
        selectedGroup={selectedGroup}
        setSelectedGroup={setSelectedGroup}
        handleCreateGroup={handleCreateGroup}
        handleSelectGroup={handleSelectGroup}
      >
        <Routes>
          <Route path="/" element={<Login setCurrentUser={setCurrentUser} setCurrentUserId={setCurrentUserId} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat" element={<ProtectedChat currentUser={currentUser} currentUserId={currentUserId} groups={groups} selectedGroup={selectedGroup} />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;