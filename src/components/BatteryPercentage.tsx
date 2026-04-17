"use client";

import React, { useEffect, useRef, useState } from "react";
import BentoCard from "./BentoCard";
import BatteryArc from "./BatteryArc";
import { CardTheme } from "./BentoCard";
import { HugeiconsIcon } from "@hugeicons/react";
import { FlashIcon, BatteryCharging01Icon, BatteryFullIcon, BatteryMedium01Icon, BatteryMedium02Icon, BatteryLowIcon, BatteryEmptyIcon, Timer02Icon, Clock01Icon, HeartCheckIcon } from "@hugeicons/core-free-icons";

interface BatteryPercentageProps extends React.HTMLAttributes<HTMLDivElement> {
  soc?: number;
  isCharging?: boolean;
  timeToFull?: string;
  timeToEmpty?: string;
  soh?: number;
  lastUpdated?: string;
  theme?: CardTheme;
  withShadow?: boolean;
}

export default function BatteryPercentage({
  soc = 85,
  isCharging = true,
  timeToFull = "1h 20m",
  timeToEmpty = "5h 15m",
  soh = 99,
  lastUpdated = "2s ago",
  theme = "light",
  withShadow = true,
  style,
  ...props
}: BatteryPercentageProps) {

  const isDark = theme === "dark";
  const textColor = isDark ? "#fff" : "#111"; // Main solid color
  const grayText = isDark ? "#9ca3af" : "#6b7280"; // Muted gray
  const lightGrayText = isDark ? "#666" : "#9ca3af"; // Extra light gray

  const containerRef = useRef<HTMLDivElement>(null);
  const [isWrapped, setIsWrapped] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      setIsWrapped(w < 336);
    });
    ro.observe(el);
    const initialW = el.getBoundingClientRect().width;
    setIsWrapped(initialW < 336);
    return () => ro.disconnect();
  }, []);

  const getDischargingIcon = (soc: number) => {
    if (soc > 80) return BatteryFullIcon;
    if (soc > 50) return BatteryMedium02Icon; // 3 bars
    if (soc > 20) return BatteryMedium01Icon; // 2 bars
    if (soc > 5) return BatteryLowIcon;
    return BatteryEmptyIcon;
  };

  const DischargingIcon = getDischargingIcon(soc);

  return (
    <BentoCard theme={theme} withShadow={withShadow} style={{ padding: "2.5rem", ...style }} {...props}>
      <div ref={containerRef}>
        {/* ── Top Header Section ── */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ margin: 0, fontSize: "clamp(1.1rem, 6cqw, 1.6rem)", fontWeight: 400, color: grayText, letterSpacing: "0.01em" }}>
            Battery Percentage
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.6rem" }}>
            <span style={{ fontSize: "clamp(1.8rem, 10cqw, 2.5rem)", fontWeight: 500, color: textColor, lineHeight: 1, letterSpacing: "0" }}>
              {soc}%
            </span>
            {isCharging ? (
              <span style={{
                background: isDark ? "rgba(134, 239, 172, 0.1)" : "#eafee7",
                color: isDark ? "#86efac" : "#2a7037",
                padding: "clamp(0.3rem, 2cqw, 0.45rem) clamp(0.6rem, 4cqw, 0.9rem)",
                borderRadius: "999px",
                fontSize: "clamp(0.7rem, 3.5cqw, 0.9rem)",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem"
              }}>
                <HugeiconsIcon icon={BatteryCharging01Icon} size="clamp(14px, 4cqw, 17px)" strokeWidth={2.5} color="currentColor" />
                Charging
              </span>
            ) : (
              <span style={{
                background: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
                color: isDark ? "#a1a1aa" : "#52525b",
                padding: "clamp(0.3rem, 2cqw, 0.45rem) clamp(0.6rem, 4cqw, 0.9rem)",
                borderRadius: "999px",
                fontSize: "clamp(0.7rem, 3.5cqw, 0.9rem)",
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem"
              }}>
                <HugeiconsIcon icon={DischargingIcon} size="clamp(14px, 4cqw, 17px)" strokeWidth={2.5} color="currentColor" style={{ opacity: 0.6 }} />
                Discharging
              </span>
            )}
          </div>

          <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
            <span style={{ color: lightGrayText, fontWeight: 300 }}>Last updated: </span>
            <span style={{ color: isDark ? "#b4b4b4ff" : "#a9b3c0ff", fontWeight: 400 }}>{lastUpdated}</span>
          </div>
        </div>
        {/* ── Bottom Section: Arc + Stats ── */}
        <div style={{ display: "flex", flexWrap: isWrapped ? "wrap" : "nowrap", justifyContent: "space-between", marginTop: "2rem", alignItems: "center", gap: "2rem" }}>

          {/* Arc Container: flexible but constrained to perfectly match the design proportion */}
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
            <div style={{ transform: "translateX(-4%)" }}>
              <BatteryArc
                soc={soc}
                isCharging={isCharging}
                theme={theme}
                size={220}
              />
            </div>
          </div>

          {/* Right / Bottom Stats Container */}
          <div style={{
            display: "flex",
            flexDirection: isWrapped ? "row" : "column",
            flexWrap: "nowrap",
            justifyContent: isWrapped ? "space-between" : "flex-start",
            width: isWrapped ? "100%" : "auto",
            gap: isWrapped ? "0.75rem" : "1.6rem",
            minWidth: 0,
            flex: isWrapped ? "none" : 1,
            overflow: "hidden"
          }}>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", flex: 1, minWidth: 0 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "clamp(0.65rem, 3.2cqw, 0.8rem)",
                color: grayText,
                letterSpacing: "0.03em",
                whiteSpace: "nowrap"
              }}>
                <HugeiconsIcon icon={Timer02Icon} size="clamp(13px, 3.5cqw, 16px)" style={{ flexShrink: 0 }} />
                To full
              </div>
              <span style={{ fontSize: "clamp(0.85rem, 4.5cqw, 1.05rem)", fontWeight: 500, color: textColor, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>{timeToFull}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", flex: 1, minWidth: 0 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "clamp(0.65rem, 3.2cqw, 0.8rem)",
                color: grayText,
                letterSpacing: "0.03em",
                whiteSpace: "nowrap"
              }}>
                <HugeiconsIcon icon={Clock01Icon} size="clamp(13px, 3.5cqw, 16px)" style={{ flexShrink: 0 }} />
                To end
              </div>
              <span style={{ fontSize: "clamp(0.85rem, 4.5cqw, 1.05rem)", fontWeight: 500, color: textColor, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>{timeToEmpty}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", flex: 1, minWidth: 0 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "clamp(0.65rem, 3.2cqw, 0.8rem)",
                color: grayText,
                letterSpacing: "0.03em",
                whiteSpace: "nowrap"
              }}>
                <HugeiconsIcon icon={HeartCheckIcon} size="clamp(13px, 3.5cqw, 16px)" style={{ flexShrink: 0 }} />
                SOH
              </div>
              <span style={{ fontSize: "clamp(0.85rem, 4.5cqw, 1.05rem)", fontWeight: 500, color: textColor, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>{soh}%</span>
            </div>

          </div>

        </div>
      </div>
    </BentoCard>
  );
}
