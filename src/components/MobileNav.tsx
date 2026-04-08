"use client";

import React from "react";
import { motion } from "framer-motion";
// Import the Icon type for better TypeScript support
import { SquaresFour, Faders, Activity, User, Icon } from "@phosphor-icons/react";
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
  const grayText = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";

  // Store the Component itself, not the JSX element, for cleaner rendering
  const navItems: { id: NavItem; icon: Icon; label: string }[] = [
    { id: "Dashboard", icon: SquaresFour, label: "Home" },
    { id: "Controls", icon: Faders, label: "Controls" },
    { id: "Diagnostics", icon: Activity, label: "Logs" },
    { id: "Profile", icon: User, label: "Profile" },
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
                  color: isActive ? "#0a0a0a" : grayText,
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
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      margin: "auto",
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "#39FF14",
                      boxShadow: "0 2px 14px rgba(57, 255, 20, 0.4)",
                      zIndex: -1,
                    }}
                  />
                )}

                <motion.div
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  style={{ lineHeight: 0, display: "block" }}
                >
                  {/* Correct way to handle Phosphor Icons weight and size */}
                  <IconComponent
                    size={22}
                    weight={isActive ? "fill" : "regular"}
                  />
                </motion.div>
              </button>
            );
          })}
        </div>
      </LiquidGlass>

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