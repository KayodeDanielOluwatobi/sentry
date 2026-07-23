"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingScreenProps {
  onComplete: () => void;
  theme?: "light" | "dark";
}

export default function OnboardingScreen({ onComplete, theme = "dark" }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const isDark = theme === "dark";

  const slides = [
    {
      title: "Welcome to Sentry",
      subtitle: "B.Tech Final Year Project",
      content: "This system was designed as a Final Year B.Tech Project for the Department of Electrical and Electronics Engineering at the Federal University of Technology, Akure (FUTA), Ondo State, Nigeria.",
      developer: "Developed by Kayode Daniel Oluwatobi",
      // Custom SVG: Academic Crest / Energy Shield
      icon: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ filter: "drop-shadow(0 0 20px rgba(16, 185, 129, 0.45))" }}>
          <circle cx="60" cy="60" r="50" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M60 25L90 40V75L60 95L30 75V40L60 25Z" fill="rgba(16, 185, 129, 0.08)" stroke="#10b981" strokeWidth="3" strokeLinejoin="round" />
          <path d="M60 40V75" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          <path d="M48 55L60 67L72 55" stroke="#10b981" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="60" cy="83" r="3" fill="#10b981" />
        </svg>
      )
    },
    {
      title: "Real-Time Telemetry",
      subtitle: "BMS Bluetooth & Wi-Fi Sync",
      content: "Stream live cell voltages, pack metrics, internal temperatures, and dynamic chemistry ratings directly from the JK-BMS database. Zero polling lag, high precision diagnostics.",
      developer: "Low-latency wireless link",
      // Custom SVG: Glowing wave telemetry line
      icon: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.45))" }}>
          <rect x="20" y="20" width="80" height="80" rx="16" stroke="#3b82f6" strokeWidth="2.5" fill="rgba(59, 130, 246, 0.05)" />
          <path d="M28 60H40L48 35L56 85L64 50L72 70L80 60H92" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="48" cy="35" r="4.5" fill="#3b82f6" />
          <circle cx="56" cy="85" r="4.5" fill="#3b82f6" />
          <circle cx="64" cy="50" r="4.5" fill="#3b82f6" />
        </svg>
      )
    },
    {
      title: "Emergency Control",
      subtitle: "Smart Load Manager & Relay",
      content: "Protect battery lifespans in critical conditions. Toggle the Inverter Isolation switch manually, and configure automated threshold rules for critical, major, and non-essential loads.",
      developer: "AC/DC Solid State Isolation",
      // Custom SVG: Flashing warning relay switch
      icon: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ filter: "drop-shadow(0 0 20px rgba(239, 68, 68, 0.45))" }}>
          <rect x="25" y="25" width="70" height="70" rx="35" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 4" />
          <path d="M60 20V35" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M35 48L60 65L85 48" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M60 65V90" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="60" cy="42" r="6" fill="#ef4444" />
          <path d="M60 100C60 100 80 85 80 75C80 65 60 65 60 65C60 65 40 65 40 75C40 85 60 100 60 100Z" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="2.5" />
        </svg>
      )
    },
    {
      title: "System Ready",
      subtitle: "Secure Access Credentials",
      content: "Onboarding is complete. Proceed to Google Single Sign-In to verify your observer account permissions and unlock live telemetry controls.",
      developer: "Sentry Gateway Protocol",
      // Custom SVG: Launch Rocket / Glowing Orb
      icon: (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ filter: "drop-shadow(0 0 22px rgba(251, 191, 36, 0.5))" }}>
          <circle cx="60" cy="60" r="42" fill="rgba(251, 191, 36, 0.08)" stroke="#fbbf24" strokeWidth="2.5" />
          <path d="M60 38L75 58V80H45V58L60 38Z" stroke="#fbbf24" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M53 80V86M67 80V86M60 80V89" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
          <path d="M45 68H75" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="60" cy="54" r="4" fill="#fbbf24" />
        </svg>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: isDark
          ? "radial-gradient(circle at 50% 50%, #032115 0%, #020a07 100%)"
          : "radial-gradient(circle at 50% 50%, #f0fdf4 0%, #f8fafc 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
        color: isDark ? "#ffffff" : "#111111",
        overflow: "hidden",
      }}
    >
      {/* ── Animated Background Orbs (Figma Glassmorphism Style) ── */}
      <div
        style={{
          position: "absolute",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: isDark ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.06)",
          filter: "blur(60px)",
          top: "-50px",
          left: "-50px",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: isDark ? "rgba(59, 130, 246, 0.06)" : "rgba(59, 130, 246, 0.04)",
          filter: "blur(70px)",
          bottom: "-80px",
          right: "-80px",
          pointerEvents: "none",
        }}
      />

      {/* ── Grid Pattern Overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: isDark
            ? "radial-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 0)"
            : "radial-gradient(rgba(0, 0, 0, 0.015) 1px, transparent 0)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Central Glass Card ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "460px",
          background: isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.6)",
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.08)"}`,
          borderRadius: "32px",
          padding: "clamp(1.5rem, 6cqi, 2.5rem) clamp(1.2rem, 5cqi, 2rem)",
          boxShadow: isDark
            ? "0 40px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)"
            : "0 25px 60px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Progress indicators (Stretched pill dot active indicator) */}
        <div style={{ display: "flex", gap: "0.45rem", marginBottom: "2rem" }}>
          {slides.map((_, idx) => {
            const isActive = idx === currentSlide;
            return (
              <motion.div
                key={idx}
                animate={{
                  width: isActive ? 24 : 8,
                  backgroundColor: isActive
                    ? "#10b981"
                    : isDark
                      ? "rgba(255,255,255,0.18)"
                      : "rgba(0,0,0,0.15)",
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{
                  height: 8,
                  borderRadius: 4,
                }}
              />
            );
          })}
        </div>

        {/* ── Slide Content Carousel (With Slide Left/Right Transitions) ── */}
        <div style={{ width: "100%", minHeight: "330px", position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Graphic Icon container */}
              <div style={{ marginBottom: "1.75rem", display: "flex", justifyContent: "center" }}>
                {slides[currentSlide].icon}
              </div>

              {/* Title & Subtitle */}
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(1.4rem, 5vw, 1.65rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: isDark ? "#ffffff" : "#111111",
                  fontFamily: "var(--font-google-sans), sans-serif",
                }}
              >
                {slides[currentSlide].title}
              </h1>
              <h2
                style={{
                  margin: "0.25rem 0 1rem 0",
                  fontSize: "clamp(0.78rem, 3vw, 0.88rem)",
                  fontWeight: 600,
                  color: "#10b981",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontFamily: "var(--font-inter), sans-serif",
                }}
              >
                {slides[currentSlide].subtitle}
              </h2>

              {/* Description Paragraph */}
              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(0.82rem, 3.2vw, 0.92rem)",
                  lineHeight: 1.5,
                  color: isDark ? "rgba(255,255,255,0.72)" : "#4b5563",
                  fontFamily: "var(--font-inter), sans-serif",
                  fontWeight: 400,
                }}
              >
                {slides[currentSlide].content}
              </p>

              {/* Developer / Spec Footer info */}
              <div
                style={{
                  marginTop: "1.5rem",
                  fontSize: "0.68rem",
                  fontWeight: 500,
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)",
                  fontFamily: "var(--font-inter), sans-serif",
                  letterSpacing: "0.02em",
                }}
              >
                {slides[currentSlide].developer}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer Button Actions Row ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            marginTop: "2rem",
            padding: "0 0.2rem",
          }}
        >
          {/* Back/Skip button */}
          <button
            onClick={currentSlide === 0 ? onComplete : handleBack}
            style={{
              background: "none",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
              cursor: "pointer",
              transition: "color 0.2s ease",
              padding: "0.5rem 1rem",
              borderRadius: "12px",
              fontFamily: "var(--font-inter), sans-serif",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = isDark ? "#ffffff" : "#111111";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
            }}
          >
            {currentSlide === 0 ? "Skip" : "Back"}
          </button>

          {/* Next/Get Started button */}
          <button
            onClick={handleNext}
            style={{
              padding: "0.68rem 1.6rem",
              background: currentSlide === slides.length - 1
                ? "#10b981"
                : isDark
                  ? "rgba(255,255,255,0.06)"
                  : "#111111",
              border: `1px solid ${currentSlide === slides.length - 1 ? "#10b981" : isDark ? "rgba(255,255,255,0.08)" : "transparent"}`,
              borderRadius: "14px",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: currentSlide === slides.length - 1
                ? "#ffffff"
                : isDark
                  ? "#ffffff"
                  : "#ffffff",
              cursor: "pointer",
              boxShadow: currentSlide === slides.length - 1
                ? "0 8px 24px rgba(16, 185, 129, 0.3)"
                : "none",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              fontFamily: "var(--font-inter), sans-serif",
            }}
            onMouseEnter={e => {
              if (currentSlide === slides.length - 1) {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 10px 30px rgba(16, 185, 129, 0.45)";
              } else {
                e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.12)" : "#222222";
                e.currentTarget.style.transform = "scale(1.02)";
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "scale(1)";
              if (currentSlide === slides.length - 1) {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(16, 185, 129, 0.3)";
              } else {
                e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#111111";
              }
            }}
          >
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
