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
};

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

function calculateNetworkScore(data: Partial<DecredData>): number {
  let score = 0;
  let weights = 0;

  // Stake participation (target ~50%+ is healthy)
  if (data.stakeParticipation) {
    const stakeScore = Math.min(data.stakeParticipation / 65, 1) * 100;
    score += stakeScore * 30;
    weights += 30;
  }

  // Ticket pool health (close to target = good)
  if (data.ticketPoolSize && data.ticketPoolTarget) {
    const poolRatio = data.ticketPoolSize / data.ticketPoolTarget;
    const poolScore = Math.max(0, 100 - Math.abs(1 - poolRatio) * 200);
    score += poolScore * 20;
    weights += 20;
  }

  // Treasury health (more is better, up to a point)
  if (data.treasuryBalance) {
    const treasuryScore = Math.min(data.treasuryBalance / 1_000_000, 1) * 100;
    score += treasuryScore * 15;
    weights += 15;
  }

  // Mixing participation
  if (data.mixedPercent) {
    const mixScore = Math.min(data.mixedPercent / 70, 1) * 100;
    score += mixScore * 15;
    weights += 15;
  }

  // Price momentum
  if (data.priceChange24h !== undefined) {
    const momentumScore = 50 + Math.max(-50, Math.min(50, data.priceChange24h * 5));
    score += momentumScore * 10;
    weights += 10;
  }

  // Hashrate (existence = healthy)
  if (data.hashrate && data.hashrate > 0) {
    score += 80 * 10;
    weights += 10;
  }

  return weights > 0 ? Math.round(score / weights) : 50;
}

export async function fetchDecredData(): Promise<DecredData> {
  const [bestBlock, stakeInfo, supply, treasuryBal, priceData] = await Promise.all([
    safeFetch<any>(`${DCRDATA_BASE}/block/best`),
    safeFetch<any>(`${DCRDATA_BASE}/stake/pool`),
    safeFetch<any>(`${DCRDATA_BASE}/supply`),
    safeFetch<any>(`${DCRDATA_BASE}/treasury/balance`),
    safeFetch<any>(`${COINGECKO_BASE}/simple/price?ids=decred&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`),
  ]);

  let anyLive = false;
  const data: DecredData = { ...FALLBACK, lastUpdated: Date.now() };

  if (bestBlock) {
    anyLive = true;
    data.blockHeight = bestBlock.height ?? bestBlock.block?.height ?? data.blockHeight;
    data.blockTime = bestBlock.time ?? bestBlock.block?.time ?? data.blockTime;
  }

  if (stakeInfo) {
    anyLive = true;
    // dcrdata /stake/pool returns: { size, value, target, ... } or similar shape
    if (typeof stakeInfo === 'object') {
      data.ticketPoolSize = stakeInfo.size ?? stakeInfo.pool_size ?? data.ticketPoolSize;
      data.ticketPoolValue = stakeInfo.value ?? stakeInfo.pool_value ?? data.ticketPoolValue;
      data.ticketPoolTarget = stakeInfo.target ?? data.ticketPoolTarget;
    }
  }

  if (supply) {
    anyLive = true;
    if (typeof supply === 'number') {
      data.coinSupply = supply / 1e8; // atoms to DCR
    } else if (typeof supply === 'object') {
      data.coinSupply = (supply.supply_total ?? supply.coin_supply ?? 0) / 1e8 || data.coinSupply;
      data.mixedPercent = supply.mixed_percent ?? data.mixedPercent;
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
    } else if (typeof treasuryBal === 'object') {
      data.treasuryBalance = (treasuryBal.balance ?? treasuryBal.total ?? 0) / 1e8 || data.treasuryBalance;
    }
  }

  if (priceData?.decred) {
    anyLive = true;
    data.price = priceData.decred.usd ?? data.price;
    data.priceChange24h = priceData.decred.usd_24h_change ?? data.priceChange24h;
    data.marketCap = priceData.decred.usd_market_cap ?? data.marketCap;
    data.volume24h = priceData.decred.usd_24h_vol ?? data.volume24h;
  }

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
