let currentUser = null;
let currentUserId = null;
let selectedGroup = null;
let userRole = null;
let socket = null;


function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = jwt_decode(token);
            currentUser = payload.name;
            currentUserId = payload.id;
            return true;
        } catch (error) {
            localStorage.removeItem('token');
            return false;
        }
    }
    return false;
}


function requireAuth() {
    if (!checkAuth()) {
        window.location.href = '/login';
    }
}

// Initialize WebSocket connection
function initializeSocket() {
    try {
        socket = io();
        
        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
            if (!socket.connected) {
                alert('Unable to connect to server. Please refresh the page.');
            }
        }, 5000);
        
        socket.on('connect', () => {
            clearTimeout(connectionTimeout);
        });
    
    // Join user to their groups
    socket.emit('join-groups', currentUserId);
    
    // Listen for new messages
    socket.on('new-message', (data) => {
        if (selectedGroup && data.groupId === selectedGroup.id) {
            // Add the new message directly to the UI
            const messagesContainer = document.getElementById('messagesContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            messageDiv.innerHTML = `
                <div class="sender">${data.senderName}</div>
                <div class="text">${data.message}</div>
            `;
            messagesContainer.appendChild(messageDiv);
            
            // Scroll to bottom with a small delay to ensure DOM is updated
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 10);
        }
    });
    
    // Listen for group updates
    socket.on('group-created', (data) => {
        if (data.userId === Number(currentUserId)) {
            // Reload all groups to ensure consistency
            loadGroups();
        }
    });
    
    // Listen for member updates
    socket.on('member-added', (data) => {
        if (selectedGroup && data.groupId === selectedGroup.id) {
            loadMembers();
        }
    });
    
    socket.on('member-removed', (data) => {
        if (selectedGroup && data.groupId === selectedGroup.id) {
            loadMembers();
        }
    });
    
    socket.on('member-promoted', (data) => {
        if (selectedGroup && data.groupId === selectedGroup.id) {
            loadMembers();
        }
    });
    
    // Listen for group deletion
    socket.on('group-deleted', (data) => {
        if (selectedGroup && data.groupId === selectedGroup.id) {
            selectedGroup = null;
            document.getElementById('currentGroupName').textContent = 'Select a group to start chatting';
            document.getElementById('deleteGroupBtn').style.display = 'none';
            document.getElementById('messagesContainer').innerHTML = '';
            document.getElementById('membersList').innerHTML = '';
            document.getElementById('inviteSection').style.display = 'none';
        }
        loadGroups();
    });
    
    // Listen for file uploads
    socket.on('file_uploaded', (data) => {
        if (selectedGroup && data.file.group_id === selectedGroup.id) {
            addFileToChat(data.file);
        }
    });
    
    // Listen for file deletions
    socket.on('file_deleted', (data) => {
        if (selectedGroup && data.groupId === selectedGroup.id) {
            loadMessagesAndFiles(selectedGroup.id);
        }
    });
    
    // Handle connection events
    socket.on('connect', () => {
        // Re-join groups after reconnection
        socket.emit('join-groups', currentUserId);
        if (selectedGroup) {
            socket.emit('join_group', { groupId: selectedGroup.id });
        }
    });
    
    socket.on('disconnect', (reason) => {
    });
    
    socket.on('connect_error', (error) => {
    });
    
    } catch (error) {
        alert('Failed to connect to server. Please refresh the page.');
    }
}

// Initialize chat functionality
function initializeChat() {
    initializeSocket();
    displayCurrentUser();
    loadGroups();
    
    // Event listeners
    document.getElementById('createGroupForm').addEventListener('submit', createGroup);
    document.getElementById('messageForm').addEventListener('submit', sendMessage);
    document.getElementById('inviteForm').addEventListener('submit', inviteUser);
    document.getElementById('deleteGroupBtn').addEventListener('click', deleteGroup);
    
    // File upload event listeners
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    document.getElementById('removeFile').addEventListener('click', removeSelectedFile);
}

// Display current user information
function displayCurrentUser() {
    const userDisplay = document.getElementById('currentUserDisplay');
    if (currentUser) {
        userDisplay.textContent = `Logged in as: ${currentUser}`;
    } else {
        userDisplay.textContent = 'Not logged in';
    }
}

async function loadGroups() {
    try {
        const response = await fetch(`/api/groups/my?userId=${currentUserId}`);
        
        if (!response.ok) {
            return;
        }
        
        const groups = await response.json();
        
        if (Array.isArray(groups)) {
            displayGroups(groups);
            
            // Auto-select first group if none selected
            if (!selectedGroup && groups.length > 0) {
                selectGroup(groups[0]);
                // Ensure members are loaded for auto-selected group with longer delay for WebSocket
                setTimeout(() => {
                    if (selectedGroup) {
                        loadMembers();
                    }
                }, 500);
            }
        }
    } catch (error) {
    }
}

function displayGroups(groups) {
    const groupsList = document.getElementById('groupsList');
    groupsList.innerHTML = '';
    
    // Remove duplicates based on group ID
    const uniqueGroups = groups.filter((group, index, self) => 
        index === self.findIndex(g => g.id === group.id)
    );
    
    uniqueGroups.forEach(group => {
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
    // Leave previous group room if any
    if (selectedGroup && socket) {
        socket.emit('leave-group', selectedGroup.id);
    }
    
    selectedGroup = group;
    document.getElementById('currentGroupName').textContent = group.name;
    
    // Join new group room
    if (socket) {
        socket.emit('join_group', { groupId: group.id });
    }
    
    loadMessagesAndFiles(); // Load messages and files together
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
        const requestBody = { name: groupName, userId: Number(currentUserId) };
        
        const response = await fetch(`/api/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const data = await response.json();
            alert(data.message || `Failed to create group (${response.status})`);
            return;
        }
        
        const data = await response.json();
        document.getElementById('groupName').value = '';
        alert('Group created successfully!');
        // Don't reload groups here - WebSocket will handle it
    } catch (error) {
        alert('An error occurred while creating the group');
    }
}

async function loadMessagesAndFiles() {
    if (!selectedGroup) return;
    
    try {
        // Load messages and files in parallel
        const [messagesResponse, filesResponse] = await Promise.all([
            fetch(`/api/messages?groupId=${selectedGroup.id}&userId=${currentUserId}`),
            fetch(`/api/files/group/${selectedGroup.id}`)
        ]);
        
        const messages = await messagesResponse.json();
        const filesData = await filesResponse.json();
        
        // Combine messages and files into a single timeline
        const timeline = [];
        
        // Add messages to timeline
        if (Array.isArray(messages)) {
            messages.forEach(message => {
                timeline.push({
                    type: 'message',
                    data: message,
                    timestamp: new Date(message.created_at)
                });
            });
        }
        
        // Add files to timeline
        if (filesData.files && Array.isArray(filesData.files)) {
            filesData.files.forEach(file => {
                timeline.push({
                    type: 'file',
                    data: file,
                    timestamp: new Date(file.created_at)
                });
            });
        }
        
        // Sort timeline by timestamp
        timeline.sort((a, b) => a.timestamp - b.timestamp);
        
        // Display the unified timeline
        displayTimeline(timeline);
        
    } catch (error) {
    }
}

function displayTimeline(timeline) {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '';
    
    timeline.forEach(item => {
        if (item.type === 'message') {
            // Display message
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            messageDiv.innerHTML = `
                <div class="sender">${item.data.senderName}</div>
                <div class="text">${item.data.message}</div>
            `;
            messagesContainer.appendChild(messageDiv);
        } else if (item.type === 'file') {
            // Check if current user is the uploader
            const isUploader = item.data.uploaded_by === Number(currentUserId);
            
            // Display file
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            messageDiv.innerHTML = `
                <div class="sender">${item.data.uploaded_by_name}</div>
                <div class="text">
                    <div class="file-message">
                        <span class="file-icon">📎</span>
                        <span class="file-name">${item.data.original_name}</span>
                        ${!isUploader ? `<button class="download-btn" onclick="downloadFile(${item.data.id})">Download</button>` : ''}
                    </div>
                </div>
            `;
            messagesContainer.appendChild(messageDiv);
        }
    });
    
    // Scroll to bottom with a small delay to ensure DOM is updated
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 10);
}

async function sendMessage(e) {
    e.preventDefault();
    
    if (!selectedGroup) {
        alert('Please select a group first');
        return;
    }
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    // Check if there's either a message or a file to send
    if (!message && !selectedFile) {
        return; // Nothing to send
    }
    
    // If there's a file selected, upload it first
    if (selectedFile) {
        const uploadSuccess = await uploadFile();
        if (!uploadSuccess) {
            return; // Upload failed, don't clear the file
        }
        // File uploaded successfully, clear it now
        removeSelectedFile();
    }
    
    // Send text message if there is one
    if (message) {
        try {
            const response = await fetch(`/api/messages`, {
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
                // Don't reload messages here - WebSocket will handle it
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to send message');
            }
        } catch (error) {
            alert('An error occurred while sending the message');
        }
    }
}

async function loadMembers() {
    if (!selectedGroup) return;
    
    try {
        const response = await fetch(`/api/groups/members?groupId=${selectedGroup.id}`);
        
        if (!response.ok) {
            return;
        }
        
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
        const userResponse = await fetch(`/api/users/by-email?email=${encodeURIComponent(email)}`);
        const user = await userResponse.json();
        
        if (!user || !user.id) {
            alert('User not found');
            return;
        }
        
        // Add user to group
        const response = await fetch(`/api/groups/add-member`, {
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
            // Don't reload members here - WebSocket will handle it
        } else {
            alert(data.message || 'Failed to invite user');
        }
    } catch (error) {
        alert('An error occurred while inviting the user');
    }
}

async function promoteMember(userId) {
    if (!selectedGroup || userRole !== 'admin') return;
    
    try {
        const response = await fetch(`/api/groups/promote-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groupId: selectedGroup.id,
                userId: userId,
                requesterId: Number(currentUserId)
            })
        });
        
        if (response.ok) {
            // Don't reload members here - WebSocket will handle it
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to promote member');
        }
    } catch (error) {
        alert('An error occurred while promoting the member');
    }
}

async function removeMember(userId) {
    if (!selectedGroup || userRole !== 'admin') return;
    
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
        const response = await fetch(`/api/groups/remove-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groupId: selectedGroup.id,
                userId: userId,
                requesterId: Number(currentUserId)
            })
        });
        
        if (response.ok) {
            // Don't reload members here - WebSocket will handle it
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to remove member');
        }
    } catch (error) {
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
        const response = await fetch(`/api/groups?groupId=${selectedGroup.id}&requesterId=${currentUserId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
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
        } else {
            alert(data.message || 'Failed to delete group');
        }
    } catch (error) {
        alert('An error occurred while deleting the group');
    }
}

// Logout functionality
function logout() {
    if (socket) {
        socket.disconnect();
    }
    localStorage.removeItem('token');
    window.location.href = '/login';
}

// File upload functions
let selectedFile = null;

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        // Check file size (100MB limit)
        if (file.size > 100 * 1024 * 1024) {
            alert('File size must be less than 100MB');
            event.target.value = '';
            return;
        }
        
        selectedFile = file;
        showFilePreview(file);
    }
}

function showFilePreview(file) {
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    
    fileName.textContent = file.name;
    filePreview.style.display = 'block';
}

function removeSelectedFile() {
    selectedFile = null;
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('fileInput').value = '';
}

async function uploadFile() {
    if (!selectedFile || !selectedGroup) {
        return false;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('groupId', selectedGroup.id);
    formData.append('userId', currentUserId);
    formData.append('userName', currentUser);

    try {
        const response = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            return true;
        } else {
            alert('File upload failed: ' + result.message);
            return false;
        }
    } catch (error) {
        alert('File upload failed: ' + error.message);
        return false;
    }
}

function downloadFile(fileId) {
    fetch(`/api/files/download/${fileId}`)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = ''; // Let the browser determine filename
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    })
    .catch(error => {
        alert('Download failed: ' + error.message);
    });
}

// Helper function to add file to chat
function addFileToChat(file) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    // Check if current user is the uploader
    const isUploader = file.uploaded_by === Number(currentUserId);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.innerHTML = `
        <div class="sender">${file.uploaded_by_name}</div>
        <div class="text">
            <div class="file-message">
                <span class="file-icon">📎</span>
                <span class="file-name">${file.original_name}</span>
                ${!isUploader ? `<button class="download-btn" onclick="downloadFile(${file.id})">Download</button>` : ''}
            </div>
        </div>
    `;
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom with a small delay to ensure DOM is updated
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 10);
}

// Initialize when page loads
requireAuth();
initializeChat(); 
window.promoteMember = promoteMember;
window.removeMember = removeMember;
window.deleteGroup = deleteGroup; 