// Ensure ReadableStream exists for undici on older Node versions
if (typeof globalThis.ReadableStream === 'undefined') {
  try {
    // web-streams-polyfill provides a ponyfill we can use at runtime
    const pony = require('web-streams-polyfill/ponyfill');
    if (pony && pony.ReadableStream) {
      globalThis.ReadableStream = pony.ReadableStream;
    }
  } catch (e) {
  }
}

try {
  if (typeof globalThis.Blob === 'undefined' || typeof globalThis.File === 'undefined') {
    const FetchBlob = require('fetch-blob');
    const FetchFile = require('fetch-blob/file.js');
    if (FetchBlob && FetchBlob.Blob) globalThis.Blob = FetchBlob.Blob;
    if (FetchFile && FetchFile.default) globalThis.File = FetchFile.default;
    else if (FetchFile) globalThis.File = FetchFile;
  }
} catch (e) {
}

require('dotenv').config();
console.log('index.js starting, NODE version', process.version);
console.log('DISCORD_TOKEN present?', !!process.env.DISCORD_TOKEN);
const { Client, GatewayIntentBits, Partials, Collection, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

const TICKET_CATEGORY_NAME = process.env.TICKET_CATEGORY_NAME || 'Tickets';

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'ticket') {
        const sub = interaction.options.getSubcommand();
        if (sub === 'create') {
          await handleCreate(interaction);
        } else if (sub === 'close') {
          await handleCloseCommand(interaction);
        } else if (sub === 'panel') {
          await handlePanelCommand(interaction);
        }
      }
    } else if (interaction.isButton()) {
      if (interaction.customId === 'ticket_create_button') {
        await handleCreate(interaction);
      } else if (interaction.customId === 'ticket_close_button') {
        await handleCloseButton(interaction);
      } else if (interaction.customId === 'ticket_confirm_close') {
        await confirmClose(interaction);
      }
    }
  } catch (err) {
    console.error('Interaction handler error:', err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Une erreur est survenue.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
    }
  }
});

async function handleCreate(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const guild = interaction.guild;
  if (!guild) return interaction.editReply({ content: 'Commande seulement disponible en serveur.' });

  let category = guild.channels.cache.find(c => c.type === 4 && c.name === TICKET_CATEGORY_NAME);
  if (!category) {
    category = await guild.channels.create({ name: TICKET_CATEGORY_NAME, type: 4 });
  }

  const user = interaction.user;
  const channelName = `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${user.discriminator}`;
  const existing = guild.channels.cache.find(c => c.name === channelName && c.parentId === category.id);
  if (existing) {
    await interaction.editReply({ content: `Vous avez déjà un ticket: ${existing}` });
    return;
  }

  const everyone = guild.roles.everyone;
  const overwrites = [
    { id: everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
  ];

  const channel = await guild.channels.create({
    name: channelName,
    type: 0,
    parent: category.id,
  permissionOverwrites: overwrites,
  topic: `ticket:${user.id}`
  });

  const closeButton = new ButtonBuilder().setCustomId('ticket_close_button').setLabel('Fermer le ticket').setStyle(ButtonStyle.Danger);
  const row = new ActionRowBuilder().addComponents(closeButton);

  await channel.send({ content: `Bonjour ${user}, merci de décrire votre problème.`, components: [row] });

  await interaction.editReply({ content: `Ticket créé: ${channel}` });
}

async function handlePanelCommand(interaction) {
  const adminEnv = process.env.ADMIN_USER_ID || '';
  const adminIds = adminEnv.split(',').map(s => s.trim()).filter(Boolean);
  const isAdminUser = adminIds.includes(interaction.user.id);
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild) && !isAdminUser) {
    await interaction.reply({ content: 'Vous n\'êtes pas autorisé à utiliser cette commande.', ephemeral: true });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_service_select')
    .setPlaceholder('Choisissez le service requis...')
    ;

  // Load select options from editable JSON file (panel-options.json) if present
  let options = [];
  try {
    const optsPath = path.join(__dirname, '..', 'panel-options.json');
    if (fs.existsSync(optsPath)) {
      options = JSON.parse(fs.readFileSync(optsPath, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load panel-options.json, falling back to defaults', e);
  }
  if (!options || !options.length) {
    options = [
      { label: 'Plainte', value: 'plainte', description: 'témoins ou victimes' },
      { label: 'Demande de Rank', value: 'demande_rank', description: 'Monter dans la Hiérarchie' },
      { label: 'Partenariat', value: 'partenariat', description: 'Propositions et partenariats' },
      { label: 'Autre', value: 'autre', description: 'Autre demande' }
    ];
  }
  select.addOptions(options);

  const row = new ActionRowBuilder().addComponents(select);

  const embed = new EmbedBuilder()
    .setTitle('Créer un ticket')
    .setDescription('Sélectionnez le service correspondant pour ouvrir un ticket.')
    .setColor(0x00AE86);

  await interaction.reply({ content: 'Panneau de création de ticket envoyé.', ephemeral: true });

  const channel = interaction.channel;
  const panelsFile = path.join(__dirname, '..', 'panels.json');
  let panels = {};
  try { panels = JSON.parse(fs.readFileSync(panelsFile, 'utf8') || '{}'); } catch (e) { panels = {}; }

  const existingId = panels[channel.id];
  if (existingId) {
    try {
      const msg = await channel.messages.fetch(existingId);
      await msg.edit({ embeds: [embed], components: [row] });
      await interaction.followUp({ content: 'Le panneau a été mis à jour.', ephemeral: true });
      return;
    } catch (e) {
    }
  }

  const sent = await channel.send({ embeds: [embed], components: [row] });
  panels[channel.id] = sent.id;
  try { fs.writeFileSync(panelsFile, JSON.stringify(panels, null, 2)); } catch (e) { console.error('Failed to save panels file', e); }
  await interaction.followUp({ content: `Panneau publié: ${sent.url}`, ephemeral: true });
}

client.on('interactionCreate', async interaction => {
  try {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'panelset') {
      const adminEnv = process.env.ADMIN_USER_ID || '';
      const adminIds = adminEnv.split(',').map(s => s.trim()).filter(Boolean);
      if (!adminIds.includes(interaction.user.id)) {
        await interaction.reply({ content: 'Vous n\'êtes pas autorisé.', ephemeral: true });
        return;
      }

      await handlePanelCommand(interaction);
    }
  } catch (err) {
    console.error('panelset handler error', err);
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!panel')) return;
  const adminEnv = process.env.ADMIN_USER_ID || '';
  const adminIds = adminEnv.split(',').map(s => s.trim()).filter(Boolean);
  if (!adminIds.includes(message.author.id)) return message.reply('Vous n\'êtes pas autorisé.');

  const fakeInteraction = {
    channel: message.channel,
    user: message.author,
    member: message.member,
    reply: async (opts) => { return message.reply(typeof opts === 'string' ? opts : opts.content || ''); },
    deferReply: async () => {},
    followUp: async (opts) => { if (opts && opts.content) return message.reply(opts.content); }
  };
  await handlePanelCommand(fakeInteraction);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== 'ticket_service_select') return;

  await interaction.deferReply({ ephemeral: true });
  const choice = interaction.values[0];
  const user = interaction.user;
  const guild = interaction.guild;

  let category = guild.channels.cache.find(c => c.type === 4 && c.name === TICKET_CATEGORY_NAME);
  if (!category) {
    category = await guild.channels.create({ name: TICKET_CATEGORY_NAME, type: 4 });
  }

  const channelName = `ticket-${choice}-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}-${user.discriminator}`;
  const existing = guild.channels.cache.find(c => c.name === channelName && c.parentId === category.id);
  if (existing) {
    await interaction.editReply({ content: `Vous avez déjà un ticket: ${existing}` });
    return;
  }

  const everyone = guild.roles.everyone;
  const overwrites = [
    { id: everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
  ];

  if (process.env.TICKET_STAFF_ROLE_ID) {
    overwrites.push({ id: process.env.TICKET_STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: 0,
    parent: category.id,
  permissionOverwrites: overwrites,
  topic: `ticket:${user.id}`
  });

  const closeButton = new ButtonBuilder().setCustomId('ticket_close_button').setLabel('Fermer le ticket').setStyle(ButtonStyle.Danger);
  const row = new ActionRowBuilder().addComponents(closeButton);

  await channel.send({ content: `Ticket pour **${choice}** créé par ${user}. Merci de détailler votre demande.`, components: [row] });
  await interaction.editReply({ content: `Ticket créé: ${channel}` });
});

async function handleCloseButton(interaction) {
  const confirm = new ButtonBuilder().setCustomId('ticket_confirm_close').setLabel('Confirmer la fermeture').setStyle(ButtonStyle.Danger);
  const cancel = new ButtonBuilder().setCustomId('ticket_cancel_close').setLabel('Annuler').setStyle(ButtonStyle.Secondary);
  const row = new ActionRowBuilder().addComponents(confirm, cancel);
  await interaction.reply({ content: 'Voulez-vous vraiment fermer ce ticket ?', components: [row], ephemeral: true });
}

async function confirmClose(interaction) {
  const ch = interaction.channel;
  if (!ch || !ch.name || !ch.name.startsWith('ticket-')) {
    await interaction.reply({ content: "Cette commande n'est disponible que dans un channel ticket.", ephemeral: true });
    return;
  }
  await interaction.reply({ content: 'Fermeture en cours...' , ephemeral: true });

  try {
    const fetched = await ch.messages.fetch({ limit: 100 });
    const msgs = Array.from(fetched.values()).reverse();
    const transcriptObj = msgs.map(m => ({
      id: m.id,
      authorId: m.author.id,
      authorTag: m.author.tag,
      timestamp: m.createdTimestamp,
      content: m.content || '',
      attachments: m.attachments ? Array.from(m.attachments.values()).map(a => ({ name: a.name, url: a.url })) : []
    }));

  const transcriptJson = JSON.stringify({ channel: ch.id, channelName: ch.name, messages: transcriptObj }, null, 2);
  const filename = `${ch.name}-transcript.json`;
  const tmpPath = path.join(__dirname, '..', filename);
  try { fs.writeFileSync(tmpPath, transcriptJson, 'utf8'); } catch (e) { console.error('Failed to write temp transcript file', e); }

    let creatorId = null;
    if (ch.topic && ch.topic.startsWith('ticket:')) {
      creatorId = ch.topic.split(':')[1];
    }

    if (creatorId) {
      try {
        const user = await client.users.fetch(creatorId).catch(() => null);
        if (user) {
          try {
            const attach = new AttachmentBuilder(tmpPath);
            await user.send({ content: `Voici la transcription de votre ticket **${ch.name}**.`, files: [attach] });
          } catch (err) {
            console.error('Failed to DM transcript to creator', err);
          }
        }
      } catch (e) {
        console.error('Failed to DM transcript to creator', e);
      }
    } else {
      console.log('No creatorId found in channel topic; skipping DM');
    }

    let logs = ch.guild.channels.cache.find(c => c.name === 'ticket-logs' && c.type === 0);
    if (!logs) {
      try {
        logs = await ch.guild.channels.create({ name: 'ticket-logs', type: 0 });
      } catch (e) {
        console.error('Failed to create ticket-logs channel', e);
      }
    }

    if (logs) {
        try {
          const attach = new AttachmentBuilder(tmpPath);
          const embed = new EmbedBuilder().setTitle('Ticket fermé').setDescription(`Ticket ${ch.name} fermé`).setTimestamp();
          await logs.send({ embeds: [embed], files: [attach] });
        } catch (e) {
          console.error('Failed to post transcript to logs channel', e);
          try {
            const snippet = transcriptJson.slice(0, 1900);
            const fallbackContent = 'Transcript (truncated):\n\n```json\n' + snippet + '\n```';
            await logs.send({ content: fallbackContent });
          } catch (err2) {
            console.error('Fallback post to logs failed', err2);
          }
        }
    }

  } catch (err) {
    console.error('Error creating transcript:', err);
  }

  try { fs.unlinkSync(tmpPath); } catch (e) { /* ignore */ }
  setTimeout(() => {
    ch.delete().catch(console.error);
  }, 2000);
}

async function handleCloseCommand(interaction) {
  // same as button
  await handleCloseButton(interaction);
}

process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason && reason.stack ? reason.stack : reason);
});

console.log('Attempting client.login');
client.login(process.env.DISCORD_TOKEN).then(() => {
  console.log('client.login resolved');
}).catch(err => {
  console.error('client.login rejected:', err && err.stack ? err.stack : err);
});
