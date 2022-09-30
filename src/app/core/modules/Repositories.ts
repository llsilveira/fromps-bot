import AppModule from "../../AppModule";

import type Application from "../../Application";
import UserAccountRepository from "../repositories/UserAccountRepository";
import UserRepository from "../repositories/UserRepository";

export default class Repositories extends AppModule {
  readonly userAccount: UserAccountRepository;
  readonly user: UserRepository;

  constructor(app: Application) {
    super(app);

    this.userAccount = new UserAccountRepository(app.models.userAccount);
    this.user = new UserRepository(app.models.user);
  }
}
