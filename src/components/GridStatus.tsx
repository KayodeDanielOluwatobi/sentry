"use client";

import React from "react";
import BentoCard, { CardTheme } from "./BentoCard";
import VoltageWaveform from "./VoltageWaveform";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sine02Icon, TwentyFourHoursClockIcon, HourglassIcon } from "@hugeicons/core-free-icons";

// --- Types ────────────────────────────────────────────────────────────────────

type GridState = "online" | "offline" | "unstable";

export interface GridStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  voltage?: number;
  gridState?: GridState;
  frequency?: number;
  lastOutage?: string;
  dailyAvailability?: string;
  lastUpdated?: string;
  theme?: CardTheme;
  withShadow?: boolean;
}

// --- State config ─────────────────────────────────────────────────────────────

function stateConfig(state: GridState, isDark: boolean) {
  switch (state) {
    case "online":
      return { label: "Online", dotColor: "#D4FF00", pillBg: isDark ? "rgba(212,255,0,0.12)" : "rgba(212,255,0,0.18)", pillText: isDark ? "#D4FF00" : "#5a6600" };
    case "offline":
      return { label: "Offline", dotColor: "#f87171", pillBg: isDark ? "rgba(248,113,113,0.1)" : "#fff1f1", pillText: isDark ? "#fca5a5" : "#991b1b" };
    case "unstable":
      return { label: "Unstable", dotColor: "#fbbf24", pillBg: isDark ? "rgba(251,191,36,0.1)" : "#fffbeb", pillText: isDark ? "#fde68a" : "#92400e" };
  }
}

// --- Component ────────────────────────────────────────────────────────────────

export default function GridStatus({
  voltage = 234,
  gridState = "online",
  frequency = 50.1,
  lastOutage = "2h 15m ago",
  dailyAvailability = "18h today",
  lastUpdated = "2s ago",
  theme = "light",
  withShadow = true,
  style,
  ...props
}: GridStatusProps) {

  const isDark = theme === "dark";
  const textColor = isDark ? "#fff" : "#111";
  const grayText = isDark ? "#9ca3af" : "#6b7280";
  const lightGrayText = isDark ? "#666" : "#9ca3af";
  const state = stateConfig(gridState, isDark);

  return (
    <BentoCard theme={theme} withShadow={withShadow} style={{ padding: "2.5rem", ...style }} {...props}>

      {/* --- Top Header --- */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <h2 style={{ margin: 0, fontSize: "clamp(1.1rem, 6cqw, 1.6rem)", fontWeight: 400, color: grayText, letterSpacing: "0.01em" }}>
          Grid Status
        </h2>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.6rem" }}>
          <span style={{ fontSize: "clamp(1.8rem, 10cqw, 2.5rem)", fontWeight: 500, color: textColor, lineHeight: 1, letterSpacing: "0" }}>
            {voltage}V
          </span>
          <span style={{ background: state.pillBg, color: state.pillText, padding: "clamp(0.3rem, 2cqw, 0.45rem) clamp(0.6rem, 4cqw, 0.9rem)", borderRadius: "999px", fontSize: "clamp(0.7rem, 3.5cqw, 0.9rem)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: "clamp(6px, 1.5cqw, 8px)", height: "clamp(6px, 1.5cqw, 8px)", borderRadius: "50%", background: state.pillText, display: "inline-block" }} />
            {state.label}
          </span>
        </div>

        <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
          <span style={{ color: lightGrayText, fontWeight: 300 }}>Last updated: </span>
          <span style={{ color: isDark ? "#b4b4b4" : "#a9b3c0", fontWeight: 400 }}>{lastUpdated}</span>
        </div>
      </div>

      {/* --- Middle: Oscilloscope Waveform --- */}
      <div style={{ marginTop: "1.8rem" }}>
        <VoltageWaveform gridState={gridState} theme={theme} height={110} cycles={4} />
      </div>

      {/* --- Bottom: Three stats horizontal --- */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: "1.8rem",
        gap: "0.75rem",
        flexWrap: "nowrap",
        overflow: "hidden"
      }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "clamp(0.65rem, 3.2cqw, 0.8rem)",
            color: grayText,
            letterSpacing: "0.03em",
            whiteSpace: "nowrap"
          }}>
            <HugeiconsIcon icon={Sine02Icon} size="clamp(13px, 3.5cqw, 16px)" style={{ flexShrink: 0 }} />
            Frequency
          </div>
          <span style={{ fontSize: "clamp(0.85rem, 4.5cqw, 1.05rem)", fontWeight: 500, color: textColor, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>{frequency} Hz</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "clamp(0.65rem, 3.2cqw, 0.8rem)",
            color: grayText,
            letterSpacing: "0.03em",
            whiteSpace: "nowrap"
          }}>
            <HugeiconsIcon icon={TwentyFourHoursClockIcon} size="clamp(13px, 3.5cqw, 16px)" style={{ flexShrink: 0 }} />
            Outage
          </div>
          <span style={{ fontSize: "clamp(0.85rem, 4.5cqw, 1.05rem)", fontWeight: 500, color: textColor, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>{lastOutage}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "clamp(0.65rem, 3.2cqw, 0.8rem)",
            color: grayText,
            letterSpacing: "0.03em",
            whiteSpace: "nowrap"
          }}>
            <HugeiconsIcon icon={HourglassIcon} size="clamp(13px, 3.5cqw, 16px)" style={{ flexShrink: 0 }} />
            Uptime
          </div>
          <span style={{ fontSize: "clamp(0.85rem, 4.5cqw, 1.05rem)", fontWeight: 500, color: textColor, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>{dailyAvailability}</span>
        </div>

      </div>
    </BentoCard>
  );
}
