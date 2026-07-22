"use client";
import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

interface LoginScreenProps {
  theme?: "light" | "dark";
}

export default function LoginScreen({ theme = "light" }: LoginScreenProps) {
  const isDark = theme === "dark";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider) {
      setError("Authentication is not configured.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        // User dismissed — not an error
        setLoading(false);
        return;
      }
      // Show the real Firebase error code to help diagnose domain/config issues
      const code = err.code ?? "unknown";
      if (code === "auth/unauthorized-domain") {
        setError("This domain is not authorised in Firebase. Add it to Firebase Console → Authentication → Authorized Domains.");
      } else {
        setError(`Sign-in failed: ${code}`);
      }
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
        alignItems: "center",
        justifyContent: "center",
        background: isDark
          ? "linear-gradient(135deg, #080f0a 0%, #0a1a10 40%, #061209 100%)"
          : "linear-gradient(135deg, #f0faf4 0%, #e8f5ed 40%, #f8fafc 100%)",
        overflow: "hidden",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(30px, -20px) scale(1.08); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-25px, 20px) scale(1.05); }
        }
        @keyframes spinBtn {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .login-card-anim {
          animation: loginFadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .login-google-btn {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .login-google-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.22);
        }
        .login-google-btn:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>

      {/* Ambient orb 1 */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "15%",
          width: "380px",
          height: "380px",
          borderRadius: "50%",
          background: isDark
            ? "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "orbFloat1 8s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      {/* Ambient orb 2 */}
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "12%",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: isDark
            ? "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "orbFloat2 10s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Login card */}
      <div
        className="login-card-anim"
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(92vw, 420px)",
          background: isDark
            ? "rgba(10, 18, 12, 0.72)"
            : "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)"}`,
          borderRadius: "24px",
          padding: "2.5rem 2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.6rem",
          boxShadow: isDark
            ? "0 24px 64px rgba(0,0,0,0.55), 0 1px 2px rgba(255,255,255,0.04)"
            : "0 24px 64px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {/* Logo + title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #065f46 0%, #10b981 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 4L6 9v8c0 5.5 4.3 10.6 10 12 5.7-1.4 10-6.5 10-12V9L16 4z"
                fill="rgba(255,255,255,0.15)"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1.5"
              />
              <path
                d="M13 16.5l2.5 2.5 5-5"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "1.6rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: isDark ? "#ffffff" : "#111111",
                lineHeight: 1.1,
              }}
            >
              Sentry
            </h1>
            <p
              style={{
                margin: "0.3rem 0 0",
                fontSize: "0.78rem",
                color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
                fontWeight: 400,
                letterSpacing: "0.01em",
              }}
            >
              Inverter Monitoring System
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: "1px",
            background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
          }}
        />

        {/* CTA */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.82rem",
              color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Sign in to access your battery &amp; energy dashboard
          </p>

          <button
            id="google-signin-btn"
            className="login-google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.65rem",
              padding: "0.8rem 1.25rem",
              borderRadius: "14px",
              background: loading
                ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)")
                : (isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.95)"),
              border: `1.5px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)"}`,
              color: isDark ? "#ffffff" : "#111111",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              outline: "none",
              opacity: loading ? 0.7 : 1,
              fontFamily: "inherit",
              boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
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
                <circle cx="10" cy="10" r="8" stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"} strokeWidth="2.5" />
                <path d="M10 2a8 8 0 0 1 8 8" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
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
                fontSize: "0.75rem",
                color: "#ef4444",
                textAlign: "center",
                padding: "0.5rem 0.75rem",
                background: "rgba(239,68,68,0.08)",
                borderRadius: "8px",
                border: "1px solid rgba(239,68,68,0.18)",
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <p
          style={{
            margin: 0,
            fontSize: "0.68rem",
            color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Access is granted to authorised users only.
          <br />Your session is secured by Firebase Authentication.
        </p>
      </div>
    </div>
  );
}
