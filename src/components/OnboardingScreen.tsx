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
        justifyContent: "space-between",
        alignItems: "center",
        padding: "clamp(2rem, 10vh, 4rem) 1.5rem clamp(2rem, 8vh, 3.5rem) 1.5rem",
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
          background: "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.2) 60%, rgba(255,255,255,0.4) 100%)",
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

      {/* ── Top Section: Sentry Logo (Capital S) ── */}
      <div
        className="animate-onboard-content"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.35rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          {/* Small modern shield icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L4 5v6c0 5.25 3.42 10.16 8 11 4.58-.84 8-5.75 8-11V5l-8-3z"
              fill="rgba(16, 185, 129, 0.1)"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "#111111",
              letterSpacing: "-0.03em",
              fontFamily: "var(--font-campton), system-ui, sans-serif",
            }}
          >
            Sentry
          </span>
        </div>
      </div>

      {/* ── Middle Section: Luma-styled Header ── */}
      <div
        className="animate-onboard-content"
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          width: "100%",
          maxWidth: "360px",
          marginTop: "auto",
          marginBottom: "2.5rem",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(2.1rem, 8vw, 2.5rem)",
            fontWeight: 800,
            color: "#111111",
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            fontFamily: "var(--font-campton), system-ui, sans-serif",
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
            fontFamily: "var(--font-campton), system-ui, sans-serif",
            background: "linear-gradient(135deg, #2563eb 0%, #ef4444 65%, #f97316 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Starts Here
        </span>
      </div>

      {/* ── Bottom Section: Floating Action Button ── */}
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
            borderRadius: "30px", // Rounded pill layout matching screenshot
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
