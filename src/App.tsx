import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDecredData } from './hooks/useDecredData';
import { Organism } from './organism/Organism';
import { formatDCR, formatHashrate, formatUSD, timeSince } from './api/dcrdata';

function App() {
  const { data, newBlock } = useDecredData();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const organismRef = useRef<Organism | null>(null);
  const [showHUD, setShowHUD] = useState(false);
  const [blockToast, setBlockToast] = useState(false);
  const [blockAge, setBlockAge] = useState('');

  // Initialize organism
  useEffect(() => {
    if (!canvasRef.current) return;
    const org = new Organism(canvasRef.current);
    organismRef.current = org;
    org.start();

    const onResize = () => org.resize();
    const onMouse = (e: MouseEvent) => org.setMouse(e.clientX, e.clientY);
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouse);

    return () => {
      org.stop();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  // Feed data to organism
  useEffect(() => {
    if (data && organismRef.current) {
      organismRef.current.setData(data);
    }
  }, [data]);

  // Keyboard shortcut: I for detail HUD
  const toggleHUD = useCallback((e: KeyboardEvent) => {
    if (e.key === 'i' || e.key === 'I') {
      setShowHUD(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', toggleHUD);
    return () => window.removeEventListener('keydown', toggleHUD);
  }, [toggleHUD]);

  // New block toast
  useEffect(() => {
    if (newBlock) {
      setBlockToast(true);
      const timer = setTimeout(() => setBlockToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [newBlock]);

  // Live block age counter — ticks every second
  useEffect(() => {
    if (!data?.blockTime) return;
    const tick = () => setBlockAge(timeSince(data.blockTime));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [data?.blockTime]);

  // Derived narrative
  const n = useMemo(() => {
    if (!data) return null;

    const monthsRunway = data.treasuryMonthlyBurn > 0
      ? Math.floor(data.treasuryBalance / data.treasuryMonthlyBurn)
      : 999;

    const scoreLabel =
      data.networkScore >= 90 ? 'SOVEREIGN' :
        data.networkScore >= 75 ? 'FORTIFIED' :
          data.networkScore >= 60 ? 'HARDENED' :
            data.networkScore >= 40 ? 'STACKING' :
              'SIGNAL';

    const scoreColor =
      data.networkScore >= 90 ? '#f0b040' :
        data.networkScore >= 75 ? '#3bf0c0' :
          data.networkScore >= 60 ? '#2ed6a1' :
            data.networkScore >= 40 ? '#06b6d4' :
              '#ef4444';

    const scoreFlavor =
      data.networkScore >= 90 ? 'Self-funded. Self-governed. Not asking permission.' :
        data.networkScore >= 75 ? 'The treasury builds. The stakeholders decide. No one else matters.' :
          data.networkScore >= 60 ? 'Quietly compounding. The infrastructure doesn\'t sleep.' :
            data.networkScore >= 40 ? 'Still here. Still building. Most projects can\'t say that.' :
              'Maximum opportunity. The protocol has survived worse.';

    // Ring health metrics (0-1 range for CSS)
    const treasuryHealth = Math.min(data.treasuryBalance / 1_000_000, 1);
    const stakeHealth = Math.min(data.stakeParticipation / 70, 1);
    const hashrateHealth = data.hashrate > 0 ? 0.8 : 0.2;

    return {
      price: data.price,
      priceChange: data.priceChange24h,
      score: data.networkScore,
      scoreLabel,
      scoreColor,
      scoreFlavor,
      stakePercent: data.stakeParticipation.toFixed(1),
      monthsRunway,
      treasuryDCR: formatDCR(data.treasuryBalance, 0),
      treasuryUSD: formatUSD(data.treasuryBalance * data.price),
      blockHeight: data.blockHeight,
      blockTime: data.blockTime,
      isLive: data.isLive,
      ticketPrice: data.ticketPrice.toFixed(2),
      poolSize: data.ticketPoolSize.toLocaleString(),
      poolSizeRaw: data.ticketPoolSize,
      hashrate: formatHashrate(data.hashrate),
      marketCap: formatUSD(data.marketCap),
      volume: formatUSD(data.volume24h),
      mixedPercent: data.mixedPercent.toFixed(1),
      treasuryHealth,
      stakeHealth,
      hashrateHealth,
    };
  }, [data]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Living background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: '#020610' }}
      />

      {/* CSS visual structure layer — data-responsive */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={n ? {
          '--ring-treasury': n.treasuryHealth,
          '--ring-stake': n.stakeHealth,
          '--ring-hashrate': n.hashrateHealth,
        } as React.CSSProperties : undefined}
      >
        {/* Nebula atmospheric glow */}
        <div className="nebula-glow" />
        <div className="nebula-accent" />

        {/* Orbit rings — inner=treasury, middle=stake, outer=hashrate */}
        <div className="orbit-ring orbit-ring--1" />
        <div className="orbit-ring orbit-ring--2" />
        <div className="orbit-ring orbit-ring--3" />

        {/* Core reactor glow */}
        <div className="core-glow" />
      </div>

      {/* Cinematic overlay */}
      <AnimatePresence>
        {n && (
          <div className="absolute inset-0 pointer-events-none select-none">

            {/* ── TOP: Wordmark + Live ─────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="absolute top-5 left-0 right-0 flex items-center justify-center gap-3"
            >
              <span className="animate-glitch text-[11px] tracking-[0.4em] uppercase font-bold text-white/30">
                Decred
              </span>
              <span className="text-[11px] tracking-[0.4em] uppercase font-bold glow-text" style={{ color: 'rgba(59, 240, 192, 0.7)' }}>
                Pulse
              </span>
              {n.isLive && (
                <div className="w-[6px] h-[6px] rounded-full bg-green-400 animate-live-pulse" />
              )}
            </motion.div>

            {/* ── CENTER: Score + Price + Stats ────────── */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Label above score */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-[10px] tracking-[0.3em] uppercase font-bold text-white/30 mb-2"
              >
                Power Level
              </motion.div>

              {/* Score number */}
              <div className="animate-score-reveal mb-1">
                <div
                  className="score-number text-[120px] leading-none text-center"
                  data-score={n.score}
                  style={{
                    WebkitTextStroke: `2px ${n.scoreColor}50`,
                  }}
                >
                  {n.score}
                </div>
              </div>

              {/* Score status badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <span
                  className="badge glow-text"
                  style={{
                    borderColor: `${n.scoreColor}40`,
                    background: `${n.scoreColor}12`,
                    color: n.scoreColor,
                  }}
                >
                  <span className="w-[5px] h-[5px] rounded-full" style={{ background: n.scoreColor }} />
                  {n.scoreLabel}
                </span>
              </motion.div>

              {/* Flavor text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.8 }}
                className="text-[11px] text-white/25 mt-2 italic tracking-wide"
              >
                {n.scoreFlavor}
              </motion.div>

              {/* Price */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="mt-5 flex items-baseline gap-3"
              >
                <span className="text-[32px] font-bold text-white/85 glow-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  ${n.price.toFixed(2)}
                </span>
                <span
                  className="text-sm font-bold px-2 py-0.5 rounded-full"
                  style={{
                    color: n.priceChange >= 0 ? '#22c55e' : '#ef4444',
                    background: n.priceChange >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  }}
                >
                  {n.priceChange >= 0 ? '▲' : '▼'} {Math.abs(n.priceChange).toFixed(1)}%
                </span>
              </motion.div>

              {/* Key stats row — centered below price */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.8 }}
                className="mt-8 flex items-start gap-16"
              >
                {/* Conviction metric */}
                <div className="text-center">
                  <div className="text-[24px] font-black text-white/85 glow-text-strong" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {n.stakePercent}%
                  </div>
                  <div className="text-[9px] tracking-[0.2em] uppercase font-bold text-white/35 mt-1">
                    Conviction Locked
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-10 bg-white/10 mt-1" />

                {/* War chest */}
                <div className="text-center">
                  <div className="text-[24px] font-black text-white/85 glow-text-gold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {n.monthsRunway}mo
                  </div>
                  <div className="text-[9px] tracking-[0.2em] uppercase font-bold text-white/35 mt-1">
                    War Chest
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-10 bg-white/10 mt-1" />

                {/* Privacy */}
                <div className="text-center">
                  <div className="text-[24px] font-black text-white/85 glow-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {n.mixedPercent}%
                  </div>
                  <div className="text-[9px] tracking-[0.2em] uppercase font-bold text-white/35 mt-1">
                    Privacy Mix
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── BOTTOM: Heartbeat + Crew ─────────────── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 1 }}
              className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-2"
            >
              {/* Stakeholder headcount */}
              <div className="text-[11px] tracking-[0.15em] uppercase font-bold text-white/25">
                {Math.round(n.poolSizeRaw / 1000)}K stakeholders on watch
              </div>

              {/* Live block heartbeat */}
              <div className="flex items-center gap-2">
                <div className="w-[5px] h-[5px] rounded-full bg-emerald-500 animate-live-pulse" />
                <span className="text-[10px] font-mono text-white/30 tracking-wider" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  Block #{n.blockHeight.toLocaleString()} · {blockAge}
                </span>
              </div>

              {/* Tagline */}
              <div className="text-[9px] text-white/15 tracking-[0.2em] uppercase mt-1">
                No VCs. No pre-mine. Just code.
              </div>
            </motion.div>

            {/* ── New block celebration ───────────────── */}
            <AnimatePresence>
              {blockToast && (
                <>
                  {/* Flash */}
                  <motion.div
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2 }}
                    className="absolute inset-0"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(59,240,192,0.12) 0%, transparent 50%)',
                    }}
                  />
                  {/* Toast */}
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="absolute top-16 left-1/2 -translate-x-1/2"
                  >
                    <span className="badge badge-gold glow-text-gold" style={{ color: '#f0b040', fontSize: '11px' }}>
                      ⚡ NEW BLOCK
                    </span>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* ── Detail HUD (press I) ───────────────── */}
            <AnimatePresence>
              {showHUD && (
                <motion.div
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 60 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute top-20 right-6 w-[260px] glass p-5 pointer-events-auto"
                >
                  <div className="text-[9px] tracking-[0.3em] uppercase font-bold text-white/30 mb-3">
                    Network Details
                  </div>

                  {[
                    { label: 'Market Cap', value: n.marketCap },
                    { label: 'Volume 24h', value: n.volume },
                    { label: 'Ticket Price', value: `${n.ticketPrice} DCR` },
                    { label: 'Pool Size', value: `${n.poolSize} tickets` },
                    { label: 'Hashrate', value: n.hashrate },
                    { label: 'Mixed', value: `${n.mixedPercent}%` },
                  ].map(row => (
                    <div key={row.label} className="detail-row">
                      <span className="detail-label">{row.label}</span>
                      <span className="detail-value">{row.value}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
