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

router.post('/groups', createGroupController);
router.post('/groups/add-member', addGroupMemberController);
router.get('/groups/my', getUserGroupsController);
router.get('/groups/members', getGroupMembersController);
router.post('/groups/promote-admin', promoteMemberToAdminController);
router.post('/groups/remove-member', removeGroupMemberController);
router.delete('/groups', deleteGroupController);

module.exports = router; 