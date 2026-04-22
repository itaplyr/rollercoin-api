import WebSocket from 'ws';
import pako from 'pako';
import { WS_URL } from '../constants.js';
import { Auth } from '../auth/index.js';
import type { MarketplaceOrder } from '../types/index.js';

type OrderCallback = (order: MarketplaceOrder) => void;
type StatusCallback = (status: { connected: boolean }) => void;

export class RollerWebSocket {
  private ws: WebSocket | null = null;
  private auth: Auth;
  private onOrderCallback: OrderCallback | null = null;
  private onStatusCallback: StatusCallback | null = null;
  private isRunning = true;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(auth: Auth) {
    this.auth = auth;
  }

  setOnOrder(callback: OrderCallback): void {
    this.onOrderCallback = callback;
  }

  setOnStatus(callback: StatusCallback): void {
    this.onStatusCallback = callback;
  }

  private decodeOffers(encoded: string): [number, number][] {
    const toBytes = (t: string) => Uint8Array.from(Buffer.from(t, 'base64'));

    const decompress = (data: Uint8Array) => {
      const c = new DataView(data.buffer);
      let a = 0;
      const s = c.getUint16(a);
      a += 2;
      const n = Number(c.getBigUint64(a));
      a += 8;
      const l: [number, number][] = [];
      for (let r = 0; r < s; r++) {
        const o = c.getUint32(a);
        a += 4;
        const i = c.getUint32(a);
        a += 4;
        l.push([o, i]);
      }
      return [l, n] as [typeof l, typeof n];
    };

    const apply = (trades: [number, number][], total: number) => {
      let a = total;
      const s: [number, number][] = [];
      for (const [n, l] of trades) {
        a += n;
        if (l !== 0) s.push([a, l]);
      }
      return s;
    };

    try {
      const input = toBytes(encoded);
      const inflated = pako.inflate(input);
      const [trades, total] = decompress(inflated);
      return apply(trades, total);
    } catch {
      return [];
    }
  }

  connect(): void {
    if (!this.isRunning) return;

    this.ws = new WebSocket(`${WS_URL}/?token=${this.auth.getAccessToken()}`);

    this.ws.on('open', () => {
      this.onStatusCallback?.({ connected: true });
    });

    this.ws.on('message', (data: Buffer | Buffer[]) => {
      if (!this.isRunning) return;

      try {
        const msg = JSON.parse(data.toString());
        if (msg.cmd !== 'marketplace_orders_update') return;

        const { item_id, currency, data: payload } = msg.value;
        if (currency !== 'RLT') return;

        const decoded = this.decodeOffers(payload.tradeOffers);
        if (!decoded.length) return;

        const [price, quantity] = decoded[0];

        const order: MarketplaceOrder = {
          item_id,
          currency,
          price,
          quantity,
          tradeOffers: payload.tradeOffers,
        };

        this.onOrderCallback?.(order);
      } catch (err) {
        console.error('WS message error:', err);
      }
    });

    this.ws.on('close', () => {
      this.onStatusCallback?.({ connected: false });

      if (this.isRunning) {
        this.reconnectTimeout = setTimeout(() => {
          this.connect();
        }, 2000);
      }
    });

    this.ws.on('error', (err: Error) => {
      console.error('WS error:', err);
    });
  }

  disconnect(): void {
    this.isRunning = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onStatusCallback?.({ connected: false });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}