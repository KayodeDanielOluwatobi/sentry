"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

interface LoginScreenProps {
  theme?: "light" | "dark";
}

export default function LoginScreen({ theme = "light" }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const redirectTo = typeof window !== "undefined"
        ? `${window.location.origin}/`
        : "https://sentry-nwkt.vercel.app/";

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });

      if (oauthError) {
        setError(`Sign-in failed: ${oauthError.message}`);
        setLoading(false);
      }
    } catch (err: any) {
      setError(`Unexpected error: ${err?.message ?? "unknown"}`);
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sentry_onboarded");
      window.location.reload(); // Refresh to fall back to Onboarding slides
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end", // Align floating sheet to bottom
        alignItems: "center",
        backgroundImage: "url('/battery.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        overflow: "hidden",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      {/* ── Dark Ambient Backdrop Overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <style>{`
        @keyframes sheetSlideUp {
          from { transform: translate(-50%, 40px); opacity: 0; }
          to   { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes spinBtn {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .bottom-sheet-anim {
          animation: sheetSlideUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .primary-dark-btn {
          transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
        }
        .primary-dark-btn:hover:not(:disabled) {
          background-color: #222222 !important;
          transform: scale(1.015);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22) !important;
        }
        .primary-dark-btn:active:not(:disabled) {
          transform: scale(0.99);
        }
        .close-circle-btn {
          transition: background-color 0.15s ease, transform 0.15s ease;
        }
        .close-circle-btn:hover {
          background-color: #e5e7eb !important;
          transform: scale(1.05);
        }
      `}</style>

      {/* ── Floating bottom-sheet-card container with considerable bottom margin ── */}
      <div
        className="bottom-sheet-anim"
        style={{
          position: "absolute",
          bottom: "1.5rem", // Margin at bottom
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 2.5rem)", // Margins at left and right
          maxWidth: "400px",
          background: "#ffffff",
          borderRadius: "32px", // Highly rounded corners all through
          padding: "2.2rem 1.8rem 2.5rem 1.8rem",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.22)",
          display: "flex",
          flexDirection: "column",
          gap: "1.2rem",
          zIndex: 1,
          boxSizing: "border-box",
        }}
      >
        {/* Top Indicators Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          {/* Logo Star Circle */}
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Regular symmetric 4-pointed star icon (astroid curve) */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 3 Q12 12 21 12 Q12 12 12 21 Q12 12 3 12 Q12 12 12 3 Z" fill="#111111" />
            </svg>
          </div>

          {/* Close x Circle Button (Reset Onboarding) */}
          <button
            onClick={handleClose}
            className="close-circle-btn"
            aria-label="Back to onboarding"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#f3f4f6",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Text Header Section */}
        <div style={{ marginTop: "0.4rem" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#111111",
              letterSpacing: "-0.03em",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
            }}
          >
            Get Started
          </h1>
          <p
            style={{
              margin: "0.6rem 0 0.4rem 0",
              fontSize: "0.92rem",
              color: "#6b7280",
              lineHeight: 1.5,
              fontWeight: 400,
              fontFamily: "var(--font-inter), system-ui, sans-serif",
            }}
          >
            Authenticate to access Sentry's live battery telemetry, configure smart load manager thresholds, and command isolation relays.
          </p>
        </div>

        {/* Action Button Section */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <button
            id="google-signin-btn"
            className="primary-dark-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: "100%",
              background: "#111111",
              border: "none",
              borderRadius: "30px", // Pill-shaped button matching screenshot
              padding: "1.1rem 1.25rem",
              color: "#ffffff",
              fontSize: "0.95rem",
              fontWeight: 650,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              cursor: loading ? "not-allowed" : "pointer",
              outline: "none",
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.15)",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            {loading ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                style={{ animation: "spinBtn 0.75s linear infinite" }}
              >
                <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
                <path d="M10 2a8 8 0 0 1 8 8" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            ) : (
              // Clean White/Multi-color Google G Icon
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span>{loading ? "Signing in…" : "Continue with Google"}</span>
          </button>

          {error && (
            <p
              style={{
                margin: 0,
                fontSize: "0.78rem",
                color: "#ef4444",
                textAlign: "center",
                padding: "0.55rem 0.8rem",
                background: "rgba(239,68,68,0.06)",
                borderRadius: "10px",
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer Note */}
        <p
          style={{
            margin: "0.5rem 0 0 0",
            fontSize: "0.72rem",
            color: "#9ca3af",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Access is granted to authorized observer accounts only.
          <br />Secure authentication wrapper provided by Supabase.
        </p>
      </div>
    </div>
  );
}
