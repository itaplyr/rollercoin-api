export const BASE_URL = 'https://rollercoin.com';
export const WS_URL = 'wss://nws.rollercoin.com';
export const PUBLIC_MINERS_URL = 'https://api.minaryganar.com/api/public/miners';

export const MARKETPLACE = {
  itemInfo: (itemId: string, itemType: string) =>
    `${BASE_URL}/api/marketplace/item-info?itemId=${itemId}&itemType=${itemType}&currency=RLT`,
  sellItem: `${BASE_URL}/api/marketplace/sell-item`,
  purchaseItem: `${BASE_URL}/api/marketplace/purchase-item`,
} as const;

export const AUTH = {
  refresh: `${BASE_URL}/api/auth/refresh`,
  csrf: `${BASE_URL}/api/common/get-pixel`,
} as const;

export interface RefreshResponse {
  success: boolean;
  data?: {
    access_token: string;
    refresh_token: string;
  };
  error?: string;
}

export interface CsrfResponse {
  success: boolean;
  token: string;
}