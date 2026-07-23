"use client";

import React from "react";

interface OnboardingScreenProps {
  onComplete: () => void;
  theme?: "light" | "dark";
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundImage: "url('/battery.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end", // Push all contents to the bottom like the screenshot
        alignItems: "center",
        padding: "1.5rem 1.5rem clamp(2rem, 8vh, 3.5rem) 1.5rem",
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* ── Light Ambient Overlay to keep text legible ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.18) 60%, rgba(255,255,255,0.38) 100%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-onboard-content {
          animation: fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .pill-black-btn {
          transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
        }
        .pill-black-btn:hover {
          background-color: #222222 !important;
          transform: scale(1.02);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22) !important;
        }
        .pill-black-btn:active {
          transform: scale(0.99);
        }
      `}</style>

      {/* ── Content Cluster (Sentry Logo directly above Heading Title) ── */}
      <div
        className="animate-onboard-content"
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          width: "100%",
          maxWidth: "360px",
          marginBottom: "2.2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Sentry logo text directly above title - capitalized with S, no shield icon */}
        <span
          style={{
            fontSize: "1.32rem",
            fontWeight: 800,
            color: "#111111",
            letterSpacing: "-0.03em",
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            marginBottom: "0.8rem",
          }}
        >
          Sentry
        </span>

        {/* Heading title */}
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(2.1rem, 8vw, 2.5rem)",
            fontWeight: 800,
            color: "#111111",
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            fontFamily: "var(--font-inter), system-ui, sans-serif",
          }}
        >
          Smart Energy Grid
        </h1>
        <span
          style={{
            display: "block",
            marginTop: "0.3rem",
            fontSize: "clamp(2.1rem, 8vw, 2.5rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            background: "linear-gradient(135deg, #2563eb 0%, #ef4444 65%, #f97316 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Starts Here
        </span>
      </div>

      {/* ── Floating Action Button ── */}
      <div
        className="animate-onboard-content"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <button
          onClick={onComplete}
          className="pill-black-btn"
          style={{
            width: "100%",
            background: "#111111",
            border: "none",
            borderRadius: "30px", // Rounded pill layout
            padding: "1.1rem",
            color: "#ffffff",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            outline: "none",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)",
            fontFamily: "var(--font-inter), sans-serif",
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
