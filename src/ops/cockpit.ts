export type ExchangeStage =
  | 'Live'
  | 'Integration'
  | 'Due Diligence'
  | 'In Contact'
  | 'Targeting';

export interface ExchangeTrackItem {
  name: string;
  logo: string;
  region: string;
  tier: string;
  stage: ExchangeStage;
  progress: number;
  owner: string;
  blocker: string;
  nextAction: string;
}

export interface OnboardingMission {
  title: string;
  description: string;
  completion: number;
  owner: string;
  href: string;
  cta: string;
}

export interface QACampaign {
  release: string;
  focus: string;
  coverage: number;
  needs: string;
  owner: string;
}

export type MilestoneStatus = 'Complete' | 'On Track' | 'At Risk' | 'Blocked';

export interface GovernanceMilestone {
  title: string;
  dueDate: string;
  status: MilestoneStatus;
  owner: string;
}

export interface NarrativeTrackItem {
  stream: string;
  objective: string;
  progress: number;
}

export interface WeeklyAsk {
  lane: string;
  ask: string;
}

export interface QuickLink {
  label: string;
  href: string;
}

export type CapabilityStatus = 'Live' | 'Rolling Out' | 'Planned';

export interface CapabilityCoverageItem {
  area: string;
  logo: string;
  status: CapabilityStatus;
  progress: number;
  note: string;
  owner: string;
  href: string;
}

export type GrowthImpact = 'High' | 'Medium' | 'Emerging';

export interface GrowthEvent {
  date: string;
  region: string;
  headline: string;
  summary: string;
  impact: GrowthImpact;
  source: string;
  verified: boolean;
}

export type SignalTrend = 'Up' | 'Stable' | 'Watch';

export interface CommunitySignal {
  metric: string;
  region: string;
  value: string;
  trend: SignalTrend;
  note: string;
}

export interface TreasuryInitiative {
  initiative: string;
  budget: string;
  objective: string;
  progress: number;
  owner: string;
}

export interface OpsCockpitData {
  exchangePipeline: ExchangeTrackItem[];
  onboardingMissions: OnboardingMission[];
  qaCampaigns: QACampaign[];
  governanceMilestones: GovernanceMilestone[];
  narrativeTrack: NarrativeTrackItem[];
  weeklyAsks: WeeklyAsk[];
  quickLinks: QuickLink[];
  capabilityCoverage: CapabilityCoverageItem[];
  growthEvents: GrowthEvent[];
  communitySignals: CommunitySignal[];
  treasuryInitiatives: TreasuryInitiative[];
}

export const exchangeStages: ExchangeStage[] = [
  'Targeting',
  'In Contact',
  'Due Diligence',
  'Integration',
  'Live',
];

export const defaultOpsData: OpsCockpitData = {
  exchangePipeline: [
    {
      name: 'US Tier-1 Spot Candidate',
      logo: 'US1',
      region: 'North America',
      tier: 'Tier 1',
      stage: 'In Contact',
      progress: 34,
      owner: 'Listings WG',
      blocker: 'Compliance questionnaire in review',
      nextAction: 'Send market quality and governance packet',
    },
    {
      name: 'EU Fiat On-Ramp Candidate',
      logo: 'EUF',
      region: 'Europe',
      tier: 'Tier 1',
      stage: 'Due Diligence',
      progress: 58,
      owner: 'Listings WG',
      blocker: 'Waiting on wallet operations checklist',
      nextAction: 'Provide API uptime evidence and custodian notes',
    },
    {
      name: 'LATAM Regional Venue',
      logo: 'LAT',
      region: 'LATAM',
      tier: 'Regional',
      stage: 'Integration',
      progress: 79,
      owner: 'Integrations Team',
      blocker: 'Final signer policy verification',
      nextAction: 'Schedule sandbox go-live rehearsal',
    },
    {
      name: 'APAC Growth Venue',
      logo: 'APX',
      region: 'APAC',
      tier: 'Tier 2',
      stage: 'Targeting',
      progress: 21,
      owner: 'BD Outreach',
      blocker: 'Warm intro needed',
      nextAction: 'Secure sponsor intro from community contacts',
    },
    {
      name: 'Existing Venue Reliability Audit',
      logo: 'LQD',
      region: 'Global',
      tier: 'Support',
      stage: 'Live',
      progress: 100,
      owner: 'Exchange Ops',
      blocker: 'None',
      nextAction: 'Track deposits/withdrawals and spreads weekly',
    },
  ],
  onboardingMissions: [
    {
      title: 'Wallet Launch Path',
      description: 'Install wallet, verify binary, and secure seed backup.',
      completion: 62,
      owner: 'Education',
      href: 'https://decred.org/wallets/',
      cta: 'Open Wallet Guide',
    },
    {
      title: 'First Stake Mission',
      description: 'Acquire first DCR, understand tickets, and delegate voting.',
      completion: 43,
      owner: 'Community',
      href: 'https://docs.decred.org/proof-of-stake/overview/',
      cta: 'Open Staking Guide',
    },
    {
      title: 'DEX First Trade',
      description: 'Set up Bison Wallet and complete first non-custodial trade.',
      completion: 37,
      owner: 'DEX Team',
      href: 'https://dex.decred.org/',
      cta: 'Open DEX',
    },
  ],
  qaCampaigns: [
    {
      release: 'Decrediton RC',
      focus: 'Wallet setup, seed restore, and ticket purchase flow',
      coverage: 69,
      needs: 'Linux ARM + macOS Intel testers',
      owner: 'QA Guild',
    },
    {
      release: 'Bison Wallet RC',
      focus: 'Order placement, reconnect, and swap recovery',
      coverage: 54,
      needs: 'Windows + flaky network repro reports',
      owner: 'DEX QA',
    },
    {
      release: 'dcrd Upgrade',
      focus: 'Node sync behavior and peer stability',
      coverage: 71,
      needs: 'Long-running node telemetry snapshots',
      owner: 'Infrastructure',
    },
  ],
  governanceMilestones: [
    {
      title: 'Exchange listing kit v1 finalized',
      dueDate: '2026-02-25',
      status: 'On Track',
      owner: 'Gov PM',
    },
    {
      title: 'Quarterly treasury report published',
      dueDate: '2026-03-05',
      status: 'At Risk',
      owner: 'Treasury WG',
    },
    {
      title: 'Community tester bounty campaign started',
      dueDate: '2026-02-20',
      status: 'On Track',
      owner: 'Outreach',
    },
    {
      title: 'Proposal delivery scorecard live',
      dueDate: '2026-02-15',
      status: 'Complete',
      owner: 'Governance Ops',
    },
  ],
  narrativeTrack: [
    {
      stream: 'Weekly Ops Update',
      objective: 'Publish transparent progress and blockers every week',
      progress: 64,
    },
    {
      stream: 'Contributor Spotlight',
      objective: 'Highlight testers, operators, and proposal owners',
      progress: 48,
    },
    {
      stream: 'Exchange Readiness Story',
      objective: 'Explain why Decred listings are operationally attractive',
      progress: 57,
    },
  ],
  weeklyAsks: [
    {
      lane: 'Exchange Ops',
      ask: 'Provide one intro to a North America compliance lead.',
    },
    {
      lane: 'Onboarding',
      ask: 'Record one 60-second wallet setup walkthrough clip.',
    },
    {
      lane: 'QA',
      ask: 'Run Bison Wallet RC on Windows and post findings.',
    },
    {
      lane: 'Governance',
      ask: 'Review milestone scorecard copy before publish.',
    },
  ],
  quickLinks: [
    {
      label: 'Decred Contribution Overview',
      href: 'https://docs.decred.org/contributing/overview/',
    },
    {
      label: 'Politeia Proposal Guidelines',
      href: 'https://docs.decred.org/governance/politeia/proposal-guidelines/',
    },
    {
      label: 'Bounty Program',
      href: 'https://bounty.decred.org/news/',
    },
  ],
  capabilityCoverage: [
    {
      area: 'Privacy Integration',
      logo: 'PRV',
      status: 'Live',
      progress: 82,
      note: 'Mixing and privacy-first workflows documented for users.',
      owner: 'Privacy Ops',
      href: 'https://docs.decred.org/privacy/',
    },
    {
      area: 'Lightning Interop',
      logo: 'LNG',
      status: 'Rolling Out',
      progress: 47,
      note: 'Interop research and partner testing tracks are active.',
      owner: 'R&D',
      href: 'https://github.com/decred',
    },
    {
      area: 'DEX Liquidity Rail',
      logo: 'DEX',
      status: 'Live',
      progress: 74,
      note: 'Bison Wallet trading path promoted in onboarding missions.',
      owner: 'DEX Team',
      href: 'https://dex.decred.org/',
    },
    {
      area: 'Custody + Reporting',
      logo: 'CST',
      status: 'Rolling Out',
      progress: 52,
      note: 'Operational checklist and compliance notes being standardized.',
      owner: 'Exchange Ops',
      href: 'https://decred.org/',
    },
    {
      area: 'Fiat Access',
      logo: 'FIA',
      status: 'Planned',
      progress: 31,
      note: 'Regional on-ramp targets prioritized in roadmap board.',
      owner: 'Growth Ops',
      href: 'https://decred.org/',
    },
  ],
  growthEvents: [
    {
      date: '2026-02-15',
      region: 'LATAM',
      headline: 'Draft: regional venue integration checkpoint moved forward',
      summary: 'Integration runbook completed one additional blocker step.',
      impact: 'High',
      source: 'Ops board update',
      verified: false,
    },
    {
      date: '2026-02-14',
      region: 'JP',
      headline: 'Draft: community growth sprint briefing published',
      summary: 'Local lead shared onboarding priorities for next campaign cycle.',
      impact: 'Medium',
      source: 'Community channel recap',
      verified: false,
    },
    {
      date: '2026-02-13',
      region: 'EU',
      headline: 'Draft: exchange readiness packet revised for due diligence',
      summary: 'Compliance and treasury governance notes aligned for sharing.',
      impact: 'Medium',
      source: 'Listings working group',
      verified: false,
    },
    {
      date: '2026-02-12',
      region: 'Global',
      headline: 'Draft: weekly transparency digest posted',
      summary: 'Mission velocity, blockers, and asks were updated publicly.',
      impact: 'Emerging',
      source: 'Growth ops digest',
      verified: false,
    },
  ],
  communitySignals: [
    {
      metric: 'New growth intros',
      region: 'North America',
      value: '14 this month',
      trend: 'Up',
      note: 'Compliance and listings contact map expanding.',
    },
    {
      metric: 'Ambassador activity',
      region: 'Japan',
      value: '3 active threads',
      trend: 'Stable',
      note: 'Translation and onboarding content is in motion.',
    },
    {
      metric: 'Tester participation',
      region: 'Global',
      value: '26 reports',
      trend: 'Watch',
      note: 'Need more Windows network-failure reports for Bison RC.',
    },
  ],
  treasuryInitiatives: [
    {
      initiative: 'Listings + Compliance Lane',
      budget: '120K DCR',
      objective: 'Move two candidates from contact into integration.',
      progress: 61,
      owner: 'Growth Ops',
    },
    {
      initiative: 'Onboarding Experience Pack',
      budget: '42K DCR',
      objective: 'Ship short wallet + staking + DEX walkthrough set.',
      progress: 46,
      owner: 'Education',
    },
    {
      initiative: 'Regional Growth Signals',
      budget: '28K DCR',
      objective: 'Publish weekly growth wire by key language/region.',
      progress: 38,
      owner: 'Community',
    },
  ],
};

export function cloneOpsData(source: OpsCockpitData = defaultOpsData): OpsCockpitData {
  if (typeof structuredClone === 'function') {
    return structuredClone(source);
  }
  return JSON.parse(JSON.stringify(source)) as OpsCockpitData;
}
