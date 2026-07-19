"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu02Icon, NotificationIcon, Sun01Icon, Moon01Icon } from "@hugeicons/core-free-icons";
import { CardTheme } from "./BentoCard";

interface TopBarProps {
  theme?: CardTheme;
  greeting?: string;
  soc?: number;
  isCharging?: boolean;
  hasNotification?: boolean;
  onMenuClick?: () => void;
  onNotificationClick?: () => void;
  onThemeToggle?: () => void;
  userName?: string;
  soh?: number;
}

export default function TopBar({
  theme = "light",
  greeting,
  soc = 89,
  isCharging = true,
  hasNotification = true,
  onMenuClick,
  onNotificationClick,
  onThemeToggle,
  userName = "Daniel",
  soh = 99,
}: TopBarProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#ffffff" : "#111111";
  const grayText = isDark ? "#9ca3af" : "#6b7280";

  const [menuHover, setMenuHover] = React.useState(false);
  const [bellHover, setBellHover] = React.useState(false);
  const [themeHover, setThemeHover] = React.useState(false);

  // Client-side local time greeting to prevent SSR hydration mismatch
  const [greetingText, setGreetingText] = React.useState("Good Morning");
  const [emoji, setEmoji] = React.useState("👋");

  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreetingText("Good Morning");
      setEmoji("👋");
    } else if (hour >= 12 && hour < 17) {
      setGreetingText("Good Afternoon");
      setEmoji("☀️");
    } else if (hour >= 17 && hour < 22) {
      setGreetingText("Good Evening");
      setEmoji("🌆");
    } else {
      setGreetingText("Good Night");
      setEmoji("🌙");
    }
  }, []);

  const finalGreeting = greeting || greetingText;

  // Determine battery status health string & color based on soh (State of Health)
  const getBatteryHealthStatus = (sohValue: number) => {
    if (sohValue >= 90) {
      return { text: "healthy", color: isDark ? "#4ade80" : "#0d9b0d" };
    }
    if (sohValue >= 80) {
      return { text: "good", color: isDark ? "#86efac" : "#4caf50" };
    }
    if (sohValue >= 70) {
      return { text: "fair", color: isDark ? "#fdba74" : "#ff9800" };
    }
    return { text: "degraded", color: isDark ? "#f87171" : "#ef4444" };
  };

  const healthStatus = getBatteryHealthStatus(soh);

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
            font-size: 0.6rem;
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

      {/* ── Middle: Greeting + Battery status (flex-grow) ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.02rem", flex: 1, minWidth: 0 }}>
        <h1
          className="topbar-greeting"
          style={{
            margin: 0,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: textColor,
            lineHeight: 1.2,
          }}
        >
          {finalGreeting}, {userName}! {emoji}
        </h1>
        <p
          className="topbar-subtext"
          style={{
            margin: 0,
            fontWeight: 300,
            color: grayText,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Your battery system is{" "}
          <span style={{ color: healthStatus.color, fontWeight: 500 }}>
            {healthStatus.text}
          </span>
          .
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
