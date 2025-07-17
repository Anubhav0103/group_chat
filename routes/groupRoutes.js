const express = require('express');
const router = express.Router();
const {
  createGroupController,
  addGroupMemberController,
  getUserGroupsController,
  getGroupMembersController,
  promoteMemberToAdminController,
  removeGroupMemberController,
  deleteGroupController
} = require('../controllers/groupController');

router.post('/api/groups', createGroupController);
router.post('/api/groups/add-member', addGroupMemberController);
router.get('/api/groups/my', getUserGroupsController);
router.get('/api/groups/members', getGroupMembersController);
router.post('/api/groups/promote-admin', promoteMemberToAdminController);
router.post('/api/groups/remove-member', removeGroupMemberController);
router.delete('/api/groups', deleteGroupController);

module.exports = router; 