"use client";

import React, { useMemo } from "react";
import { 
  DashboardSpeed01Icon, 
  ArrowRight01Icon 
} from "@hugeicons/core-free-icons";
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

  const iconBg = isDark ? "rgba(139, 92, 246, 0.15)" : "#f5f3ff";
  const iconColor = isDark ? "#a78bfa" : "#6d28d9";

  const verticalPadding = "clamp(0.9rem, 2.5cqi, 1.2rem)";
  const horizontalPadding = "clamp(1.1rem, 4cqi, 1.6rem)";

  // Calculate academic battery wear and chemistry metrics
  const maxCycles = 3000; // Standard LiFePO4 lifespan
  const lifeRemainingPercent = Math.max(0, 100 - (cycleCount / maxCycles) * 100);
  const totalWearPercent = ((cycleCount / maxCycles) * 100).toFixed(2);

  const healthState = useMemo(() => {
    if (cycleCount < 300) return "Excellent";
    if (cycleCount < 1000) return "Good";
    if (cycleCount < 2000) return "Fair";
    return "Attention";
  }, [cycleCount]);

  return (
    <BentoCard
      theme={theme}
      withShadow={withShadow}
      style={{
        padding: `${verticalPadding} ${horizontalPadding}`,
        borderRadius: "24px",
        minWidth: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "0.85rem",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
      onClick={onClick}
      {...props}
    >
      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <HugeiconsIcon icon={DashboardSpeed01Icon} size={15} color={iconColor} strokeWidth={1.8} />
          </div>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: textColor, letterSpacing: "-0.01em" }}>
            Cycle Analytics
          </span>
        </div>
        {onClick && (
          <div style={{ color: isDark ? "#4b5563" : "#9ca3af" }}>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.8} color="currentColor" />
          </div>
        )}
      </div>

      {/* Center: Main Numbers */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", margin: "0.25rem 0" }}>
        <span style={{ fontSize: "0.62rem", fontWeight: 400, color: grayText }}>
          Cell service duration
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "2.1rem", fontWeight: 800, color: textColor, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {cycleCount}
          </span>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: iconColor }}>
            Cycles
          </span>
        </div>
      </div>

      {/* Progress Track: Wear Metric */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.58rem", fontWeight: 400, color: grayText }}>
          <span>Service life remaining</span>
          <span style={{ color: textColor }}>{lifeRemainingPercent.toFixed(1)}%</span>
        </div>
        <div style={{ width: "100%", height: "4px", background: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
          <div style={{ 
            width: `${lifeRemainingPercent}%`, 
            height: "100%", 
            background: `linear-gradient(90deg, ${iconColor} 0%, #c084fc 100%)`,
            borderRadius: "99px",
            transition: "width 0.8s ease-out"
          }} />
        </div>
      </div>

      {/* Bottom: Metadata Grid (LiFePO4 Chemistry details) */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "0.6rem", 
        borderTop: `1px solid ${cardBorder}`, 
        paddingTop: "0.75rem" 
      }}>
        <div>
          <div style={{ fontSize: "0.52rem", color: grayText, fontWeight: 400 }}>Health rating</div>
          <div style={{ fontSize: "0.7rem", color: textColor, fontWeight: 700 }}>{healthState}</div>
        </div>
        <div>
          <div style={{ fontSize: "0.52rem", color: grayText, fontWeight: 400 }}>Chemistry type</div>
          <div style={{ fontSize: "0.7rem", color: textColor, fontWeight: 700 }}>LiFePO4</div>
        </div>
      </div>
    </BentoCard>
  );
}
