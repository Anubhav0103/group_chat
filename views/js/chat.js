// API Configuration
const API_BASE_URL = 'http://localhost:5000';

// Global variables
let currentUser = null;
let currentUserId = null;
let selectedGroup = null;
let userRole = null;

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (token && userId && userName) {
        currentUser = userName;
        currentUserId = userId;
        return true;
    }
    return false;
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!checkAuth()) {
        window.location.href = 'login.html';
    }
}

// Initialize chat functionality
function initializeChat() {
    loadGroups();
    setInterval(loadGroups, 2000);
    setInterval(loadMessages, 2000);
    setInterval(loadMembers, 2000);
    
    // Event listeners
    document.getElementById('createGroupForm').addEventListener('submit', createGroup);
    document.getElementById('messageForm').addEventListener('submit', sendMessage);
    document.getElementById('inviteForm').addEventListener('submit', inviteUser);
    document.getElementById('deleteGroupBtn').addEventListener('click', deleteGroup);
}

async function loadGroups() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/groups/my?userId=${currentUserId}`);
        const groups = await response.json();
        
        if (Array.isArray(groups)) {
            displayGroups(groups);
            
            // Auto-select first group if none selected
            if (!selectedGroup && groups.length > 0) {
                selectGroup(groups[0]);
            }
        }
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

function displayGroups(groups) {
    const groupsList = document.getElementById('groupsList');
    groupsList.innerHTML = '';
    
    groups.forEach(group => {
        const groupItem = document.createElement('div');
        groupItem.className = 'group-item';
        if (selectedGroup && selectedGroup.id === group.id) {
            groupItem.classList.add('active');
        }
        groupItem.textContent = group.name;
        groupItem.onclick = (event) => selectGroup(group, event);
        groupsList.appendChild(groupItem);
    });
}

function selectGroup(group, event) {
    selectedGroup = group;
    document.getElementById('currentGroupName').textContent = group.name;
    loadMessages();
    loadMembers();
    
    // Update active state in UI
    document.querySelectorAll('.group-item').forEach(item => {
        item.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Show/hide delete button based on user role
    updateDeleteButtonVisibility();
}

async function createGroup(e) {
    e.preventDefault();
    
    const groupName = document.getElementById('groupName').value;
    if (!groupName.trim()) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: groupName, userId: Number(currentUserId) })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('groupName').value = '';
            loadGroups();
        } else {
            alert(data.message || 'Failed to create group');
        }
    } catch (error) {
        console.error('Error creating group:', error);
        alert('An error occurred while creating the group');
    }
}

async function loadMessages() {
    if (!selectedGroup) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages?groupId=${selectedGroup.id}&userId=${currentUserId}`);
        const messages = await response.json();
        
        if (Array.isArray(messages)) {
            displayMessages(messages);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function displayMessages(messages) {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';
    
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.innerHTML = `
            <div class="sender">${message.senderName}</div>
            <div class="text">${message.message}</div>
        `;
        messagesContainer.appendChild(messageDiv);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage(e) {
    e.preventDefault();
    
    if (!selectedGroup) {
        alert('Please select a group first');
        return;
    }
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: Number(currentUserId),
                message: message,
                groupId: selectedGroup.id
            })
        });
        
        if (response.ok) {
            messageInput.value = '';
            loadMessages();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to send message');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('An error occurred while sending the message');
    }
}

async function loadMembers() {
    if (!selectedGroup) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/groups/members?groupId=${selectedGroup.id}`);
        const members = await response.json();
        
        if (Array.isArray(members)) {
            displayMembers(members);
            
            // Check if current user is admin
            const currentMember = members.find(m => m.id === Number(currentUserId));
            userRole = currentMember ? currentMember.role : null;
            
            // Show/hide invite section for admins
            const inviteSection = document.getElementById('inviteSection');
            if (userRole === 'admin') {
                inviteSection.style.display = 'block';
            } else {
                inviteSection.style.display = 'none';
            }
            
            // Update delete button visibility
            updateDeleteButtonVisibility();
        }
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

function displayMembers(members) {
    const membersList = document.getElementById('membersList');
    membersList.innerHTML = '';
    
    members.forEach(member => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'member-item';
        
        const isCurrentUser = member.id === Number(currentUserId);
        const canManage = userRole === 'admin' && !isCurrentUser;
        
        memberDiv.innerHTML = `
            <div>
                <div class="name">${member.name}</div>
                <span class="role ${member.role === 'admin' ? 'admin-role' : ''}">${member.role}</span>
            </div>
            ${canManage ? `
                <div class="member-actions">
                    ${member.role !== 'admin' ? `<button class="promote-btn" onclick="promoteMember(${member.id})">Promote</button>` : ''}
                    <button class="remove-btn" onclick="removeMember(${member.id})">Remove</button>
                </div>
            ` : ''}
        `;
        
        membersList.appendChild(memberDiv);
    });
}

async function inviteUser(e) {
    e.preventDefault();
    
    if (!selectedGroup || userRole !== 'admin') return;
    
    const email = document.getElementById('inviteEmail').value.trim();
    if (!email) return;
    
    try {
        // First find user by email
        const userResponse = await fetch(`${API_BASE_URL}/api/users/by-email?email=${encodeURIComponent(email)}`);
        const user = await userResponse.json();
        
        if (!user || !user.id) {
            alert('User not found');
            return;
        }
        
        // Add user to group
        const response = await fetch(`${API_BASE_URL}/api/groups/add-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groupId: selectedGroup.id,
                userId: user.id,
                requesterId: Number(currentUserId)
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('inviteEmail').value = '';
            alert('User invited successfully!');
            loadMembers();
        } else {
            alert(data.message || 'Failed to invite user');
        }
    } catch (error) {
        console.error('Error inviting user:', error);
        alert('An error occurred while inviting the user');
    }
}

async function promoteMember(userId) {
    if (!selectedGroup || userRole !== 'admin') return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/groups/promote-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groupId: selectedGroup.id,
                userId: userId,
                requesterId: Number(currentUserId)
            })
        });
        
        if (response.ok) {
            loadMembers();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to promote member');
        }
    } catch (error) {
        console.error('Error promoting member:', error);
        alert('An error occurred while promoting the member');
    }
}

async function removeMember(userId) {
    if (!selectedGroup || userRole !== 'admin') return;
    
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/groups/remove-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groupId: selectedGroup.id,
                userId: userId,
                requesterId: Number(currentUserId)
            })
        });
        
        if (response.ok) {
            loadMembers();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to remove member');
        }
    } catch (error) {
        console.error('Error removing member:', error);
        alert('An error occurred while removing the member');
    }
}

// Update delete button visibility based on user role
function updateDeleteButtonVisibility() {
    const deleteBtn = document.getElementById('deleteGroupBtn');
    if (userRole === 'admin' && selectedGroup) {
        deleteBtn.style.display = 'block';
    } else {
        deleteBtn.style.display = 'none';
    }
}

// Delete group functionality
async function deleteGroup() {
    if (!selectedGroup || userRole !== 'admin') return;
    
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone and will remove all messages and members.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/groups`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groupId: selectedGroup.id,
                requesterId: Number(currentUserId)
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Group deleted successfully!');
            selectedGroup = null;
            document.getElementById('currentGroupName').textContent = 'Select a group to start chatting';
            document.getElementById('deleteGroupBtn').style.display = 'none';
            document.getElementById('messagesContainer').innerHTML = '';
            document.getElementById('membersList').innerHTML = '';
            document.getElementById('inviteSection').style.display = 'none';
            loadGroups(); // Refresh groups list
        } else {
            alert(data.message || 'Failed to delete group');
        }
    } catch (error) {
        console.error('Error deleting group:', error);
        alert('An error occurred while deleting the group');
    }
}

// Logout functionality
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
}

// Initialize when page loads
requireAuth();
initializeChat(); 