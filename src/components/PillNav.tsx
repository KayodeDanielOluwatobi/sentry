"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Sliders, Activity, User } from "lucide-react";

export type NavItem = "Dashboard" | "Controls" | "Diagnostics" | "Profile";

interface PillNavProps {
  theme?: "light" | "dark";
  active?: NavItem;
  onChange?: (item: NavItem) => void;
}

export default function PillNav({ theme = "light", active = "Dashboard", onChange }: PillNavProps) {
  const isDark = theme === "dark";
  const textColor = isDark ? "#fff" : "#111";
  const grayText = isDark ? "#9ca3af" : "#6b7280";

  const navItems: { id: NavItem; icon: React.ReactNode }[] = [
    { id: "Dashboard", icon: <LayoutDashboard size={16} strokeWidth={2} /> },
    { id: "Controls", icon: <Sliders size={16} strokeWidth={2} /> },
    { id: "Diagnostics", icon: <Activity size={16} strokeWidth={2} /> },
    { id: "Profile", icon: <User size={16} strokeWidth={2} /> },
  ];

  return (
    <nav style={{
      display: "flex",
      justifyContent: "center",
      width: "100%",
      padding: "1rem 0",
      marginTop: "1rem"
    }}>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
        padding: "0.4rem",
        borderRadius: "999px",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        position: "relative"
      }}>
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
                color: isActive ? textColor : grayText,
                fontSize: "0.9rem",
                fontWeight: isActive ? 600 : 400,
                cursor: "pointer",
                zIndex: 1,
                transition: "color 0.3s ease",
                letterSpacing: "0.01em"
              }}
            >
              {React.cloneElement(item.icon as React.ReactElement<React.ComponentProps<"svg">>, {
                fill: isActive ? "currentColor" : "none",
                strokeWidth: isActive ? 2.5 : 2,
              })}
              <span style={{ display: "inline-block" }}>{item.id}</span>
              
              {isActive && (
                <motion.div
                  layoutId="pillNav"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: isDark ? "rgba(255,255,255,0.08)" : "#fff",
                    borderRadius: "999px",
                    boxShadow: isDark ? "none" : "0 2px 10px rgba(0,0,0,0.05)",
                    zIndex: -1
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
