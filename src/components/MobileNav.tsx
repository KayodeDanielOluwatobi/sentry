"use client";

import React from "react";
import { motion } from "framer-motion";
// Import HugeIcons
import { HugeiconsIcon } from "@hugeicons/react";
import { DashboardSquare01Icon, Settings01Icon, Activity01Icon, UserIcon } from "@hugeicons/core-free-icons";
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
  const [hoveredId, setHoveredId] = React.useState<NavItem | null>(null);
  const isDark = theme === "dark";
  const grayText = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";

  // Store the Component itself, not the JSX element, for cleaner rendering
  const navItems: { id: NavItem; icon: any; label: string }[] = [
    { id: "Dashboard", icon: DashboardSquare01Icon, label: "Home" },
    { id: "Controls", icon: Settings01Icon, label: "Controls" },
    { id: "Diagnostics", icon: Activity01Icon, label: "Logs" },
    { id: "Profile", icon: UserIcon, label: "Profile" },
  ];

  return (
    <>
      <LiquidGlass
        className="mobile-liquid-nav"
        displacementScale={55}
        blurAmount={0.08}
        saturation={140}
        aberrationIntensity={2}
        elasticity={0.2}
        cornerRadius={999}
        padding="24px 24px"
        style={{
          position: "fixed",
          bottom: "0.8rem",
          top: "unset",
          left: "50%",
          transform: "translateX(-50%)",
          marginLeft: "22.5px",
          width: "min(88vw, 360px)",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {isDark && (
            <div style={{
              position: "absolute",
              inset: "-24px -24px",
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
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
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px 24px",
                  borderRadius: "999px",
                  border: "none",
                  background: "transparent",
                  color: isActive ? (isDark ? "#0a0a0a" : "#ffffff") : grayText,
                  cursor: "pointer",
                  flex: 1,
                  boxSizing: "border-box",
                  transition: "color 0.2s ease",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileNavActiveCircle"
                    transition={{ type: "spring", stiffness: 500, damping: 50 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      margin: "auto",
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: isDark ? "hsl(120, 100%, 50%)" : "#0d9b0d",
                      boxShadow: isDark ? "0 2px 14px hsla(120, 100%, 50%, 0.4)" : "0 2px 14px rgba(13, 155, 13, 0.4)",
                      zIndex: -1,
                    }}
                  />
                )}

                <motion.div
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: "tween", duration: 0.1, ease: "easeOut" }}
                  style={{ lineHeight: 0, display: "block" }}
                >
                  {/* HugeIcons wrapper */}
                  <HugeiconsIcon
                    icon={IconComponent}
                    size={22}
                    color="currentColor"
                  />
                </motion.div>
              </button>
            );
          })}
        </div>
      </LiquidGlass>

      {/* Unclipped Tooltip Overlay Layer */}
      <div
        style={{
          position: "fixed",
          bottom: "calc(0.8rem + 70px + 32px)", // Mirrors nav geometry: nav offset + nav height (24+22+24px) + gap
          left: "50%",
          transform: "translateX(-50%)",
          marginLeft: "22.5px",
          width: "min(88vw, 360px)",
          height: "0",
          pointerEvents: "none",
          zIndex: 10000,
          display: "flex",
          justifyContent: "space-between",
          padding: "0 24px",
          boxSizing: "border-box"
        }}
        className="mobile-liquid-nav"
      >
        {navItems.map((item) => (
          <div key={`tooltip-${item.id}`} style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative" }}>
            {hoveredId === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 3 }}
                transition={{ duration: 0.2, delay: 0.25, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  bottom: "0",
                  background: isDark ? "rgba(30, 30, 30, 0.4)" : "rgba(255, 255, 255, 0.4)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.5)",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  letterSpacing: "0.02em",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"}`,
                }}
              >
                {item.label}
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @media (min-width: 769px) {
          .mobile-liquid-nav {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}