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
      {/* ── Soft Glass Ambient Overlay (Luma style) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.15) 50%, rgba(0,0,0,0.3) 100%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <style>{`
        @keyframes floatingCardSlideUp {
          from { transform: translate(-50%, 40px); opacity: 0; }
          to   { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes spinBtn {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .floating-auth-card {
          animation: floatingCardSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .pill-black-btn {
          transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
        }
        .pill-black-btn:hover:not(:disabled) {
          background-color: #222222 !important;
          transform: scale(1.02);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22) !important;
        }
        .pill-black-btn:active:not(:disabled) {
          transform: scale(0.99);
        }
      `}</style>

      {/* ── Floating Auth Card (Rounded rectangle with considerable margin) ── */}
      <div
        className="floating-auth-card"
        style={{
          position: "absolute",
          bottom: "1.5rem", // Margin at bottom
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 2.5rem)", // Margins at left and right
          maxWidth: "400px",
          background: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          borderRadius: "32px", // Highly rounded corners all through
          padding: "2.4rem 1.8rem",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.8rem",
          zIndex: 1,
          boxSizing: "border-box",
        }}
      >
        {/* Sentry Text Logo (Luma style) */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          {/* Small modern shield icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L4 5v6c0 5.25 3.42 10.16 8 11 4.58-.84 8-5.75 8-11V5l-8-3z"
              fill="rgba(16, 185, 129, 0.1)"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontSize: "1.1rem",
              fontWeight: 800,
              color: "#111111",
              letterSpacing: "-0.03em",
              fontFamily: "var(--font-google-sans), system-ui, sans-serif",
            }}
          >
            sentry
          </span>
        </div>

        {/* Luma-inspired Header Text */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.9rem, 7vw, 2.15rem)",
              fontWeight: 800,
              color: "#111111",
              letterSpacing: "-0.04em",
              lineHeight: 1.12,
              fontFamily: "var(--font-google-sans), system-ui, sans-serif",
            }}
          >
            Smart Energy Grid
          </h1>
          <span
            style={{
              display: "block",
              marginTop: "0.25rem",
              fontSize: "clamp(1.9rem, 7vw, 2.15rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.12,
              fontFamily: "var(--font-google-sans), system-ui, sans-serif",
              background: "linear-gradient(135deg, #3b82f6 0%, #ef4444 65%, #f97316 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Starts Here
          </span>
        </div>

        {/* Action Button Section */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <button
            id="google-signin-btn"
            className="pill-black-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: "100%",
              background: "#111111",
              border: "none",
              borderRadius: "30px", // Pill-shaped button matching screenshot
              padding: "1rem 1.25rem",
              color: "#ffffff",
              fontSize: "0.95rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              cursor: loading ? "not-allowed" : "pointer",
              outline: "none",
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.15)",
              fontFamily: "inherit",
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
              // Google G Icon
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
      </div>
    </div>
  );
}
