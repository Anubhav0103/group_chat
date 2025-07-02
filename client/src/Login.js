import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login({ setCurrentUser }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message);
      } else {
        setCurrentUser(form.email);
        navigate('/chat');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <div>
        <label>Email:</label>
        <input name="email" value={form.email} onChange={handleChange} required />
      </div>
      <div>
        <label>Password:</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} required />
      </div>
      <button type="submit">Login</button>
      <div style={{ marginTop: '1em' }}>
        <span>New user? </span>
        <Link to="/signup">Sign up</Link>
      </div>
    </form>
  );
}

export default Login; 