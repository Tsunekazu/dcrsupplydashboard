import { useEffect, useState } from 'react';
import { useDecredData } from './hooks/useDecredData';
import { formatUSD } from './api/dcrdata';
import './index.css';

function App() {
  const { data, loading, error, newBlock } = useDecredData();
  const [displayPct, setDisplayPct] = useState(0);
  const [animTrigger, setAnimTrigger] = useState(false);

  // Derived metrics
  const totalMined = data?.coinSupply || 0;
  const totalLocked = (data?.ticketPoolValue || 0) + (data?.treasuryBalance || 0);
  const lockedPctOfMined = totalMined > 0 ? (totalLocked / totalMined) * 100 : 0;
  const lockedRatio = (data && data.liquidSupply && data.liquidSupply > 0) ? (totalLocked / data.liquidSupply).toFixed(1) : '0.0';

  // Emission reduction calculation (every 6144 blocks, approx 21.33 days)
  const nextReductionBlock = Math.ceil((data?.blockHeight || 1) / 6144) * 6144;
  const blocksToReduction = nextReductionBlock - (data?.blockHeight || 0);
  const minutesToReduction = blocksToReduction * 5;
  const daysToReduction = Math.floor(minutesToReduction / (24 * 60));
  const hoursToReduction = Math.floor((minutesToReduction % (24 * 60)) / 60);

  useEffect(() => {
    if (data?.isLive) {
      // Trigger CSS transition animations
      const t = setTimeout(() => {
        setAnimTrigger(true);

        // Counter animation for the massive hero number
        const duration = 1800;
        const steps = 60;
        const stepTime = duration / steps;
        let currentStep = 0;
        const targetPct = lockedPctOfMined;

        const counter = setInterval(() => {
          currentStep++;
          const progress = currentStep / steps;
          const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic matches HTML
          setDisplayPct(easeProgress * targetPct);

          if (currentStep >= steps) clearInterval(counter);
        }, stepTime);

      }, 400);
      return () => clearTimeout(t);
    }
  }, [data?.isLive, lockedPctOfMined]);

  if (error) {
    return <div className="page" style={{ color: 'var(--red)' }}>Error: {error}</div>;
  }

  if (loading || !data?.isLive) {
    return <div className="page" style={{ opacity: 0.5 }}>Connecting to Decred Network...</div>;
  }

  // Formatting for display
  const liquidDisplay = (data.liquidSupply / 1_000_000).toFixed(2);
  const totalMinedDisplay = (totalMined / 1_000_000).toFixed(1);

  // Squeeze Bar percentages (relative to total 21M supply)
  const stakedPct = (data.ticketPoolValue / data.totalSupply) * 100;
  const treasuryPct = (data.treasuryBalance / data.totalSupply) * 100;
  const liquidPct = (data.liquidSupply / data.totalSupply) * 100;
  // Unmined fills the rest

  return (
    <div className="page">
      {/* ▸ HEADER */}
      <header className="header fade-in">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/decred-logo-white-transparent.svg" alt="Decred" style={{ width: '22px', height: '22px' }} />
          <div>DECRED <span className="logo-sep">/</span> <span className="logo-dim">Supply Report</span></div>
        </div>
        <div className="header-meta">
          <span className="live-dot"></span>Live &middot; dcrdata.decred.org<br />
          Block #{data.blockHeight.toLocaleString()} &middot; {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </header>

      {/* ▸ HERO */}
      <section className="hero fade-in delay-1">
        <div className={`hero-number ${newBlock ? 'glitch-anim' : ''}`}>
          <span>{displayPct.toFixed(1)}</span><span className="hero-pct">%</span>
        </div>
        <div className="hero-word">Locked</div>
        <div className="hero-sub">
          Of {totalMinedDisplay}M total mined supply, only {liquidDisplay}M DCR is liquid.
        </div>
      </section>

      {/* ▸ THE RATIO */}
      <div className="ratio-block fade-in delay-2">
        <p className="ratio-text">
          For every 1 DCR on the open market,<br />
          <strong className="ratio-accent">{lockedRatio} DCR are locked by holders</strong><br />
          and strictly unavailable for sale.
        </p>
      </div>

      {/* ▸ TICKER */}
      <div className="ticker fade-in delay-3">
        <div className="ticker-item">DCR <span className="v">{formatUSD(data.price)}</span></div>
        <div className="ticker-item">MCap <span className="v">${(data.marketCap / 1000000).toFixed(0)}M</span></div>
        <div className="ticker-item">Vol 24h <span className="v">${(data.volume24h / 1000000).toFixed(2)}M</span></div>
        <div className="ticker-item">Liquid MCap <span className="v">${((data.liquidSupply * data.price) / 1000000).toFixed(0)}M</span></div>
        <div className="ticker-item">Next Emission Drop <span className="v">{daysToReduction}d {hoursToReduction}h</span></div>
      </div>

      {/* ▸ SQUEEZE BAR */}
      <section className="squeeze-section fade-in delay-4">
        <div className="section-label">21,000,000 DCR — Total Supply Allocation</div>
        <div style={{ position: 'relative' }}>
          {/* Liquid label above the bar */}
          <div
            className="sq-liquid-label"
            style={{
              left: `${stakedPct + treasuryPct + (liquidPct / 2)}%`,
              display: animTrigger ? 'block' : 'none',
              animation: animTrigger ? 'fadeUp 0.4s ease-out forwards' : 'none',
              animationDelay: '0.4s',
              opacity: 0
            }}
          >
            ▼ {liquidDisplay}M LIQUID
          </div>
          {/* Treasury label pointing down into its section */}
          <div
            className="sq-treasury-label"
            style={{
              left: `${stakedPct + (treasuryPct / 2)}%`,
              display: animTrigger ? 'block' : 'none',
              animation: animTrigger ? 'fadeUp 0.4s ease-out forwards' : 'none',
              animationDelay: '0.4s',
              opacity: 0
            }}
          >
            {(data.treasuryBalance / 1_000).toFixed(0)}K
            <div className="sq-treasury-marker"></div>
          </div>
          <div className="squeeze-bar">
            <div className="sq-segment sq-staked" style={{ width: animTrigger ? `${stakedPct}%` : '0%' }}>
              <span className="sq-label"><b>{(data.ticketPoolValue / 1_000_000).toFixed(1)}M</b> Staked</span>
            </div>
            <div className="sq-segment sq-treasury" style={{ width: animTrigger ? `${treasuryPct}%` : '0%' }}>
            </div>
            <div className="sq-segment sq-liquid" style={{ width: animTrigger ? `${liquidPct}%` : '0%' }}>
            </div>
            <div className="sq-segment sq-unmined">
              <span className="sq-label sq-label-right"><b>{(data.unminedSupply / 1_000_000).toFixed(1)}M</b> Unmined</span>
            </div>
          </div>
        </div>
        <div className="legend">
          <div className="legend-item"><div className="legend-sw stk"></div>Staked in Tickets ({(stakedPct / (totalMined / data.totalSupply)).toFixed(1)}%)</div>
          <div className="legend-item"><div className="legend-sw trs"></div>Treasury ({(treasuryPct / (totalMined / data.totalSupply)).toFixed(1)}%)</div>
          <div className="legend-item"><div className="legend-sw liq"></div>Liquid — Available ({(liquidPct / (totalMined / data.totalSupply)).toFixed(1)}%)</div>
          <div className="legend-item"><div className="legend-sw unm"></div>Not Yet Mined</div>
        </div>
      </section>

      {/* ▸ WHY THIS MATTERS */}
      <section className="why-section fade-in delay-5">
        <div className="section-label">Why This Matters</div>
        <div className="why-grid">
          <div className="why-cell">
            <div className="why-num">01</div>
            <div className="why-title">Protocol-Enforced Lockup</div>
            <div className="why-desc">
              Staked DCR isn't a promise — it's <strong>code</strong>.
              Tickets lock coins for up to 142 days with no early exit. This isn't voluntary holding; it's a binding protocol constraint.
            </div>
          </div>
          <div className="why-cell">
            <div className="why-num">02</div>
            <div className="why-title">No Unlock Schedules</div>
            <div className="why-desc">
              Zero VC allocations. Zero team tokens vesting.
              No ICO. Every DCR in existence was either <strong>mined or earned</strong> through stakeholder-approved work.
            </div>
          </div>
          <div className="why-cell">
            <div className="why-num">03</div>
            <div className="why-title">Buying Pressure ≠ Selling Supply</div>
            <div className="why-desc">
              When {lockedPctOfMined.toFixed(0)}% of supply can't be sold, even modest demand has outsized price impact.
              The <strong>liquid market cap is ${((data.liquidSupply * data.price) / 1000000).toFixed(0)}M</strong> — not ${(data.marketCap / 1000000).toFixed(0)}M.
            </div>
          </div>
          <div className="why-cell">
            <div className="why-num">04</div>
            <div className="why-title">The Squeeze Tightens</div>
            <div className="why-desc">
              The ticket pool actively absorbs newly mined coins.
              Stake participation has been <strong>trending upward for years</strong>.
              Every ticket purchased compresses liquid supply further.
            </div>
          </div>
        </div>
      </section>

      {/* ▸ COMPARISON */}
      <section className="compare-section fade-in delay-6">
        <div className="section-label">Protocol-Locked Supply — Cross-Chain</div>
        <div className="table-wrapper">
          <table className="compare-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Asset</th>
                <th style={{ width: '90px' }}>Locked</th>
                <th>Visualization</th>
                <th style={{ width: '200px' }}>Lock Mechanism</th>
              </tr>
            </thead>
            <tbody>
              <tr className="highlight-row">
                <td className="asset-name">Decred</td>
                <td style={{ color: 'var(--white)', fontWeight: 700 }}>{lockedPctOfMined.toFixed(1)}%</td>
                <td>
                  <div className="compare-bar-wrap">
                    <div className="compare-bar-fill fill-dcr" style={{ width: animTrigger ? `${lockedPctOfMined}%` : '0%' }}></div>
                  </div>
                </td>
                <td>PoS tickets + treasury. 142-day lock. No early exit.</td>
              </tr>
              <tr>
                <td className="asset-name">Ethereum</td>
                <td>28.3%</td>
                <td>
                  <div className="compare-bar-wrap">
                    <div className="compare-bar-fill fill-other" style={{ width: animTrigger ? '28.3%' : '0%' }}></div>
                  </div>
                </td>
                <td>Beacon chain staking. Withdrawable post-Shanghai.</td>
              </tr>
              <tr>
                <td className="asset-name">Solana</td>
                <td>65.1%</td>
                <td>
                  <div className="compare-bar-wrap">
                    <div className="compare-bar-fill fill-other" style={{ width: animTrigger ? '65.1%' : '0%' }}></div>
                  </div>
                </td>
                <td>Delegated PoS. ~2-day unlock period.</td>
              </tr>
              <tr>
                <td className="asset-name">Bitcoin</td>
                <td>0%</td>
                <td>
                  <div className="compare-bar-wrap">
                    <div className="compare-bar-fill fill-other" style={{ width: '0%' }}></div>
                  </div>
                </td>
                <td>No protocol lock. All supply is technically liquid.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="compare-note">
          Decred's lock is the most rigid: no delegation, no liquid staking derivatives, no early withdrawal. Coins are fully inaccessible until the ticket votes or expires.
        </div>
      </section>

      {/* ▸ DILUTION DANGER */}
      <section className="compare-section fade-in delay-6">
        <div className="section-label">Dilution Danger — Fair Distribution vs. Corporate Extraction</div>
        <div className="table-wrapper">
          <table className="compare-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Asset</th>
                <th style={{ width: '90px' }}>Circulating</th>
                <th style={{ width: '120px' }}>Market Cap</th>
                <th style={{ width: '120px' }}>FDV</th>
                <th>Upcoming Unlocks</th>
              </tr>
            </thead>
            <tbody>
              <tr className="highlight-row">
                <td className="asset-name">Decred</td>
                <td style={{ color: 'var(--white)', fontWeight: 700 }}>{((data.coinSupply / data.totalSupply) * 100).toFixed(1)}%</td>
                <td>${(data.marketCap / 1000000).toFixed(0)}M</td>
                <td>${((data.totalSupply * data.price) / 1000000).toFixed(0)}M</td>
                <td>Organic block emission only. No VC unlocks.</td>
              </tr>
              <tr>
                <td className="asset-name">Sui (SUI)</td>
                <td>34.5%</td>
                <td>~$3.7B</td>
                <td>~$16.0B</td>
                <td>Major monthly unlocks of ~44M SUI</td>
              </tr>
              <tr>
                <td className="asset-name">Aptos (APT)</td>
                <td>35.0%</td>
                <td>~$4.5B</td>
                <td>~$13.0B</td>
                <td>Monthly unlocks of ~11.3M APT</td>
              </tr>
              <tr>
                <td className="asset-name">Celestia (TIA)</td>
                <td>15.0%</td>
                <td>~$500M</td>
                <td>~$3.3B</td>
                <td>Massive internal allocation unlocks</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ▸ NETWORK FUNDAMENTALS */}
      <section className="metrics-section fade-in delay-7">
        <div className="section-label">Network Fundamentals</div>
        <div className="metrics">
          <div className="metric">
            <div className="metric-label">Stake Participation</div>
            <div className="metric-val">{(data.ticketPoolValue / data.coinSupply * 100).toFixed(1)}<span className="metric-unit">%</span></div>
            <div className="metric-sub">{(data.ticketPoolValue / 1_000_000).toFixed(1)}M DCR locked</div>
          </div>
          <div className="metric">
            <div className="metric-label">Treasury Runway</div>
            <div className="metric-val">{Math.floor(data.treasuryBalance / (data.treasuryMonthlyBurn || 22500))}<span className="metric-unit"> mo</span></div>
            <div className="metric-sub">{(data.treasuryBalance / 1_000).toFixed(1)}K DCR &middot; <span className="hl">{formatUSD(data.treasuryBalance * data.price)}</span></div>
            <div className="metric-sub" style={{ marginTop: '4px', opacity: 0.7 }}>Spending capped at 4%/mo by DCP-0013</div>
          </div>
          <div className="metric">
            <div className="metric-label">Ticket Pool</div>
            <div className="metric-val">{data.ticketPoolSize.toLocaleString()}</div>
            <div className="metric-sub">Target: 40,960 &middot; <span className="pos">{((data.ticketPoolSize / 40960) * 100).toFixed(0)}%</span></div>
          </div>
          <div className="metric">
            <div className="metric-label">Privacy Mix</div>
            <div className="metric-val">{((data.mixedPercent) || 0).toFixed(1)}<span className="metric-unit">%</span></div>
            <div className="metric-sub">StakeShuffle active</div>
          </div>
        </div>
      </section>

      {/* ▸ REWARD FLOW */}
      <section className="sankey-section fade-in delay-8">
        <div className="section-label">Block Reward Distribution (Post-Block 794,368)</div>
        <div className="sankey-wrapper">
          <div className="sankey-container">
            <div className="sankey-col sankey-source">
              <div className="sankey-node s-node-source">
                <div className="sankey-node-val">1 BLK</div>
                <div className="sankey-node-label">100% Emission</div>
              </div>
            </div>
            <div className="sankey-middle">
              <svg className="sankey-svg" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path className="path-miners" d="M 0,0 C 50,0 50,0 100,0 L 100,15 C 50,15 50,1 0,1 Z" />
                <path className="path-treasury" d="M 0,1 C 50,1 50,17 100,17 L 100,42 C 50,42 50,11 0,11 Z" />
                <path className="path-stakers" d="M 0,11 C 50,11 50,44 100,44 L 100,100 C 50,100 50,100 0,100 Z" />
              </svg>
            </div>
            <div className="sankey-col sankey-target">
              <div className="sankey-node s-node-miners">
                <div className="sankey-node-val">1%</div>
                <div className="sankey-node-label">PoW Miners</div>
              </div>
              <div className="sankey-node s-node-treasury">
                <div className="sankey-node-val">10%</div>
                <div className="sankey-node-label">Treasury</div>
              </div>
              <div className="sankey-node s-node-stakers">
                <div className="sankey-node-val hl-stakers">89%</div>
                <div className="sankey-node-label">PoS Stakers</div>
              </div>
            </div>
          </div>
        </div>
        <div className="compare-note">
          100% of the new supply is directed by code. The vast majority of new issuance is paid directly to existing holders who physically lock their capital, neutralizing the structural sell pressure typical of pure PoW networks.
        </div>
      </section>

      {/* ▸ CLOSING */}
      <section className="closing fade-in delay-8">
        <p>
          <strong>{(data.ticketPoolValue / data.coinSupply * 100).toFixed(0)}% of all mined DCR is locked</strong> and cannot be sold without a 142-day
          unbonding period. The liquid supply is <span className="acc">{((data.liquidSupply / data.coinSupply) * 100).toFixed(1)}% of mined coins</span>
          — and shrinking with every ticket purchased.
        </p>
      </section>

      {/* ▸ FOOTER */}
      <footer className="footer fade-in delay-8">
        <div className="footer-left">
          Data: dcrdata.decred.org &middot; CoinGecko<br />
          Updated: Live
        </div>
        <div className="footer-right">Fair launch. No ICO. No VCs.</div>
      </footer>

    </div>
  );
}

export default App;
