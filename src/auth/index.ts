import { AUTH } from '../constants.js';
import type { TokenData, CsrfData } from '../types/index.js';

export class Auth {
  private accessToken: string;
  private refreshToken: string;
  private csrfToken: string | null = null;
  private csrfCookie: string | null = null;

  constructor(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  getRefreshToken(): string {
    return this.refreshToken;
  }

  getCsrfToken(): string | null {
    return this.csrfToken;
  }

  getCsrfCookie(): string | null {
    return this.csrfCookie;
  }

  hasValidTokens(): boolean {
    return this.accessToken !== null && this.refreshToken !== null;
  }

  hasValidCsrf(): boolean {
    return this.csrfToken !== null && this.csrfCookie !== null;
  }

  async refreshTokens(): Promise<TokenData> {
    const res = await fetch(AUTH.refresh, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    });

    const data = await res.json() as { success: boolean; data?: { access_token: string; refresh_token: string }; error?: string };
    
    if (!data.success || !data.data) {
      throw new Error(`Token refresh failed: ${data.error}`);
    }

    this.accessToken = data.data.access_token;
    this.refreshToken = data.data.refresh_token;

    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    };
  }

  async fetchCsrf(): Promise<CsrfData> {
    const res = await fetch(AUTH.csrf);
    const rawCookies = res.headers.get('set-cookie');

    if (!rawCookies) {
      throw new Error('No CSRF cookie returned');
    }

    const match = rawCookies.match(/x-csrf=([^;]+)/);
    if (!match) {
      throw new Error('CSRF cookie not found in headers');
    }

    const csrfData = JSON.parse(decodeURIComponent(match[1])) as { token: string };
    this.csrfToken = csrfData.token;
    this.csrfCookie = `x-csrf=${match[1]}`;

    return {
      token: this.csrfToken,
      cookie: this.csrfCookie,
    };
  }

  getHeaders(method: string, extraHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      'X-KL-Ajax-Request': 'Ajax_Request',
      'Content-Type': 'application/json',
      ...extraHeaders,
    };

    if (this.csrfToken) {
      headers['CSRF-Token'] = this.csrfToken;
    }

    if (this.csrfCookie) {
      headers['Cookie'] = this.csrfCookie;
    }

    return headers;
  }

  async authenticatedFetch(
    url: string,
    options: RequestInit,
    retryOnAuthFailure = true
  ): Promise<Response> {
    const headers = this.getHeaders(options.method || 'GET');

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401 && retryOnAuthFailure) {
      await this.refreshTokens();
      await this.fetchCsrf();
      return this.authenticatedFetch(url, options, false);
    }

    return res;
  }
}