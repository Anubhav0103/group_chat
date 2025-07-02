import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import Signup from "./Signup";
import Login from "./Login";
import GroupChat from "./GroupChat";

function ProtectedChat({ currentUser, currentUserId }) {
  const navigate = useNavigate();
  React.useEffect(() => {
    if (!currentUser || !currentUserId) {
      navigate("/");
    }
  }, [currentUser, currentUserId, navigate]);
  return <GroupChat currentUser={currentUser} currentUserId={currentUserId} />;
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('userName') || "");
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem('userId') || null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setCurrentUser={setCurrentUser} setCurrentUserId={setCurrentUserId} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chat" element={<ProtectedChat currentUser={currentUser} currentUserId={currentUserId} />} />
      </Routes>
    </Router>
  );
}

export default App;