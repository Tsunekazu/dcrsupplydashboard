import {
  cloneOpsData,
  exchangeStages,
  type CapabilityCoverageItem,
  type CapabilityStatus,
  type CommunitySignal,
  type ExchangeStage,
  type ExchangeTrackItem,
  type GovernanceMilestone,
  type GrowthEvent,
  type GrowthImpact,
  type MilestoneStatus,
  type NarrativeTrackItem,
  type OnboardingMission,
  type OpsCockpitData,
  type QACampaign,
  type QuickLink,
  type SignalTrend,
  type TreasuryInitiative,
  type WeeklyAsk,
} from './cockpit';

export const OPS_STORAGE_KEY = 'decred:cockpit:ops:v1';
export const OPS_MODE_KEY = 'decred:cockpit:mode:v1';
export const OPS_SAVED_AT_KEY = 'decred:cockpit:saved-at:v1';

export type VisibilityMode = 'Public' | 'Internal';

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
}

function asExchangeStage(value: unknown, fallback: ExchangeStage): ExchangeStage {
  if (typeof value === 'string' && exchangeStages.includes(value as ExchangeStage)) {
    return value as ExchangeStage;
  }
  return fallback;
}

const milestoneStatuses: MilestoneStatus[] = ['Complete', 'On Track', 'At Risk', 'Blocked'];

function asMilestoneStatus(value: unknown, fallback: MilestoneStatus): MilestoneStatus {
  if (typeof value === 'string' && milestoneStatuses.includes(value as MilestoneStatus)) {
    return value as MilestoneStatus;
  }
  return fallback;
}

const capabilityStatuses: CapabilityStatus[] = ['Live', 'Rolling Out', 'Planned'];

function asCapabilityStatus(value: unknown, fallback: CapabilityStatus): CapabilityStatus {
  if (typeof value === 'string' && capabilityStatuses.includes(value as CapabilityStatus)) {
    return value as CapabilityStatus;
  }
  return fallback;
}

const growthImpactValues: GrowthImpact[] = ['High', 'Medium', 'Emerging'];

function asGrowthImpact(value: unknown, fallback: GrowthImpact): GrowthImpact {
  if (typeof value === 'string' && growthImpactValues.includes(value as GrowthImpact)) {
    return value as GrowthImpact;
  }
  return fallback;
}

const signalTrendValues: SignalTrend[] = ['Up', 'Stable', 'Watch'];

function asSignalTrend(value: unknown, fallback: SignalTrend): SignalTrend {
  if (typeof value === 'string' && signalTrendValues.includes(value as SignalTrend)) {
    return value as SignalTrend;
  }
  return fallback;
}

function normalizeExchangePipeline(
  candidate: unknown,
  fallback: ExchangeTrackItem[],
): ExchangeTrackItem[] {
  if (!Array.isArray(candidate)) return fallback;
  return candidate.map((item, index) => {
    const fallbackItem = fallback[index] ?? fallback[Math.max(fallback.length - 1, 0)];
    const record = asRecord(item);
    if (!record) {
      return fallbackItem ?? {
        name: `Exchange ${index + 1}`,
        logo: 'EX',
        region: 'Global',
        tier: 'Tier',
        stage: 'Targeting',
        progress: 0,
        owner: 'Ops Team',
        blocker: 'None',
        nextAction: 'Update pending',
      };
    }
    return {
      name: asString(record.name, fallbackItem?.name ?? `Exchange ${index + 1}`),
      logo: asString(record.logo, fallbackItem?.logo ?? 'EX').slice(0, 4).toUpperCase(),
      region: asString(record.region, fallbackItem?.region ?? 'Global'),
      tier: asString(record.tier, fallbackItem?.tier ?? 'Tier'),
      stage: asExchangeStage(record.stage, fallbackItem?.stage ?? 'Targeting'),
      progress: clampPercent(asNumber(record.progress, fallbackItem?.progress ?? 0)),
      owner: asString(record.owner, fallbackItem?.owner ?? 'Ops Team'),
      blocker: asString(record.blocker, fallbackItem?.blocker ?? 'None'),
      nextAction: asString(record.nextAction, fallbackItem?.nextAction ?? 'Update pending'),
    };
  });
}

function normalizeOnboardingMissions(
  candidate: unknown,
  fallback: OnboardingMission[],
): OnboardingMission[] {
  if (!Array.isArray(candidate)) return fallback;
  return candidate.map((item, index) => {
    const fallbackItem = fallback[index] ?? fallback[Math.max(fallback.length - 1, 0)];
    const record = asRecord(item);
    if (!record) {
      return fallbackItem ?? {
        title: `Mission ${index + 1}`,
        description: 'Update mission details.',
        completion: 0,
        owner: 'Ops Team',
        href: '#',
        cta: 'Open',
      };
    }
    return {
      title: asString(record.title, fallbackItem?.title ?? `Mission ${index + 1}`),
      description: asString(record.description, fallbackItem?.description ?? 'Update mission details.'),
      completion: clampPercent(asNumber(record.completion, fallbackItem?.completion ?? 0)),
      owner: asString(record.owner, fallbackItem?.owner ?? 'Ops Team'),
      href: asString(record.href, fallbackItem?.href ?? '#'),
      cta: asString(record.cta, fallbackItem?.cta ?? 'Open'),
    };
  });
}

function normalizeQaCampaigns(candidate: unknown, fallback: QACampaign[]): QACampaign[] {
  if (!Array.isArray(candidate)) return fallback;
  return candidate.map((item, index) => {
    const fallbackItem = fallback[index] ?? fallback[Math.max(fallback.length - 1, 0)];
    const record = asRecord(item);
    if (!record) {
      return fallbackItem ?? {
        release: `Release ${index + 1}`,
        focus: 'Testing focus pending.',
        coverage: 0,
        needs: 'Need tester coverage',
        owner: 'QA',
      };
    }
    return {
      release: asString(record.release, fallbackItem?.release ?? `Release ${index + 1}`),
      focus: asString(record.focus, fallbackItem?.focus ?? 'Testing focus pending.'),
      coverage: clampPercent(asNumber(record.coverage, fallbackItem?.coverage ?? 0)),
      needs: asString(record.needs, fallbackItem?.needs ?? 'Need tester coverage'),
      owner: asString(record.owner, fallbackItem?.owner ?? 'QA'),
    };
  });
}

function normalizeGovernanceMilestones(
  candidate: unknown,
  fallback: GovernanceMilestone[],
): GovernanceMilestone[] {
  if (!Array.isArray(candidate)) return fallback;
  return candidate.map((item, index) => {
    const fallbackItem = fallback[index] ?? fallback[Math.max(fallback.length - 1, 0)];
    const record = asRecord(item);
    if (!record) {
      return fallbackItem ?? {
        title: `Milestone ${index + 1}`,
        dueDate: new Date().toISOString().slice(0, 10),
        status: 'On Track',
        owner: 'Governance',
      };
    }
    return {
      title: asString(record.title, fallbackItem?.title ?? `Milestone ${index + 1}`),
      dueDate: asString(record.dueDate, fallbackItem?.dueDate ?? new Date().toISOString().slice(0, 10)),
      status: asMilestoneStatus(record.status, fallbackItem?.status ?? 'On Track'),
      owner: asString(record.owner, fallbackItem?.owner ?? 'Governance'),
    };
  });
}

function normalizeNarrativeTrack(
  candidate: unknown,
  fallback: NarrativeTrackItem[],
): NarrativeTrackItem[] {
  if (!Array.isArray(candidate)) return fallback;
  return candidate.map((item, index) => {
    const fallbackItem = fallback[index] ?? fallback[Math.max(fallback.length - 1, 0)];
    const record = asRecord(item);
    if (!record) {
      return fallbackItem ?? {
        stream: `Stream ${index + 1}`,
        objective: 'Objective pending.',
        progress: 0,
      };
    }
    return {
      stream: asString(record.stream, fallbackItem?.stream ?? `Stream ${index + 1}`),
      objective: asString(record.objective, fallbackItem?.objective ?? 'Objective pending.'),
      progress: clampPercent(asNumber(record.progress, fallbackItem?.progress ?? 0)),
    };
  });
}

function normalizeWeeklyAsks(candidate: unknown, fallback: WeeklyAsk[]): WeeklyAsk[] {
  if (!Array.isArray(candidate)) return fallback;
  return candidate.map((item, index) => {
    const fallbackItem = fallback[index] ?? fallback[Math.max(fallback.length - 1, 0)];
    const record = asRecord(item);
    if (!record) {
      return fallbackItem ?? {
        lane: `Lane ${index + 1}`,
        ask: 'Action needed.',
      };
    }
    return {
      lane: asString(record.lane, fallbackItem?.lane ?? `Lane ${index + 1}`),
      ask: asString(record.ask, fallbackItem?.ask ?? 'Action needed.'),
    };
  });
}

function normalizeQuickLinks(candidate: unknown, fallback: QuickLink[]): QuickLink[] {
  if (!Array.isArray(candidate)) return fallback;
  return candidate.map((item, index) => {
    const fallbackItem = fallback[index] ?? fallback[Math.max(fallback.length - 1, 0)];
    const record = asRecord(item);
    if (!record) {
      return fallbackItem ?? {
        label: `Reference ${index + 1}`,
        href: '#',
      };
    }
    return {
      label: asString(record.label, fallbackItem?.label ?? `Reference ${index + 1}`),
      href: asString(record.href, fallbackItem?.href ?? '#'),
    };
  });
}

function normalizeCapabilityCoverage(
  candidate: unknown,
  fallback: CapabilityCoverageItem[],
): CapabilityCoverageItem[] {
  if (!Array.isArray(candidate)) return fallback;
  return candidate.map((item, index) => {
    const fallbackItem = fallback[index] ?? fallback[Math.max(fallback.length - 1, 0)];
    const record = asRecord(item);
    if (!record) {
      return fallbackItem ?? {
        area: `Capability ${index + 1}`,
        logo: 'CAP',
        status: 'Planned',
        progress: 0,
        note: 'Update capability details.',
        owner: 'Ops Team',
        href: '#',
      };
    }
    return {
      area: asString(record.area, fallbackItem?.area ?? `Capability ${index + 1}`),
      logo: asString(record.logo, fallbackItem?.logo ?? 'CAP').slice(0, 4).toUpperCase(),
      status: asCapabilityStatus(record.status, fallbackItem?.status ?? 'Planned'),
      progress: clampPercent(asNumber(record.progress, fallbackItem?.progress ?? 0)),
      note: asString(record.note, fallbackItem?.note ?? 'Update capability details.'),
      owner: asString(record.owner, fallbackItem?.owner ?? 'Ops Team'),
      href: asString(record.href, fallbackItem?.href ?? '#'),
    };
  });
}

function normalizeGrowthEvents(candidate: unknown, fallback: GrowthEvent[]): GrowthEvent[] {
  if (!Array.isArray(candidate)) return fallback;
  return candidate.map((item, index) => {
    const fallbackItem = fallback[index] ?? fallback[Math.max(fallback.length - 1, 0)];
    const record = asRecord(item);
    if (!record) {
      return fallbackItem ?? {
        date: new Date().toISOString().slice(0, 10),
        region: 'Global',
        headline: `Event ${index + 1}`,
        summary: 'Update event summary.',
        impact: 'Emerging',
        source: 'Ops notes',
        verified: false,
      };
    }
    return {
      date: asString(record.date, fallbackItem?.date ?? new Date().toISOString().slice(0, 10)),
      region: asString(record.region, fallbackItem?.region ?? 'Global'),
      headline: asString(record.headline, fallbackItem?.headline ?? `Event ${index + 1}`),
      summary: asString(record.summary, fallbackItem?.summary ?? 'Update event summary.'),
      impact: asGrowthImpact(record.impact, fallbackItem?.impact ?? 'Emerging'),
      source: asString(record.source, fallbackItem?.source ?? 'Ops notes'),
      verified: asBoolean(record.verified, fallbackItem?.verified ?? false),
    };
  });
}

function normalizeCommunitySignals(
  candidate: unknown,
  fallback: CommunitySignal[],
): CommunitySignal[] {
  if (!Array.isArray(candidate)) return fallback;
  return candidate.map((item, index) => {
    const fallbackItem = fallback[index] ?? fallback[Math.max(fallback.length - 1, 0)];
    const record = asRecord(item);
    if (!record) {
      return fallbackItem ?? {
        metric: `Signal ${index + 1}`,
        region: 'Global',
        value: '0',
        trend: 'Stable',
        note: 'Update signal.',
      };
    }
    return {
      metric: asString(record.metric, fallbackItem?.metric ?? `Signal ${index + 1}`),
      region: asString(record.region, fallbackItem?.region ?? 'Global'),
      value: asString(record.value, fallbackItem?.value ?? '0'),
      trend: asSignalTrend(record.trend, fallbackItem?.trend ?? 'Stable'),
      note: asString(record.note, fallbackItem?.note ?? 'Update signal.'),
    };
  });
}

function normalizeTreasuryInitiatives(
  candidate: unknown,
  fallback: TreasuryInitiative[],
): TreasuryInitiative[] {
  if (!Array.isArray(candidate)) return fallback;
  return candidate.map((item, index) => {
    const fallbackItem = fallback[index] ?? fallback[Math.max(fallback.length - 1, 0)];
    const record = asRecord(item);
    if (!record) {
      return fallbackItem ?? {
        initiative: `Initiative ${index + 1}`,
        budget: '0 DCR',
        objective: 'Update objective.',
        progress: 0,
        owner: 'Ops Team',
      };
    }
    return {
      initiative: asString(record.initiative, fallbackItem?.initiative ?? `Initiative ${index + 1}`),
      budget: asString(record.budget, fallbackItem?.budget ?? '0 DCR'),
      objective: asString(record.objective, fallbackItem?.objective ?? 'Update objective.'),
      progress: clampPercent(asNumber(record.progress, fallbackItem?.progress ?? 0)),
      owner: asString(record.owner, fallbackItem?.owner ?? 'Ops Team'),
    };
  });
}

export function normalizeOpsData(raw: unknown): OpsCockpitData | null {
  const record = asRecord(raw);
  if (!record) return null;

  const defaults = cloneOpsData();
  return {
    exchangePipeline: normalizeExchangePipeline(record.exchangePipeline, defaults.exchangePipeline),
    onboardingMissions: normalizeOnboardingMissions(record.onboardingMissions, defaults.onboardingMissions),
    qaCampaigns: normalizeQaCampaigns(record.qaCampaigns, defaults.qaCampaigns),
    governanceMilestones: normalizeGovernanceMilestones(record.governanceMilestones, defaults.governanceMilestones),
    narrativeTrack: normalizeNarrativeTrack(record.narrativeTrack, defaults.narrativeTrack),
    weeklyAsks: normalizeWeeklyAsks(record.weeklyAsks, defaults.weeklyAsks),
    quickLinks: normalizeQuickLinks(record.quickLinks, defaults.quickLinks),
    capabilityCoverage: normalizeCapabilityCoverage(record.capabilityCoverage, defaults.capabilityCoverage),
    growthEvents: normalizeGrowthEvents(record.growthEvents, defaults.growthEvents),
    communitySignals: normalizeCommunitySignals(record.communitySignals, defaults.communitySignals),
    treasuryInitiatives: normalizeTreasuryInitiatives(record.treasuryInitiatives, defaults.treasuryInitiatives),
  };
}

export function readInitialOpsData(): OpsCockpitData {
  if (typeof window === 'undefined') return cloneOpsData();
  const raw = window.localStorage.getItem(OPS_STORAGE_KEY);
  if (!raw) return cloneOpsData();
  try {
    const parsed = JSON.parse(raw) as unknown;
    return normalizeOpsData(parsed) ?? cloneOpsData();
  } catch {
    return cloneOpsData();
  }
}

export function readInitialVisibilityMode(): VisibilityMode {
  if (typeof window === 'undefined') return 'Public';
  const raw = window.localStorage.getItem(OPS_MODE_KEY);
  return raw === 'Internal' ? 'Internal' : 'Public';
}

export function readInitialSavedAt(): number {
  if (typeof window === 'undefined') return Date.now();
  const raw = window.localStorage.getItem(OPS_SAVED_AT_KEY);
  if (!raw) return Date.now();
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : Date.now();
}
