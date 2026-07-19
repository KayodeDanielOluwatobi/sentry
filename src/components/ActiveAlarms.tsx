"use client";

import React from "react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import BentoCard, { CardTheme } from "./BentoCard";

export interface ActiveAlarmsProps extends React.HTMLAttributes<HTMLDivElement> {
  activeCount?: number;
  theme?: CardTheme;
  withShadow?: boolean;
  onClick?: () => void;
}

export default function ActiveAlarms({
  activeCount = 0,
  theme = "light",
  withShadow = true,
  onClick,
  style,
  ...props
}: ActiveAlarmsProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#ffffff" : "#111111";
  const grayText = isDark ? "#9ca3af" : "#4b5563";
  const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb";

  // Alert colors: soft red pastel for alarms, green for all clear
  const iconBg = activeCount > 0
    ? (isDark ? "rgba(239, 68, 68, 0.18)" : "#fee2e2")
    : (isDark ? "rgba(239, 68, 68, 0.12)" : "#fef2f2");
  
  const iconColor = isDark ? "#f87171" : "#dc2626";
  const statusColor = activeCount > 0 ? (isDark ? "#f87171" : "#dc2626") : (isDark ? "#4ade80" : "#16a34a");
  const statusLabel = activeCount > 0 ? "Requires Attention" : "All Clear";

  // Premium horizontal and vertical paddings
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
          {/* Shield Icon Badge */}
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              color={iconColor}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M11.9922 8L11.9922 12" strokeLinejoin="round"></path>
              <path d="M12.1172 15.75L11.9922 15.75M12.2422 15.75C12.2422 15.8881 12.1303 16 11.9922 16C11.8541 16 11.7422 15.8881 11.7422 15.75C11.7422 15.6119 11.8541 15.5 11.9922 15.5C12.1303 15.5 12.2422 15.6119 12.2422 15.75Z" strokeLinejoin="round"></path>
              <path d="M20.9922 11.1835V8.28041C20.9922 6.64041 20.9922 5.82041 20.5881 5.28541C20.184 4.75042 19.2703 4.49068 17.4429 3.97122C16.1944 3.61632 15.0938 3.18875 14.2145 2.79841C13.0156 2.26622 12.4161 2.00012 11.9922 2.00012C11.5682 2.00012 10.9688 2.26622 9.7699 2.79841C8.89057 3.18875 7.79002 3.61632 6.54152 3.97122C4.71411 4.49068 3.80041 4.75042 3.3963 5.28541C2.99219 5.82041 2.99219 6.64041 2.99219 8.28041V11.1835C2.99219 16.8086 8.05496 20.1836 10.5861 21.5195C11.1932 21.8399 11.4968 22.0001 11.9922 22.0001C12.4876 22.0001 12.7911 21.8399 13.3982 21.5195C15.9294 20.1836 20.9922 16.8086 20.9922 11.1835Z"></path>
            </svg>
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
              Active Alarms
            </span>
            <span
              style={{
                fontSize: "clamp(0.8rem, 2.8cqi, 0.95rem)",
                fontWeight: 700,
                color: textColor,
                fontFamily: "var(--font-inter), sans-serif",
                lineHeight: 1.15,
              }}
            >
              {activeCount} Active
            </span>
            <span
              style={{
                fontSize: "clamp(0.6rem, 2cqi, 0.68rem)",
                fontWeight: 600,
                color: statusColor,
                fontFamily: "var(--font-inter), sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              {statusLabel}
            </span>
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
