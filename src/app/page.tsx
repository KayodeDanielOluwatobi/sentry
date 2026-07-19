"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import BatteryPercentage from "@/components/BatteryPercentage";

import { NavItem } from "@/components/PillNav";
import MobileNav from "@/components/MobileNav";
import CellVoltages from "@/components/CellVoltages";
import SmartEnergyManager from "@/components/SmartEnergyManager";
import TemperaturesList from "@/components/TemperaturesList";
import ActiveAlarms from "@/components/ActiveAlarms";
import CycleCount from "@/components/CycleCount";

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isCharging, setIsCharging] = useState(true);

  const [activeTab, setActiveTab] = useState<NavItem>("Dashboard");

  const tempValues = [25, 52, 65] as const;
  const [tempIdx, setTempIdx] = useState(0);
  const [soc, setSoc] = useState(89);
  const [inverterMax, setInverterMax] = useState(1500);
  const [currentLoad, setCurrentLoad] = useState(450);
  const [cellVoltages, setCellVoltages] = useState([3.199, 3.197, 3.196, 3.199]);

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
        padding: "1rem 1rem 5.5rem 1rem",
        fontFamily: "var(--font-inter), sans-serif",
        transition: "background 0.2s ease, color 0.2s ease",
        color: isDark ? "#ffffff" : "#111111",
      }}
    >
      {/* Temporary Page Center Guide Line (Dashed Red)
      <div style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: "50%",
        width: "2px",
        background: "repeating-linear-gradient(to bottom, #ef4444, #ef4444 8px, transparent 8px, transparent 16px)",
        pointerEvents: "none",
        zIndex: 99999,
        opacity: 0.65,
      }} />
      */}

      <div style={{ width: "100%", maxWidth: "1310px" }}>

        {/* ── Top Bar ── */}
        <div style={{ marginBottom: "0.75rem" }}>
          <TopBar
            theme={theme}
            soc={soc}
            isCharging={isCharging}
            onThemeToggle={() => setTheme(isDark ? "light" : "dark")}
            onMenuClick={() => console.log("Menu clicked")}
          />
        </div>

        <style>{`
          @media (max-width: 768px) {
            .bento-grid {
              display: flex !important;
              flex-direction: column !important;
            }
          }
        `}</style>



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
          {/* Row 1: Battery Percentage (Full Width) */}
          <div style={{ gridColumn: "span 3" }}>
            <BatteryPercentage
              theme={theme}
              isCharging={isCharging}
              withShadow={false}
              soc={soc}
              temperature={temperature}
            />
          </div>

          {/* Row 2: Cell Voltages (Full Width) */}
          <div style={{ gridColumn: "span 3" }}>
            <CellVoltages
              theme={theme}
              voltages={cellVoltages}
              withShadow={false}
            />
          </div>

          {/* Row 3: Smart Energy Manager — directly under Cell Voltages */}
          <div style={{ gridColumn: "span 3" }}>
            <SmartEnergyManager
              theme={theme}
            />
          </div>

          {/* Row 4: Temperatures (Left half) + Alarms & Cycle Count stacked (Right half) — Locked side-by-side on all screens */}
          <div style={{
            gridColumn: "span 3",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
            width: "100%",
          }}>
            <div style={{ display: "flex", width: "100%" }}>
              <TemperaturesList
                theme={theme}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "space-between", height: "100%" }}>
              <ActiveAlarms
                theme={theme}
                activeCount={0}
                style={{ flex: 1, height: "100%" }}
              />
              <CycleCount
                theme={theme}
                cycleCount={12}
                style={{ flex: 1, height: "100%" }}
              />
            </div>
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