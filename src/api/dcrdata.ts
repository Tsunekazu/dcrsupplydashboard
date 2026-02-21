const DCRDATA_BASE = 'https://dcrdata.decred.org/api';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

export interface DecredData {
  blockHeight: number;
  blockTime: number;
  ticketPrice: number;
  ticketPoolSize: number;
  ticketPoolTarget: number;
  ticketPoolValue: number;
  stakeParticipation: number;
  hashrate: number;
  treasuryBalance: number;
  treasuryMonthlyBurn: number;
  coinSupply: number;
  mixedPercent: number;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  networkScore: number;
  lastUpdated: number;
  isLive: boolean;
  totalSupply: number;
  unminedSupply: number;
  liquidSupply: number;
}
const FALLBACK: DecredData = {
  blockHeight: 841_250,
  blockTime: Date.now() / 1000,
  ticketPrice: 248.5,
  ticketPoolSize: 41_200,
  ticketPoolTarget: 40_960,
  ticketPoolValue: 10_234_000,
  stakeParticipation: 63.2,
  hashrate: 1.25e17,
  treasuryBalance: 872_000,
  treasuryMonthlyBurn: 22_500,
  coinSupply: 16_150_000,
  mixedPercent: 62.5,
  price: 18.45,
  priceChange24h: 3.2,
  marketCap: 298_000_000,
  volume24h: 4_200_000,
  networkScore: 78,
  lastUpdated: Date.now(),
  isLive: false,
  totalSupply: 21_000_000,
  unminedSupply: 4_850_000,
  liquidSupply: 4_994_000,
};

interface BestBlockResponse {
  height?: number;
  time?: number;
  block?: {
    height?: number;
    time?: number;
  };
}

interface StakePoolResponse {
  size?: number;
  pool_size?: number;
  value?: number;
  pool_value?: number;
  target?: number;
}

interface SupplyResponseObject {
  supply_total?: number;
  coin_supply?: number;
  mixed_percent?: number;
}

type SupplyResponse = number | SupplyResponseObject;

type TreasuryBalanceResponse = number | { balance?: number; total?: number; spent?: number; spend_count?: number };

interface CoinGeckoPriceResponse {
  decred?: {
    usd?: number;
    usd_24h_change?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
  };
}

async function safeFetch<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function calculateNetworkScore(data: Partial<DecredData>): number {
  let score = 0;
  let totalWeight = 0;

  // 1. Consensus Stability (30%)
  // Blueprint: Hashrate > 30-day MA; VSP Uptime > 99.9%
  // Heuristic: Hashrate > 80 PH/s (approx 30d avg) -> 100.
  if (data.hashrate) {
    const health = Math.min(data.hashrate / 80e15, 1); // 80 PH/s target
    score += (health * 100) * 0.30;
    totalWeight += 0.30;
  }

  // 2. Governance Participation (30%)
  // Blueprint: Pool > 40,960; Turnout > 50%
  if (data.ticketPoolSize && data.ticketPoolTarget) {
    const ratio = data.ticketPoolSize / data.ticketPoolTarget; // Target ~40960
    // 0.95 - 1.05 is healthy zone
    const gap = Math.abs(1 - ratio);
    // If gap is < 0.05, score 100. If gap > 0.2, score drops.
    const govScore = Math.max(0, 100 - (Math.max(0, gap - 0.05) * 400));
    score += govScore * 0.30;
    totalWeight += 0.30;
  }

  // 3. Treasury Liquidity (20%)
  // Blueprint: > 12 months runway
  if (data.treasuryBalance) {
    const burnRate = data.treasuryMonthlyBurn || 25000; // Fallback burn
    const runwayMonths = data.treasuryBalance / burnRate;
    const treasuryScore = Math.min(runwayMonths / 24, 1) * 100; // 24mo runway = 100%
    score += treasuryScore * 0.20;
    totalWeight += 0.20;
  }

  // 4. DEX Liquidity Depth (20%)
  // Blueprint: Bid/Ask < 1%; Volume > $X
  // Proxy: Volume24h relative to MarketCap. Healthy > 0.5% turnover?
  // Or just check if price exists and is non-zero (simple liveness).
  if (data.volume24h && data.marketCap) {
    const turnover = data.volume24h / data.marketCap;
    // 0.2% daily turnover is decent for stored value.
    const dexScore = Math.min(turnover / 0.002, 1) * 100;
    score += Math.max(dexScore, 85) * 0.20; // Floor at 85 for now as DEX API isn't fully integrated
    totalWeight += 0.20;
  }

  return totalWeight > 0 ? Math.round(score / totalWeight) : 60;
}

export async function fetchDecredData(): Promise<DecredData> {
  const [bestBlock, stakeInfo, supply, treasuryBal, priceData] = await Promise.all([
    safeFetch<BestBlockResponse>(`${DCRDATA_BASE}/block/best`),
    safeFetch<StakePoolResponse>(`${DCRDATA_BASE}/stake/pool`),
    safeFetch<SupplyResponse>(`${DCRDATA_BASE}/supply`),
    safeFetch<TreasuryBalanceResponse>(`${DCRDATA_BASE}/treasury/balance`),
    safeFetch<CoinGeckoPriceResponse>(`${COINGECKO_BASE}/simple/price?ids=decred&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`),
  ]);

  let anyLive = false;
  const data: DecredData = { ...FALLBACK, lastUpdated: Date.now() };

  if (bestBlock) {
    anyLive = true;
    const bestHeight = toNumber(bestBlock.height) ?? toNumber(bestBlock.block?.height);
    const bestTime = toNumber(bestBlock.time) ?? toNumber(bestBlock.block?.time);
    data.blockHeight = bestHeight ?? data.blockHeight;
    data.blockTime = bestTime ?? data.blockTime;
  }

  if (stakeInfo) {
    anyLive = true;
    data.ticketPoolSize = toNumber(stakeInfo.size) ?? toNumber(stakeInfo.pool_size) ?? data.ticketPoolSize;
    data.ticketPoolValue = toNumber(stakeInfo.value) ?? toNumber(stakeInfo.pool_value) ?? data.ticketPoolValue;
    data.ticketPoolTarget = toNumber(stakeInfo.target) ?? data.ticketPoolTarget;
  }

  if (supply) {
    anyLive = true;
    if (typeof supply === 'number') {
      data.coinSupply = supply / 1e8; // atoms to DCR
    } else {
      const totalSupplyAtoms = toNumber(supply.supply_total) ?? toNumber(supply.coin_supply);
      if (totalSupplyAtoms !== null) {
        data.coinSupply = totalSupplyAtoms / 1e8;
      }
      data.mixedPercent = toNumber(supply.mixed_percent) ?? data.mixedPercent;
    }
  }

  // Compute stake participation from available data
  if (data.ticketPoolValue && data.coinSupply) {
    data.stakeParticipation = (data.ticketPoolValue / data.coinSupply) * 100;
  }

  if (treasuryBal) {
    anyLive = true;
    if (typeof treasuryBal === 'number') {
      data.treasuryBalance = treasuryBal / 1e8;
    } else {
      const treasuryAtoms = toNumber(treasuryBal.balance) ?? toNumber(treasuryBal.total);
      if (treasuryAtoms !== null) {
        data.treasuryBalance = treasuryAtoms / 1e8;
      }

      const spentAtoms = toNumber(treasuryBal.spent);
      const spendCount = toNumber(treasuryBal.spend_count);
      if (spentAtoms !== null && spendCount !== null && spendCount > 0) {
        data.treasuryMonthlyBurn = (spentAtoms / 1e8) / spendCount;
      }
    }
  }

  if (priceData?.decred) {
    anyLive = true;
    data.price = toNumber(priceData.decred.usd) ?? data.price;
    data.priceChange24h = toNumber(priceData.decred.usd_24h_change) ?? data.priceChange24h;
    data.marketCap = toNumber(priceData.decred.usd_market_cap) ?? data.marketCap;
    data.volume24h = toNumber(priceData.decred.usd_24h_vol) ?? data.volume24h;
  }

  data.totalSupply = 21_000_000;
  data.unminedSupply = Math.max(0, data.totalSupply - data.coinSupply);
  data.liquidSupply = Math.max(0, data.coinSupply - data.ticketPoolValue - data.treasuryBalance);

  data.isLive = anyLive;
  data.networkScore = calculateNetworkScore(data);

  return data;
}

export function formatDCR(value: number, decimals = 1): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(decimals)}K`;
  return value.toFixed(decimals);
}

export function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatHashrate(h: number): string {
  if (h >= 1e18) return `${(h / 1e18).toFixed(2)} EH/s`;
  if (h >= 1e15) return `${(h / 1e15).toFixed(2)} PH/s`;
  if (h >= 1e12) return `${(h / 1e12).toFixed(2)} TH/s`;
  return `${(h / 1e9).toFixed(2)} GH/s`;
}

export function timeSince(unixSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000 - unixSeconds);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
