const generateCaptcha = require('./functions');
const config = require('./config.json');
const Discord = require('discord.js');
const client = new Discord.Client({
  intents: 3276799,
});
let userTest = new Map()
let userMsgMap = new Map()

client.login(config.token);

client.on('messageCreate', async (message) => {
 if (message.content == 'emitJoin') {
    client.emit('guildMemberAdd', message.member);
  }
});

client.on('ready', () => {
  console.log(`[!] — Logged in as ${client.user.tag} (${client.user.id})`);
 });

client.on('guildMemberAdd', async (member) => {
  const channel = await member.guild.channels.cache.get(config.captcha.channel);
  if (!channel) return console.log('[!] — The channel is not valid please provide a valid channel.');

  const answer = await generateCaptcha();
  let userAnswer;

  const button = new Discord.ButtonBuilder()
    .setLabel('Answer')
    .setCustomId('answer')
    .setStyle(Discord.ButtonStyle.Secondary);

  const row = new Discord.ActionRowBuilder().addComponents(button);

  const msg = await channel.send({
    content: `*${member.user}, answer the captcha above.*`,
    components: [row],
    files: [
      {
        attachment: 'canva.png',
        name: 'canva.png',
      },
    ],
  });
  
  userMsgMap.set(member.user.id, [msg, answer])
  const collector = msg.createMessageComponentCollector({ time: config.captcha.time * 1000 });

  collector.on('collect', async (i) => {
    if(i.user.id !== member.user.id) {
      const embed = new Discord.EmbedBuilder()
      .setTitle('`❌` ▸ Unauthorized User')
      .setDescription('*You are not authorized to use this interaction.*')
      .setFooter({ text: i.user.username, iconURL: i.user.displayAvatarURL() })
      .setColor(config.color)
      .setTimestamp();
  return i.reply({ embeds: [embed], ephemeral: true });
    }
    if (i.customId === 'answer') {
      const modal = new Discord.ModalBuilder()
      .setCustomId('captchaModal')
      .setTitle('Captcha')
  
    const captchaInput = new Discord.TextInputBuilder()
      .setCustomId('answerCaptcha')
      .setLabel('Enter the captcha code below:')
      .setStyle(Discord.TextInputStyle.Short)
      .setPlaceholder('Code Captcha')
      .setMaxLength(6)
      .setMinLength(6);

      const actionRow = new Discord.ActionRowBuilder()
      .addComponents(captchaInput);
  
      modal.addComponents(actionRow);
      await i.showModal(modal);

      await i.awaitModalSubmit({ time: config.captcha.time * 1000 })
    }
  });

  collector.on('end', () => {
    if (!userAnswer || answer != userAnswer) {
      userMsgMap.delete(member.user.id)
      msg.delete().catch(err => {})
      member.kick().catch(err => {})
    }
  });

});

client.on('interactionCreate', async(interaction) => {
  if(interaction.customId === 'captchaModal') {
    const msg = userMsgMap.get(interaction.user.id)[0]
    const answer = userMsgMap.get(interaction.user.id)[1]
    const userAnswer = interaction.fields.getTextInputValue("answerCaptcha")
    if(userAnswer == answer) {
      config.captcha.roles.forEach((role) => {
        interaction.guild.members.cache.get(interaction.user.id).roles.add(role).catch(err => {})
      })
      msg.delete().catch(err => {})
    } else {
      const userData = userTest.get(interaction.user.id) || 0

      if(userData + 1 >= config.captcha.nombreTest) {
      userTest.delete(interaction.user.id);
      msg.delete().catch(err => {})
      interaction.guild.members.cache.get(interaction.user.id).kick().catch(err => {})
      } else {
        const embed = new Discord.EmbedBuilder()
        .setTitle('`❌` ▸ Captcha failed')
        .setDescription(`*You have \`${Number(config.captcha.nombreTest) - (Number(userData) + 1)}\` more tries.*`)
        .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
        .setColor(config.color)
        .setTimestamp();
        userTest.set(interaction.user.id, Number(userData) + 1)
        if(!userMsgMap.get(interaction.user.id)[2]) embedMsg = await interaction.reply({ embeds: [embed], ephemeral: true }), userMsgMap.set(interaction.user.id, [msg, answer, embedMsg]);
        else interaction.deferUpdate(), userMsgMap.get(interaction.user.id)[2].edit({ embeds: [embed]});
      }
    }
  }
})