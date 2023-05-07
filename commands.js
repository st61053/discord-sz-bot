require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
    {
        name: "add",
        description: 'Add points to user',
        options: [
            {
                name: 'user',
                description: "user",
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'points',
                description: "points",
                type: ApplicationCommandOptionType.Number,
                required: true,
            },
        ],
    },
    {
        name: "remove",
        description: 'Remove points to user',
        options: [
            {
                name: 'user',
                description: "user",
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'points',
                description: "points",
                type: ApplicationCommandOptionType.Number,
                required: true,
            },
        ]
    },
    {
        name: "get",
        description: 'Get a table of points',
    },
    {
        name: "get-aztecs-points",
        description: 'Get a table of points for the Aztecs',
    },
    {
        name: "get-mayans-points",
        description: 'Get a table of points for the Mayans',
    },
    {
        name: "get-incas-points",
        description: 'Get a table of points for the Incas',
    },
    {
        name: "answer",
        description: 'Answer the question',
        options: [
            {
                name: 'answer',
                description: "answer",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ]
    },
    {
        name: "start",
        description: 'Start detective pike',
    },
    {
        name: "prepare",
        description: 'Get ready for detective pike',
    }
]

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        )

        console.log("Slash commands were registered successfully!")
        
    } catch (error) {
        console.log(`There was an error: ${error}`)
    }
})();