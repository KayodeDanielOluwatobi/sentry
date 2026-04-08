"use client";

import { useState } from "react";
import { Zap, Sun, Moon } from "lucide-react";
import BatteryPercentage from "@/components/BatteryPercentage";
import GridStatus from "@/components/GridStatus";
import BatteryTemperature from "@/components/BatteryTemperature";
import LoadManagement from "@/components/LoadManagement";
import TotalLoad from "@/components/TotalLoad";
import PillNav, { NavItem } from "@/components/PillNav";
import MobileNav from "@/components/MobileNav";

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isCharging, setIsCharging] = useState(true);
  const [gridState, setGridState] = useState<"online" | "offline" | "unstable">("online");
  const gridStates = ["online", "offline", "unstable"] as const;
  const [activeTab, setActiveTab] = useState<NavItem>("Dashboard");
  
  const tempValues = [25, 52, 65] as const;
  const [tempIdx, setTempIdx] = useState(0);
  const [soc, setSoc] = useState(89);
  const [inverterMax, setInverterMax] = useState(1500);
  const [currentLoad, setCurrentLoad] = useState(450);

  const temperature = tempValues[tempIdx];
  const isDark = theme === "dark";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isDark ? "#080808" : "#ebf0f5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem",
        fontFamily: "var(--font-google-sans), sans-serif",
        transition: "background 0.4s ease",
        color: isDark ? "#ffffff" : "#111111",
      }}
    >
      <div style={{ width: "100%", maxWidth: "1310px" }}>

        {/* ── Header Section ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700, margin: 0, letterSpacing: "-0.03em" }}>Energy Center</h1>
            <p style={{ marginTop: "0.1rem", color: isDark ? "#888" : "#666", fontSize: "0.8rem", letterSpacing: "0.01em" }}>
              Dynamic Power Intelligence
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
             <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.4rem", 
              background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
              padding: "0.35rem 0.75rem",
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: isDark ? "#86efac" : "#16a34a",
              boxShadow: isDark ? "none" : "0 2px 10px rgba(0,0,0,0.02)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`
            }}>
              <Zap size={13} fill="currentColor" opacity={0.8} />
              {soc}%
            </div>

            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              style={{
                background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: isDark ? "#fbbf24" : "#f59e0b",
                transition: "all 0.2s ease",
                boxShadow: isDark ? "none" : "0 2px 10px rgba(0,0,0,0.02)",
              }}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>

        {/* ── Global Nav Bar ── */}
        <div className="desktop-only-nav" style={{ marginBottom: "1rem" }}>
          <PillNav 
            theme={theme} 
            active={activeTab} 
            onChange={setActiveTab} 
          />
        </div>

        <style>{`
          @media (max-width: 768px) {
            .desktop-only-nav {
              display: none;
            }
            .bento-grid {
              display: flex !important;
              flex-direction: column !important;
            }
          }
        `}</style>

        {/* ── Simulation Hub ── */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          <button
            onClick={() => setSoc(s => Math.max(0, s - 10))}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              border: `1px solid ${isDark ? "#333" : "#dee0e2"}`,
              background: isDark ? "rgba(255,255,255,0.02)" : "#fff",
              color: isDark ? "#fff" : "#111",
              fontSize: "0.7rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          > Drain </button>
          <button
            onClick={() => setSoc(s => Math.min(100, s + 10))}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              border: `1px solid ${isDark ? "#333" : "#dee0e2"}`,
              background: isDark ? "rgba(255,255,255,0.02)" : "#fff",
              color: isDark ? "#fff" : "#111",
              fontSize: "0.7rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          > Charge </button>
          <button
            onClick={() => setGridState(s => gridStates[(gridStates.indexOf(s) + 1) % 3])}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              border: `1px solid ${isDark ? "#333" : "#dee0e2"}`,
              background: isDark ? "rgba(255,255,255,0.02)" : "#fff",
              color: isDark ? "#fff" : "#111",
              fontSize: "0.7rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          > Grid: {gridState} </button>
          <button
            onClick={() => setIsCharging(!isCharging)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "999px",
              border: `1px solid ${isDark ? "#333" : "#dee0e2"}`,
              background: isDark ? "rgba(255,255,255,0.02)" : "#fff",
              color: isDark ? "#fff" : "#111",
              fontSize: "0.7rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          > {isCharging ? "Charging" : "Idle"} </button>
        </div>

        {/* ── Bento Grid (Seam-less High Density) ── */}
        <div 
          className="bento-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.75rem",
            gridAutoRows: "auto"
          }}
        >
          {/* Row 1, Col 1-2: Battery Percentage */}
          <div style={{ gridColumn: "span 2" }}>
            <BatteryPercentage
              theme={theme}
              isCharging={isCharging}
              withShadow={false}
              soc={soc}
            />
          </div>

          {/* Row 1, Col 3: Grid Status */}
          <div style={{ gridColumn: "span 1" }}>
            <GridStatus
              theme={theme}
              gridState={gridState}
              withShadow={false}
            />
          </div>

          {/* Row 2, Col 1: Battery Temperature */}
          <div style={{ gridColumn: "span 1" }}>
              <BatteryTemperature
                theme={theme}
                temperature={temperature}
                withShadow={false}
              />
          </div>

          {/* Row 2, Col 2-3: Total Load Output */}
          <div style={{ gridColumn: "span 2" }}>
              <TotalLoad
                theme={theme}
                currentWatts={currentLoad}
                maxWatts={inverterMax}
              />
          </div>

          {/* Row 3: Full Width Load Management */}
          <div style={{ gridColumn: "span 3" }}>
              <LoadManagement
                theme={theme}
                soc={soc}
                inverterMaxWatts={inverterMax}
              />
          </div>
        </div>

        {/* ── Mobile Nav Bar ── */}
        <MobileNav 
          theme={theme} 
          active={activeTab} 
          onChange={setActiveTab} 
        />
      </div>
    </div>
  );
}