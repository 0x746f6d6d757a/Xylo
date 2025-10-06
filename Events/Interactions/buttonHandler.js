import { Events, Client, ButtonInteraction } from "discord.js"
import { parseCustomId } from "../../Utils/messages/stringParser.js"

export default {
    name: Events.InteractionCreate,
    /**`
     * @param {ButtonInteraction} interaction
     * @param {Client} client
    */
    async execute(interaction, client) {

        if(!interaction.isButton()) return;

        const { customId, message } = interaction
        const { guildId, selectedSystem, selectedAction } = parseCustomId(customId)

    }
}