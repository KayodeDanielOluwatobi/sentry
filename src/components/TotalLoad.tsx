"use client";

import React from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { TradeUpIcon, FlashIcon } from "@hugeicons/core-free-icons";
import BentoCard from "./BentoCard";

export type TotalLoadProps = {
  theme?: "light" | "dark";
  currentWatts?: number;
  maxWatts?: number;
  peakWatts?: number;
  efficiency?: number;
  lastUpdated?: string;
  withShadow?: boolean;
  style?: React.CSSProperties;
};

export default function TotalLoad({
  theme = "light",
  currentWatts = 450,
  maxWatts = 1200,
  peakWatts = 890,
  efficiency = 94,
  lastUpdated = "2s ago",
  withShadow = false,
  style,
}: TotalLoadProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#fff" : "#111";
  const grayText = isDark ? "#9ca3af" : "#6b7280";
  const lightGrayText = isDark ? "#666" : "#9ca3af";

  const utilizationPercent = Math.min(100, (currentWatts / maxWatts) * 100);

  const statusColor = utilizationPercent > 85
    ? "#ef4444"
    : utilizationPercent > 60
      ? "#f97316"
      : (isDark ? "#86efac" : "#2a7037");

  const pillBg = utilizationPercent > 85
    ? (isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2")
    : utilizationPercent > 60
      ? (isDark ? "rgba(249, 115, 22, 0.15)" : "#ffedd5")
      : (isDark ? "rgba(34, 197, 94, 0.1)" : "#eafee7");

  const dotShadow = utilizationPercent > 85
    ? "rgba(239, 68, 68, 0.3)"
    : utilizationPercent > 60
      ? "rgba(249, 115, 22, 0.3)"
      : "rgba(34, 197, 94, 0.3)";

  const dotColor = utilizationPercent > 85
    ? "#ef4444"
    : utilizationPercent > 60
      ? "#f97316"
      : "#22c55e";

  return (
    <BentoCard theme={theme} withShadow={withShadow} style={{ padding: "2.5rem", ...style }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

        {/* Standardized Header Section */}
        <div style={{ marginBottom: "0" }}>
          <h2 style={{ margin: 0, fontSize: "clamp(1.1rem, 6cqw, 1.6rem)", fontWeight: 400, color: grayText, letterSpacing: "0.01em" }}>
            Total Load Output
          </h2>

          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginTop: "0.6rem" }}>
            <span style={{ fontSize: "clamp(1.8rem, 10cqw, 2.5rem)", fontWeight: 500, color: textColor, lineHeight: 1, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
              {currentWatts}<span style={{ fontSize: "clamp(0.9rem, 4cqw, 1.2rem)", fontWeight: 400, color: grayText, marginLeft: "0.2rem" }}>W</span>
            </span>
            <span style={{
              background: pillBg,
              color: statusColor,
              padding: "clamp(0.3rem, 2cqw, 0.45rem) clamp(0.6rem, 4cqw, 0.9rem)",
              borderRadius: "999px",
              fontSize: "clamp(0.7rem, 3.5cqw, 0.9rem)",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
              transition: "all 0.3s ease"
            }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: statusColor,
                  display: "inline-block"
                }}
              />
              {utilizationPercent > 85 ? "Overloaded" :
                utilizationPercent > 60 ? "Near Capacity" :
                  "System healthy"}
            </span>
          </div>

          <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
            <span style={{ color: lightGrayText, fontWeight: 300, letterSpacing: "0.01em" }}>Last updated: </span>
            <span style={{ color: isDark ? "#b4b4b4" : "#a9b3c0", fontWeight: 400, letterSpacing: "0.01em" }}>{lastUpdated}</span>
          </div>
        </div>

        {/* Content Section */}
        <div style={{ width: "100%", marginTop: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.75rem", fontWeight: 400, color: grayText }}>
            <span style={{ letterSpacing: "0.01em" }}>Utilization stress</span>
            <span style={{ color: statusColor, fontWeight: 700, letterSpacing: "0.01em" }}>{utilizationPercent.toFixed(1)}%</span>
          </div>

          <div style={{
            width: "100%",
            height: "10px",
            background: isDark ? "rgba(255,255,255,0.05)" : "#f0f0f0",
            borderRadius: "5px",
            overflow: "hidden",
            position: "relative"
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${utilizationPercent}%` }}
              transition={{ type: "spring", stiffness: 40, damping: 12 }}
              style={{
                height: "100%",
                background: utilizationPercent > 85
                  ? "linear-gradient(90deg, #ef4444, #f87171)"
                  : utilizationPercent > 60
                    ? "linear-gradient(90deg, #f97316, #fbbf24)"
                    : "linear-gradient(90deg, #22c55e, #4ade80)",
                borderRadius: "5px",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <motion.div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  width: "50%",
                  borderRadius: "inherit"
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              />
            </motion.div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.6rem", fontSize: "0.75rem", color: lightGrayText, fontWeight: 400 }}>
            <span style={{ letterSpacing: "0.01em" }}>0W baseline</span>
            <span style={{ letterSpacing: "0.01em" }}>Cap: {maxWatts}W</span>
          </div>
        </div>

        {/* Footer Metrics */}
        <div style={{
          display: "flex",
          flexWrap: "nowrap",
          gap: "1rem",
          marginTop: "1.5rem",
          paddingTop: "1.5rem",
          borderTop: `1px solid ${isDark ? "#222" : "#eee"}`,
          overflow: "hidden"
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              color: grayText,
              fontSize: "clamp(0.65rem, 3.2cqw, 0.8rem)",
              marginBottom: "0.4rem",
              fontWeight: 400,
              letterSpacing: "0.01em",
              whiteSpace: "nowrap"
            }}>
              <HugeiconsIcon icon={TradeUpIcon} size="clamp(13px, 3.5cqw, 16px)" strokeWidth={2} style={{ flexShrink: 0 }} />
              Peak load
            </div>
            <div style={{ fontSize: "clamp(0.85rem, 4.5cqw, 1.05rem)", fontWeight: 700, color: textColor, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
              {peakWatts}<span style={{ fontSize: "clamp(0.6rem, 2.5cqw, 0.75rem)", fontWeight: 400, color: grayText, marginLeft: "2px" }}>W</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              color: grayText,
              fontSize: "clamp(0.65rem, 3.2cqw, 0.8rem)",
              marginBottom: "0.4rem",
              fontWeight: 400,
              letterSpacing: "0.01em",
              whiteSpace: "nowrap"
            }}>
              <HugeiconsIcon icon={FlashIcon} size="clamp(13px, 3.5cqw, 16px)" strokeWidth={2} style={{ flexShrink: 0 }} />
              Efficiency
            </div>
            <div style={{ fontSize: "clamp(0.85rem, 4.5cqw, 1.05rem)", fontWeight: 700, color: efficiency > 90 ? (isDark ? "#86efac" : "#16a34a") : "#f97316", letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
              {efficiency}<span style={{ fontSize: "clamp(0.6rem, 2.5cqw, 0.75rem)", fontWeight: 400, color: grayText, marginLeft: "1px" }}>%</span>
            </div>
          </div>
        </div>

      </div>
    </BentoCard>
  );
}
