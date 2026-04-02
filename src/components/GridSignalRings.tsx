"use client";

import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GridState = "online" | "offline" | "unstable";

export interface GridSignalRingsProps {
  /** Grid state from Firebase — drives color and animation */
  gridState?: GridState;
  /** Component size in px (square) */
  size?: number;
  theme?: "light" | "dark";
}

// ─── State profiles ───────────────────────────────────────────────────────────

function profile(state: GridState, isDark: boolean) {
  switch (state) {
    case "online":
      return {
        coreColor: "#4ade80",
        ringColor: "#4ade80",
        rings: 3,
        glowColor: "rgba(74, 222, 128, 0.25)",
        duration: 2.2,
        stagger: 0.55,
      };
    case "unstable":
      return {
        coreColor: "#fbbf24",
        ringColor: "#fbbf24",
        rings: 2,
        glowColor: "rgba(251, 191, 36, 0.2)",
        duration: 1.1,
        stagger: 0.3,
      };
    case "offline":
      return {
        coreColor: isDark ? "#444" : "#bbb",
        ringColor: isDark ? "#333" : "#e0e0e0",
        rings: 0,
        glowColor: "transparent",
        duration: 0,
        stagger: 0,
      };
  }
}

// ─── Pulse ring ───────────────────────────────────────────────────────────────

function PulseRing({
  cx, cy, baseR, color, delay, duration, irregular,
}: {
  cx: number; cy: number; baseR: number; color: string;
  delay: number; duration: number; irregular: boolean;
}) {
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={baseR}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      initial={{ scale: 0.6, opacity: 0.7 }}
      animate={
        irregular
          ? {
              scale: [0.6, 1.0, 0.7, 1.1, 0.6],
              opacity: [0.7, 0.2, 0.5, 0.1, 0.7],
            }
          : {
              scale: [0.6, 1.3],
              opacity: [0.8, 0],
            }
      }
      transition={{
        repeat: Infinity,
        duration,
        delay,
        ease: irregular ? "easeInOut" : "easeOut",
        times: irregular ? [0, 0.3, 0.5, 0.8, 1] : [0, 1],
      }}
      style={{ originX: `${cx}px`, originY: `${cy}px`, transformBox: "fill-box", transformOrigin: "center" }}
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GridSignalRings({
  gridState = "online",
  size = 160,
  theme = "light",
}: GridSignalRingsProps) {
  const isDark = theme === "dark";
  const p = profile(gridState, isDark);
  const cx = size / 2;
  const cy = size / 2;
  const coreR = size * 0.07;
  const ringRadii = [size * 0.18, size * 0.27, size * 0.36];
  const isOffline = gridState === "offline";
  const isUnstable = gridState === "unstable";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        {/* Core glow */}
        <filter id="coreGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={size * 0.025} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Soft ambient glow behind the rings */}
        <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={p.glowColor} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Ambient glow disc */}
      {!isOffline && (
        <circle cx={cx} cy={cy} r={size * 0.42} fill="url(#ambientGlow)" />
      )}

      {/* Static background rings (faint track) */}
      {ringRadii.map((r, i) => (
        <circle
          key={`track-${i}`}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}
          strokeWidth={1}
        />
      ))}

      {/* Animated pulse rings */}
      {Array.from({ length: p.rings }).map((_, i) => (
        <PulseRing
          key={`ring-${i}`}
          cx={cx} cy={cy}
          baseR={ringRadii[i]}
          color={p.ringColor}
          delay={i * p.stagger}
          duration={p.duration}
          irregular={isUnstable}
        />
      ))}

      {/* Core dot */}
      <motion.circle
        cx={cx} cy={cy} r={coreR}
        fill={p.coreColor}
        filter={!isOffline ? "url(#coreGlow)" : undefined}
        animate={
          isOffline
            ? { opacity: 0.3 }
            : isUnstable
            ? { opacity: [0.6, 1, 0.4, 1, 0.6], scale: [1, 1.1, 0.95, 1.05, 1] }
            : { opacity: [0.8, 1, 0.8] }
        }
        transition={
          isOffline
            ? {}
            : { repeat: Infinity, duration: isUnstable ? 1.0 : 2.0, ease: "easeInOut" }
        }
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />

      {/* Offline: X cross through the core */}
      {isOffline && (
        <g opacity={0.4}>
          <line
            x1={cx - coreR * 1.4} y1={cy - coreR * 1.4}
            x2={cx + coreR * 1.4} y2={cy + coreR * 1.4}
            stroke={isDark ? "#666" : "#aaa"} strokeWidth={1.5} strokeLinecap="round"
          />
          <line
            x1={cx + coreR * 1.4} y1={cy - coreR * 1.4}
            x2={cx - coreR * 1.4} y2={cy + coreR * 1.4}
            stroke={isDark ? "#666" : "#aaa"} strokeWidth={1.5} strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
