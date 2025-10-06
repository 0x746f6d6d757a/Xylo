import executeQuery from "./databaseManager"
import logger from "../../Functions/logger"


/**
 * Save guild settings to the database.
 * @param {string} guildId 
 * @param {Object} guildSettings 
 */
export async function saveGuildSettings(guildId, guildSettings) {

    try {

        const query = `INSERT INTO guild_configs (guildId, configType, configSettings) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE configSettings = ?`
        for (const [systemName, systemConfig] of Object.entries(guildSettings)) {
            await executeQuery(query, guildId, systemName, JSON.stringify(systemConfig), JSON.stringify(systemConfig))
        }

        logger('db', 'info', `Guild settings saved for guildId ${guildId}`)

    } catch (error) {
        logger('db', 'error', `Error saving guild settings for guildId ${guildId} - ${error.stack}`)
        throw error
    }
}

/**
 * Get guild settings from the database.
 * @param {string} guildId 
 * @returns {Promise<Object>} 
 */
export async function getGuildSettings(guildId) {
    try {
        const query = `SELECT configType, configSettings FROM guild_configs WHERE guildId = ?`
        const { rows } = await executeQuery(query, guildId)

        const guildSettings = {}
        for (const row of rows) {
            guildSettings[row.configType] = JSON.parse(row.configSettings)
        }
        return guildSettings
    } catch (error) {
        logger('db', 'error', `Error retrieving guild settings for guildId ${guildId} - ${error.stack}`)
        throw error
    }
}