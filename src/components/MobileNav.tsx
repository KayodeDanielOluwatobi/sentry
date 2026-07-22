"use client";

import React from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { AutomotiveBattery01Icon, RenewableEnergyIcon, Activity03Icon, UserIcon } from "@hugeicons/core-free-icons";

export type NavItem = "Battery" | "Energy" | "Diagnostics" | "Profile";

interface MobileNavProps {
  theme?: "light" | "dark";
  active?: NavItem;
  onChange?: (item: NavItem) => void;
}

export default function MobileNav({
  theme = "light",
  active = "Battery",
  onChange,
}: MobileNavProps) {
  const isDark = theme === "dark";

  // Responsive check & client mount detection to prevent SSR hydration warnings
  const [hasMounted, setHasMounted] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Design system colors matching user specs
  const activeColor = isDark ? "#4ade80" : "#0d9b0d";
  const inactiveColor = isDark ? "rgba(255, 255, 255, 0.4)" : "#4b5563";

  const navItems: { id: NavItem; icon: any; label: string }[] = [
    { id: "Battery", icon: AutomotiveBattery01Icon, label: "Battery" },
    { id: "Energy", icon: RenewableEnergyIcon, label: "Energy" },
    { id: "Diagnostics", icon: Activity03Icon, label: "Diagnostics" },
    { id: "Profile", icon: UserIcon, label: "Profile" },
  ];

  if (!hasMounted) return null;

  // Render navigation buttons inside the glass wrappers
  const renderNavContent = () => (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        boxSizing: "border-box",
        gap: isMobile ? "45px" : "32px",
      }}
    >
      {/* Subtle dark mode inside-border overlay (flush with bottom canvas) */}
      {isDark && (
        <div style={{
          position: "absolute",
          inset: isMobile ? "-6px -20px -10px -20px" : "-8px -44px -10px -44px",
          borderRadius: "0px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          pointerEvents: "none",
        }} />
      )}

      {navItems.map((item) => {
        const isActive = active === item.id;
        const IconComponent = item.icon;

        return (
          <button
            key={item.id}
            id={`mobile-nav-${item.id.toLowerCase()}`}
            onClick={() => onChange?.(item.id)}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px 8px 10px 8px",
              border: "none",
              background: "transparent",
              color: isActive ? activeColor : inactiveColor,
              cursor: "pointer",
              flex: 1,
              boxSizing: "border-box",
              transition: "color 0.2s ease, transform 0.15s ease",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = isDark ? "rgba(255, 255, 255, 0.75)" : "#111111";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = inactiveColor;
            }}
          >
            {/* Active Indicator Bar at the very bottom */}
            {isActive && (
              <motion.div
                layoutId="navActiveIndicator"
                style={{
                  position: "absolute",
                  bottom: "0px",
                  width: "28px",
                  height: "3.5px",
                  borderRadius: "999px",
                  background: activeColor,
                }}
              />
            )}

            {/* Icon Container */}
            <motion.div
              animate={{ scale: isActive ? 1.08 : 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              style={{ lineHeight: 0, display: "block", marginBottom: "3px" }}
            >
              <HugeiconsIcon
                icon={IconComponent}
                size={21}
                color="currentColor"
                strokeWidth={isActive ? 2 : 1.5}
              />
            </motion.div>

            {/* Label Text */}
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: isActive ? 600 : 500,
                letterSpacing: "0.015em",
                transition: "color 0.2s ease",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        background: isDark ? "rgba(10, 10, 10, 0.85)" : "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: isDark
          ? "0 -10px 30px rgba(0, 0, 0, 0.4)"
          : "0 -8px 24px rgba(0, 0, 0, 0.04)",
        zIndex: 9999,
        padding: isMobile ? "6px 20px 10px 20px" : "8px 44px 10px 44px",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "1280px" }}>
        {renderNavContent()}
      </div>
    </div>
  );
}