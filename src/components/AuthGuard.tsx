"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import LoginScreen from "./LoginScreen";
import OnboardingScreen from "./OnboardingScreen";

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
  // undefined = still loading, null = not signed in, User = signed in
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isOnboarded, setIsOnboarded] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // 1. Resolve onboarding preference
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("sentry_onboarded") === "true";
      setIsOnboarded(cached);
    }

    const shouldBypass = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

    if (shouldBypass) {
      setUser({
        id: "mock-dev-user",
        email: "developer@sentry.local",
        app_metadata: {},
        user_metadata: {
          full_name: "Developer Mode",
          avatar_url: "",
        },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User);
      return;
    }

    // Immediately restore any existing session (handles page refresh & redirect return)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Keep in sync with auth state changes (sign in / sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Resolving session/onboarding cache — show a branded spinner
  if (isOnboarded === undefined || (isOnboarded && user === undefined)) {
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

  // Not onboarded yet
  if (!isOnboarded) {
    return (
      <OnboardingScreen
        onComplete={() => {
          localStorage.setItem("sentry_onboarded", "true");
          setIsOnboarded(true);
        }}
        theme={theme}
      />
    );
  }

  // Not signed in
  if (!user) {
    return <LoginScreen theme={theme} />;
  }

  // Signed in — render the dashboard
  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}
