import logger, { LogType, LogLevel } from "../Functions/logger.js"
import loadFiles from "../Functions/loadFiles.js"
import { pathToFileURL } from "url"
import { Client } from "discord.js"

/**
 * This function handles the loading of commands into the client.
 * @param {Client} client 
 */
export async function commandHandler(client) {

    await client.commands.clear()
    let commandsArray = []

    const commandsFiles = await loadFiles('Commands')
    for (const file of commandsFiles) {

        const commandModule = await import(pathToFileURL(file).href + `?update=${Date.now()}`)
        if (!commandModule || !commandModule.default) continue

        const command = commandModule.default
        if (!command.data || !command.execute) {
            logger(LogType.APP, LogLevel.WARN, `The command at ${file} is missing a required "data" or "execute" property.`)
            continue
        }

        commandsArray.push(command.data.toJSON())
        client.commands.set(command.data.name, command)

    }

    await client.application.commands.set(commandsArray)
    logger(LogType.APP, LogLevel.INFO, `Loaded ${client.commands.size}/${commandsArray.length} commands.`)

}