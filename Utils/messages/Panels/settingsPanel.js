import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, StringSelectMenuBuilder } from "discord.js"
import { camelCaseToTitle } from "../stringParser.js"

/**
 * Sends the guild settings menu
 * @param {import('discord.js').Interaction} interaction 
 * @param {Client} client 
 */
export async function sendSettingsMenu(interaction, client) {

    const { guildId } = interaction
    const guildSettings = client.guildConfigs.get(guildId) || {}

    if(!guildSettings || Object.keys(guildSettings).length === 0) {
        return interaction.editReply({ content: "Guild settings could not be found. Please contact support." })
    }
    
    const stringSelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`changeSettings|${guildId}|select`)
        .setPlaceholder('Select a setting to change')

    guildSettings.forEach(config => {
        const { configType } = config
        stringSelectMenu.addOptions({ 
            label: camelCaseToTitle(configType), 
            description: `Change the settings for the ${camelCaseToTitle(configType)}.`,
            value: configType 
        })
    })

    const embedMenu = new EmbedBuilder()
        .setTitle('Guild Settings Panel')
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .setDescription('Modify the settings for this guild using the dropdown menu below.')
        .setColor(0x5865F2)
        .setFooter({ text: client.developer.footerText, iconURL: client.developer.icon })
        .setTimestamp()

    if(interaction.replied || interaction.deferred) {
        return interaction.editReply({ embeds: [embedMenu], components: [new ActionRowBuilder().addComponents(stringSelectMenu)], flags: MessageFlags.Ephemeral })
    } else {
        return interaction.update({ embeds: [embedMenu], components: [new ActionRowBuilder().addComponents(stringSelectMenu)], flags: MessageFlags.Ephemeral })
    }
}