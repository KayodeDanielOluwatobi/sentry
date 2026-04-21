"use client";

import React from "react";
import LiquidGlass from "liquid-glass-react";

export type CardTheme = "light" | "dark";

interface LiquidCardProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: CardTheme;
  withShadow?: boolean;
  children?: React.ReactNode;
}

export default function LiquidCard({
  theme = "light",
  withShadow = true,
  children,
  style,
  ...props
}: LiquidCardProps) {
  const isDark = theme === "dark";

  // Match BentoCard border colors
  const borderValue = isDark ? "1.5px solid #21211d" : "1.5px solid #dee0e2";
  
  // We use a semi-transparent background to let the glass effect shine through
  const backgroundValue = isDark
    ? "rgba(6, 7, 2, 0.4)"
    : "rgba(243, 250, 252, 0.4)";

  const shadowValue = withShadow
    ? (isDark
      ? "0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)"
      : "0 15px 50px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)")
    : "none";

  return (
    <LiquidGlass
      displacementScale={85} // High distortion as requested
      blurAmount={0.12}
      saturation={140}
      aberrationIntensity={3}
      elasticity={0.25}
      cornerRadius={32}
      style={{
        border: borderValue,
        background: backgroundValue,
        boxShadow: shadowValue,
        transition: "border 0.4s ease, background 0.4s ease, box-shadow 0.4s ease",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          containerType: "inline-size",
          ...props.style
        }}
        {...props}
      >
        {/* Dot pattern matching BentoCard */}
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
          }}
        />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          {children}
        </div>
      </div>
    </LiquidGlass>
  );
}
