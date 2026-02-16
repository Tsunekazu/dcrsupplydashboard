# Decred Pulse — Project Intent + Handover for Next AI

## 1) What this project is supposed to be

This is **not** a classic dashboard and **not** a pure generative-art screensaver.

Target outcome:
- A "command bridge" experience that makes Decred feel like an elite, living system.
- First impression should be emotional/social ("I want in"), not analytical.
- The visualization should feel alive, but with a **small number of high-impact narrative stats** overlaid.

Desired positioning:
- **Living background organism/city** = atmosphere and motion.
- **Sparse hero text** = clear story/flex (stake commitment, treasury runway, price, network health).
- No dense cards, no grid of fields.

---

## 2) Why the current result looks wrong

User screenshot correctly shows the page is too empty and too faint.

Root causes in current code:

1. **Particle spawning is tied to data refresh cadence**
   - In `src/organism/Organism.ts`, particles are mostly created in `setData()` → `updateOrbitParticles()`.
   - Data refresh is every 30s (`src/hooks/useDecredData.ts`), so new particles only trickle in at refresh time.
   - `updateOrbitParticles()` intentionally caps spawn bursts (`min(..., 10)` for orbit and `min(..., 5)` for flow), so the scene never fills quickly.

2. **Visual alpha/intensity is too conservative**
   - Nebula/aurora/core opacity values are very low (e.g., around `0.03`, `0.04`, etc.), producing a nearly black screen.

3. **No robust “always-on” dramatic layer**
   - No strong ring mesh/path rendering, no clear structure silhouette, no foreground glow pass.
   - Current visuals rely on tiny particles + subtle gradients, which disappear on many displays.

4. **Overlay text is legible but underscaled relative to empty background**
   - It reads as floating labels in emptiness instead of a bridge UI over a living system.

---

## 3) Current code status (important)

### Data layer (good, keep)
- `src/api/dcrdata.ts` (live fetch + fallback + network score)
- `src/hooks/useDecredData.ts` (polling + new block detection)

### New visual direction (implemented but underpowered)
- `src/organism/Organism.ts`
- `src/organism/config.ts`
- `src/App.tsx` rewritten to full-screen canvas + sparse overlay

### Legacy component dashboard
- Old card components were removed from `src/components/`.

---

## 4) Intended final experience

Single-screen composition:
1. **Alive visual substrate** (organism/city/reactor) that is impossible to miss.
2. **4 hero narrative signals** only:
   - Network Health score (big)
   - Price + 24h
   - Stake commitment statement
   - Treasury runway statement
3. **Subtle identity markers** (live dot, block anchor, Decred Pulse wordmark).

No card grid, no dense metrics.

---

## 5) Immediate implementation plan for next AI (priority order)

## P0 — Make the background undeniably alive (first 30–60 min)

1. **Decouple particle spawning from API updates**
   - Add continuous emitters in animation loop (`update()`), not only in `setData()`.
   - Maintain target counts every frame:
     - orbit particles: e.g. 180–320
     - flow particles: e.g. 120–220
     - ambient particles: e.g. 80–150

2. **Increase contrast and structural readability**
   - Add explicit orbit ring arcs (strokes) + occasional connecting chords.
   - Add a persistent central halo layer (multi-pass radial gradients).
   - Increase alpha multipliers ~2–4x vs current values.

3. **Add one strong motion signature visible from distance**
   - Continuous sweeping energy band or rotating ring highlights.
   - Keep heartbeat shockwave events on new blocks.

## P1 — Improve narrative overlay hierarchy

1. Increase legibility and spatial composition:
   - Make score and price anchor stronger.
   - Move narrative text into left/right zones so center can breathe around core.

2. Keep copy concise and assertive:
   - Stake line should be one strong sentence.
   - Treasury line should read like a funding moat.

3. Add tiny affordance hint (`press I`) for optional detail overlay.

## P2 — Add optional detail mode (minimal)

- Press `I` toggles mini HUD (4–6 numeric rows) for users wanting exact numbers.
- Default remains cinematic mode.

---

## 6) Concrete technical fixes to apply first

1. In `Organism.update()`:
   - call new methods `maintainOrbitPopulation()` and `maintainFlowPopulation()` every frame.

2. In `Organism.render()`:
   - add `renderOrbitStructure()` before particles (ring strokes).
   - add `renderForegroundBloom()` after core/shockwaves.

3. In `App.tsx`:
   - rebalance text sizes/positions for desktop and mobile breakpoints.
   - keep pointer-events none except optional HUD toggle button.

4. In `index.css`:
   - keep minimal base, but add slight text glow utility classes for hero type.

---

## 7) Known caveats

- API response shapes are best-effort and fallback-heavy; acceptable for prototype.
- `stakeParticipation` currently estimated from `ticketPoolValue / coinSupply` and may need refinement.
- Current scene can appear almost static/dim on some displays due to conservative alpha.

---

## 8) Quick run instructions

```bash
# from /home/jk/Dev/decred-dashboard
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22
npm install
npm run dev
```

---

## 9) Success criteria for next iteration

- Within 2 seconds of load, the scene visibly reads as “alive system” (not blank).
- A screenshot communicates identity + energy + social signal without explaining controls.
- User can grasp the 3–4 core statements at a glance.
- Optional details exist but never dominate the first impression.

---

## 10) Summary sentence for context

The project should become a **cinematic Decred status experience** where live network dynamics are felt first and understood second, with minimal narrative stats framing belonging and strength.
