import {
  InteractionType, SlashCommandBuilder, SlashCommandSubcommandBuilder,
  AutocompleteInteraction, ChatInputCommandInteraction,
} from "discord.js";

import ContextManager from "../../../core/modules/ContextManager";
import InteractionHandler, { type InteractionHandlerOptions } from "./InteractionHandler";


export type AutocompleteFieldParent = SlashCommandBuilder | SlashCommandSubcommandBuilder;

export default abstract class AutocompleteField
  extends InteractionHandler<InteractionType.ApplicationCommandAutocomplete> {

  constructor(
    commandName: string,
    fieldName: string,
    options?: InteractionHandlerOptions
  ) {
    super(InteractionType.ApplicationCommandAutocomplete, options);

    this.commandName = commandName;
    this.fieldName = fieldName;
  }

  abstract addTo<T extends AutocompleteFieldParent>(
    builder: T,
    description: string,
    isRequired: boolean
  ): void;

  abstract getValue(
    interaction: AutocompleteInteraction | ChatInputCommandInteraction,
    context: ContextManager,
    options: unknown
  ): unknown;

  // abstract handleInteraction from InteractionHandler

  readonly commandName: string;
  readonly fieldName: string;
}
