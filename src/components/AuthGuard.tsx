"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginScreen from "./LoginScreen";

interface AuthContextValue {
  user: User | null;
}

const AuthContext = createContext<AuthContextValue>({ user: null });

export function useAuthUser(): User | null {
  return useContext(AuthContext).user;
}

interface AuthGuardProps {
  children: React.ReactNode;
  theme?: "light" | "dark";
}

export default function AuthGuard({ children, theme = "light" }: AuthGuardProps) {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    if (!auth) {
      // Auth not configured — skip gating in development without env vars
      setUser(null);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, []);

  // Still resolving auth state
  if (user === undefined) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme === "dark"
            ? "linear-gradient(135deg, #080f0a 0%, #0a1a10 100%)"
            : "linear-gradient(135deg, #f0faf4 0%, #f8fafc 100%)",
        }}
      >
        <style>{`
          @keyframes agSpin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          style={{ animation: "agSpin 0.75s linear infinite" }}
        >
          <circle
            cx="18"
            cy="18"
            r="15"
            stroke={theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}
            strokeWidth="3"
          />
          <path
            d="M18 3a15 15 0 0 1 15 15"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // Not signed in → show login screen
  if (!user) {
    return <LoginScreen theme={theme} />;
  }

  // Signed in → render the full dashboard
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}
