// API Configuration
const API_BASE_URL = 'http://localhost:5000';

// Login functionality
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Decode JWT to get user info
            const tokenParts = data.token.split('.');
            const payload = JSON.parse(atob(tokenParts[1]));
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', payload.id);
            localStorage.setItem('userName', payload.name);
            
            window.location.href = '/chat';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
}); 