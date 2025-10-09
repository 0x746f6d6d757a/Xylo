import { SlashCommandBuilder, ChatInputCommandInteraction, Client, MessageFlags, StringSelectMenuBuilder, EmbedBuilder, ActionRowBuilder } from 'discord.js'
import executeQuery from '../../Utils/database/databaseManager.js'
import logger from '../../Functions/logger.js'
import { sendSettingsMenu } from '../../Utils/messages/SettingPanel/sendPanel.js'

export default {
    data: new SlashCommandBuilder()
        .setName('change_settings')
        .setDescription('Change the bot settings for your guild.'),
    /**
     * @param {ChatInputCommandInteraction} interaction 
     * @param {Client} client
     */
    async execute(interaction, client) {
        if (!interaction.isCommand()) return

        await interaction.deferReply({ flags: MessageFlags.Ephemeral })

        const { guildId } = interaction

        const checkIfGuildExistsQuery = `SELECT * FROM guilds WHERE guildId = ?`
        const { rows } = await executeQuery(checkIfGuildExistsQuery, guildId)

        if (rows.length === 0) {
            logger('db', 'info', `Guild ${interaction.guild.name} (${guildId}) does not exist.`)
            return interaction.editReply({ content: "This guild has not been set up yet. Please run /guild_setup first." })
        }

        logger('db', 'info', `Starting settings change for guild ${interaction.guild.name} (${guildId})...`)

        const guildSettings = client.guildConfigs.get(guildId) || []
        if (!guildSettings || guildSettings.length === 0) return interaction.editReply({ content: "Guild settings could not be found. Please contact support." })

        return await sendSettingsMenu(interaction, client, guildSettings)
    }
}