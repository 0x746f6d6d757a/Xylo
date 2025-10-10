import { Events, ChatInputCommandInteraction, MessageFlags, Client } from "discord.js"
import logger, { LogType, LogLevel } from "../../Functions/logger.js"

export default {
    name: Events.InteractionCreate,
    /**
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return

        const command = client.commands.get(interaction.commandName)

        if (!command) {
            logger(LogType.APP, LogLevel.ERROR, `No command matching ${interaction.commandName} was found.`)
            await interaction.reply({ content: "This command is not working, please reach out to support.", flags: MessageFlags.Ephemeral })
            return
        }

        try {
            await command.execute(interaction, client)
        } catch (error) {
            throw error
        }

    }
}