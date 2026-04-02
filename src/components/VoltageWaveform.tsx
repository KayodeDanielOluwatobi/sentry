"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GridState = "online" | "offline" | "unstable";

export interface VoltageWaveformProps {
  gridState?: GridState;
  /** Height in px */
  height?: number;
  theme?: "light" | "dark";
  /** Number of full sine cycles to display */
  cycles?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VB_W = 400; // internal viewBox width (always fixed — scales with CSS width)
const H_DIVS = 6;  // horizontal grid divisions
const V_DIVS = 4;  // vertical grid divisions
const STEPS = 200; // path resolution

// ─── State profiles ───────────────────────────────────────────────────────────

function profile(state: GridState) {
  switch (state) {
    case "online":
      return { stroke: "#22c55e", amplitude: 0.75, noise: 0.02, speed: 0.4, opacity: 1 };
    case "unstable":
      return { stroke: "#fbbf24", amplitude: 0.8, noise: 0.13, speed: 0.2, opacity: 0.95 };
    case "offline":
      return { stroke: "#ef4444", amplitude: 0, noise: 0, speed: 0, opacity: 0.5 };
  }
}

// ─── Path builder ─────────────────────────────────────────────────────────────

function buildPath(
  W: number, H: number, sweep: number,
  amplitude: number, noise: number, cycles: number
): string {
  const cy = H / 2;
  const maxAmp = H * 0.38;
  const pts: string[] = [];
  const maxI = Math.floor(sweep * STEPS);

  for (let i = 0; i <= maxI; i++) {
    const x = (i / STEPS) * W;
    const jitter = noise > 0 ? (Math.random() - 0.5) * noise * maxAmp : 0;
    const y = cy - amplitude * maxAmp * Math.sin((i / STEPS) * Math.PI * 2 * cycles) + jitter;
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  return pts.join(" ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VoltageWaveform({
  gridState = "online",
  height = 130,
  theme = "light",
  cycles = 5,
}: VoltageWaveformProps) {
  const p = profile(gridState);

  const pathRef = useRef<SVGPathElement>(null);
  const phaseRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  // ↓ Refs so the animation loop always reads the LATEST values (fixes stale closure)
  const speedRef = useRef(p.speed);
  const amplitudeRef = useRef(p.amplitude);
  const noiseRef = useRef(p.noise);
  speedRef.current = p.speed;
  amplitudeRef.current = p.amplitude;
  noiseRef.current = p.noise;

  const isDark = theme === "dark";

  const containerRef = useRef<HTMLDivElement>(null);
  const [svgW, setSvgW] = useState(400);
  const svgWRef = useRef(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width || 400;
      setSvgW(w);
      svgWRef.current = w;
    });
    ro.observe(el);
    const w = el.getBoundingClientRect().width || 400;
    setSvgW(w);
    svgWRef.current = w;
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    phaseRef.current = 0;

    const tick = () => {
      if (speedRef.current === 0) {
        phaseRef.current = 1;
      } else {
        phaseRef.current += speedRef.current * 0.25;
        if (phaseRef.current > 1) phaseRef.current = 0;
      }
      const newPath = buildPath(svgWRef.current, height, phaseRef.current, amplitudeRef.current, noiseRef.current, cycles);
      if (pathRef.current) {
        pathRef.current.setAttribute("d", newPath);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridState, height, cycles]);

  // ── Theme-aware colors ──
  const gridColor = isDark ? "rgba(57,255,20,0.1)" : "rgba(0,0,0,0.03)";
  const centerColor = isDark ? "rgba(57,255,20,0.22)" : "rgba(0,0,0,0.08)";
  const tickColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.08)";
  const labelColor = isDark ? "rgba(57,255,20,0.45)" : "rgba(0,0,0,0.25)";
  const waveStroke = isDark ? p.stroke : (
    gridState === "online" ? "#22c55e" : gridState === "unstable" ? "#f59e0b" : "#b91c1c"
  );
  const waveShadow = isDark ? p.stroke : (
    gridState === "online" ? "rgba(34,197,94,0.3)" : gridState === "unstable" ? "rgba(217,119,6,0.3)" : "rgba(185,28,28,0.3)"
  );

  const screenBg = isDark
    ? "radial-gradient(ellipse at 50% 40%, #1c241c 0%, #151a15 55%, #101210 100%)"
    : "radial-gradient(ellipse at 50% 40%, #ffffff 0%, #fcfdfc 60%, #f5faf5 100%)";

  const containerShadow = isDark
    ? "inset 0 0 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(57,255,20,0.05), 0 0 0 1px rgba(255,255,255,0.05)"
    : "inset 0 2px 5px rgba(0,0,0,0.01), 0 0 0 1px rgba(0,0,0,0.03)";
  const hLines = Array.from({ length: V_DIVS + 1 }, (_, i) => (i / V_DIVS) * height);
  const vLines = Array.from({ length: H_DIVS + 1 }, (_, i) => (i / H_DIVS) * svgW);

  return (
    <div ref={containerRef} style={{
      position: "relative", width: "100%",
      borderRadius: "8px", overflow: "hidden",
      background: screenBg,
      boxShadow: containerShadow,
    }}>
      <svg
        width={svgW}
        height={height}
        style={{ display: "block" }}
      >
        <defs>
          {/* No manual SVG blur needed, we use CSS multi-layer drop-shadow for superior bloom */}
        </defs>

        {/* ── Grid lines (horizontal) ── */}
        {hLines.map((y, i) => (
          <line
            key={`h${i}`}
            x1={0} y1={y} x2={svgW} y2={y}
            stroke={i === V_DIVS / 2 ? centerColor : gridColor}
            strokeWidth={i === V_DIVS / 2 ? 1.5 : 0.8}
            strokeDasharray={i === V_DIVS / 2 ? undefined : undefined}
          />
        ))}

        {/* ── Grid lines (vertical) ── */}
        {vLines.map((x, i) => (
          <line
            key={`v${i}`}
            x1={x} y1={0} x2={x} y2={height}
            stroke={i === H_DIVS / 2 ? centerColor : gridColor}
            strokeWidth={i === H_DIVS / 2 ? 1.5 : 0.8}
          />
        ))}

        {/* ── Minor tick marks on center axes ── */}
        {Array.from({ length: H_DIVS * 5 + 1 }, (_, i) => {
          const x = (i / (H_DIVS * 5)) * svgW;
          const cy = height / 2;
          return <line key={`tx${i}`} x1={x} y1={cy - 3} x2={x} y2={cy + 3} stroke={tickColor} strokeWidth={0.6} />;
        })}
        {Array.from({ length: V_DIVS * 5 + 1 }, (_, i) => {
          const y = (i / (V_DIVS * 5)) * height;
          const midX = svgW / 2;
          return <line key={`ty${i}`} x1={midX - 3} y1={y} x2={midX + 3} y2={y} stroke={tickColor} strokeWidth={0.6} />;
        })}

        {/* ── Axis labels ── */}
        <text x={svgW - 8} y={height / 2 + 12} fill={labelColor} fontSize={10} textAnchor="end" fontFamily="monospace">t</text>
        <text x={svgW / 2 - 8} y={12} fill={labelColor} fontSize={10} textAnchor="end" fontFamily="monospace">V</text>

        {/* ── Calibration labels ── */}
        <text x={svgW / 2 + 4} y={12} fill={labelColor} fontSize={7} opacity={0.6} textAnchor="start" fontFamily="monospace">240</text>
        <text x={svgW / 2 + 4} y={height - 6} fill={labelColor} fontSize={7} opacity={0.6} textAnchor="start" fontFamily="monospace">-240</text>

        {/* ── The wave ── */}
        <path
          ref={pathRef} fill="none" stroke={waveStroke} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" opacity={p.opacity}
          style={{
            filter: isDark && gridState !== "offline"
              ? `drop-shadow(0 0 2px ${waveStroke})`
              : `none`
          }}
        />

        {/* ── Offline flat line label ── */}
        {gridState === "offline" && (
          <text
            x={svgW / 2} y={height / 2 + 18}
            textAnchor="middle"
            fill={isDark ? "rgba(255, 26, 26, 0.7)" : "rgba(185,28,28,0.9)"}
            fontSize={11}
            fontFamily="'Space Mono', monospace"
            letterSpacing={2}
          >
            NO SIGNAL
          </text>
        )}
      </svg>

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "8px",
        background: isDark
          ? "radial-gradient(ellipse at 50% 50%, rgba(57,255,20,0.02) 0%, transparent 55%, rgba(0,0,0,0.6) 100%)"
          : "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(0,0,0,0.02) 100%)",
      }} />
      {/* Scanlines — dark mode only */}
      {isDark && <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "8px",
        backgroundImage: "repeating-linear-gradient(transparent, transparent 2px, rgba(0,8,0,0.12) 2px, rgba(0,8,0,0.12) 4px)",
      }} />}
    </div>
  );
}
