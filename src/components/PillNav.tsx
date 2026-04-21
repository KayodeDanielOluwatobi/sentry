"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { DashboardSquare01Icon, Settings01Icon, Activity01Icon, UserIcon } from "@hugeicons/core-free-icons";

import LiquidGlass from "liquid-glass-react";

export type NavItem = "Dashboard" | "Controls" | "Diagnostics" | "Profile";

interface PillNavProps {
  theme?: "light" | "dark";
  active?: NavItem;
  onChange?: (item: NavItem) => void;
}

export default function PillNav({ theme = "light", active = "Dashboard", onChange }: PillNavProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#fff" : "#111";
  const grayText = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)";

  const navItems: { id: NavItem; icon: any }[] = [
    { id: "Dashboard", icon: DashboardSquare01Icon },
    { id: "Controls", icon: Settings01Icon },
    { id: "Diagnostics", icon: Activity01Icon },
    { id: "Profile", icon: UserIcon },
  ];

  return (
    <nav style={{
      display: "flex",
      justifyContent: "center",
      width: "100%",
      padding: "1rem 0",
      marginTop: "1rem",
      position: "relative"
    }}>
      <LiquidGlass
        displacementScale={35}
        blurAmount={0.08}
        saturation={130}
        aberrationIntensity={1.5}
        elasticity={0.2}
        cornerRadius={999}
        padding="20px 20px"
        style={{
          display: "inline-flex",
          position: "relative",
          marginLeft: "687px"
        }}
      >
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          position: "relative",
          zIndex: 1
        }}>
          {isDark && (
            <div style={{
              position: "absolute",
              inset: "-15px -15px", // Matches padding of LiquidGlass
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              pointerEvents: "none",
              zIndex: 2
            }} />
          )}

          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChange?.(item.id)}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.6rem 1.25rem",
                  borderRadius: "999px",
                  border: "none",
                  background: "transparent",
                  color: isActive ? "#0a0a0a" : grayText,
                  fontSize: "0.9rem",
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  zIndex: 3,
                  transition: "color 0.3s ease",
                  letterSpacing: "0.01em"
                }}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  color="currentColor"
                />
                <span style={{ display: "inline-block" }}>{item.id}</span>

                {isActive && (
                  <motion.div
                    layoutId="pillNav"
                    transition={{ type: "spring", stiffness: 400, damping: 50, bounce: 0 }}
                    style={{
                      position: "absolute",
                      inset: "-6px -6px", // Increased size slightly beyond button boundaries
                      background: isDark ? "hsl(120, 100%, 50%)" : "#0d9b0d",
                      borderRadius: "999px",
                      boxShadow: isDark ? "0 2px 14px hsla(120, 100%, 50%, 0.3)" : "0 2px 14px rgba(13, 155, 13, 0.3)",
                      zIndex: -1
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </LiquidGlass>
    </nav>
  );
}
