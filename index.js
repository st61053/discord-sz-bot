const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const admin = require('firebase-admin');
require('dotenv').config();
const token = process.env.TOKEN;

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

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

// client.on('messageCreate', async message => {
//   // Ignore messages from bots and system messages
//   if (message.author.bot || message.system) {
//     return;
//   }

//   const userId = message.author.id;

//   const userRef = db.collection('users').doc(userId);
//   await userRef.set({
//     id: userId,
//     messageCount: admin.firestore.FieldValue.increment(1)
//   }, { merge: true });

//   const userDoc = await userRef.get();
//   const user = await client.users.fetch(userId);

//   // const channel = message.client.channels.cache.get('1096374648624652318');
//   // await channel.send(`${user} poslal/a zprávu! Počet bodů: ${userDoc.data().messageCount}`);

//     console.log(`${user} poslal/a zprávu! Počet bodů za aktivitu: ${userDoc.data().messageCount}`);

// });

// commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'add') {
    const userId = interaction.options.get('user').value;
    const points = interaction.options.get('points').value;

    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      id: userId,
      messageCount: admin.firestore.FieldValue.increment(points)
    }, { merge: true });

    const user = await client.users.fetch(userId);
    const lang = points === 1 ? "i" : points < 5 ? "e" : "í";
    interaction.reply(`${user} dostal příděl  **${points} fazol${lang}** od Bohů !`)
  }

  if (interaction.commandName === 'remove') {
    const userId = interaction.options.get('user').value;
    const points = interaction.options.get('points').value;

    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      id: userId,
      messageCount: admin.firestore.FieldValue.increment(-points)
    }, { merge: true });

    const user = await client.users.fetch(userId);
    const lang = points === 1 ? "i" : points < 5 ? "e" : "í";
    interaction.reply(`${user} si rozhněval Bohy a ztratil  **${points} fazol${lang}** !`)
  }

  if (interaction.commandName === 'get') {

    const pointsRef = db.collection('users');

    const fields = [];

    pointsRef.get()
    .then((querySnapshot) => {
      querySnapshot.forEach(async (doc) => {
        // Access data for each document
        const data = doc.data();
        // const user = await client.users.fetch(data.id);
        // const lang = data.messageCount === 0 ? "í" : data.messageCount > -5 && data.messageCount < 5 ? "e" : "í";

        // fields.push({
        //   name: user,
        //   value: `${data.messageCount} fazol${lang}`
        // });
        console.log(data);
      });

      // const embed = {
      //   title: "Stav fazolí",
      //   fields: fields,
      // }
  
      // interaction.reply({ embeds: [embed] });

    })
    .catch((error) => {
      console.log("Error getting documents: ", error);
    });

  }

})

// Log in to Discord with your client's token
client.login(token);