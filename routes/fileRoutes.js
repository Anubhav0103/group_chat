const express = require('express');
const multer = require('multer');
const FileController = require('../controllers/fileController');

const router = express.Router();

// Configure multer for memory storage (for S3 upload)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept all file types
        cb(null, true);
    }
});

// Upload file
router.post('/api/files/upload', upload.single('file'), FileController.uploadFile);

// Get files by group
router.get('/api/files/group/:groupId', FileController.getGroupFiles);

// Download file
router.get('/api/files/download/:fileId', FileController.downloadFile);

// Delete file
router.delete('/api/files/:fileId', FileController.deleteFile);

module.exports = router; 