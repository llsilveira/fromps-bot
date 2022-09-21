import path = require("path");

import ConfigLoader from "./core/modules/ConfigLoader";
import LoggerFactory from "./core/modules/LoggerFactory";
import ContextManager from "./core/modules/ContextManager";
import Models from "./core/modules/Models";
import Services from "./core/modules/Services";
import Database from "./core/modules/Database";
import Discord from "../modules/Discord";

export default class Application {
  readonly name: string;
  readonly instancePath: string;
  readonly applicationRoot;
  readonly config: ConfigLoader;
  readonly logger: LoggerFactory;
  readonly context: ContextManager;
  readonly db: Database;
  readonly models: Models;
  readonly services: Services;

  readonly discord: Discord;

  constructor(name: string, instancePath: string) {
    this.name = name;
    this.instancePath = instancePath;
    this.applicationRoot = path.dirname(module.path);

    this.config = new ConfigLoader(this);
    this.logger = new LoggerFactory(this);

    this.context = new ContextManager(this);

    this.db = new Database(this);

    this.models = new Models(this);
    this.services = new Services(this);

    this.discord = new Discord(this);
  }
}
