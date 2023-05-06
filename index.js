const generateCaptcha = require("./functions");
const { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const client = new Client({
  intents: 3276799,
});

const config = require("./config.json");

client.on("messageCreate", async (message) => {
 if (message.content == "emitJoin") {
    client.emit("guildMemberAdd", message.member);
  }
});

client.on("guildMemberAdd", async (member) => {
  const channel = await member.guild.channels.cache.get(config.captcha.channel);
  if (!channel) return console.log("[!] Invalid Channel");

  const answer = await generateCaptcha();
  let userAnswer;

  const imageUrl = `attachment://canva.png`;

  const button = new ButtonBuilder()
    .setLabel("Répondre")
    .setCustomId("answer")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);

  const msg = await channel.send({
    content: `${member.user}, répondez au captcha ci-dessus.`,
    components: [row],
    files: [
      {
        attachment: "canva.png",
        name: "canva.png",
      },
    ],
  });

  const filter = (interaction) => {
    return interaction.user.id === member.user.id;
  };

  const collector = msg.channel.createMessageComponentCollector({ filter, time: config.captcha.time * 1000 });

  collector.on("collect", async (i) => {
    if (i.customId === "answer") {

      const modal = new ModalBuilder()
      .setCustomId('captchaModal')
      .setTitle('Captcha')
  
    const captchaInput = new TextInputBuilder()
      .setCustomId("answerCaptcha")
      .setLabel('Entrez le code ci-dessous:')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Code Captcha')
      .setMaxLength(6)
      .setMinLength(6);

      const actionRow = new ActionRowBuilder()
      .addComponents(captchaInput);
  
      modal.addComponents(actionRow);
      await i.showModal(modal);

      await i.awaitModalSubmit({ time: config.captcha.time * 1000, filter })
      .then(async (interaction) => {
        userAnswer = interaction.fields.fields.find(f => f.customId === "answerCaptcha").value;
        if(userAnswer == answer) {
          config.captcha.roles.forEach((role) => {
            member.roles.add(role).catch(err => {})
          })
          msg.delete().catch(err => {})
        } else {
          msg.delete().catch(err => {})
          member.kick().catch(err => {})
        }
        interaction.deferUpdate().catch(err => {})
      })
    }
  });

  collector.on("end", () => {
    if (!userAnswer || answer != userAnswer) {
      msg.delete().catch(err => {})
      member.kick().catch(err => {})
    }
  });

});


client.login(config.token) 
