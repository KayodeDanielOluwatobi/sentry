"use client";

import React from "react";

export type CardTheme = "light" | "dark";

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: CardTheme;
  withShadow?: boolean;
  children?: React.ReactNode;
}

export default function BentoCard({ theme = "light", withShadow = true, children, style, ...props }: BentoCardProps) {
  return (
    <div
      style={{
        position: "relative",
        border: "1px solid var(--card-border)",
        backgroundColor: "var(--card-bg)",
        borderRadius: "20px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        containerType: "inline-size",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: withShadow ? "var(--card-shadow)" : "var(--card-inset)",
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
          backgroundImage: "radial-gradient(var(--dot-color) 1px, transparent 0)",
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
