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
        name: "showA",
        description: 'Get a table of points for the Aztecs',
    },
    {
        name: "showM",
        description: 'Get a table of points for the Mayans',
    },
    {
        name: "showI",
        description: 'Get a table of points for the Incas',
    },
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