"use client";

import React, { useMemo, useState } from "react";
import BentoCard, { CardTheme } from "./BentoCard";
import { TradeUpIcon, ExpandIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
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

/** Format decimal hours into human readable "Xh Ym" (e.g. 3.16 => "3h 10m") */
function formatHoursMinutes(totalHours: number): string {
  if (isNaN(totalHours) || totalHours <= 0) return "0m";
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours - h) * 60);
  if (m === 60) return `${h + 1}h 0m`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

// ─── AI Morphing Sphere ───────────────────────────────────────────────────────
function AISphere({ size = 48 }: { size?: number }) {
  return (
    <>
      <style>{`
        @keyframes spherePulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes sphereOrbit1 {
          from { transform: rotate(0deg) translateX(${size * 0.38}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${size * 0.38}px) rotate(-360deg); }
        }
        @keyframes sphereOrbit2 {
          from { transform: rotate(120deg) translateX(${size * 0.32}px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(${size * 0.32}px) rotate(-480deg); }
        }
        @keyframes sphereOrbit3 {
          from { transform: rotate(240deg) translateX(${size * 0.28}px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(${size * 0.28}px) rotate(-600deg); }
        }
        @keyframes innerGlow {
          0%, 100% { opacity: 0.6; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes ripple {
          0% { transform: scale(0.6); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
      <div style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        animation: "spherePulse 2.8s ease-in-out infinite",
      }}>
        {/* Ripple ring */}
        <div style={{
          position: "absolute",
          inset: "-20%",
          borderRadius: "50%",
          border: "1.5px solid rgba(168,85,247,0.35)",
          animation: "ripple 2.2s ease-out infinite",
          pointerEvents: "none",
        }} />
        {/* Outer glow shell */}
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, rgba(192,132,252,0.22) 0%, rgba(126,34,206,0.12) 60%, transparent 100%)",
          border: "1.5px solid rgba(168,85,247,0.4)",
          boxShadow: "0 0 18px rgba(168,85,247,0.35), inset 0 0 12px rgba(192,132,252,0.15)",
        }} />
        {/* Inner core */}
        <div style={{
          position: "absolute",
          inset: "22%",
          borderRadius: "50%",
          background: "radial-gradient(circle at 40% 40%, #c084fc 0%, #7e22ce 60%, #4c1d95 100%)",
          animation: "innerGlow 1.8s ease-in-out infinite",
          boxShadow: "0 0 10px rgba(168,85,247,0.5)",
        }} />
        {/* Orbit dot 1 */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: size * 0.12, height: size * 0.12,
          marginTop: -(size * 0.06), marginLeft: -(size * 0.06),
          borderRadius: "50%",
          background: "#c084fc",
          boxShadow: "0 0 6px #c084fc",
          animation: "sphereOrbit1 2s linear infinite",
        }} />
        {/* Orbit dot 2 */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: size * 0.08, height: size * 0.08,
          marginTop: -(size * 0.04), marginLeft: -(size * 0.04),
          borderRadius: "50%",
          background: "#a855f7",
          boxShadow: "0 0 5px #a855f7",
          animation: "sphereOrbit2 1.4s linear infinite",
        }} />
        {/* Orbit dot 3 */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: size * 0.06, height: size * 0.06,
          marginTop: -(size * 0.03), marginLeft: -(size * 0.03),
          borderRadius: "50%",
          background: "#e879f9",
          boxShadow: "0 0 4px #e879f9",
          animation: "sphereOrbit3 1.8s linear infinite reverse",
        }} />
      </div>
    </>
  );
}

// ─── Expanded Modal ───────────────────────────────────────────────────────────
interface PredictionRow {
  label: string;
  value: string;
  confidence: "high" | "medium" | "low";
  icon: string;
  detail?: string;
}

function PredictionModal({
  open,
  onClose,
  isDark,
  rows,
  bannerMetric,
  bannerLabel,
  isSurging,
}: {
  open: boolean;
  onClose: () => void;
  isDark: boolean;
  rows: PredictionRow[];
  bannerMetric: string;
  bannerLabel: string;
  isSurging: boolean;
}) {
  if (!open) return null;

  const confidenceColor = (c: PredictionRow["confidence"]) => {
    if (c === "high") return "#10b981";
    if (c === "medium") return "#f59e0b";
    return "#ef4444";
  };

  const confidenceLabel = (c: PredictionRow["confidence"]) => {
    if (c === "high") return "High";
    if (c === "medium") return "Medium";
    return "Low";
  };

  return (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scanLine {
          0% { transform: translateY(-100%); opacity: 0.18; }
          100% { transform: translateY(500%); opacity: 0; }
        }
      `}</style>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)",
          zIndex: 999,
          animation: "overlayFadeIn 0.2s ease",
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          zIndex: 1000,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: "min(520px, 96vw)",
            maxHeight: "88vh",
            overflowY: "auto",
            borderRadius: "22px",
            background: isDark
              ? "linear-gradient(145deg, #0f0620 0%, #1a0a35 50%, #0d1226 100%)"
              : "linear-gradient(145deg, #faf5ff 0%, #f3e8ff 50%, #ede9fe 100%)",
            border: `1px solid ${isDark ? "rgba(168,85,247,0.3)" : "rgba(168,85,247,0.2)"}`,
            boxShadow: isDark
              ? "0 32px 80px rgba(0,0,0,0.7), 0 0 40px rgba(168,85,247,0.15)"
              : "0 32px 80px rgba(0,0,0,0.18), 0 0 30px rgba(168,85,247,0.12)",
            animation: "modalFadeIn 0.25s ease",
            pointerEvents: "all",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Scan line effect */}
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0, height: "2px",
            background: "linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.6) 50%, transparent 100%)",
            animation: "scanLine 3s linear infinite",
            pointerEvents: "none",
          }} />

          <div style={{ padding: "1.5rem" }}>
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.4rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <AISphere size={40} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: isDark ? "#e9d5ff" : "#4c1d95", fontFamily: "var(--font-inter), sans-serif" }}>
                    AI Prediction Engine
                  </div>
                  <div style={{ fontSize: "0.72rem", color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280", marginTop: "0.15rem" }}>
                    Phase 1 · Real-time telemetry analytics
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  border: "none",
                  borderRadius: "10px",
                  width: 32, height: 32,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />
              </button>
            </div>

            {/* Summary banner */}
            <div style={{
              borderRadius: "14px",
              background: isDark ? "rgba(168,85,247,0.14)" : "rgba(168,85,247,0.08)",
              border: `1px solid ${isDark ? "rgba(168,85,247,0.28)" : "rgba(168,85,247,0.18)"}`,
              padding: "0.9rem 1.1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.2rem",
            }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: isDark ? "rgba(255,255,255,0.55)" : "#6b7280", marginBottom: "0.2rem" }}>
                  {bannerLabel}
                </div>
                <div style={{ fontSize: "1.7rem", fontWeight: 800, color: isDark ? "#c084fc" : "#7e22ce", letterSpacing: "-0.03em", fontFamily: "var(--font-inter), sans-serif" }}>
                  {bannerMetric}
                </div>
              </div>
              {isSurging && (
                <div style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "10px",
                  padding: "0.4rem 0.75rem",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#f87171",
                }}>
                  ⚡ SURGE ACTIVE
                </div>
              )}
            </div>

            {/* Prediction rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              {rows.map((row, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.85rem 1rem",
                  borderRadius: "12px",
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
                }}>
                  {/* Icon */}
                  <div style={{ fontSize: "1.15rem", lineHeight: 1, marginTop: "0.1rem", flexShrink: 0 }}>{row.icon}</div>
                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.82rem", color: isDark ? "#e5e7eb" : "#111", marginBottom: "0.15rem", fontFamily: "var(--font-inter), sans-serif" }}>
                      {row.label}
                    </div>
                    {row.detail && (
                      <div style={{ fontSize: "0.7rem", color: isDark ? "rgba(255,255,255,0.45)" : "#6b7280", lineHeight: 1.5 }}>
                        {row.detail}
                      </div>
                    )}
                  </div>
                  {/* Value + Confidence */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.88rem", color: isDark ? "#c084fc" : "#7e22ce", fontFamily: "var(--font-inter), sans-serif" }}>
                      {row.value}
                    </span>
                    <span style={{
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      color: confidenceColor(row.confidence),
                      background: `${confidenceColor(row.confidence)}18`,
                      padding: "0.1rem 0.45rem",
                      borderRadius: "99px",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}>
                      {confidenceLabel(row.confidence)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ marginTop: "1.2rem", fontSize: "0.67rem", color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af", textAlign: "center", fontFamily: "var(--font-inter), sans-serif" }}>
              Powered by rolling telemetry analytics · dV/dt slope · Phase 1 AI Engine
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────
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
  const [modalOpen, setModalOpen] = useState(false);

  // ─── Phase 1: Analytics from real historyRecords ──────────────────────────
  const analytics = useMemo(() => {
    const now = Date.now();
    const onlineRecords = historyRecords.filter(r => !r.isOffline && r.power >= 0);

    const window15min = 15 * 60 * 1000;
    const recent15 = onlineRecords.filter(r => now - r.timestamp <= window15min);
    const rollingAvgPower = recent15.length > 0
      ? recent15.reduce((sum, r) => sum + r.power, 0) / recent15.length
      : null;

    const window2h = 2 * 60 * 60 * 1000;
    const baseline2h = onlineRecords.filter(r => now - r.timestamp <= window2h);
    const baselineAvgPower = baseline2h.length > 0
      ? baseline2h.reduce((sum, r) => sum + r.power, 0) / baseline2h.length
      : null;

    const isSurging = rollingAvgPower !== null && baselineAvgPower !== null && baselineAvgPower > 0
      ? rollingAvgPower >= baselineAvgPower * 1.5
      : false;

    const window30min = 30 * 60 * 1000;
    const volt30 = onlineRecords
      .filter(r => now - r.timestamp <= window30min)
      .sort((a, b) => a.timestamp - b.timestamp);
    let dvdtPerHour: number | null = null;
    if (volt30.length >= 2) {
      const first = volt30[0];
      const last = volt30[volt30.length - 1];
      const dtHours = (last.timestamp - first.timestamp) / 3600000;
      if (dtHours > 0) dvdtPerHour = (last.voltage - first.voltage) / dtHours;
    }

    return { rollingAvgPower, baselineAvgPower, isSurging, dvdtPerHour, recentCount: recent15.length };
  }, [historyRecords]);

  const nominalVoltage = voltage && voltage > 10 ? voltage : 12.8;
  const totalWh = batteryCapacityAh * nominalVoltage;

  const effectivePower = analytics.rollingAvgPower !== null && analytics.rollingAvgPower > 0
    ? analytics.rollingAvgPower
    : Math.max(15, power);

  const powerSourceLabel = analytics.recentCount >= 3
    ? `15-min avg · ${Math.round(effectivePower)}W`
    : `Instant · ${Math.round(effectivePower)}W`;

  let bannerLabel = "Estimated backup at current load";
  let bannerMetric = "—";
  let conditionText = "If SOC falls below 50%,";
  let headlineText = "TV and Lights will be disconnected first";
  let reasonText = "to preserve battery runtime.";

  let hoursBackup = 0;
  let hoursToFull = 0;

  if (isCharging) {
    const remainingToFullWh = ((100 - Math.min(100, soc)) / 100) * totalWh;
    const chargePowerW = Math.max(80, effectivePower);
    hoursToFull = remainingToFullWh / (chargePowerW * 0.92);
    bannerLabel = analytics.recentCount >= 3 ? `Est. time to full (${powerSourceLabel})` : "Estimated time to full charge";
    bannerMetric = formatHoursMinutes(hoursToFull);
    conditionText = "System is actively charging,";
    headlineText = "Auto load shedding is currently standby";
    reasonText = "all circuits remain continuously powered.";
  } else {
    const safeUsableSoc = Math.max(0, soc - 5);
    const usableWh = (safeUsableSoc / 100) * totalWh;
    if (analytics.dvdtPerHour !== null && analytics.dvdtPerHour < 0) {
      const voltageRange = 13.2 - 12.0;
      const socFromVoltage = Math.max(0, Math.min(100, ((nominalVoltage - 12.0) / voltageRange) * 100));
      const hoursUntilEmpty = (socFromVoltage / 100) / Math.abs(analytics.dvdtPerHour / voltageRange);
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

    const nonEssential = loads.find(l => l.level === "non-essential") || loads[2];
    const major = loads.find(l => l.level === "major") || loads[1];
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
      conditionText = "Critical Battery Warning (SOC ≤ 10%),";
      headlineText = "Immediate solar/mains recharge required";
      reasonText = "all load outputs are on reserve power.";
    }
  }

  // ─── Build AI Prediction Rows for modal ──────────────────────────────────
  const predictionRows: PredictionRow[] = useMemo(() => {
    const rows: PredictionRow[] = [];

    if (isCharging) {
      rows.push({
        icon: "⚡",
        label: "Estimated time to full charge",
        value: formatHoursMinutes(hoursToFull),
        confidence: analytics.recentCount >= 3 ? "high" : "medium",
        detail: `Based on ${Math.round(effectivePower)}W average charge rate at ${Math.round(soc)}% SOC`,
      });
      rows.push({
        icon: "🔋",
        label: "Usable energy when full",
        value: `${Math.round(totalWh)}Wh`,
        confidence: "high",
        detail: `${batteryCapacityAh}Ah × ${nominalVoltage.toFixed(1)}V nominal = ${Math.round(totalWh)}Wh total capacity`,
      });
      rows.push({
        icon: "🛡️",
        label: "Load shedding status",
        value: "Standby",
        confidence: "high",
        detail: "Auto load management inactive during charging — all circuits powered",
      });
      rows.push({
        icon: "🌡️",
        label: "Charge efficiency estimate",
        value: "~92%",
        confidence: "medium",
        detail: "LiFePO4 Coulombic efficiency calibrated at 92% for runtime projections",
      });
    } else {
      rows.push({
        icon: "⏱️",
        label: "Estimated backup runtime",
        value: formatHoursMinutes(hoursBackup),
        confidence: analytics.dvdtPerHour !== null && analytics.recentCount >= 3 ? "high" : analytics.recentCount >= 3 ? "medium" : "low",
        detail: analytics.dvdtPerHour !== null
          ? `Blended estimate: 60% Wh-based + 40% dV/dt slope (${analytics.dvdtPerHour.toFixed(3)}V/hr)`
          : `Wh-based estimate from ${Math.round(effectivePower)}W average draw`,
      });
      rows.push({
        icon: "📊",
        label: "Rolling 15-min average load",
        value: analytics.rollingAvgPower !== null ? `${Math.round(analytics.rollingAvgPower)}W` : `${Math.round(power)}W (instant)`,
        confidence: analytics.recentCount >= 5 ? "high" : analytics.recentCount >= 2 ? "medium" : "low",
        detail: `${analytics.recentCount} reading(s) in last 15 min · baseline 2hr avg: ${analytics.baselineAvgPower !== null ? Math.round(analytics.baselineAvgPower) + "W" : "N/A"}`,
      });
      rows.push({
        icon: "⚡",
        label: "Surge detection",
        value: analytics.isSurging ? "ACTIVE" : "Normal",
        confidence: analytics.baselineAvgPower !== null && analytics.rollingAvgPower !== null ? "high" : "low",
        detail: analytics.isSurging
          ? `Current load is ≥1.5× 2-hour baseline (${Math.round(analytics.rollingAvgPower ?? 0)}W vs ${Math.round(analytics.baselineAvgPower ?? 0)}W baseline)`
          : "Current load is within normal operating range",
      });
      rows.push({
        icon: "📉",
        label: "Voltage drop rate (dV/dt)",
        value: analytics.dvdtPerHour !== null ? `${analytics.dvdtPerHour.toFixed(3)}V/hr` : "Insufficient data",
        confidence: analytics.dvdtPerHour !== null ? "high" : "low",
        detail: "Measured over last 30-min window · negative = discharging · used to refine runtime model",
      });
      rows.push({
        icon: "🔋",
        label: "Usable energy remaining",
        value: `~${Math.round(((Math.max(0, soc - 5)) / 100) * totalWh)}Wh`,
        confidence: "high",
        detail: `${Math.max(0, soc - 5)}% usable SOC (5% reserve floor) × ${Math.round(totalWh)}Wh total capacity`,
      });
      rows.push({
        icon: "🪛",
        label: "Next predicted load shed",
        value: soc > 50 ? "at 50% SOC" : soc > 30 ? "at 30% SOC" : soc > 10 ? "at 10% SOC" : "NOW",
        confidence: "high",
        detail: soc > 50
          ? `Non-essential circuit will shed at 50% SOC (currently ${Math.round(soc)}%)`
          : soc > 30
          ? `Major circuit shed threshold at 30% SOC (currently ${Math.round(soc)}%)`
          : "Entering emergency reserve — critical circuits on reserve power",
      });
    }
    return rows;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyRecords, soc, voltage, power, isCharging, loads, batteryCapacityAh, analytics]);

  const textColor = isDark ? "#ffffff" : "#111111";
  const subtextColor = isDark ? "rgba(255, 255, 255, 0.65)" : "#4b5563";

  return (
    <>
      <BentoCard
        theme={theme}
        withShadow={withShadow}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.2rem",
          padding: "clamp(1.1rem, 3.5cqi, 1.5rem)",
          position: "relative",
          overflow: "visible",
          ...style,
        }}
        {...props}
      >
        {/* AI Sphere — top right corner */}
        <div style={{
          position: "absolute",
          top: "clamp(0.7rem, 2cqi, 1rem)",
          right: "clamp(0.7rem, 2cqi, 1rem)",
          zIndex: 2,
        }}>
          <AISphere size={42} />
        </div>

        {/* Top Header: Purple Icon + Title + Expand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.35rem", paddingRight: "52px" }}>
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
              flex: 1,
            }}
          >
            System Prediction
          </span>
          {/* Expand button */}
          <button
            onClick={() => setModalOpen(true)}
            style={{
              background: "none",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isDark ? "#9ca3af" : "#6b7280",
              opacity: 0.7,
              transition: "opacity 0.2s ease, color 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.color = isDark ? "#c084fc" : "#7e22ce";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = "0.7";
              e.currentTarget.style.color = isDark ? "#9ca3af" : "#6b7280";
            }}
            aria-label="Expand AI Predictions"
          >
            <HugeiconsIcon icon={ExpandIcon} size={18} strokeWidth={1} />
          </button>
        </div>

        {/* Main Body Prediction Statement */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", minHeight: "52px", paddingLeft: "clamp(0.35rem, 1.8cqi, 0.65rem)", marginBottom: "0.45rem" }}>
          <span style={{ fontSize: "clamp(0.68rem, 2.2cqi, 0.82rem)", fontWeight: 400, color: subtextColor, fontFamily: "var(--font-inter), sans-serif" }}>
            {conditionText}
          </span>
          <span style={{ fontSize: "clamp(0.78rem, 2.5cqi, 0.95rem)", fontWeight: 700, color: textColor, fontFamily: "var(--font-inter), sans-serif", letterSpacing: "-0.01em", lineHeight: 1.3 }}>
            {headlineText}
          </span>
          <span style={{ fontSize: "clamp(0.68rem, 2.2cqi, 0.82rem)", fontWeight: 400, color: subtextColor, fontFamily: "var(--font-inter), sans-serif" }}>
            {reasonText}
          </span>
        </div>

        {/* Bottom Banner */}
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
          <span style={{ fontSize: "clamp(0.62rem, 1.8cqi, 0.76rem)", fontWeight: 500, color: isDark ? "rgba(255, 255, 255, 0.7)" : "#4b5563", fontFamily: "var(--font-inter), sans-serif" }}>
            {bannerLabel}
          </span>
          <span style={{ fontSize: "clamp(0.95rem, 3.2cqi, 1.25rem)", fontWeight: 700, color: isDark ? "#c084fc" : "#7e22ce", fontFamily: "var(--font-inter), sans-serif", letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
            {bannerMetric}
          </span>
        </div>
      </BentoCard>

      {/* Expanded Modal */}
      <PredictionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isDark={isDark}
        rows={predictionRows}
        bannerMetric={bannerMetric}
        bannerLabel={bannerLabel}
        isSurging={analytics.isSurging}
      />
    </>
  );
}
