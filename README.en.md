Super 👍 Voici la version **anglaise complète** de ton `README.en.md` avec le badge multilingue en haut :

---

````markdown
# 🎫 Ticket Bot (EN)

[![Français](https://img.shields.io/badge/lang-Français-blue?style=for-the-badge&logo=discord)](./README.md)

A simple and efficient Discord bot for handling support tickets.  
It uses slash commands, buttons, and select menus.

---

## 🚀 Features

- Create and close tickets via an interactive panel (embed + select menu).  
- Private channels are automatically created for each ticket.  
- **Automatic transcripts**: generated as JSON, sent via DM to the ticket author, and also posted in a `ticket-logs` channel (automatically created if missing).  
- Panel options are editable via `panel-options.json` (easy for admins to configure).  
- Owner/Admin-only commands to publish or update the ticket panel.  

---

## 📦 Installation

1. Place the project on your machine and open a terminal in the project root directory. Example:  

```bash
cd /path/to/ticket-bot
````

Examples for common shells:

* PowerShell:

```powershell
cd "C:\path\to\ticket-bot"
```

* Command Prompt (cmd.exe):

```cmd
cd C:\path\to\ticket-bot
```

2. Install dependencies:

```powershell
npm install
```

3. Copy and edit the environment file (`.env`):

* Bash / macOS / Linux:

```bash
cp .env.example .env
```

* PowerShell:

```powershell
copy .env.example .env
```

* Command Prompt (cmd.exe):

```cmd
copy .env.example .env
```

Fill in the following variables in `.env`:

* `DISCORD_TOKEN` : Your bot token
* `CLIENT_ID` : Discord application ID
* `GUILD_ID` : Server ID (used to deploy slash commands)
* `TICKET_STAFF_ROLE_ID` *(optional)* : Staff role with access to all tickets
* `ADMIN_USER_ID` *(optional)* : One or more user IDs (comma separated) allowed to publish/edit the panel

4. Deploy slash commands (to the configured guild):

```powershell
npm run deploy-commands
```

5. Start the bot:

```powershell
npm start
```

---

## ⚙️ Usage

* **Publish the panel** (admins only, or IDs defined in `.env`):

```
/ticket panel
```

The bot will post an embed with a select menu. Options are defined in `panel-options.json`.

* **Open a ticket**:
  The user selects an option in the panel. The bot creates a private channel, accessible to staff if `TICKET_STAFF_ROLE_ID` is set.

* **Close a ticket**:
  When closing, the bot will:

1. Collect the channel messages
2. Generate a JSON transcript
3. Send the file via DM to the ticket author
4. Post the file in the `ticket-logs` channel
5. Delete the ticket channel

---

## 📂 Important Files

* `src/index.js` → Main bot code (tickets, panel, transcripts)
* `src/deploy-commands.js` → Script to deploy slash commands
* `panel-options.json` → Configurable menu options (server admins can edit)
* `panels.json` → Runtime mapping (channelId → messageId) to update panels
* `.env` / `.env.example` → Environment variables

---

## 🛡️ Permissions & Security

The bot requires the following permissions:

* Manage Channels (create/delete ticket channels)
* Send Messages and Attach Files
* Manage Channel Permissions

⚠️ **Do not share your `DISCORD_TOKEN` publicly.**

---

## 🧪 Quick Test

1. Deploy commands (`npm run deploy-commands`).
2. In Discord, run `/ticket panel` in a channel.
3. Create a ticket and exchange some messages.
4. Close the ticket and check if the transcript is:

   * Sent via DM to the ticket author
   * Posted in the `ticket-logs` channel

---

## 👨‍💻 Developer

* Developed by **sexualwhisper**
* [Discord Profile](https://discord.com/users/690749637921079366)

```

---

```
