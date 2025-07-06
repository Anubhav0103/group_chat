const cron = require('node-cron');
const ArchiveService = require('./archiveService');

class CronService {
    static init() {
        // Schedule archiving job to run every night at 2:00 AM
        cron.schedule('0 2 * * *', async () => {
            try {
                const result = await ArchiveService.archiveOldMessages();
                console.log('Scheduled archiving completed:', result);
            } catch (error) {
                console.error('Scheduled archiving job failed:', error);
            }
        }, {
            scheduled: true,
            timezone: "UTC"
        });
        
        console.log('Cron jobs initialized - Message archiving scheduled for 2:00 AM daily');
    }
    
    // Manual trigger for testing
    static async runArchivingNow() {
        try {
            const result = await ArchiveService.archiveOldMessages();
            return result;
        } catch (error) {
            console.error('Manual archiving failed:', error);
            throw error;
        }
    }
}

module.exports = CronService; 