import { Events, Client, ButtonInteraction, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js"
import { parseCustomId } from "../../Utils/messages/stringParser.js"
import { updateGuildConfig } from "../../Utils/database/databaseManager.js"
import sendLoggerPanel from "../../Utils/messages/Panels/loggerPanel.js"

export default {
    name: Events.InteractionCreate,
    /**`
     * @param {ButtonInteraction} interaction
     * @param {Client} client
    */
    async execute(interaction, client) {

        if(!interaction.isButton()) return

        const { customId, message } = interaction
        const { selectedSystem, guildId, selectedAction } = parseCustomId(customId)

        if(guildId !== interaction.guildId) return interaction.reply({ content: "This interaction does not belong to this guild.", flags: MessageFlags.Ephemeral })

        let guildSettings = client.guildConfigs.get(guildId) || []
        if(!guildSettings || guildSettings.length === 0) return interaction.reply({ content: "Guild settings could not be found. Please contact support.", flags: MessageFlags.Ephemeral })

        let configToEdit = guildSettings.find(config => config.configType === selectedSystem)
        if(!configToEdit) return interaction.reply({ content: "Selected configuration could not be found. Please contact support.", flags: MessageFlags.Ephemeral })

        let configSettings = typeof configToEdit.configSettings === 'string' ? JSON.parse(configToEdit.configSettings) : configToEdit.configSettings

        switch(selectedSystem) {
            case 'loggerSystem':
                switch(selectedAction) {
                    case 'toggle':
                        configSettings.enabled = !configSettings.enabled
                        updateGuildConfig(client, guildId, selectedSystem, configSettings)
                        return await sendLoggerPanel(configSettings, interaction, client)

                    case 'changeLevel':
                        
                        const textInputLevel = new TextInputBuilder()
                            .setCustomId('loggingLevelInput')
                            .setLabel('Enter a logging level (1-3)')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('1 - Errors Only | 2 - Warnings + Errors | 3 - All Logs')
                            .setRequired(true)
                            .setMaxLength(1)
                            .setMinLength(1)
                        
                        const changeLevelModal = new ModalBuilder()
                            .setCustomId(`loggerSystem|${guildId}|changeLevelModal`)
                            .setTitle('Change Logging Level')
                            .setComponents(new ActionRowBuilder().addComponents(textInputLevel))

                        return await interaction.showModal(changeLevelModal)

                    case 'setAdminRole':

                        const textInputRole = new TextInputBuilder()
                            .setCustomId('adminRoleInput')
                            .setLabel('Enter the admin role ID')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Admin Role ID')
                            .setRequired(true)

                        const changeRoleModal = new ModalBuilder()
                            .setCustomId(`loggerSystem|${guildId}|changeRoleModal`)
                            .setTitle('Change Admin Role')
                            .setComponents(new ActionRowBuilder().addComponents(textInputRole))

                        return await interaction.showModal(changeRoleModal)

                    case 'setCategory':
                        const textInputCategory = new TextInputBuilder()
                            .setCustomId('categoryInput')
                            .setLabel('Enter the category ID')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Category ID')
                            .setRequired(true)

                        const changeCategoryModal = new ModalBuilder()
                            .setCustomId(`loggerSystem|${guildId}|changeCategoryModal`)
                            .setTitle('Change Category')
                            .setComponents(new ActionRowBuilder().addComponents(textInputCategory))

                        return await interaction.showModal(changeCategoryModal)
                    
                    case 'manageChannels':
                        configSettings.channels = configSettings.channels || {}
                        
                        const channelFields = [];
                        
                        // Group channels by category
                        const channelGroups = {
                            'Automod Logs': configSettings.channels.automod || {},
                            'Guild Updates': configSettings.channels.guild || {},
                            'Member Events': configSettings.channels.members || {},
                            'Role Events': configSettings.channels.roles || {},
                            'Invite Events': configSettings.channels.invites || {},
                            'Channel Events': configSettings.channels.channels || {},
                            'Message Events': configSettings.channels.messages || {},
                            'Thread Events': configSettings.channels.threads || {},
                            'Voice Events': configSettings.channels.voice || {}
                        };

                        // Create fields for each category
                        for (const [categoryName, events] of Object.entries(channelGroups)) {
                            const eventList = Object.entries(events)
                                .map(([eventName, channelId]) => {
                                    if (channelId) {
                                        return `• ${eventName}: <#${channelId}>`;
                                    }
                                    return `• ${eventName}: *Not configured*`;
                                })
                                .join('\n');
                            
                            channelFields.push({ 
                                name: categoryName, 
                                value: eventList,
                                inline: false 
                            });
                        }
                        
                        const channelsEmbed = new EmbedBuilder()
                            .setTitle('Manage Logging Channels')
                            .setDescription('Select an event from the dropdown to configure its logging channel.')
                            .addFields(channelFields)
                            .setColor(0x5865F2)
                            .setFooter({ text: client.developer.footerText, iconURL: client.developer.icon })
                            .setTimestamp()

                        // Create select menu options for all events
                        const selectOptions = [];
                        for (const [categoryName, events] of Object.entries(channelGroups)) {
                            for (const [eventName, channelId] of Object.entries(events)) {
                                selectOptions.push({
                                    label: eventName,
                                    description: channelId ? `Currently: #${interaction.guild.channels.cache.get(channelId)?.name || 'Unknown'}` : 'Not configured',
                                    value: `${Object.keys(channelGroups).find(k => channelGroups[k] === events)}:${eventName}`,
                                    emoji: channelId ? '✅' : '❌'
                                });
                            }
                        }

                        const eventSelectMenu = new StringSelectMenuBuilder()
                            .setCustomId(`loggerSystem|${guildId}|selectEvent`)
                            .setPlaceholder('Select an event to configure')
                            .addOptions(selectOptions.slice(0, 25)) // Discord limit: 25 options per select menu

                        const selectRow = new ActionRowBuilder().addComponents(eventSelectMenu)
                        
                        return await interaction.update({ embeds: [channelsEmbed], components: [selectRow] })

                    default:
                        return interaction.reply({ content: "Unknown action.", flags: MessageFlags.Ephemeral })
                }
            
            default:
                return interaction.reply({ content: "Unknown system.", flags: MessageFlags.Ephemeral })
        }
    }
}