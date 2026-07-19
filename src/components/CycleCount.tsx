"use client";

import React from "react";
import { DashboardSpeed01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import BentoCard, { CardTheme } from "./BentoCard";

export interface CycleCountProps extends React.HTMLAttributes<HTMLDivElement> {
  cycleCount?: number;
  theme?: CardTheme;
  withShadow?: boolean;
  onClick?: () => void;
}

export default function CycleCount({
  cycleCount = 12,
  theme = "light",
  withShadow = true,
  onClick,
  style,
  ...props
}: CycleCountProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#ffffff" : "#111111";
  const grayText = isDark ? "#9ca3af" : "#4b5563";
  const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb";

  // Indigo-violet theme colors matching speedometer gauge
  const iconBg = isDark ? "rgba(139, 92, 246, 0.15)" : "#f5f3ff";
  const iconColor = isDark ? "#a78bfa" : "#6d28d9";

  // Premium horizontal and vertical paddings matching ActiveAlarms exactly
  const verticalPadding = "clamp(0.65rem, 2cqi, 0.85rem)";
  const horizontalPadding = "clamp(1.1rem, 4cqi, 1.6rem)";
  const bentoRadius = `calc(14px + ${verticalPadding})`;

  return (
    <BentoCard
      theme={theme}
      withShadow={withShadow}
      style={{
        containerType: "inline-size",
        padding: `${verticalPadding} ${horizontalPadding}`,
        borderRadius: bentoRadius,
        minWidth: 0,
        overflow: "hidden",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
      onClick={onClick}
      {...props}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          gap: "0.5rem",
        }}
      >
        {/* Left: Icon and Meta Text */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(0.6rem, 2.5cqi, 0.95rem)", minWidth: 0 }}>
          {/* Speedometer Gauge Icon Badge */}
          <div
            style={{
              width: "clamp(36px, 8cqi, 42px)",
              height: "clamp(36px, 8cqi, 42px)",
              borderRadius: "50%",
              background: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <HugeiconsIcon
              icon={DashboardSpeed01Icon}
              size={18}
              color={iconColor}
              strokeWidth={1.8}
            />
          </div>

          {/* Texts */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
            <span
              style={{
                fontSize: "clamp(0.68rem, 2.2cqi, 0.76rem)",
                fontWeight: 500,
                color: grayText,
                fontFamily: "var(--font-inter), sans-serif",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Cycle Count
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "3px", minWidth: 0 }}>
              <span
                style={{
                  fontSize: "clamp(0.85rem, 2.8cqi, 1rem)",
                  fontWeight: 700,
                  color: textColor,
                  fontFamily: "var(--font-inter), sans-serif",
                  lineHeight: 1.15,
                }}
              >
                {cycleCount}
              </span>
              <span
                style={{
                  fontSize: "clamp(0.6rem, 2cqi, 0.68rem)",
                  fontWeight: 500,
                  color: grayText,
                  fontFamily: "var(--font-inter), sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                Cycles
              </span>
            </div>
          </div>
        </div>

        {/* Right: Chevron Arrow */}
        <div style={{ color: isDark ? "#4b5563" : "#9ca3af", flexShrink: 0, display: "flex", alignItems: "center" }}>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            strokeWidth={1.6}
            color="currentColor"
          />
        </div>
      </div>
    </BentoCard>
  );
}
