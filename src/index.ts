import { Auth } from './auth/index.js';
import { Marketplace } from './marketplace/index.js';
import { RollerWebSocket } from './websocket/index.js';
import { Miners } from './miners/index.js';
import type { ClientOptions, TokenData } from './types/index.js';

export class RollerCoin {
  readonly auth: Auth;
  readonly marketplace: Marketplace;
  readonly miners: Miners;
  private ws: RollerWebSocket | null = null;

  constructor(options: ClientOptions) {
    this.auth = new Auth(options.accessToken, options.refreshToken);
    this.marketplace = new Marketplace(this.auth);
    this.miners = new Miners();
  }

  async initialize(): Promise<void> {
    await this.auth.refreshTokens();
    await this.auth.fetchCsrf();
  }

  async refreshTokens(): Promise<TokenData> {
    return this.auth.refreshTokens();
  }

  async fetchCsrf(): Promise<void> {
    await this.auth.fetchCsrf();
  }

  getWebSocket(): RollerWebSocket {
    if (!this.ws) {
      this.ws = new RollerWebSocket(this.auth);
    }
    return this.ws;
  }
}

export { Auth, Marketplace, RollerWebSocket, Miners };
export * from './types/index.js';
export { BASE_URL, WS_URL, MARKETPLACE, AUTH } from './constants.js';