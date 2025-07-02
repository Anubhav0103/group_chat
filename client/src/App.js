import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Signup from "./Signup";
import Login from "./Login";
import GroupChat from "./GroupChat";

function App() {
  const [currentUser, setCurrentUser] = useState("");

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setCurrentUser={setCurrentUser} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chat" element={<GroupChat currentUser={currentUser} />} />
      </Routes>
    </Router>
  );
}

export default App;