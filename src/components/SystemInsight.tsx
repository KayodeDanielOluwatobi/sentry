"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  FlashIcon,
  ChipIcon,
  Layers01Icon,
  Analytics01Icon,
  BatteryCharging01Icon,
  Exchange01Icon,
  TemperatureIcon
} from "@hugeicons/core-free-icons";
import BentoCard, { CardTheme } from "./BentoCard";

export interface SystemInsightProps extends React.HTMLAttributes<HTMLDivElement> {
  soc?: number;
  isCharging?: boolean;
  temperature?: number;
  currentLoad?: number;
  cellVoltages?: number[];
  theme?: CardTheme;
  withShadow?: boolean;
}

export default function SystemInsight({
  soc = 89,
  isCharging = true,
  temperature = 28.9,
  currentLoad = 450,
  cellVoltages = [3.199, 3.197, 3.196, 3.199],
  theme = "light",
  withShadow = true,
  style,
  ...props
}: SystemInsightProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#ffffff" : "#111111";
  const grayText = isDark ? "#9ca3af" : "#6b7280";
  const lightGrayText = isDark ? "#666" : "#9ca3af";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Calculate Discharge Runtime Estimation
  const getDischargeRuntime = () => {
    if (soc <= 0) return "Empty";
    const hours = Math.floor((soc * 15) / 60);
    const minutes = Math.round((soc * 15) % 60);
    return `${hours}h ${minutes}m`;
  };

  // 2. Calculate Charge Time to Full
  const getChargeTimeToFull = () => {
    if (soc >= 100) return "Full";
    const remainingSoc = 100 - soc;
    const hours = Math.floor((remainingSoc * 10) / 60);
    const minutes = Math.round((remainingSoc * 10) % 60);
    return `${hours}h ${minutes}m`;
  };

  const dischargeRuntimeString = getDischargeRuntime();
  const chargeTimeToFullString = getChargeTimeToFull();

  // 3. Compile Dynamic Insights List
  const insights = [];

  // Insight A: Charging Progress / Backup Time (Primary Status)
  if (isCharging) {
    insights.push({
      id: "charging",
      title: "Charging Status",
      value: `${chargeTimeToFullString} to full`,
      subtext: `Active power feed is replenishing cells. Current pack SOC: ${soc}%.`,
      icon: BatteryCharging01Icon,
      bg: isDark ? "rgba(168, 85, 247, 0.12)" : "#faf5ff",
      textColor: isDark ? "#c084fc" : "#6b21a8",
      priority: 10
    });
  } else {
    insights.push({
      id: "backup",
      title: "Estimated Backup",
      value: `${dischargeRuntimeString} remaining`,
      subtext: "Capacity runtime computed against current load demand.",
      icon: Clock01Icon,
      bg: isDark ? "rgba(59, 130, 246, 0.12)" : "#eff6ff",
      textColor: isDark ? "#60a5fa" : "#1d4ed8",
      priority: 10
    });
  }

  // Insight B: Thermal Status (Prioritized if temperature warning is active)
  const isHot = temperature > 45;
  insights.push({
    id: "thermal",
    title: "Thermal Status",
    value: `${temperature.toFixed(1)}°C — ${isHot ? "Elevated" : "Optimal"}`,
    subtext: isHot
      ? "Warning: Battery temp is elevated. Coolant/fan dissipation active."
      : "Thermal profiles are nominal. No active cell heat risk.",
    icon: TemperatureIcon,
    bg: isDark 
      ? (isHot ? "rgba(249, 115, 22, 0.12)" : "rgba(45, 212, 191, 0.12)") 
      : (isHot ? "#fff7ed" : "#f0fdfa"),
    textColor: isDark 
      ? (isHot ? "#fdba74" : "#2dd4bf") 
      : (isHot ? "#9a3412" : "#0f766e"),
    priority: isHot ? 12 : 5
  });

  // Insight C: Cell Balance Delta
  const maxCell = Math.max(...cellVoltages);
  const minCell = Math.min(...cellVoltages);
  const cellDelta = Math.round((maxCell - minCell) * 1000); // in mV
  const isImbalanced = cellDelta > 15;
  insights.push({
    id: "balance",
    title: "Cell Balance Quality",
    value: `${cellDelta}mV delta (${cellDelta < 10 ? "Excellent" : "Healthy"})`,
    subtext: isImbalanced
      ? "Slight voltage variance detected across pack. Active balancing running."
      : "Cells are perfectly aligned. Pack structural SOH is 100%.",
    icon: Layers01Icon,
    bg: isDark 
      ? (isImbalanced ? "rgba(251, 191, 36, 0.12)" : "rgba(74, 222, 128, 0.12)")
      : (isImbalanced ? "#fffbeb" : "#eafee7"),
    textColor: isDark 
      ? (isImbalanced ? "#fde68a" : "#86efac")
      : (isImbalanced ? "#92400e" : "#2a7037"),
    priority: isImbalanced ? 9 : 4
  });

  // Insight D: Energy Load consumption
  insights.push({
    id: "load",
    title: "Energy Consumption",
    value: `${currentLoad}W active load`,
    subtext: `Total real-time power drawing from battery terminals: ${currentLoad}W.`,
    icon: FlashIcon,
    bg: isDark ? "rgba(168, 85, 247, 0.12)" : "#faf5ff",
    textColor: isDark ? "#c084fc" : "#6b21a8",
    priority: 3
  });

  // Insight E: Smart Load prioritized status
  const isHighLoad = currentLoad > 1000;
  insights.push({
    id: "smartload",
    title: "Smart Load Status",
    value: isHighLoad ? "Prioritization Active" : "Load Optimized",
    subtext: isHighLoad
      ? "High load trigger. Shedding non-essential grid outputs."
      : "No shedding active. All load priority channels are online.",
    icon: ChipIcon,
    bg: isDark ? "rgba(99, 102, 241, 0.12)" : "#e0e7ff",
    textColor: isDark ? "#818cf8" : "#3730a3",
    priority: isHighLoad ? 8 : 2
  });

  // Insight F: Inverter Efficiency
  const efficiency = 94 - Math.max(0, Math.floor((currentLoad - 500) / 250));
  insights.push({
    id: "efficiency",
    title: "Inverter Efficiency",
    value: `${efficiency}% efficiency`,
    subtext: "Conversion factor for DC-to-AC grid output is optimal.",
    icon: Exchange01Icon,
    bg: isDark ? "rgba(34, 197, 94, 0.12)" : "#eafee7",
    textColor: isDark ? "#86efac" : "#2a7037",
    priority: 2
  });

  // Insight G: BMS Voltage Recovery
  insights.push({
    id: "trend",
    title: "Recovery Trend",
    value: "Stable Recovery",
    subtext: "BMS battery cell recovery trend is steady, no voltage sag detected.",
    icon: Analytics01Icon,
    bg: isDark ? "rgba(20, 184, 166, 0.12)" : "#f0fdfa",
    textColor: isDark ? "#2dd4bf" : "#0f766e",
    priority: 1
  });

  // Sort by priority so that critical stats (e.g. warnings, active statuses) always surface first
  insights.sort((a, b) => b.priority - a.priority);

  // Auto rotate insights every 9 seconds
  useEffect(() => {
    const startRotation = () => {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % insights.length);
        setSecondsAgo(0);
      }, 9000);
    };

    startRotation();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [insights.length]);

  // Seconds ago timer
  useEffect(() => {
    const countTimer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(countTimer);
  }, []);

  // Force reset rotation on manual refresh click
  const handleRefresh = () => {
    setIsRotating(true);
    setCurrentIndex((prev) => (prev + 1) % insights.length);
    setSecondsAgo(0);

    // Reset autoplay interval timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length);
      setSecondsAgo(0);
    }, 9000);

    // Reset rotation icon animation after 600ms
    setTimeout(() => {
      setIsRotating(false);
    }, 600);
  };

  const activeInsight = insights[currentIndex] || insights[0];

  return (
    <BentoCard
      theme={theme}
      withShadow={withShadow}
      style={{
        padding: "1.25rem clamp(1.1rem, 4cqi, 1.6rem)",
        borderRadius: "20px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        minHeight: "140px",
        justifyContent: "space-between",
        ...style
      }}
      {...props}
    >
      {/* Header section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <h2 style={{ margin: 0, fontSize: "0.78rem", fontWeight: 600, color: grayText, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          System Insight
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "0.72rem", color: lightGrayText, fontWeight: 400 }}>
            Updated {secondsAgo === 0 ? "just now" : `${secondsAgo}s ago`}
          </span>
          <button
            onClick={handleRefresh}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: grayText,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              transition: "background 0.2s ease, color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
              e.currentTarget.style.color = textColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = grayText;
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isRotating ? "rotate(360deg)" : "rotate(0deg)",
                transition: isRotating ? "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
              }}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73" />
            </svg>
          </button>
        </div>
      </div>

      {/* Slide & Fade animation viewport container */}
      <div style={{ overflow: "hidden", minHeight: "72px", display: "flex", alignItems: "center", position: "relative", width: "100%" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeInsight.id}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(0.85rem, 3.5cqi, 1.25rem)",
              width: "100%",
            }}
          >
            {/* Left: Icon Badge */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: activeInsight.bg,
                color: activeInsight.textColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.3s ease, color 0.3s ease",
              }}
            >
              <HugeiconsIcon icon={activeInsight.icon} size={22} strokeWidth={2} color="currentColor" />
            </div>

            {/* Right: Info labels */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: activeInsight.textColor, textTransform: "uppercase", letterSpacing: "0.04em", transition: "color 0.3s ease" }}>
                {activeInsight.title}
              </span>
              <span style={{ fontSize: "clamp(1.15rem, 4.5vw, 1.45rem)", fontWeight: 700, color: textColor, lineHeight: 1.15 }}>
                {activeInsight.value}
              </span>
              <span style={{ fontSize: "0.75rem", color: grayText, fontWeight: 400, marginTop: "0.05rem", lineHeight: 1.2, display: "block", textOverflow: "ellipsis", overflow: "hidden" }}>
                {activeInsight.subtext}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </BentoCard>
  );
}
