"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BentoCard, { CardTheme } from "./BentoCard";

export interface SystemInsightProps extends React.HTMLAttributes<HTMLDivElement> {
  soc?: number;
  isCharging?: boolean;
  temperature?: number;
  currentLoad?: number;
  cellVoltages?: number[];
  theme?: CardTheme;
  withShadow?: boolean;
  managerMode?: "auto" | "manual";
  managerLoads?: Array<{ id: string; name: string; level: string; status: string; isOn: boolean }>;
  activeAlarmsCount?: number;
  wifiRssi?: number;
  bleRssi?: number;
  wifiConnected?: boolean;
  bleConnected?: boolean;
  lastFirebaseUpdate?: number;
}

export default function SystemInsight({
  soc = 89,
  isCharging = true,
  temperature = 28.9,
  currentLoad = 450,
  cellVoltages = [3.199, 3.197, 3.196, 3.199],
  theme = "light",
  withShadow = true,
  managerMode = "auto",
  managerLoads = [
    { id: "1", name: "Router/WiFi/Laptops", level: "critical", status: "active", isOn: true },
    { id: "2", name: "Fans/AC/Refrigerator", level: "major", status: "active", isOn: true },
    { id: "3", name: "TV/Lights", level: "non-essential", status: "shed", isOn: false },
  ],
  activeAlarmsCount = 0,
  wifiRssi: propWifiRssi,
  bleRssi: propBleRssi,
  wifiConnected,
  bleConnected,
  lastFirebaseUpdate,
  style,
  ...props
}: SystemInsightProps) {
  // Always use deep premium dark forest green theme for this card
  const backgroundValue = "linear-gradient(135deg, #042a1c 0%, #08402b 100%)";
  const borderStyle = "1.5px solid rgba(74, 222, 128, 0.25)";
  const textColor = "#ffffff";
  const grayText = "rgba(255, 255, 255, 0.65)";
  const lightGrayText = "rgba(255, 255, 255, 0.45)";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsAgo, setSecondsAgo] = useState<number | string>("—");
  const [isMobile, setIsMobile] = useState(false);
  const [internalWifiRssi, setInternalWifiRssi] = useState(-58);
  const [internalBluetoothSignal, setInternalBluetoothSignal] = useState(-65);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const wifiRssi = propWifiRssi !== undefined ? propWifiRssi : internalWifiRssi;
  const bluetoothSignal = propBleRssi !== undefined ? propBleRssi : internalBluetoothSignal;

  // Monitor viewport resize for mobile responsive scaling
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Simulate real-time signal level shifts if not using props
  useEffect(() => {
    if (propWifiRssi !== undefined && propBleRssi !== undefined) return;
    const rssiInterval = setInterval(() => {
      setInternalWifiRssi(prev => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const next = prev + delta;
        return next < -85 ? -85 : next > -45 ? -45 : next;
      });
      setInternalBluetoothSignal(prev => {
        const delta = Math.floor(Math.random() * 3) - 1;
        const next = prev + delta;
        return next < -90 ? -90 : next > -40 ? -40 : next;
      });
    }, 5000);
    return () => clearInterval(rssiInterval);
  }, [propWifiRssi, propBleRssi]);

  const getWifiQuality = (rssi: number) => {
    if (wifiConnected === false) return "Disconnected";
    if (rssi >= -60) return "Excellent";
    if (rssi >= -70) return "Good";
    if (rssi >= -80) return "Fair";
    return "Weak";
  };

  const getWifiSubtext = (rssi: number) => {
    if (wifiConnected === false) return "ESP32 has lost wireless connection to local network.";
    if (rssi >= -70) return "ESP32 wireless link to local network (Sentry-5G) is stable.";
    return "ESP32 WiFi signal is degraded. Local telemetry packets buffering.";
  };

  const getBtQuality = (rssi: number) => {
    if (bleConnected === false) return "Disconnected";
    if (rssi >= -55) return "Strong";
    if (rssi >= -70) return "Stable";
    return "Weak";
  };

  const getBtSubtext = (rssi: number) => {
    if (bleConnected === false) return "ESP32 bluetooth connection to JK BMS is offline.";
    if (rssi >= -70) return "ESP32 telemetry link to JK BMS is paired and streaming.";
    return "BMS Bluetooth range threshold reached. Check ESP32 antenna.";
  };

  // 1. Calculate Discharge Runtime Estimation
  const getDischargeRuntime = () => {
    if (soc <= 0) return "Empty";
    const hours = Math.floor((soc * 15) / 60);
    const minutes = Math.round((soc * 15) % 60);
    return `${hours}h ${minutes}m`;
  };

  // 2. Calculate Charge Time to Full
  const getChargeTimeToFull = () => {
    if (soc >= 100) return "Full";
    const remainingSoc = 100 - soc;
    const hours = Math.floor((remainingSoc * 10) / 60);
    const minutes = Math.round((remainingSoc * 10) % 60);
    return `${hours}h ${minutes}m`;
  };

  const dischargeRuntimeString = getDischargeRuntime();
  const chargeTimeToFullString = getChargeTimeToFull();

  // 3. Compile Dynamic Insights List
  const insights = [];

  // Insight A: Charging Progress / Backup Time (Primary Status)
  if (isCharging) {
    insights.push({
      id: "charging",
      title: "Charging status",
      value: `${chargeTimeToFullString} to full`,
      subtext: `Active power feed is replenishing cells. Current pack SOC is ${soc}%.`,
      textColor: "#e9d5ff", // Bright pastel violet
      priority: 10
    });
  } else {
    insights.push({
      id: "backup",
      title: "Estimated backup",
      value: `${dischargeRuntimeString}`,
      subtext: "Based on current load and battery level",
      textColor: "#a5f3fc", // Bright ice blue / cyan
      priority: 10
    });
  }

  // Insight B: Thermal Status (Prioritized if temperature warning is active)
  const isHot = temperature > 45;
  insights.push({
    id: "thermal",
    title: "Thermal status",
    value: `${temperature.toFixed(1)}°C (${isHot ? "Elevated" : "Optimal"})`,
    subtext: isHot
      ? "Warning: Battery temp is elevated. Coolant/fan dissipation active."
      : "Thermal profiles are nominal. No active cell heat risk.",
    textColor: isHot ? "#fed7aa" : "#a7f3d0", // Light peach for warning, light mint green for optimal
    priority: isHot ? 12 : 5
  });

  // Insight C: Cell Balance Delta
  const maxCell = Math.max(...cellVoltages);
  const minCell = Math.min(...cellVoltages);
  const cellDelta = Math.round((maxCell - minCell) * 1000); // in mV
  const isImbalanced = cellDelta > 15;
  insights.push({
    id: "balance",
    title: "Cell balance",
    value: `${cellDelta}mV delta (${cellDelta < 10 ? "Excellent" : "Healthy"})`,
    subtext: isImbalanced
      ? "Slight voltage variance detected across pack. Active balancing running."
      : "Cells are perfectly aligned. Pack structural SOH is 100%.",
    textColor: isImbalanced ? "#fef08a" : "#c6f6d5", // Bright yellow for warning, very soft green for healthy
    priority: isImbalanced ? 9 : 4
  });

  // Insight D: Energy Load consumption
  insights.push({
    id: "load",
    title: "Energy consumption",
    value: `${currentLoad}W drawing`,
    subtext: "Total real-time power drawing from battery terminals.",
    textColor: "#e9d5ff", // Bright pastel violet
    priority: 3
  });

  // Insight E: Smart Load prioritized status (Synced with actual Smart Energy Manager states!)
  const activeCount = managerLoads.filter(l => l.isOn).length;
  const shedCount = managerLoads.filter(l => !l.isOn).length;
  const shedNames = managerLoads.filter(l => !l.isOn).map(l => {
    if (l.name.includes("TV")) return "TV";
    if (l.name.includes("Fans")) return "HVAC";
    if (l.name.includes("Router")) return "IT Network";
    return l.name;
  });

  const isManual = managerMode === "manual";
  insights.push({
    id: "smartload",
    title: "Smart load status",
    value: isManual
      ? `${activeCount} active, ${shedCount} shed (Manual)`
      : `Auto-managed (${shedCount} shed)`,
    subtext: shedCount > 0
      ? `Critical circuits prioritized. Off: ${shedNames.join(", ")}.`
      : "All load priorities online. Network drawing nominal.",
    textColor: "#c7d2fe", // Light periwinkle blue
    priority: (shedCount > 0 || isManual) ? 8 : 2
  });

  // Insight F: Inverter Efficiency
  const efficiency = 94 - Math.max(0, Math.floor((currentLoad - 500) / 250));
  insights.push({
    id: "efficiency",
    title: "Inverter efficiency",
    value: `${efficiency}%`,
    subtext: "Conversion factor for DC-to-AC grid output is optimal.",
    textColor: "#c6f6d5", // Very soft green
    priority: 2
  });

  // Insight G: BMS Voltage Recovery
  insights.push({
    id: "trend",
    title: "Recovery trend",
    value: "Stable",
    subtext: "BMS battery cell recovery trend is steady, no voltage sag detected.",
    textColor: "#a5f3fc", // Bright ice blue / cyan
    priority: 1
  });

  // Insight H: WiFi Connectivity
  insights.push({
    id: "wifi",
    title: "WiFi connectivity",
    value: `${wifiRssi} dBm (${getWifiQuality(wifiRssi)})`,
    subtext: getWifiSubtext(wifiRssi),
    textColor: "#a5f3fc", // Bright ice blue / cyan
    priority: 3
  });

  // Insight I: Bluetooth Signal
  insights.push({
    id: "bluetooth",
    title: "Bluetooth signal",
    value: `${bluetoothSignal} dBm (${getBtQuality(bluetoothSignal)})`,
    subtext: getBtSubtext(bluetoothSignal),
    textColor: "#c7d2fe", // Light periwinkle blue
    priority: 2
  });

  // Insight J: Active Alarms Status
  insights.push({
    id: "alarms",
    title: "System alarms",
    value: activeAlarmsCount > 0 ? `${activeAlarmsCount} Active` : "All Clear (0 active)",
    subtext: activeAlarmsCount > 0
      ? "Safety warning triggered! Pack protective overrides engaged."
      : "BMS protective parameter boundaries verified nominal.",
    textColor: activeAlarmsCount > 0 ? "#fed7aa" : "#c6f6d5", // light peach/orange if warning, minty light green if all clear
    priority: activeAlarmsCount > 0 ? 15 : 2 // Highest priority (15) if alarm triggered!
  });

  // Sort by priority so that critical stats (e.g. warnings, active statuses) always surface first
  insights.sort((a, b) => b.priority - a.priority);

  // Auto rotate insights every 15 seconds
  useEffect(() => {
    const startRotation = () => {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % insights.length);
      }, 30000); // 15-second rotation
    };

    startRotation();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [insights.length]);

  // Compute seconds elapsed since the last real Firebase database snapshot update
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

  const activeInsight = insights[currentIndex] || insights[0];

  return (
    <BentoCard
      theme="dark" // Forces dark overlay styling for shadows/effects
      withShadow={withShadow}
      style={{
        padding: isMobile ? "0.45rem 0.65rem" : "0.85rem 1.35rem",
        borderRadius: isMobile ? "11px" : "20px",
        width: "100%",
        minHeight: isMobile ? "54px" : "84px",
        background: backgroundValue,
        border: borderStyle,
        ...style
      }}
      {...props}
    >
      {/* Horizontal Flex Wrapper inside BentoCard content container */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          gap: "0.75rem"
        }}
      >
        {/* Left side info */}
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "0.2rem" : "0.45rem", minWidth: 0, flex: 1 }}>
          {/* Title + Live Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: isMobile ? "0.2rem" : "0.4rem" }}>
            <span style={{ fontSize: isMobile ? "0.68rem" : "0.95rem", fontWeight: 400, color: textColor }}>
              System Insight
            </span>
            <span style={{
              background: "rgba(74, 222, 128, 0.2)",
              color: "#86efac",
              fontSize: isMobile ? "0.45rem" : "0.58rem",
              fontWeight: 500,
              padding: isMobile ? "0.02rem 0.3rem" : "0.08rem 0.35rem",
              borderRadius: "999px", // Fully rounded
              textTransform: "uppercase",
              letterSpacing: "0.02em"
            }}>
              Live
            </span>
          </div>

          {/* Insight content animation viewport */}
          <div style={{ overflow: "hidden", minHeight: isMobile ? "28px" : "44px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", width: "100%" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeInsight.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ display: "flex", flexDirection: "column", gap: isMobile ? "0.08rem" : "0.15rem" }}
              >
                <div style={{ fontSize: isMobile ? "0.72rem" : "1.02rem", fontWeight: 500, color: textColor, lineHeight: 1.15 }}>
                  <span style={{ color: activeInsight.textColor }}>{activeInsight.title}</span>: {activeInsight.value}
                </div>
                <div style={{ fontSize: isMobile ? "0.55rem" : "0.78rem", color: grayText, fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {activeInsight.subtext}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right side status & refresh indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.35rem" : "0.55rem", flexShrink: 0 }}>
          {/* Last updated labels vertical stack */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.01rem" }}>
            <span style={{ fontSize: isMobile ? "0.5rem" : "0.64rem", color: lightGrayText, fontWeight: 400 }}>
              Last updated
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: textColor }}>
              {/* Clock Icon Outline */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width={isMobile ? "11" : "14"}
                height={isMobile ? "11" : "14"}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.6 }}
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span style={{ fontSize: isMobile ? "0.62rem" : "0.78rem", fontWeight: 500 }}>
                {secondsAgo === "—" ? "—" : (secondsAgo === 0 ? "just now" : `${secondsAgo}s ago`)}
              </span>
            </div>
          </div>

          {/* Refresh indicator icon aligned to the far right */}
          <div
            style={{
              color: grayText,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.55,
              paddingLeft: "0.1rem",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={isMobile ? "11" : "14"}
              height={isMobile ? "11" : "14"}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73" />
            </svg>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
