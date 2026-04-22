import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Auth } from './auth/index.js';
import { Marketplace } from './marketplace/index.js';
import { Miners } from './miners/index.js';
import { RollerCoin } from './index.js';

describe('Auth', () => {
  let auth: Auth;

  beforeEach(() => {
    auth = new Auth('test-access-token', 'test-refresh-token');
  });

  it('should store tokens on construction', () => {
    expect(auth.getAccessToken()).toBe('test-access-token');
    expect(auth.getRefreshToken()).toBe('test-refresh-token');
  });

  it('should check valid tokens', () => {
    expect(auth.hasValidTokens()).toBe(true);
    expect(auth.hasValidCsrf()).toBe(false);
  });

  it('should update access token', () => {
    auth.setAccessToken('new-access-token');
    expect(auth.getAccessToken()).toBe('new-access-token');
  });

  it('should update both tokens', () => {
    auth.setTokens('new-access', 'new-refresh');
    expect(auth.getAccessToken()).toBe('new-access');
    expect(auth.getRefreshToken()).toBe('new-refresh');
  });

  it('should generate headers', () => {
    const headers = auth.getHeaders('GET');
    expect(headers['Authorization']).toBe('Bearer test-access-token');
    expect(headers['X-KL-Ajax-Request']).toBe('Ajax_Request');
    expect(headers['Content-Type']).toBe('application/json');
  });
});

describe('Marketplace', () => {
  let marketplace: Marketplace;
  let mockAuth: Auth;

  beforeEach(() => {
    mockAuth = {
      authenticatedFetch: vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { name: { en: 'Test Miner' }, level: 1 } }),
        text: () => Promise.resolve('{}'),
      }),
    } as unknown as Auth;
    marketplace = new Marketplace(mockAuth);
  });

  it('should get item info', async () => {
    const info = await marketplace.getItemInfo('test-id', 'miner');
    expect(info.name).toBe('Test Miner');
    expect(info.level).toBe(1);
    expect(info.type).toBe('miner');
  });

  it('should get item image for miners', async () => {
    const info = await marketplace.getItemInfo('test-id', 'miner');
    expect(info).toHaveProperty('image');
  });
});

describe('Miners', () => {
  let miners: Miners;

  beforeEach(() => {
    miners = new Miners();
  });

  it('should return empty array initially', () => {
    expect(miners.getAll()).toEqual([]);
  });

  it('should return undefined for unknown id', () => {
    expect(miners.getById('unknown')).toBeUndefined();
  });

  it('should count as zero initially', () => {
    expect(miners.count()).toBe(0);
  });

  it('should return copy of miners map', () => {
    const map = miners.getAllAsMap();
    expect(map).toBeInstanceOf(Map);
    expect(map.size).toBe(0);
  });
});

describe('RollerCoin Client', () => {
  it('should create client with tokens', () => {
    const client = new RollerCoin({
      accessToken: 'test',
      refreshToken: 'test-refresh',
    });
    expect(client.auth.getAccessToken()).toBe('test');
  });

  it('should have marketplace and miners properties', () => {
    const client = new RollerCoin({
      accessToken: 'test',
      refreshToken: 'test-refresh',
    });
    expect(client.marketplace).toBeInstanceOf(Marketplace);
    expect(client.miners).toBeInstanceOf(Miners);
  });

  it('should return same websocket instance', () => {
    const client = new RollerCoin({
      accessToken: 'test',
      refreshToken: 'test-refresh',
    });
    const ws1 = client.getWebSocket();
    const ws2 = client.getWebSocket();
    expect(ws1).toBe(ws2);
  });
});