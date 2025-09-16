// Ensure ReadableStream exists on Node <18 for undici
if (typeof globalThis.ReadableStream === 'undefined') {
  try {
    const pony = require('web-streams-polyfill/ponyfill');
    if (pony && pony.ReadableStream) globalThis.ReadableStream = pony.ReadableStream;
  } catch (e) {
    // continue - deployment will error if not available
  }
}
require('dotenv').config();
console.log('deploy-commands starting, NODE', process.version);
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder().setName('ticket').setDescription('Gestion des tickets')
    .addSubcommand(sub => sub.setName('create').setDescription('Créer un ticket'))
    .addSubcommand(sub => sub.setName('close').setDescription('Fermer le ticket'))
    .addSubcommand(sub => sub.setName('panel').setDescription('Publier un panneau de sélection pour créer des tickets')),
  // Owner-only command to create or update the embed panel (visible immediately in the guild)
  new SlashCommandBuilder().setName('panelset').setDescription('Owner: publier/mettre à jour le panneau de tickets dans ce channel')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function deploy() {
  try {
    console.log('Deploying commands...');
    const guildId = process.env.GUILD_ID;
    if (!guildId) {
      console.error('Set GUILD_ID in .env to register guild commands for testing.');
      process.exit(1);
    }
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), { body: commands });
    console.log('Commands deployed.');
  } catch (err) {
    console.error(err);
  }
}

deploy();
