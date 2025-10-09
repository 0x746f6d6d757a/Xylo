import { ChatInputCommandInteraction, Client, MessageFlags, SlashCommandBuilder } from "discord.js";
import { eventHandler } from "../../Handlers/eventHandler.js";
import { commandHandler } from "../../Handlers/commandHandler.js";

export default {
    data: new SlashCommandBuilder()
        .setName('developer_reload')
        .setDescription('Reload events or commands.')
        .addStringOption( option => option
            .setName('prompt')
            .setDescription('Select what you want to reload.')
            .setRequired(true)
            .addChoices(
                { name: 'Events',   value: 'event' }, 
                { name: 'Commands', value: 'commands' },
                { name: 'Events & Commands', value: 'both' }
            )
        ),
    /**
     * 
     * @param {ChatInputCommandInteraction} interaction 
     * @param {Client} client 
     */
    async execute(interaction, client) {
        if(!interaction.isCommand()) return

        const { options, user } = interaction

        const developerId = client.developer.id
        if(developerId !== user.id) return interaction.reply({ content: 'You can\'t execute this command.', flags: MessageFlags.Ephemeral })

        let prompt = options.getString('prompt')
        
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })

        switch(prompt) {

            case 'event':
                
                await eventHandler(client)
                await interaction.editReply({ content: `You have refreshed all the events.` })

                break

            case 'commands':

                await commandHandler(client)
                await interaction.editReply({ content: `You have refreshed all the commands.` })

                break

            case 'both':

                await eventHandler(client)
                await commandHandler(client)
                await interaction.editReply({ content: `You have refreshed all the events and commands.` })

                break

            default: 
                interaction.reply({ content: `The selected value is not an option.`, flags: MessageFlags.Ephemeral })

        }

    }

}