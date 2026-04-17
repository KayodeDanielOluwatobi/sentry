"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StarsIcon,
  MouseIcon,
  Alert01Icon,
  AiLaptopIcon,
  Fan01Icon,
  Tv01Icon as TvIcon,
  Activity01Icon,
  ArrowRight01Icon,
  Sorting05Icon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import BentoCard from "./BentoCard";

export type LoadManagementProps = {
  theme?: "light" | "dark";
  soc?: number;
  inverterMaxWatts?: number;
  lastUpdated?: string;
  withShadow?: boolean;
  style?: React.CSSProperties;
};

type Channel = {
  id: string;
  name: string;
  label: string;
  priority: number;
  thresholdSoc: number;
  powerWatts: number;
  isOn: boolean;
  faultStatus?: "none" | "overload" | "trip";
};

const INITIAL_CHANNELS: Channel[] = [
  { id: "1", name: "Critical", label: "WiFi/Laptops", priority: 3, thresholdSoc: 10, powerWatts: 45, isOn: true },
  { id: "2", name: "Major", label: "Fans", priority: 2, thresholdSoc: 30, powerWatts: 120, isOn: true },
  { id: "3", name: "Non-Essential", label: "TV/Lights", priority: 1, thresholdSoc: 50, powerWatts: 200, isOn: true },
];

export default function LoadManagement({
  theme = "light",
  soc = 89,
  inverterMaxWatts = 1500,
  lastUpdated = "2s ago",
  withShadow = false,
  style,
}: LoadManagementProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#fff" : "#111"; // Main solid color
  const grayText = isDark ? "#9ca3af" : "#6b7280"; // Muted gray
  const lightGrayText = isDark ? "#666" : "#9ca3af"; // Extra light gray

  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [recoveryTimer, setRecoveryTimer] = useState<number | null>(null);

  // Responsive layout tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      // Trigger narrow mode when card is tight (e.g., < 410px)
      setIsNarrow(w < 410);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Logic: In Auto mode, shed Non-Essential first if SOC < threshold
  useEffect(() => {
    if (mode === "auto") {
      setChannels(prev => prev.map(ch => {
        const threshold = ch.thresholdSoc;
        // Logic: If SOC falls below threshold, turn OFF.
        // Simulate a slight buffer (hysterisis) if needed, but keeping it simple for now.
        return {
          ...ch,
          isOn: soc >= threshold
        };
      }));
    }
  }, [soc, mode]);

  const totalWatts = channels.reduce((acc, ch) => acc + (ch.isOn ? ch.powerWatts : 0), 0);
  const nextInLine = [...channels].sort((a, b) => a.priority - b.priority).find(ch => ch.isOn);

  const toggleChannel = (id: string) => {
    if (mode === "manual") {
      setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, isOn: !ch.isOn } : ch));
    }
  };

  const getShedReason = (ch: Channel) => {
    if (!ch.isOn) {
      if (soc < ch.thresholdSoc) return `Shed due to Low Battery (<${ch.thresholdSoc}%)`;
      if (ch.faultStatus === "overload") return "Shed due to Overload";
      return "Manual Override";
    }
    return null;
  };

  return (
    <BentoCard theme={theme} withShadow={withShadow} style={{ padding: "2.5rem", ...style, minHeight: "450px" }}>
      <div ref={containerRef}>
        {/* ── Top Header Section ── */}
        <div style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginBottom: "1.5rem"
        }}>

          <div style={{ flex: "1 1 auto", minWidth: "200px" }}>
            {/* Title Text (Standardized) */}
            <h2 style={{ margin: 0, fontSize: "clamp(1.1rem, 6cqw, 1.6rem)", fontWeight: 400, color: grayText, letterSpacing: "0.01em" }}>
              Load Management
            </h2>

            {/* Hero Metric + Status Pillar Row (Standardized) */}
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginTop: "0.6rem" }}>
              <span style={{ fontSize: "clamp(1.8rem, 10cqw, 2.5rem)", fontWeight: 500, color: textColor, lineHeight: 1, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
                {totalWatts}<span style={{ fontSize: "clamp(0.9rem, 4cqw, 1.2rem)", fontWeight: 400, color: grayText, marginLeft: "0.2rem" }}>W</span>
              </span>
              <span style={{
                background: totalWatts > inverterMaxWatts * 0.9
                  ? (isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2")
                  : totalWatts > inverterMaxWatts * 0.7
                    ? (isDark ? "rgba(249, 115, 22, 0.15)" : "#ffedd5")
                    : (isDark ? "rgba(34, 197, 94, 0.1)" : "#eafee7"),
                color: totalWatts > inverterMaxWatts * 0.9
                  ? "#ef4444"
                  : totalWatts > inverterMaxWatts * 0.7
                    ? "#f97316"
                    : (isDark ? "#86efac" : "#2a7037"),
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
                      width: "clamp(6px, 1.5cqw, 8px)",
                      height: "clamp(6px, 1.5cqw, 8px)",
                      borderRadius: "50%",
                      background: totalWatts > inverterMaxWatts * 0.9
                      ? "#ef4444"
                      : totalWatts > inverterMaxWatts * 0.7
                        ? "#f97316"
                        : (isDark ? "#86efac" : "#2a7037"),
                    display: "inline-block"
                  }}
                />
                {totalWatts > inverterMaxWatts * 0.9 ? "Critical load" :
                  totalWatts > inverterMaxWatts * 0.7 ? "High capacity" :
                    "System healthy"}
              </span>
            </div>

            {/* Last updated (Standardized) */}
            <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>
              <span style={{ color: lightGrayText, fontWeight: 300, letterSpacing: "0.01em" }}>Last updated: </span>
              <span style={{ color: isDark ? "#b4b4b4" : "#a9b3c0", fontWeight: 400, letterSpacing: "0.01em" }}>{lastUpdated}</span>
            </div>
          </div>

          {/* Mode Toggle (Now Scalable & Responsive) */}
          <div style={{
            display: "flex",
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
            borderRadius: isNarrow ? "10px" : "12px",
            padding: isNarrow ? "3px" : "4px",
            border: `1px solid ${isDark ? "#333" : "#dee0e2"}`,
            height: "fit-content",
            alignSelf: isNarrow ? "flex-start" : "auto",
            marginTop: isNarrow ? "0.2rem" : "0"
          }}>
            {(["auto", "manual"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: isNarrow ? "0.25rem 0.5rem" : "0.35rem 0.8rem",
                  borderRadius: isNarrow ? "7px" : "8px",
                  fontSize: isNarrow ? "0.7rem" : "0.78rem",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  background: mode === m ? (isDark ? "#fff" : "#111") : "transparent",
                  color: mode === m ? (isDark ? "#000" : "#fff") : (isDark ? "#777" : "#888"),
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem"
                }}
              >
                {m === "auto" ? (
                  <HugeiconsIcon icon={StarsIcon} size={isNarrow ? 14 : 15} color={mode === "auto" ? (isDark ? "#000" : "#fff") : "currentColor"} variant={mode === "auto" ? "solid" : "stroke"} />
                ) : (
                  <HugeiconsIcon icon={MouseIcon} size={isNarrow ? 14 : 15} />
                )}
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          {/* Header ends here */}
        </div>

        {/* Channel List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
          {channels.map((ch) => {
            const shedReason = getShedReason(ch);
            return (
              <motion.div
                key={ch.id}
                layout
                style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "20px",
                  background: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.4)",
                  border: `1px solid ${isDark ? (ch.isOn ? "#333" : "#21211d") : "#eee"}`,
                  opacity: ch.isOn ? 1 : 0.6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  transition: "all 0.3s ease",
                  minHeight: "72px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: "1 1 auto", minWidth: 0 }}>
                  {/* Power State Icon */}
                  <div
                    onClick={() => toggleChannel(ch.id)}
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "14px",
                      display: "flex",
                      flexShrink: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      background: ch.isOn
                        ? (isDark ? "#22c55e15" : "#22c55e10")
                        : (isDark ? "#ef444415" : "#ef444410"),
                      color: ch.isOn ? "#22c55e" : "#ef4444",
                      border: `1px solid ${ch.isOn ? "#22c55e30" : "#ef444430"}`,
                      cursor: mode === "manual" ? "pointer" : "default",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {ch.name === "Critical" ? <HugeiconsIcon icon={AiLaptopIcon} size={24} /> :
                      ch.name === "Major" ? <HugeiconsIcon icon={Fan01Icon} size={24} /> :
                        <HugeiconsIcon icon={TvIcon} size={24} />}
                  </div>

                  <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "0.01em", whiteSpace: "nowrap" }}>{ch.name}</span>
                      <span style={{ fontSize: "0.75rem", color: grayText, letterSpacing: "0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        • {ch.label}
                      </span>
                    </div>
                    {shedReason ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.1rem" }}>
                        <HugeiconsIcon icon={Alert01Icon} size={14} color="#f97316" />
                        <span style={{ fontSize: "0.7rem", color: "#f97316", fontWeight: 500, letterSpacing: "0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {shedReason}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: isDark ? "#22c55e" : "#16a34a", fontWeight: 500, letterSpacing: "0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        Active · {ch.thresholdSoc}% threshold
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>
                    {ch.isOn ? ch.powerWatts : 0}<span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#888", marginLeft: "2px", letterSpacing: "0.01em" }}>W</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer / Stats */}
        <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: `1px solid ${isDark ? "#222" : "#eee"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div>
              <div style={{ fontSize: "0.85rem", color: grayText, fontWeight: 400, letterSpacing: "0.01em" }}>Load capacity</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.01em" }}>
                {totalWatts} <span style={{ fontSize: "0.8rem", color: grayText, letterSpacing: "0.01em" }}>/ {inverterMaxWatts}W MAX</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.85rem", color: grayText, fontWeight: 400, letterSpacing: "0.01em" }}>Next in line</div>
              <div style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: totalWatts > inverterMaxWatts * 0.8
                  ? (isDark ? "#f87171" : "#ef4444")
                  : (isDark ? "#fb923c" : "#f97316"),
                letterSpacing: "0.01em"
              }}>
                {nextInLine ? nextInLine.name : "None - all shed"}
              </div>
            </div>
          </div>

          {/* Lively Progress Bar for Total Load */}
          <div style={{
            width: "100%",
            height: "12px",
            background: isDark ? "#1a1a1a" : "#f0f0f0",
            borderRadius: "6px",
            overflow: "hidden",
            position: "relative",
            marginTop: "0.25rem"
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (totalWatts / inverterMaxWatts) * 100)}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 15 }}
              style={{
                height: "100%",
                background: totalWatts > inverterMaxWatts * 0.85
                  ? "linear-gradient(90deg, #ef4444, #f87171)"
                  : totalWatts > inverterMaxWatts * 0.6
                    ? "linear-gradient(90deg, #f97316, #fbbf24)"
                    : "linear-gradient(90deg, #22c55e, #4ade80)",
                boxShadow: totalWatts > inverterMaxWatts * 0.85
                  ? "0 0 15px rgba(239, 68, 68, 0.4)"
                  : totalWatts > inverterMaxWatts * 0.6
                    ? "0 0 15px rgba(249, 115, 22, 0.3)"
                    : "0 0 15px rgba(34, 197, 94, 0.3)",
                position: "relative",
                overflow: "hidden",
                borderRadius: "inherit"
              }}
            >
              <motion.div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  width: "50%",
                  borderRadius: "inherit",
                  overflow: "hidden"
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              />
              {/* Additional "pulse" for critical load */}
              {totalWatts > inverterMaxWatts * 0.85 && (
                <motion.div
                  style={{ position: "absolute", inset: 0, background: "#ef4444", borderRadius: "inherit" }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                />
              )}
            </motion.div>
          </div>

          {/* Priority Map */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.25rem" }}>
            <HugeiconsIcon icon={Sorting05Icon} size="clamp(14px, 4cqw, 17px)" color={lightGrayText} />
            <span style={{ fontSize: "clamp(0.6rem, 2.8cqw, 0.75rem)", fontWeight: 400, color: lightGrayText, letterSpacing: "0.01em" }}>Shedding hierarchy:</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginLeft: "auto" }}>
              {["Non-Essential", "Major", "Critical"].map((p, i) => (
                <React.Fragment key={p}>
                  <span style={{
                    fontSize: "clamp(0.55rem, 2.5cqw, 0.72rem)",
                    color: lightGrayText,
                    fontWeight: 600,
                    letterSpacing: "0.01em"
                  }}>{p}</span>
                  {i < 2 && <HugeiconsIcon icon={ArrowRight01Icon} size="clamp(10px, 3cqw, 12px)" color={isDark ? "#333" : "#ddd"} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
