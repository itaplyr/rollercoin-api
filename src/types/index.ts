export type ItemType = 'miner' | 'mutation_component' | 'rack' | 'battery';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
}

export interface CsrfData {
  token: string;
  cookie: string;
}

export interface ItemInfo {
  id: string;
  type: ItemType;
  name: string;
  level: number;
  image: string;
  rarity?: string;
  rarityColor?: string;
  power?: number;
  powerPercent?: number;
}

export interface SellItemParams {
  itemId: string;
  itemType: ItemType;
  quantity: number;
  price: number;
}

export interface BuyItemParams {
  itemId: string;
  itemType: ItemType;
  quantity: number;
  price: number;
}

export interface SellItemResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface BuyItemResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface MarketplaceOrder {
  item_id: string;
  currency: string;
  price: number;
  quantity: number;
  tradeOffers: string;
}

export interface PublicMiner {
  id: string;
  name: string;
  slug: string;
  power: number;
  bonus: number;
  image: string;
  sellable: boolean;
  mergeable: boolean;
  cells: number;
  merges: MinerMerge[];
}

export interface MinerMerge {
  id: string;
  level: number;
  power: number;
  bonus: number;
  mergeFee: number;
  wireCount: number;
  wireLevel: number;
  fanCount: number;
  fanLevel: number;
  hashboardCount: number;
  hashboardLevel: number;
}

export interface ClientOptions {
  accessToken: string;
  refreshToken: string;
}