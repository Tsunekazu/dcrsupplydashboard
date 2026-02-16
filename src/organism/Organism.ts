import { rgbaStr, lerpColor, COLORS, POPULATION, RINGS, CORE, BEAMS, TIMING } from './config';
import type { DecredData } from '../api/dcrdata';

// ── Types ──────────────────────────────────────────────────────

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; alpha: number;
  life: number; maxLife: number;
  type: 'orbit' | 'flow' | 'ambient' | 'burst';
  angle?: number; radius?: number; speed?: number;
  ringIndex?: number;
  color?: string;
}

interface Shockwave {
  radius: number; alpha: number; speed: number; lineWidth: number;
}

// ── Organism ───────────────────────────────────────────────────

export class Organism {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private frame = 0;
  private data: DecredData | null = null;
  private mouseX = -9999;
  private mouseY = -9999;
  private pulsePhase = 0;
  private shockwaves: Shockwave[] = [];
  private animId = 0;
  private cx = 0;
  private cy = 0;
  private ringAngles = [0, 0, 0];
  private shimmerProgress = -1;     // -1 = inactive
  private beamBaseAngle = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  // ── Public API ─────────────────────────────────────────────

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.cx = window.innerWidth / 2;
    this.cy = window.innerHeight / 2;
  }

  setData(data: DecredData) {
    const oldHeight = this.data?.blockHeight ?? 0;
    this.data = data;
    if (oldHeight > 0 && data.blockHeight > oldHeight) {
      this.triggerNewBlock();
    }
  }

  setMouse(x: number, y: number) { this.mouseX = x; this.mouseY = y; }

  start() {
    const loop = () => {
      this.update();
      this.render();
      this.frame++;
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() { cancelAnimationFrame(this.animId); }

  // ── New block event ────────────────────────────────────────

  private triggerNewBlock() {
    // Big shockwave
    this.shockwaves.push({ radius: 0, alpha: 0.7, speed: 4, lineWidth: 3 });
    this.shockwaves.push({ radius: 0, alpha: 0.4, speed: 2.5, lineWidth: 1.5 });

    // Burst particles
    for (let i = 0; i < POPULATION.burst; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x: this.cx, y: this.cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.8 + Math.random() * 0.2,
        life: 0, maxLife: 60 + Math.random() * 60,
        type: 'burst',
        color: Math.random() > 0.5 ? COLORS.accent1 : COLORS.gold,
      });
    }
  }

  // ── Population maintenance (called every frame) ────────────

  private maintainOrbitPopulation() {
    const count = this.particles.filter(p => p.type === 'orbit').length;
    const target = this.data
      ? Math.min(Math.max(Math.floor(this.data.ticketPoolSize / 160), POPULATION.orbit.min), POPULATION.orbit.max)
      : POPULATION.orbit.min;

    if (count < target) {
      const toSpawn = Math.min(target - count, POPULATION.orbit.spawnRate);
      for (let i = 0; i < toSpawn; i++) {
        const ringIndex = Math.floor(Math.random() * RINGS.count);
        const minDim = Math.min(window.innerWidth, window.innerHeight);
        const baseRadius = minDim * RINGS.baseRadiusFraction[ringIndex];
        const jitter = (Math.random() - 0.5) * minDim * 0.03;
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.0008 + Math.random() * 0.0025) * (Math.random() > 0.5 ? 1 : -1);

        this.particles.push({
          x: 0, y: 0,
          vx: 0, vy: 0,
          size: 1.5 + Math.random() * 3,
          alpha: 0.3 + Math.random() * 0.5,
          life: 0, maxLife: Infinity,
          type: 'orbit',
          angle, radius: baseRadius + jitter, speed, ringIndex,
        });
      }
    }
  }

  private maintainFlowPopulation() {
    const count = this.particles.filter(p => p.type === 'flow').length;
    const stakeRatio = this.data ? this.data.stakeParticipation / 100 : 0.5;
    const target = Math.floor(POPULATION.flow.min + stakeRatio * (POPULATION.flow.max - POPULATION.flow.min));

    if (count < target) {
      const toSpawn = Math.min(target - count, POPULATION.flow.spawnRate);
      const minDim = Math.min(window.innerWidth, window.innerHeight);
      for (let i = 0; i < toSpawn; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = minDim * (0.35 + Math.random() * 0.3);
        this.particles.push({
          x: 0, y: 0,
          vx: 0, vy: 0,
          size: 1 + Math.random() * 2.2,
          alpha: 0.2 + Math.random() * 0.4,
          life: 0, maxLife: 180 + Math.random() * 260,
          type: 'flow',
          angle, radius: dist, speed: 0.4 + Math.random() * 1.2,
        });
      }
    }
  }

  private maintainAmbientPopulation() {
    const count = this.particles.filter(p => p.type === 'ambient').length;
    if (count < POPULATION.ambient.min) {
      const toSpawn = Math.min(POPULATION.ambient.min - count, POPULATION.ambient.spawnRate);
      const w = window.innerWidth, h = window.innerHeight;
      for (let i = 0; i < toSpawn; i++) {
        this.particles.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          size: 0.5 + Math.random() * 1.5,
          alpha: 0.08 + Math.random() * 0.15,
          life: 0, maxLife: Infinity,
          type: 'ambient',
        });
      }
    }
  }

  // ── Update loop ────────────────────────────────────────────

  private update() {
    const w = window.innerWidth, h = window.innerHeight;

    // Heartbeat
    const bps = CORE.heartbeatBPM / 60;
    this.pulsePhase += (Math.PI * 2 * bps) / 60; // ~60fps

    // Ring rotation
    for (let i = 0; i < RINGS.count; i++) {
      this.ringAngles[i] += RINGS.rotationSpeed[i];
    }

    // Beam rotation
    this.beamBaseAngle += BEAMS.rotationSpeed;

    // Shimmer trigger
    if (this.shimmerProgress < 0 && this.frame % TIMING.shimmerInterval === 0) {
      this.shimmerProgress = 0;
    }
    if (this.shimmerProgress >= 0) {
      this.shimmerProgress += TIMING.shimmerSpeed;
      if (this.shimmerProgress > 1.5) this.shimmerProgress = -1;
    }

    // Shockwaves
    for (const sw of this.shockwaves) {
      sw.radius += sw.speed;
      sw.alpha *= 0.982;
    }
    this.shockwaves = this.shockwaves.filter(sw => sw.alpha > 0.008);

    // Population maintenance
    this.maintainOrbitPopulation();
    this.maintainFlowPopulation();
    this.maintainAmbientPopulation();

    // Particle physics
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;

      if (p.type === 'orbit' && p.angle != null && p.radius != null && p.speed != null) {
        p.angle += p.speed;
        p.x = this.cx + Math.cos(p.angle) * p.radius;
        p.y = this.cy + Math.sin(p.angle) * p.radius;
        p.alpha = 0.45 + Math.sin(p.life * 0.018 + p.angle * 3) * 0.3;
      } else if (p.type === 'flow' && p.radius != null && p.speed != null) {
        p.radius -= p.speed;
        p.angle = (p.angle ?? 0) + 0.008;
        p.x = this.cx + Math.cos(p.angle) * p.radius;
        p.y = this.cy + Math.sin(p.angle) * p.radius;
        const minDim = Math.min(w, h);
        p.alpha = Math.min(p.life / 20, 1) * 0.65 * Math.max(0.15, p.radius / (minDim * 0.3));
        if (p.radius < 15) { this.particles.splice(i, 1); continue; }
      } else if (p.type === 'ambient') {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = 0.06 + Math.sin(p.life * 0.008) * 0.08;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      } else if (p.type === 'burst') {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      }

      // Mouse interaction: orbit/flow particles brighten + scatter
      if ((p.type === 'orbit' || p.type === 'flow') && this.mouseX > 0) {
        const dx = p.x - this.mouseX;
        const dy = p.y - this.mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          const force = (80 - dist) / 80;
          p.alpha = Math.min(1, p.alpha + force * 0.3);
          if (p.type === 'orbit' && p.radius != null) {
            p.radius += force * 0.5;
          }
        }
      }

      if (p.life > p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  // ── Render pipeline ────────────────────────────────────────

  private render() {
    const ctx = this.ctx;
    const w = window.innerWidth, h = window.innerHeight;

    // 1. Deep space gradient (normal blend — this is the base)
    this.renderDeepSpace(ctx, w, h);

    if (!this.data) {
      this.renderLoadingState(ctx, w, h);
      return;
    }

    const momentum = this.data.priceChange24h;
    const tempColor = momentum > 0
      ? lerpColor(COLORS.teal, COLORS.gold, Math.min(momentum / 10, 1))
      : lerpColor(COLORS.teal, COLORS.blue, Math.min(Math.abs(momentum) / 10, 1));

    // All layers use source-over blending with high alpha for visibility

    // 2. Nebula clouds
    this.renderNebula(ctx, w, h, tempColor);

    // 3. Orbit ring structure (visible arcs)
    this.renderOrbitStructure(ctx, w, h, tempColor);


    // 4. Ambient particles
    this.renderParticleType(ctx, 'ambient', COLORS.teal);

    // 5. Flow streams
    this.renderParticleType(ctx, 'flow', tempColor);

    // 6. Energy beams
    this.renderEnergyBeams(ctx, w, h, tempColor);

    // 7. Orbit particles (on top of beams for depth)
    this.renderParticleType(ctx, 'orbit', COLORS.accent1);

    // 8. Core reactor
    this.renderCore(ctx, tempColor);

    // 9. Shockwaves
    this.renderShockwaves(ctx, tempColor);

    // 10. Burst particles (on top of everything)
    this.renderBurstParticles(ctx);

    // 11. Foreground shimmer
    this.renderShimmer(ctx, w, h);
  }

  // ── Layer 1: Deep space ────────────────────────────────────

  private renderDeepSpace(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const grad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, Math.max(w, h) * 0.7);
    grad.addColorStop(0, '#0f2040');
    grad.addColorStop(0.4, '#0a1830');
    grad.addColorStop(1, '#030812');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // ── Layer 2: Nebula clouds ─────────────────────────────────

  private renderNebula(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
    const minDim = Math.min(w, h);
    const breathe = Math.sin(this.pulsePhase * 0.15) * 0.3 + 0.7;

    const blobs = [
      { ox: -0.12, oy: -0.08, r: 0.55, c: color, a: 0.45 },
      { ox: 0.15, oy: 0.1, r: 0.45, c: COLORS.cyan, a: 0.30 },
      { ox: -0.08, oy: 0.15, r: 0.40, c: COLORS.purple, a: 0.22 },
      { ox: 0.1, oy: -0.12, r: 0.35, c: COLORS.blue, a: 0.18 },
    ];

    for (const blob of blobs) {
      const bx = this.cx + blob.ox * minDim + Math.sin(this.frame * TIMING.nebulaRotation + blob.ox * 10) * 20;
      const by = this.cy + blob.oy * minDim + Math.cos(this.frame * TIMING.nebulaRotation + blob.oy * 10) * 20;
      const radius = minDim * blob.r;

      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
      grad.addColorStop(0, rgbaStr(blob.c, blob.a * breathe));
      grad.addColorStop(0.5, rgbaStr(blob.c, blob.a * breathe * 0.4));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  // ── Layer 3: Orbit ring structure ──────────────────────────

  private renderOrbitStructure(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
    const minDim = Math.min(w, h);
    const poolRatio = this.data ? this.data.ticketPoolSize / this.data.ticketPoolTarget : 1;
    const squeeze = 1 + (poolRatio - 1) * 0.5;

    for (let i = 0; i < RINGS.count; i++) {
      const baseR = minDim * RINGS.baseRadiusFraction[i] * squeeze;
      const rot = this.ringAngles[i];
      const alpha = RINGS.strokeAlpha[i];
      const pulseAlpha = alpha + Math.sin(this.pulsePhase + i * 1.2) * 0.08;

      // Filled radial glow BAND behind each ring (makes them unmissable)
      const bandWidth = 20 + (2 - i) * 10; // inner ring gets widest band
      const bandGrad = ctx.createRadialGradient(
        this.cx, this.cy, Math.max(0, baseR - bandWidth),
        this.cx, this.cy, baseR + bandWidth
      );
      bandGrad.addColorStop(0, 'transparent');
      bandGrad.addColorStop(0.3, rgbaStr(color, pulseAlpha * 0.20));
      bandGrad.addColorStop(0.5, rgbaStr(color, pulseAlpha * 0.40));
      bandGrad.addColorStop(0.7, rgbaStr(color, pulseAlpha * 0.20));
      bandGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bandGrad;
      ctx.fillRect(0, 0, w, h);

      // Wide glow stroke (soft halo behind the crisp line)
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, baseR, rot + RINGS.arcGap, rot + Math.PI * 2 - RINGS.arcGap * 0.3);
      ctx.strokeStyle = rgbaStr(color, pulseAlpha * 0.4);
      ctx.lineWidth = RINGS.strokeWidth[i] + 20;
      ctx.stroke();

      // Main crisp arc
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, baseR, rot + RINGS.arcGap, rot + Math.PI * 2 - RINGS.arcGap * 0.3);
      ctx.strokeStyle = rgbaStr(color, pulseAlpha);
      ctx.lineWidth = RINGS.strokeWidth[i];
      ctx.stroke();

      // Secondary arc (opposite side, shorter)
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, baseR, rot + Math.PI + RINGS.arcGap * 0.5, rot + Math.PI * 2 - RINGS.arcGap);
      ctx.strokeStyle = rgbaStr(COLORS.accent1, pulseAlpha * 0.5);
      ctx.lineWidth = RINGS.strokeWidth[i] * 0.7;
      ctx.stroke();

      // Tick marks along ring (like a gauge)
      const tickCount = 12 + i * 4;
      for (let t = 0; t < tickCount; t++) {
        const tickAngle = rot + (t / tickCount) * Math.PI * 2;
        const innerR = baseR - 4 - i * 2;
        const outerR = baseR + 4 + i * 2;
        ctx.beginPath();
        ctx.moveTo(this.cx + Math.cos(tickAngle) * innerR, this.cy + Math.sin(tickAngle) * innerR);
        ctx.lineTo(this.cx + Math.cos(tickAngle) * outerR, this.cy + Math.sin(tickAngle) * outerR);
        ctx.strokeStyle = rgbaStr(color, pulseAlpha * 0.15);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  // ── Layer 6: Energy beams ──────────────────────────────────

  private renderEnergyBeams(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
    const minDim = Math.min(w, h);
    const outerR = minDim * RINGS.baseRadiusFraction[2] * 1.1;

    for (let i = 0; i < BEAMS.count; i++) {
      const angle = this.beamBaseAngle + (i * Math.PI * 2) / BEAMS.count;
      const endX = this.cx + Math.cos(angle) * outerR;
      const endY = this.cy + Math.sin(angle) * outerR;

      const grad = ctx.createLinearGradient(this.cx, this.cy, endX, endY);
      grad.addColorStop(0, rgbaStr(color, 0.02));
      grad.addColorStop(0.3, rgbaStr(color, BEAMS.alpha));
      grad.addColorStop(0.7, rgbaStr(COLORS.accent1, BEAMS.alpha * 0.6));
      grad.addColorStop(1, rgbaStr(color, 0));

      ctx.beginPath();
      ctx.moveTo(this.cx, this.cy);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = BEAMS.width;
      ctx.stroke();

      // Beam tip glow
      ctx.beginPath();
      ctx.arc(endX, endY, 4, 0, Math.PI * 2);
      ctx.fillStyle = rgbaStr(COLORS.accent1, 0.3 + Math.sin(this.frame * 0.05 + i) * 0.15);
      ctx.fill();
    }
  }

  // ── Particle renderers ─────────────────────────────────────

  private renderParticleType(ctx: CanvasRenderingContext2D, type: Particle['type'], color: string) {
    for (const p of this.particles) {
      if (p.type !== type) continue;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = rgbaStr(color, p.alpha);
      ctx.fill();

      // Glow halo for orbit + flow
      if ((type === 'orbit' || type === 'flow') && p.alpha > 0.25) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
        ctx.fillStyle = rgbaStr(color, p.alpha * 0.15);
        ctx.fill();
      }
    }
  }

  private renderBurstParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      if (p.type !== 'burst') continue;
      const c = p.color || COLORS.gold;

      // Bright dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = rgbaStr(c, p.alpha);
      ctx.fill();

      // Trail
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
      ctx.fillStyle = rgbaStr(c, p.alpha * 0.2);
      ctx.fill();
    }
  }

  // ── Layer 8: Core reactor ──────────────────────────────────

  private renderCore(ctx: CanvasRenderingContext2D, color: string) {
    if (!this.data) return;

    const minDim = Math.min(window.innerWidth, window.innerHeight);
    const treasuryHealth = Math.min(this.data.treasuryBalance / 1_000_000, 1);
    const baseSize = minDim * CORE.baseSizeFraction;
    const coreSize = baseSize * (0.5 + treasuryHealth * 0.8);

    // Heartbeat
    const heartbeat = Math.sin(this.pulsePhase) * 0.5 + 0.5;
    const r = coreSize * (1 + heartbeat * CORE.heartbeatDepth);

    // Multi-layer glow (outer → inner)
    for (let i = CORE.glowLayers; i >= 1; i--) {
      const glowR = r * (1 + i * 1.2);
      const glowAlpha = (0.10 + treasuryHealth * 0.12) * (1 - i / (CORE.glowLayers + 1));
      const grad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, glowR);
      grad.addColorStop(0, rgbaStr(color, glowAlpha * 1.5));
      grad.addColorStop(0.4, rgbaStr(color, glowAlpha));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Core body
    const coreGrad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, r);
    coreGrad.addColorStop(0, rgbaStr(COLORS.white, 0.9 + heartbeat * 0.1));
    coreGrad.addColorStop(0.2, rgbaStr(COLORS.accent1, 0.7 + heartbeat * 0.2));
    coreGrad.addColorStop(0.5, rgbaStr(color, 0.4 + heartbeat * 0.15));
    coreGrad.addColorStop(0.8, rgbaStr(color, 0.12));
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, r, 0, Math.PI * 2);
    ctx.fill();

    // White-hot center
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = rgbaStr(COLORS.white, 0.95);
    ctx.fill();

    // Inner ring accent
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, r * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = rgbaStr(COLORS.accent1, 0.15 + heartbeat * 0.1);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ── Layer 9: Shockwaves ────────────────────────────────────

  private renderShockwaves(ctx: CanvasRenderingContext2D, color: string) {
    for (const sw of this.shockwaves) {
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = rgbaStr(color, sw.alpha);
      ctx.lineWidth = sw.lineWidth;
      ctx.stroke();

      // Glow ring
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = rgbaStr(COLORS.accent1, sw.alpha * 0.3);
      ctx.lineWidth = sw.lineWidth + 4;
      ctx.stroke();
    }
  }

  // ── Layer 11: Foreground shimmer ───────────────────────────

  private renderShimmer(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (this.shimmerProgress < 0) return;

    const t = this.shimmerProgress;
    const bandWidth = w * 0.15;
    const x = -bandWidth + t * (w + bandWidth * 2);

    const grad = ctx.createLinearGradient(x - bandWidth, 0, x + bandWidth, 0);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.4, rgbaStr(COLORS.accent1, TIMING.sweepAlpha));
    grad.addColorStop(0.5, rgbaStr(COLORS.white, TIMING.sweepAlpha * 1.5));
    grad.addColorStop(0.6, rgbaStr(COLORS.accent1, TIMING.sweepAlpha));
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // ── Loading state ──────────────────────────────────────────

  private renderLoadingState(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const pulse = Math.sin(this.frame * 0.04) * 0.3 + 0.7;

    // Pulsing loading ring
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 40, 0, Math.PI * 2);
    ctx.strokeStyle = rgbaStr(COLORS.teal, pulse * 0.2);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rotating arc
    const startAngle = this.frame * 0.03;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 40, startAngle, startAngle + Math.PI * 0.8);
    ctx.strokeStyle = rgbaStr(COLORS.accent1, pulse * 0.6);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = rgbaStr(COLORS.accent1, pulse);
    ctx.fill();
  }
}
