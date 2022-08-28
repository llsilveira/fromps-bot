import { InteractionType } from "discord.js";
import ComponentInteractionHandler from "./ComponentInteractionHandler";
import { InteractionHandlerOptions } from "./InteractionHandler";


export default abstract class MessageComponent
  extends ComponentInteractionHandler<InteractionType.MessageComponent> {

  constructor(componentName: string, options?: InteractionHandlerOptions) {
    super(InteractionType.MessageComponent, componentName, options);
  }
}
