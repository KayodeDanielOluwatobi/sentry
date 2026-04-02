"use client";

import { useState } from "react";
import BatteryArc from "@/components/BatteryArc";
import BentoCard from "@/components/BentoCard";
import BatteryPercentage from "@/components/BatteryPercentage";
import GridStatus from "@/components/GridStatus";
import VoltageWaveform from "@/components/VoltageWaveform";
import GridSignalRings from "@/components/GridSignalRings";
import BatteryTemperature from "@/components/BatteryTemperature";

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isCharging, setIsCharging] = useState(true);
  const [gridState, setGridState] = useState<"online" | "offline" | "unstable">("online");
  const gridStates = ["online", "offline", "unstable"] as const;
  // Temperature toggle: cycles through Optimal (<45), Warm (45-60), Critical (>60)
  const tempValues = [25, 52, 65] as const;
  const [tempIdx, setTempIdx] = useState(0);
  const temperature = tempValues[tempIdx];
  const tempLabel = temperature < 45 ? "Optimal" : temperature < 60 ? "Warm" : "Critical";
  const isDark = theme === "dark";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark ? "#080808" : "#ebf0f5", // matches the glassy vibe
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "4rem 2rem",
        fontFamily: "var(--font-google-sans), sans-serif",
        transition: "background 0.4s ease",
        color: isDark ? "#ffffff" : "#111111",
      }}
    >
      <div style={{ width: "100%", maxWidth: "1200px" }}>

        {/* Header & Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
          <div>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }}>Energy Center</h1>
            <p style={{ marginTop: "0.5rem", color: isDark ? "#888" : "#666", fontSize: "0.95rem" }}>
              Responsive Bento Grid Dashboard
            </p>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => setIsCharging(!isCharging)}
              style={{
                padding: "0.8rem 1.5rem",
                borderRadius: "999px",
                border: `1px solid ${isDark ? "#333" : "#dee0e2"}`,
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                color: isDark ? "#fff" : "#111",
                fontSize: "0.85rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              Toggle Charging
            </button>
            <button
              onClick={() => setGridState(s => gridStates[(gridStates.indexOf(s) + 1) % 3])}
              style={{
                padding: "0.8rem 1.5rem",
                borderRadius: "999px",
                border: `1px solid ${isDark ? "#333" : "#dee0e2"}`,
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                color: isDark ? "#fff" : "#111",
                fontSize: "0.85rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              Grid: {gridState}
            </button>
            <button
              onClick={() => setTempIdx(i => (i + 1) % 3)}
              style={{
                padding: "0.8rem 1.5rem",
                borderRadius: "999px",
                border: `1px solid ${isDark ? "#333" : "#dee0e2"}`,
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                color: isDark ? "#fff" : "#111",
                fontSize: "0.85rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              Temp: {tempLabel}
            </button>
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              style={{
                padding: "0.8rem 1.5rem",
                borderRadius: "999px",
                border: `1px solid ${isDark ? "#333" : "#dee0e2"}`,
                background: isDark ? "#111" : "#fff",
                color: isDark ? "#fff" : "#111",
                fontSize: "0.85rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
              }}
            >
              Switch Theme
            </button>
          </div>
        </div>

        {/* Bento Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {/* Card 1: Battery Percentage */}
          <BatteryPercentage
            theme={theme}
            isCharging={isCharging}
            withShadow={false}
            style={{ height: "fit-content" }}
            soc={89}
          />

          {/* Card 2: Grid Status */}
          <GridStatus
            theme={theme}
            gridState={gridState}
            withShadow={false}
            style={{ height: "fit-content" }}
          />
          {/* Card 3: Battery Temperature (with inline toggle above) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* Temp state toggle — sits right above the card */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {([25, 52, 65] as const).map((val, i) => {
                const label = val < 45 ? "Optimal" : val < 60 ? "Warm" : "Critical";
                const active = tempIdx === i;
                const activeColor = val < 45 ? "#22c55e" : val < 60 ? "#f97316" : "#ef4444";
                return (
                  <button
                    key={val}
                    onClick={() => setTempIdx(i)}
                    style={{
                      padding: "0.35rem 0.85rem",
                      borderRadius: "999px",
                      border: `1px solid ${active ? activeColor : isDark ? "#333" : "#dee0e2"}`,
                      background: active ? `${activeColor}18` : "transparent",
                      color: active ? activeColor : isDark ? "#666" : "#aaa",
                      fontSize: "0.78rem",
                      fontWeight: active ? 600 : 400,
                      letterSpacing: "0.05em",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {label} · {val}°C
                  </button>
                );
              })}
            </div>

            <BatteryTemperature
              theme={theme}
              temperature={temperature}
              mosfetTemp={temperature + 17}
              cellTemp={temperature + 6}
              peakTempToday={temperature + 23}
              trend={temperature > 50 ? "rising" : "stable"}
              withShadow={false}
              style={{ height: "fit-content" }}
            />
          </div>



        </div>
      </div>
    </div>
  );
}