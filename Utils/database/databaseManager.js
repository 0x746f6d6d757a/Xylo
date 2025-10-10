import { createPool, createConnection } from "mysql2/promise"
import logger, { LogType, LogLevel } from "../../Functions/logger.js"
import databaseConfig from "./databaseConfig.json" with { type: "json" }
import { Client } from "discord.js"
import { validateLoggerConfig } from "../validators/configValidators.js"

// Defined outside to be reused
let databasePool = null
let databaseConnection = null

// In order to avoid multiple reconnections in a short time
let lastReconnectAttempt = 0
const RECONNECT_INTERVAL = 10000 

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

export async function getDatabasePool() { // <-- rename here
    if (databasePool) return databasePool
    logger(LogType.DB, LogLevel.INFO, 'Creating new database pool...')

    const tempConnection = await createConnection({
        host: databaseConfig.host,
        user: databaseConfig.user,
        password: databaseConfig.password,
        port: databaseConfig.port
    })

    const [ database ] = await tempConnection.query(`SHOW DATABASES LIKE ?`, [databaseConfig.database])
    if (database.length === 0) await tempConnection.query(`CREATE DATABASE \`${databaseConfig.database}\``)

    await tempConnection.query(`USE \`${databaseConfig.database}\``)
    await tempConnection.query(`CREATE TABLE IF NOT EXISTS guilds (guildId VARCHAR(32) PRIMARY KEY, ownerId VARCHAR(32) NOT NULL, isPaying TINYINT(1) DEFAULT 0 )`)
    await tempConnection.query(`CREATE TABLE IF NOT EXISTS guild_configs ( configId INT AUTO_INCREMENT PRIMARY KEY, guildId VARCHAR(32) NOT NULL, configType VARCHAR(100) NOT NULL, configSettings TEXT NOT NULL )`)

    logger(LogType.DB, LogLevel.INFO, 'Ensured database and tables exist.')
    await tempConnection.end()

    databasePool = await createNewPool()
    logger(LogType.DB, LogLevel.INFO, 'Database pool created and connected.')

    return databasePool
}

export default async function executeQuery(query, ...params) {

    if(!databasePool) databasePool = await getDatabasePool()

    try {
        const [ rows, fields ] = await databasePool.execute(query, params)
        logger(LogType.DB, LogLevel.INFO, `Executed query: ${query}`)
        return { rows, fields }
    } catch (error) {
        logger(LogType.DB, LogLevel.ERROR, `Error executing query: ${query} - ${error.message}`)
        throw error
    }

}

export async function closeDatabasePool() {
    if (databasePool) {
        await databasePool.end()
        databasePool = null
        logger(LogType.DB, LogLevel.INFO, 'Database pool closed.')
    }
}

async function createNewPool() {
    const dbPool = createPool({
        host: databaseConfig.host,
        user: databaseConfig.user,
        password: databaseConfig.password,
        database: databaseConfig.database,
        port: databaseConfig.port,
        waitForConnections: databaseConfig.waitForConnections,
        connectionLimit: databaseConfig.connectionLimit,
        queueLimit: databaseConfig.queueLimit
    })

    dbPool.on('error', async ( error ) => {
        switch (error.code) {
            case 'PROTOCOL_CONNECTION_LOST':
                logger(LogType.DB, LogLevel.ERROR, "Database connection lost.")
                const currentTime = Date.now()
                if (currentTime - lastReconnectAttempt < RECONNECT_INTERVAL) { // <-- fix variable name
                    logger(LogType.DB, LogLevel.ERROR, "Reconnect attempt throttled, waiting...")
                    break
                }

                lastReconnectAttempt = currentTime
                logger(LogType.DB, LogLevel.INFO, `Attempting to reconnect in ${RECONNECT_INTERVAL / 1000}s...`) // <-- fix variable name
                await delay(RECONNECT_INTERVAL) // <-- fix variable name

                try {
                    databasePool = null
                    await getDatabasePool() // <-- fix function name
                    logger(LogType.DB, LogLevel.INFO, "Reconnected to the database successfully.")
                } catch (reconnectError) {
                    logger(LogType.DB, LogLevel.ERROR, `Database reconnection failed: ${reconnectError.message}`)
                }
                break

            case 'ECONNREFUSED':
                logger(LogType.DB, LogLevel.ERROR, "Database connection refused (is the server running?).")
                break
            case 'ETIMEDOUT':
                logger(LogType.DB, LogLevel.ERROR, "Database connection attempt timed out.")
                break

            // Too many connections
            case 'ER_CON_COUNT_ERROR':
                logger(LogType.DB, LogLevel.ERROR, "Database has too many connections.")
                break

            // Authentication / permission issues
            case 'ER_ACCESS_DENIED_ERROR':
                logger(LogType.DB, LogLevel.ERROR, "Access denied: invalid username/password or insufficient privileges.")
                break

            // Missing database or table
            case 'ER_BAD_DB_ERROR':
                logger(LogType.DB, LogLevel.ERROR, "Database does not exist.")
                break
            case 'ER_NO_SUCH_TABLE':
                logger(LogType.DB, LogLevel.ERROR, "Table does not exist.")
                break

            // Query protocol / enqueue issues
            case 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR':
                logger(LogType.DB, LogLevel.ERROR, "Cannot enqueue query after fatal error on connection.")
                break
            case 'PROTOCOL_ENQUEUE_AFTER_QUIT':
                logger(LogType.DB, LogLevel.ERROR, "Cannot enqueue query after connection quit.")
                break
            case 'PROTOCOL_ENQUEUE_HANDSHAKE_TWICE':
                logger(LogType.DB, LogLevel.ERROR, "Handshake already in progress or completed.")
                break

            // Server gone / shutdown
            case 'PROTOCOL_CONNECTION_FAILED':
                logger(LogType.DB, LogLevel.ERROR, "Connection to database server failed.")
                break
            case 'SERVER_SHUTDOWN':
                logger(LogType.DB, LogLevel.ERROR, "Database server shutdown detected.")
                break

            // General / unknown
            default:
                logger(LogType.DB, LogLevel.ERROR, `Unhandled database error: code=${error.code}, errno=${error.errno}, message=${error.message}`)
                break
        }

    })

    return dbPool
}

/**
 * Refresh and load all guild configurations in the client
 * @param {Client} client 
 */
export async function refreshClientConfigs(client) {

    if (!client || !client.guilds || !client.guilds.cache) {
        logger(LogType.APP, LogLevel.ERROR, 'Client or guilds cache is not available for refreshing configurations.')
        return
    }

    for (const guild of client.guilds.cache.values()) {

        let { rows: guildConfigs } = await executeQuery(`SELECT * FROM guild_configs WHERE guildId = ${guild.id}`)
        client.guildConfigs.set(guild.id, guildConfigs)
        logger(LogType.APP, LogLevel.INFO, `Configuration refreshed for guild ${guild.name} (${guild.id})`)

    }
}

// Queue to store pending updates
const pendingUpdates = new Map()
let flushTimeout = null

/**
 * Updates guild configuration in client cache and queues database update
 * @param {Client} client 
 * @param {string} guildId 
 * @param {string} configType 
 * @param {Object} updatedSettings 
 */
export async function updateGuildConfig(client, guildId, configType, updatedSettings) {

    let isValid = true
    switch (configType) {
        case 'loggerSystem':
            isValid = validateLoggerConfig(updatedSettings)
            break

        default:
            logger(LogType.DB, LogLevel.WARN, `No validator defined for config type: ${configType}`)
            isValid = false
            break
    }

    if (!isValid) return logger(LogType.DB, LogLevel.ERROR , `Invalid configuration settings for type: ${configType}. Update aborted.`)

    let guildSettings = client.guildConfigs.get(guildId) || []
    let configToEdit = guildSettings.find(config => config.configType === configType)
    
    if (configToEdit) {
        configToEdit.configSettings = updatedSettings
        client.guildConfigs.set(guildId, guildSettings)
    }

    const key = `${guildId}:${configType}`
    pendingUpdates.set(key, { guildId, configType, updatedSettings })
    
    if (flushTimeout) clearTimeout(flushTimeout)
    flushTimeout = setTimeout(() => flushPendingUpdates(), 5000) // 5s debounce

    logger(LogType.DB, LogLevel.DEBUG, `Queued config update for ${key}`)
}

// Flushes all pending updates to the database
async function flushPendingUpdates() {
    if (pendingUpdates.size === 0) return

    logger(LogType.DB, LogLevel.INFO, `Flushing ${pendingUpdates.size} pending config updates...`)

    for (const [key, { guildId, configType, updatedSettings }] of pendingUpdates) {
        try {

            let query = 'UPDATE guild_configs SET configSettings = ? WHERE guildId = ? AND configType = ?'
            await executeQuery( query, JSON.stringify(updatedSettings), guildId, configType )
            pendingUpdates.delete(key)

        } catch (error) {
            logger(LogType.DB, LogLevel.ERROR, `Failed to update config for ${key}: ${error.message}`)
        }
    }

    logger(LogType.DB, LogLevel.INFO, 'Pending updates flushed.')
}

/**
 * Starts the interval to flush pending updates
 * @param {number} intervalMs - Interval in milliseconds (default: 30000 = 30 seconds)
 */
export function startConfigUpdateInterval(intervalMs = 30000) {
    setInterval(async () => { await flushPendingUpdates() }, intervalMs)
    logger(LogType.DB, LogLevel.INFO, `Config update interval started (every ${intervalMs / 1000}s)`)
}

/**
 * Forces an immediate flush of pending updates (useful for graceful shutdown)
 */
export async function forceSyncConfigs() {
    logger(LogType.DB, LogLevel.INFO, 'Forcing immediate sync of pending configs...')
    await flushPendingUpdates()
}

