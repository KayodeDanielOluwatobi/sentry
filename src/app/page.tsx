"use client";

import { useState, useEffect } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";
import TopBar from "@/components/TopBar";
import SystemInsight from "@/components/SystemInsight";
import BatteryPercentage from "@/components/BatteryPercentage";
import ActivityFeed, { ActivityEvent } from "@/components/ActivityFeed";

import { NavItem } from "@/components/PillNav";
import MobileNav from "@/components/MobileNav";
import CellVoltages from "@/components/CellVoltages";
import SmartEnergyManager, { ManagedLoad } from "@/components/SmartEnergyManager";
import TemperaturesList from "@/components/TemperaturesList";
import ActiveAlarms from "@/components/ActiveAlarms";
import CycleCount from "@/components/CycleCount";

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isCharging, setIsCharging] = useState<boolean | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<NavItem>("Battery");

  // Real-time telemetry state variables (initially undefined for split-second loading)
  const [soc, setSoc] = useState<number | undefined>(undefined);
  const [currentLoad, setCurrentLoad] = useState<number | undefined>(undefined);
  const [cellVoltages, setCellVoltages] = useState<number[] | undefined>(undefined);
  const [cycleCount, setCycleCount] = useState<number | undefined>(undefined);
  const [voltage, setVoltage] = useState<number | undefined>(undefined);
  const [current, setCurrent] = useState<number | undefined>(undefined);
  const [power, setPower] = useState<number | undefined>(undefined);
  const [remainingCapacity, setRemainingCapacity] = useState<number | undefined>(undefined);
  const [fullCapacity, setFullCapacity] = useState<number | undefined>(undefined);
  const [soh, setSoh] = useState<number | undefined>(undefined);
  const [temperatures, setTemperatures] = useState<any[] | undefined>(undefined);

  // Connection and signal strength states
  const [wifiRssi, setWifiRssi] = useState<number | undefined>(undefined);
  const [bleRssi, setBleRssi] = useState<number | undefined>(undefined);
  const [wifiConnected, setWifiConnected] = useState<boolean | undefined>(undefined);
  const [bleConnected, setBleConnected] = useState<boolean | undefined>(undefined);
  const [hasBmsError, setHasBmsError] = useState(false);
  const [lastFirebaseUpdate, setLastFirebaseUpdate] = useState<number | undefined>(undefined);

  const [events, setEvents] = useState<ActivityEvent[]>([
    {
      id: "evt_101",
      type: "load_shed",
      severity: "warning",
      title: "Battery preservation activated",
      message: "Non-essential load was disconnected after SOC fell below 60%.",
      timestamp: new Date(Date.now() - 120 * 1000), // 2 min ago
      badge: "Automatic",
      runtimeGain: "+1h 18m",
      level: "non-essential"
    },
    {
      id: "evt_102",
      type: "load_restore",
      severity: "success",
      title: "Non-essential load restored",
      message: "Non-essential load was restored after SOC rose above 65%.",
      timestamp: new Date(Date.now() - 1080 * 1000), // 18 min ago
      badge: "Recovered",
      level: "non-essential"
    },
    {
      id: "evt_103",
      type: "wifi_restored",
      severity: "success",
      title: "WiFi network reconnected",
      message: "ESP32 wireless network connection established.",
      timestamp: new Date(Date.now() - 3600 * 1000), // 1 hour ago
      badge: "Recovered"
    },
    {
      id: "evt_104",
      type: "cell_imbalance",
      severity: "warning",
      title: "Cell imbalance detected",
      message: "Voltage delta exceeded 15mV threshold.",
      timestamp: new Date(Date.now() - 7200 * 1000), // 2 hours ago
      badge: "Automatic"
    }
  ]);

  // Load manager states
  const [managerMode, setManagerMode] = useState<"auto" | "manual">("auto");
  const [managerLoads, setManagerLoads] = useState<ManagedLoad[]>([
    { id: "1", name: "Router/WiFi/Laptops", level: "critical", status: "active", isOn: true, icons: ["router", "wifi", "laptop"] },
    { id: "2", name: "Fans/AC/Refrigerator", level: "major", status: "active", isOn: true, icons: ["fan", "fridge"] },
    { id: "3", name: "TV/Lights", level: "non-essential", status: "shed", isOn: false, icons: ["tv", "bulb"] },
  ]);

  // Firebase Realtime Database Real-Time Telemetry Subscription
  useEffect(() => {
    let hasLoadedFirebase = false;

    // Split-second loading timeout (800ms) to display JSON defaults if Firebase hasn't resolved
    const fallbackTimeout = setTimeout(() => {
      if (!hasLoadedFirebase) {
        console.log("Firebase did not resolve in 800ms. Applying default JSON telemetry.");
        setIsCharging(false); // chargeState: "Idle"
        setSoc(60);
        setCurrentLoad(0); // dischargingPower: 0
        setCellVoltages([3.186, 3.186, 3.185, 3.185]);
        setCycleCount(0);
        setVoltage(12.743);
        setCurrent(0);
        setPower(0);
        setRemainingCapacity(59.66);
        setFullCapacity(100);
        setSoh(100);
        setTemperatures([
          { id: "temp1", name: "Battery temperature 1", value: 25.7 },
          { id: "temp2", name: "Battery temperature 2", value: 25.7 },
          { id: "mosfet", name: "MOSFET", value: 26.9 },
        ]);
        setWifiConnected(true);
        setWifiRssi(-41);
        setBleConnected(true);
        setBleRssi(0);
        setLastFirebaseUpdate(Date.now());
      }
    }, 800);

    if (!db) {
      console.warn("Firebase Database is not initialized. Sentry telemetry will run in simulated fallback mode.");
      return () => clearTimeout(fallbackTimeout);
    }

    const rootRef = ref(db, "/");
    const unsubscribe = onValue(rootRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      hasLoadedFirebase = true;
      clearTimeout(fallbackTimeout);
      setLastFirebaseUpdate(Date.now());

      // 1. Battery Telemetry parsing
      if (data.battery) {
        const { live, cellVoltages: cv, connectivity, statistics, temperatures: temps, errors } = data.battery;

        if (live) {
          if (live.soc !== undefined) setSoc(live.soc);
          if (live.chargeState !== undefined) {
            setIsCharging(live.chargeState === "Charging");
          }
          if (live.dischargingPower !== undefined) {
            // Prefer dischargingPower, fall back to absolute net power
            setCurrentLoad(live.dischargingPower > 0 ? live.dischargingPower : Math.abs(live.power ?? 0));
          } else if (live.power !== undefined) {
            setCurrentLoad(Math.abs(live.power));
          }
          if (live.voltage !== undefined) setVoltage(live.voltage);
          if (live.current !== undefined) setCurrent(live.current);
          if (live.power !== undefined) setPower(live.power);
          if (live.remainingCapacity !== undefined) setRemainingCapacity(live.remainingCapacity);
          if (live.fullCapacity !== undefined) setFullCapacity(live.fullCapacity);
          if (live.soh !== undefined) setSoh(live.soh);
        }

        if (cv) {
          setCellVoltages([
            cv.cell1 ?? 3.186,
            cv.cell2 ?? 3.186,
            cv.cell3 ?? 3.185,
            cv.cell4 ?? 3.185,
          ]);
        }

        if (statistics) {
          if (statistics.cycleCount !== undefined) {
            setCycleCount(statistics.cycleCount);
          }
        }

        if (temps) {
          setTemperatures([
            { id: "temp1", name: "Battery temperature 1", value: temps.temp1 ?? 25.7 },
            { id: "temp2", name: "Battery temperature 2", value: temps.temp2 ?? 25.7 },
            { id: "mosfet", name: "MOSFET", value: temps.mos ?? 26.9 },
          ]);
        }

        if (connectivity) {
          setWifiRssi(connectivity.wifiRSSI);
          setBleRssi(connectivity.bleRSSI);
          setWifiConnected(connectivity.wifiConnected);
          setBleConnected(connectivity.bleConnected);
        }

        if (errors) {
          setHasBmsError(!!errors.hasError);
        }
      }

      // 2. Load Manager State parsing
      if (data.loadManager) {
        const lm = data.loadManager;
        if (lm.mode !== undefined) {
          setManagerMode(lm.mode === "AUTO" ? "auto" : "manual");
        }
        setManagerLoads([
          { id: "1", name: "Router/WiFi/Laptops", level: "critical", status: lm.load1 ? "active" : "shed", isOn: !!lm.load1, icons: ["router", "wifi", "laptop"] },
          { id: "2", name: "Fans/AC/Refrigerator", level: "major", status: lm.load2 ? "active" : "shed", isOn: !!lm.load2, icons: ["fan", "fridge"] },
          { id: "3", name: "TV/Lights", level: "non-essential", status: lm.load3 ? "active" : "shed", isOn: !!lm.load3, icons: ["tv", "bulb"] },
        ]);
      }
    });

    return () => {
      clearTimeout(fallbackTimeout);
      unsubscribe();
    };
  }, []);

  // Write handlers - structured and commented out per user request for future implementation
  const handleLoadsChange = (updatedLoads: ManagedLoad[]) => {
    // Optimistically update frontend UI state
    setManagerLoads(updatedLoads);

    /*
    // To enable writing relay switches back to Firebase, uncomment the following block:
    const loadUpdates = {
      "load1": updatedLoads.find(l => l.id === "1")?.isOn ?? true,
      "load2": updatedLoads.find(l => l.id === "2")?.isOn ?? true,
      "load3": updatedLoads.find(l => l.id === "3")?.isOn ?? false,
    };
    update(ref(db, "/loadManager"), loadUpdates)
      .catch(err => console.error("Error writing load state to Firebase:", err));
    */
  };

  const handleModeChange = (newMode: "auto" | "manual") => {
    // Optimistically update frontend UI state
    setManagerMode(newMode);

    /*
    // To enable writing mode switch back to Firebase, uncomment the following block:
    const firebaseMode = newMode === "auto" ? "AUTO" : "NORMAL";
    update(ref(db, "/loadManager"), { mode: firebaseMode })
      .catch(err => console.error("Error writing mode state to Firebase:", err));
    */
  };

  const temperature = temperatures?.find(t => t.id === "temp1")?.value;
  const isDark = theme === "dark";

  const cellDeltaVal = cellVoltages !== undefined && cellVoltages.length > 0
    ? Math.round((Math.max(...cellVoltages) - Math.min(...cellVoltages)) * 1000)
    : 0;

  const activeAlarmsCount = 
    ((temperature !== undefined && temperature > 45) ? 1 : 0) + 
    (cellDeltaVal > 15 ? 1 : 0) + 
    (hasBmsError ? 1 : 0) +
    ((soc !== undefined && soc < 10) ? 1 : 0);

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
      <div style={{ width: "100%", maxWidth: "1310px" }}>

        {/* ── Top Bar ── */}
        <div style={{ marginBottom: "0.75rem" }}>
          <TopBar
            theme={theme}
            soc={soc}
            isCharging={isCharging}
            temperature={temperature}
            currentLoad={currentLoad}
            cellVoltages={cellVoltages}
            managerMode={managerMode}
            managerLoads={managerLoads}
            activeAlarmsCount={activeAlarmsCount}
            onThemeToggle={() => setTheme(isDark ? "light" : "dark")}
            onMenuClick={() => console.log("Menu clicked")}
            events={events}
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
          {/* Row 1: System Insight (Persistent Header - Full Width across all tabs) */}
          <div style={{ gridColumn: "span 3" }}>
            <SystemInsight
              theme={theme}
              soc={soc}
              isCharging={isCharging}
              temperature={temperature}
              currentLoad={currentLoad}
              cellVoltages={cellVoltages}
              withShadow={false}
              managerMode={managerMode}
              managerLoads={managerLoads}
              activeAlarmsCount={activeAlarmsCount}
              wifiRssi={wifiRssi}
              bleRssi={bleRssi}
              wifiConnected={wifiConnected}
              bleConnected={bleConnected}
              lastFirebaseUpdate={lastFirebaseUpdate}
            />
          </div>

          {activeTab === "Battery" && (
            <>
              {/* Row 2: Battery Percentage (Full Width) */}
              <div style={{ gridColumn: "span 3" }}>
                <BatteryPercentage
                  theme={theme}
                  isCharging={isCharging}
                  withShadow={false}
                  soc={soc}
                  temperature={temperature}
                  voltage={voltage}
                  current={current}
                  power={power}
                  remainingCapacity={remainingCapacity}
                  fullCapacity={fullCapacity}
                  soh={soh}
                />
              </div>

              {/* Row 3: Cell Voltages (Full Width) */}
              <div style={{ gridColumn: "span 3" }}>
                <CellVoltages
                  theme={theme}
                  voltages={cellVoltages}
                  withShadow={false}
                  delta={cellVoltages !== undefined && cellVoltages.length > 0 ? cellDeltaVal / 1000 : undefined}
                />
              </div>

              {/* Row 4: Temperatures (Left half) + Alarms & Cycle Count stacked (Right half) */}
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
                    sensors={temperatures}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", justifyContent: "space-between", height: "100%" }}>
                  <ActiveAlarms
                    theme={theme}
                    activeCount={activeAlarmsCount}
                    style={{ flex: 1, height: "100%" }}
                  />
                  <CycleCount
                    theme={theme}
                    cycleCount={cycleCount}
                    style={{ flex: 1, height: "100%" }}
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === "Energy" && (
            /* Smart Energy Manager — moved to the Energy tab */
            <div style={{ gridColumn: "span 3" }}>
              <SmartEnergyManager
                theme={theme}
                loads={managerLoads}
                mode={managerMode}
                onLoadsChange={handleLoadsChange}
                onModeChange={handleModeChange}
              />
            </div>
          )}

          {activeTab === "Diagnostics" && (
            /* Activity Feed — moved to Diagnostics tab! */
            <div style={{ gridColumn: "span 3" }}>
              <ActivityFeed
                theme={theme}
                soc={soc}
                isCharging={isCharging}
                temperature={temperature}
                currentLoad={currentLoad}
                cellVoltages={cellVoltages}
                managerMode={managerMode}
                managerLoads={managerLoads}
                events={events}
                onEventsChange={setEvents}
              />
            </div>
          )}

          {activeTab === "Profile" && (
            <div style={{ gridColumn: "span 3", padding: "3rem 1.5rem", textAlign: "center", color: isDark ? "#888" : "#555" }}>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", fontWeight: 600 }}>Profile</h3>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>System settings, user preferences, and notification configurations.</p>
            </div>
          )}
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