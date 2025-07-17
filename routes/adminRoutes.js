const express = require('express');
const router = express.Router();
const CronService = require('../services/cronService');
const ArchiveService = require('../services/archiveService');

// Manual trigger for archiving (for testing/admin use)
router.post('/api/admin/archive-messages', async (req, res) => {
    try {
        const result = await CronService.runArchivingNow();
        res.json({ 
            success: true, 
            message: 'Archiving completed successfully',
            result 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Archiving failed',
            error: error.message 
        });
    }
});

// Get archived message count for a group
router.get('/api/admin/archived-count/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const messageCount = await ArchiveService.getArchivedMessageCount(groupId);
        const fileCount = await ArchiveService.getArchivedFileCount(groupId);
        res.json({ 
            success: true, 
            groupId: parseInt(groupId),
            archivedMessages: messageCount,
            archivedFiles: fileCount
        });
    } catch (error) {
        console.error('Error getting archived count:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get archived count',
            error: error.message 
        });
    }
});

module.exports = router; 