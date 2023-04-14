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

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on('messageCreate', async message => {
  // Ignore messages from bots and system messages
  if (message.author.bot || message.system) {
    return;
  }

  // Increment the message count for this user
  const userId = message.author.id;
  const userRef = db.collection('users').doc(userId);
  await userRef.set({
    id: userId,
    messageCount: admin.firestore.FieldValue.increment(1)
  }, { merge: true });

  // Log the message count to the console
  const userDoc = await userRef.get();
  const user = await client.users.fetch(userId);

  const channel = message.client.channels.cache.get('1094501107503464488');

    await channel.send(`${user} poslal/a zprávu! Počet bodů: ${userDoc.data().messageCount}`);

});

// Log in to Discord with your client's token
client.login(token);