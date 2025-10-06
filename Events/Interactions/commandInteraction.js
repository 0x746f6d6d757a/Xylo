import { Events, ChatInputCommandInteraction, MessageFlags, Client } from "discord.js"
import logger from "../../Functions/logger.js"

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
            logger('event', 'error', `No command matching ${interaction.commandName} was found.`)
            await interaction.reply({ content: "This command is not working, please reach out to support.", flags: MessageFlags.Ephemeral })
            return
        }

        try {
            await command.execute(interaction, client)
        } catch (error) {
            logger('event', 'error', `Error executing ${interaction.commandName}.\nError: ${error}`)
            (interaction.replied || interaction.deferred) ?
                await interaction.followUp({ content: 'There was an error while executing this command!\n' + error, flags: MessageFlags.Ephemeral }) :
                await interaction.reply({ content: 'There was an error while executing this command!\n' + error, flags: MessageFlags.Ephemeral })
        }

    }
}