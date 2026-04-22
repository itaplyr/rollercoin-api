import { MARKETPLACE } from '../constants.js';
import { Auth } from '../auth/index.js';
import type { ItemInfo, ItemType, SellItemParams, BuyItemParams } from '../types/index.js';

function getItemImage(item: { itemType: ItemType; itemId: string; filename?: string }): string {
  switch (item.itemType) {
    case 'miner':
      return `https://static.rollercoin.com/static/img/market/miners/${item.filename || 'default_miner'}.gif?v=1754404461263`;
    case 'mutation_component':
      return `https://static.rollercoin.com/static/img/storage/mutation_components/${item.itemId}.png?v=1.0.1`;
    case 'rack':
      return `https://static.rollercoin.com/static/img/market/racks/${item.itemId}.png?v=1.0.4`;
    case 'battery':
      return `https://static.rollercoin.com/static/img/market/batteries/${item.itemId}.png?v=1.0.3`;
    default:
      return 'https://static.rollercoin.com/static/img/market/miners/lube_lord.gif?v=1757669293192';
  }
}

function extractItemInfo(data: Record<string, unknown>, itemType: ItemType, itemId: string): ItemInfo {
  const rarityGroup = data.rarityGroup as { title?: { en?: string }; baseHexColor?: string } | undefined;
  const bonus = data.bonus as { power_percent?: number } | undefined;

  const info: ItemInfo = {
    id: itemId,
    type: itemType,
    name: (data.name as { en?: string })?.en || itemId,
    level: (data.level as number) || 0,
    image: getItemImage({ itemType, itemId, filename: data.filename as string }),
    rarity: '',
    rarityColor: '',
    power: 0,
    powerPercent: 0,
  };

  if (rarityGroup?.title?.en) {
    info.rarity = rarityGroup.title.en;
    info.rarityColor = rarityGroup.baseHexColor || '';
  }

  if (itemType === 'miner') {
    info.power = (data.power as number) || 0;
    if (bonus?.power_percent) {
      info.powerPercent = bonus.power_percent;
    }
  }

  return info;
}

interface MarketplaceItemResponse {
  success: boolean;
  data?: Record<string, unknown>;
}

export class Marketplace {
  constructor(private auth: Auth) {}

  async getItemInfo(itemId: string, itemType: ItemType): Promise<ItemInfo> {
    const url = MARKETPLACE.itemInfo(itemId, itemType);
    const res = await this.auth.authenticatedFetch(url, { method: 'GET' });
    const data = await res.json() as MarketplaceItemResponse;

    if (data.success && data.data) {
      return extractItemInfo(data.data, itemType, itemId);
    }

    return {
      id: itemId,
      type: itemType,
      name: itemId,
      level: 0,
      image: getItemImage({ itemType, itemId }),
    };
  }

  async sellItem(params: SellItemParams): Promise<Record<string, unknown>> {
    const res = await this.auth.authenticatedFetch(MARKETPLACE.sellItem, {
      method: 'POST',
      body: JSON.stringify({
        challenge: '',
        action: 'marketplace',
        itemId: params.itemId,
        itemType: params.itemType,
        totalCount: params.quantity,
        currency: 'RLT',
        exchangeCurrency: 'RLT',
        perItemPrice: Math.floor(params.price / 1.05),
      }),
    });

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: text };
    }
  }

  async buyItem(params: BuyItemParams): Promise<Record<string, unknown>> {
    const res = await this.auth.authenticatedFetch(MARKETPLACE.purchaseItem, {
      method: 'POST',
      body: JSON.stringify({
        challenge: '',
        action: 'marketplace',
        itemId: params.itemId,
        itemType: params.itemType,
        totalCount: params.quantity,
        currency: 'RLT',
        totalPrice: params.price,
      }),
    });

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: text };
    }
  }
}