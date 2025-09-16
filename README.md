[![English](https://img.shields.io/badge/lang-English-blue?style=for-the-badge&logo=discord)](./README.en.md)

# 🎫 Ticket Bot (FR)

Un bot simple et efficace pour gérer les tickets sur Discord.  
Il fonctionne avec des commandes slash, boutons et menus de sélection.

---

## 🚀 Fonctionnalités

- Création et fermeture de tickets via un panneau interactif (embed + select menu).  
- Channels privés créés automatiquement pour chaque ticket.  
- **Transcripts automatiques** : le transcript est généré au format JSON, envoyé en fichier en DM à l'auteur du ticket et publié dans un salon `ticket-logs` créé automatiquement par le bot.  
- Options du panneau éditables via le fichier `panel-options.json` (facile à modifier pour les administrateurs).  
- Commandes propriétaires / administrateur pour publier/mettre à jour le panneau.  

---

## 📦 Installation

1. Placez le projet sur votre machine et ouvrez un terminal à la racine du projet. Exemple générique :  

```bash
cd /path/to/ticket-bot
````

Exemples spécifiques aux shells courants :

* **PowerShell** :

```powershell
cd "C:\chemin\vers\ticket-bot"
```

* **Invite de commandes (cmd.exe)** :

```cmd
cd C:\chemin\vers\ticket-bot
```

2. Installez les dépendances :

```powershell
npm install
```

3. Copiez et éditez le fichier d'environnement (`.env`) :

* **Bash / macOS / Linux** :

```bash
cp .env.example .env
```

* **PowerShell** :

```powershell
copy .env.example .env
```

* **Invite de commandes (cmd.exe)** :

```cmd
copy .env.example .env
```

Remplissez les variables suivantes dans `.env` :

* `DISCORD_TOKEN` : Token du bot
* `CLIENT_ID` : ID de l'application Discord
* `GUILD_ID` : ID du serveur (utilisé pour déployer les commandes)
* `TICKET_STAFF_ROLE_ID` (optionnel) : rôle qui verra tous les tickets
* `ADMIN_USER_ID` (optionnel) : ID(s) utilisateur séparés par des virgules qui peuvent publier/éditer le panneau

4. Déployer les commandes slash (sur le guild configuré) :

```powershell
npm run deploy-commands
```

5. Lancer le bot :

```powershell
npm start
```

---

## ⚙️ Utilisation

* **Publier le panneau** (uniquement par les admins définis) :

```text
/ticket panel
```

Le bot publiera un embed contenant un menu de sélection. Les options de ce menu sont définies dans `panel-options.json`.

* **Créer un ticket** :
  L'utilisateur choisit une option dans le menu. Le bot crée un channel privé, accessible au staff si `TICKET_STAFF_ROLE_ID` est configuré.

* **Fermer un ticket** :
  Lors de la fermeture, le bot :

1. Récupère les messages du channel
2. Génère un transcript JSON complet
3. Envoie le fichier en DM à l'auteur du ticket
4. Envoie le fichier dans le salon `ticket-logs` (créé automatiquement)
5. Supprime le channel ticket

---

## 📂 Fichiers importants

* `src/index.js` → Code principal du bot (tickets, panneau, transcripts)
* `src/deploy-commands.js` → Script de déploiement des commandes slash
* `panel-options.json` → Options du menu (modifiable par les admins du serveur)
* `panels.json` → Mapping runtime (channelId → messageId) pour mettre à jour le panneau
* `.env` / `.env.example` → Variables d'environnement

---

## 🛡️ Permissions & sécurité

Le bot a besoin des permissions suivantes :

* Gérer les salons (Créer/Supprimer des channels)
* Envoyer des messages et joindre des fichiers
* Gérer les permissions de salon

⚠️ **Ne partagez jamais votre `DISCORD_TOKEN` publiquement.**

---

## 🧪 Tests rapides

1. Déployer les commandes (`npm run deploy-commands`).
2. Dans Discord, exécuter `/ticket panel` dans un salon.
3. Créer un ticket et échanger quelques messages.
4. Fermer le ticket et vérifier la réception du transcript :

   * En DM de l’auteur
   * Dans `ticket-logs`

---

## 👨‍💻 Développeur

* Développé par **sexualwhisper**
* [Profil Discord](https://discord.com/users/690749637921079366)

```

---

```

