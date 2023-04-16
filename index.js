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

//let guild;

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
  //guild = client.guilds.cache.get(process.env.GUILD_ID) // get the guild object
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


const getLang = (value) => {
  const lang = value === 0 ? "í" : value > -5 && value < 5 ? "e" : "í";
  return `${value} fazol${lang}`;
}

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

    // const fields = [];
    let reply = "\n\n**Stav fazolí:**\n\n";
    let results = {};
    const guild = await interaction.guild;

    if (guild) {
      pointsRef.get()
      .then((querySnapshot) => {
        const promises = querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const user = await client.users.fetch(data.id);
          const member = await guild.members.fetch(`${data.id}`);
          const role = await member?.roles.cache.find((role) => role.name === 'azték' || role.name === 'may' || role.name === 'ink')?.id;
          return {
            user: user,
            value: data.messageCount,
            role: role
          };
        });
        return Promise.all(promises);
      })
        .then(async (fields) => {

          //console.log(fields);

          results = interaction.guild.roles.cache
            .filter(role => role.name === 'azték' || role.name === 'may' || role.name === 'ink')
            .reduce((prev, role) => {
              prev[role.id] = { roleObject: role};
              return prev;
            }, {})

          Promise.all(Object.keys(results).map(async (key) => {
            results[key]["user"] = fields.filter((field) => {
              return field.role === key;
            });
          })).then(() => {
            // console.log(results); // or do something else with the results
          }).catch((error) => {
            console.error(error); // handle the error appropriately
          });

        }).then(() => {

          Object.keys(results).forEach((key) => {
            reply += `${results[key]?.roleObject} ové - celkem **${getLang(results[key]?.user.reduce((prev, user) => prev + user.value, 0))}**\n`;
            reply += `---------------------------------------\n`;
            results[key]?.user.forEach((user) => reply += `${user.user}\t**${getLang(user.value)}**\n`)
            reply += `---------------------------------------\n\n`;
          })


          interaction.reply(`${reply}`)
        })
        .catch((error) => {
          console.log("Error getting documents: ", error);
        });
    }

  }

  if (interaction.commandName === 'showA' || interaction.commandName === 'showI' || interaction.commandName === 'showM') {

    const pointsRef = db.collection('users');

    // const fields = [];
    let reply = "\n\n**Stav fazolí:**\n\n";
    let results = {};
    const guild = await interaction.guild;

    if (guild) {
      pointsRef.get()
      .then((querySnapshot) => {
        const promises = querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const user = await client.users.fetch(data.id);
          const member = await guild.members.fetch(`${data.id}`);
          const role = await member?.roles.cache.find((role) => role.name === 'azték' || role.name === 'may' || role.name === 'ink')?.id;
          return {
            user: user,
            value: data.messageCount,
            role: role
          };
        });
        return Promise.all(promises);
      })
        .then(async (fields) => {

          //console.log(fields);

          results = interaction.guild.roles.cache
            .filter(role => role.name === 'azték' || role.name === 'may' || role.name === 'ink')
            .reduce((prev, role) => {
              prev[role.id] = { roleObject: role};
              return prev;
            }, {})

          Promise.all(Object.keys(results).map(async (key) => {
            results[key]["user"] = fields.filter((field) => {
              return field.role === key;
            });
          })).then(() => {
            // console.log(results); // or do something else with the results
          }).catch((error) => {
            console.error(error); // handle the error appropriately
          });

        }).then(() => {
          
          const id = interaction.commandName === 'showA' ? 1096512802291716230 : interaction.commandName === 'showM' ? 1096512941899129032 : 1096513016960389130; 
          Object.keys(results).forEach((key) => {
            if (key === id) {
            reply += `${results[key]?.roleObject} ové - celkem **${getLang(results[key]?.user.reduce((prev, user) => prev + user.value, 0))}**\n`;
            reply += `---------------------------------------\n`;
            results[key]?.user.forEach((user) => reply += `${user.user}\t**${getLang(user.value)}**\n`)
            reply += `---------------------------------------\n\n`;
            }
          })


          interaction.reply(`${reply}`)
        })
        .catch((error) => {
          console.log("Error getting documents: ", error);
        });
    }

  }

})

// Log in to Discord with your client's token
client.login(token);