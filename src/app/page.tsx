"use client";

import { useState, useEffect, useRef } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/TopBar";
import SystemInsight from "@/components/SystemInsight";
import BatteryPercentage from "@/components/BatteryPercentage";
import ActivityFeed, { ActivityEvent } from "@/components/ActivityFeed";
import AuthGuard, { useAuthUser } from "@/components/AuthGuard";

import { NavItem } from "@/components/PillNav";
import MobileNav from "@/components/MobileNav";
import CellVoltages from "@/components/CellVoltages";
import SmartEnergyManager, { ManagedLoad } from "@/components/SmartEnergyManager";
import EnergyFlowCard from "@/components/EnergyFlowCard";
import SystemPredictionCard from "@/components/SystemPredictionCard";
import TemperaturesList from "@/components/TemperaturesList";
import ActiveAlarms from "@/components/ActiveAlarms";
import CycleCount from "@/components/CycleCount";
import ProfileTab from "@/components/ProfileTab";
import SentryLineChart from "@/components/SentryLineChart";
import { ThirdBracketSquareIcon, Csv01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, AnimatePresence } from "framer-motion";

function HomeInner() {
  const authUser = useAuthUser();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isCharging, setIsCharging] = useState<boolean | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<NavItem>("Battery");

  // Read persisted active tab after client-side hydration to avoid Next.js HTML mismatch warnings
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("sentry_active_tab");
      if (cached) {
        setActiveTab(cached as NavItem);
      }
    }
  }, []);

  const handleTabChange = (tab: NavItem) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem("sentry_active_tab", tab);
    }
  };

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
  const [bmsErrorsBitmask, setBmsErrorsBitmask] = useState<number>(0);
  const [lastFirebaseUpdate, setLastFirebaseUpdate] = useState<number | undefined>(undefined);

  const [wireResistances, setWireResistances] = useState<number[]>([1.2, 1.5, 1.1, 1.4]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [notifications, setNotifications] = useState<ActivityEvent[]>([]);
  const hasInitializedEventsRef = useRef(false);
  const hasLoadedLoadManagerRef = useRef(false);
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");
  const [activeHistoryModal, setActiveHistoryModal] = useState<"voltage" | "current" | "power" | "temperature" | "cell-voltages" | null>(null);
  const [tempChartMode, setTempChartMode] = useState<"avg" | "all">("avg");
  const [cellChartMode, setCellChartMode] = useState<"all" | "c1" | "c2" | "c3" | "c4">("all");
  const [historyTimeScale, setHistoryTimeScale] = useState<"hours" | "days">("hours");
  const [isSystemOnline, setIsSystemOnline] = useState<boolean | undefined>(undefined);

  const [historyRecords, setHistoryRecords] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("sentry_telemetry_history");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.error("Failed to parse cached history:", e);
        }
      }
    }

    // Seed with realistic base data going back 22 hours representing real absolute timestamps
    const now = Date.now();
    return Array.from({ length: 12 }).map((_, idx) => {
      const offsetMs = (11 - idx) * 2 * 3600 * 1000;
      const t = now - offsetMs;
      const variation = Math.sin(idx) * 0.3;
      return {
        timestamp: t,
        voltage: parseFloat((12.74 + variation).toFixed(2)),
        current: parseFloat(Math.max(0, 2.5 + Math.cos(idx) * 1.5).toFixed(2)),
        power: Math.round(Math.max(0, 130 + Math.sin(idx) * 80)),
        temperatures: [
          parseFloat((25.7 + Math.sin(idx) * 1.2).toFixed(1)),
          parseFloat((25.7 + Math.cos(idx) * 0.9).toFixed(1)),
          parseFloat((26.9 + Math.sin(idx + 1) * 1.5).toFixed(1))
        ],
        cellVoltages: [3.186, 3.186, 3.185, 3.185].map((v, cIdx) =>
          parseFloat((v + Math.sin(idx + cIdx) * 0.006).toFixed(3))
        ),
        isOffline: false
      };
    });
  });

  const prevSystemOnlineRef = useRef<boolean | undefined>(undefined);
  const hasSeededInitialConnectionRef = useRef(false);

  // Unified Connection Event Manager: handles initial seed + live runtime transitions
  useEffect(() => {
    const initTimer = setTimeout(() => {
      if (!hasSeededInitialConnectionRef.current) {
        hasSeededInitialConnectionRef.current = true;
        const systemOnline = isSystemOnline === true;
        prevSystemOnlineRef.current = systemOnline;

        if (systemOnline) {
          const evtJkBms: ActivityEvent = {
            id: "evt_init_3",
            type: "cell_imbalance",
            severity: "success",
            title: "JK BMS BLE Connection Active",
            message: "Gateway link configured at 115200 bps.",
            timestamp: new Date(Date.now() - 2000),
            badge: "Hardware"
          };

          const evtGateway: ActivityEvent = {
            id: "evt_init_1",
            type: "wifi_restored",
            severity: "success",
            title: "Sentry Gateway Online",
            message: "ESP32 telemetry interface successfully initialized.",
            timestamp: new Date(Date.now() - 1000),
            badge: "System"
          };

          const evtFirebase: ActivityEvent = {
            id: "evt_init_2",
            type: "wifi_restored",
            severity: "success",
            title: "Firebase Sync Connected",
            message: "Established live synchronization stream with Realtime Database.",
            timestamp: new Date(),
            badge: "Network"
          };

          // 1. Add JK BMS (Hardware)
          setEvents(prev => [evtJkBms, ...prev.filter(e => e.id !== evtJkBms.id)]);
          setNotifications(prev => [evtJkBms, ...prev.filter(e => e.id !== evtJkBms.id)]);

          // 2. Add Sentry Gateway 400ms later
          setTimeout(() => {
            setEvents(prev => [evtGateway, ...prev.filter(e => e.id !== evtGateway.id)]);
            setNotifications(prev => [evtGateway, ...prev.filter(e => e.id !== evtGateway.id)]);
          }, 400);

          // 3. Add Firebase Sync 800ms later
          setTimeout(() => {
            setEvents(prev => [evtFirebase, ...prev.filter(e => e.id !== evtFirebase.id)]);
            setNotifications(prev => [evtFirebase, ...prev.filter(e => e.id !== evtFirebase.id)]);
          }, 800);

        } else {
          const evtGatewayOffline: ActivityEvent = {
            id: "evt_init_offline_1",
            type: "wifi_lost",
            severity: "critical",
            title: "Sentry Gateway Offline",
            message: "ESP32 telemetry link is inactive. Check device power.",
            timestamp: new Date(Date.now() - 1000),
            badge: "System"
          };

          const evtBmsOffline: ActivityEvent = {
            id: "evt_init_offline_2",
            type: "cell_imbalance",
            severity: "warning",
            title: "BMS BLE Link Lost",
            message: "Bluetooth connection to JK BMS failed to establish.",
            timestamp: new Date(),
            badge: "Hardware"
          };

          // 1. Add Sentry Gateway Offline first
          setEvents(prev => [evtGatewayOffline, ...prev.filter(e => e.id !== evtGatewayOffline.id)]);
          setNotifications(prev => [evtGatewayOffline, ...prev.filter(e => e.id !== evtGatewayOffline.id)]);

          // 2. Add BMS Link Lost 400ms later
          setTimeout(() => {
            setEvents(prev => [evtBmsOffline, ...prev.filter(e => e.id !== evtBmsOffline.id)]);
            setNotifications(prev => [evtBmsOffline, ...prev.filter(e => e.id !== evtBmsOffline.id)]);
          }, 400);
        }
      } else {
        // Handle runtime live online/offline state transitions
        if (isSystemOnline !== undefined && prevSystemOnlineRef.current !== isSystemOnline) {
          prevSystemOnlineRef.current = isSystemOnline;

          if (isSystemOnline) {
            const evtJkBms: ActivityEvent = {
              id: `evt_trans_online_3_${Date.now()}`,
              type: "cell_imbalance",
              severity: "success",
              title: "JK BMS BLE Connection Active",
              message: "Gateway link configured at 115200 bps.",
              timestamp: new Date(),
              badge: "Hardware"
            };
            const evtGateway: ActivityEvent = {
              id: `evt_trans_online_1_${Date.now()}`,
              type: "wifi_restored",
              severity: "success",
              title: "Sentry Gateway Online",
              message: "ESP32 telemetry interface successfully initialized.",
              timestamp: new Date(),
              badge: "System"
            };
            const evtFirebase: ActivityEvent = {
              id: `evt_trans_online_2_${Date.now()}`,
              type: "wifi_restored",
              severity: "success",
              title: "Firebase Sync Connected",
              message: "Established live synchronization stream with Realtime Database.",
              timestamp: new Date(),
              badge: "Network"
            };

            setEvents(prev => [evtJkBms, ...prev]);
            setNotifications(prev => [evtJkBms, ...prev]);

            setTimeout(() => {
              setEvents(prev => [evtGateway, ...prev]);
              setNotifications(prev => [evtGateway, ...prev]);
            }, 400);

            setTimeout(() => {
              setEvents(prev => [evtFirebase, ...prev]);
              setNotifications(prev => [evtFirebase, ...prev]);
            }, 800);
          } else {
            const evtGatewayOffline: ActivityEvent = {
              id: `evt_trans_offline_1_${Date.now()}`,
              type: "wifi_lost",
              severity: "critical",
              title: "Sentry Gateway Offline",
              message: "ESP32 telemetry link is inactive. Check device power.",
              timestamp: new Date(),
              badge: "System"
            };
            const evtBmsOffline: ActivityEvent = {
              id: `evt_trans_offline_2_${Date.now()}`,
              type: "cell_imbalance",
              severity: "warning",
              title: "BMS BLE Link Lost",
              message: "Bluetooth connection to JK BMS failed to establish.",
              timestamp: new Date(),
              badge: "Hardware"
            };

            setEvents(prev => [evtGatewayOffline, ...prev]);
            setNotifications(prev => [evtGatewayOffline, ...prev]);

            setTimeout(() => {
              setEvents(prev => [evtBmsOffline, ...prev]);
              setNotifications(prev => [evtBmsOffline, ...prev]);
            }, 400);
          }
        }
      }
    }, 1200);

    return () => clearTimeout(initTimer);
  }, [isSystemOnline]);

  // Periodic background online/offline watchdog: constantly checks if telemetry stream has stalled (> 30s)
  useEffect(() => {
    const watchdog = setInterval(() => {
      if (lastFirebaseUpdate !== undefined) {
        const isOnline = (Date.now() - lastFirebaseUpdate) <= 30000;
        setIsSystemOnline(prev => {
          if (prev !== isOnline) return isOnline;
          return prev;
        });
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(watchdog);
  }, [lastFirebaseUpdate]);

  const prevLastUpdateRef = useRef<number | undefined>(undefined);

  // Helper to retrieve actual live historical records from state downsampled for graph points
  const generateHistoryData = (
    metric: "voltage" | "current" | "power" | "temperature" | "cell-voltages" | null,
    scale: "hours" | "days",
    liveValue?: number,
    liveArray?: number[]
  ) => {
    if (!metric) return [];

    const now = Date.now();
    const rangeMs = scale === "hours" ? 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000;

    // Filter records within the time window
    const filtered = historyRecords.filter(r => now - r.timestamp <= rangeMs);

    const pointsCount = scale === "hours" ? 12 : 7;

    // Fallback if we have fewer records than the requested points count
    if (filtered.length === 0) return [];

    let rawPoints = filtered;
    if (filtered.length > pointsCount) {
      // Downsample evenly
      const step = (filtered.length - 1) / (pointsCount - 1);
      rawPoints = Array.from({ length: pointsCount }).map((_, idx) => {
        return filtered[Math.round(idx * step)];
      });
    }

    return rawPoints.map(r => {
      // Generate clean absolute ISO style timestamps or local times instead of mock offsets
      const dateObj = new Date(r.timestamp);
      const label = scale === "hours"
        ? dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : dateObj.toLocaleDateString([], { month: "short", day: "numeric" });

      let values: number[] = [];
      if (metric === "voltage") {
        values = [r.voltage];
      } else if (metric === "current") {
        values = [r.current];
      } else if (metric === "power") {
        values = [r.power];
      } else if (metric === "temperature") {
        let rawVals = r.temperatures;
        if (tempChartMode === "avg") {
          const avg = r.temperatures.reduce((a: number, b: number) => a + b, 0) / r.temperatures.length;
          rawVals = [parseFloat(avg.toFixed(1))];
        }
        values = tempUnit === "F"
          ? rawVals.map((v: number) => parseFloat((v * 1.8 + 32).toFixed(1)))
          : rawVals;
      } else if (metric === "cell-voltages") {
        if (cellChartMode === "c1") {
          values = [r.cellVoltages[0]];
        } else if (cellChartMode === "c2") {
          values = [r.cellVoltages[1]];
        } else if (cellChartMode === "c3") {
          values = [r.cellVoltages[2]];
        } else if (cellChartMode === "c4") {
          values = [r.cellVoltages[3]];
        } else {
          values = r.cellVoltages;
        }
      }

      return {
        label,
        timestamp: r.timestamp,
        values,
        isOffline: r.isOffline
      };
    });
  };

  const downloadCSV = (metric: "voltage" | "current" | "power" | "temperature" | "cell-voltages" | null, scale: "hours" | "days", liveValue?: number, liveArray?: number[]) => {
    if (!metric) return;
    const data = generateHistoryData(metric, scale, liveValue, liveArray);
    let csvContent = "data:text/csv;charset=utf-8,";

    if (metric === "temperature") {
      const unitLabel = tempUnit === "F" ? "F" : "C";
      csvContent += `Timestamp,Time,Temp 1 (${unitLabel}),Temp 2 (${unitLabel}),MOSFET (${unitLabel}),Average (${unitLabel})\n`;
      data.forEach(d => {
        const avg = parseFloat((d.values.reduce((a: number, b: number) => a + b, 0) / d.values.length).toFixed(1));
        const isoString = new Date(d.timestamp || Date.now()).toISOString();
        csvContent += `"${isoString}",${d.label},${d.values[0]},${d.values[1] !== undefined ? d.values[1] : ""},${d.values[2] !== undefined ? d.values[2] : ""},${avg}\n`;
      });
    } else if (metric === "cell-voltages") {
      csvContent += "Timestamp,Time,Cell 1 (V),Cell 2 (V),Cell 3 (V),Cell 4 (V)\n";
      data.forEach(d => {
        const isoString = new Date(d.timestamp || Date.now()).toISOString();
        csvContent += `"${isoString}",${d.label},${d.values[0]},${d.values[1]},${d.values[2]},${d.values[3]}\n`;
      });
    } else {
      const labelName = metric.charAt(0).toUpperCase() + metric.slice(1);
      csvContent += `Timestamp,Time,${labelName}\n`;
      data.forEach(d => {
        const isoString = new Date(d.timestamp || Date.now()).toISOString();
        csvContent += `"${isoString}",${d.label},${d.values[0]}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sentry_${metric}_history_${scale}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = (metric: "voltage" | "current" | "power" | "temperature" | "cell-voltages" | null, scale: "hours" | "days", liveValue?: number, liveArray?: number[]) => {
    if (!metric) return;
    const data = generateHistoryData(metric, scale, liveValue, liveArray);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `sentry_${metric}_history_${scale}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Register PWA service worker on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("Service Worker registered successfully:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }
  }, []);

  // Load manager states
  const [managerMode, setManagerMode] = useState<"auto" | "manual">(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("sentry_manual_mode");
      if (cached) return cached as "auto" | "manual";
    }
    return "auto";
  });
  const [managerLoads, setManagerLoads] = useState<ManagedLoad[]>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("sentry_manual_loads");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length === 3) {
            if (parsed[0]) {
              parsed[0].name = "Router/CCTV/Laptops";
              parsed[0].icons = ["router", "cctv", "laptop"];
            }
            return parsed;
          }
        } catch (e) {
          console.error("Failed to parse cached manual loads:", e);
        }
      }
    }
    return [
      { id: "1", name: "Router/CCTV/Laptops", level: "critical", status: "active", isOn: true, icons: ["router", "cctv", "laptop"] },
      { id: "2", name: "Fans/AC/Refrigerator", level: "major", status: "active", isOn: true, icons: ["fan", "fridge"] },
      { id: "3", name: "TV/Lights", level: "non-essential", status: "shed", isOn: false, icons: ["tv", "bulb"] },
    ];
  });

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

        setIsSystemOnline(false);
      }
    }, 800);

    let mockInterval: NodeJS.Timeout | undefined;
    if (!db) {
      console.warn("Firebase Database is not initialized. Sentry telemetry will run in simulated fallback mode.");
      // In mock mode, simulate periodic telemetry updates
      mockInterval = setInterval(() => {
        setLastFirebaseUpdate(Date.now());
      }, 8000);
      return () => {
        clearTimeout(fallbackTimeout);
        if (mockInterval) clearInterval(mockInterval);
      };
    }

    const rootRef = ref(db, "/");
    const unsubscribe = onValue(rootRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      hasLoadedFirebase = true;
      clearTimeout(fallbackTimeout);

      // Only reset the "Last updated" clock if the ESP32 lastUpdate field actually changed
      let localLastUpdate = Date.now();
      if (data.battery && data.battery.connectivity) {
        const currentLastUpdate = data.battery.connectivity.lastUpdate;

        // Cache this timestamp locally to persist the offline timer across page refreshes
        const cachedBmsVal = typeof window !== "undefined" ? localStorage.getItem("lastUpdateBmsVal") : null;
        const cachedTimestamp = typeof window !== "undefined" ? localStorage.getItem("lastFirebaseUpdateTimestamp") : null;

        if (cachedBmsVal && cachedTimestamp && currentLastUpdate.toString() === cachedBmsVal) {
          // No new telemetry was sent by the ESP32; retrieve the cached packet receipt time
          localLastUpdate = parseInt(cachedTimestamp, 10);
          setLastFirebaseUpdate(localLastUpdate);
          prevLastUpdateRef.current = currentLastUpdate;
        } else if (currentLastUpdate !== prevLastUpdateRef.current) {
          // Fresh telemetry packet received! Record and update cache.
          const now = Date.now();
          localLastUpdate = now;
          setLastFirebaseUpdate(now);
          prevLastUpdateRef.current = currentLastUpdate;
          if (typeof window !== "undefined") {
            localStorage.setItem("lastUpdateBmsVal", currentLastUpdate.toString());
            localStorage.setItem("lastFirebaseUpdateTimestamp", now.toString());
          }
        }
      } else {
        setLastFirebaseUpdate(localLastUpdate);
      }

      // Determine true system online status dynamically using localLastUpdate to bypass React state sync latency
      const systemOnline = (Date.now() - localLastUpdate) <= 30000;
      setIsSystemOnline(systemOnline);

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

        // Parse accurate wire resistances from Firebase RTDB if available
        if (data.battery.wireResistances) {
          const wr = data.battery.wireResistances;
          setWireResistances([
            wr.cell1 ?? wr.res1 ?? 1.2,
            wr.cell2 ?? wr.res2 ?? 1.5,
            wr.cell3 ?? wr.res3 ?? 1.1,
            wr.cell4 ?? wr.res4 ?? 1.4,
          ]);
        } else if (data.battery.cellResistances) {
          const cr = data.battery.cellResistances;
          setWireResistances([
            cr.cell1 ?? cr.res1 ?? 1.2,
            cr.cell2 ?? cr.res2 ?? 1.5,
            cr.cell3 ?? cr.res3 ?? 1.1,
            cr.cell4 ?? cr.res4 ?? 1.4,
          ]);
        } else if (cv) {
          const r1 = cv.cell1Res ?? cv.res1 ?? cv.cell1_res ?? 1.2;
          const r2 = cv.cell2Res ?? cv.res2 ?? cv.cell2_res ?? 1.5;
          const r3 = cv.cell3Res ?? cv.res3 ?? cv.cell3_res ?? 1.1;
          const r4 = cv.cell4Res ?? cv.res4 ?? cv.cell4_res ?? 1.4;
          setWireResistances([r1, r2, r3, r4]);
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
          setBmsErrorsBitmask(errors.raw ?? 0);
        }
      }

      // 2. Load Manager State parsing (Initialize from database only if user hasn't set local manual choices)
      if (data.loadManager && !hasLoadedLoadManagerRef.current) {
        const lm = data.loadManager;
        hasLoadedLoadManagerRef.current = true;
        const hasCached = typeof window !== "undefined" && localStorage.getItem("sentry_manual_loads");
        if (!hasCached) {
          const fetchedLoads: ManagedLoad[] = [
            { id: "1", name: "Router/WiFi/Laptops", level: "critical", status: lm.load1 ? "active" : "shed", isOn: !!lm.load1, icons: ["router", "wifi", "laptop"] },
            { id: "2", name: "Fans/AC/Refrigerator", level: "major", status: lm.load2 ? "active" : "shed", isOn: !!lm.load2, icons: ["fan", "fridge"] },
            { id: "3", name: "TV/Lights", level: "non-essential", status: lm.load3 ? "active" : "shed", isOn: !!lm.load3, icons: ["tv", "bulb"] },
          ];
          setManagerLoads(fetchedLoads);
          if (typeof window !== "undefined") {
            localStorage.setItem("sentry_manual_loads", JSON.stringify(fetchedLoads));
          }
        }
      }
    });

    return () => {
      clearTimeout(fallbackTimeout);
      unsubscribe();
    };
  }, []);

  // Synchronize database updates to local storage records history
  useEffect(() => {
    if (lastFirebaseUpdate === undefined) return;

    const rawVoltage = voltage !== undefined ? parseFloat(voltage.toFixed(2)) : 12.74;
    const rawCurrent = current !== undefined ? parseFloat(current.toFixed(2)) : 0.0;
    const rawPower = power !== undefined ? Math.round(power) : 0;
    const rawTemps = temperatures && temperatures.length === 3
      ? temperatures.map(t => parseFloat(t.value.toFixed(1)))
      : [25.7, 25.7, 26.9];
    const rawCells = cellVoltages && cellVoltages.length === 4
      ? cellVoltages.map(v => parseFloat(v.toFixed(3)))
      : [3.186, 3.186, 3.185, 3.185];

    // Determine offline status
    const isSystemOffline = Date.now() - lastFirebaseUpdate > 30000;

    const newRecord = {
      timestamp: Date.now(),
      voltage: rawVoltage,
      current: rawCurrent,
      power: rawPower,
      temperatures: rawTemps,
      cellVoltages: rawCells,
      isOffline: isSystemOffline
    };

    setHistoryRecords(prev => {
      // Avoid writing too quickly (under 3 seconds interval) to save localStorage space
      if (prev.length > 0 && Date.now() - prev[prev.length - 1].timestamp < 3000) {
        return prev;
      }
      const next = [...prev, newRecord].slice(-350); // retain last 350 entries
      if (typeof window !== "undefined") {
        localStorage.setItem("sentry_telemetry_history", JSON.stringify(next));
      }
      return next;
    });
  }, [lastFirebaseUpdate, voltage, current, power, temperatures, cellVoltages]);

  // Write handlers - structured and commented out per user request for future implementation
  const handleLoadsChange = (updatedLoads: ManagedLoad[]) => {
    // Find what changed to append to Activity Feed
    updatedLoads.forEach(load => {
      const prev = managerLoads.find(l => l.id === load.id);
      if (prev && prev.isOn !== load.isOn) {
        const categoryName = load.level === "critical" ? "Critical" : load.level === "major" ? "Major" : "Non-essential";
        const newEvent: ActivityEvent = {
          id: `evt_load_${Date.now()}_${load.id}`,
          type: load.isOn ? "load_restore" : "load_shed",
          severity: load.isOn ? "success" : "warning",
          title: `${categoryName} load ${load.isOn ? "reconnected" : "disconnected"}`,
          message: `Relay control channel ${load.id} was switched ${load.isOn ? "ON" : "OFF"} by user.`,
          timestamp: new Date(),
          badge: "Manual",
          level: load.level
        };
        setEvents(prevEvts => [newEvent, ...prevEvts]);
        setNotifications(prevNotifs => [newEvent, ...prevNotifs]);
      }
    });

    setManagerLoads(updatedLoads);

    if (typeof window !== "undefined") {
      localStorage.setItem("sentry_manual_loads", JSON.stringify(updatedLoads));
    }

    if (db) {
      const loadUpdates = {
        "load1": updatedLoads.find(l => l.id === "1")?.isOn ? 1 : 0,
        "load2": updatedLoads.find(l => l.id === "2")?.isOn ? 1 : 0,
        "load3": updatedLoads.find(l => l.id === "3")?.isOn ? 1 : 0,
      };
      update(ref(db, "/loadManager"), loadUpdates)
        .catch(err => console.error("Error writing load state to Firebase:", err));
    }
  };

  const handleModeChange = (newMode: "auto" | "manual") => {
    if (newMode !== managerMode) {
      const newEvent: ActivityEvent = {
        id: `evt_mode_${Date.now()}`,
        type: "load_shed",
        severity: "info",
        title: `Load Manager: ${newMode.toUpperCase()} mode`,
        message: `Relay manager state machine was switched to ${newMode.toUpperCase()} control loops.`,
        timestamp: new Date(),
        badge: "System"
      };
      setEvents(prevEvts => [newEvent, ...prevEvts]);
      setNotifications(prevNotifs => [newEvent, ...prevNotifs]);
    }

    setManagerMode(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("sentry_manual_mode", newMode);
    }

    if (db) {
      const firebaseMode = newMode === "auto" ? "AUTO" : "NORMAL";
      update(ref(db, "/loadManager"), { mode: firebaseMode })
        .catch(err => console.error("Error writing mode state to Firebase:", err));
    }
  };

  const temperature = temperatures?.find(t => t.id === "temp1")?.value;
  const isDark = theme === "dark";
  const navGreen = isDark ? "#4ade80" : "#0d9b0d";

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
        background: isDark ? "#080808" : "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem 1rem clamp(4.5rem, 10vh, 6.2rem) 1rem",
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
            events={notifications}
            activeTab={activeTab}
            onClearNotifications={() => setNotifications([])}
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
                  onExpandClick={(metric) => setActiveHistoryModal(metric)}
                />
              </div>

              {/* Row 3: Cell Voltages (Full Width) */}
              <div style={{ gridColumn: "span 3" }}>
                <CellVoltages
                  theme={theme}
                  voltages={cellVoltages}
                  withShadow={false}
                  delta={cellVoltages !== undefined && cellVoltages.length > 0 ? cellDeltaVal / 1000 : undefined}
                  onExpandClick={() => setActiveHistoryModal("cell-voltages")}
                />
              </div>

              {/* Row 4: Temperatures (Left half) + Cycle Count (Right half) */}
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
                    onExpandClick={() => setActiveHistoryModal("temperature")}
                  />
                </div>
                <div style={{ display: "flex", width: "100%" }}>
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
            <>
              {/* Energy Flow Animation Card — Placed before Smart Energy Manager */}
              <div style={{ gridColumn: "span 3" }}>
                <EnergyFlowCard
                  theme={theme}
                  soc={soc ?? 89}
                  voltage={voltage ?? 12.74}
                  currentLoad={currentLoad ?? 450}
                  isCharging={isCharging ?? false}
                  batteryToInverterFlow={true}
                  inverterToLoadFlow={true}
                />
              </div>

              {/* Smart Energy Manager — moved to the Energy tab */}
              <div style={{ gridColumn: "span 3" }}>
                <SmartEnergyManager
                  theme={theme}
                  loads={managerLoads}
                  mode={managerMode}
                  onLoadsChange={handleLoadsChange}
                  onModeChange={handleModeChange}
                />
              </div>

              {/* System Prediction Card — Placed right under Smart Energy Manager */}
              <div style={{ gridColumn: "span 3" }}>
                <SystemPredictionCard
                  theme={theme}
                  soc={soc ?? 89}
                  voltage={voltage ?? 12.74}
                  power={currentLoad ?? 450}
                  isCharging={isCharging ?? false}
                  loads={managerLoads}
                  mode={managerMode}
                  historyRecords={historyRecords}
                />
              </div>
            </>
          )}

          {activeTab === "Diagnostics" && (
            <>
              {/* Active Alarms - Key Diagnostic Card at top */}
              <div style={{ gridColumn: "span 3" }}>
                <ActiveAlarms
                  theme={theme}
                  activeCount={activeAlarmsCount}
                  errorsBitmask={bmsErrorsBitmask}
                  soc={soc}
                  temperature={temperature}
                  cellDelta={cellVoltages !== undefined && cellVoltages.length > 0 ? cellDeltaVal : undefined}
                  style={{ width: "100%" }}
                />
              </div>

              {/* Activity Feed */}
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
            </>
          )}

          {activeTab === "Profile" && (
            <div style={{ gridColumn: "span 3", width: "100%" }}>
              <ProfileTab
                theme={theme}
                authUser={authUser}
                supabase={supabase}
              />
            </div>
          )}
        </div>

        {/* ── Mobile Nav Bar ── */}
        <MobileNav
          theme={theme}
          active={activeTab}
          onChange={setActiveTab}
        />

        {/* Floating Modals overlay */}
        <AnimatePresence>
          {activeHistoryModal !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                inset: 0,
                background: isDark ? "rgba(10, 10, 10, 0.35)" : "rgba(255, 255, 255, 0.35)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                zIndex: 100000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
              }}
              onClick={() => setActiveHistoryModal(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  background: isDark
                    ? "linear-gradient(135deg, #091a13 0%, #04140e 100%)"
                    : "linear-gradient(135deg, #ffffff 0%, #f4f7f6 100%)",
                  border: `1px solid ${isDark ? "rgba(16, 185, 129, 0.3)" : "rgba(0, 0, 0, 0.1)"}`,
                  borderRadius: "24px",
                  padding: "1.5rem",
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.2rem",
                  color: isDark ? "#ffffff" : "#111111",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                      {activeHistoryModal === "voltage" && "Pack Voltage History"}
                      {activeHistoryModal === "current" && "Current Draw History"}
                      {activeHistoryModal === "power" && "Power Draw History"}
                      {activeHistoryModal === "temperature" && "Temperatures History"}
                      {activeHistoryModal === "cell-voltages" && "Cell Voltages History"}
                    </h3>
                    <span style={{ fontSize: "0.75rem", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
                      Live Real-Time Telemetry Logs
                    </span>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setActiveHistoryModal(null)}
                    style={{
                      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                      border: "none",
                      color: isDark ? "#fff" : "#111",
                      borderRadius: "50%",
                      width: "30px",
                      height: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      fontWeight: 300,
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Switch Controls */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <button
                      onClick={() => setHistoryTimeScale("hours")}
                      style={{
                        padding: "0.3rem 0.8rem",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        borderRadius: "99px",
                        border: "none",
                        background: historyTimeScale === "hours" ? (isDark ? "#4ade80" : "#0d9b0d") : (isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"),
                        color: historyTimeScale === "hours" ? (isDark ? "#000000" : "#ffffff") : (isDark ? "#9ca3af" : "#4b5563"),
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Last 24 Hours
                    </button>
                    <button
                      onClick={() => setHistoryTimeScale("days")}
                      style={{
                        padding: "0.3rem 0.8rem",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        borderRadius: "99px",
                        border: "none",
                        background: historyTimeScale === "days" ? (isDark ? "#4ade80" : "#0d9b0d") : (isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"),
                        color: historyTimeScale === "days" ? (isDark ? "#000000" : "#ffffff") : (isDark ? "#9ca3af" : "#4b5563"),
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      Last 7 Days
                    </button>
                  </div>

                  {activeHistoryModal === "temperature" && (
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button
                          onClick={() => setTempChartMode("avg")}
                          style={{
                            padding: "0.3rem 0.8rem",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            borderRadius: "99px",
                            border: "none",
                            background: tempChartMode === "avg" ? (isDark ? "#4ade80" : "#0d9b0d") : (isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"),
                            color: tempChartMode === "avg" ? (isDark ? "#000000" : "#ffffff") : (isDark ? "#9ca3af" : "#4b5563"),
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          Average Temp
                        </button>
                        <button
                          onClick={() => setTempChartMode("all")}
                          style={{
                            padding: "0.3rem 0.8rem",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            borderRadius: "99px",
                            border: "none",
                            background: tempChartMode === "all" ? (isDark ? "#4ade80" : "#0d9b0d") : (isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"),
                            color: tempChartMode === "all" ? (isDark ? "#000000" : "#ffffff") : (isDark ? "#9ca3af" : "#4b5563"),
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          Individual Sensors
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button
                          onClick={() => setTempUnit("C")}
                          style={{
                            padding: "0.3rem 0.8rem",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            borderRadius: "99px",
                            border: "none",
                            background: tempUnit === "C" ? (isDark ? "#4ade80" : "#0d9b0d") : (isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"),
                            color: tempUnit === "C" ? (isDark ? "#000000" : "#ffffff") : (isDark ? "#9ca3af" : "#4b5563"),
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          °C
                        </button>
                        <button
                          onClick={() => setTempUnit("F")}
                          style={{
                            padding: "0.3rem 0.8rem",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            borderRadius: "99px",
                            border: "none",
                            background: tempUnit === "F" ? (isDark ? "#4ade80" : "#0d9b0d") : (isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"),
                            color: tempUnit === "F" ? (isDark ? "#000000" : "#ffffff") : (isDark ? "#9ca3af" : "#4b5563"),
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          °F
                        </button>
                      </div>
                    </div>
                  )}

                  {activeHistoryModal === "cell-voltages" && (
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {[
                        { id: "all", label: "All Cells" },
                        { id: "c1", label: "Cell 1" },
                        { id: "c2", label: "Cell 2" },
                        { id: "c3", label: "Cell 3" },
                        { id: "c4", label: "Cell 4" },
                      ].map(btn => (
                        <button
                          key={btn.id}
                          onClick={() => setCellChartMode(btn.id as any)}
                          style={{
                            padding: "0.3rem 0.8rem",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            borderRadius: "99px",
                            border: "none",
                            background: cellChartMode === btn.id ? (isDark ? "#4ade80" : "#0d9b0d") : (isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"),
                            color: cellChartMode === btn.id ? (isDark ? "#000000" : "#ffffff") : (isDark ? "#9ca3af" : "#4b5563"),
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Colored legends badge list for cell voltages modal */}
                  {activeHistoryModal === "cell-voltages" && (
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                      {[
                        { id: "c1", label: "C1", color: navGreen },
                        { id: "c2", label: "C2", color: "#3b82f6" },
                        { id: "c3", label: "C3", color: "#fbbf24" },
                        { id: "c4", label: "C4", color: "#ef4444" },
                      ].filter(item => cellChartMode === "all" || cellChartMode === item.id).map((item, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.color }} />
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: isDark ? "#d1d5db" : "#4b5563" }}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sentry SVG Line Chart wrapper */}
                <div
                  style={{
                    background: isDark ? "rgba(0,0,0,0.15)" : "#f9fafb",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.05)"}`,
                    borderRadius: "16px",
                    padding: "0.75rem",
                  }}
                >
                  <SentryLineChart
                    data={generateHistoryData(
                      activeHistoryModal,
                      historyTimeScale,
                      activeHistoryModal === "voltage" ? voltage : (activeHistoryModal === "current" ? current : (activeHistoryModal === "power" ? power : undefined)),
                      activeHistoryModal === "cell-voltages" ? cellVoltages : undefined
                    )}
                    lineColors={
                      activeHistoryModal === "temperature"
                        ? (tempChartMode === "avg" ? [navGreen] : [navGreen, "#3b82f6", "#ef4444"])
                        : (activeHistoryModal === "cell-voltages"
                          ? (cellChartMode === "all"
                            ? [navGreen, "#3b82f6", "#fbbf24", "#ef4444"]
                            : [cellChartMode === "c1" ? navGreen : (cellChartMode === "c2" ? "#3b82f6" : (cellChartMode === "c3" ? "#fbbf24" : "#ef4444"))])
                          : [navGreen])
                    }
                    labels={
                      activeHistoryModal === "temperature"
                        ? (tempChartMode === "avg" ? ["Average"] : ["Temp 1", "Temp 2", "MOSFET"])
                        : (activeHistoryModal === "cell-voltages"
                          ? (cellChartMode === "all"
                            ? ["Cell 1", "Cell 2", "Cell 3", "Cell 4"]
                            : [cellChartMode === "c1" ? "Cell 1" : (cellChartMode === "c2" ? "Cell 2" : (cellChartMode === "c3" ? "Cell 3" : "Cell 4"))])
                          : [activeHistoryModal ?? ""])
                    }
                    curved={true}
                    yMin={activeHistoryModal === "cell-voltages" ? 2.7 : undefined}
                    yMax={activeHistoryModal === "cell-voltages" ? 3.6 : undefined}
                    theme={theme}
                  />
                </div>

                {/* Extra Infographics / Stats details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {activeHistoryModal === "cell-voltages" && (
                    <>
                      <h4 style={{ margin: "0.2rem 0 0.1rem 0", fontSize: "0.82rem", fontWeight: 700 }}>
                        Cell Wire Resistances
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                        {wireResistances.map((res, rIdx) => (
                          <div
                            key={rIdx}
                            style={{
                              background: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                              border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#e5e7eb"}`,
                              borderRadius: "10px",
                              padding: "0.4rem 0.5rem",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ fontSize: "0.55rem", color: isDark ? "#9ca3af" : "#6b7280" }}>
                              Cell {rIdx + 1}
                            </span>
                            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: navGreen }}>
                              {res}mΩ
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {activeHistoryModal === "temperature" && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "0 0.2rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <span style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: "0.68rem" }}>Peak Temp</span>
                        <strong style={{ color: "#ef4444", fontSize: "0.85rem", fontWeight: 700 }}>
                          {tempUnit === "F" ? "90.3°F" : "32.4°C"}
                        </strong>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <span style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: "0.68rem" }}>Min Temp</span>
                        <strong style={{ color: "#3b82f6", fontSize: "0.85rem", fontWeight: 700 }}>
                          {tempUnit === "F" ? "79.0°F" : "26.1°C"}
                        </strong>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <span style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: "0.68rem" }}>Safety Threshold</span>
                        <strong style={{ color: "#9ca3af", fontSize: "0.85rem", fontWeight: 700 }}>
                          {tempUnit === "F" ? "104.0°F" : "40.0°C"}
                        </strong>
                      </div>
                    </div>
                  )}

                  {activeHistoryModal === "voltage" && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "0 0.2rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <span style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: "0.68rem" }}>Nominal Range</span>
                        <strong style={{ color: isDark ? "#fff" : "#111", fontSize: "0.85rem", fontWeight: 700 }}>10.8V - 14.4V</strong>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <span style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: "0.68rem" }}>Under-Voltage Threshold</span>
                        <strong style={{ color: "#ef4444", fontSize: "0.85rem", fontWeight: 700 }}>10.8V</strong>
                      </div>
                    </div>
                  )}

                  {activeHistoryModal === "current" && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "0 0.2rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <span style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: "0.68rem" }}>Max Charge Rate</span>
                        <strong style={{ color: isDark ? "#fff" : "#111", fontSize: "0.85rem", fontWeight: 700 }}>50.0A</strong>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <span style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: "0.68rem" }}>Max Discharge Rate</span>
                        <strong style={{ color: isDark ? "#fff" : "#111", fontSize: "0.85rem", fontWeight: 700 }}>100.0A</strong>
                      </div>
                    </div>
                  )}

                  {activeHistoryModal === "power" && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", padding: "0 0.2rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <span style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: "0.68rem" }}>Daily Energy</span>
                        <strong style={{ color: isDark ? "#fff" : "#111", fontSize: "0.85rem", fontWeight: 700 }}>4.8 kWh</strong>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                        <span style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: "0.68rem" }}>Peak Demand</span>
                        <strong style={{ color: isDark ? "#fff" : "#111", fontSize: "0.85rem", fontWeight: 700 }}>1.45 kW</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Download Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.2rem" }}>
                  <button
                    onClick={() => downloadJSON(
                      activeHistoryModal,
                      historyTimeScale,
                      activeHistoryModal === "voltage" ? voltage : (activeHistoryModal === "current" ? current : (activeHistoryModal === "power" ? power : undefined)),
                      activeHistoryModal === "cell-voltages" ? cellVoltages : undefined
                    )}
                    style={{
                      padding: "0.45rem 1rem",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      borderRadius: "10px",
                      border: "none",
                      background: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6",
                      color: isDark ? "#fff" : "#111",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}
                    onMouseLeave={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6"}
                  >
                    <HugeiconsIcon icon={ThirdBracketSquareIcon} size={15} color="currentColor" strokeWidth={1.8} />
                    Download JSON
                  </button>
                  <button
                    onClick={() => downloadCSV(
                      activeHistoryModal,
                      historyTimeScale,
                      activeHistoryModal === "voltage" ? voltage : (activeHistoryModal === "current" ? current : (activeHistoryModal === "power" ? power : undefined)),
                      activeHistoryModal === "cell-voltages" ? cellVoltages : undefined
                    )}
                    style={{
                      padding: "0.45rem 1rem",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      borderRadius: "10px",
                      border: "none",
                      background: isDark ? "#4ade80" : "#0d9b0d",
                      color: isDark ? "#000000" : "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      transition: "opacity 0.2s ease",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                  >
                    <HugeiconsIcon icon={Csv01Icon} size={15} color="currentColor" strokeWidth={1.8} />
                    Download CSV
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Mobile Nav Bar ── */}
        <MobileNav
          theme={theme}
          active={activeTab}
          onChange={handleTabChange}
        />
      </div>
    </div>
  );
}

// AuthGuard wraps HomeInner so Google sign-in is required before the dashboard loads.
// theme is passed so the login/loading screen respects the user's saved preference.
export default function Home() {
  const [theme] = useState<"light" | "dark">(
    typeof window !== "undefined"
      ? ((localStorage.getItem("sentry_theme") as "light" | "dark") || "light")
      : "light"
  );
  return (
    <AuthGuard theme={theme}>
      <HomeInner />
    </AuthGuard>
  );
}