import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { fetchHistoricalData, type HistoricalDataPoint } from '../api/dcrdata';

Chart.register(...registerables);

export default function LockedSupplyChart() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<Chart | null>(null);
    const [data, setData] = useState<HistoricalDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetchHistoricalData()
            .then((result) => {
                if (!cancelled) {
                    setData(result);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError(true);
                    setLoading(false);
                }
            });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!canvasRef.current || data.length === 0) return;

        // Destroy previous chart
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const labels = data.map((d) => d.date);
        const lockedData = data.map((d) => d.locked);
        const circulationData = data.map((d) => d.circulation);
        const liquidData = data.map((d) => d.liquid);
        const lockedPctData = data.map((d) => d.lockedPct);

        // Carbon/terminal color palette
        const teal = '#009d9a';
        const tealFaded = 'rgba(0, 157, 154, 0.12)';
        const white60 = 'rgba(244, 244, 244, 0.60)';
        const white25 = 'rgba(244, 244, 244, 0.25)';
        const white08 = 'rgba(244, 244, 244, 0.08)';
        const red = '#fa4d56';
        const redFaded = 'rgba(250, 77, 86, 0.08)';

        chartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Locked Supply',
                        data: lockedData,
                        borderColor: teal,
                        backgroundColor: tealFaded,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.2,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: teal,
                        order: 1,
                    },
                    {
                        label: 'Circulating Supply',
                        data: circulationData,
                        borderColor: white25,
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        fill: false,
                        tension: 0.2,
                        pointRadius: 0,
                        pointHoverRadius: 3,
                        pointHoverBackgroundColor: white60,
                        borderDash: [4, 4],
                        order: 2,
                    },
                    {
                        label: 'Liquid Supply',
                        data: liquidData,
                        borderColor: red,
                        backgroundColor: redFaded,
                        borderWidth: 1.5,
                        fill: true,
                        tension: 0.2,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        pointHoverBackgroundColor: red,
                        order: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.8,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: 'rgba(22, 22, 22, 0.95)',
                        titleColor: '#f4f4f4',
                        bodyColor: 'rgba(244, 244, 244, 0.80)',
                        borderColor: 'rgba(244, 244, 244, 0.15)',
                        borderWidth: 1,
                        padding: 14,
                        titleFont: {
                            family: "'IBM Plex Mono', monospace",
                            size: 11,
                            weight: 'bold',
                        },
                        bodyFont: {
                            family: "'IBM Plex Mono', monospace",
                            size: 11,
                        },
                        displayColors: true,
                        usePointStyle: true,
                        boxPadding: 4,
                        itemSort: (a, b) => {
                            const order: Record<string, number> = {
                                'Circulating Supply': 0,
                                'Locked Supply': 1,
                                'Liquid Supply': 2,
                            };
                            return (order[a.dataset.label ?? ''] ?? 0) - (order[b.dataset.label ?? ''] ?? 0);
                        },
                        callbacks: {
                            title: (items) => {
                                if (!items.length) return '';
                                const idx = items[0].dataIndex;
                                const d = data[idx];
                                return d.date.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                });
                            },
                            label: (context) => {
                                const value = context.raw as number;
                                const idx = context.dataIndex;
                                const pct = lockedPctData[idx];
                                const formatted = value.toLocaleString('en-US', {
                                    maximumFractionDigits: 0,
                                });

                                if (context.dataset.label === 'Locked Supply') {
                                    return ` Locked: ${formatted} DCR (${pct.toFixed(1)}%)`;
                                }
                                if (context.dataset.label === 'Liquid Supply') {
                                    const liqPct = data[idx].circulation > 0
                                        ? ((value / data[idx].circulation) * 100).toFixed(1)
                                        : '0';
                                    return ` Liquid: ${formatted} DCR (${liqPct}%)`;
                                }
                                return ` Circulating: ${formatted} DCR`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'year',
                            displayFormats: {
                                year: 'yyyy',
                            },
                        },
                        grid: {
                            color: white08,
                        },
                        ticks: {
                            color: 'rgba(244, 244, 244, 0.40)',
                            font: {
                                family: "'IBM Plex Mono', monospace",
                                size: 10,
                            },
                        },
                        border: {
                            color: 'rgba(244, 244, 244, 0.15)',
                        },
                    },
                    y: {
                        grid: {
                            color: white08,
                        },
                        ticks: {
                            color: 'rgba(244, 244, 244, 0.40)',
                            font: {
                                family: "'IBM Plex Mono', monospace",
                                size: 10,
                            },
                            callback: (value) => {
                                const num = Number(value);
                                return (num / 1_000_000).toFixed(1) + 'M';
                            },
                        },
                        border: {
                            color: 'rgba(244, 244, 244, 0.15)',
                        },
                    },
                },
            },
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }
        };
    }, [data]);

    if (error) {
        return null; // Silently fail — chart is supplementary
    }

    return (
        <section className="chart-section fade-in delay-5">
            <div className="section-label">The Squeeze Over Time</div>
            <div className="chart-wrap">
                {loading ? (
                    <div className="chart-loading">
                        <div className="chart-loading-bar" />
                        <span>Loading historical data...</span>
                    </div>
                ) : (
                    <>
                        <canvas ref={canvasRef} />
                        <div className="chart-legend">
                            <div className="chart-legend-item">
                                <div className="chart-legend-sw chart-sw-locked" />
                                <span>Locked (Staked + Treasury)</span>
                            </div>
                            <div className="chart-legend-item">
                                <div className="chart-legend-sw chart-sw-circ" />
                                <span>Circulating</span>
                            </div>
                            <div className="chart-legend-item">
                                <div className="chart-legend-sw chart-sw-liquid" />
                                <span>Liquid — Available</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
            <div className="compare-note">
                Locked supply has been trending upward for years. Every ticket purchased further compresses what's available on the market.
            </div>
        </section>
    );
}
