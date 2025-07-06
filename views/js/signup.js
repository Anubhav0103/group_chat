// No API_BASE_URL needed - using relative URLs

// Signup functionality
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        password: document.getElementById('password').value
    };
    
    try {
        const response = await fetch(`/api/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('User registered successfully! Please login.');
            window.location.href = '/login';
        } else {
            alert(data.message || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('An error occurred during signup');
    }
}); 