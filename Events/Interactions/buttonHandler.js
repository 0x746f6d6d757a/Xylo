import { Events, Client, ButtonInteraction, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js"
import { parseCustomId } from "../../Utils/messages/stringParser.js"
import { updateGuildConfig } from "../../Utils/database/databaseManager.js"
import { sendChannelManagementPanel, sendLoggerPanel } from "../../Utils/messages/Panels/loggerPanel.js"
import { sendSettingsMenu } from "../../Utils/messages/Panels/settingsPanel.js"

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

        if (selectedSystem === 'changeSettings') {
            switch(selectedAction) {
                case 'mainMenu':
                    return await sendSettingsMenu(interaction, client)

                default:
                    return interaction.reply({ content: "Unknown action.", flags: MessageFlags.Ephemeral })
            }
        }

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
                        return await sendChannelManagementPanel(configSettings, interaction, client)

                    case 'mainMenu':
                        return await sendLoggerPanel(configSettings, interaction, client)

                    default:
                        return interaction.reply({ content: "Unknown action.", flags: MessageFlags.Ephemeral })
                }
            
            default:
                return interaction.reply({ content: "Unknown system.", flags: MessageFlags.Ephemeral })
        }
    }
}