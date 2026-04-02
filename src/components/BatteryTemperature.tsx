"use client";

import React from "react";
import { motion } from "framer-motion";
import { Thermometer, TrendingUp, TrendingDown, Activity } from "lucide-react";
import BentoCard, { CardTheme } from "./BentoCard";
import TempSparkline from "./TempSparkline";

// ─── Types ────────────────────────────────────────────────────────────────────

type ThermalTrend = "rising" | "stable" | "falling";

export interface BatteryTemperatureProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary displayed temp (°C) — from Firebase JK BMS e.g. firebaseData.batteryTemp */
  temperature?: number;
  /** MOSFET sensor temp — firebaseData.mosfetTemp */
  mosfetTemp?: number;
  /** Cell sensor temp — firebaseData.cellTemp */
  cellTemp?: number;
  /** Highest temp recorded today — firebaseData.peakTempToday */
  peakTempToday?: number;
  /** Thermal trend derived from recent readings */
  trend?: ThermalTrend;
  lastUpdated?: string;
  theme?: CardTheme;
  withShadow?: boolean;
}

// ─── Thermal status thresholds ────────────────────────────────────────────────

function thermalProfile(temp: number, isDark: boolean) {
  if (temp < 45) return {
    label: "Optimal",
    accentColor: "#4ade80",
    pillBg: isDark ? "rgba(74,222,128,0.1)" : "#eafee7",
    pillText: isDark ? "#86efac" : "#2a7037",
    critical: false,
  };
  if (temp < 60) return {
    label: "Warm",
    accentColor: "#f97316",
    pillBg: isDark ? "rgba(249,115,22,0.1)" : "#fff7ed",
    pillText: isDark ? "#fdba74" : "#9a3412",
    critical: false,
  };
  return {
    label: "Critical",
    accentColor: "#ff2d2d",
    pillBg: isDark ? "rgba(255, 30, 30, 0.14)" : "#fef2f2",
    pillText: isDark ? "#ff4444" : "#991b1b",
    critical: true,
  };
}

// ─── Trend helpers ────────────────────────────────────────────────────────────

function TrendIcon({ trend, color }: { trend: ThermalTrend; color: string }) {
  const p = { size: 16, strokeWidth: 2.2, color };
  if (trend === "rising") return <TrendingUp  {...p} />;
  if (trend === "falling") return <TrendingDown {...p} />;
  return <Activity {...p} />;;
}

function trendLabel(trend: ThermalTrend) {
  return trend === "rising" ? "Rising" : trend === "falling" ? "Falling" : "Stable";
}

// ─── Dynamic Thermometer Icon ──────────────────────────────────────────────────

function DynamicThermometer({ label, color }: { label: string; color: string }) {
  const isFull = label === "Critical";
  const isMid = label === "Warm";

  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: "middle" }}
    >
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
      {/* Bulb fill (oversized slightly to hide gaps) */}
      <circle cx="12" cy="18" r="3.2" fill={color} stroke="none" />
      {/* Mercury fill — connects to bulb */}
      <rect
        x="10.8"
        y={isFull ? "6" : isMid ? "11" : "15"}
        width="2.4"
        height={isFull ? "11" : isMid ? "6" : "2"}
        fill={color}
        stroke="none"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BatteryTemperature({
  temperature = 25,
  mosfetTemp = 42,
  cellTemp = 31,
  peakTempToday = 48,
  trend = "stable",
  lastUpdated = "2s ago",
  theme = "light",
  withShadow = true,
  style,
  ...props
}: BatteryTemperatureProps) {

  const isDark = theme === "dark";
  const textColor = isDark ? "#fff" : "#111";
  const grayText = isDark ? "#9ca3af" : "#6b7280";
  const lightGrayText = isDark ? "#666" : "#9ca3af";
  const thermal = thermalProfile(temperature, isDark);

  const trendColor =
    trend === "rising" ? (thermal.label === "Critical" ? "#ef4444" : "#f97316")
      : trend === "falling" ? "#22c55e"
        : "#94a3b8";

  // Pill — pulses when critical
  const PillContent = (
    <>
      <DynamicThermometer label={thermal.label} color={thermal.pillText} />
      {thermal.label}
    </>
  );
  const pillStyle: React.CSSProperties = {
    background: thermal.pillBg,
    color: thermal.pillText,
    padding: "0.45rem 0.9rem",
    borderRadius: "999px",
    fontSize: "0.9rem",
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    letterSpacing: "0",
  };

  return (
    <BentoCard theme={theme} withShadow={withShadow} style={{ padding: "2.5rem", ...style }} {...props}>

      {/* ── Top Header ── */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <h2 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 400, color: grayText, letterSpacing: "0.01em" }}>
          Battery Temperature
        </h2>

        {/* Hero temp + status pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.6rem" }}>
          <span style={{ fontSize: "2.5rem", fontWeight: 500, color: textColor, lineHeight: 1, letterSpacing: "0" }}>
            {temperature}°C
          </span>

          {thermal.critical ? (
            <span style={pillStyle}>{PillContent}</span>
            /* Glow animation commented out
            isDark ? (
              <span style={pillStyle}>{PillContent}</span>
            ) : (
              <motion.span
                style={pillStyle}
                animate={{ boxShadow: [
                  `0 0 0px 0px ${thermal.accentColor}00`,
                  `0 0 8px 1px ${thermal.accentColor}22`,
                  `0 0 0px 0px ${thermal.accentColor}00`,
                ]}}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              >
                {PillContent}
              </motion.span>
            )
            */
          ) : (
            <span style={pillStyle}>{PillContent}</span>
          )}
        </div>

        {/* Last updated */}
        <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
          <span style={{ color: lightGrayText, fontWeight: 300 }}>Last updated: </span>
          <span style={{ color: isDark ? "#b4b4b4" : "#a9b3c0", fontWeight: 400 }}>{lastUpdated}</span>
        </div>
      </div>

      {/* ── Middle: Temperature Sparkline ── */}
      <div style={{ marginTop: "1.8rem" }}>
        <TempSparkline temperature={temperature} theme={theme} height={120} />
      </div>

      {/* ── Bottom: Horizontal Stats Row ── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.6rem", gap: "1rem", flexWrap: "wrap" }}>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", color: grayText, letterSpacing: "0.03em" }}>MOSFET</span>
          <span style={{ fontSize: "1.1rem", fontWeight: 500, color: textColor }}>{mosfetTemp}°C</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", color: grayText, letterSpacing: "0.03em" }}>Cells</span>
          <span style={{ fontSize: "1.1rem", fontWeight: 500, color: textColor }}>{cellTemp}°C</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", color: grayText, letterSpacing: "0.03em" }}>Peak Today</span>
          <span style={{ fontSize: "1.1rem", fontWeight: 500, color: textColor }}>{peakTempToday}°C</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <span style={{ fontSize: "0.85rem", color: grayText, letterSpacing: "0.03em" }}>Trend</span>
          <span style={{ fontSize: "1.1rem", fontWeight: 500, color: trendColor, display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <TrendIcon trend={trend} color={trendColor} />
            {trendLabel(trend)}
          </span>
        </div>

      </div>
    </BentoCard>
  );
}
