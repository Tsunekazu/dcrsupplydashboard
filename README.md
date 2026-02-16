# Decred Pulse: Network Dashboard

> **"No VCs. No pre-mine. Just code."**

A living, breathing visualization of the Decred network's health and activity. Designed as a "tribal" command center rather than a generic crypto tracker.

## Vision

This dashboard is built to evoke a sense of **sovereignty** and **club identity**. It uses:
- **Tribal Language:** Score tiers are named `SOVEREIGN`, `FORTIFIED`, `HARDENED`, `STACKING`, `SIGNAL`.
- **Temporal Tension:** Live block age counter and stakeholder headcount create a sense that the network is alive *now*.
- **Data-Responsive Visuals:** The concentric rings are not just decorative; their opacity is driven by treasury health, stake participation, and hashrate.

## Current State (v0.2 - Shelved)

The project is currently a functional prototype with:
- **Real Data:** Fetches live stats from dcrdata.org API.
- **Scoring Model:** Calculates a "Power Level" (0-100) based on treasury runway, stake participation, hashrate, and price action.
- **Cinematic Overlay:** A high-end HUD with glow effects, tiered badges, and flavor text.
- **Canvas/CSS Hybrid Engine:** Particles are rendered in Canvas 2D for performance; structural elements (rings, glow) are CSS for crispness and GPU acceleration.

## Tech Stack

- **Vite + React + TypeScript**
- **TailwindCSS** for styling
- **Framer Motion** for UI animations
- **Canvas API** for background particle system

## Running Locally

```bash
npm install
npm run dev
```

## Roadmap (If Unshelved)

To take this from "prototype" to "production":
1. **Art Direction:** Replace the algorithmic glow/ring effects with assets designed by a visual artist. The current look is "good enough developer art" but needs a designer's touch to cross the uncanny valley.
2. **Mobile Optimization:** The current dashboard is desktop-first; mobile layout needs specific attention.
3. **Sound Design:** Adding subtle, deep hums or clicks on block arrival would enhance the "living reactor" feel.
