// Importing default modules
import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js'
import dotenv from 'dotenv'
import util from 'util'

// Custom Logger Import
import logger, { LogType, LogLevel } from '../Functions/logger.js'
import { startConfigUpdateInterval, forceSyncConfigs, closeDatabasePool } from '../Utils/database/databaseManager.js'

// Getting the .env variables
dotenv.config()

/**
 * Import of the Intents I want the Bot to use
 * * To use this bot you'll need to turn on all the privileged intents from the developer portal.
*/
const { Guilds, GuildMessages, MessageContent, GuildVoiceStates, GuildMembers } = GatewayIntentBits

// Import of the Partials I want the Bot to use
const { User, Message, GuildMember, ThreadMember } = Partials

// Client Declaration
const client = new Client({
    intents: [ Guilds, GuildMessages, MessageContent, GuildVoiceStates, GuildMembers ],
    partials: [ User, Message, GuildMember, ThreadMember]
})

// Initializing the collections where we will save our commands and events.
client.commands = new Collection()
client.events = new Collection()

// Initializing the map where we will save our configs for guilds
client.guildConfigs = new Map()

// Importing the event handler
import { eventHandler } from '../Handlers/eventHandler.js'
await eventHandler(client)

/**
 * Declaring the Error Handlers
 * * [warning] Emitted whenever Node.js emits a process warning.
 * * [unhandledRejection] Emitted whenever a Promise is rejected and no error handler is attached to the promise within a turn of the event loop.
 * * [uncaughtException] Emitted when an uncaught JavaScript exception bubbles all the way back to the event loop.
 * * [SIGINT] Emitted when the process is interrupted (Ctrl+C).
 * * [SIGTERM] Emitted when the process is terminated (for example, by the system or a container orchestrator).
 */
process.on('warning', (warning) => {
    logger(LogType.APP, LogLevel.WARN, `[${warning.name}] ${warning.message}\n${warning.stack}`)
})

process.on('unhandledRejection', (reason, promise) => {
    logger(LogType.APP, LogLevel.ERROR, `Unhandled Rejection at: ${util.inspect(promise, { depth: null })}, reason: ${util.inspect(reason, { depth: null })}`)
})

process.on('uncaughtException', (error) => {
    logger(LogType.APP, LogLevel.ERROR, `Uncaught Exception: ${util.inspect(error, { depth: null })}`)
})

process.on('SIGINT', async () => {
    logger(LogType.APP, LogLevel.INFO, 'Shutting down gracefully...')
    await forceSyncConfigs()
    await closeDatabasePool()
    process.exit(0)
})

process.on('SIGTERM', async () => {
    logger(LogType.APP, LogLevel.INFO, 'Shutting down gracefully...')
    await forceSyncConfigs()
    await closeDatabasePool()
    process.exit(0)
})

startConfigUpdateInterval(30000)
client.login(process.env.BOT_TOKEN)