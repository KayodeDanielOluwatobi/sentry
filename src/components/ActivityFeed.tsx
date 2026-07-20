"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BentoCard, { CardTheme } from "./BentoCard";
import { ExpandIcon, Router01Icon, Fan01Icon, BulbChargingIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export interface ActivityEvent {
  id: string;
  type:
    | "load_shed"
    | "load_restore"
    | "charging_started"
    | "charging_stopped"
    | "protection_triggered"
    | "cell_imbalance"
    | "temperature_high"
    | "wifi_lost"
    | "wifi_restored"
    | "manual_override";
  severity: "info" | "warning" | "success" | "critical" | "neutral" | "discovery";
  title: string;
  message: string;
  timestamp: Date;
  badge?: string;
  runtimeGain?: string; // e.g. "+1h 18m"
  level?: "critical" | "major" | "non-essential";
}

export interface ActivityFeedProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: CardTheme;
  withShadow?: boolean;
  soc?: number;
  isCharging?: boolean;
  temperature?: number;
  currentLoad?: number;
  cellVoltages?: number[];
  managerMode?: "auto" | "manual";
  managerLoads?: Array<{ id: string; name: string; level: "critical" | "major" | "non-essential"; status: string; isOn: boolean }>;
  events?: ActivityEvent[];
  onEventsChange?: (updateFn: any) => void;
}

// ─── Severe Color Mapping Helper ──────────────────────────────────────────────
function getSeverityColors(severity: string, isDark: boolean) {
  switch (severity) {
    case "critical":
      return {
        bg: "rgba(239, 68, 68, 0.15)",
        border: "1px solid rgba(239, 68, 68, 0.25)",
        iconColor: "#ef4444",
        badgeBg: isDark ? "rgba(239, 68, 68, 0.25)" : "rgba(239, 68, 68, 0.12)",
        badgeText: isDark ? "#fee2e2" : "#991b1b"
      };
    case "warning":
      return {
        bg: "rgba(249, 115, 22, 0.12)",
        border: "1px solid rgba(249, 115, 22, 0.25)",
        iconColor: "#f97316",
        badgeBg: isDark ? "rgba(249, 115, 22, 0.22)" : "rgba(249, 115, 22, 0.12)",
        badgeText: isDark ? "#ffedd5" : "#9a3412"
      };
    case "success":
      return {
        bg: "rgba(34, 197, 94, 0.12)",
        border: "1px solid rgba(34, 197, 94, 0.25)",
        iconColor: "#22c55e",
        badgeBg: isDark ? "rgba(34, 197, 94, 0.22)" : "rgba(34, 197, 94, 0.12)",
        badgeText: isDark ? "#d1fae5" : "#166534"
      };
    case "info":
      return {
        bg: "rgba(59, 130, 246, 0.12)",
        border: "1px solid rgba(59, 130, 246, 0.25)",
        iconColor: "#3b82f6",
        badgeBg: isDark ? "rgba(59, 130, 246, 0.22)" : "rgba(59, 130, 246, 0.12)",
        badgeText: isDark ? "#dbeafe" : "#1e40af"
      };
    case "discovery":
      return {
        bg: "rgba(168, 85, 247, 0.12)",
        border: "1px solid rgba(168, 85, 247, 0.25)",
        iconColor: "#a855f7",
        badgeBg: isDark ? "rgba(168, 85, 247, 0.22)" : "rgba(168, 85, 247, 0.12)",
        badgeText: isDark ? "#f3e8ff" : "#6b21a8"
      };
    case "neutral":
    default:
      return {
        bg: "rgba(255, 255, 255, 0.05)",
        border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
        iconColor: isDark ? "#ffffff" : "#111111",
        badgeBg: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
        badgeText: isDark ? "#f3f4f6" : "#374151"
      };
  }
}

// ─── Inline SVGs Helper ───────────────────────────────────────────────────────
function EventIcon({ type, level, color }: { type: string; level?: string; color: string }) {
  const p = { width: "16", height: "16", stroke: color, strokeWidth: "2.2", fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "load_shed" || type === "load_restore") {
    let iconToUse = BulbChargingIcon;
    if (level === "critical") iconToUse = Router01Icon;
    else if (level === "major") iconToUse = Fan01Icon;
    else if (level === "non-essential") iconToUse = BulbChargingIcon;

    return (
      <HugeiconsIcon
        icon={iconToUse}
        size={16}
        color={color}
        strokeWidth={1.8}
      />
    );
  }
  switch (type) {
    case "charging_started":
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <path d="M23 12a11 11 0 1 1-22 0 11 11 0 0 1 22 0z" />
          <path d="M12 7v10M8 11l4 4 4-4" />
        </svg>
      );
    case "charging_stopped":
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <rect x="5" y="4" width="6" height="16" rx="1" />
          <rect x="13" y="4" width="6" height="16" rx="1" />
        </svg>
      );
    case "protection_triggered":
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      );
    case "cell_imbalance":
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
    case "temperature_high":
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z" />
        </svg>
      );
    case "wifi_lost":
    case "wifi_restored":
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.1a6 6 0 0 1 6.95 0M12 20h.01" />
        </svg>
      );
    case "manual_override":
    default:
      return (
        <svg viewBox="0 0 24 24" {...p}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
  }
}

export default function ActivityFeed({
  theme = "light",
  withShadow = true,
  soc = 89,
  isCharging = true,
  temperature = 28.9,
  currentLoad = 450,
  cellVoltages = [3.199, 3.197, 3.196, 3.199],
  managerMode = "auto",
  managerLoads = [],
  events: propEvents,
  onEventsChange: propOnEventsChange,
  style,
  ...props
}: ActivityFeedProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#ffffff" : "#111111";
  const grayText = isDark ? "#9ca3af" : "#6b7280";
  const lightGrayText = isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.45)";
  const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb";

  const [viewAll, setViewAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [now, setNow] = useState(new Date());

  // Setup Mockup Seed History Events with local fallback
  const [localEvents, setLocalEvents] = useState<ActivityEvent[]>([
    {
      id: "evt_101",
      type: "load_shed",
      severity: "warning",
      title: "Battery preservation activated",
      message: "Non-essential load was disconnected after SOC fell below 60%.",
      timestamp: new Date(Date.now() - 120 * 1000), // 2 min ago
      badge: "Automatic",
      runtimeGain: "+1h 18m",
      level: "non-essential"
    },
    {
      id: "evt_102",
      type: "load_restore",
      severity: "success",
      title: "Non-essential load restored",
      message: "Non-essential load was restored after SOC rose above 65%.",
      timestamp: new Date(Date.now() - 1080 * 1000), // 18 min ago
      badge: "Recovered",
      level: "non-essential"
    },
    {
      id: "evt_103",
      type: "wifi_restored",
      severity: "success",
      title: "WiFi network reconnected",
      message: "ESP32 wireless network connection established.",
      timestamp: new Date(Date.now() - 3600 * 1000), // 1 hour ago
      badge: "Recovered"
    },
    {
      id: "evt_104",
      type: "cell_imbalance",
      severity: "warning",
      title: "Cell imbalance detected",
      message: "Voltage delta exceeded 15mV threshold.",
      timestamp: new Date(Date.now() - 7200 * 1000), // 2 hours ago
      badge: "Automatic"
    }
  ]);

  const events = propEvents !== undefined ? propEvents : localEvents;
  const setEvents = (updateFn: any) => {
    if (propOnEventsChange) {
      propOnEventsChange(updateFn);
    } else {
      setLocalEvents(updateFn);
    }
  };

  // Monitor resize for mobile responsive scaling
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update timestamps every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Track Previous States for Change Trigger Logic
  const prevMode = useRef(managerMode);
  const prevLoads = useRef(managerLoads);
  const prevIsCharging = useRef(isCharging);
  const prevSoc = useRef(soc);

  useEffect(() => {
    const newEvts: ActivityEvent[] = [];

    // A. Detect Mode changes
    if (prevMode.current !== managerMode) {
      if (managerMode === "manual") {
        newEvts.push({
          id: `evt_m_${Date.now()}`,
          type: "manual_override",
          severity: "discovery",
          title: "Manual override activated",
          message: "System shifted to manual load management. Automatic priorities suspended.",
          timestamp: new Date(),
          badge: "Manual"
        });
      } else {
        newEvts.push({
          id: `evt_a_${Date.now()}`,
          type: "manual_override",
          severity: "success",
          title: "Automatic mode active",
          message: "Grid smart links and priority auto-shed logic engaged.",
          timestamp: new Date(),
          badge: "Automatic"
        });
      }
      prevMode.current = managerMode;
    }

    // B. Detect Manual Toggle Load events
    if (JSON.stringify(prevLoads.current) !== JSON.stringify(managerLoads)) {
      if (prevLoads.current.length === managerLoads.length && managerMode === "manual") {
        managerLoads.forEach((load, idx) => {
          const prevLoad = prevLoads.current[idx];
          if (prevLoad && prevLoad.isOn !== load.isOn) {
            const priorityLabel = load.level === "critical" ? "Critical load" : load.level === "major" ? "Major load" : "Non-essential load";
            if (!load.isOn) {
              newEvts.push({
                id: `evt_ls_${Date.now()}_${load.id}`,
                type: "load_shed",
                severity: "warning",
                title: `${priorityLabel} disconnected`,
                message: `${priorityLabel} was manually disconnected by user override.`,
                timestamp: new Date(),
                badge: "Manual",
                level: load.level
              });
            } else {
              newEvts.push({
                id: `evt_lr_${Date.now()}_${load.id}`,
                type: "load_restore",
                severity: "success",
                title: `${priorityLabel} reconnected`,
                message: `${priorityLabel} was manually reconnected by user.`,
                timestamp: new Date(),
                badge: "Manual",
                level: load.level
              });
            }
          }
        });
      }
      prevLoads.current = managerLoads;
    }

    // C. Detect Charging state changes
    if (prevIsCharging.current !== isCharging) {
      if (isCharging) {
        newEvts.push({
          id: `evt_cs_${Date.now()}`,
          type: "charging_started",
          severity: "info",
          title: "Battery charging initiated",
          message: "AC utility charger engaged. Replenishing cells.",
          timestamp: new Date(),
          badge: "Automatic"
        });
      } else {
        newEvts.push({
          id: `evt_cst_${Date.now()}`,
          type: "charging_stopped",
          severity: "neutral",
          title: "Discharging phase active",
          message: "Battery backup online. Drawing reserve capacity.",
          timestamp: new Date(),
          badge: "Automatic"
        });
      }
      prevIsCharging.current = isCharging;
    }

    // D. Detect preservation drop (SOC < 60)
    if (prevSoc.current >= 60 && soc < 60 && !isCharging) {
      newEvts.push({
        id: `evt_sp_${Date.now()}`,
        type: "load_shed",
        severity: "warning",
        title: "Battery preservation activated",
        message: "Non-essential load was disconnected after SOC fell below 60%.",
        timestamp: new Date(),
        badge: "Automatic",
        runtimeGain: "+1h 18m",
        level: "non-essential"
      });
    }
    // Detect recovery (SOC > 65)
    if (prevSoc.current <= 65 && soc > 65) {
      newEvts.push({
        id: `evt_spr_${Date.now()}`,
        type: "load_restore",
        severity: "success",
        title: "Non-essential load restored",
        message: "Non-essential load was restored after SOC rose above 65%.",
        timestamp: new Date(),
        badge: "Recovered",
        level: "non-essential"
      });
    }
    prevSoc.current = soc;

    if (newEvts.length > 0) {
      setEvents((prev: ActivityEvent[]) => [...newEvts, ...prev]);
    }
  }, [managerMode, managerLoads, isCharging, soc]);

  // Relative Time Formatter Helper
  const getRelativeTimeText = (date: Date) => {
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const visibleEvents = viewAll ? events : events.slice(0, 5);

  return (
    <BentoCard
      theme={theme}
      withShadow={withShadow}
      style={{
        borderRadius: "20px",
        width: "100%",
        padding: 0, // removed padding for full width dividers
        minHeight: "100px",
        ...style
      }}
      {...props}
    >
      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        {/* Header Row inside BentoCard */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            padding: isMobile ? "0.7rem 1.5rem" : "0.95rem 2.5rem",
            borderBottom: `1px solid ${cardBorder}`
          }}
        >
          <span
            style={{
              fontSize: "clamp(0.82rem, 2.8cqi, 0.95rem)",
              fontWeight: 700,
              color: textColor,
              fontFamily: "var(--font-inter), sans-serif",
              lineHeight: 1.15
            }}
          >
            Activity Feed
          </span>
          <button
            onClick={() => setViewAll(!viewAll)}
            style={{
              background: "none",
              border: "none",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isDark ? "#9ca3af" : "#6b7280",
              opacity: 0.7,
              cursor: "pointer",
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
            aria-label="Expand Activity Feed"
          >
            <HugeiconsIcon
              icon={ExpandIcon}
              size={18}
              strokeWidth={1}
              style={{
                transform: viewAll ? "rotate(180deg)" : "none",
                transition: "transform 0.2s ease"
              }}
            />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <AnimatePresence initial={false}>
            {visibleEvents.map((evt, idx) => {
              const colors = getSeverityColors(evt.severity, isDark);
              return (
                <motion.div
                  key={evt.id}
                  layout
                  initial={{ opacity: 0, y: -15, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: 15, height: 0 }}
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: "0.75rem",
                      padding: isMobile ? "0.7rem 1.5rem" : "0.95rem 2.5rem",
                      borderBottom: idx === visibleEvents.length - 1 ? "none" : `1px solid ${cardBorder}`,
                      alignItems: "flex-start",
                      width: "100%"
                    }}
                  >
                    {/* Left Event Icon Badge */}
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        background: colors.bg,
                        border: colors.border,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: "0.08rem"
                      }}
                    >
                      <EventIcon type={evt.type} level={evt.level} color={colors.iconColor} />
                    </div>

                    {/* Middle text blocks */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", minWidth: 0, flex: 1 }}>
                      {/* Title + Pill Badge */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: isMobile ? "0.8rem" : "0.92rem", fontWeight: 600, color: textColor, lineHeight: 1.25 }}>
                          {evt.title}
                        </span>
                        {evt.badge && (
                          <span
                            style={{
                              background: colors.badgeBg,
                              color: colors.badgeText,
                              fontSize: "0.58rem",
                              fontWeight: 600,
                              padding: "0.05rem 0.35rem",
                              borderRadius: "4px",
                              textTransform: "capitalize",
                              letterSpacing: "0.01em"
                            }}
                          >
                            {evt.badge}
                          </span>
                        )}
                      </div>

                      {/* Description (Truncated with ellipsis, no wrapping) */}
                      <p
                        style={{
                          margin: 0,
                          fontSize: isMobile ? "0.72rem" : "0.82rem",
                          color: grayText,
                          fontWeight: 400,
                          lineHeight: 1.35,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "100%"
                        }}
                      >
                        {evt.message}
                      </p>

                      {/* Footer Timestamps and Extras */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.18rem", color: lightGrayText, flexWrap: "wrap" }}>
                        {/* Timer */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.22rem" }}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="11"
                            height="11"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span style={{ fontSize: "0.68rem", fontWeight: 400 }}>
                            {getRelativeTimeText(evt.timestamp)}
                          </span>
                        </div>

                        {/* Optional Runtime Gain indicator */}
                        {evt.runtimeGain && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.22rem" }}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              width="11"
                              height="11"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 14 14" />
                            </svg>
                            <span style={{ fontSize: "0.68rem", fontWeight: 400 }}>
                              Estimated runtime {evt.runtimeGain}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </BentoCard>
  );
}
