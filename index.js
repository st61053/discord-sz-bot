const { Client, Events, GatewayIntentBits } = require('discord.js');
const admin = require('firebase-admin');
require('dotenv').config();
const token = process.env.TOKEN;

// Create a new client instance
const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
] });

// Initialize the Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://discord-bot-2cefb-default-rtdb.europe-west1.firebasedatabase.app'
});

// Get a Firestore reference
const db = admin.firestore();

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on('messageCreate', async message => {
  // Ignore messages from bots and system messages
  if (message.author.bot || message.system) {
    return;
  }

  const userId = message.author.id;
  const user = await client.users.fetch(userId);

  const userRef = db.collection('users').doc(userId);
  await userRef.set({
    id: userId,
    name: user.name,
    messageCount: admin.firestore.FieldValue.increment(1)
  }, { merge: true });

  const userDoc = await userRef.get();

  // const channel = message.client.channels.cache.get('1096374648624652318');
  // await channel.send(`${user} poslal/a zprávu! Počet bodů: ${userDoc.data().messageCount}`);

    console.log(`${user.name} poslal/a zprávu! Počet bodů za aktivitu: ${userDoc.data().messageCount}`);

});

// commands
client.on('interactionCreate', (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'add') {
    
  }

})

// Log in to Discord with your client's token
client.login(token);