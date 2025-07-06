const { db } = require('../config/db');

class FileModel {
    static async createFile(fileData) {
        const { originalName, fileName, fileSize, mimeType, s3Key, groupId, uploadedBy } = fileData;
        
        const query = `
            INSERT INTO files (original_name, file_name, file_size, mime_type, s3_key, group_id, uploaded_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        return new Promise((resolve, reject) => {
            db.query(query, [
                originalName, fileName, fileSize, mimeType, s3Key, groupId, uploadedBy
            ], (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.insertId);
                }
            });
        });
    }

    static async getFilesByGroup(groupId) {
        const query = `
            SELECT f.*, u.name as uploaded_by_name
            FROM files f
            JOIN users u ON f.uploaded_by = u.id
            WHERE f.group_id = ?
            ORDER BY f.created_at DESC
        `;
        
        return new Promise((resolve, reject) => {
            db.query(query, [groupId], (error, rows) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async getFileById(fileId) {
        const query = `
            SELECT f.*, u.name as uploaded_by_name
            FROM files f
            JOIN users u ON f.uploaded_by = u.id
            WHERE f.id = ?
        `;
        
        return new Promise((resolve, reject) => {
            db.query(query, [fileId], (error, rows) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(rows[0]);
                }
            });
        });
    }

    static async deleteFile(fileId) {
        const query = 'DELETE FROM files WHERE id = ?';
        
        return new Promise((resolve, reject) => {
            db.query(query, [fileId], (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.affectedRows > 0);
                }
            });
        });
    }

    static async getExpiredFiles() {
        const query = `
            SELECT * FROM files 
            WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `;
        
        return new Promise((resolve, reject) => {
            db.query(query, (error, rows) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

module.exports = FileModel; 