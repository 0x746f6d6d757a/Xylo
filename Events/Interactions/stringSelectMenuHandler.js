import { ActionRowBuilder, ButtonBuilder, Events, MessageFlags, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle } from "discord.js"
import { parseCustomId } from "../../Utils/messages/stringParser.js"
import { sendLoggerPanel } from "../../Utils/messages/Panels/loggerPanel.js"


export default {
    name: Events.InteractionCreate,
    /**
     * @param {StringSelectMenuInteraction} interaction 
     * @param {Client} client
     */
    async execute(interaction, client) {
        if (!interaction.isStringSelectMenu()) return

        let extraPart = null
        const { customId, values, message } = interaction
        let { guildId, selectedSystem, selectedAction, extraData } = parseCustomId(customId)
        if(selectedAction.includes('_')) [selectedAction, extraPart] = selectedAction.split('_')

        const selectedValue = values[0] // Assuming single select menu

        // Ensure the interaction is for the correct guild
        if (guildId !== interaction.guildId) return interaction.reply({ content: "This interaction does not belong to this guild.", flags: MessageFlags.Ephemeral })
        
        switch (selectedSystem) {
            case 'changeSettings':
            
                switch (selectedAction) {

                    case 'select':
                        const guildSettings = client.guildConfigs.get(guildId) || {}
                        if (!guildSettings || Object.keys(guildSettings).length === 0) return interaction.update({ content: "Guild settings could not be found. Please contact support.", embeds: [], components: [] })

                        let configToEdit = guildSettings.find(config => config.configType === selectedValue)
                        if (!configToEdit) return interaction.update({ content: "Selected configuration could not be found. Please contact support.", embeds: [], components: [] })

                        let configSettings = configToEdit.configSettings ? JSON.parse(configToEdit.configSettings) : {}

                        switch (selectedValue) {

                            case 'loggerSystem':
                                return await sendLoggerPanel(configSettings, interaction, client)

                            default:
                                return interaction.update({ content: "This configuration panel is not yet implemented.", embeds: [], components: [] })

                        }

                    default:
                        return interaction.reply({ content: "Unknown action.", flags: MessageFlags.Ephemeral })

                }

            case 'loggerSystem':
                
                const guildSettings = client.guildConfigs.get(guildId) || []
                if (!guildSettings || guildSettings.length === 0) return interaction.reply({ content: "Guild settings could not be found. Please contact support.", flags: MessageFlags.Ephemeral })

                let configToEdit = guildSettings.find(config => config.configType === selectedSystem)
                if (!configToEdit) return interaction.reply({ content: "Selected configuration could not be found. Please contact support.", flags: MessageFlags.Ephemeral })

                let configSettings = typeof configToEdit.configSettings === 'string' ? JSON.parse(configToEdit.configSettings) : configToEdit.configSettings

                switch (selectedAction) {

                    case 'selectEvent':
                        const [categoryKey, selectedEvent] = selectedValue.split(':')
                        
                        const actionSelectMenu = new StringSelectMenuBuilder()
                            .setCustomId(`loggerSystem|${guildId}|selectAction_${selectedEvent}`)
                            .setPlaceholder('Choose an action...')
                            .addOptions([
                                {
                                    label: 'Set Channel',
                                    description: 'Configure logging channel for this event',
                                    value: 'setChannel',
                                },
                                {
                                    label: 'Edit Channel',
                                    description: 'Edit logging channel for this event',
                                    value: 'editChannel',
                                },
                                {
                                    label: 'Remove Channel',
                                    description: 'Remove logging channel from this event',
                                    value: 'removeChannel',
                                }
                            ])

                        const actionRow = new ActionRowBuilder().addComponents(actionSelectMenu)
                        const originalNavigationButtons = interaction.message.components[1].components.map(component => ButtonBuilder.from(component) )
                        const originalMenu = StringSelectMenuBuilder.from(interaction.message.components[0].components[0])

                        originalMenu.options.forEach(option => { option.data.default = option.data.value === selectedValue })

                        const originalSelectRow = new ActionRowBuilder().addComponents(originalMenu)
                        const originalNavigationRow = new ActionRowBuilder().addComponents(...originalNavigationButtons)

                        return await interaction.update({ components: [originalSelectRow, actionRow, originalNavigationRow ] })

                    case 'selectAction':
                        switch (selectedValue) { 
                            
                            case 'setChannel':

                                const categoryFromEvent = Object.keys(configSettings.channels).find(category => 
                                    configSettings.channels[category] && configSettings.channels[category][extraPart] !== undefined
                                )
                                
                                const existingChannelId = categoryFromEvent && configSettings.channels[categoryFromEvent][extraPart] 
                                    ? configSettings.channels[categoryFromEvent][extraPart] 
                                    : ''
                                
                                const channelInput = new TextInputBuilder()
                                    .setCustomId('channelInput')
                                    .setLabel('Logging Channel ID')
                                    .setPlaceholder('Enter the logging channel ID')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                                
                                if (existingChannelId) channelInput.setValue(existingChannelId)
                                
                                const modalFillInfo = new ModalBuilder()
                                    .setCustomId(`loggerSystem|${guildId}|setChannelModal_${extraPart}`)
                                    .setTitle('Set Logging Channel')
                                    .addComponents(
                                        new ActionRowBuilder().addComponents(channelInput)
                                    )
                                
                                return await interaction.showModal(modalFillInfo)

                            case 'removeChannel':
                                console.log('Remove channel for', selectedValue)
                                break
                            case 'back':
                                console.log('Back to event selection')
                                break
                            default:
                                return interaction.reply({ content: "Unknown action selected.", flags: MessageFlags.Ephemeral })
                        }
                        break


                    default:

                        return interaction.reply({ content: "Unknown action for logger system.", flags: MessageFlags.Ephemeral })

                        

                }
                break

            default:
                return interaction.reply({ content: "Unknown interaction.", flags: MessageFlags.Ephemeral })
        }
    }  
}
