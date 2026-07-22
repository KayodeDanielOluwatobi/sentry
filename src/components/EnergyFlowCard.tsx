"use client";

import React, { useState, useEffect } from "react";
import BentoCard from "./BentoCard";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AutomotiveBattery01Icon,
  Sine01Icon,
  House03Icon
} from "@hugeicons/core-free-icons";

export interface EnergyFlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: "light" | "dark";
  withShadow?: boolean;
  soc?: number;
  voltage?: number;
  currentLoad?: number;
  isCharging?: boolean;
  inverterEfficiency?: number;
  batteryToInverterFlow?: boolean;
  inverterToLoadFlow?: boolean;
  lastFirebaseUpdate?: number;
}

// ─── Flow Path Connector Component ──────────────────────────────────────────
function FlowConnector({
  active,
  sourceColor,
  targetColor,
  gradientId,
  isDark,
  isMobile,
  offline = false
}: {
  active: boolean;
  sourceColor: string;
  targetColor: string;
  gradientId: string;
  isDark: boolean;
  isMobile: boolean;
  offline?: boolean;
}) {
  // Arrow and line colors based on state
  const isFlowing = active && !offline;
  const arrowColor = isFlowing ? targetColor : (isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "1 1 auto",
        minWidth: isMobile ? "35px" : "60px",
        maxWidth: isMobile ? "85px" : "160px",
        padding: "0 0.1rem",
        position: "relative"
      }}
    >
      <svg
        viewBox="0 0 120 24"
        style={{
          width: "100%",
          height: isMobile ? "22px" : "28px",
          overflow: "visible"
        }}
      >
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="6"
            y1="12"
            x2="94"
            y2="12"
          >
            <stop offset="0%" stopColor={sourceColor} />
            <stop offset="100%" stopColor={targetColor} />
          </linearGradient>
        </defs>

        {/* Connecting Background Line */}
        <line
          x1="6"
          y1="12"
          x2="94"
          y2="12"
          stroke={isFlowing ? `url(#${gradientId})` : (isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)")}
          strokeWidth={isMobile ? "3" : "2.8"}
          strokeLinecap="round"
          style={{ opacity: isFlowing ? 0.05 : 1 }}
        />

        {/* Flowing dots if active and online */}
        {active && (
          <g>
            {isFlowing ? (
              <>
                <circle cx="10" cy="12" r={isMobile ? "4.5" : "3.5"} fill={`url(#${gradientId})`}>
                  <animate
                    attributeName="cx"
                    values="10;84"
                    dur="2.6s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keyTimes="0; 1"
                    keySplines="0.4 0 0.6 1"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.25;1;0.75;0"
                    keyTimes="0;0.15;0.5;0.8;1"
                    dur="2.6s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="10" cy="12" r={isMobile ? "4" : "3"} fill={`url(#${gradientId})`}>
                  <animate
                    attributeName="cx"
                    values="10;84"
                    dur="2.6s"
                    begin="0.86s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keyTimes="0; 1"
                    keySplines="0.4 0 0.6 1"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.25;1;0.75;0"
                    keyTimes="0;0.15;0.5;0.8;1"
                    dur="2.6s"
                    begin="0.86s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="10" cy="12" r={isMobile ? "3.5" : "2.5"} fill={`url(#${gradientId})`}>
                  <animate
                    attributeName="cx"
                    values="10;84"
                    dur="2.6s"
                    begin="1.72s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keyTimes="0; 1"
                    keySplines="0.4 0 0.6 1"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.25;1;0.75;0"
                    keyTimes="0;0.15;0.5;0.8;1"
                    dur="2.6s"
                    begin="1.72s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            ) : (
              // Frozen and greyed-out dots spaced along the line
              <>
                <circle cx="30" cy="12" r={isMobile ? "4.5" : "3.5"} fill={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.14)"} />
                <circle cx="55" cy="12" r={isMobile ? "4" : "3"} fill={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.14)"} />
                <circle cx="80" cy="12" r={isMobile ? "3.5" : "2.5"} fill={isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.14)"} />
              </>
            )}
          </g>
        )}

        {/* Chevron Chevron Right Arrow */}
        <path
          d="M 94 19 L 105 12 L 94 5"
          fill="none"
          stroke={arrowColor}
          strokeWidth={isMobile ? "3.5" : "3"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function EnergyFlowCard({
  theme = "light",
  withShadow = true,
  soc = 89,
  voltage = 12.74,
  currentLoad = 450,
  isCharging = false,
  inverterEfficiency = 94,
  batteryToInverterFlow = true,
  inverterToLoadFlow = true,
  lastFirebaseUpdate,
  style,
  ...props
}: EnergyFlowCardProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#ffffff" : "#111111";
  const grayText = isDark ? "#9ca3af" : "#6b7280";
  const nodeBg = isDark ? "rgba(255,255,255,0.03)" : "#f9fafb";
  const nodeBorder = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";

  const [isMobile, setIsMobile] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState<number | string>("—");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Compute seconds elapsed since the last real Firebase update
  useEffect(() => {
    if (lastFirebaseUpdate === undefined) {
      setSecondsAgo("—");
      return;
    }

    const updateTimer = () => {
      const elapsedMs = Date.now() - lastFirebaseUpdate;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      setSecondsAgo(elapsedSec >= 0 ? elapsedSec : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastFirebaseUpdate]);

  // Determine active system state using the 30-second heartbeat check logic
  const isOffline = lastFirebaseUpdate === undefined || (typeof secondsAgo === "number" && secondsAgo > 30);

  // Standardized inner padding matching BentoCard design system on mobile
  const paddingValue = isMobile ? "1.25rem 1.25rem 1.15rem 1.25rem" : "clamp(0.75rem, 2.5cqi, 1.25rem)";

  // Overall system flow status
  const isSystemFlowing = !isOffline && (batteryToInverterFlow || inverterToLoadFlow);

  return (
    <BentoCard
      theme={theme}
      withShadow={withShadow}
      style={{
        containerType: "inline-size",
        padding: paddingValue,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        ...style
      }}
      {...props}
    >
      {/* ── Header Row ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          marginBottom: isMobile ? "1.25rem" : "1.75rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "clamp(0.9rem, 2.8cqi, 1.05rem)",
              fontWeight: 700,
              color: textColor,
              letterSpacing: "-0.01em"
            }}
          >
            Energy Flow
          </span>
        </div>

        {/* Live / Offline Status Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: isMobile ? "0.15rem 0.5rem" : "0.2rem 0.6rem",
            borderRadius: "9999px",
            background: isOffline
              ? (isDark ? "rgba(239, 68, 68, 0.12)" : "rgba(239, 68, 68, 0.06)")
              : isSystemFlowing
                ? (isDark ? "rgba(34, 197, 94, 0.10)" : "rgba(34, 197, 94, 0.06)")
                : (isDark ? "rgba(156, 163, 175, 0.12)" : "rgba(156, 163, 175, 0.08)"),
            border: isOffline
              ? (isDark ? "1px solid rgba(239, 68, 68, 0.22)" : "1px solid rgba(239, 68, 68, 0.18)")
              : isSystemFlowing
                ? (isDark ? "1px solid rgba(34, 197, 94, 0.22)" : "1px solid rgba(34, 197, 94, 0.18)")
                : (isDark ? "1px solid rgba(156, 163, 175, 0.2)" : "1px solid rgba(156, 163, 175, 0.15)")
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: isOffline ? "#ef4444" : isSystemFlowing ? "#22c55e" : "#9ca3af",
              boxShadow: "none"
            }}
          />
          <span
            style={{
              fontSize: isMobile ? "0.62rem" : "0.68rem",
              fontWeight: 600,
              color: isOffline
                ? (isDark ? "#fca5a5" : "#c53030")
                : isSystemFlowing
                  ? (isDark ? "#86efac" : "#15803d")
                  : grayText
            }}
          >
            {isOffline ? "Offline" : isSystemFlowing ? "Live" : "Idle"}
          </span>
        </div>
      </div>

      {/* ── Main Nodes & Flow Paths Container ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          gap: isMobile ? "0.15rem" : "0.5rem"
        }}
      >
        {/* Node 1: Battery */}
        <div
          style={{
            width: isMobile ? "78px" : "130px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: nodeBg,
            border: `1px solid ${nodeBorder}`,
            borderRadius: isMobile ? "14px" : "20px",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              width: "100%",
              padding: isMobile ? "0.65rem 0.15rem" : "1.25rem 1rem",
              background: isDark ? "rgba(34, 197, 94, 0.12)" : "rgba(34, 197, 94, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <HugeiconsIcon
              icon={AutomotiveBattery01Icon}
              size={isMobile ? 22 : 32}
              color="#22c55e"
              strokeWidth={1.8}
            />
          </div>
          <div
            style={{
              padding: isMobile ? "0.4rem 0.1rem" : "0.85rem 0.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.1rem",
              width: "100%"
            }}
          >
            <span style={{ fontSize: isMobile ? "0.62rem" : "0.75rem", fontWeight: 500, color: grayText }}>
              Battery
            </span>
            <span style={{ fontSize: isMobile ? "0.82rem" : "1.25rem", fontWeight: 700, color: textColor, lineHeight: 1.1 }}>
              {Math.round(soc)}%
            </span>
            <span style={{ fontSize: isMobile ? "0.55rem" : "0.65rem", fontWeight: 500, color: grayText }}>
              SOC
            </span>
          </div>
        </div>

        {/* Connector 1: Battery (Green #22c55e) -> Inverter (Blue #3b82f6) */}
        <FlowConnector
          active={batteryToInverterFlow}
          sourceColor="#22c55e"
          targetColor="#3b82f6"
          gradientId="flowGradBatteryToInverter"
          isDark={isDark}
          isMobile={isMobile}
          offline={isOffline}
        />

        {/* Node 2: Inverter */}
        <div
          style={{
            width: isMobile ? "78px" : "130px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: nodeBg,
            border: `1px solid ${nodeBorder}`,
            borderRadius: isMobile ? "14px" : "20px",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              width: "100%",
              padding: isMobile ? "0.65rem 0.15rem" : "1.25rem 1rem",
              background: isDark ? "rgba(59, 130, 246, 0.12)" : "rgba(59, 130, 246, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <HugeiconsIcon
              icon={Sine01Icon}
              size={isMobile ? 22 : 32}
              color="#3b82f6"
              strokeWidth={1.8}
            />
          </div>
          <div
            style={{
              padding: isMobile ? "0.4rem 0.1rem" : "0.85rem 0.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.1rem",
              width: "100%"
            }}
          >
            <span style={{ fontSize: isMobile ? "0.62rem" : "0.75rem", fontWeight: 500, color: grayText }}>
              Inverter
            </span>
            <span style={{ fontSize: isMobile ? "0.82rem" : "1.25rem", fontWeight: 700, color: textColor, lineHeight: 1.1 }}>
              {inverterEfficiency}%
            </span>
            <span style={{ fontSize: isMobile ? "0.55rem" : "0.65rem", fontWeight: 500, color: grayText }}>
              Efficiency
            </span>
          </div>
        </div>

        {/* Connector 2: Inverter (Blue #3b82f6) -> Loads (Purple #a855f7) */}
        <FlowConnector
          active={inverterToLoadFlow}
          sourceColor="#3b82f6"
          targetColor="#a855f7"
          gradientId="flowGradInverterToLoads"
          isDark={isDark}
          isMobile={isMobile}
          offline={isOffline}
        />

        {/* Node 3: Loads */}
        <div
          style={{
            width: isMobile ? "78px" : "130px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: nodeBg,
            border: `1px solid ${nodeBorder}`,
            borderRadius: isMobile ? "14px" : "20px",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              width: "100%",
              padding: isMobile ? "0.65rem 0.15rem" : "1.25rem 1rem",
              background: isDark ? "rgba(168, 85, 247, 0.12)" : "rgba(168, 85, 247, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <HugeiconsIcon
              icon={House03Icon}
              size={isMobile ? 22 : 32}
              color="#a855f7"
              strokeWidth={1.8}
            />
          </div>
          <div
            style={{
              padding: isMobile ? "0.4rem 0.1rem" : "0.85rem 0.5rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.1rem",
              width: "100%"
            }}
          >
            <span style={{ fontSize: isMobile ? "0.62rem" : "0.75rem", fontWeight: 500, color: grayText }}>
              Loads
            </span>
            <span style={{ fontSize: isMobile ? "0.82rem" : "1.25rem", fontWeight: 700, color: textColor, lineHeight: 1.1 }}>
              {Math.round(currentLoad)} <span style={{ fontSize: isMobile ? "0.62rem" : "0.9rem", fontWeight: 600 }}>W</span>
            </span>
            <span style={{ fontSize: isMobile ? "0.55rem" : "0.65rem", fontWeight: 500, color: grayText }}>
              {isCharging ? "Charging" : "Consuming"}
            </span>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
