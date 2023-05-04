const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const admin = require('firebase-admin');
require('dotenv').config();
const token = process.env.TOKEN;

const detective = true;

let answer = null;
let aztAnswer = false;
let mayAnswer = false;
let incAnswer = false;

let aztTry = 0;
let mayTry = 0;
let incTry = 0;

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

var cron = require('node-cron');

cron.schedule('0 20 * * *', () => {
  if (detective) {
    detectivePike();
  }
});


const getLang = (value) => {
  const lang = value === 0 ? "í" : value > -5 && value < 5 ? "e" : "í";
  return `${value} fazol${lang}`;
}

const detectivePike = () => {
  // Find the channel by its ID
  // const channel = client.channels.cache.get('1099363680065433600');

  const azt = client.channels.cache.get('1096512802291716230');
  const may = client.channels.cache.get('1096512941899129032');
  const inc = client.channels.cache.get('1096513016960389130');

  const questionsRef = db.collection('questions');
  questionsRef.get()
    .then(async (querySnapshot) => {
      const questions = [];
      querySnapshot.forEach((doc) => {
        questions.push({ id: doc.id, ...doc.data() });
      });

      const q = questions.find((quest) => quest.state);

      if (q) {
        answer = q.a.toLocaleLowerCase();
        // Do something with the array of documents
        console.log(`Today question: ${q.q}`);

        roles = azt.guild.roles.cache
          .filter(role => role.name === 'azték' || role.name === 'may' || role.name === 'ink')
          .reduce((prev, role) => {
            prev[role.id] = { roleObject: role };
            return prev;
          }, {})

        // Send the message to the channel
        // channel.send(`${q.q}`);
        azt.send(`${roles[azt.id]?.roleObject} ové\n${q.q}`);
        may.send(`${roles[may.id]?.roleObject} ové\n${q.q}`);
        inc.send(`${roles[inc.id]?.roleObject} ové\n${q.q}`);

        const questRef = db.collection('questions').doc(q.id);
        await questRef.set({
          ...q,
          state: false
        }, { merge: true });

        setTimeout(() => {
          answer = null;
          aztTry = 0;
          mayTry = 0;
          incTry = 0;
          console.log("Reset daily answer");
        }, 60 * 60 * 1000);

      }

    })
    .catch((error) => {
      console.log("Error getting documents: ", error);
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

          const id = interaction.commandName === 'get-aztecs-points' ? '1096512802291716230' : interaction.commandName === 'get-mayans-points' ? '1096512941899129032' : '1096513016960389130';
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

  if (interaction.commandName === "answer") {

    const azt = client.channels.cache.get('1096512802291716230');
    const may = client.channels.cache.get('1096512941899129032');
    const inc = client.channels.cache.get('1096513016960389130');

    const userAnswer = interaction.options.get('answer').value;

    if (interaction.channel === azt) {
      if (answer) {
        if (!aztAnswer) {
          if (aztTry < 3) {
            if (answer === userAnswer.toLocaleLowerCase()) {

              const points = 10;

              const userRef = db.collection('users').doc(interaction.user.id);
              await userRef.set({
                id: interaction.user.id,
                messageCount: admin.firestore.FieldValue.increment(points)
              }, { merge: true });


              const lang = points === 1 ? "i" : points < 5 ? "e" : "í";
              interaction.reply(`${interaction.user} dostal příděl  **${points} fazol${lang}** od Bohů !`)

              aztAnswer = true;
            } else {
              aztTry++;
              interaction.reply(`Špatná odpověď - ${aztTry}/3`);
            }
          } else {
            interaction.reply("Byl vyčerpán limit pokusů na odpověď.");
          }

        } else {
          interaction.reply("Na dnešní otázku už bylo odpovězeno.");
        }
      } else {
        interaction.reply("Čas vypršel! Není tu nic, na co by se dalo odpovědět.");
      }
    }

    if (interaction.channel === may) {
      if (answer) {
        if (!mayAnswer) {
          if (mayTry < 3) {
            if (answer === userAnswer.toLocaleLowerCase()) {

              const points = 10;

              const userRef = db.collection('users').doc(interaction.user.id);
              await userRef.set({
                id: interaction.user.id,
                messageCount: admin.firestore.FieldValue.increment(points)
              }, { merge: true });


              const lang = points === 1 ? "i" : points < 5 ? "e" : "í";
              interaction.reply(`${interaction.user} dostal příděl  **${points} fazol${lang}** od Bohů !`)

              mayAnswer = true;
            } else {
              mayTry++;
              interaction.reply(`Špatná odpověď - ${mayTry}/3`);
            }
          } else {
            interaction.reply("Byl vyčerpán limit pokusů na odpověď.");
          }

        } else {
          interaction.reply("Na dnešní otázku už bylo odpovězeno.");
        }
      } else {
        interaction.reply("Čas vypršel! Není tu nic, na co by se dalo odpovědět.");
      }
    }

    if (interaction.channel === inc) {
      if (answer) {
        if (!incAnswer) {
          if (incTry < 3) {
            if (answer === userAnswer.toLocaleLowerCase()) {

              const points = 10;

              const userRef = db.collection('users').doc(interaction.user.id);
              await userRef.set({
                id: interaction.user.id,
                messageCount: admin.firestore.FieldValue.increment(points)
              }, { merge: true });


              const lang = points === 1 ? "i" : points < 5 ? "e" : "í";
              interaction.reply(`${interaction.user} dostal příděl  **${points} fazol${lang}** od Bohů !`)

              incAnswer = true;
            } else {
              incTry++;
              interaction.reply(`Špatná odpověď - ${incTry}/3`);
            }
          } else {
            interaction.reply("Byl vyčerpán limit pokusů na odpověď.");
          }

        } else {
          interaction.reply("Na dnešní otázku už bylo odpovězeno.");
        }
      } else {
        interaction.reply("Čas vypršel! Není tu nic, na co by se dalo odpovědět.");
      }
    }
  }

})

// Log in to Discord with your client's token
client.login(token);