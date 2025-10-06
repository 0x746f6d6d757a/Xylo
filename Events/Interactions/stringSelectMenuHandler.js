import { Events, MessageFlags, StringSelectMenuInteraction } from "discord.js"
import { parseCustomId } from "../../Utils/messages/stringParser.js"
import sendLoggerPanel from "../../Utils/messages/Panels/loggerPanel.js"


export default {
    name: Events.InteractionCreate,
    /**
     * @param {StringSelectMenuInteraction} interaction 
     * @param {Client} client
     */
    async execute(interaction, client) {
        if (!interaction.isStringSelectMenu()) return

        const { customId, values, message } = interaction
        const { guildId, selectedSystem, selectedAction } = parseCustomId(customId)
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

            default:
                return interaction.reply({ content: "Unknown interaction.", flags: MessageFlags.Ephemeral })
        }
    }  
}
