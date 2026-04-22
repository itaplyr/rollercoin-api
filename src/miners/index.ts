import { PUBLIC_MINERS_URL } from '../constants.js';
import type { PublicMiner, MinerMerge } from '../types/index.js';

function parsePower(powerStr: string): number {
  if (typeof powerStr !== 'string') return 0;

  const match = powerStr.match(/^([\d.]+)(kh|mh|gh|th|ph|eh)$/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers: Record<string, number> = {
    kh: 1e12,
    mh: 1e9,
    gh: 1e6,
    th: 1e3,
    ph: 1,
    eh: 1e-3,
  };

  return value * multipliers[unit];
}

interface MinerApiResponse {
  total: number;
  total_pages: number;
  items: Record<string, unknown>[];
}

interface MinerMergeRaw {
  merge_id: string;
  level: number;
  power: string;
  bonus: string;
  merge_fee: string;
  wire_count: number;
  wire_level: number;
  fan_count: number;
  fan_level: number;
  hashboard_count: number;
  hashboard_level: number;
}

export class Miners {
  private miners: Map<string, PublicMiner> = new Map();
  private loading = false;

  async load(forceRefresh = false): Promise<void> {
    if (this.loading) return;
    this.loading = true;

    try {
      let page = 1;
      let hasNext = true;

      while (hasNext) {
        const url = `${PUBLIC_MINERS_URL}?page=${page}&per_page=24`;
        const res = await fetch(url);
        const data = await res.json() as MinerApiResponse;

        for (const miner of data.items) {
          const merges = (miner.merges as MinerMergeRaw[] | undefined) || [];

          const minerData: PublicMiner = {
            id: miner.miner_id as string,
            name: miner.name as string,
            slug: miner.slug as string,
            power: parsePower(miner.power as string),
            bonus: parseFloat(miner.bonus as string),
            image: `https://static.rollercoin.com/static/img/market/miners/${miner.image_path as string}`,
            sellable: miner.sellable as boolean,
            mergeable: miner.mergeable as boolean,
            cells: miner.cells as number,
            merges: merges.map((m) => ({
              id: m.merge_id,
              level: m.level,
              power: parsePower(m.power),
              bonus: parseFloat(m.bonus),
              mergeFee: parseFloat(m.merge_fee),
              wireCount: m.wire_count,
              wireLevel: m.wire_level,
              fanCount: m.fan_count,
              fanLevel: m.fan_level,
              hashboardCount: m.hashboard_count,
              hashboardLevel: m.hashboard_level,
            })) as MinerMerge[],
          };

          this.miners.set(minerData.id, minerData);
        }

        hasNext = page < data.total_pages;
        page++;
      }
    } finally {
      this.loading = false;
    }
  }

  getById(id: string): PublicMiner | undefined {
    return this.miners.get(id);
  }

  getAll(): PublicMiner[] {
    return Array.from(this.miners.values());
  }

  getAllAsMap(): Map<string, PublicMiner> {
    return new Map(this.miners);
  }

  count(): number {
    return this.miners.size;
  }
}