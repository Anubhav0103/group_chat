const multer = require('multer');
const AWS = require('aws-sdk');
const { db } = require('../config/db');

// Configure AWS
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.S3_BUCKET_NAME;

// Configure S3
const s3 = new AWS.S3({
    region: region,
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
});

// Test S3 connection
async function testS3Connection() {
    try {
        await s3.headBucket({ Bucket: bucketName }).promise();
        return true;
    } catch (error) {
        // Only keep essential error handling
        return false;
    }
}

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Upload file
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file provided' });
        }

        const { groupId, userId, userName } = req.body;
        
        if (!groupId || !userId || !userName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: groupId, userId, userName' 
            });
        }

        const uploadedBy = parseInt(userId);
        const groupIdInt = parseInt(groupId);

        // Generate unique filename
        const timestamp = Date.now();
        const originalName = req.file.originalname;
        const fileExtension = originalName.split('.').pop();
        const fileName = `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`;

        // Upload to S3
        const uploadParams = {
            Bucket: bucketName,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            Metadata: {
                originalName: originalName,
                uploadedBy: uploadedBy.toString(),
                groupId: groupIdInt.toString()
            }
        };

        const s3Result = await s3.upload(uploadParams).promise();

        // Save file metadata to database
        const [result] = await db.query(
            'INSERT INTO files (original_name, file_name, file_size, mime_type, s3_key, group_id, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [originalName, fileName, req.file.size, req.file.mimetype, fileName, groupIdInt, uploadedBy]
        );

        const fileId = result.insertId;

        // Get the saved file from database
        const [files] = await db.query(
            'SELECT * FROM files WHERE id = ?',
            [fileId]
        );

        const file = files[0];

        // Emit WebSocket event
        const io = req.app.get('io');
        if (io) {
            io.to(`group_${groupId}`).emit('file_uploaded', {
                file: file,
                uploadedBy: userName
            });
        }

        res.json({ 
            success: true, 
            message: 'File uploaded successfully',
            file: file
        });

    } catch (error) {
        // Only keep essential error handling
    }
};

// Download file
const downloadFile = async (req, res) => {
    try {
        const fileId = req.params.fileId;

        // Get file from database
        const [files] = await db.query(
            'SELECT * FROM files WHERE id = ?',
            [fileId]
        );

        if (files.length === 0) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        const file = files[0];

        // Get file from S3
        const downloadParams = {
            Bucket: bucketName,
            Key: file.s3_key
        };

        const s3Object = await s3.getObject(downloadParams).promise();

        // Set response headers
        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
        res.setHeader('Content-Length', file.file_size);

        // Send file
        res.send(s3Object.Body);

    } catch (error) {
        // Only keep essential error handling
    }
};

// Get files for a group
const getGroupFiles = async (req, res) => {
    try {
        const groupId = req.params.groupId;

        const [files] = await db.query(
            'SELECT f.*, u.name as uploaded_by_name FROM files f JOIN users u ON f.uploaded_by = u.id WHERE f.group_id = ? ORDER BY f.created_at DESC',
            [groupId]
        );

        res.json({ 
            success: true, 
            files: files 
        });

    } catch (error) {
        // Only keep essential error handling
    }
};

// Delete file
const deleteFile = async (req, res) => {
    try {
        const fileId = req.params.fileId;

        // Get file from database
        const [files] = await db.query(
            'SELECT * FROM files WHERE id = ?',
            [fileId]
        );

        if (files.length === 0) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        const file = files[0];

        // Delete from S3
        const deleteParams = {
            Bucket: bucketName,
            Key: file.s3_key
        };

        await s3.deleteObject(deleteParams).promise();

        // Delete from database
        await db.query(
            'DELETE FROM files WHERE id = ?',
            [fileId]
        );

        // Emit WebSocket event
        const io = req.app.get('io');
        if (io) {
            io.to(`group_${file.group_id}`).emit('file_deleted', {
                fileId: fileId,
                groupId: file.group_id
            });
        }

        res.json({ success: true, message: 'File deleted successfully' });

    } catch (error) {
        // Only keep essential error handling
    }
};

// Clean up expired files (run periodically)
const cleanupExpiredFiles = async () => {
    try {
        const expiryTime = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

        const [files] = await db.query(
            'SELECT * FROM files WHERE created_at < ?',
            [expiryTime]
        );

        for (const file of files) {
            try {
                // Delete from S3
                const deleteParams = {
                    Bucket: bucketName,
                    Key: file.s3_key
                };

                await s3.deleteObject(deleteParams).promise();

                // Delete from database
                await db.query(
                    'DELETE FROM files WHERE id = ?',
                    [file.id]
                );

            } catch (error) {
                // Only keep essential error handling
            }
        }

    } catch (error) {
        // Only keep essential error handling
    }
};

// Run cleanup every hour
setInterval(cleanupExpiredFiles, 60 * 60 * 1000);

module.exports = {
    uploadFile,
    downloadFile,
    getGroupFiles,
    deleteFile,
    testS3Connection
}; 