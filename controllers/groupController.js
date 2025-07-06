const { createGroup, addGroupMember, getUserGroups, getGroupMembers, getUserRoleInGroup, promoteMemberToAdmin, removeGroupMember, deleteGroup } = require('../models/groupModel');

const createGroupController = async (req, res) => {
  try {
    const { name, userId } = req.body;
    
    if (!name || !userId) {
      return res.status(400).json({ message: 'name and userId are required' });
    }
    
    const result = await createGroup(name, userId);
    const groupId = result.insertId;
    
    // Add creator as admin
    await addGroupMember(groupId, userId, 'admin');
    
    // Emit group created event to the user
    const io = req.app.get('io');
    if (io) {
      io.emit('group-created', { groupId, name, userId });
    }
    
    res.status(201).json({ message: 'Group created', groupId });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addGroupMemberController = async (req, res) => {
  try {
    const { groupId, userId, requesterId } = req.body;
    if (!groupId || !userId || !requesterId) {
      return res.status(400).json({ message: 'groupId, userId, and requesterId are required' });
    }
    
    // Only allow if requester is admin
    const role = await getUserRoleInGroup(groupId, requesterId);
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can add members' });
    }
    
    // Check if user is already a member of the group
    const existingMembers = await getGroupMembers(groupId);
    if (existingMembers.some(member => member.id === userId)) {
      return res.status(400).json({ message: 'User is already a member of this group' });
    }
    
    await addGroupMember(groupId, userId, 'member');
    
    // Emit member added event to all group members
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${groupId}`).emit('member-added', { groupId, userId });
    }
    
    res.status(201).json({ message: 'User added to group' });
  } catch (error) {
    console.error('Error adding group member:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserGroupsController = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    
    const results = await getUserGroups(userId);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error in getUserGroupsController:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getGroupMembersController = async (req, res) => {
  try {
    const { groupId } = req.query;
    if (!groupId) {
      return res.status(400).json({ message: 'groupId is required' });
    }
    
    const results = await getGroupMembers(groupId);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error getting group members:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const promoteMemberToAdminController = async (req, res) => {
  try {
    const { groupId, userId, requesterId } = req.body;
    if (!groupId || !userId || !requesterId) {
      return res.status(400).json({ message: 'groupId, userId, and requesterId are required' });
    }
    
    // Only allow if requester is admin
    const role = await getUserRoleInGroup(groupId, requesterId);
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can promote members' });
    }
    
    await promoteMemberToAdmin(groupId, userId);
    
    // Emit member promoted event to all group members
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${groupId}`).emit('member-promoted', { groupId, userId });
    }
    
    res.status(200).json({ message: 'User promoted to admin' });
  } catch (error) {
    console.error('Error promoting member:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const removeGroupMemberController = async (req, res) => {
  try {
    const { groupId, userId, requesterId } = req.body;
    if (!groupId || !userId || !requesterId) {
      return res.status(400).json({ message: 'groupId, userId, and requesterId are required' });
    }
    
    // Only allow if requester is admin
    const role = await getUserRoleInGroup(groupId, requesterId);
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }
    
    await removeGroupMember(groupId, userId);
    
    // Emit member removed event to all group members
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${groupId}`).emit('member-removed', { groupId, userId });
    }
    
    res.status(200).json({ message: 'User removed from group' });
  } catch (error) {
    console.error('Error removing group member:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteGroupController = async (req, res) => {
  try {
    const { groupId, requesterId } = req.body;
    if (!groupId || !requesterId) {
      return res.status(400).json({ message: 'groupId and requesterId are required' });
    }
    
    // Only allow if requester is admin
    const role = await getUserRoleInGroup(groupId, requesterId);
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete groups' });
    }
    
    await deleteGroup(groupId);
    
    // Emit group deleted event to all group members
    const io = req.app.get('io');
    if (io) {
      io.to(`group_${groupId}`).emit('group-deleted', { groupId });
    }
    
    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'Server error' });
  }
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