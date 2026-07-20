"use client";

import React, { useEffect, useRef, useState } from "react";
import BentoCard from "./BentoCard";
import { CardTheme } from "./BentoCard";
import { ExpandIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

/**
 * Smoothly animates a numeric voltage value to a new target using
 * requestAnimationFrame with an ease-out curve.
 * Duration: 600ms — fast enough to feel live, slow enough to read.
 */
function useAnimatedVoltage(target: number, duration = 600): number {
  const [display, setDisplay] = useState(target);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    // Cancel any in-progress animation
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic: decelerates into the final value
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (target - from) * eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = target;
        setDisplay(target);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

interface CellVoltagesProps extends React.HTMLAttributes<HTMLDivElement> {
  voltages?: number[]; // Array of 4 cell voltages (e.g. [3.199, 3.197, 3.196, 3.199])
  delta?: number;      // BMS-provided delta reading (mV imbalance). If supplied, overrides local computation.
  theme?: CardTheme;
  withShadow?: boolean;
}

// ── CellCard sub-component ──────────────────────────────────────────────────
// Extracted so that useAnimatedVoltage (a hook) can be called per-cell.
// React rules forbid calling hooks inside .map(), so each card is its own component.
interface CellCardProps {
  voltage: number;
  idx: number;
  isHighest: boolean;
  isLowest: boolean;
  activeBars: number;
  activeColor: string;
  displayTextColor: string;
  grayText: string;
  cardBg: string;
  cardBorder: string;
  isDark: boolean;
}

function CellCard({
  voltage,
  idx,
  isHighest,
  isLowest,
  activeBars,
  activeColor,
  displayTextColor,
  grayText,
  cardBg,
  cardBorder,
  isDark,
}: CellCardProps) {
  const isNan = isNaN(voltage);
  // Animate voltage number smoothly on every change (600ms ease-out cubic)
  const animatedVoltage = useAnimatedVoltage(isNan ? 0 : voltage);

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: "10px",
        padding: "clamp(0.35rem, 1.2cqi, 0.5rem)",
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        minWidth: 0,
        transition: "background-color 0.2s ease, border-color 0.2s ease",
      }}
    >
      {/* Cell Label */}
      <div
        style={{
          fontSize: "clamp(0.62rem, 2.2cqi, 0.75rem)",
          fontWeight: 500,
          color: grayText,
          fontFamily: "var(--font-inter), sans-serif",
        }}
      >
        Cell {idx + 1}
      </div>

      {/* Level + Voltage value row — CSS grid for deterministic vertical centering */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "32px 1fr",
          alignItems: "center",
          gap: "clamp(0.18rem, 1.5cqi, 0.35rem)",
          width: "100%",
          minWidth: 0,
          height: "14px",
        }}
      >
        {/* Segmented charge level vector indicator */}
        <svg
          width="32"
          height="10"
          viewBox="0 0 32 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ alignSelf: "center", display: "block" }}
        >
          {Array.from({ length: 7 }).map((_, barIdx) => {
            const isBarActive = barIdx < activeBars;
            return (
              <rect
                key={barIdx}
                x={barIdx * 4.5}
                y="0"
                width="3"
                height="10"
                rx="1.5"
                ry="1.5"
                fill={isBarActive
                  ? activeColor
                  : (isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)")
                }
              />
            );
          })}
        </svg>

        {/* Voltage Reading — animated smooth counter */}
        <div
          className="cv-voltage-text"
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: "center",
            fontSize: "clamp(0.65rem, 2.5cqi, 0.8rem)",
            fontWeight: 600,
            color: displayTextColor,
            whiteSpace: "nowrap",
            fontFamily: "var(--font-inter), sans-serif",
            lineHeight: 1,
            minWidth: 0,
          }}
        >
          <span>{isNan ? "—" : animatedVoltage.toFixed(3)}</span>
          {!isNan && <span style={{ fontSize: "0.52rem", fontWeight: 400, color: grayText, marginLeft: "1px" }}>V</span>}
        </div>
      </div>
    </div>
  );
}
// ───────────────────────────────────────────────────────────────────────────────


export default function CellVoltages({
  voltages,
  delta: bmsProvidedDelta,
  theme = "light",
  withShadow = true,
  style,
  ...props
}: CellVoltagesProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#ffffff" : "#111111";
  const grayText = isDark ? "#9ca3af" : "#6b7280";
  const cardBg = isDark ? "rgba(255, 255, 255, 0.02)" : "#fbfcfd";
  const cardBorder = isDark ? "rgba(255, 255, 255, 0.06)" : "#e5e7eb";
  
  // Dynamic high-saturation colors for cells
  const vibrantGreen = isDark ? "#39e578" : "#22c55e";
  const vibrantBlue = isDark ? "#60a5fa" : "#2563eb"; // Blue for the highest voltage cell
  const warningRed = isDark ? "#ef4444" : "#dc2626"; // Red for the lowest voltage cell

  // Calculate dynamic delta (Max - Min)
  const isLoaded = voltages !== undefined;
  const cellArray = isLoaded ? voltages : [NaN, NaN, NaN, NaN];
  const maxV = Math.max(...cellArray.filter(v => !isNaN(v)));
  const minV = Math.min(...cellArray.filter(v => !isNaN(v)));
  // Use BMS-provided delta if available, otherwise compute locally as fallback
  const delta = isLoaded
    ? (bmsProvidedDelta !== undefined ? bmsProvidedDelta.toFixed(3) : (maxV - minV).toFixed(3))
    : "—";

  // Find index of the first cell with the highest voltage value (to handle ties cleanly)
  const highestIdx = isLoaded ? cellArray.indexOf(maxV) : -1;

  // Concentric corner radius matching main bento padding (consistent clamp scale)
  const paddingValue = "clamp(0.5rem, 2.5cqi, 1rem)";
  const bentoRadius = `calc(12px + ${paddingValue})`;

  /**
   * BMS Cell Metering Logic:
   * Maps cell voltage relative to project operating range:
   * - 0% SOC: 2.7 V
   * - 100% SOC: 3.59 V
   * Linear mapping: pct = (v - 2.7) / (3.59 - 2.7). Multiplied by 7 bars.
   */
  const getActiveBarsCount = (v: number): number => {
    if (isNaN(v)) return 0;
    const minL = 2.7;
    const maxL = 3.59;
    const pct = (v - minL) / (maxL - minL);
    const count = Math.round(pct * 7);
    return Math.max(1, Math.min(7, count));
  };

  return (
    <BentoCard
      theme={theme}
      withShadow={withShadow}
      style={{
        containerType: "inline-size", // Enable container queries
        padding: paddingValue,
        borderRadius: bentoRadius,
        minWidth: 0,
        overflow: "hidden",
        width: "100%",
        ...style,
      }}
      {...props}
    >
      {/* Mobile-only nudge: only shifts voltage text down on narrow (mobile) containers */}
      <style>{`
        @container (max-width: 520px) {
          .cv-voltage-text {
            transform: translateY(1.5px);
          }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "clamp(0.75rem, 3cqi, 1.1rem)", // Spacious fluid gap separating bento parts
          width: "100%",
          minWidth: 0,
        }}
      >
        {/* ── Header Row ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "0 0.35rem", // Indented side padding
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
            <h2
              style={{
                fontSize: "clamp(0.85rem, 3.5cqi, 0.95rem)",
                fontWeight: 700,
                color: textColor,
                margin: 0,
                fontFamily: "var(--font-inter), sans-serif",
              }}
            >
              Cell Voltages
            </h2>
            <span
              style={{
                fontSize: "clamp(0.7rem, 2.5cqi, 0.78rem)",
                color: grayText,
                fontWeight: 400,
                fontFamily: "var(--font-inter), sans-serif",
              }}
            >
              ({cellArray.length} Cells)
            </span>
          </div>
          <button
            style={{
              background: "none",
              border: "none",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isDark ? "#9ca3af" : "#6b7280",
              opacity: 0.7,
              cursor: "pointer",
              transition: "opacity 0.2s ease, color 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.color = isDark ? "#ffffff" : "#111111";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = "0.7";
              e.currentTarget.style.color = isDark ? "#9ca3af" : "#6b7280";
            }}
            onClick={() => console.log("View All clicked")}
            aria-label="Expand Cell Voltages"
          >
            <HugeiconsIcon
              icon={ExpandIcon}
              size={18}
              strokeWidth={1} // 1px stroke weight as requested
            />
          </button>
        </div>

        {/* ── Cell Cards Grid (Always 4 Columns side-by-side) ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)", // Locked side-by-side for all screens
            gap: "clamp(0.2rem, 1.2cqi, 0.45rem)", // Fluid tight gap to fit mobile viewports
            width: "100%",
            minWidth: 0,
          }}
        >
          {cellArray.map((voltage, idx) => {
            const isHighest = idx === highestIdx;
            const isLowest = maxV !== minV && voltage === minV;
            const activeBars = getActiveBarsCount(voltage);

            let activeColor = vibrantGreen;
            let displayTextColor = textColor;
            if (isHighest) { activeColor = vibrantBlue; displayTextColor = vibrantBlue; }
            else if (isLowest) { activeColor = warningRed; displayTextColor = warningRed; }

            return (
              <CellCard
                key={idx}
                voltage={voltage}
                idx={idx}
                isHighest={isHighest}
                isLowest={isLowest}
                activeBars={activeBars}
                activeColor={activeColor}
                displayTextColor={displayTextColor}
                grayText={grayText}
                cardBg={cardBg}
                cardBorder={cardBorder}
                isDark={isDark}
              />
            );
          })}
        </div>

        {/* ── Delta Summary — subtle inline caption, not a card ── */}
        <div
          style={{
            borderTop: `1px solid ${cardBorder}`,
            paddingTop: "0.5rem",
            paddingLeft: "0.5rem",
            paddingRight: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            opacity: 0.6, // Visually recede — this is secondary info
          }}
        >
          <span
            style={{
              fontSize: "clamp(0.6rem, 1.8cqi, 0.7rem)",
              fontWeight: 400,
              color: grayText,
              fontFamily: "var(--font-inter), sans-serif",
              letterSpacing: "0.02em",
            }}
          >
            Δ Max − Min
          </span>
          <span
            style={{
              fontSize: "clamp(0.62rem, 1.9cqi, 0.72rem)",
              fontWeight: 500,
              color: grayText,
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            {delta} <span style={{ fontSize: "0.55rem", fontWeight: 400 }}>V</span>
          </span>
        </div>
      </div>
    </BentoCard>
  );
}
