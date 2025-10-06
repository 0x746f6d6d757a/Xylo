import { Events, StringSelectMenuInteraction } from "discord.js";
import { parseCustomId } from "../../Utils/messages/stringParser.js";

export default {
    name: Events.InteractionCreate,
    /**
     * @param {StringSelectMenuInteraction} interaction 
     * @param {Client} client
     */
    async execute(interaction, client) {
        if (!interaction.isStringSelectMenu()) return;

        const { customId, values, message } = interaction;
        const { guildId, selectedSystem } = parseCustomId(customId);
        const selectedValue = values[0]; // Assuming single select menu

        // Handle the string select menu interaction based on the parsed values
        if (selectedSystem === 'changeSettings') {
            // Logic to handle changing settings based on selectedValue
            await interaction.reply({ content: `You selected to change the setting: ${selectedValue}`, ephemeral: true });
        } else {
            await interaction.reply({ content: "Unknown selection.", ephemeral: true });
        }
    }  
}
