import { Events, Client, ActivityType } from "discord.js"
import logger from "../../Functions/logger.js";
import { commandHandler } from "../../Handlers/commandHandler.js";

export default {
    name: Events.ClientReady,
    once: true,
    /**
     * Executes when the client is ready.
     * @param {Client} client
    */
    async execute(client) {

        await commandHandler(client);
        logger('app', 'info', `Logged in as ${client.user.tag}`)

        // Get developer information to store inside the config
        const developer = await client.users.fetch(process.env.DEVELOPER_ID)
        if (!developer) {
            logger('app', 'warn', `Developer with ID ${process.env.DEVELOPER_ID} not found.`)
        } else {
            client.developer = {
                id: developer.id,
                tag: developer.tag,
                icon: developer.displayAvatarURL(),
                username: developer.username
            }
            logger('app', 'info', `Developer info loaded: ${developer.tag} (${developer.id})`)
        }

        // Set an array of activities the bot will cycle through every 10 minutes
        let activitiesIndex = 0
        const activities = [
            { name: 'the server.', type: ActivityType.Watching },
            { name: 'my code.', type: ActivityType.Playing },
            { name: 'for commands.', type: ActivityType.Watching }
        ]

        setInterval(() => {
            if (!client || !client.user) return
            activitiesIndex = (activitiesIndex + 1) % activities.length
            const activity = activities[activitiesIndex]
            client.user.setActivity(activity)
        }, 10 * 60 * 1000)

    }
}