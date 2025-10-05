// Importing default modules
import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js'
import dotenv from 'dotenv'
import util from 'util'

// Custom Logger Import
import logger from '../Functions/logger.js'

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

// Initializing the collections where we will save our commands and events
client.commands = new Collection()
client.events = new Collection()

// Importing the event handler
import { eventHandler } from '../Handlers/eventHandler.js'
await eventHandler(client)

// Logging in the client
client.login(process.env.BOT_TOKEN)

/**
 * Declaring the Error Handlers
 * * [warning] Emitted whenever Node.js emits a process warning.
 * * [unhandledRejection] Emitted whenever a Promise is rejected and no error handler is attached to the promise within a turn of the event loop.
 * * [uncaughtException] Emitted when an uncaught JavaScript exception bubbles all the way back to the event loop.
 */
process.on('warning', (warning) => {
    logger('app', 'warn', `[${warning.name}] ${warning.message}\n${warning.stack}`)
})

process.on('unhandledRejection', (reason, promise) => {
    logger('app', 'error', `Unhandled Rejection at: ${util.inspect(promise, { depth: null })}, reason: ${util.inspect(reason, { depth: null })}`)
})

process.on('uncaughtException', (error) => {
    logger('app', 'error', `Uncaught Exception: ${util.inspect(error, { depth: null })}`)
})