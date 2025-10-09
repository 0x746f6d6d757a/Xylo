import logger from "../Functions/logger.js"
import loadFiles from "../Functions/loadFiles.js"
import { pathToFileURL } from "url"
import { Client } from "discord.js"

/**
 * 
 * @param {Client} client 
 */
export async function eventHandler(client) {

    // Clear existing events
    if(client.events) {
        for(const [eventName, execute] of client.events) {
            client.removeListener(eventName, execute)
            client.rest.removeListener(eventName, execute)
        }
    }

    // Additionally remove all listeners
    client.removeAllListeners()
    client.rest.removeAllListeners()

    // Load new events
    client.events = new Map()
    const eventsFiles = await loadFiles('Events')

    for (const file of eventsFiles) {

        const eventModule = await import(pathToFileURL(file).href)
        if (!eventModule || !eventModule.default) continue

        const execute = (...args) => eventModule.default.execute(...args, client)
        const targetEvent = eventModule.default.rest ? client.rest : client
        targetEvent[eventModule.default.once ? 'once' : 'on'](eventModule.default.name, execute)
        client.events.set(eventModule.default.name, execute)
    }

    logger('app', 'info', `Loaded ${client.events.size}/${eventsFiles.length} events.`)

}
