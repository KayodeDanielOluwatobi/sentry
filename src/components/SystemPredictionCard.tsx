"use client";

import React, { useMemo } from "react";
import BentoCard, { CardTheme } from "./BentoCard";
import { TradeUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ManagedLoad } from "./SmartEnergyManager";

export interface SystemPredictionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: CardTheme;
  withShadow?: boolean;
  soc?: number;
  voltage?: number;
  power?: number;
  isCharging?: boolean;
  loads?: ManagedLoad[];
  mode?: "auto" | "manual";
  batteryCapacityAh?: number;
  /** Raw telemetry history records from localStorage / state */
  historyRecords?: Array<{
    timestamp: number;
    voltage: number;
    current: number;
    power: number;
    temperatures: number[];
    cellVoltages: number[];
    isOffline: boolean;
  }>;
}

/**
 * Format decimal hours into human readable "Xh Ym" (e.g. 3.16 => "3h 10m")
 */
function formatHoursMinutes(totalHours: number): string {
  if (isNaN(totalHours) || totalHours <= 0) return "0m";
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours - h) * 60);

  if (m === 60) {
    return `${h + 1}h 0m`;
  }

  if (h === 0) {
    return `${m}m`;
  }
  return `${h}h ${m}m`;
}

export default function SystemPredictionCard({
  theme = "light",
  withShadow = true,
  soc = 89,
  voltage = 12.74,
  power = 450,
  isCharging = false,
  loads = [],
  mode = "auto",
  batteryCapacityAh = 100,
  historyRecords = [],
  style,
  ...props
}: SystemPredictionCardProps) {
  const isDark = theme === "dark";

  // ─── Phase 1: Analytics from real historyRecords ────────────────────────────
  const analytics = useMemo(() => {
    const now = Date.now();
    const onlineRecords = historyRecords.filter(r => !r.isOffline && r.power >= 0);

    // Rolling 15-minute average power (online readings only)
    const window15min = 15 * 60 * 1000;
    const recent15 = onlineRecords.filter(r => now - r.timestamp <= window15min);
    const rollingAvgPower = recent15.length > 0
      ? recent15.reduce((sum, r) => sum + r.power, 0) / recent15.length
      : null;

    // 2-hour baseline average (for surge detection)
    const window2h = 2 * 60 * 60 * 1000;
    const baseline2h = onlineRecords.filter(r => now - r.timestamp <= window2h);
    const baselineAvgPower = baseline2h.length > 0
      ? baseline2h.reduce((sum, r) => sum + r.power, 0) / baseline2h.length
      : null;

    // Surge detection: rolling avg ≥ 1.5× baseline
    const isSurging = rollingAvgPower !== null && baselineAvgPower !== null && baselineAvgPower > 0
      ? rollingAvgPower >= baselineAvgPower * 1.5
      : false;

    // dV/dt slope: voltage drop per hour over last 30 min (negative = discharging)
    const window30min = 30 * 60 * 1000;
    const volt30 = onlineRecords
      .filter(r => now - r.timestamp <= window30min)
      .sort((a, b) => a.timestamp - b.timestamp);
    let dvdtPerHour: number | null = null;
    if (volt30.length >= 2) {
      const first = volt30[0];
      const last = volt30[volt30.length - 1];
      const dtHours = (last.timestamp - first.timestamp) / 3600000;
      if (dtHours > 0) {
        dvdtPerHour = (last.voltage - first.voltage) / dtHours;
      }
    }

    return { rollingAvgPower, baselineAvgPower, isSurging, dvdtPerHour, recentCount: recent15.length };
  }, [historyRecords]);

  // Use rolling 15-min average if available; fall back to instantaneous power prop
  // This eliminates the "0W during Idle" problem where Firebase reports 0 briefly
  const nominalVoltage = voltage && voltage > 10 ? voltage : 12.8;
  const totalWh = batteryCapacityAh * nominalVoltage;

  const effectivePower = analytics.rollingAvgPower !== null && analytics.rollingAvgPower > 0
    ? analytics.rollingAvgPower
    : Math.max(15, power);

  // Descriptive power source label for banner
  const powerSourceLabel = analytics.recentCount >= 3
    ? `15-min avg · ${Math.round(effectivePower)}W`
    : `Instant · ${Math.round(effectivePower)}W`;

  let bannerLabel = "Estimated backup at current load";
  let bannerMetric = "3h 10m";

  let conditionText = "If SOC falls below 50%,";
  let headlineText = "TV and Lights will be disconnected first";
  let reasonText = "to preserve battery runtime.";

  if (isCharging) {
    // ── CHARGING PREDICTION ──────────────────────────────────────────────────
    const remainingToFullWh = ((100 - Math.min(100, soc)) / 100) * totalWh;
    const chargePowerW = Math.max(80, effectivePower);
    const hoursToFull = remainingToFullWh / (chargePowerW * 0.92);

    bannerLabel = analytics.recentCount >= 3 ? `Est. time to full (${powerSourceLabel})` : "Estimated time to full charge";
    bannerMetric = formatHoursMinutes(hoursToFull);

    conditionText = "System is actively charging,";
    headlineText = "Auto load shedding is currently standby";
    reasonText = "all circuits remain continuously powered.";
  } else {
    // ── DISCHARGING PREDICTION ───────────────────────────────────────────────
    const safeUsableSoc = Math.max(0, soc - 5);
    const usableWh = (safeUsableSoc / 100) * totalWh;

    // Use dV/dt slope for more accurate runtime if available
    let hoursBackup: number;
    if (analytics.dvdtPerHour !== null && analytics.dvdtPerHour < 0) {
      // Estimate remaining Wh from voltage drop rate calibrated to 12.8V LiFePO4 curve
      // Very rough: assume linear voltage from 12.0V (empty) to 13.2V (full)
      const voltageRange = 13.2 - 12.0;
      const socFromVoltage = Math.max(0, Math.min(100, ((nominalVoltage - 12.0) / voltageRange) * 100));
      const hoursUntilEmpty = (socFromVoltage / 100) / Math.abs(analytics.dvdtPerHour / voltageRange);
      // Blend Wh-based and dV/dt-based estimates (60/40) for reliability
      const whBasedHours = usableWh / effectivePower;
      hoursBackup = hoursUntilEmpty * 0.4 + whBasedHours * 0.6;
    } else {
      hoursBackup = usableWh / effectivePower;
    }

    bannerLabel = analytics.isSurging
      ? `⚡ Surge detected — ${powerSourceLabel}`
      : analytics.recentCount >= 3
        ? `Backup est. (${powerSourceLabel})`
        : "Estimated backup at current load";
    bannerMetric = formatHoursMinutes(hoursBackup);

    // Dynamic next load shed prediction based on priority rules
    const nonEssential = loads.find((l) => l.level === "non-essential") || loads[2];
    const major = loads.find((l) => l.level === "major") || loads[1];
    const critical = loads.find((l) => l.level === "critical") || loads[0];

    const nonEssentialName = nonEssential?.name || "TV and Lights";
    const majorName = major?.name || "Fans and AC";

    if (soc > 50) {
      conditionText = "If SOC falls below 50%,";
      headlineText = `${nonEssentialName} will be disconnected first`;
      reasonText = "to preserve battery runtime.";
    } else if (soc > 30) {
      conditionText = "If SOC falls below 30%,";
      headlineText = `${majorName} will be shed next`;
      reasonText = "to extend critical backup runtime.";
    } else if (soc > 10) {
      conditionText = "If SOC drops below 10%,";
      headlineText = "Critical loads will be shed at 10% SOC";
      reasonText = "to prevent total battery cell deep discharge.";
    } else {
      conditionText = "Critical Battery Warning (SOC <= 10%),";
      headlineText = "Immediate solar/mains recharge required";
      reasonText = "all load outputs are on reserve power.";
    }
  }

  // Text color tokens matching BentoCard theme
  const textColor = isDark ? "#ffffff" : "#111111";
  const subtextColor = isDark ? "rgba(255, 255, 255, 0.65)" : "#4b5563";

  return (
    <BentoCard
      theme={theme}
      withShadow={withShadow}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.2rem",
        padding: "clamp(1.1rem, 3.5cqi, 1.5rem)",
        ...style,
      }}
      {...props}
    >
      {/* Top Header: Purple Icon + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.35rem" }}>
        <div
          style={{
            width: "clamp(32px, 7cqi, 38px)",
            height: "clamp(32px, 7cqi, 38px)",
            borderRadius: "50%",
            background: isDark ? "rgba(168, 85, 247, 0.2)" : "rgba(168, 85, 247, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <HugeiconsIcon
            icon={TradeUpIcon}
            size={18}
            color={isDark ? "#c084fc" : "#9333ea"}
            strokeWidth={2.2}
          />
        </div>
        <span
          style={{
            fontSize: "clamp(0.82rem, 2.8cqi, 0.95rem)",
            fontWeight: 700,
            color: textColor,
            fontFamily: "var(--font-inter), sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          System Prediction
        </span>
      </div>

      {/* Main Body Prediction Statement */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minHeight: "52px", paddingLeft: "clamp(0.35rem, 1.8cqi, 0.65rem)", marginBottom: "0.45rem" }}>
        <span
          style={{
            fontSize: "clamp(0.68rem, 2.2cqi, 0.82rem)",
            fontWeight: 400,
            color: subtextColor,
            fontFamily: "var(--font-inter), sans-serif",
          }}
        >
          {conditionText}
        </span>
        <span
          style={{
            fontSize: "clamp(0.78rem, 2.5cqi, 0.95rem)",
            fontWeight: 700,
            color: textColor,
            fontFamily: "var(--font-inter), sans-serif",
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
          }}
        >
          {headlineText}
        </span>
        <span
          style={{
            fontSize: "clamp(0.68rem, 2.2cqi, 0.82rem)",
            fontWeight: 400,
            color: subtextColor,
            fontFamily: "var(--font-inter), sans-serif",
          }}
        >
          {reasonText}
        </span>
      </div>

      {/* Bottom Banner Container */}
      <div
        style={{
          width: "100%",
          borderRadius: "14px",
          background: isDark ? "rgba(168, 85, 247, 0.12)" : "rgba(168, 85, 247, 0.05)",
          border: `1px solid ${isDark ? "rgba(168, 85, 247, 0.22)" : "rgba(168, 85, 247, 0.12)"}`,
          padding: "clamp(0.55rem, 2cqi, 0.85rem) clamp(0.75rem, 2.5cqi, 1.1rem)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "clamp(0.62rem, 1.8cqi, 0.76rem)",
            fontWeight: 500,
            color: isDark ? "rgba(255, 255, 255, 0.7)" : "#4b5563",
            fontFamily: "var(--font-inter), sans-serif",
          }}
        >
          {bannerLabel}
        </span>
        <span
          style={{
            fontSize: "clamp(0.95rem, 3.2cqi, 1.25rem)",
            fontWeight: 700,
            color: isDark ? "#c084fc" : "#7e22ce",
            fontFamily: "var(--font-inter), sans-serif",
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
          }}
        >
          {bannerMetric}
        </span>
      </div>
    </BentoCard>
  );
}
