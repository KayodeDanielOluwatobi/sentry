"use client";

import React, { useState, useMemo } from "react";
import { Cancel01Icon, SparklesIcon, ShieldCheck, ExpandIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import BentoCard, { CardTheme } from "./BentoCard";

export interface ActiveAlarmsProps extends React.HTMLAttributes<HTMLDivElement> {
  activeCount?: number;
  theme?: CardTheme;
  withShadow?: boolean;
  errorsBitmask?: number;
  soc?: number;
  temperature?: number;
  cellDelta?: number;
  onClick?: () => void;
}

const errorNames = [
  "Wire resistance",           "MOSFET overtemperature",     "Cell count mismatch",       "",
  "Battery fully charged",     "Pack overvoltage",           "Charge overcurrent",        "Charge short circuit",
  "Charge overtemperature",    "Charge undertemperature",    "Coprocessor comm error",    "Cell undervoltage",
  "Pack undervoltage",         "Discharge overcurrent",      "Discharge short circuit",   "Discharge overtemperature",
  "Charging MOSFET abnormal",  "Discharging MOSFET abnormal","GPS disconnected",          "Modify password in time",
  "Discharge on failed",       "Battery overtemperature",    "Temp sensor anomaly",       "PL module anomaly",
  "SCP release failed",        "Discharge OCP II",           "Discharge OCP III",         "Discharge undertemp alarm",
  "GPS remote lock",           "",                           "",                          ""
];

function getAlarmSeverity(name: string): "critical" | "warning" | "info" {
  const criticalList = [
    "Pack overvoltage",
    "Charge short circuit",
    "Discharge short circuit",
    "Cell undervoltage",
    "Pack undervoltage",
    "Battery overtemperature",
    "Temp sensor anomaly",
    "Discharge OCP II",
    "Discharge OCP III"
  ];
  const infoList = ["Battery fully charged"];

  if (criticalList.includes(name)) return "critical";
  if (infoList.includes(name)) return "info";
  return "warning";
}

interface DiagnosisItem {
  name: string;
  severity: "critical" | "warning" | "info";
  description: string;
  isActive: boolean;
}

// ─── Modal Panel ─────────────────────────────────────────────────────────────
function AlarmsModal({
  open,
  onClose,
  isDark,
  soc = 60,
  temperature,
  cellDelta,
  errorsBitmask = 0,
}: {
  open: boolean;
  onClose: () => void;
  isDark: boolean;
  soc?: number;
  temperature?: number;
  cellDelta?: number;
  errorsBitmask?: number;
}) {
  if (!open) return null;

  // Build the complete list of all possible alarms/diagnostics, sorted active first
  const allDiagnostics = useMemo(() => {
    const list: DiagnosisItem[] = [];

    // 1. Static Thresholds
    const isTempHigh = temperature !== undefined && temperature > 45;
    list.push({
      name: "Temperature Limit Monitor",
      severity: "critical",
      description: isTempHigh
        ? `BMS temperature sensor reports ${temperature.toFixed(1)}°C (limit: 45.0°C).`
        : `Battery temperature is normal (${temperature !== undefined ? temperature.toFixed(1) : "—"}°C).`,
      isActive: isTempHigh,
    });

    const isDeltaHigh = cellDelta !== undefined && cellDelta > 15;
    list.push({
      name: "Cell Voltage Balance Monitor",
      severity: "warning",
      description: isDeltaHigh
        ? `Maximum cell delta mismatch is ${cellDelta}mV (limit: 15mV).`
        : `Cell delta balance is within normal limits (${cellDelta !== undefined ? cellDelta : "—"}mV).`,
      isActive: isDeltaHigh,
    });

    const isSocLow = soc !== undefined && soc < 10;
    list.push({
      name: "Battery Critical SOC Monitor",
      severity: "critical",
      description: isSocLow
        ? `State of charge has dropped to ${soc}% (low limit: 10%).`
        : `State of charge is normal (${soc}%).`,
      isActive: isSocLow,
    });

    // 2. BMS Register Bitmasks
    for (let b = 0; b < 32; b++) {
      const name = errorNames[b];
      if (name && name.trim() !== "") {
        const isActive = ((errorsBitmask >> b) & 1) === 1;
        list.push({
          name,
          severity: getAlarmSeverity(name),
          description: isActive
            ? `Alert bit #${b} asserted by JK-BMS register.`
            : `BMS diagnostic loop #${b} reports normal status.`,
          isActive,
        });
      }
    }

    // Sort: active items at the top
    return list.sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0));
  }, [temperature, cellDelta, soc, errorsBitmask]);

  const activeCount = allDiagnostics.filter(d => d.isActive).length;

  return (
    <>
      <style>{`
        @keyframes alarmsModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes alarmsOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: isDark ? "rgba(10, 10, 10, 0.35)" : "rgba(255, 255, 255, 0.35)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          zIndex: 1000000,
          animation: "alarmsOverlayIn 0.2s ease",
        }}
      />
      {/* Panel */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          zIndex: 1000001,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: "min(490px, 96vw)",
            maxHeight: "90vh",
            borderRadius: "22px",
            background: activeCount > 0
              ? (isDark
                  ? "linear-gradient(145deg, #0e0709 0%, #1c0a0c 50%, #0d0d0f 100%)"
                  : "linear-gradient(145deg, #fff5f5 0%, #ffebee 50%, #fafafa 100%)")
              : (isDark
                  ? "linear-gradient(145deg, #060d1a 0%, #0a1226 50%, #07090f 100%)"
                  : "linear-gradient(145deg, #f0f7ff 0%, #e6f0fa 50%, #fafafa 100%)"),
            border: activeCount > 0
              ? `1px solid ${isDark ? "rgba(239,68,68,0.22)" : "rgba(239,68,68,0.14)"}`
              : `1px solid ${isDark ? "rgba(14,165,233,0.22)" : "rgba(14,165,233,0.14)"}`,
            boxShadow: activeCount > 0
              ? (isDark
                  ? "0 32px 80px rgba(0,0,0,0.75), 0 0 40px rgba(239,68,68,0.08)"
                  : "0 32px 80px rgba(0,0,0,0.18), 0 0 30px rgba(239,68,68,0.05)")
              : (isDark
                  ? "0 32px 80px rgba(0,0,0,0.75), 0 0 40px rgba(14,165,233,0.08)"
                  : "0 32px 80px rgba(0,0,0,0.18), 0 0 30px rgba(14,165,233,0.05)"),
            animation: "alarmsModalIn 0.25s ease",
            pointerEvents: "all",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "clamp(1.1rem, 4cqi, 1.4rem)", display: "flex", flexDirection: "column", overflowY: "auto", gap: "1rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: activeCount > 0
                    ? (isDark ? "rgba(239, 68, 68, 0.18)" : "#fee2e2")
                    : (isDark ? "rgba(14, 165, 233, 0.15)" : "#e0f2fe"),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: activeCount > 0 ? (isDark ? "#f87171" : "#dc2626") : (isDark ? "#38bdf8" : "#0284c7"),
                  flexShrink: 0
                }}>
                  {activeCount > 0 ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      color="currentColor"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M12 8v4" strokeLinejoin="round"></path>
                      <path d="M12 16h.01" strokeLinejoin="round"></path>
                      <path d="M20.9922 11.1835V8.28041C20.9922 6.64041 20.9922 5.82041 20.5881 5.28541C20.184 4.75042 19.2703 4.49068 17.4429 3.97122C16.1944 3.61632 15.0938 3.18875 14.2145 2.79841C13.0156 2.26622 12.4161 2.00012 11.9922 2.00012C11.5682 2.00012 10.9688 2.26622 9.7699 2.79841C8.89057 3.18875 7.79002 3.61632 6.54152 3.97122C4.71411 4.49068 3.80041 4.75042 3.3963 5.28541C2.99219 5.82041 2.99219 6.64041 2.99219 8.28041V11.1835C2.99219 16.8086 8.05496 20.1836 10.5861 21.5195C11.1932 21.8399 11.4968 22.0001 11.9922 22.0001C12.4876 22.0001 12.7911 21.8399 13.3982 21.5195C15.9294 20.1836 20.9922 16.8086 20.9922 11.1835Z"></path>
                    </svg>
                  ) : (
                    <HugeiconsIcon icon={ShieldCheck} size={20} />
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "clamp(0.88rem, 3cqi, 1.02rem)", color: isDark ? "#fff" : "#111", fontFamily: "var(--font-inter), sans-serif" }}>
                    Active Alarms
                  </div>
                  <div style={{ fontSize: "clamp(0.62rem, 2cqi, 0.68rem)", color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280" }}>
                    Live JK-BMS warning registry
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  border: "none",
                  borderRadius: "10px",
                  width: 30, height: 30,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={1.8} />
              </button>
            </div>

            {/* Summary banner */}
            <div style={{
              borderRadius: "12px",
              background: activeCount > 0
                ? (isDark ? "rgba(239,68,68,0.14)" : "rgba(239,68,68,0.08)")
                : (isDark ? "rgba(14,165,233,0.12)" : "rgba(14,165,233,0.06)"),
              border: activeCount > 0
                ? `1px solid ${isDark ? "rgba(239,68,68,0.28)" : "rgba(239,68,68,0.18)"}`
                : `1px solid ${isDark ? "rgba(14,165,233,0.22)" : "rgba(14,165,233,0.12)"}`,
              padding: "0.75rem 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: "clamp(0.6rem, 1.8cqi, 0.68rem)", color: isDark ? "rgba(255,255,255,0.55)" : "#6b7280", marginBottom: "0.15rem" }}>
                  Active alarms state
                </div>
                <div style={{
                  fontSize: "clamp(1.2rem, 4.5cqi, 1.45rem)",
                  fontWeight: 800,
                  color: activeCount > 0
                    ? (isDark ? "#f87171" : "#dc2626")
                    : (isDark ? "#38bdf8" : "#0284c7"),
                  letterSpacing: "-0.02em",
                  fontFamily: "var(--font-inter), sans-serif"
                }}>
                  {activeCount > 0 ? `${activeCount} Warning${activeCount > 1 ? "s" : ""} Active` : "All Systems Operational"}
                </div>
              </div>
            </div>

            {/* Complete diagnostics list */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              maxHeight: "clamp(220px, 45vh, 340px)",
              overflowY: "auto",
              paddingRight: "4px",
            }}>
              {allDiagnostics.map((alarm, idx) => {
                const isCrit = alarm.severity === "critical";
                const isInfo = alarm.severity === "info";
                
                const sevColor = isCrit
                  ? (isDark ? "#f87171" : "#dc2626")
                  : isInfo
                  ? (isDark ? "#60a5fa" : "#2563eb")
                  : (isDark ? "#fbbf24" : "#d97706");
                
                const sevBg = isCrit
                  ? (isDark ? "rgba(239, 68, 68, 0.14)" : "#fee2e2")
                  : isInfo
                  ? (isDark ? "rgba(59, 130, 246, 0.12)" : "#dbeafe")
                  : (isDark ? "rgba(245, 158, 11, 0.12)" : "#fef3c7");

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.6rem",
                      padding: "0.65rem 0.8rem",
                      borderRadius: "10px",
                      background: alarm.isActive
                        ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)")
                        : "transparent",
                      border: `1px solid ${alarm.isActive 
                        ? (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)") 
                        : "transparent"}`,
                      opacity: alarm.isActive ? 1 : 0.35,
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    {/* Status Indicator Bar */}
                    <div style={{
                      width: "3px",
                      alignSelf: "stretch",
                      borderRadius: "99px",
                      background: alarm.isActive ? sevColor : (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"),
                      flexShrink: 0,
                    }} />
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.15rem" }}>
                        <span style={{ 
                          fontWeight: alarm.isActive ? 700 : 500, 
                          fontSize: "clamp(0.72rem, 2cqi, 0.78rem)", 
                          color: alarm.isActive ? (isDark ? "#e5e7eb" : "#111") : (isDark ? "#9ca3af" : "#6b7280"), 
                          fontFamily: "var(--font-inter), sans-serif" 
                        }}>
                          {alarm.name}
                        </span>
                        {alarm.isActive ? (
                          <span style={{
                            fontSize: "clamp(0.48rem, 1.4cqi, 0.54rem)",
                            fontWeight: 700,
                            color: sevColor,
                            background: sevBg,
                            padding: "0.05rem 0.35rem",
                            borderRadius: "99px",
                            textTransform: "uppercase",
                            letterSpacing: "0.02em",
                          }}>
                            {alarm.severity}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: "clamp(0.48rem, 1.4cqi, 0.54rem)",
                            fontWeight: 600,
                            color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af",
                            background: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6",
                            padding: "0.05rem 0.35rem",
                            borderRadius: "99px",
                            textTransform: "uppercase",
                          }}>
                            OK
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "clamp(0.6rem, 1.8cqi, 0.65rem)", color: isDark ? "rgba(255,255,255,0.4)" : "#6b7280", lineHeight: 1.4 }}>
                        {alarm.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note about hardware safety loops */}
            <div style={{
              padding: "0.85rem",
              borderRadius: "12px",
              background: activeCount > 0
                ? (isDark ? "rgba(239, 68, 68, 0.05)" : "rgba(239, 68, 68, 0.02)")
                : (isDark ? "rgba(14, 165, 233, 0.05)" : "rgba(14, 165, 233, 0.02)"),
              border: `1px dashed ${activeCount > 0
                ? (isDark ? "rgba(239, 68, 68, 0.2)" : "rgba(239, 68, 68, 0.12)")
                : (isDark ? "rgba(14, 165, 233, 0.2)" : "rgba(14, 165, 233, 0.12)")}`,
              fontSize: "clamp(0.6rem, 1.8cqi, 0.65rem)",
              color: isDark ? "rgba(255,255,255,0.5)" : "#4b5563",
              lineHeight: 1.5,
            }}>
              💡 <strong>Automatic Safety Loops</strong>: When active, critical alarms automatically trigger hardware relays via ESP32 control loops to isolate circuits and prevent cell deep discharge.
            </div>

            {/* Footer */}
            <div style={{ fontSize: "clamp(0.58rem, 1.8cqi, 0.62rem)", color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af", textAlign: "center", fontFamily: "var(--font-inter), sans-serif" }}>
              Bitmask reference code: JK02_32S registers
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────
export default function ActiveAlarms({
  activeCount = 0,
  theme = "light",
  withShadow = true,
  errorsBitmask = 0,
  soc,
  temperature,
  cellDelta,
  onClick,
  style,
  ...props
}: ActiveAlarmsProps) {
  const isDark = theme === "dark";
  const [modalOpen, setModalOpen] = useState(false);

  const textColor = isDark ? "#ffffff" : "#111111";
  const grayText = isDark ? "#9ca3af" : "#4b5563";

  // Alert colors: pastel green for all clear, soft red pastel for alarms
  const iconBg = activeCount > 0
    ? (isDark ? "rgba(239, 68, 68, 0.18)" : "#fee2e2")
    : (isDark ? "rgba(16, 185, 129, 0.15)" : "#e6fcf0");
  
  const iconColor = activeCount > 0 
    ? (isDark ? "#f87171" : "#dc2626") 
    : (isDark ? "#34d399" : "#059669");

  const statusColor = activeCount > 0 ? (isDark ? "#f87171" : "#dc2626") : (isDark ? "#34d399" : "#059669");
  const statusLabel = activeCount > 0 ? "Requires Attention" : "All Clear";

  // Premium horizontal and vertical paddings
  const verticalPadding = "clamp(0.65rem, 2cqi, 0.85rem)";
  const horizontalPadding = "clamp(1.1rem, 4cqi, 1.6rem)";
  const bentoRadius = `calc(14px + ${verticalPadding})`;

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick();
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
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
          cursor: "pointer",
          ...style,
        }}
        onClick={handleCardClick}
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
                background: isDark ? "rgba(239, 68, 68, 0.18)" : "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: isDark ? "#f87171" : "#dc2626"
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                color="currentColor"
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

          {/* Right: Expand Icon */}
          <div style={{ color: isDark ? "#4b5563" : "#9ca3af", flexShrink: 0, display: "flex", alignItems: "center" }}>
            <HugeiconsIcon
              icon={ExpandIcon}
              size={16}
              strokeWidth={1.6}
              color="currentColor"
            />
          </div>
        </div>
      </BentoCard>

      {/* Expanded Modal */}
      <AlarmsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isDark={isDark}
        errorsBitmask={errorsBitmask}
        soc={soc}
        temperature={temperature}
        cellDelta={cellDelta}
      />
    </>
  );
}
