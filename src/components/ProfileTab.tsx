"use client";

import React, { useState, useEffect } from "react";
import { 
  DatabaseIcon, 
  BluetoothIcon, 
  CpuIcon, 
  Settings01Icon, 
  GithubIcon, 
  Logout01Icon, 
  LicenseIcon,
  WifiIcon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface ProfileTabProps {
  theme: "light" | "dark";
  authUser: any;
  supabase: any;
  bleConnected?: boolean;
  wifiConnected?: boolean;
  lastFirebaseUpdate?: number;
}

export default function ProfileTab({ 
  theme, 
  authUser, 
  supabase, 
  bleConnected = true, 
  wifiConnected = true,
  lastFirebaseUpdate
}: ProfileTabProps) {
  const isDark = theme === "dark";
  const [selectedNode, setSelectedNode] = useState<"bms" | "esp32" | "nodemcu" | "cloud">("bms");

  const [highRateSync, setHighRateSync] = useState(true);
  const [audioWarnings, setAudioWarnings] = useState(false);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [secondsAgo, setSecondsAgo] = useState<number | string>("—");

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedSync = localStorage.getItem("sentry_high_rate_sync");
      if (cachedSync !== null) setHighRateSync(cachedSync === "true");

      const cachedAudio = localStorage.getItem("sentry_audio_warnings");
      if (cachedAudio !== null) setAudioWarnings(cachedAudio === "true");

      const cachedPush = localStorage.getItem("sentry_push_alerts");
      if (cachedPush !== null) setPushAlerts(cachedPush === "true");
    }
  }, []);

  // Sync elapsed seconds since last database update
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

  // Determine active system state using the identical SystemInsight 30-second heartbeat check logic
  const isOffline = lastFirebaseUpdate === undefined || (typeof secondsAgo === "number" && secondsAgo > 30);
  const effectiveBle = isOffline ? false : bleConnected;
  const effectiveWifi = isOffline ? false : wifiConnected;

  const handleToggleSync = (val: boolean) => {
    setHighRateSync(val);
    localStorage.setItem("sentry_high_rate_sync", String(val));
  };

  const handleToggleAudio = (val: boolean) => {
    setAudioWarnings(val);
    localStorage.setItem("sentry_audio_warnings", String(val));
    if (val && typeof window !== "undefined" && window.speechSynthesis) {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance("Sentry speech warnings activated.");
      synth.speak(utterance);
    }
  };

  const handleTogglePush = (val: boolean) => {
    setPushAlerts(val);
    localStorage.setItem("sentry_push_alerts", String(val));
  };

  // Theme styling helpers
  const glassBg = isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.5)";
  const glassBorder = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)";
  const textColor = isDark ? "#ffffff" : "#111111";
  const mutedText = isDark ? "#9ca3af" : "#6b7280";
  const accentColor = "#38bdf8"; // Premium Sky Blue

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const userEmail = authUser?.email || "";
  const isOwner = userEmail.toLowerCase() === "dkayode61@gmail.com";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.2rem",
        width: "100%",
        fontFamily: "var(--font-inter), sans-serif",
      }}
    >
      <style>{`
        @keyframes pulseOrbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* ─── Hero Card: Administrator Profile ─── */}
      <div
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(10, 10, 12, 0.7) 100%)"
            : "linear-gradient(135deg, rgba(14, 165, 233, 0.06) 0%, rgba(255, 255, 255, 0.8) 100%)",
          border: `1px solid ${isDark ? "rgba(14, 165, 233, 0.2)" : "rgba(14, 165, 233, 0.15)"}`,
          borderRadius: "24px",
          padding: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "1.5rem",
          position: "relative",
          overflow: "hidden",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Glow behind profile */}
        <div style={{
          position: "absolute",
          top: "-50px",
          left: "-50px",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "rgba(56, 189, 248, 0.15)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }} />

        {/* Orbit Avatar */}
        <div style={{ position: "relative", width: "72px", height: "72px", flexShrink: 0 }}>
          <div style={{
            position: "absolute",
            inset: "-4px",
            borderRadius: "50%",
            border: "1.5px dashed rgba(56, 189, 248, 0.5)",
            animation: "pulseOrbit 8s linear infinite",
          }} />
          {authUser?.user_metadata?.avatar_url ? (
            <img
              src={authUser.user_metadata.avatar_url}
              alt="Operator"
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${accentColor}`,
                boxShadow: "0 0 16px rgba(56, 189, 248, 0.25)",
              }}
            />
          ) : (
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.6rem",
                fontWeight: 700,
                border: `2px solid ${accentColor}`,
                boxShadow: "0 0 16px rgba(56, 189, 248, 0.25)",
              }}
            >
              {((authUser?.user_metadata?.full_name ?? authUser?.email ?? "O") as string)[0].toUpperCase()}
            </div>
          )}
          <div style={{
            position: "absolute",
            bottom: 2,
            right: 2,
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            background: isOffline ? "#ef4444" : "#10b981",
            border: `2px solid ${isDark ? "#0d0d0f" : "#ffffff"}`,
            boxShadow: isOffline ? "0 0 8px #ef4444" : "0 0 8px #10b981",
          }} />
        </div>

        {/* Operator Profile Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", flex: 1, minWidth: "200px" }}>
          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: textColor, letterSpacing: "-0.01em" }}>
            {authUser?.user_metadata?.full_name ?? authUser?.email ?? "Sentry Operator"}
          </span>
          <span style={{ fontSize: "0.82rem", color: mutedText }}>
            {userEmail}
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.4rem" }}>
            {isOwner ? (
              <>
                <span style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#38bdf8",
                  background: isDark ? "rgba(56, 189, 248, 0.15)" : "#e0f2fe",
                  padding: "0.15rem 0.6rem",
                  borderRadius: "99px",
                  border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.2)" : "transparent"}`,
                }}>
                  Grid Administrator
                </span>
                <span style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: isDark ? "#c084fc" : "#7c3aed",
                  background: isDark ? "rgba(192, 132, 252, 0.12)" : "#f3e8ff",
                  padding: "0.15rem 0.6rem",
                  borderRadius: "99px",
                }}>
                  Key Owner
                </span>
              </>
            ) : (
              <>
                <span style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: isDark ? "#34d399" : "#059669",
                  background: isDark ? "rgba(52, 211, 153, 0.12)" : "#ecfdf5",
                  padding: "0.15rem 0.6rem",
                  borderRadius: "99px",
                  border: `1px solid ${isDark ? "rgba(52, 211, 153, 0.2)" : "transparent"}`,
                }}>
                  Sentry Observer
                </span>
                <span style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: isDark ? "#fbbf24" : "#d97706",
                  background: isDark ? "rgba(251, 191, 36, 0.12)" : "#fffbeb",
                  padding: "0.15rem 0.6rem",
                  borderRadius: "99px",
                  border: `1px solid ${isDark ? "rgba(251, 191, 36, 0.2)" : "transparent"}`,
                }}>
                  Read-Only Access
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Hardware Topology Flow (Animated SVG Diagram) ─── */}
      <div
        style={{
          background: glassBg,
          border: `1px solid ${glassBorder}`,
          borderRadius: "20px",
          padding: "1.2rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "0.5rem" }}>
            <h3 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 800, color: textColor }}>
              Hardware System Topology
            </h3>
            <span style={{ 
              fontSize: "0.55rem", 
              background: isOffline ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)", 
              color: isOffline ? "#ef4444" : "#10b981", 
              padding: "0.15rem 0.5rem", 
              borderRadius: "99px",
              fontWeight: 700,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              flexShrink: 0
            }}>
              {isOffline ? "Offline" : "Online"}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "0.68rem", color: mutedText, lineHeight: 1.35 }}>
            Live hardware nodes and real-time serial payload path. Click any node to review hardware specs.
          </p>
        </div>

        {/* Node Connection Canvas */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem 0.5rem",
          position: "relative",
          background: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)",
          borderRadius: "14px",
          overflow: "hidden",
          width: "100%",
        }}>
          
          {/* Row: Node Groups + Cables (Aligned perfectly to the center axis of the icons) */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: "440px",
            position: "relative",
          }}>
            
            {/* Node 1: BMS */}
            <div 
              onClick={() => setSelectedNode("bms")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                width: "65px",
                flexShrink: 0,
                transform: selectedNode === "bms" ? "scale(1.05)" : "scale(1)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: selectedNode === "bms" 
                  ? (isDark ? "rgba(56, 189, 248, 0.25)" : "#e0f2fe")
                  : (isDark ? "rgba(255,255,255,0.04)" : "#f3f4f6"),
                border: `1.5px solid ${selectedNode === "bms" ? accentColor : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)")}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: selectedNode === "bms" ? accentColor : (isDark ? "#9ca3af" : "#4b5563"),
                boxShadow: selectedNode === "bms" ? "0 0 14px rgba(56, 189, 248, 0.2)" : "none",
              }}>
                <HugeiconsIcon icon={BluetoothIcon} size={20} />
              </div>
              <span style={{ fontSize: "0.58rem", fontWeight: 700, color: selectedNode === "bms" ? textColor : mutedText, marginTop: "0.45rem", whiteSpace: "nowrap" }}>
                JK-BMS
              </span>
              <span style={{ fontSize: "0.46rem", color: mutedText, opacity: 0.65, whiteSpace: "nowrap" }}>
                BLE Node
              </span>
            </div>

            {/* Cable A: BMS to ESP32 */}
            <div style={{ flex: 1, height: "16px", display: "flex", alignItems: "center", marginTop: "14px", padding: "0 0.1rem" }}>
              <svg viewBox="0 0 100 16" style={{ width: "100%", height: "16px", overflow: "visible" }}>
                <line 
                  x1="0" y1="8" x2="100" y2="8" 
                  stroke={effectiveBle ? (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)") : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)")} 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  style={{ opacity: 0.15 }}
                />
                {effectiveBle ? (
                  <>
                    <circle cx="0" cy="8" r="7" fill={accentColor}>
                      <animate attributeName="cx" values="0;100" dur="2.4s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 1" keySplines="0.4 0 0.6 1" />
                      <animate attributeName="opacity" values="0;0.3;1;0.3;0" keyTimes="0;0.15;0.5;0.8;1" dur="2.4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="0" cy="8" r="4" fill={accentColor}>
                      <animate attributeName="cx" values="0;100" dur="2.4s" begin="0.8s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 1" keySplines="0.4 0 0.6 1" />
                      <animate attributeName="opacity" values="0;0.3;1;0.3;0" keyTimes="0;0.15;0.5;0.8;1" dur="2.4s" begin="0.8s" repeatCount="indefinite" />
                    </circle>
                  </>
                ) : (
                  <>
                    {/* Frozen and greyed-out dots */}
                    <circle cx="30" cy="8" r="7" fill={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"} />
                    <circle cx="70" cy="8" r="4" fill={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"} />
                  </>
                )}
              </svg>
            </div>

            {/* Node 2: ESP32 DevKit */}
            <div 
              onClick={() => setSelectedNode("esp32")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                width: "75px",
                flexShrink: 0,
                transform: selectedNode === "esp32" ? "scale(1.05)" : "scale(1)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: selectedNode === "esp32" 
                  ? (isDark ? "rgba(56, 189, 248, 0.25)" : "#e0f2fe")
                  : (isDark ? "rgba(255,255,255,0.04)" : "#f3f4f6"),
                border: `1.5px solid ${selectedNode === "esp32" ? accentColor : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)")}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: selectedNode === "esp32" ? accentColor : (isDark ? "#9ca3af" : "#4b5563"),
                boxShadow: selectedNode === "esp32" ? "0 0 14px rgba(56, 189, 248, 0.2)" : "none",
              }}>
                <HugeiconsIcon icon={CpuIcon} size={20} />
              </div>
              <span style={{ fontSize: "0.58rem", fontWeight: 700, color: selectedNode === "esp32" ? textColor : mutedText, marginTop: "0.45rem", whiteSpace: "nowrap" }}>
                ESP32 DevKit
              </span>
              <span style={{ fontSize: "0.46rem", color: mutedText, opacity: 0.65, whiteSpace: "nowrap" }}>
                Data Parser
              </span>
            </div>

            {/* Cable B: ESP32 to NodeMCU */}
            <div style={{ flex: 1, height: "16px", display: "flex", alignItems: "center", marginTop: "14px", padding: "0 0.1rem" }}>
              <svg viewBox="0 0 100 16" style={{ width: "100%", height: "16px", overflow: "visible" }}>
                <line 
                  x1="0" y1="8" x2="100" y2="8" 
                  stroke={(effectiveBle && effectiveWifi) ? (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)") : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)")} 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  style={{ opacity: 0.15 }}
                />
                {(effectiveBle && effectiveWifi) ? (
                  <>
                    <circle cx="0" cy="8" r="7" fill={accentColor}>
                      <animate attributeName="cx" values="0;100" dur="2.0s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 1" keySplines="0.4 0 0.6 1" />
                      <animate attributeName="opacity" values="0;0.3;1;0.3;0" keyTimes="0;2.0s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="0" cy="8" r="4" fill={accentColor}>
                      <animate attributeName="cx" values="0;100" dur="2.0s" begin="0.66s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 1" keySplines="0.4 0 0.6 1" />
                      <animate attributeName="opacity" values="0;0.3;1;0.3;0" keyTimes="0;2.0s" begin="0.66s" repeatCount="indefinite" />
                    </circle>
                  </>
                ) : (
                  <>
                    <circle cx="30" cy="8" r="7" fill={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"} />
                    <circle cx="70" cy="8" r="4" fill={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"} />
                  </>
                )}
              </svg>
            </div>

            {/* Node 3: NodeMCU */}
            <div 
              onClick={() => setSelectedNode("nodemcu")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                width: "65px",
                flexShrink: 0,
                transform: selectedNode === "nodemcu" ? "scale(1.05)" : "scale(1)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: selectedNode === "nodemcu" 
                  ? (isDark ? "rgba(56, 189, 248, 0.25)" : "#e0f2fe")
                  : (isDark ? "rgba(255,255,255,0.04)" : "#f3f4f6"),
                border: `1.5px solid ${selectedNode === "nodemcu" ? accentColor : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)")}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: selectedNode === "nodemcu" ? accentColor : (isDark ? "#9ca3af" : "#4b5563"),
                boxShadow: selectedNode === "nodemcu" ? "0 0 14px rgba(56, 189, 248, 0.2)" : "none",
              }}>
                <HugeiconsIcon icon={WifiIcon} size={20} />
              </div>
              <span style={{ fontSize: "0.58rem", fontWeight: 700, color: selectedNode === "nodemcu" ? textColor : mutedText, marginTop: "0.45rem", whiteSpace: "nowrap" }}>
                NodeMCU
              </span>
              <span style={{ fontSize: "0.46rem", color: mutedText, opacity: 0.65, whiteSpace: "nowrap" }}>
                Cloud Relay
              </span>
            </div>

            {/* Cable C: NodeMCU to Cloud */}
            <div style={{ flex: 1, height: "16px", display: "flex", alignItems: "center", marginTop: "14px", padding: "0 0.1rem" }}>
              <svg viewBox="0 0 100 16" style={{ width: "100%", height: "16px", overflow: "visible" }}>
                <line 
                  x1="0" y1="8" x2="100" y2="8" 
                  stroke={effectiveWifi ? (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)") : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)")} 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  style={{ opacity: 0.15 }}
                />
                {effectiveWifi ? (
                  <>
                    <circle cx="0" cy="8" r="7" fill={accentColor}>
                      <animate attributeName="cx" values="0;100" dur="2.8s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 1" keySplines="0.4 0 0.6 1" />
                      <animate attributeName="opacity" values="0;0.3;1;0.3;0" keyTimes="0;0.15;0.5;0.8;1" dur="2.8s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="0" cy="8" r="4" fill={accentColor}>
                      <animate attributeName="cx" values="0;100" dur="2.8s" begin="0.9s" repeatCount="indefinite" calcMode="spline" keyTimes="0; 1" keySplines="0.4 0 0.6 1" />
                      <animate attributeName="opacity" values="0;0.3;1;0.3;0" keyTimes="0;0.15;0.5;0.8;1" dur="2.8s" begin="0.9s" repeatCount="indefinite" />
                    </circle>
                  </>
                ) : (
                  <>
                    <circle cx="30" cy="8" r="7" fill={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"} />
                    <circle cx="70" cy="8" r="4" fill={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"} />
                  </>
                )}
              </svg>
            </div>

            {/* Node 4: Cloud */}
            <div 
              onClick={() => setSelectedNode("cloud")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                cursor: "pointer",
                width: "70px",
                flexShrink: 0,
                transform: selectedNode === "cloud" ? "scale(1.05)" : "scale(1)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: selectedNode === "cloud" 
                  ? (isDark ? "rgba(56, 189, 248, 0.25)" : "#e0f2fe")
                  : (isDark ? "rgba(255,255,255,0.04)" : "#f3f4f6"),
                border: `1.5px solid ${selectedNode === "cloud" ? accentColor : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)")}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: selectedNode === "cloud" ? accentColor : (isDark ? "#9ca3af" : "#4b5563"),
                boxShadow: selectedNode === "cloud" ? "0 0 14px rgba(56, 189, 248, 0.2)" : "none",
              }}>
                <HugeiconsIcon icon={DatabaseIcon} size={20} />
              </div>
              <span style={{ fontSize: "0.58rem", fontWeight: 700, color: selectedNode === "cloud" ? textColor : mutedText, marginTop: "0.45rem", whiteSpace: "nowrap" }}>
                Firebase
              </span>
              <span style={{ fontSize: "0.46rem", color: mutedText, opacity: 0.65, whiteSpace: "nowrap" }}>
                RTDB Store
              </span>
            </div>

          </div>

        </div>

        {/* Node detail display card */}
        <div style={{
          background: isDark ? "rgba(255, 255, 255, 0.01)" : "#fafafa",
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.04)"}`,
          borderRadius: "14px",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
          transition: "all 0.25s ease",
        }}>
          {selectedNode === "bms" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "clamp(0.76rem, 2cqi, 0.82rem)", fontWeight: 700, color: textColor }}>🔋 BMS (JK-B1A8S10P) Specifications</span>
                <span style={{ fontSize: "0.52rem", background: effectiveBle ? "rgba(56, 189, 248, 0.15)" : (isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb"), color: effectiveBle ? accentColor : mutedText, padding: "0.1rem 0.4rem", borderRadius: "99px", fontWeight: 600 }}>
                  {effectiveBle ? "ACTIVE BLE" : "DISCONNECTED"}
                </span>
              </div>
              
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", 
                columnGap: "1.4rem", 
                rowGap: "0.4rem", 
                fontSize: "clamp(0.62rem, 1.8cqi, 0.70rem)", 
                color: mutedText 
              }}>
                <div>Protocol: <strong style={{ color: textColor }}>JK02_32S (32S offset)</strong></div>
                <div>MAC Address: <strong style={{ color: textColor }}>a4:c1:38:06:91:dc</strong></div>
                <div>Service UUID: <strong style={{ color: textColor }}>FFE0</strong></div>
                <div>Characteristic: <strong style={{ color: textColor }}>FFE1</strong></div>
                <div>Frame Header: <strong style={{ color: textColor }}>55 AA EB 90</strong></div>
                <div>Voltage Limit: <strong style={{ color: textColor }}>32S Configurations</strong></div>
              </div>
              <p style={{ margin: "0.2rem 0 0 0", fontSize: "clamp(0.58rem, 1.8cqi, 0.65rem)", color: mutedText, lineHeight: 1.4 }}>
                The JK BMS node governs automated charge/discharge balance circuits. Telemetry packages are broadcast via short-range Bluetooth frames containing isolated cell readings.
              </p>
            </>
          )}

          {selectedNode === "esp32" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "clamp(0.76rem, 2cqi, 0.82rem)", fontWeight: 700, color: textColor }}>🧠 Board 1: ESP32 DevKit Node</span>
                <span style={{ fontSize: "0.52rem", background: effectiveBle ? "rgba(56, 189, 248, 0.15)" : (isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb"), color: effectiveBle ? accentColor : mutedText, padding: "0.1rem 0.4rem", borderRadius: "99px", fontWeight: 600 }}>
                  {effectiveBle ? "CO-EXISTS BLE+WIFI" : "OFFLINE"}
                </span>
              </div>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", 
                columnGap: "1.4rem", 
                rowGap: "0.4rem", 
                fontSize: "clamp(0.62rem, 1.8cqi, 0.70rem)", 
                color: mutedText 
              }}>
                <div>Architecture: <strong style={{ color: textColor }}>Dual-core Xtensa LX6</strong></div>
                <div>Frequency: <strong style={{ color: textColor }}>240 MHz</strong></div>
                <div>SRAM Capacity: <strong style={{ color: textColor }}>520 KB</strong></div>
                <div>Flash Storage: <strong style={{ color: textColor }}>4 MB flash</strong></div>
                <div>Radio Chip: <strong style={{ color: textColor }}>BLE 4.2 + 2.4G</strong></div>
                <div>Processing: <strong style={{ color: textColor }}>BMS data parser</strong></div>
              </div>
              <p style={{ margin: "0.2rem 0 0 0", fontSize: "clamp(0.58rem, 1.8cqi, 0.65rem)", color: mutedText, lineHeight: 1.4 }}>
                This is the primary board running the compiled BMS hex parser. It scans and connects to the JK-BMS BLE characteristic `FFE1` under `FFE0`, processes the serial frames, checks offsets, and pushes values to the secondary NodeMCU uploader.
              </p>
            </>
          )}

          {selectedNode === "nodemcu" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "clamp(0.76rem, 2cqi, 0.82rem)", fontWeight: 700, color: textColor }}>⚡ Board 2: NodeMCU ESP8266 Node</span>
                <span style={{ fontSize: "0.52rem", background: effectiveWifi ? "rgba(56, 189, 248, 0.15)" : (isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb"), color: effectiveWifi ? accentColor : mutedText, padding: "0.1rem 0.4rem", borderRadius: "99px", fontWeight: 600 }}>
                  {effectiveWifi ? "CLOUD UPLOADER" : "WIFI OFFLINE"}
                </span>
              </div>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", 
                columnGap: "1.4rem", 
                rowGap: "0.4rem", 
                fontSize: "clamp(0.62rem, 1.8cqi, 0.70rem)", 
                color: mutedText 
              }}>
                <div>Processor Core: <strong style={{ color: textColor }}>Single-Core L106</strong></div>
                <div>Frequency: <strong style={{ color: textColor }}>80/160 MHz</strong></div>
                <div>RAM Capacity: <strong style={{ color: textColor }}>80 KB</strong></div>
                <div>Flash Memory: <strong style={{ color: textColor }}>4 MB</strong></div>
                <div>Connectivity: <strong style={{ color: textColor }}>802.11 b/g/n Wi-Fi</strong></div>
                <div>Serial Link: <strong style={{ color: textColor }}>UART Rx/Tx link</strong></div>
              </div>
              <p style={{ margin: "0.2rem 0 0 0", fontSize: "clamp(0.58rem, 1.8cqi, 0.65rem)", color: mutedText, lineHeight: 1.4 }}>
                This board runs the network loop. It reads the serial outputs containing the decrypted BMS data streams from Board 1, sets up a persistent secure WiFi connection, and continuously uploads JSON payloads to the Firebase Realtime database.
              </p>
            </>
          )}

          {selectedNode === "cloud" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "clamp(0.76rem, 2cqi, 0.82rem)", fontWeight: 700, color: textColor }}>☁️ Cloud Services & Databases</span>
                <span style={{ fontSize: "0.52rem", background: effectiveWifi ? "rgba(16, 185, 129, 0.15)" : (isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb"), color: effectiveWifi ? "#10b981" : mutedText, padding: "0.1rem 0.4rem", borderRadius: "99px", fontWeight: 600 }}>
                  {effectiveWifi ? "REALTIME ONLINE" : "DISCONNECTED"}
                </span>
              </div>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", 
                columnGap: "1.4rem", 
                rowGap: "0.4rem", 
                fontSize: "clamp(0.62rem, 1.8cqi, 0.70rem)", 
                color: mutedText 
              }}>
                <div>Telemetry Store: <strong style={{ color: textColor }}>Firebase RTDB</strong></div>
                <div>Authentication: <strong style={{ color: textColor }}>Supabase Auth v2</strong></div>
                <div>Connection: <strong style={{ color: textColor }}>Secure WebSocket</strong></div>
                <div>Sync Delay: <strong style={{ color: textColor }}>Realtime listeners</strong></div>
              </div>
              <p style={{ margin: "0.2rem 0 0 0", fontSize: "clamp(0.58rem, 1.8cqi, 0.65rem)", color: mutedText, lineHeight: 1.4 }}>
                Supabase OAuth provides administrative verification for operators. Once validated, Sentry establishes bidirectional listeners directly to the Firebase database to render live cell configurations, charts, and forecasts.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ─── Preferences and Toggles ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Toggle Panel with iOS Toggle Switches */}
        <div style={{
          background: glassBg,
          border: `1px solid ${glassBorder}`,
          borderRadius: "20px",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.1rem",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.1rem" }}>
            <HugeiconsIcon icon={Settings01Icon} size={18} color={accentColor} />
            <h4 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 800, color: textColor }}>
              Sentry Panel Settings
            </h4>
          </div>

          {/* Sync Switch */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: textColor }}>High-Rate Synchronization</span>
              <span style={{ fontSize: "0.6rem", color: mutedText }}>Pulls metrics every 100ms</span>
            </div>
            
            {/* Custom iOS switch knob container */}
            <div 
              onClick={() => handleToggleSync(!highRateSync)}
              style={{
                width: "40px",
                height: "22px",
                borderRadius: "99px",
                background: highRateSync ? "#10b981" : (isDark ? "rgba(255,255,255,0.16)" : "#e4e4e7"),
                position: "relative",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                flexShrink: 0,
                boxShadow: highRateSync ? "0 0 8px rgba(16, 185, 201, 0.15)" : "none",
              }}
            >
              <div 
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  position: "absolute",
                  top: "2px",
                  left: highRateSync ? "20px" : "2px",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              />
            </div>
          </div>

          {/* Audio Switch */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: textColor }}>Synthesized Voice Alarms</span>
              <span style={{ fontSize: "0.6rem", color: mutedText }}>Announces critical cell failures</span>
            </div>
            
            <div 
              onClick={() => handleToggleAudio(!audioWarnings)}
              style={{
                width: "40px",
                height: "22px",
                borderRadius: "99px",
                background: audioWarnings ? "#10b981" : (isDark ? "rgba(255,255,255,0.16)" : "#e4e4e7"),
                position: "relative",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                flexShrink: 0,
                boxShadow: audioWarnings ? "0 0 8px rgba(16, 185, 201, 0.15)" : "none",
              }}
            >
              <div 
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  position: "absolute",
                  top: "2px",
                  left: audioWarnings ? "20px" : "2px",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              />
            </div>
          </div>

          {/* Push Switch */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: textColor }}>Critical Push Alerts</span>
              <span style={{ fontSize: "0.6rem", color: mutedText }}>Fires system notifications when idle</span>
            </div>
            
            <div 
              onClick={() => handleTogglePush(!pushAlerts)}
              style={{
                width: "40px",
                height: "22px",
                borderRadius: "99px",
                background: pushAlerts ? "#10b981" : (isDark ? "rgba(255,255,255,0.16)" : "#e4e4e7"),
                position: "relative",
                cursor: "pointer",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                flexShrink: 0,
                boxShadow: pushAlerts ? "0 0 8px rgba(16, 185, 201, 0.15)" : "none",
              }}
            >
              <div 
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  position: "absolute",
                  top: "2px",
                  left: pushAlerts ? "20px" : "2px",
                  transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div style={{
          background: glassBg,
          border: `1px solid ${glassBorder}`,
          borderRadius: "20px",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "1rem",
          backdropFilter: "blur(8px)",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
              <HugeiconsIcon icon={LicenseIcon} size={18} color={accentColor} />
              <h4 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 800, color: textColor }}>
                Sentry Project Links
              </h4>
            </div>
            <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.65rem", color: mutedText, lineHeight: 1.4 }}>
              Review the complete schematics, source code repository, and documentation guides for the Sentry BMS monitor program on GitHub.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <a
              href="https://github.com/KayodeDanielOluwatobi/sentry"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.65rem 1rem",
                borderRadius: "12px",
                background: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e5e7eb"}`,
                color: textColor,
                fontSize: "0.8rem",
                fontWeight: 700,
                textDecoration: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <HugeiconsIcon icon={GithubIcon} size={16} />
              <span>GitHub Repository</span>
            </a>

            <button
              onClick={handleSignOut}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.65rem 1rem",
                borderRadius: "12px",
                background: "transparent",
                border: `1.5px solid ${isDark ? "#ef4444" : "#dc2626"}`,
                color: isDark ? "#fca5a5" : "#dc2626",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <HugeiconsIcon icon={Logout01Icon} size={16} />
              <span>Sign Out Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
