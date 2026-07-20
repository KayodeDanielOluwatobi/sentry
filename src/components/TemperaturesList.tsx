"use client";

import React from "react";
import { TemperatureIcon, ExpandIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import BentoCard, { CardTheme } from "./BentoCard";

// Dynamic color profile based on temperature value
function getTempColors(val: number, isDark: boolean) {
  if (val < 35) {
    // Cool / Optimal (Blue)
    return {
      bg: isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
      color: isDark ? "#60a5fa" : "#2563eb",
    };
  }
  if (val < 50) {
    // Warm / Rising (Orange/Amber)
    return {
      bg: isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7",
      color: isDark ? "#f59e0b" : "#b45309",
    };
  }
  // Hot / Critical (Red)
  return {
    bg: isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2",
    color: isDark ? "#ef4444" : "#b91c1c",
  };
}

export interface TemperatureSensor {
  id: string;
  name: string;
  value: number;
}

export interface TemperaturesListProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: CardTheme;
  withShadow?: boolean;
  sensors?: TemperatureSensor[];
  onViewAll?: () => void;
}

const DEFAULT_SENSORS: TemperatureSensor[] = [
  { id: "temp1", name: "Battery temperature 1", value: 28.2 },
  { id: "temp2", name: "Battery temperature 2", value: 29.1 },
  { id: "mosfet", name: "MOSFET", value: 30.4 },
];

export default function TemperaturesList({
  theme = "light",
  withShadow = true,
  sensors,
  onViewAll,
  style,
  ...props
}: TemperaturesListProps) {
  const listToRender = sensors !== undefined ? sensors : [
    { id: "temp1", name: "Battery temperature 1", value: NaN },
    { id: "temp2", name: "Battery temperature 2", value: NaN },
    { id: "mosfet", name: "MOSFET", value: NaN },
  ];
  const isDark = theme === "dark";
  const textColor = isDark ? "#ffffff" : "#111111";
  const grayText = isDark ? "#9ca3af" : "#4b5563";
  const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb";

  // Generous vertical padding, even wider horizontal side padding to pull content away from edges
  const verticalPadding = "clamp(0.85rem, 3cqi, 1.25rem)";
  const horizontalPadding = "clamp(1.2rem, 4.5cqi, 1.85rem)";
  const bentoRadius = `calc(14px + ${verticalPadding})`;

  return (
    <BentoCard
      theme={theme}
      withShadow={withShadow}
      style={{
        containerType: "inline-size",
        padding: `${verticalPadding} ${horizontalPadding}`, // Using responsive separate padding
        borderRadius: bentoRadius,
        minWidth: 0,
        overflow: "hidden",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
      {...props}
    >
      {/* Styles for dynamic label shortening on narrow containers */}
      <style>{`
        .tg-desktop-text { display: inline; }
        .tg-mobile-text { display: none; }
        @container (max-width: 320px) {
          .tg-desktop-text { display: none !important; }
          .tg-mobile-text { display: inline !important; }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
          gap: "clamp(0.8rem, 3cqi, 1.2rem)",
          width: "100%",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <span
            style={{
              fontSize: "clamp(0.85rem, 3cqi, 1rem)",
              fontWeight: 700,
              color: textColor,
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            Temperatures
          </span>

          <button
            onClick={onViewAll}
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
              e.currentTarget.style.color = isDark ? "#ffffff" : "#111111";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = "0.7";
              e.currentTarget.style.color = isDark ? "#9ca3af" : "#6b7280";
            }}
            aria-label="Expand Temperatures"
          >
            <HugeiconsIcon
              icon={ExpandIcon}
              size={18}
              strokeWidth={1} // 1px stroke weight as requested
            />
          </button>
        </div>

        {/* ── Sensor List ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(0.6rem, 2.5cqi, 0.95rem)",
            width: "100%",
          }}
        >
          {listToRender.map(sensor => {
            const isValNan = isNaN(sensor.value);
            const tempColors = isValNan
              ? {
                  bg: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
                  color: isDark ? "rgba(255, 255, 255, 0.2)" : "#9ca3af",
                }
              : getTempColors(sensor.value, isDark);
            return (
              <div
                key={sensor.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                {/* Left Side: Icon + Name */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "clamp(0.55rem, 2.2cqi, 0.8rem)",
                    minWidth: 0,
                  }}
                >
                  {/* Rounded Icon Badge with Dynamic Colors */}
                  <div
                    style={{
                      width: "clamp(34px, 7cqi, 40px)",
                      height: "clamp(34px, 7cqi, 40px)",
                      borderRadius: "12px",
                      background: tempColors.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "background-color 0.3s ease",
                    }}
                  >
                    <HugeiconsIcon
                      icon={TemperatureIcon}
                      size={16}
                      color={tempColors.color}
                      strokeWidth={1.8}
                    />
                  </div>

                {/* Name */}
                <span
                  style={{
                    fontSize: "clamp(0.7rem, 2.2cqi, 0.8rem)",
                    fontWeight: 500,
                    color: textColor,
                    fontFamily: "var(--font-inter), sans-serif",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {sensor.name === "Battery temperature 1" ? (
                    <>
                      <span className="tg-desktop-text">Battery temperature 1</span>
                      <span className="tg-mobile-text">Temp 1</span>
                    </>
                  ) : sensor.name === "Battery temperature 2" ? (
                    <>
                      <span className="tg-desktop-text">Battery temperature 2</span>
                      <span className="tg-mobile-text">Temp 2</span>
                    </>
                  ) : (
                    sensor.name
                  )}
                </span>
              </div>

              {/* Right Side: Temperature Value */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  fontFamily: "var(--font-inter), sans-serif",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: "clamp(0.85rem, 2.8cqi, 1rem)",
                    fontWeight: 700,
                    color: textColor,
                  }}
                >
                  {isValNan ? "—" : sensor.value.toFixed(1)}
                </span>
                {!isValNan && (
                  <span
                    style={{
                      fontSize: "clamp(0.68rem, 2.2cqi, 0.78rem)",
                      fontWeight: 500,
                      color: grayText,
                      marginLeft: "3px",
                    }}
                  >
                    °C
                  </span>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </BentoCard>
  );
}
