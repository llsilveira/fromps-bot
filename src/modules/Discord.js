"use strict";


const { Client, Collection, GatewayIntentBits, Routes, InteractionType } = require("discord.js");
const { REST } = require("@discordjs/rest");

const { AppModule } = require("../app");
const { AccountProvider } = require("../core/constants");
const { FrompsBotError } = require("../errors");

const slashCommands = require("./discord/slash_commands");
const permanentButtons = require("./discord/permanent_buttons");
const PermanentButtonContainer = require("./discord/PermanentButtonContainer");

const DISCORD_REST_API_VERSION = "10";


class Discord extends AppModule {
  constructor(app) {
    super(app);

    const { token, clientId, guildId } = app.config.get("discord");
    this.#token = token;
    this.#clientId = clientId;
    this.#guildId = guildId;

    this.#client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
    });

    this.#commands = new Collection();
    this.#permanentButtons = new PermanentButtonContainer();

    this.#client.on("interactionCreate", async interaction => {
      try {
        const handler = await this.#resolveInteraction(interaction);
        if (handler) {
          await this.app.context.run(async () => {
            await this.#handleInteraction(interaction, handler);
          });
        }
      } catch (e) {
        this.logger.error("An error ocurred during interaction handling:", e);
      }
    });

    this.#client.once("ready", async () => {
      this.logger.info("Discord bot is ready!");
    });

    this.#registerSlashCommands();
    this.#registerPermanentButtons();
  }

  async getDiscordId(user) {
    const provider =
      await this.app.services.user.getProvider(user, AccountProvider.DISCORD);
    return provider?.providerId;
  }

  async getGuild(guildId) {
    const guild = this.#client.guilds.resolve(guildId);
    if (!guild.available) {
      await guild.fetch();
    }
    return guild;
  }

  async getMainGuild() {
    return await this.getGuild(this.#guildId);
  }

  async getMemberFromId(userDiscordId) {
    const guild = await this.getMainGuild();
    try {
      const member = await guild.members.fetch(userDiscordId);
      return member;
    } catch (e) {
      // User is not a member
      return null;
    }
  }

  async getMemberFromUser(user) {
    const id = await this.getDiscordId(user);
    return await this.getMemberFromId(id);
  }

  start() {
    return this.#client.login(this.#token);
  }

  getPermanentButton(name, args = []) {
    return this.#permanentButtons.createButton(name, args);
  }

  async updateCommands() {
    const commands = [];
    for (const command of this.#commands) {
      commands.push(command[1].definition);
    }

    const rest = new REST(
      { version: DISCORD_REST_API_VERSION }
    ).setToken(this.#token);

    return await rest.put(
      Routes.applicationGuildCommands(this.#clientId, this.#guildId),
      { body: commands }
    );
  }


  async #resolveInteraction(interaction) {
    // TODO: Set discord client error handling to log unhandled errors instead of crashing.
    let interactionHandler;

    switch (interaction.type) {
    case InteractionType.ApplicationCommand:
    case InteractionType.ApplicationCommandAutocomplete: {
      interactionHandler = this.#commands.get(interaction.commandName);
      break;
    }
    case InteractionType.MessageComponent:
      interactionHandler = this.#permanentButtons.resolve(interaction);
      break;
    }

    return interactionHandler;
  }

  async #handleInteraction(interaction, handler) {
    try {
      if (handler.loginRequired) {
        const userId = interaction.user.id;
        let user = await this.app.services.user.getFromProvider(
          AccountProvider.DISCORD, userId
        );

        if (!user) {
          let name;
          if (interaction.guild?.id === this.#guildId) {
            name = interaction.member.displayName;
          } else {
            const member = await this.getMemberFromId(userId);

            if (member) {
              name = member.displayName;
            } else {
              name = interaction.user.username;
            }
          }

          user = await this.app.services.user.register(
            AccountProvider.DISCORD, userId, name
          );
        }

        this.app.services.auth.login(user);
      }

      switch (interaction.type) {
      case InteractionType.ApplicationCommand: {
        await handler.execute(interaction);
        break;
      }
      case InteractionType.ApplicationCommandAutocomplete: {
        await handler.autocomplete(interaction);
        break;
      }
      case InteractionType.MessageComponent: {
        await handler.button.execute(interaction, ...handler.args);
        break;
      }
      }

    } catch (e) {
      let rethrow, content, sendMessage;

      if (e instanceof FrompsBotError) {
        content = e.message;
        rethrow = false;
      } else {
        content = "Ocorreu um erro na execução deste comando. " +
          "Por favor, espere alguns minutos e tente novamente. " +
          "Se o erro persistir, informe um moderador.";
        rethrow = true;
      }

      if (interaction.replied || interaction.deferred) {
        sendMessage = interaction.editReply;
      } else {
        sendMessage = interaction.reply;
      }

      await sendMessage.call(interaction, {
        content,
        ephemeral: true,
        embeds: [],
        components: [],
        files: [],
        attachments: []
      });

      if (rethrow) { throw e; }
    }
  }

  #registerSlashCommands() {
    for (const command in slashCommands) {
      const instance = new slashCommands[command](this);
      this.#commands.set(instance.name, instance);
    }
  }

  #registerPermanentButtons() {
    for (const button in permanentButtons) {
      const instance = new permanentButtons[button](this);
      this.#permanentButtons.register(instance.name, instance);
    }
  }

  #client;
  #commands;
  #permanentButtons;
  #token;
  #clientId;
  #guildId;
}

AppModule.setModuleName(Discord, "discord");
module.exports = Discord;
