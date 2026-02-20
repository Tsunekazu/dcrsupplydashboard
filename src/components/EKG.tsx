import { useEffect, useRef } from 'react';

interface EKGProps {
    color?: string;
    trigger?: any; // Change in this prop triggers a spike
    height?: number;
    className?: string;
}

export function EKG({ color = '#2ed6a1', trigger, height = 80, className = '' }: EKGProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const spikeProgressRef = useRef<number>(-1); // -1 = no spike, 0-1 = spiking

    useEffect(() => {
        if (trigger) {
            spikeProgressRef.current = 0;
        }
    }, [trigger]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId = 0;
        const points: number[] = [];
        const maxPoints = Math.ceil(window.innerWidth / 2); // 2px per point

        // Initialize points flat
        for (let i = 0; i < maxPoints; i++) {
            points.push(0);
        }

        const render = () => {
            // Resize handling
            if (canvas.width !== window.innerWidth) {
                canvas.width = window.innerWidth;
                canvas.height = height;
            }

            const w = canvas.width;
            const h = canvas.height;
            const mid = h / 2;

            ctx.clearRect(0, 0, w, h);
            ctx.lineWidth = 2;
            ctx.strokeStyle = color;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Generate next point
            let nextY = 0;

            // Spike logic
            if (spikeProgressRef.current >= 0) {
                const p = spikeProgressRef.current;
                // PQRST complex simulation
                if (p < 0.1) nextY = -5; // P wave
                else if (p < 0.15) nextY = 5;
                else if (p < 0.20) nextY = -20; // Q wave
                else if (p < 0.30) nextY = 40; // R wave (spike)
                else if (p < 0.35) nextY = -15; // S wave
                else if (p < 0.5) nextY = 0; // ST segment
                else if (p < 0.7) nextY = 8; // T wave
                else nextY = 0;

                spikeProgressRef.current += 0.02; // Speed of spike
                if (spikeProgressRef.current > 1) spikeProgressRef.current = -1;
                // Baseline noise (mempool chatter simulation)
                const baseNoise = (Math.random() - 0.5) * 3;

                // "Network Activity" modulation (a slow sine wave + random spikes)
                const activityLevel = Math.sin(Date.now() / 2000) * 0.5 + 0.5; // 0 to 1
                const microPulse = Math.random() > 0.98 ? (Math.random() - 0.5) * 15 : 0; // Occasional tx spike

                nextY = baseNoise + (baseNoise * activityLevel) + microPulse;
            }

            points.push(nextY);
            if (points.length > w / 3) points.shift(); // Scroll

            // Draw
            ctx.beginPath();
            for (let i = 0; i < points.length; i++) {
                const x = w - (points.length - i) * 3;
                const y = mid - points[i];
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Glow effect (stronger on spikes)
            ctx.shadowBlur = Math.abs(nextY) > 10 ? 15 : 5;
            ctx.shadowColor = color;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Leading dot
            const lastX = w;
            const lastY = mid - points[points.length - 1];
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(lastX, lastY, Math.abs(nextY) > 10 ? 3 : 2, 0, Math.PI * 2);
            ctx.fill();

            animId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animId);
    }, [color, height]);

    return <canvas ref={canvasRef} className={className} style={{ width: '100%', height }} />;
}
