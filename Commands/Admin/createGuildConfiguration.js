import { SlashCommandBuilder, ChatInputCommandInteraction, Client, MessageFlags, Events } from "discord.js"
import executeQuery, { refreshClientConfigs } from "../../Utils/database/databaseManager.js"
import logger from "../../Functions/logger.js"


export default {
    data: new SlashCommandBuilder()
        .setName('guild_setup')
        .setDescription('Start the process of setting up the bot for your guild.'),

    /**
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        if (!interaction.isCommand()) return

        await interaction.deferReply({ flags: MessageFlags.Ephemeral })

        const { guildId } = interaction

        const checkIfGuildExistsQuery = `SELECT * FROM guilds WHERE guildId = ?`
        const { rows } = await executeQuery(checkIfGuildExistsQuery, guildId)

        if (rows.length > 0) {
            logger('db', 'info', `Guild ${interaction.guild.name} (${guildId}) already exists.`)
            return interaction.editReply({ content: "This guild has already been set up." })
        }

        logger('db', 'info', `Starting setup for guild ${interaction.guild.name} (${guildId})...`)

        let setupQuery = `INSERT INTO guilds (guildId, ownerId, isPaying) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ownerId = VALUES(ownerId), isPaying = VALUES(isPaying)`
        await executeQuery(setupQuery, guildId, interaction.guild.ownerId, 0)

        // Base query (safe upsert)
        const defaultConfigQuery = `INSERT INTO guild_configs (guildId, configType, configSettings) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE configSettings = VALUES(configSettings)`

        let loggerConfig = {
            enabled: true,
            channels: {
                "automod": {
                    enabled: false,
                    channelId: null,
                    events: {
                        "autoModerationActionExecution": { enabled: false },
                        "autoModerationRuleCreate":      { enabled: false },
                        "autoModerationRuleDelete":      { enabled: false },
                        "autoModerationRuleUpdate":      { enabled: false }
                    }
                },
                "guild": {
                    enabled: false,
                    channelId: null,
                    events: {
                        "guildUpdate": { enabled: false }
                    }
                },
                "members": {
                    enabled: false,
                    channelId: null,
                    events: {
                        "guildMemberAdd":    { enabled: false },
                        "guildMemberRemove": { enabled: false },
                        "guildMemberUpdate": { enabled: false }
                    }
                },
                "roles": {
                    enabled: false,
                    channelId: null,
                    events: {
                        "roleCreate": { enabled: false },
                        "roleDelete": { enabled: false },
                        "roleUpdate": { enabled: false }
                    }
                },
                "invites": {
                    enabled: false,
                    channelId: null,
                    events: {
                        "inviteCreate": { enabled: false },
                        "inviteDelete": { enabled: false }
                    }
                },
                "channels": {
                    enabled: false,
                    channelId: null,
                    events: {
                        "channelCreate":     { enabled: false },
                        "channelDelete":     { enabled: false },
                        "channelUpdate":     { enabled: false },
                        "channelPinsUpdate": { enabled: false }
                    }
                },
                "messages": {
                    enabled: false,
                    channelId: null,
                    events: {
                        "messageCreate":         { enabled: false },
                        "messageDelete":         { enabled: false },
                        "messageUpdate":         { enabled: false },
                        "messageDeleteBulk":     { enabled: false },
                        "messagePollVoteAdd":    { enabled: false },
                        "messagePollVoteRemove": { enabled: false }
                    }
                },
                "threads": {
                    enabled: false,
                    channelId: null,
                    events: {
                        "threadCreate":         { enabled: false },
                        "threadDelete":         { enabled: false },
                        "threadUpdate":         { enabled: false },
                        "threadListSync":       { enabled: false },
                        "threadMemberUpdate":   { enabled: false },
                        "threadMembersUpdate":  { enabled: false }
                    }
                },
                "voice": {
                    enabled: false,
                    channelId: null,
                    events: {
                        "voiceChannelEffectSend": { enabled: false },
                        "voiceServerUpdate":      { enabled: false },
                        "voiceStateUpdate":       { enabled: false }
                    }
                }
            },
            loggingLevel: 3
        }

        await executeQuery(defaultConfigQuery, guildId, 'loggerSystem', JSON.stringify(loggerConfig))
        
        // let ticketSystemConfig = {
        //     enabled: true,                              // Ticket system on/off
        //     modality: "channel",                        // "channel" or "thread"
        //     type: "buttons",                            // "buttons" or "select"
        //     generalCategoryID: null,                    // Where ticket channels are created
        //     ticketLimit: 1,                             // Max tickets per user
        //     rolesInTicket: [],                          // Roles auto-added to ticket
        //     usersInTicket: [interaction.guild.ownerId], // Users always added

        //     // Panel shown to users before ticket creation
        //     ticketPanelEmbed: {
        //         title: "Ticket System | Powered by Xylo",
        //         description: "Please select a ticket category from below.",
        //         color: 0x0099ff,
        //     },

        //     ticketSettingsEmbed: {
        //         title: "Welcome to your ticket!",
        //         description: "Please describe your issue and a staff member will help you shortly.",
        //         color: 0x00ff99,
        //     },
        //     settings: {
        //         buttons: [
        //             {
        //                 label: "General Support",
        //                 style: "Primary",
        //                 emoji: "📩",
        //                 categoryId: null,
        //             },
        //             {
        //                 label: "Report a Bug",
        //                 style: "Danger",
        //                 emoji: "🐞",
        //                 categoryId: null,
        //             }
        //         ],
        //         select: [
        //             {
        //                 label: "General Support",
        //                 description: "Open a ticket for general help",
        //                 value: "general_support",
        //                 categoryId: null,
        //             },
        //             {
        //                 label: "Bug Report",
        //                 description: "Open a ticket to report a bug",
        //                 value: "bug_report",
        //                 categoryId: null,
        //             }
        //         ]
        //     }
        // }

        // await executeQuery(defaultConfigQuery, guildId, 'ticketSystem', JSON.stringify(ticketSystemConfig))

        // // verificationSystem config
        // let verificationSystemConfig = {
        //     enabled: false,
        //     type: 1,

        //     channelId: null,
        //     messageId: null,
        //     settings: []
        // }
        // await executeQuery(defaultConfigQuery, guildId, 'verificationSystem', JSON.stringify(verificationSystemConfig))

        // // welcomeSystem config
        // let welcomeSystemConfig = {
        //     enabled: false,
        //     channelId: null,
        //     message: "Welcome to the server, {user}!",
        //     privateMessage: {
        //         enabled: false,
        //         message: "Welcome to the server, {user}! We're glad to have you here."
        //     }
        // }
        // await executeQuery(defaultConfigQuery, guildId, 'welcomeSystem', JSON.stringify(welcomeSystemConfig))

        // // farewellSystem config
        // let farewellSystemConfig = {
        //     enabled: false,
        //     channelId: null,
        //     message: "Goodbye, {user}!",
        //     privateMessage: {
        //         enabled: false,
        //         message: "Goodbye, {user}! We're sad to see you go."
        //     }
        // }
        // await executeQuery(defaultConfigQuery, guildId, 'farewellSystem', JSON.stringify(farewellSystemConfig))

        // // autoRoleSystem config
        // let autoRoleSystemConfig = {
        //     enabled: false,
        //     roleIds: []
        // }
        // await executeQuery(defaultConfigQuery, guildId, 'autoRoleSystem', JSON.stringify(autoRoleSystemConfig))

        // // reactionRoleSystem config
        // let reactionRoleSystemConfig = {
        //     enabled: false,
        //     message: [ new EmbedBuilder() ],
        //     roleMappings: [ { emoji: null, roleId: null } ]
        // }
        // await executeQuery(defaultConfigQuery, guildId, 'reactionRoleSystem', JSON.stringify(reactionRoleSystemConfig))

        // // messageFilteringSystem config
        // let messageFilteringSystemConfig = {
        //     enabled: false,
        //     blacklistedWords: [],
        //     action: { type: "delete" }
        // }
        // await executeQuery(defaultConfigQuery, guildId, 'messageFilteringSystem', JSON.stringify(messageFilteringSystemConfig))

        // // antiSpamSystem config
        // let antiSpamSystemConfig = {
        //     enabled: false,
        //     maxMessages: 5,
        //     intervalSeconds: 10,
        //     punishment: { action: "mute", durationMinutes: 5 }
        // }
        // await executeQuery(defaultConfigQuery, guildId, 'antiSpamSystem', JSON.stringify(antiSpamSystemConfig))

        // // antiRaidSystem config
        // let antiRaidSystemConfig = {
        //     enabled: false,
        //     joinLimit: 5,
        //     intervalSeconds: 30,
        //     action: { type: "ban" }
        // }
        // await executeQuery(defaultConfigQuery, guildId, 'antiRaidSystem', JSON.stringify(antiRaidSystemConfig))

        // // serverProtectionSystem config
        // let serverProtectionSystemConfig = {
        //     enabled: true,
        //     protectChannels: true,
        //     protectRoles: true,
        //     protectPermissions: true,
        //     timeFrameMinutes: 5,
        //     threshold: 2,               
        //     action: { type: "ban" },
        //     trustedRoles: [],
        //     trustedUsers: [],
        //     logChannelId: null,
        //     backupRetention: 7 
        // }
        // await executeQuery(defaultConfigQuery, guildId, 'serverProtectionSystem', JSON.stringify(serverProtectionSystemConfig))

        // // nicknameFilteringSystem config
        // let nicknameFilteringSystemConfig = {
        //     enabled: false,
        //     forbiddenPatterns: [],
        //     action: { type: "reset" }
        // }
        // await executeQuery(defaultConfigQuery, guildId, 'nicknameFilteringSystem', JSON.stringify(nicknameFilteringSystemConfig))

        // // ghostPingDetectionSystem config
        // let ghostPingDetectionSystemConfig = {
        //     enabled: false,
        //     action: { type: "warn" }
        // }
        // await executeQuery(defaultConfigQuery, guildId, 'ghostPingDetectionSystem', JSON.stringify(ghostPingDetectionSystemConfig))

        await refreshClientConfigs(client)


        await interaction.editReply({ content: "Your guild has been successfully set up with default configurations." })

    }
}