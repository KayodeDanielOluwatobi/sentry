"use client";

import { useEffect, useRef, useState } from "react";
import { motion, animate } from "framer-motion";

export interface TempSparklineProps {
  temperature?: number;
  readings?: number[];
  height?: number;
  theme?: "light" | "dark";
}

function colorProfile(temp: number) {
  if (temp < 45) return { stroke: "#22c55e", fill: "#22c55e" };
  if (temp < 60) return { stroke: "#f97316", fill: "#f97316" };
  return { stroke: "#ff1a1a", fill: "#ff1a1a" };
}

function simulateReadings(base: number, count = 24): number[] {
  let val = base - 2 + Math.random();
  return Array.from({ length: count }, () => {
    val += (Math.random() - 0.47) * 1.8;
    val = Math.max(base - 7, Math.min(base + 6, val));
    return parseFloat(val.toFixed(1));
  });
}

// Straight linear path (to prevent retroactive curve morphing)
function buildSmoothPath(points: [number, number][]): string {
  if (points.length < 2) return "";
  const d: string[] = [`M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`];
  for (let i = 1; i < points.length; i++) {
    d.push(`L ${points[i][0].toFixed(2)} ${points[i][1].toFixed(2)}`);
  }
  return d.join(" ");
}

export default function TempSparkline({
  temperature = 25,
  readings,
  height = 120,
  theme = "light",
}: TempSparklineProps) {
  const [data, setData] = useState<{ id: number; temp: number }[]>(() =>
    readings
      ? readings.map((temp, id) => ({ id, temp }))
      : [{ id: 0, temp: temperature }]
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDark = theme === "dark";
  const color = colorProfile(temperature);

  const containerRef = useRef<HTMLDivElement>(null);
  const [svgW, setSvgW] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      setSvgW(entries[0].contentRect.width || 400);
    });
    ro.observe(el);
    setSvgW(el.getBoundingClientRect().width || 400);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const tick = () => {
      setData(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        const newVal = Math.max(
          temperature - 7,
          Math.min(temperature + 6, last.temp + (Math.random() - 0.5) * 1.5)
        );
        next.push({ id: last.id + 1, temp: parseFloat(newVal.toFixed(1)) });
        if (next.length > 26) next.shift();
        return next;
      });
      timerRef.current = setTimeout(tick, 2000);
    };
    timerRef.current = setTimeout(tick, 2000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [temperature]);

  // ── Layout constants ──
  const VB_W = svgW;
  const AXIS_X = 32;              // left space for Y-axis labels
  const PAD_R = 18;
  const PAD_T = 12;
  const PAD_B = 18;              // bottom space for X-axis
  const chartW = VB_W - AXIS_X - PAD_R;
  const chartH = height - PAD_T - PAD_B;
  const originX = AXIS_X;
  const originY = PAD_T + chartH; // bottom-left corner of chart

  const temps = data.map(d => d.temp);
  const minV = Math.min(...temps);
  const maxV = Math.max(...temps);
  const rawRange = maxV - minV || 2;
  const buffer = rawRange * 0.15;
  const targetYMin = minV - buffer;
  const targetYMax = maxV + buffer;

  const [yBounds, setYBounds] = useState({ min: targetYMin, max: targetYMax });
  const prevBoundsRef = useRef(yBounds);

  useEffect(() => {
    let currentMin = prevBoundsRef.current.min;
    let currentMax = prevBoundsRef.current.max;

    const c1 = animate(currentMin, targetYMin, {
      duration: 1.0,
      ease: "easeInOut",
      onUpdate: (v) => { currentMin = v; setYBounds({ min: currentMin, max: currentMax }); }
    });

    const c2 = animate(currentMax, targetYMax, {
      duration: 1.0,
      ease: "easeInOut",
      onUpdate: (v) => { currentMax = v; setYBounds({ min: currentMin, max: currentMax }); }
    });

    return () => {
      c1.stop();
      c2.stop();
      prevBoundsRef.current = { min: currentMin, max: currentMax };
    };
  }, [targetYMin, targetYMax]);

  const yMin = yBounds.min;
  const yMax = yBounds.max;
  const range = yMax - yMin;

  const X_SPAN = 23;
  const xStep = chartW / X_SPAN;
  const toPoint = (item: { id: number, temp: number }): [number, number] => [
    originX + item.id * xStep,
    PAD_T + chartH - ((item.temp - yMin) / range) * chartH,
  ];
  const points = data.map(toPoint);

  const latest = points[points.length - 1];
  const latestVal = data[data.length - 1].temp;
  const currentOffset = Math.max(0, data[data.length - 1].id - X_SPAN) * xStep;

  const historyPoints = points.length > 1 ? points.slice(0, -1) : points;
  const historyLinePath = buildSmoothPath(historyPoints);
  const fullLinePath = buildSmoothPath(points);

  // Area path closes down to the lowest X origin that is structurally visible
  const areaPath = fullLinePath
    ? `${fullLinePath} L ${latest[0].toFixed(2)} ${originY} L ${originX + currentOffset} ${originY} Z`
    : `M ${originX} ${latest[1]} L ${originX} ${originY} Z`;

  // Reference line — clamped strictly inside chart
  const refY = Math.max(PAD_T + 2, Math.min(originY - 2, PAD_T + chartH - ((temperature - yMin) / range) * chartH));

  // Y-axis ticks: 4 evenly spaced
  const Y_TICKS = 4;
  const labelColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.28)";
  const axisColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const tickColor = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)";
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";

  return (
    // overflow:hidden keeps the reference line from leaking outside
    <div ref={containerRef} style={{ width: "100%", overflow: "hidden" }}>
      <svg
        width={svgW}
        height={height}
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="tsg-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color.fill} stopOpacity={isDark ? 0.35 : 0.2} />
            <stop offset="100%" stopColor={color.fill} stopOpacity={0} />
          </linearGradient>
          
          {/* Animated mask to smoothly reveal the area fill matching the exact speed of the tracking dot */}
          <clipPath id="area-clip">
            <motion.rect 
              initial={false}
              x={0} y={0} 
              animate={{ width: latest[0] }} 
              height={height} 
              transition={{ duration: 1.0, ease: "easeInOut" }}
            />
          </clipPath>

          {/* Clip to chart area only */}
          <clipPath id="chart-clip">
            <rect x={originX} y={PAD_T} width={chartW} height={chartH} />
          </clipPath>
        </defs>

        {/* ── Y-axis line ── */}
        <line x1={originX} y1={PAD_T} x2={originX} y2={originY}
          stroke={axisColor} strokeWidth={1} />

        {/* ── X-axis line ── */}
        <line x1={originX} y1={originY} x2={originX + chartW} y2={originY}
          stroke={axisColor} strokeWidth={1} />

        {/* ── Y-axis ticks + labels + grid lines ── */}
        {Array.from({ length: Y_TICKS + 1 }, (_, i) => {
          const frac = i / Y_TICKS;
          const y = PAD_T + chartH * frac;
          const val = (yMax - frac * range).toFixed(0);
          return (
            <g key={i}>
              {/* Horizontal grid */}
              <line x1={originX} y1={y} x2={originX + chartW} y2={y}
                stroke={gridColor} strokeWidth={0.6} />
              {/* Tick mark */}
              <line x1={originX - 3} y1={y} x2={originX} y2={y}
                stroke={tickColor} strokeWidth={0.8} />
              {/* Label */}
              <text x={originX - 5} y={y + 3} fill={labelColor}
                fontSize={8} textAnchor="end"
                fontFamily="'Space Mono', monospace">
                {val}°
              </text>
            </g>
          );
        })}

        {/* ── X-axis ticks (time markers) ── */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const x = originX + frac * chartW;
          return (
            <g key={i}>
              <line x1={x} y1={originY} x2={x} y2={originY + 3}
                stroke={tickColor} strokeWidth={0.8} />
              {i > 0 && i < 4 && (
                <line x1={x} y1={PAD_T} x2={x} y2={originY}
                  stroke={gridColor} strokeWidth={0.5} />
              )}
            </g>
          );
        })}
        <text x={originX} y={originY + 12} fill={labelColor} fontSize={8}
          fontFamily="'Space Mono', monospace">older</text>
        <text x={originX + chartW} y={originY + 12} fill={labelColor} fontSize={8}
          textAnchor="end" fontFamily="'Space Mono', monospace">now</text>

        {/* ── Clipped chart content ── */}
        <g clipPath="url(#chart-clip)">
          {/* Current temp reference line — dashed, clipped, tracking current Y cleanly */}
          <motion.line x1={originX} x2={originX + chartW}
            initial={false} animate={{ y1: refY, y2: refY }}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            stroke={color.stroke} strokeWidth={0.9}
            opacity={0.3} strokeDasharray="6 5" />

          {/* Physically scrolling path group */}
          <motion.g initial={false} animate={{ x: -currentOffset }} transition={{ duration: 1.0, ease: "easeInOut" }}>
            {/* Area fill */}
            <path d={areaPath} fill="url(#tsg-fill)" clipPath="url(#area-clip)" />

            {/* Rigid historical line path */}
            <path d={historyLinePath} fill="none" stroke={color.stroke}
              strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
              opacity={0.95} />

            {/* Dynamically tracking final tip line segment (Draws smoothly instead of snapping) */}
            <motion.line
              initial={false}
              x1={points.length > 1 ? points[points.length - 2][0] : points[0][0]}
              y1={points.length > 1 ? points[points.length - 2][1] : points[0][1]}
              animate={{ x2: latest[0], y2: latest[1] }}
              transition={{ duration: 1.0, ease: "easeInOut" }}
              stroke={color.stroke} strokeWidth={2.2} strokeLinecap="round"
            />
          </motion.g>
        </g>

        {/* ── Unclipped scrolling group so the dot and text never get chopped ── */}
        <motion.g initial={false} animate={{ x: -currentOffset }} transition={{ duration: 1.0, ease: "easeInOut" }}>
          {/* ── Latest value label (above dot) ── */}
          <motion.text
            initial={false}
            animate={{ x: latest[0], y: Math.max(latest[1] - 8, PAD_T + 10) }}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            fill={color.stroke} fontSize={10} textAnchor="middle"
            fontFamily="'Space Mono', monospace" fontWeight="bold" opacity={0.9}
          >
            {latestVal}°
          </motion.text>

          {/* ── Solid dot ── */}
          <motion.circle
            initial={false}
            animate={{ cx: latest[0], cy: latest[1] }}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            r={3.5} fill={color.stroke}
          />
        </motion.g>
      </svg>
    </div>
  );
}
