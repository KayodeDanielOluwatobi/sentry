"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import BatteryPercentage from "@/components/BatteryPercentage";

import BatteryTemperature from "@/components/BatteryTemperature";
import LoadManagement from "@/components/LoadManagement";
import TotalLoad from "@/components/TotalLoad";
import { NavItem } from "@/components/PillNav";
import MobileNav from "@/components/MobileNav";
import CellVoltages from "@/components/CellVoltages";
import SmartEnergyManager from "@/components/SmartEnergyManager";

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
        padding: "1rem",
        fontFamily: "var(--font-inter), sans-serif",
        transition: "background 0.4s ease",
        color: isDark ? "#ffffff" : "#111111",
      }}
    >
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

          {/* Row 4, Col 1: Battery Temperature */}
          <div style={{ gridColumn: "span 1" }}>
              <BatteryTemperature
                theme={theme}
                temperature={temperature}
                withShadow={false}
              />
          </div>

          {/* Row 4, Col 2-3: Total Load Output */}
          <div style={{ gridColumn: "span 2" }}>
              <TotalLoad
                theme={theme}
                currentWatts={currentLoad}
                maxWatts={inverterMax}
              />
          </div>

          {/* Row 5: Full Width Load Management */}
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