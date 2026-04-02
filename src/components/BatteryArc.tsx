"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform, MotionValue } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BatteryTheme = "light" | "dark";

interface BatteryArcProps {
  /** State of Charge: 0–100. Replace with Firebase onValue listener. */
  soc?: number;
  /** Value to display in the absolute center. Overrides `soc` if provided. */
  centerValue?: number;
  /** Text to display above the center counter */
  centerLabel?: string;
  /** Decimal precision for the center counter */
  precision?: number;
  /** Whether the battery is currently charging */
  isCharging?: boolean;
  /** Label below the value */
  label?: string;
  /** Secondary line e.g. "52.1V · 8A" */
  meta?: string;
  /** Theme — controlled by parent toggle */
  theme?: BatteryTheme;
  /** Component size in px (square) */
  size?: number;
  /** Arc draw animation duration in seconds */
  animDuration?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TICK_MARKS = [0, 20, 40, 60, 80, 100];

const ARC_START_DEG = 120;
const ARC_SWEEP_DEG = 300;

// ─── Geometry ─────────────────────────────────────────────────────────────────

function degToRad(d: number) {
  return (d * Math.PI) / 180;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = degToRad(deg);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polar(cx, cy, r, start);
  const e = polar(cx, cy, r, end);
  const sw = ((end - start) % 360 + 360) % 360;
  const lg = sw > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${lg} 1 ${e.x} ${e.y}`;
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────

function tokens(isDark: boolean) {
  return {
    track: isDark ? "#1e1e22" : "#f0f0f2",
    tickLine: "#ffffff",
    tickText: isDark ? "#ffffff" : "#888888",
  };
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function Counter({ mv, colorMv, precision = 0 }: { mv: MotionValue<number>; colorMv: MotionValue<string>; precision?: number }) {
  const [disp, setDisp] = useState("");

  useEffect(() => {
    setDisp(mv.get().toFixed(precision));
    return mv.on("change", (v) => setDisp(v.toFixed(precision)));
  }, [mv, precision]);

  return (
    <motion.span style={{
      fontFamily: "var(--font-google-sans), sans-serif",
      fontFeatureSettings: "'tnum' on",
      fontSize: "clamp(1.4rem, 18cqi, 2.4rem)",
      fontWeight: 500,              // ← EDIT SOC FONT WEIGHT HERE
      letterSpacing: "0.01em",
      color: colorMv,
      lineHeight: 1,
    }}>
      {disp}
    </motion.span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BatteryArc({
  soc: ext,
  centerValue,
  centerLabel,
  precision = 0,
  label,
  meta,
  isCharging = false,
  theme = "light",
  size = 300,
}: BatteryArcProps) {

  // ── Dummy drifting data — swap with Firebase onValue() ──
  const [dummy, setDummy] = useState(58);
  useEffect(() => {
    if (ext !== undefined) return;
    const id = setInterval(() =>
      setDummy((p) => Math.min(100, Math.max(0, Math.round(p + (Math.random() - 0.48) * 3))))
      , 2500);
    return () => clearInterval(id);
  }, [ext]);

  const rawTargetSoc = ext !== undefined ? Math.min(100, Math.max(0, ext)) : dummy;
  const isDark = theme === "dark";
  const t = tokens(isDark);

  // ── Framer Motion Springs ──
  const animatedSoc = useSpring(rawTargetSoc, { stiffness: 60, damping: 18 });
  const animatedCenter = useSpring(centerValue ?? rawTargetSoc, { stiffness: 60, damping: 18 });

  useEffect(() => {
    animatedSoc.set(rawTargetSoc);
  }, [rawTargetSoc, animatedSoc]);

  useEffect(() => {
    animatedCenter.set(centerValue ?? rawTargetSoc);
  }, [centerValue, rawTargetSoc, animatedCenter]);

  const pathLength = useTransform(animatedSoc, (v) => Math.max(0.001, v / 100));

  // ── Geometry ──
  const S = size;
  const cx = S / 2;
  const cy = S / 2;
  const sw = S * 0.12;                             // Main tracking stroke width
  const spineWidth = S * 0.01;                    // <--- CHANGE SPINE WIDTH HERE (Increase the 0.006 multiplier to make it thicker)
  const outerR = S / 2 - sw / 2 - S * 0.05;

  const track = arcPath(cx, cy, outerR, ARC_START_DEG, ARC_START_DEG + ARC_SWEEP_DEG);

  // Brownian motion geometry paths
  const trackInner1 = arcPath(cx, cy, outerR - sw * 0.25, ARC_START_DEG, ARC_START_DEG + ARC_SWEEP_DEG);
  const trackOuter1 = arcPath(cx, cy, outerR + sw * 0.22, ARC_START_DEG, ARC_START_DEG + ARC_SWEEP_DEG);
  const trackInner2 = arcPath(cx, cy, outerR - sw * 0.12, ARC_START_DEG, ARC_START_DEG + ARC_SWEEP_DEG);
  const trackOuter2 = arcPath(cx, cy, outerR + sw * 0.15, ARC_START_DEG, ARC_START_DEG + ARC_SWEEP_DEG);

  const startPos = polar(cx, cy, outerR, ARC_START_DEG);

  const gradientX2 = useTransform(animatedSoc, (v) => {
    const safeV = Math.max(0.1, v);
    const sweep = (safeV / 100) * ARC_SWEEP_DEG;
    return polar(cx, cy, outerR, ARC_START_DEG + sweep).x;
  });

  const gradientY2 = useTransform(animatedSoc, (v) => {
    const safeV = Math.max(0.1, v);
    const sweep = (safeV / 100) * ARC_SWEEP_DEG;
    return polar(cx, cy, outerR, ARC_START_DEG + sweep).y;
  });

  // ── Dynamic Flowing Colors ──
  // Tone down the overly bright colors above 43%.
  // Pure green (hue=120) lightens the most physically, so we suppress its geometric lightness.
  const hueValue = useTransform(animatedSoc, (v) => v * 1.2);

  const s2 = useTransform(hueValue, (h) => {
    const baseL = isDark ? 55 : 48;
    const reduction = (h / 120) * 16; // Tones down lightness up to -16% for bright greens
    return `hsl(${h}, 90%, ${baseL - reduction}%)`;
  });

  const s1 = useTransform(hueValue, (h) => {
    const baseL = isDark ? 30 : 45;
    const reduction = (h / 120) * 10;
    return `hsla(${Math.max(0, h - 5)}, 80%, ${baseL - reduction}%, 0.2)`;
  });

  const valueColor = useTransform(hueValue, (h) => {
    const baseL = isDark ? 55 : 40;
    const reduction = (h / 120) * 14;
    return `hsl(${h}, 90%, ${baseL - reduction}%)`;
  });

  // Short ticks centered on arc stroke
  const tickLen = S * 0.022;
  const ticks = TICK_MARKS.map((v) => {
    const deg = ARC_START_DEG + (v / 100) * ARC_SWEEP_DEG;
    return {
      v,
      p1: polar(cx, cy, outerR - tickLen / 2, deg),
      p2: polar(cx, cy, outerR + tickLen / 2, deg),
      label: polar(cx, cy, outerR + sw / 2 + S * 0.05, deg),
    };
  });

  return (
    <div style={{
      position: "relative",
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: S,
      height: S,
    }}>
      <svg
        width={S} height={S}
        viewBox={`0 0 ${S} ${S}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <defs>
          <motion.linearGradient id="activeGrad" gradientUnits="userSpaceOnUse" x1={startPos.x} y1={startPos.y} x2={gradientX2} y2={gradientY2}>
            <motion.stop offset="0%" stopColor={s1 as any} />
            <motion.stop offset="100%" stopColor={s2 as any} />
          </motion.linearGradient>

          <filter id="arcGlow" filterUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={S * 0.008} result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          <mask id="socMask">
            <motion.path
              d={track}
              fill="none"
              stroke="#ffffff"
              strokeWidth={sw * 1.5}
              strokeLinecap="round"
              style={{ pathLength }}
            />
          </mask>
        </defs>

        {/* Track */}
        <path d={track} fill="none" stroke={t.track} strokeWidth={sw} strokeLinecap="round" />

        {/* Active arc */}
        <motion.path
          d={track}
          fill="none"
          stroke="url(#activeGrad)"
          strokeWidth={sw}
          strokeLinecap="round"
          filter="url(#arcGlow)"
          style={{ pathLength }}
        />

        {/* Center spine line tracking the active arc */}
        <motion.path
          d={track}
          fill="none"
          stroke={isDark ? "rgba(255, 255, 255, 0.55)" : "rgba(255, 255, 255, 0.75)"}
          strokeWidth={spineWidth}
          strokeLinecap="round"
          filter={isCharging ? "url(#arcGlow)" : undefined}
          style={{ pathLength }}
        />

        {/* Bubbles effect inside the arc when charging */}
        {isCharging && (
          <g mask="url(#socMask)">
            {/* Center path */}
            <motion.path d={track} fill="none" stroke="#ffffff" strokeWidth={sw * 0.12} strokeLinecap="round"
              strokeDasharray={`0 ${S * 0.12}`} initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: -(S * 0.12) }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }} style={{ opacity: 0.5 }} />

            {/* Inner offset 1 */}
            <motion.path d={trackInner1} fill="none" stroke="#ffffff" strokeWidth={sw * 0.08} strokeLinecap="round"
              strokeDasharray={`0 ${S * 0.16}`} initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: -(S * 0.16) }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }} style={{ opacity: 0.6 }} />

            {/* Outer offset 1 */}
            <motion.path d={trackOuter1} fill="none" stroke="#ffffff" strokeWidth={sw * 0.05} strokeLinecap="round"
              strokeDasharray={`0 ${S * 0.11}`} initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: -(S * 0.11) }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} style={{ opacity: 0.8 }} />

            {/* Inner offset 2 */}
            <motion.path d={trackInner2} fill="none" stroke="#ffffff" strokeWidth={sw * 0.06} strokeLinecap="round"
              strokeDasharray={`0 ${S * 0.18}`} initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: -(S * 0.18) }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} style={{ opacity: 0.7 }} />

            {/* Outer offset 2 */}
            <motion.path d={trackOuter2} fill="none" stroke="#ffffff" strokeWidth={sw * 0.09} strokeLinecap="round"
              strokeDasharray={`0 ${S * 0.22}`} initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: -(S * 0.22) }}
              transition={{ repeat: Infinity, duration: 1.9, ease: "linear" }} style={{ opacity: 0.5 }} />
          </g>
        )}

        {/* Ticks */}
        {ticks.map(({ v, p1, p2, label }) => (
          <g key={v}>
            <line
              x1={p1.x.toFixed(4)} y1={p1.y.toFixed(4)} x2={p2.x.toFixed(4)} y2={p2.y.toFixed(4)}
              stroke={t.tickLine} strokeWidth={S * 0.004} strokeLinecap="round"
              opacity={0.7}
            />
            <text
              x={label.x.toFixed(4)} y={label.y.toFixed(4)}
              textAnchor="middle" dominantBaseline="middle"
              fill={t.tickText} fontSize={S * 0.048}
              fontFamily="var(--font-satoshi), sans-serif" fontWeight={400}
              opacity={0.12}
            >
              {v}
            </text>
          </g>
        ))}
      </svg>

      {/* Center labels */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: S * 0.01, marginTop: -S * 0.04,
      }}>
        {centerLabel && (
          <span style={{
            fontSize: S * 0.045, fontFamily: "var(--font-satoshi), sans-serif",
            letterSpacing: "0.12em", color: isDark ? "#777" : "#aaa",
            textTransform: "uppercase", fontWeight: 600,
            marginBottom: S * 0.01
          }}>
            {centerLabel}
          </span>
        )}

        {/* SOC number + faded % anchored below without affecting layout */}
        <div style={{ position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: S * 0.015, marginTop: S * 0.01 }}>
            <Counter mv={animatedCenter} colorMv={valueColor} precision={precision} />
            {label && (
              <span style={{ fontSize: S * 0.09, color: isDark ? "#888" : "#999", fontWeight: 600, fontFamily: "var(--font-satoshi), sans-serif" }}>
                {label}
              </span>
            )}
          </div>

          {/* Faded % — sits below the number, zero layout impact */}
          <span style={{
            fontSize: S * 0.048,
            fontFamily: "var(--font-google-sans), sans-serif",
            fontWeight: 400,
            letterSpacing: "0.1em",
            color: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)",
            lineHeight: 1,
            marginTop: S * 0.0002,
          }}>
            %
          </span>
        </div>
      </div>
    </div>
  );
}