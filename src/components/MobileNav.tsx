"use client";

import React from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Home01Icon, PreferenceHorizontalIcon, Activity03Icon, UserIcon } from "@hugeicons/core-free-icons";
import LiquidGlass from "liquid-glass-react";

export type NavItem = "Dashboard" | "Controls" | "Diagnostics" | "Profile";

interface MobileNavProps {
  theme?: "light" | "dark";
  active?: NavItem;
  onChange?: (item: NavItem) => void;
}

export default function MobileNav({
  theme = "light",
  active = "Dashboard",
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
    { id: "Dashboard", icon: Home01Icon, label: "Dashboard" },
    { id: "Controls", icon: PreferenceHorizontalIcon, label: "Controls" },
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
          inset: isMobile ? "-14px -20px -22px -20px" : "-16px -44px -20px -44px",
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
              padding: "8px 12px",
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
            {/* Icon Container */}
            <motion.div
              animate={{ scale: isActive ? 1.08 : 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              style={{ lineHeight: 0, display: "block", marginBottom: "6px" }}
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
    <div className="navbar-wrapper" style={{ display: "contents" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .navbar-wrapper > span {
          display: none !important;
        }
      `}} />
      <LiquidGlass
        // The key prop forces a clean destroy & remount of the canvas context on layout change
        key={isMobile ? "mobile-nav" : "desktop-nav"}
        displacementScale={isMobile ? 40 : 45}
        blurAmount={0.08}
        saturation={130}
        aberrationIntensity={isMobile ? 3 : 3}
        elasticity={isMobile ? 0 : 0.15}
        cornerRadius={0} // Stretched flat to bottom
        padding={isMobile ? "14px 20px 22px 20px" : "16px 44px 20px 44px"}
        style={{
          position: "fixed",
          bottom: isMobile ? "-55px" : "-45px", // Pull WebGL margin below viewport edge
          left: "50%",
          transform: "translateX(-50%)",
          marginLeft: isMobile ? "-4px" : "385.8px", // Center guide verification offset
          width: "100vw", // Stretched edge-to-edge
          zIndex: 9999,
          borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(255, 255, 255, 0.4)",
          boxShadow: isDark
            ? "0 -10px 30px rgba(0, 0, 0, 0.3)"
            : "0 -8px 24px rgba(0, 0, 0, 0.03)",
        }}
      >
        {/* Temporary Navbar Center Guide Line (Dashed Blue)
        <div style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          width: "2px",
          background: "repeating-linear-gradient(to bottom, #3b82f6, #3b82f6 8px, transparent 8px, transparent 16px)",
          pointerEvents: "none",
          zIndex: 99999,
          opacity: 0.65,
        }} />
        */}

        {renderNavContent()}
      </LiquidGlass>
    </div>
  );
}