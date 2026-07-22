"use client";

import React, { useEffect, useRef, useState } from "react";
import BentoCard from "./BentoCard";
import BatteryArc from "./BatteryArc";
import { CardTheme } from "./BentoCard";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FlashIcon,
  PulseRectangle02Icon,
  AtomicPowerIcon,
  TemperatureIcon,
  BatteryEmptyIcon,
  BatteryLowIcon,
  BatteryMedium01Icon,
  BatteryMedium02Icon,
  BatteryFullIcon,
  Clock01Icon,
  ShieldCheck,
  Exchange01Icon,
  BatteryCharging01Icon,
  ExpandIcon
} from "@hugeicons/core-free-icons";

interface BatteryPercentageProps extends React.HTMLAttributes<HTMLDivElement> {
  soc?: number;
  isCharging?: boolean;
  temperature?: number;
  soh?: number;
  cycleCount?: number;
  /** Optional overrides for future real-time BMS/Firebase telemetry */
  dischargeRuntime?: string;
  chargeTimeToFull?: string;
  voltage?: number;
  current?: number;
  power?: number;
  remainingCapacity?: number;
  fullCapacity?: number;
  theme?: CardTheme;
  withShadow?: boolean;
  onExpandClick?: (metric: "voltage" | "current" | "power" | "temperature") => void;
}

export default function BatteryPercentage({
  soc,
  isCharging,
  temperature,
  soh,
  cycleCount,
  dischargeRuntime,
  chargeTimeToFull,
  voltage: propVoltage,
  current: propCurrent,
  power: propPower,
  remainingCapacity,
  fullCapacity,
  theme = "light",
  withShadow = true,
  onExpandClick,
  style,
  ...props
}: BatteryPercentageProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#ffffff" : "#111111";
  const grayText = isDark ? "#9ca3af" : "#6b7280";
  const cardBg = isDark ? "rgba(255, 255, 255, 0.02)" : "#fbfcfd";
  const cardBorder = isDark ? "rgba(255, 255, 255, 0.06)" : "#e5e7eb";

  const gridRef = useRef<HTMLDivElement>(null);
  const [gaugeSize, setGaugeSize] = useState(150); // Default fallback size

  // Dynamically measure the height of the 2x2 bento grid and set the battery arc size to match it exactly
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const ro = new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height;
      if (height > 0) {
        setGaugeSize(height);
      }
    });
    ro.observe(grid);
    const initialH = grid.getBoundingClientRect().height;
    if (initialH > 0) {
      setGaugeSize(initialH);
    }
    return () => ro.disconnect();
  }, []);

  // Compute realistic battery physics based on SOC, with Firebase telemetry overrides
  const packVoltage = propVoltage !== undefined
    ? propVoltage.toFixed(2)
    : (soc !== undefined ? (12.2 + (soc / 100) * 1.3).toFixed(2) : "—");

  const current = propCurrent !== undefined
    ? propCurrent.toFixed(2)
    : (soc !== undefined ? (isCharging ? 4.5 : 0.0).toFixed(2) : "—");

  const power = propPower !== undefined
    ? Math.round(propPower).toString()
    : (packVoltage !== "—" && current !== "—" ? Math.round(parseFloat(packVoltage) * parseFloat(current)).toString() : "—");

  // NOTE: The calculation formulas below are realistic client-side fallbacks.
  // In the future, these values will be supplied directly from the BMS via Firebase
  // using the props `dischargeRuntime` and `chargeTimeToFull`.

  // Compute discharge runtime estimation (only active when discharging)
  const getDischargeRuntime = () => {
    if (dischargeRuntime) return dischargeRuntime; // Use Firebase telemetry override if available
    if (soc === undefined) return "—";
    if (soc <= 0) return "Empty";

    const activeCurrent = propCurrent !== undefined ? Math.abs(propCurrent) : undefined;

    // If no real current from props, fall back to mock calculation
    if (activeCurrent === undefined) {
      const hours = Math.floor((soc * 15) / 60);
      const minutes = Math.round((soc * 15) % 60);
      return `${hours}h ${minutes}m`;
    }

    if (activeCurrent < 0.05) {
      return "Idle / No Load";
    }

    const activeCapacity = remainingCapacity !== undefined
      ? remainingCapacity
      : (soc / 100) * 100.38;

    const totalHours = activeCapacity / activeCurrent;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    if (hours > 999) return ">999h";
    return `${hours}h ${minutes}m`;
  };

  // Compute charge time to full estimation (only active when charging)
  const getChargeTimeToFull = () => {
    if (chargeTimeToFull) return chargeTimeToFull; // Use Firebase telemetry override if available
    if (soc === undefined) return "—";
    if (soc >= 100) return "Full";

    const activeCurrent = propCurrent !== undefined ? Math.abs(propCurrent) : undefined;

    // If no real current from props, fall back to mock calculation
    if (activeCurrent === undefined) {
      const remainingSoc = 100 - soc;
      const hours = Math.floor((remainingSoc * 10) / 60);
      const minutes = Math.round((remainingSoc * 10) % 60);
      return `${hours}h ${minutes}m`;
    }

    if (activeCurrent < 0.05) {
      return "Idle / Low Current";
    }

    const activeCapacity = remainingCapacity !== undefined
      ? remainingCapacity
      : (soc / 100) * 100.38;

    const activeFullCapacity = fullCapacity !== undefined ? fullCapacity : 100.0;
    const capacityNeeded = Math.max(0, activeFullCapacity - activeCapacity);

    const totalHours = capacityNeeded / activeCurrent;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    if (hours > 999) return ">999h";
    return `${hours}h ${minutes}m`;
  };

  // Helper to dynamically fetch and rotate the remaining capacity battery icon
  const getDynamicBatteryIcon = (socVal: number | undefined) => {
    if (socVal === undefined) return BatteryEmptyIcon;
    if (socVal > 80) return BatteryFullIcon;
    if (socVal > 50) return BatteryMedium02Icon; // 3 bars
    if (socVal > 20) return BatteryMedium01Icon; // 2 bars
    if (socVal > 5) return BatteryLowIcon;
    return BatteryEmptyIcon;
  };

  const dischargeRuntimeString = getDischargeRuntime();
  const chargeTimeToFullString = getChargeTimeToFull();
  const capacityString = remainingCapacity !== undefined
    ? remainingCapacity.toFixed(1)
    : (soc !== undefined ? ((soc / 100) * 100.38).toFixed(1) : "—"); // Capacity scaling based on 100Ah battery pack
  const DynamicCapacityIcon = getDynamicBatteryIcon(soc);

  return (
    <BentoCard
      theme={theme}
      withShadow={withShadow}
      style={{
        containerType: "inline-size", // Enable container query sizing
        padding: "clamp(0.5rem, 2.5cqi, 1rem)",
        borderRadius: "calc(12px + clamp(0.5rem, 2.5cqi, 1rem))", // Concentric corner radius rule: inner_radius (12px) + padding
        display: "flex",
        flexDirection: "column",
        gap: "clamp(0.5rem, 2.5cqi, 0.85rem)",
        minWidth: 0,
        overflow: "hidden",
        width: "100%",
        ...style,
      }}
      {...props}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "clamp(0.5rem, 2.5cqi, 0.85rem)",
          width: "100%",
          minWidth: 0,
        }}
      >
        {/* ── Top Layout Panel: Gauge on Left, 2x2 Grid on Right (Locked Side-by-Side) ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "row", // Enforce side-by-side row layout on all viewports
            alignItems: "flex-start", // Top align items so gauge and grid share the same starting baseline
            gap: "clamp(0.5rem, 3.5cqi, 1rem)", // Dynamic gap spacing columns out
            width: "100%",
            minWidth: 0,
          }}
        >
          {/* Gauge Column - Size tracks grid height dynamically */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: `0 0 ${gaugeSize}px`, // Column size matches the measured grid height exactly
              width: `${gaugeSize}px`,
              padding: "0.25rem 0",
              minWidth: 0,
            }}
          >
            <BatteryArc
              soc={soc}
              isCharging={isCharging}
              theme={theme}
              size={gaugeSize - 12} // Tracks grid height with a tight offset to maximize size
              label="SOC"
            />
            {/* Status Pill Badge */}
            <div style={{ marginTop: "-0.2rem" }}>
              {isCharging ? (
                <span
                  style={{
                    background: isDark ? "rgba(74, 222, 128, 0.1)" : "#eafee7",
                    color: isDark ? "#4ade80" : "#2a7037",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "999px",
                    fontSize: "0.58rem",
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.2rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  <HugeiconsIcon icon={BatteryCharging01Icon} size={11} strokeWidth={2} color="currentColor" />
                  Charging Idle
                </span>
              ) : (
                <span
                  style={{
                    background: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
                    color: isDark ? "#a1a1aa" : "#52525b",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "999px",
                    fontSize: "0.58rem",
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.2rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  <HugeiconsIcon icon={DynamicCapacityIcon} size={11} strokeWidth={2} color="currentColor" style={{ opacity: 0.6, transform: "rotate(-90deg)" }} />
                  Discharging
                </span>
              )}
            </div>
          </div>

          <div
            ref={gridRef}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gridTemplateRows: "auto auto", // Let rows wrap naturally depending on children
              gap: "0.6rem", // Increased gap to match gauge height
              flex: 1,
              width: "100%",
              minWidth: 0,
              alignSelf: "flex-start", // Let the grid shrink to fit its content height naturally
              marginTop: "0.5rem",
            }}
          >
            <div
              style={{
                position: "relative",
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: "12px",
                padding: "0.68rem 0.5rem", // Increased padding
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
                minWidth: 0,
                height: "auto",
                transition: "background-color 0.2s ease, border-color 0.2s ease",
              }}
            >
              <button
                type="button"
                onClick={() => onExpandClick?.("voltage")}
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  background: "none",
                  border: "none",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  opacity: 0.5,
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "opacity 0.2s ease, color 0.2s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.color = isDark ? "#ffffff" : "#111111";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = "0.5";
                  e.currentTarget.style.color = isDark ? "#9ca3af" : "#6b7280";
                }}
                aria-label="Expand Voltage History"
              >
                <HugeiconsIcon icon={ExpandIcon} size={11} strokeWidth={1.5} />
              </button>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: isDark ? "rgba(74, 222, 128, 0.08)" : "#eafee7",
                  color: isDark ? "#4ade80" : "#0d9b0d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <HugeiconsIcon icon={FlashIcon} size={13} strokeWidth={2} color="currentColor" />
              </div>
              <div style={{ fontSize: "clamp(0.8rem, 3.8cqi, 0.95rem)", fontWeight: 700, color: textColor, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {packVoltage} {packVoltage !== "—" && <span style={{ fontSize: "0.6rem", fontWeight: 400, color: grayText }}>V</span>}
              </div>
              <div style={{ fontSize: "clamp(0.5rem, 2.2cqi, 0.58rem)", color: grayText, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Pack Voltage
              </div>
            </div>

            <div
              style={{
                position: "relative",
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: "12px",
                padding: "0.68rem 0.5rem", // Increased padding
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
                minWidth: 0,
                height: "auto",
                transition: "background-color 0.2s ease, border-color 0.2s ease",
              }}
            >
              <button
                type="button"
                onClick={() => onExpandClick?.("current")}
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  background: "none",
                  border: "none",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  opacity: 0.5,
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "opacity 0.2s ease, color 0.2s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.color = isDark ? "#ffffff" : "#111111";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = "0.5";
                  e.currentTarget.style.color = isDark ? "#9ca3af" : "#6b7280";
                }}
                aria-label="Expand Current History"
              >
                <HugeiconsIcon icon={ExpandIcon} size={11} strokeWidth={1.5} />
              </button>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: isDark ? "rgba(45, 212, 191, 0.08)" : "#f0fdfa",
                  color: isDark ? "#2dd4bf" : "#0f766e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <HugeiconsIcon icon={PulseRectangle02Icon} size={13} strokeWidth={2} color="currentColor" />
              </div>
              <div style={{ fontSize: "clamp(0.8rem, 3.8cqi, 0.95rem)", fontWeight: 700, color: textColor, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {current} {current !== "—" && <span style={{ fontSize: "0.6rem", fontWeight: 400, color: grayText }}>A</span>}
              </div>
              <div style={{ fontSize: "clamp(0.5rem, 2.2cqi, 0.58rem)", color: grayText, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Current
              </div>
            </div>

            <div
              style={{
                position: "relative",
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: "12px",
                padding: "0.68rem 0.5rem", // Increased padding
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
                minWidth: 0,
                height: "auto",
                transition: "background-color 0.2s ease, border-color 0.2s ease",
              }}
            >
              <button
                type="button"
                onClick={() => onExpandClick?.("power")}
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  background: "none",
                  border: "none",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  opacity: 0.5,
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "opacity 0.2s ease, color 0.2s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.color = isDark ? "#ffffff" : "#111111";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = "0.5";
                  e.currentTarget.style.color = isDark ? "#9ca3af" : "#6b7280";
                }}
                aria-label="Expand Power History"
              >
                <HugeiconsIcon icon={ExpandIcon} size={11} strokeWidth={1.5} />
              </button>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: isDark ? "rgba(168, 85, 247, 0.08)" : "#faf5ff",
                  color: isDark ? "#c084fc" : "#6b21a8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <HugeiconsIcon icon={AtomicPowerIcon} size={13} strokeWidth={2} color="currentColor" />
              </div>
              <div style={{ fontSize: "clamp(0.8rem, 3.8cqi, 0.95rem)", fontWeight: 700, color: textColor, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {power} {power !== "—" && <span style={{ fontSize: "0.6rem", fontWeight: 400, color: grayText }}>W</span>}
              </div>
              <div style={{ fontSize: "clamp(0.5rem, 2.2cqi, 0.58rem)", color: grayText, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Power
              </div>
            </div>

            <div
              style={{
                position: "relative",
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: "12px",
                padding: "0.68rem 0.5rem", // Increased padding
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
                minWidth: 0,
                height: "auto",
                transition: "background-color 0.2s ease, border-color 0.2s ease",
              }}
            >
              <button
                type="button"
                onClick={() => onExpandClick?.("temperature")}
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  background: "none",
                  border: "none",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  opacity: 0.5,
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "opacity 0.2s ease, color 0.2s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.color = isDark ? "#ffffff" : "#111111";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.opacity = "0.5";
                  e.currentTarget.style.color = isDark ? "#9ca3af" : "#6b7280";
                }}
                aria-label="Expand Temperature History"
              >
                <HugeiconsIcon icon={ExpandIcon} size={11} strokeWidth={1.5} />
              </button>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: isDark ? "rgba(59, 130, 246, 0.08)" : "#eff6ff",
                  color: isDark ? "#60a5fa" : "#1d4ed8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <HugeiconsIcon icon={TemperatureIcon} size={13} strokeWidth={2} color="currentColor" />
              </div>
              <div style={{ fontSize: "clamp(0.8rem, 3.8cqi, 0.95rem)", fontWeight: 700, color: textColor, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {temperature !== undefined ? temperature.toFixed(1) : "—"} {temperature !== undefined && <span style={{ fontSize: "0.6rem", fontWeight: 400, color: grayText }}>°C</span>}
              </div>
              <div style={{ fontSize: "clamp(0.5rem, 2.2cqi, 0.58rem)", color: grayText, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Battery Temp
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Grid Panel: 4 Columns containing details, always side-by-side ── */}
        <div
          style={{
            background: isDark ? "rgba(255, 255, 255, 0.01)" : "#f9fafb",
            border: `1px solid ${cardBorder}`,
            borderRadius: "12px",
            padding: "0.75rem clamp(0.35rem, 2cqi, 0.6rem)", // Increased vertical padding to 0.75rem for extra thickness
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)", // Always 4 columns horizontally
            gap: "clamp(0.2rem, 1vw, 0.4rem)",
            width: "100%",
            minWidth: 0,
          }}
        >
          {/* Detail 1: Remaining Capacity */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(0.2rem, 1.2vw, 0.35rem)",
              borderRight: `1px solid ${cardBorder}`,
              paddingRight: "0.2rem",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "28px", // Increased icon circle diameter to 28px for visual thickness
                height: "28px",
                borderRadius: "50%",
                background: isDark ? "rgba(74, 222, 128, 0.08)" : "#eafee7",
                color: isDark ? "#4ade80" : "#0d9b0d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <HugeiconsIcon icon={DynamicCapacityIcon} size={14} color="currentColor" strokeWidth={2} style={{ transform: "rotate(-90deg)" }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "clamp(0.5rem, 2cqi, 0.58rem)", color: grayText, fontWeight: 500, textTransform: "capitalize", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.15 }}>
                Capacity
              </div>
              <div style={{ fontSize: "clamp(0.7rem, 2.5cqi, 0.8rem)", fontWeight: 700, color: textColor, marginTop: "0.02rem", lineHeight: 1.1 }}>
                {capacityString} {capacityString !== "—" && <span style={{ fontSize: "0.55rem", fontWeight: 400, color: grayText }}>Ah</span>}
              </div>
            </div>
          </div>

          {/* Detail 2: Estimated Runtime (Discharge) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(0.2rem, 1.2vw, 0.35rem)",
              borderRight: `1px solid ${cardBorder}`,
              paddingRight: "0.2rem",
              paddingLeft: "0.2rem",
              minWidth: 0,
              opacity: isCharging ? 0.35 : 1, // Greyed out when charging
              transition: "opacity 0.2s ease",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: isDark ? "rgba(59, 130, 246, 0.08)" : "#eff6ff",
                color: isDark ? "#60a5fa" : "#1d4ed8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <HugeiconsIcon icon={Clock01Icon} size={14} color="currentColor" strokeWidth={2} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "clamp(0.5rem, 2cqi, 0.58rem)", color: grayText, fontWeight: 500, textTransform: "capitalize", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.15 }}>
                Runtime
              </div>
              <div style={{ fontSize: "clamp(0.7rem, 2.5cqi, 0.8rem)", fontWeight: 700, color: textColor, marginTop: "0.02rem", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {isCharging ? "—" : dischargeRuntimeString}
              </div>
            </div>
          </div>

          {/* Detail 3: Time to Charge Full */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(0.2rem, 1.2vw, 0.35rem)",
              borderRight: `1px solid ${cardBorder}`,
              paddingRight: "0.2rem",
              paddingLeft: "0.2rem",
              minWidth: 0,
              opacity: isCharging ? 1 : 0.35, // Greyed out when discharging
              transition: "opacity 0.2s ease",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: isDark ? "rgba(168, 85, 247, 0.08)" : "#faf5ff",
                color: isDark ? "#c084fc" : "#6b21a8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <HugeiconsIcon icon={BatteryCharging01Icon} size={14} color="currentColor" strokeWidth={2} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "clamp(0.5rem, 2cqi, 0.58rem)", color: grayText, fontWeight: 500, textTransform: "capitalize", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.15 }}>
                Time to Full
              </div>
              <div style={{ fontSize: "clamp(0.7rem, 2.5cqi, 0.8rem)", fontWeight: 700, color: textColor, marginTop: "0.02rem", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {isCharging ? chargeTimeToFullString : "—"}
              </div>
            </div>
          </div>

          {/* Detail 4: SOH (Shifted to the last column!) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(0.2rem, 1.2vw, 0.35rem)",
              paddingLeft: "0.2rem",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: isDark ? "rgba(248, 113, 113, 0.08)" : "#fef2f2",
                color: isDark ? "#f87171" : "#b91c1c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <HugeiconsIcon icon={ShieldCheck} size={14} color="currentColor" strokeWidth={2} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "clamp(0.5rem, 2cqi, 0.58rem)", color: grayText, fontWeight: 500, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.15 }}>
                SOH
              </div>
              <div style={{ fontSize: "clamp(0.7rem, 2.5cqi, 0.8rem)", fontWeight: 700, color: textColor, marginTop: "0.02rem", lineHeight: 1.1 }}>
                {soh !== undefined ? soh : "—"} {soh !== undefined && <span style={{ fontSize: "0.55rem", fontWeight: 400, color: grayText }}>%</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
