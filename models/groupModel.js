const { db } = require('../config/db');

const createGroup = async (name, createdBy) => {
  try {
    const [result] = await db.query(
      'INSERT INTO `groups` (name, created_by) VALUES (?, ?)',
      [name, createdBy]
    );
    return result;
  } catch (error) {
    throw error;
  }
};

const addGroupMember = async (groupId, userId, role = 'member') => {
  try {
    const [result] = await db.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
      [groupId, userId, role]
    );
    return result;
  } catch (error) {
    throw error;
  }
};

const getUserGroups = async (userId) => {
  try {
    const [results] = await db.query(
      `SELECT \`groups\`.id, \`groups\`.name FROM \`groups\`
       JOIN group_members ON \`groups\`.id = group_members.group_id
       WHERE group_members.user_id = ?`,
      [userId]
    );
    return results;
  } catch (error) {
    throw error;
  }
};

const getGroupMembers = async (groupId) => {
  try {
    const [results] = await db.query(
      `SELECT users.id, users.name, group_members.role FROM users
       JOIN group_members ON users.id = group_members.user_id
       WHERE group_members.group_id = ?`,
      [groupId]
    );
    return results;
  } catch (error) {
    throw error;
  }
};

const getUserRoleInGroup = async (groupId, userId) => {
  try {
    const [results] = await db.query(
      'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    return results.length > 0 ? results[0].role : null;
  } catch (error) {
    throw error;
  }
};

const promoteMemberToAdmin = async (groupId, userId) => {
  try {
    const [result] = await db.query(
      'UPDATE group_members SET role = "admin" WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    return result;
  } catch (error) {
    throw error;
  }
};

const removeGroupMember = async (groupId, userId) => {
  try {
    const [result] = await db.query(
      'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, userId]
    );
    return result;
  } catch (error) {
    throw error;
  }
};

const deleteGroup = async (groupId) => {
  try {
    // First delete all messages in the group
    await db.query('DELETE FROM messages WHERE group_id = ?', [groupId]);
    
    // Then delete all group members
    await db.query('DELETE FROM group_members WHERE group_id = ?', [groupId]);
    
    // Finally delete the group itself
    const [result] = await db.query('DELETE FROM `groups` WHERE id = ?', [groupId]);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = { 
  createGroup, 
  addGroupMember, 
  getUserGroups, 
  getGroupMembers, 
  getUserRoleInGroup, 
  promoteMemberToAdmin, 
  removeGroupMember, 
  deleteGroup 
}; 