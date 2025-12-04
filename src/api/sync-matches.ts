import { footballApiService } from '../services/football-api.service';
import { databaseService } from '../services/database.service';

/**
 * API endpoint for syncing matches
 * This can be called by GitHub Actions every 15 minutes
 */
export async function syncMatchesEndpoint() {
    try {
        // Get active season
        const season = await databaseService.getActiveSeason();

        if (!season) {
            return {
                success: false,
                error: 'No active season found'
            };
        }

        // Sync today's matches
        const result = await footballApiService.syncMatches(season.id);

        return {
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error in sync endpoint:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// For direct Node.js execution (GitHub Actions)
if (require.main === module) {
    syncMatchesEndpoint()
        .then(result => {
            console.log(JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}
