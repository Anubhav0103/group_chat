const db = require('../config/db');

const createGroup = (name, createdBy, callback) => {
  db.query(
    'INSERT INTO groups (name, created_by) VALUES (?, ?)',
    [name, createdBy],
    callback
  );
};

const addGroupMember = (groupId, userId, role = 'member', callback) => {
  db.query(
    'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
    [groupId, userId, role],
    callback
  );
};

const getUserGroups = (userId, callback) => {
  db.query(
    `SELECT groups.id, groups.name FROM groups
     JOIN group_members ON groups.id = group_members.group_id
     WHERE group_members.user_id = ?`,
    [userId],
    callback
  );
};

const getGroupMembers = (groupId, callback) => {
  db.query(
    `SELECT users.id, users.name, group_members.role FROM users
     JOIN group_members ON users.id = group_members.user_id
     WHERE group_members.group_id = ?`,
    [groupId],
    callback
  );
};

const getUserRoleInGroup = (groupId, userId, callback) => {
  db.query(
    'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
    [groupId, userId],
    (err, results) => {
      if (err) return callback(err);
      if (!results.length) return callback(null, null);
      callback(null, results[0].role);
    }
  );
};

const promoteMemberToAdmin = (groupId, userId, callback) => {
  db.query(
    'UPDATE group_members SET role = "admin" WHERE group_id = ? AND user_id = ?',
    [groupId, userId],
    callback
  );
};

const removeGroupMember = (groupId, userId, callback) => {
  db.query(
    'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
    [groupId, userId],
    callback
  );
};

module.exports = { createGroup, addGroupMember, getUserGroups, getGroupMembers, getUserRoleInGroup, promoteMemberToAdmin, removeGroupMember }; 