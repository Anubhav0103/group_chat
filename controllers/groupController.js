const { createGroup, addGroupMember, getUserGroups, getGroupMembers, getUserRoleInGroup, promoteMemberToAdmin, removeGroupMember, deleteGroup } = require('../models/groupModel');

const createGroupController = (req, res) => {
  const { name, userId } = req.body;
  
  if (!name || !userId) {
    return res.status(400).json({ message: 'name and userId are required' });
  }
  
  createGroup(name, userId, (err, result) => {
    if (err) {
      console.error('Error creating group:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    
    const groupId = result.insertId;
    
    // Add creator as admin
    addGroupMember(groupId, userId, 'admin', (err2) => {
      if (err2) {
        console.error('Error adding group member:', err2);
        return res.status(500).json({ message: 'Server error' });
      }
      
      // Emit group created event to the user
      const io = req.app.get('io');
      if (io) {
        io.emit('group-created', { groupId, name, userId });
      }
      
      res.status(201).json({ message: 'Group created', groupId });
    });
  });
};

const addGroupMemberController = (req, res) => {
  const { groupId, userId, requesterId } = req.body;
  if (!groupId || !userId || !requesterId) {
    return res.status(400).json({ message: 'groupId, userId, and requesterId are required' });
  }
  // Only allow if requester is admin
  getUserRoleInGroup(groupId, requesterId, (err, role) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (role !== 'admin') return res.status(403).json({ message: 'Only admins can add members' });
    addGroupMember(groupId, userId, 'member', (err2) => {
      if (err2) return res.status(500).json({ message: 'Server error' });
      
      // Emit member added event to all group members
      const io = req.app.get('io');
      if (io) {
        io.to(`group-${groupId}`).emit('member-added', { groupId, userId });
      }
      
      res.status(201).json({ message: 'User added to group' });
    });
  });
};

const getUserGroupsController = (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }
  getUserGroups(userId, (err, results) => {
    if (err) {
      console.error('Error in getUserGroupsController:', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
    res.status(200).json(results);
  });
};

const getGroupMembersController = (req, res) => {
  const { groupId } = req.query;
  if (!groupId) {
    return res.status(400).json({ message: 'groupId is required' });
  }
  getGroupMembers(groupId, (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    res.status(200).json(results);
  });
};

const promoteMemberToAdminController = (req, res) => {
  const { groupId, userId, requesterId } = req.body;
  if (!groupId || !userId || !requesterId) {
    return res.status(400).json({ message: 'groupId, userId, and requesterId are required' });
  }
  // Only allow if requester is admin
  getUserRoleInGroup(groupId, requesterId, (err, role) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (role !== 'admin') return res.status(403).json({ message: 'Only admins can promote members' });
    promoteMemberToAdmin(groupId, userId, (err2) => {
      if (err2) return res.status(500).json({ message: 'Server error' });
      
      // Emit member promoted event to all group members
      const io = req.app.get('io');
      if (io) {
        io.to(`group-${groupId}`).emit('member-promoted', { groupId, userId });
      }
      
      res.status(200).json({ message: 'User promoted to admin' });
    });
  });
};

const removeGroupMemberController = (req, res) => {
  const { groupId, userId, requesterId } = req.body;
  if (!groupId || !userId || !requesterId) {
    return res.status(400).json({ message: 'groupId, userId, and requesterId are required' });
  }
  // Only allow if requester is admin
  getUserRoleInGroup(groupId, requesterId, (err, role) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (role !== 'admin') return res.status(403).json({ message: 'Only admins can remove members' });
    removeGroupMember(groupId, userId, (err2) => {
      if (err2) return res.status(500).json({ message: 'Server error' });
      
      // Emit member removed event to all group members
      const io = req.app.get('io');
      if (io) {
        io.to(`group-${groupId}`).emit('member-removed', { groupId, userId });
      }
      
      res.status(200).json({ message: 'User removed from group' });
    });
  });
};

const deleteGroupController = (req, res) => {
  const { groupId, requesterId } = req.body;
  if (!groupId || !requesterId) {
    return res.status(400).json({ message: 'groupId and requesterId are required' });
  }
  // Only allow if requester is admin
  getUserRoleInGroup(groupId, requesterId, (err, role) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (role !== 'admin') return res.status(403).json({ message: 'Only admins can delete groups' });
    deleteGroup(groupId, (err2) => {
      if (err2) return res.status(500).json({ message: 'Server error' });
      
      // Emit group deleted event to all group members
      const io = req.app.get('io');
      if (io) {
        io.to(`group-${groupId}`).emit('group-deleted', { groupId });
      }
      
      res.status(200).json({ message: 'Group deleted successfully' });
    });
  });
};

module.exports = {
  createGroupController,
  addGroupMemberController,
  getUserGroupsController,
  getGroupMembersController,
  promoteMemberToAdminController,
  removeGroupMemberController,
  deleteGroupController
}; 