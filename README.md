# Decred Pulse: Growth Cockpit

> **"No VCs. No pre-mine. Just code."**

Decred Pulse is now an operations-first command bridge:
- old-school blue/white control-room aesthetic
- focused default surface (mission + top move + top blocker/ask)
- editable JSON data model stored in browser `localStorage`

## What It Is

The app is designed to support short-term Decred adoption work:
1. Exchange pipeline stages and blockers
2. Onboarding mission progress
3. Release QA campaign coverage
4. Governance milestone tracking
5. Weekly contributor asks + official references

Default view intentionally shows only the crucial 3 decision blocks.
Use `D` (Deep Dive) for full operational detail.

## Runtime Requirements

- Node.js `20.19+` or `22.12+` (tested with `22.22.0`)
- npm `10+`

## Run Locally

```bash
cd /home/jk/Dev/decred-dashboard
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22
npm install
npm run dev
```

## Build + Lint

```bash
npm run lint
npm run build
```

## Keyboard Controls

- `R`: refresh live network data
- `I`: toggle network intel drawer
- `O`: toggle JSON ops editor drawer
- `D`: toggle deep-dive board (focus vs full details)

## Editing Ops Data

Use the `Edit JSON` button (or `O`) to update pipeline content without code edits.

The JSON shape is defined in `src/ops/cockpit.ts`:
- `exchangePipeline`
- `onboardingMissions`
- `qaCampaigns`
- `governanceMilestones`
- `narrativeTrack`
- `weeklyAsks`
- `quickLinks`

Data is persisted in browser `localStorage` keys:
- `decred:cockpit:ops:v1`
- `decred:cockpit:mode:v1`
- `decred:cockpit:saved-at:v1`

## Notes

- Live network metrics come from dcrdata and CoinGecko with fallbacks.
- Public/Internal mode controls redaction of owners and blocker details.
