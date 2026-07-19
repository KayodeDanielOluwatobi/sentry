"use client";

import React from "react";

export type CardTheme = "light" | "dark";

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: CardTheme;
  withShadow?: boolean;
  children?: React.ReactNode;
}

export default function BentoCard({ theme = "light", withShadow = true, children, style, ...props }: BentoCardProps) {
  const isDark = theme === "dark";

  // Light/Dark borders
  const borderValue = isDark ? "1.5px solid #21211d" : "1.5px solid #dee0e2";
  
  // Use solid background colors instead of gradients for perfectly smooth CSS transitions
  const backgroundColor = isDark ? "#121212" : "#ffffff";

  return (
    <div
      style={{
        position: "relative",
        border: borderValue,
        backgroundColor: backgroundColor,
        borderRadius: "32px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        containerType: "inline-size",
        boxShadow: withShadow
          ? (isDark
            ? "0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)"
            : "0 10px 40px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)")
          : (isDark
            ? "inset 0 1px 0 rgba(255,255,255,0.03)"
            : "inset 0 1px 0 rgba(255,255,255,0.8)"),
        // Simple, robust transition on all properties
        transition: "background-color 0.2s ease, border 0.2s ease, box-shadow 0.2s ease",
        ...style,
      }}
      {...props}
    >
      {/* ── Dot Pattern Overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: isDark
            ? "radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 0)"
            : "radial-gradient(rgba(0, 0, 0, 0.025) 1px, transparent 0)",
          backgroundSize: "24px 24px",
          pointerEvents: "none",
          zIndex: 0,
          transition: "opacity 0.2s ease",
        }}
      />

      {/* ── Content Container ── */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
        {children}
      </div>
    </div>
  );
}
