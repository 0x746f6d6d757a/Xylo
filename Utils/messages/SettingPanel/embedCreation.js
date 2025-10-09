import { EmbedBuilder } from "discord.js";

/**
 * @param {import("discord.js").Interaction} interaction 
 * @param {import("discord.js").Client} client 
 * @returns {EmbedBuilder}
 */
export function getSettingsEmbed(interaction, client) {

    return new EmbedBuilder()
        .setTitle('Guild Settings Panel')
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
        .setDescription('Modify the settings for this guild using the dropdown menu below.')
        .setColor(0x5865F2)
        .setFooter({ text: client.developer.footerText, iconURL: client.developer.icon })
        .setTimestamp()

}