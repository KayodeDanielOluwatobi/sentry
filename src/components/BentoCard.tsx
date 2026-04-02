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

  // User-defined color codes
  // Light theme: stroke #dee0e2, fill top #f3fafc to bottom #ffffff
  // Dark theme: stroke #21211d, lighter dark #242421 at top-right 45deg, deeper dark #060702 at bottom-left
  const borderValue = isDark ? "1.5px solid #21211d" : "1.5px solid #dee0e2";
  const backgroundValue = isDark
    ? "linear-gradient(45deg, #060702, #242421)"
    : "linear-gradient(to bottom, #f3fafc, #ffffff)";

  return (
    <div
      style={{
        position: "relative",
        border: borderValue,
        background: backgroundValue,
        borderRadius: "32px", // Modern rounded bento aesthetic
        padding: "2.5rem",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // Constrains content cleanly
        boxShadow: withShadow 
          ? (isDark 
              ? "0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)" 
              : "0 10px 40px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.8)")
          : (isDark 
              ? "inset 0 1px 0 rgba(255,255,255,0.03)" 
              : "inset 0 1px 0 rgba(255,255,255,0.8)"),
        transition: "border 0.4s ease, background 0.4s ease, box-shadow 0.4s ease",
        height: "100%", // Ensures it scales inside the CSS grid row
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
