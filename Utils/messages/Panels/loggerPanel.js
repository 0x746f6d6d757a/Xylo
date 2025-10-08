import { EmbedBuilder, ButtonBuilder, ModalBuilder, ButtonStyle, TextInputStyle, TextInputBuilder, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js"

function createEmbedPanel(configSettings, client) {

    let { enabled, adminRoleId, categoryParentID, loggingLevel } = configSettings

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
        .setTimestamp()
}

function createButtonPanel(configSettings, interaction) {

    const toggleButton = new ButtonBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|toggle`)
        .setLabel(configSettings.enabled ? 'Disable Logger' : 'Enable Logger')
        .setStyle(ButtonStyle.Secondary)
    
    const changeLevelButton = new ButtonBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|changeLevel`)
        .setLabel('Change Logging Level')
        .setStyle(ButtonStyle.Secondary)
    
    const setAdminRoleButton = new ButtonBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|setAdminRole`)
        .setLabel('Set Admin Role')
        .setStyle(ButtonStyle.Secondary)

    const setCategoryButton = new ButtonBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|setCategory`)
        .setLabel('Set Category')
        .setStyle(ButtonStyle.Secondary)

    const manageChannelsButton = new ButtonBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|manageChannels`)
        .setLabel('Manage Channels')
        .setStyle(ButtonStyle.Secondary)

    return new ActionRowBuilder().addComponents(toggleButton, changeLevelButton, setAdminRoleButton, setCategoryButton, manageChannelsButton)

}

/**
 * Sends the logger panel to the user.
 * @param {Object} configSettings 
 * @param {import("discord.js").Interaction} interaction 
 * @param {import("discord.js").Client} client 
 */
export async function sendLoggerPanel(configSettings, interaction, client) {

    const embedPanel = createEmbedPanel(configSettings, client, interaction)
    const buttonPanel = createButtonPanel(configSettings, interaction)

    if(interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [embedPanel], components: [buttonPanel] })
    } else {
        await interaction.update({ embeds: [embedPanel], components: [buttonPanel] })
    }
    
}

/**
 * @param {Object} configSettings 
 * @param {import("discord.js").Interaction} interaction 
 * @param {import("discord.js").Client} client 
 */
async function createChannelManagement(configSettings, interaction, client) {

    configSettings.channels = configSettings.channels || {}
    const channelFields = []
                        
    const channelGroups = {
        'Automod Logs':     configSettings.channels.automod  || {},
        'Guild Updates':    configSettings.channels.guild    || {},
        'Member Events':    configSettings.channels.members  || {},
        'Role Events':      configSettings.channels.roles    || {},
        'Invite Events':    configSettings.channels.invites  || {},
        'Channel Events':   configSettings.channels.channels || {},
        'Message Events':   configSettings.channels.messages || {},
        'Thread Events':    configSettings.channels.threads  || {},
        'Voice Events':     configSettings.channels.voice    || {}
    }

    // Create fields for each category
    for (const [categoryName, events] of Object.entries(channelGroups)) {

        const eventList = Object.entries(events).map(([eventName, channelId]) => {
            if (channelId) return `• ${eventName}: <#${channelId}>`
            return `• ${eventName}: *Not configured*`
        }).join('\n')

        channelFields.push({ name: categoryName, value: eventList, inline: false })
    }
                        
    const channelsEmbed = new EmbedBuilder()
        .setTitle('Manage Logging Channels')
        .setDescription('Select an event from the dropdown to configure its logging channel.')
        .addFields(channelFields)
        .setColor(0x5865F2)
        .setFooter({ text: client.developer.footerText, iconURL: client.developer.icon })
        .setTimestamp()

    const selectOptions = []
    for (const [categoryName, events] of Object.entries(channelGroups)) {
        for (const [eventName, channelId] of Object.entries(events)) {
            selectOptions.push({
                label: eventName,
                description: channelId ? `Currently: #${interaction.guild.channels.cache.get(channelId)?.name || 'Unknown'}` : 'Not configured',
                value: `${Object.keys(channelGroups).find(k => channelGroups[k] === events)}:${eventName}`,
                emoji: channelId ? '✅' : '❌'
            })
        }
    }

    const eventSelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|selectEvent`)
        .setPlaceholder('Select an event to configure')
        .addOptions(selectOptions.slice(0, 25))
    
    const backToLoggerButton = new ButtonBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|mainMenu`)
        .setLabel('Back to Logger Settings')
        .setStyle(ButtonStyle.Secondary)

    const backToMainButton = new ButtonBuilder()
        .setCustomId(`changeSettings|${interaction.guildId}|mainMenu`)
        .setLabel('Back to Main Menu')
        .setStyle(ButtonStyle.Secondary)

    const selectMenu = new ActionRowBuilder().addComponents(eventSelectMenu)
    const navigationRow = new ActionRowBuilder().addComponents(backToLoggerButton, backToMainButton)

    return [ channelsEmbed, selectMenu, navigationRow ]
}

/**
 * @param {Object} configSettings 
 * @param {import("discord.js").Interaction} interaction 
 */
async function createChannelManagementButtons(configSettings, interaction) {}

export async function sendChannelManagementPanel(configSettings, interaction, client) {

    const [ embedPanel, selectMenu, navigationRow ] = await createChannelManagement(configSettings, interaction, client)

    if(interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [embedPanel], components: [selectMenu, navigationRow] })
    } else {
        await interaction.update({ embeds: [embedPanel], components: [selectMenu, navigationRow] })
    }
}
