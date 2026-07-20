"use client";
import React, { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu02Icon, NotificationIcon, Sun01Icon, Moon01Icon } from "@hugeicons/core-free-icons";
import { CardTheme } from "./BentoCard";
import { motion, AnimatePresence } from "framer-motion";

interface TopBarProps {
  theme?: CardTheme;
  soc?: number;
  isCharging?: boolean;
  hasNotification?: boolean;
  onMenuClick?: () => void;
  onNotificationClick?: () => void;
  onThemeToggle?: () => void;
  userName?: string;
  soh?: number;
  temperature?: number;
  currentLoad?: number;
  cellVoltages?: number[];
  managerMode?: "auto" | "manual";
  managerLoads?: Array<{ id: string; name: string; level: "critical" | "major" | "non-essential"; status: string; isOn: boolean }>;
  activeAlarmsCount?: number;
}

export default function TopBar({
  theme = "light",
  soc = 89,
  isCharging = true,
  hasNotification = true,
  onMenuClick,
  onNotificationClick,
  onThemeToggle,
  userName = "Daniel",
  soh = 99,
  temperature = 28.9,
  currentLoad = 450,
  cellVoltages = [3.199, 3.197, 3.196, 3.199],
  managerMode = "auto",
  managerLoads = [
    { id: "1", name: "Router/WiFi/Laptops", level: "critical", status: "active", isOn: true },
    { id: "2", name: "Fans/AC/Refrigerator", level: "major", status: "active", isOn: true },
    { id: "3", name: "TV/Lights", level: "non-essential", status: "shed", isOn: false },
  ],
  activeAlarmsCount = 0,
}: TopBarProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#ffffff" : "#111111";
  const grayText = isDark ? "#9ca3af" : "#6b7280";

  const [menuHover, setMenuHover] = useState(false);
  const [bellHover, setBellHover] = useState(false);
  const [themeHover, setThemeHover] = useState(false);

  // States for headline selection and history
  const [currentHeadline, setCurrentHeadline] = useState("System dashboard active. ⚡");
  const [currentSubtitle, setCurrentSubtitle] = useState("Chosen because time parameters are verified nominal.");
  const [activeCategory, setActiveCategory] = useState("");
  const [headlineHistory, setHeadlineHistory] = useState<string[]>([]);
  const [greetingText, setGreetingText] = useState("Welcome Back");

  // Determine time-of-day greeting (client side only to avoid SSR issues)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreetingText("Good Morning");
    } else if (hour >= 12 && hour < 17) {
      setGreetingText("Good Afternoon");
    } else if (hour >= 17 && hour < 22) {
      setGreetingText("Good Evening");
    } else {
      setGreetingText("Good Night");
    }
  }, []);

  // 1. Calculate dynamic backup time helper string
  const backupWh = (soc / 100) * 13500; // 13.5 kWh battery capacity
  const backupHours = currentLoad > 0 ? (backupWh / currentLoad) : 12;
  const hoursInt = Math.floor(backupHours);
  const minsInt = Math.round((backupHours - hoursInt) * 60);
  const backupTimeStr = hoursInt > 0 ? `${hoursInt}h ${minsInt}m` : `${minsInt}m`;

  // 2. Calculate local grid and load parameters
  const maxCellVal = Math.max(...cellVoltages);
  const minCellVal = Math.min(...cellVoltages);
  const cellDeltaVal = Math.round((maxCellVal - minCellVal) * 1000);
  const shedCount = managerLoads.filter(l => !l.isOn).length;

  // 3. Rule-based greeting category selector
  const getActiveCategory = () => {
    if (activeAlarmsCount > 0) return "protection";
    if (soc <= 20 && !isCharging) return "critical";
    if (currentLoad >= 1000) return "high_demand";
    if (soc >= 95) return "full";
    if (isCharging) return "charging";
    if (shedCount > 0 && managerMode === "auto") return "load_saving";
    if (cellDeltaVal <= 10 && soc > 30) return "recovery";
    if (!isCharging) return "discharging";
    if (soh >= 98 && temperature <= 35) return "healthy";
    return "welcome";
  };

  // 4. Headline Lists (10 items per category)
  const headlinesByCategory: Record<string, string[]> = {
    protection: [
      "Active protection override engaged. ⚠️",
      "System safety alarms require attention. 🚨",
      "BMS protective containment is active. 🛡️",
      "BMS security parameters exceeded. ⚠️",
      "Protective thresholds active. 🚨",
      "Attention required: safety alarms logged. ⚠️",
      "Safety cutoff triggered. 🚨",
      "BMS watchdog active on alarm state. 🛡️",
      "System alert: security boundaries breached. 🚨",
      "BMS protecting cell package. ⚠️"
    ],
    critical: [
      "Reserve power is running low. 🪫",
      "Battery SOC is critical. 🚨",
      "Critical battery reserves reached. 🔌",
      "System energy is depleted. 🪫",
      "Power reserves critically low. 🔌",
      "Depleted reserve state active. 🚨",
      "Action required: battery is nearly empty. 🪫",
      "Low battery protection threshold. 🔌",
      "Energy levels are critical. 🪫",
      "Battery backup is almost empty. 🚨"
    ],
    high_demand: [
      "High energy demand detected. ⚡",
      "Power draw is elevated. 📈",
      "Peak load demand active. ⚡",
      "High load currents detected. 🔌",
      "System is supporting high draw. 📈",
      "Elevated power consumption logged. ⚡",
      "High wattage usage active. 🔌",
      "Heavy energy demand detected. 📈",
      "Power consumption peaking. ⚡",
      "Heavy usage active on battery. 🔌"
    ],
    full: [
      "Fully charged and ready. 🔋",
      "Energy reserve is full. 🎉",
      "Battery cells at peak capacity. 🔋",
      "Power capacity maximized. 🔋",
      "Ready to run: cells fully charged. 🎉",
      "Battery pack topped off. 🔋",
      "Energy capacity is 100% ready. 🔋",
      "Reserves fully loaded. 🎉",
      "100% capacity reached. 🔋",
      "System is fully charged. 🎉"
    ],
    charging: [
      "Energy is flowing in. ⚡",
      "Power reserves are improving. 🔋",
      "AC charge cycle active. 🔌",
      "Replenishing battery capacity. ⚡",
      "Battery is charging steadily. 🔋",
      "Grid electricity flowing to cells. 🔌",
      "Powering up reserves. ⚡",
      "Pack replenishment in progress. 🔋",
      "Accumulating reserve capacity. ⚡",
      "Grid charger active. 🔌"
    ],
    load_saving: [
      "Conserving energy intelligently. 💡",
      "Smart load shedding active. 🛡️",
      "Shedding non-essential loads. 💡",
      "Load priority mapping active. 🛡️",
      "Conserving battery capacity. 💡",
      "Load prioritization is active. 🛡️",
      "Intelligent load management engaged. 💡",
      "Managing circuits for runtime gain. 🛡️",
      "Auto conservation active. 💡",
      "Prioritized load balance active. 🛡️"
    ],
    recovery: [
      "Power cells are balanced and stable. ⚖️",
      "Battery recovery trend looks steady. 📈",
      "Voltage delta is minimal. ⚖️",
      "System recovery in progress. 📈",
      "Cell voltage drift resolved. ⚖️",
      "Stability verified: minimal balance delta. 📈",
      "Cell parameters are steady. ⚖️",
      "Ideal pack alignment detected. 📈",
      "Battery voltages are recovering. ⚖️",
      "Nominal cell balance achieved. 📈"
    ],
    discharging: [
      "Supporting load on battery backup. 🔋",
      "Discharging phase active. 🔌",
      "Drawing reserve capacity. 🪫",
      "Inverter supporting backup load. 🔋",
      "Battery reserves powering circuits. 🔌",
      "System backup online. 🪫",
      "Backup power active. 🔋",
      "Drawing pack capacity. 🔌",
      "Backup power supply running. 🪫",
      "Discharging from reserves. 🔋"
    ],
    healthy: [
      "BMS health is excellent. 💚",
      "Everything looks great. ✨",
      "Today's energy outlook looks excellent. ☀️",
      "All core metrics are optimal. ✨",
      "System health verified nominal. 💚",
      "Operating parameters are perfect. ✨",
      "BMS state is healthy and sound. 💚",
      "Peak battery health logged. ✨",
      "System state is healthy. 💚",
      "All parameters nominal. ✨"
    ]
  };

  // Build the Welcome Back category headlines list with contextual local time & name options
  const getWelcomeHeadlines = () => {
    const nameStr = userName ? `, ${userName}` : "";
    const greetingTextShort = greetingText;
    const greetingWithName = (greetingTextShort.length + nameStr.length < 28) ? `${greetingTextShort}${nameStr}. 👋` : `${greetingTextShort}. 👋`;

    return [
      greetingWithName,
      "Ready for the day. ☀️",
      "Welcome back—your system is running smoothly. ✨",
      "Welcome back to your dashboard. 👋",
      "BMS dashboard online. ✨",
      "System monitoring active. ☀️",
      "Welcome back. 👋",
      "All grid parameters nominal. ✨",
      "BMS system active. ☀️",
      "Ready to manage backups. 🔋"
    ];
  };

  // 5. Generate descriptive contextual subtitle explanation
  const getSubtitleForCategory = (cat: string) => {
    switch (cat) {
      case "protection":
        return `${activeAlarmsCount} alarm${activeAlarmsCount > 1 ? "s" : ""} active.`;
      case "critical":
        return `Low battery (${soc}%). Connect charger.`;
      case "high_demand":
        return `High load: ${currentLoad}W.`;
      case "full":
        return `Battery full (${soc}%).`;
      case "charging":
        return `Charging. Backup: ${backupTimeStr}.`;
      case "load_saving":
        return `Smart load shed active.`;
      case "recovery":
        return `Cells balanced. Delta: ${cellDeltaVal}mV.`;
      case "discharging":
        return `Discharging. Backup: ${backupTimeStr}.`;
      case "healthy":
        return `Nominal. Health: ${soh}%.`;
      case "welcome":
      default:
        return `Monitoring active.`;
    }
  };

  // 6. Dynamic Name Attachment Helper for headlines <= 20 chars
  const attachNameToHeadline = (headline: string, name: string) => {
    if (!name) return headline;

    // Matches core text and ending emoji
    const match = headline.match(/^(.*?)\s*([^\s\w\d.,:;!?'"\(\)]+)$/);
    if (!match) return headline;

    const coreText = match[1].trim();
    const emojiPart = match[2];

    const textWithoutDot = coreText.endsWith(".") ? coreText.slice(0, -1) : coreText;

    if (textWithoutDot.length <= 20) {
      const lower = textWithoutDot.toLowerCase();
      const isAction = lower.startsWith("ready") || 
                       lower.startsWith("conserving") || 
                       lower.startsWith("powering") || 
                       lower.startsWith("drawing") || 
                       lower.startsWith("discharging") || 
                       lower.startsWith("charging") ||
                       lower.startsWith("supporting") ||
                       lower.startsWith("replenishing") ||
                       lower.startsWith("accumulating");

      if (isAction) {
        const formattedText = textWithoutDot.charAt(0).toLowerCase() + textWithoutDot.slice(1);
        return `${name}, ${formattedText}. ${emojiPart}`;
      } else {
        const endingMark = lower.includes("welcome") ? "!" : ".";
        return `${textWithoutDot}, ${name}${endingMark} ${emojiPart}`;
      }
    }

    return headline;
  };

  // Rule processing hook: fires when inputs update
  const category = getActiveCategory();

  useEffect(() => {
    // Subtitle updates dynamically on any variable change to show live calculations
    const sub = getSubtitleForCategory(category);
    setCurrentSubtitle(sub);

    // Headline updates ONLY when active category switches to avoid jittering text
    if (category !== activeCategory) {
      setActiveCategory(category);

      const candidates = category === "welcome" ? getWelcomeHeadlines() : (headlinesByCategory[category] || getWelcomeHeadlines());
      
      // Select the first headline not in history
      const allowed = candidates.filter(h => !headlineHistory.includes(h));
      const selectionList = allowed.length > 0 ? allowed : candidates;
      const rawSelected = selectionList[0];

      // Format selected headline with username if <= 20 characters
      const formattedSelected = attachNameToHeadline(rawSelected, userName);
      setCurrentHeadline(formattedSelected);

      // Keep maximum history size of 5 (using raw headlines in history for exact matches)
      setHeadlineHistory(prev => {
        const next = [rawSelected, ...prev.filter(h => h !== rawSelected)];
        if (next.length > 5) {
          next.pop();
        }
        return next;
      });
    }
  }, [category, soc, isCharging, temperature, currentLoad, cellVoltages, activeAlarmsCount, soh, userName]);

  const iconButtonStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "none",
    border: "none",
    color: textColor,
    cursor: "pointer",
    padding: 0,
    outline: "none",
    WebkitTapHighlightColor: "transparent",
    transition: "transform 0.15s ease, opacity 0.15s ease",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        gap: "0.85rem",
        padding: "0.5rem 0",
        transition: "color 0.3s ease",
      }}
    >
      <style>{`
        .topbar-greeting {
          font-size: 0.9rem;
        }
        .topbar-subtext {
          font-size: 0.7rem;
        }
        @media (min-width: 640px) {
          .topbar-greeting {
            font-size: 0.825rem;
          }
          .topbar-subtext {
            font-size: 0.66rem;
          }
        }
        @media (min-width: 1024px) {
          .topbar-greeting {
            font-size: 0.76rem;
          }
          .topbar-subtext {
            font-size: 0.66rem;
          }
        }
      `}</style>

      {/* ── Left: Menu Button ── */}
      <button
        type="button"
        aria-label="Open menu"
        onClick={onMenuClick}
        onMouseEnter={() => setMenuHover(true)}
        onMouseLeave={() => setMenuHover(false)}
        style={{
          ...iconButtonStyle,
          transform: menuHover ? "scale(1.08)" : "scale(1)",
          justifyContent: "flex-start",
          width: "32px",
        }}
      >
        <HugeiconsIcon icon={Menu02Icon} size={28} color="currentColor" strokeWidth={1.8} />
      </button>

      {/* ── Middle: Headline Engine + Dynamic Subtitle (flex-grow) ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.02rem", flex: 1, minWidth: 0 }}>
        <div style={{ overflow: "hidden", display: "flex", minHeight: "1.45rem", alignItems: "center" }}>
          <AnimatePresence mode="wait">
            <motion.h1
              key={currentHeadline}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="topbar-greeting"
              style={{
                margin: 0,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: textColor,
                lineHeight: 1.2,
              }}
            >
              {currentHeadline}
            </motion.h1>
          </AnimatePresence>
        </div>
        <p
          className="topbar-subtext"
          style={{
            margin: 0,
            fontWeight: 400,
            color: grayText,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {currentSubtitle}
        </p>
      </div>

      {/* ── Right: Theme Switcher & Notification Buttons ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexShrink: 0 }}>
        {/* Theme Switcher */}
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={onThemeToggle}
          onMouseEnter={() => setThemeHover(true)}
          onMouseLeave={() => setThemeHover(false)}
          style={{
            ...iconButtonStyle,
            transform: themeHover ? "scale(1.08)" : "scale(1)",
            width: "28px",
            justifyContent: "center",
          }}
        >
          <HugeiconsIcon icon={isDark ? Sun01Icon : Moon01Icon} size={24} color="currentColor" strokeWidth={1.8} />
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          onClick={onNotificationClick}
          onMouseEnter={() => setBellHover(true)}
          onMouseLeave={() => setBellHover(false)}
          style={{
            ...iconButtonStyle,
            transform: bellHover ? "scale(1.08)" : "scale(1)",
            justifyContent: "flex-end",
            width: "28px",
          }}
        >
          <HugeiconsIcon icon={NotificationIcon} size={24} color="currentColor" strokeWidth={1.8} />
          {hasNotification && (
            <span
              style={{
                position: "absolute",
                top: "2px",
                right: "0px",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#ef4444",
                border: `1.5px solid ${isDark ? "#080808" : "#ebf0f5"}`,
                boxSizing: "content-box",
              }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
