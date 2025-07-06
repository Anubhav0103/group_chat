const { db } = require('../config/db');

class ArchiveService {
    // Archive messages and files older than 1 day
    static async archiveOldMessages() {
        try {
            // Calculate the cutoff date (1 day ago)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
            
            // First, move old messages to archived_messages table
            const [archiveMessagesResult] = await db.query(
                `INSERT INTO archived_messages (original_id, group_id, user_id, message, created_at)
                 SELECT id, group_id, user_id, message, created_at
                 FROM messages 
                 WHERE created_at < ?`,
                [oneDayAgo]
            );
            
            // Then, move old files to archived_files table
            const [archiveFilesResult] = await db.query(
                `INSERT INTO archived_files (original_id, original_name, file_name, file_size, mime_type, s3_key, group_id, uploaded_by, created_at)
                 SELECT id, original_name, file_name, file_size, mime_type, s3_key, group_id, uploaded_by, created_at
                 FROM files 
                 WHERE created_at < ?`,
                [oneDayAgo]
            );
            
            // Then, delete the old messages from the messages table
            const [deleteMessagesResult] = await db.query(
                'DELETE FROM messages WHERE created_at < ?',
                [oneDayAgo]
            );
            
            // Then, delete the old files from the files table
            const [deleteFilesResult] = await db.query(
                'DELETE FROM files WHERE created_at < ?',
                [oneDayAgo]
            );
            
            return {
                archivedMessages: archiveMessagesResult.affectedRows,
                archivedFiles: archiveFilesResult.affectedRows,
                deletedMessages: deleteMessagesResult.affectedRows,
                deletedFiles: deleteFilesResult.affectedRows
            };
            
        } catch (error) {
            console.error('Error archiving messages and files:', error);
            throw error;
        }
    }
    
    // Get archived messages for a group (for future use if needed)
    static async getArchivedMessages(groupId, limit = 50, offset = 0) {
        try {
            const [results] = await db.query(
                `SELECT am.*, u.name as senderName
                 FROM archived_messages am
                 JOIN users u ON am.user_id = u.id
                 WHERE am.group_id = ?
                 ORDER BY am.created_at DESC
                 LIMIT ? OFFSET ?`,
                [groupId, limit, offset]
            );
            
            return results;
        } catch (error) {
            console.error('Error getting archived messages:', error);
            throw error;
        }
    }
    
    // Get archived files for a group (for future use if needed)
    static async getArchivedFiles(groupId, limit = 50, offset = 0) {
        try {
            const [results] = await db.query(
                `SELECT af.*, u.name as uploaded_by_name
                 FROM archived_files af
                 JOIN users u ON af.uploaded_by = u.id
                 WHERE af.group_id = ?
                 ORDER BY af.created_at DESC
                 LIMIT ? OFFSET ?`,
                [groupId, limit, offset]
            );
            
            return results;
        } catch (error) {
            console.error('Error getting archived files:', error);
            throw error;
        }
    }
    
    // Get total count of archived messages for a group
    static async getArchivedMessageCount(groupId) {
        try {
            const [results] = await db.query(
                'SELECT COUNT(*) as count FROM archived_messages WHERE group_id = ?',
                [groupId]
            );
            
            return results[0].count;
        } catch (error) {
            console.error('Error getting archived message count:', error);
            throw error;
        }
    }
    
    // Get total count of archived files for a group
    static async getArchivedFileCount(groupId) {
        try {
            const [results] = await db.query(
                'SELECT COUNT(*) as count FROM archived_files WHERE group_id = ?',
                [groupId]
            );
            
            return results[0].count;
        } catch (error) {
            console.error('Error getting archived file count:', error);
            throw error;
        }
    }
}

module.exports = ArchiveService; 