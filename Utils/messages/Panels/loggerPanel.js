import { EmbedBuilder, ButtonBuilder, ModalBuilder, ButtonStyle, TextInputStyle, TextInputBuilder, ActionRowBuilder } from "discord.js";

function createEmbedPanel(configSettings, client) {

    let { enabled, adminRoleId, categoryParentID, loggingLevel } = configSettings;

    return new EmbedBuilder()
        .setTitle('Logger System Settings')
        .setDescription('Configure the logging settings for your guild using the buttons below.')
        .addFields(
            { name: 'Status', value: enabled ? 'Enabled' : 'Disabled', inline: true },
            { name: 'Logging Level', value: `${loggingLevel}`, inline: true },
            { name: 'Category', value: categoryParentID ? `<#${categoryParentID}> (${categoryParentID})` : 'None', inline: true },
            { name: 'Admin Role', value: adminRoleId ? `<@&${adminRoleId}> (${adminRoleId})` : 'None', inline: true }
        )
        .setColor(0x5865F2)
        .setFooter({ text: client.developer.footerText, iconURL: client.developer.icon })
        .setTimestamp();
}

function createButtonSettings(configSettings, interaction) {

    const toggleButton = new ButtonBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|toggle`)
        .setLabel(configSettings.enabled ? 'Disable Logger' : 'Enable Logger')
        .setStyle(ButtonStyle.Secondary);
    
    const changeLevelButton = new ButtonBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|changeLevel`)
        .setLabel('Change Logging Level')
        .setStyle(ButtonStyle.Secondary);
    
    const setAdminRoleButton = new ButtonBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|setAdminRole`)
        .setLabel('Set Admin Role')
        .setStyle(ButtonStyle.Secondary);

    const setCategoryButton = new ButtonBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|setCategory`)
        .setLabel('Set Category')
        .setStyle(ButtonStyle.Secondary);

    return new ActionRowBuilder().addComponents(toggleButton, changeLevelButton, setAdminRoleButton, setCategoryButton);

}

/**
 * Sends the logger panel to the user.
 * @param {Object} configSettings 
 * @param {import("discord.js").Interaction} interaction 
 * @param {import("discord.js").Client} client 
 */
export default async function sendLoggerPanel(configSettings, interaction, client) {

    const embedPanel = createEmbedPanel(configSettings, client, interaction);
    const buttonSettings = createButtonSettings(configSettings, interaction);

    if(interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [embedPanel], components: [buttonSettings] });
    } else {
        await interaction.update({ embeds: [embedPanel], components: [buttonSettings] });
    }
    
}