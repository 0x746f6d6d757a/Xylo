import { createPool, createConnection } from "mysql2/promise"
import logger from "../../Functions/logger"
import databaseConfig from "./databaseConfig.json" with { type: "json" }

// Defined outside to be reused
let databasePool = null
let databaseConnection = null

// In order to avoid multiple reconnections in a short time
let lastReconnectAttempt = 0
const RECONNECT_INTERVAL = 10000 

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

export async function getDatabasePoll() {
    if (databasePool) return databasePool
    logger('database', 'info', 'Creating new database pool...')

    const tempConnection = await createConnection({
        host: databaseConfig.host,
        user: databaseConfig.user,
        password: databaseConfig.password,
        port: databaseConfig.port
    })

    const [ database ] = await tempConnection.query(`SHOW DATABASES LIKE ?`, [databaseConfig.database])
    if (database.length === 0) await tempConnection.query(`CREATE DATABASE \`${databaseConfig.database}\``)

    await tempConnection.query(`USE \`${databaseConfig.database}\``)
    await tempConnection.query(`CREATE TABLE IF NOT EXISTS guilds (guildId VARCHAR(32) PRIMARY KEY, ownerId VARCHAR(32) NOT NULL, isPaying TINYINT(1) DEFAULT 0 );`)
    await tempConnection.query(`CREATE TABLE IF NOT EXISTS guild_configs ( configId INT AUTO_INCREMENT PRIMARY KEY, guildId VARCHAR(32) NOT NULL, configType VARCHAR(100) NOT NULL, configSettings TEXT NOT NULL );`)

    logger('database', 'info', 'Ensured database and tables exist.')
    await tempConnection.end()

    databasePool = await createNewPool()
    logger('database', 'info', 'Database pool created and connected.')

    return databasePool
}

export default async function executeQuery(query, ...params) {

    if(!databasePool) databasePool = await getDatabasePoll()

    try {
        const [ rows, fields ] = await databasePool.execute(query, params)
        logger('database', 'info', `Executed query: ${query}`)
        return { rows, fields }
    } catch (error) {
        logger('database', 'error', `Error executing query: ${query} - ${error.message}`)
        throw error
    }

}

export async function closeDatabasePool() {
    if (databasePool) {
        await databasePool.end()
        databasePool = null
        logger('database', 'info', 'Database pool closed.')
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

            // Connection lost / network issues
            case 'PROTOCOL_CONNECTION_LOST':
                logger("DB_ERROR", "Database connection lost.")
                const currentTime = Date.now()
                if (currentTime - lastReconnectAttempt < reconnectingInterval) {
                    logger("DB_ERROR", "Reconnect attempt throttled, waiting...")
                    break
                }

                lastReconnectAttempt = currentTime
                logger("DB", `Attempting to reconnect in ${reconnectingInterval / 1000}s...`)
                await delay(reconnectingInterval)

                try {
                    
                    databasePool = null
                    await getDatabasePool()
                    logger("DB", "Reconnected to the database successfully.")
                } catch (reconnectError) {
                    logger("DB_ERROR", `Database reconnection failed: ${reconnectError.message}`)
                }
                break

            case 'ECONNREFUSED':
                logger("DB_ERROR", "Database connection refused (is the server running?).")
                break
            case 'ETIMEDOUT':
                logger("DB_ERROR", "Database connection attempt timed out.")
                break

            // Too many connections
            case 'ER_CON_COUNT_ERROR':
                logger("DB_ERROR", "Database has too many connections.")
                break

            // Authentication / permission issues
            case 'ER_ACCESS_DENIED_ERROR':
                logger("DB_ERROR", "Access denied: invalid username/password or insufficient privileges.")
                break

            // Missing database or table
            case 'ER_BAD_DB_ERROR':
                logger("DB_ERROR", "Database does not exist.")
                break
            case 'ER_NO_SUCH_TABLE':
                logger("DB_ERROR", "Table does not exist.")
                break

            // Query protocol / enqueue issues
            case 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR':
                logger("DB_ERROR", "Cannot enqueue query after fatal error on connection.")
                break
            case 'PROTOCOL_ENQUEUE_AFTER_QUIT':
                logger("DB_ERROR", "Cannot enqueue query after connection quit.")
                break
            case 'PROTOCOL_ENQUEUE_HANDSHAKE_TWICE':
                logger("DB_ERROR", "Handshake already in progress or completed.")
                break

            // Server gone / shutdown
            case 'PROTOCOL_CONNECTION_FAILED':
                logger("DB_ERROR", "Connection to database server failed.")
                break
            case 'SERVER_SHUTDOWN':
                logger("DB_ERROR", "Database server shutdown detected.")
                break

            // General / unknown
            default:
                logger("DB_ERROR", `Unhandled database error: code=${error.code}, errno=${error.errno}, message=${error.message}`)
                break
        }

    })

    return dbPool
}
