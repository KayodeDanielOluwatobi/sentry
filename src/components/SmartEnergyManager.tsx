"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  BulbChargingIcon,
  FridgeIcon,
  Fan01Icon,
  AutomotiveBattery02Icon,
  ArrowRight01Icon,
  Wifi01Icon,
  Router01Icon,
  LaptopIcon,
  Tv01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import BentoCard from "./BentoCard";
import { CardTheme } from "./BentoCard";
import { motion, AnimatePresence } from "framer-motion";

// ─── Data Types ───────────────────────────────────────────────────────────────

export type LoadStatus = "active" | "shed";
export type PriorityLevel = "critical" | "major" | "non-essential";

export interface ManagedLoad {
  id: string;
  name: string;
  level: PriorityLevel;
  status: LoadStatus;
  isOn: boolean;
  icons: Array<"router" | "wifi" | "laptop" | "fan" | "fridge" | "tv" | "bulb">;
}

export interface SmartEnergyManagerProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: CardTheme;
  withShadow?: boolean;
  subtitle?: string;
  loads?: ManagedLoad[];
  onViewDetails?: () => void;
}

// ─── Priority Color Palette ───────────────────────────────────────────────────

const PRIORITY_PALETTE: Record<PriorityLevel, {
  text: string; textDark: string;
  bg: string; bgDark: string;
  iconBg: string; iconBgDark: string;
}> = {
  critical: {
    text: "#5b21b6", textDark: "#c084fc", // Deeper Purple (Violet-800)
    bg: "#f3e8ff", bgDark: "rgba(167, 139, 250, 0.12)",
    iconBg: "rgba(91, 33, 182, 0.08)", iconBgDark: "rgba(167, 139, 250, 0.15)",
  },
  major: {
    text: "#1e3a8a", textDark: "#3b82f6", // Deeper Blue (Blue-900)
    bg: "#eff6ff", bgDark: "rgba(59, 130, 246, 0.12)",
    iconBg: "rgba(30, 58, 138, 0.08)", iconBgDark: "rgba(59, 130, 246, 0.15)",
  },
  "non-essential": {
    text: "#854d0e", textDark: "#fbbf24", // Warm medium brown (Amber-800)
    bg: "#fef3c7", bgDark: "rgba(251, 191, 36, 0.12)",
    iconBg: "rgba(133, 77, 14, 0.08)", iconBgDark: "rgba(251, 191, 36, 0.15)",
  },
};

// Helper to map string keywords to icon components
function getIconComponent(iconKey: string) {
  switch (iconKey) {
    case "router": return Router01Icon;
    case "wifi": return Wifi01Icon;
    case "laptop": return LaptopIcon;
    case "fan": return Fan01Icon;
    case "fridge": return FridgeIcon;
    case "tv": return Tv01Icon;
    case "bulb": return BulbChargingIcon;
    default: return BulbChargingIcon;
  }
}

// ─── Default Data ─────────────────────────────────────────────────────────────

const DEFAULT_LOADS: ManagedLoad[] = [
  { id: "1", name: "Router/WiFi/Laptops", level: "critical", status: "active", isOn: true, icons: ["router", "wifi", "laptop"] },
  { id: "2", name: "Fans/AC/Refrigerator", level: "major", status: "active", isOn: true, icons: ["fan", "fridge"] },
  { id: "3", name: "TV/Lights", level: "non-essential", status: "shed", isOn: false, icons: ["tv", "bulb"] },
];

// ─── LoadCard Sub-Component ───────────────────────────────────────────────────

interface LoadCardProps {
  load: ManagedLoad;
  isDark: boolean;
  mode: "auto" | "manual";
  cardBg: string;
  cardBorder: string;
  onToggle: () => void;
}

function LoadCard({ load, isDark, mode, cardBg, cardBorder, onToggle }: LoadCardProps) {
  const palette = PRIORITY_PALETTE[load.level];
  const accentText = isDark ? palette.textDark : palette.text;
  const accentBg = isDark ? palette.bgDark : palette.bg;
  const iconBg = isDark ? palette.iconBgDark : palette.iconBg;

  const levelLabel =
    load.level === "critical" ? "Critical" :
      load.level === "major" ? "Major" : "Non-Essential";

  // Intelligently scale down font size if "Non-Essential" + status is "active" to prevent wrapping/card expansion
  const isNonEssentialActive = load.level === "non-essential" && load.status === "active";
  const labelFontSize = isNonEssentialActive
    ? "clamp(0.56rem, 1.6cqi, 0.62rem)"
    : "clamp(0.62rem, 1.8cqi, 0.7rem)";

  return (
    <div
      onClick={mode === "manual" ? onToggle : undefined}
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: "14px",
        padding: "clamp(0.55rem, 2cqi, 0.85rem)",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        flex: 1,
        minWidth: 0,
        opacity: load.isOn ? 1 : 0.55,
        cursor: mode === "manual" ? "pointer" : "default",
        transition: "opacity 0.3s ease",
      }}
    >
      {/* ── Top: Level label + status badge ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.25rem" }}>
        <span
          style={{
            fontSize: labelFontSize,
            fontWeight: 600,
            color: accentText,
            fontFamily: "var(--font-inter), sans-serif",
            whiteSpace: "nowrap",
            transition: "font-size 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {levelLabel}
        </span>

        {/* Status badge */}
        <span
          style={{
            fontSize: "clamp(0.52rem, 1.5cqi, 0.6rem)",
            fontWeight: 600,
            color: accentText,
            background: accentBg,
            borderRadius: "999px",
            padding: "2px 7px",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-inter), sans-serif",
            letterSpacing: "0.01em",
            flexShrink: 0,
          }}
        >
          {load.status === "active" ? "Active" : "Shed"}
        </span>
      </div>

      {/* ── Grouped Icon + Name section for tight vertical proximity ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", alignItems: "center", width: "100%" }}>
        {/* ── Overlapping Avatar Stack of Icons ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(0.2rem, 1.5cqi, 0.4rem) 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {load.icons.map((iconKey, idx) => {
              const Icon = getIconComponent(iconKey);
              return (
                <div
                  key={idx}
                  style={{
                    width: "clamp(28px, 6.5cqi, 36px)",
                    height: "clamp(28px, 6.5cqi, 36px)",
                    borderRadius: "50%",
                    background: iconBg,
                    border: `2px solid ${cardBg}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: idx === 0 ? 0 : "clamp(-10px, -2.2cqi, -7px)",
                    zIndex: load.icons.length - idx,
                    boxShadow: "0 2px 5px rgba(0,0,0,0.06)",
                    transition: "margin 0.3s ease",
                  }}
                >
                  <HugeiconsIcon icon={Icon} size={14} color={accentText} strokeWidth={1.8} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Appliance name ── */}
        <div
          style={{
            fontSize: "clamp(0.55rem, 1.5cqi, 0.68rem)",
            fontWeight: 400,
            color: isDark ? "rgba(255, 255, 255, 0.75)" : "#4b5563",
            textAlign: "center",
            fontFamily: "var(--font-inter), sans-serif",
            lineHeight: 1.25,
            marginBottom: "0.45rem", // Spacing added under the name before the divider
          }}
        >
          {load.name}
        </div>
      </div>

      {/* ── Status row ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `1px solid ${cardBorder}`,
          paddingTop: "0.4rem",
          marginTop: "auto", // pushes it down away from the icon+name section
        }}
      >
        <span
          style={{
            fontSize: "clamp(0.58rem, 1.6cqi, 0.65rem)",
            fontWeight: 400,
            color: isDark ? "#9ca3af" : "#6b7280",
            fontFamily: "var(--font-inter), sans-serif",
          }}
        >
          Status
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: load.isOn ? "#16a34a" : "#dc2626",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "clamp(0.6rem, 1.7cqi, 0.67rem)",
              fontWeight: 600,
              color: load.isOn ? "#16a34a" : "#dc2626",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            {load.isOn ? "ON" : "OFF"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── SmartEnergyManager Main Component ───────────────────────────────────────

export default function SmartEnergyManager({
  theme = "light",
  withShadow = true,
  subtitle = "Load Prioritization",
  loads: externalLoads,
  onViewDetails,
  style,
  ...props
}: SmartEnergyManagerProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#ffffff" : "#111111";
  const grayText = isDark ? "#9ca3af" : "#6b7280";
  const cardBg = isDark ? "rgba(255,255,255,0.025)" : "#f9fafb";
  const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb";

  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [loads, setLoads] = useState<ManagedLoad[]>(externalLoads ?? DEFAULT_LOADS);

  // Sync if external loads change (Firebase)
  useEffect(() => {
    if (externalLoads) setLoads(externalLoads);
  }, [externalLoads]);

  const toggleLoad = (id: string) => {
    if (mode === "manual") {
      setLoads(prev => prev.map(l =>
        l.id === id
          ? { ...l, isOn: !l.isOn, status: !l.isOn ? "active" : "shed" }
          : l
      ));
    }
  };

  // no modeLabel needed — toggle replaces the badge

  // Concentric outer radius
  const paddingValue = "clamp(0.5rem, 2.5cqi, 1rem)";
  const bentoRadius = `calc(14px + ${paddingValue})`;

  // Header icon: pastel purple matching critical purple accent
  const headerIconBg = isDark ? "rgba(167, 139, 250, 0.15)" : "#f3e8ff";
  const headerIconColor = isDark ? "#c084fc" : "#5b21b6";

  return (
    <BentoCard
      theme={theme}
      withShadow={withShadow}
      style={{
        containerType: "inline-size",
        padding: paddingValue,
        borderRadius: bentoRadius,
        minWidth: 0,
        overflow: "hidden",
        width: "100%",
        ...style,
      }}
      {...props}
    >
      {/* Sparkles bubble drift animation styles for Auto mode (AI charging arc style) */}
      <style>{`
        @keyframes toggle-bubble-drift {
          0% { transform: translateX(-6px) scale(0.4); opacity: 0; }
          40% { opacity: 0.8; }
          60% { opacity: 0.8; }
          100% { transform: translateX(6px) scale(0.4); opacity: 0; }
        }
        .tg-bubble {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: currentColor;
          pointer-events: none;
          animation: toggle-bubble-drift 2.2s infinite ease-in-out;
        }
      `}</style>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "clamp(0.7rem, 2.5cqi, 1rem)",
          width: "100%",
          minWidth: 0,
        }}
      >
        {/* ── Header Row ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
            width: "100%",
          }}
        >
          {/* Left: icon + titles */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0, flex: 1 }}>
            {/* Pastel icon square — matches BentoCard icon style elsewhere */}
            <div
              style={{
                width: "clamp(34px, 7cqi, 42px)",
                height: "clamp(34px, 7cqi, 42px)",
                borderRadius: "10px",
                background: headerIconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <HugeiconsIcon
                icon={AutomotiveBattery02Icon}
                size={18}
                color={headerIconColor}
                strokeWidth={1.8}
              />
            </div>

            {/* Title + mode badge + subtitle */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0px", minWidth: 0 }}>
              <span
                style={{
                  fontSize: "clamp(0.82rem, 2.8cqi, 0.95rem)",
                  fontWeight: 700,
                  color: textColor,
                  fontFamily: "var(--font-inter), sans-serif",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.15,
                }}
              >
                Smart Energy Manager
              </span>
              <span
                style={{
                  fontSize: "clamp(0.58rem, 1.7cqi, 0.65rem)",
                  fontWeight: 400,
                  color: grayText,
                  fontFamily: "var(--font-inter), sans-serif",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.1,
                }}
              >
                {subtitle}
              </span>
            </div>
          </div>

          {/* Right: iOS-style circular toggle replacing the space */}
          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <div
              role="switch"
              aria-checked={mode === "manual"}
              onClick={() => setMode(m => m === "auto" ? "manual" : "auto")}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                width: "76px",
                height: "26px",
                borderRadius: "999px",
                // Static solid pastel backgrounds (purple critical for auto, blue major for manual)
                backgroundColor: mode === "auto"
                  ? (isDark ? "rgba(167, 139, 250, 0.12)" : "#f3e8ff")
                  : (isDark ? "rgba(96, 165, 250, 0.12)" : "#eff6ff"),
                border: `1px solid ${mode === "auto"
                  ? (isDark ? "rgba(167, 139, 250, 0.2)" : "rgba(124, 58, 237, 0.2)")
                  : (isDark ? "rgba(96, 165, 250, 0.2)" : "rgba(30, 64, 175, 0.2)")
                  }`,
                cursor: "pointer",
                flexShrink: 0,
                userSelect: "none",
                transition: "border-color 0.3s ease, background-color 0.3s ease",
                overflow: "hidden", // clip drifting bubbles to the track bounds
              }}
            >
              {/* Circular Thumb — matches Purple/Blue active state */}
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: mode === "auto" ? "3px" : "53px",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: mode === "auto" ? "#5b21b6" : "#1e3a8a",
                  transition: "left 0.28s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.28s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              />

              {/* "Auto" text — centered in empty space on the right, using Critical Purple */}
              <span
                style={{
                  position: "absolute",
                  left: "23px",
                  right: "0px",
                  textAlign: "center",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-inter), sans-serif",
                  color: isDark ? "#c084fc" : "#5b21b6",
                  opacity: mode === "auto" ? 1 : 0,
                  transform: mode === "auto" ? "translateX(0)" : "translateX(6px)",
                  transition: "opacity 0.2s ease, transform 0.2s ease",
                  pointerEvents: "none",
                }}
              >
                Auto
              </span>

              {/* Drifting bubble sparkles (only rendered/visible in auto mode) */}
              {mode === "auto" && (
                <>
                  <div className="tg-bubble" style={{ left: "26px", top: "4px", width: "2px", height: "2px", animationDelay: "0s", animationDuration: "1.4s", color: isDark ? "#c084fc" : "#5b21b6" }} />
                  <div className="tg-bubble" style={{ left: "32px", top: "14px", width: "3px", height: "3px", animationDelay: "0.3s", animationDuration: "2.1s", color: isDark ? "#c084fc" : "#5b21b6" }} />
                  <div className="tg-bubble" style={{ left: "38px", top: "6px", width: "1.5px", height: "1.5px", animationDelay: "0.7s", animationDuration: "1.6s", color: isDark ? "#c084fc" : "#5b21b6" }} />
                  <div className="tg-bubble" style={{ left: "44px", top: "17px", width: "3.2px", height: "3.2px", animationDelay: "0.2s", animationDuration: "1.9s", color: isDark ? "#c084fc" : "#5b21b6" }} />
                  <div className="tg-bubble" style={{ left: "50px", top: "5px", width: "2px", height: "2px", animationDelay: "1.1s", animationDuration: "1.3s", color: isDark ? "#c084fc" : "#5b21b6" }} />
                  <div className="tg-bubble" style={{ left: "56px", top: "15px", width: "2.5px", height: "2.5px", animationDelay: "0.5s", animationDuration: "1.7s", color: isDark ? "#c084fc" : "#5b21b6" }} />
                  <div className="tg-bubble" style={{ left: "62px", top: "9px", width: "2px", height: "2px", animationDelay: "1.3s", animationDuration: "2.4s", color: isDark ? "#c084fc" : "#5b21b6" }} />
                </>
              )}

              {/* "Manual" text — centered in empty space on the left, using Major Blue */}
              <span
                style={{
                  position: "absolute",
                  left: "0px",
                  right: "23px",
                  textAlign: "center",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-inter), sans-serif",
                  color: isDark ? "#3b82f6" : "#1e3a8a",
                  opacity: mode === "manual" ? 1 : 0,
                  transform: mode === "manual" ? "translateX(0)" : "translateX(-6px)",
                  transition: "opacity 0.2s ease, transform 0.2s ease",
                  pointerEvents: "none",
                }}
              >
                Manual
              </span>
            </div>
          </div>
        </div>

        {/* ── Wrapper to prevent parent flex gap snapping during unmount retract ── */}
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          {/* ── Load Cards Row ── */}
          <div
            style={{
              display: "flex",
              gap: "clamp(0.35rem, 1.5cqi, 0.6rem)",
              width: "100%",
              minWidth: 0,
            }}
          >
            {loads.map(load => (
              <LoadCard
                key={load.id}
                load={load}
                isDark={isDark}
                mode={mode}
                cardBg={cardBg}
                cardBorder={cardBorder}
                onToggle={() => toggleLoad(load.id)}
              />
            ))}
          </div>

          {/* ── Manual mode hint (smooth animated height expand/collapse) ── */}
          <AnimatePresence initial={false}>
            {mode === "manual" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: "hidden", width: "100%" }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                  {/* Centered, narrow divider line (94% width) */}
                  <div style={{ width: "94%", height: "1px", background: cardBorder, marginTop: "0.8rem", marginBottom: "0.4rem" }} />
                  <div
                    style={{
                      paddingBottom: "0.1rem",
                      paddingLeft: "0.5rem",
                      paddingRight: "0.5rem",
                      fontSize: "clamp(0.58rem, 1.6cqi, 0.65rem)",
                      fontWeight: 400,
                      color: grayText,
                      opacity: 0.4,
                      fontFamily: "var(--font-inter), sans-serif",
                      fontStyle: "italic",
                      alignSelf: "flex-start",
                    }}
                  >
                    Manual mode — tap a load card to toggle it on or off
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </BentoCard>
  );
}
