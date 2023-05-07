const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const admin = require('firebase-admin');
require('dotenv').config();
const token = process.env.TOKEN;

let answer = null;
let reward = [25, 20, 15, 10, 5];
let answerPlayers = [];
let winnerCount = 0;
let playerTrys = {};

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

// var cron = require('node-cron');

// cron.schedule('0 18 * * *', () => {
//   if (detective) {
//     detektivePike2();
//   }
// }, {
//   timezone: "Europe/Berlin"
// });

const getLang = (value) => {
  const lang = value === 0 ? "í" : value > -5 && value < 5 ? "e" : "í";
  return `${value} fazol${lang}`;
}

const detektivePike2 = () => {
  const channel = client.channels.cache.get('1103795567450144829');

  // Execute the query
  db.collection('questions').where("state", "==", true).limit(1).get().then((querySnapshot) => {
    // Check if there is a document that matches the query
    if (!querySnapshot.empty) {

      // Access the data of the document
      const data = querySnapshot.docs[0].data();

      answer = data.a.toLocaleLowerCase();
      // Do something with the array of documents
      console.log(`Today question: ${data.q}`);

      let reply = "**Dnešní otázka zní:**\n";
      reply += `${data.q}`;

      channel.send(`${reply}`);

      db.collection('questions').doc(data.id).update({ state: false })

      setTimeout(() => {
        if (answer) {
          let r = `**Čas vypršel!**\nSprávná odpověď byla: ${answer}\n\n`;
          answerPlayers.forEach((user, i) => r += `${i + 1}. místo \t\t${user}\n`)
          channel.send(`${r}`);
          answer = null;
          answerPlayers = [];
          winnerCount = 0;
          playerTrys = {};
          console.log("Reset daily answer");
        }
      }, 60 * 60 * 1000);

    } else {
      console.log("No documents found");
    }
  }).catch((error) => {
    console.log("Error getting documents:", error);
  });

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
              prev[role.id] = { roleObject: role };
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

  if (interaction.commandName === 'get-aztecs-points' || interaction.commandName === 'get-incas-points' || interaction.commandName === 'get-mayans-points') {

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

          results = interaction.guild.roles.cache
            .filter(role => role.name === 'azték' || role.name === 'may' || role.name === 'ink')
            .reduce((prev, role) => {
              prev[role.id] = { roleObject: role };
              return prev;
            }, {})

          Promise.all(Object.keys(results).map((key) => {
            results[key]["user"] = fields.filter((field) => {
              return field.role === key;
            });
          })).then(() => {
            const id = interaction.commandName === 'get-aztecs-points' ? '1096512802291716230' : interaction.commandName === 'get-mayans-points' ? '1096512941899129032' : '1096513016960389130';
            Object.keys(results).forEach((key) => {
              if (key === id) {
                reply += `${results[key]?.roleObject} ové - celkem **${getLang(results[key]?.user.reduce((prev, user) => prev + user.value, 0))}**\n`;
                reply += `---------------------------------------\n`;
                results[key]?.user.forEach((user) => reply += `${user.user}\t**${getLang(user.value)}**\n`)
                reply += `---------------------------------------\n\n`;
              }
            })
            console.log(interaction.commandName);
            interaction.reply(`${reply}`);
          }).catch((error) => {
            console.error(error); // handle the error appropriately
          });

        })
    }

  }

  if (interaction.commandName === "answer") {
    const channel = client.channels.cache.get('1103795567450144829');

    const userAnswer = interaction.options.get('answer').value;

    if (interaction.channel === channel) {
      if (answer) {
        if (!answerPlayers.find((user) => user === interaction.user)) {
          if (winnerCount < reward.length) {
            if (playerTrys[interaction.user.id] === undefined || playerTrys[interaction.user.id] < 3) {
              if (answer === userAnswer.toLocaleLowerCase()) {

                const userRef = db.collection('users').doc(interaction.user.id);
                await userRef.set({
                  id: interaction.user.id,
                  messageCount: admin.firestore.FieldValue.increment(reward[winnerCount])
                }, { merge: true });

                const lang = reward[winnerCount] === 1 ? "i" : reward[winnerCount] < 5 ? "e" : "í";
                interaction.reply({ content: `${interaction.user} dostal/a příděl  **${reward[winnerCount]} fazol${lang}** od Bohů za správnou odpověď!`, ephemeral: true })
                channel.send(`${interaction.user} odpověděl/a správně!`);

                answerPlayers.push(interaction.user);
                winnerCount++;

                if (winnerCount === reward.length) {
                  let r = `**Fazolky jsou rozdány!**\nSprávná odpověď byla: ${answer}\n\n`;
                  answerPlayers.forEach((user, i) => r += `${i + 1}. místo \t\t${user}\n`)
                  channel.send(`${r}`);
                  answer = null;
                  answerPlayers = [];
                  winnerCount = 0;
                  playerTrys = {};
                }

              } else {
                if (!playerTrys[interaction.user.id]) {
                  playerTrys[interaction.user.id] = 1;
                } else {
                  playerTrys[interaction.user.id]++;
                }
                interaction.reply({ content: `${interaction.user} Špatná odpověď - ${playerTrys[interaction.user.id]}/3` });
              }
            } else {
              interaction.reply({ content: `${interaction.user} Byl vyčerpán limit pokusů na odpověď.` });
            }

          } else {
            interaction.reply({ content: `${interaction.user} Na dnešní otázku už bylo odpovězeno.` });
          }

        } else {
          interaction.reply({ content: `${interaction.user} Za dnešní otázku už si získal/a fazolky."` });
        }
      } else {
        interaction.reply({ content: `${interaction.user} Není tu nic, na co by se dalo odpovědět.` });
      }
    }
  }

  if (interaction.commandName === "start") {
    detektivePike2();
    interaction.reply(`Detektiv Štika spuštěn!`);
  }

  if (interaction.commandName === "prepare") {
    const channel = client.channels.cache.get('1103795567450144829');
    interaction.reply(`Detektiv Štika připraven ke spuštění.`);
    channel.send("**Připravte se, detektiv Štika brzo začne.**");
  }

  if (interaction.commandName === "penis") {
    const randomNum = Math.random() * (12 - 2) + 2;
    const l =  Number(randomNum.toFixed(2));
    interaction.reply(`${interaction.user} má penis dlouhý ${l} palců.`);
  }

})

// Log in to Discord with your client's token
client.login(token);