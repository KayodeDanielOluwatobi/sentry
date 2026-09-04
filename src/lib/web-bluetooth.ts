// Ambient types for Web Bluetooth API
interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  device: BluetoothDevice;
  uuid: string;
  isPrimary: boolean;
  getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  service: BluetoothRemoteGATTService;
  uuid: string;
  properties: any;
  value?: DataView;
  getDescriptor(descriptor: string | number): Promise<any>;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithResponse?(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
}

export const SENTRY_BLE_SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
export const SENTRY_BLE_CTRL_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

export interface BleStatePacket {
  mode?: "AUTO" | "MANUAL";
  ch1?: boolean;
  ch2?: boolean;
  ch3?: boolean;
  soc?: number;
  v?: number;
  i?: number;
  p?: number;
}

export interface BleConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string | null;
  error: string | null;
}

class SentryWebBluetooth {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private ctrlCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private listeners: Array<(packet: BleStatePacket) => void> = [];
  private stateListeners: Array<(state: BleConnectionState) => void> = [];

  private state: BleConnectionState = {
    isConnected: false,
    isConnecting: false,
    deviceName: null,
    error: null,
  };

  public isSupported(): boolean {
    return typeof window !== "undefined" && typeof navigator !== "undefined" && "bluetooth" in navigator;
  }

  public getState(): BleConnectionState {
    return { ...this.state };
  }

  public onTelemetry(callback: (packet: BleStatePacket) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public onStateChange(callback: (state: BleConnectionState) => void) {
    this.stateListeners.push(callback);
    callback(this.getState());
    return () => {
      this.stateListeners = this.stateListeners.filter((cb) => cb !== callback);
    };
  }

  private updateState(partial: Partial<BleConnectionState>) {
    this.state = { ...this.state, ...partial };
    this.stateListeners.forEach((cb) => cb(this.getState()));
  }

  public async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      this.updateState({ error: "Web Bluetooth is not supported in this browser. Use Chrome or Edge on Android/PC." });
      return false;
    }

    try {
      this.updateState({ isConnecting: true, error: null });

      console.log("[Web BLE] Requesting Bluetooth Device...");
      this.device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ namePrefix: "Sentry" }, { services: [SENTRY_BLE_SERVICE_UUID] }],
        optionalServices: [SENTRY_BLE_SERVICE_UUID],
      });

      if (!this.device) {
        throw new Error("No device selected.");
      }

      this.device.addEventListener("gattserverdisconnected", this.handleDisconnect.bind(this));

      console.log("[Web BLE] Connecting to GATT Server...");
      this.server = await this.device.gatt!.connect();

      console.log("[Web BLE] Getting Primary Service...");
      const service = await this.server.getPrimaryService(SENTRY_BLE_SERVICE_UUID);

      console.log("[Web BLE] Getting Characteristic...");
      this.ctrlCharacteristic = await service.getCharacteristic(SENTRY_BLE_CTRL_CHAR_UUID);

      // Start notifications for live state changes
      await this.ctrlCharacteristic.startNotifications();
      this.ctrlCharacteristic.addEventListener(
        "characteristicvaluechanged",
        this.handleCharacteristicValueChanged.bind(this)
      );

      // Initial read
      const initialVal = await this.ctrlCharacteristic.readValue();
      this.parseAndNotify(initialVal);

      this.updateState({
        isConnected: true,
        isConnecting: false,
        deviceName: this.device.name || "Sentry Controller",
        error: null,
      });

      console.log("[Web BLE] Connected and listening to Sentry Controller!");
      return true;
    } catch (err: any) {
      console.error("[Web BLE] Connection failed:", err);
      this.updateState({
        isConnected: false,
        isConnecting: false,
        error: err.message || "Failed to connect to Bluetooth device.",
      });
      return false;
    }
  }

  public async disconnect() {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.handleDisconnect();
  }

  private handleDisconnect() {
    console.log("[Web BLE] Bluetooth connection closed.");
    this.ctrlCharacteristic = null;
    this.server = null;
    this.updateState({
      isConnected: false,
      isConnecting: false,
      deviceName: null,
    });
  }

  private handleCharacteristicValueChanged(event: any) {
    const value = event.target.value as DataView;
    this.parseAndNotify(value);
  }

  private parseAndNotify(dataView: DataView) {
    try {
      const decoder = new TextDecoder("utf-8");
      const jsonString = decoder.decode(dataView);
      const parsed = JSON.parse(jsonString) as BleStatePacket;
      console.log("[Web BLE Telemetry Received]:", parsed);
      this.listeners.forEach((cb) => cb(parsed));
    } catch (err) {
      console.warn("[Web BLE] Could not decode incoming packet:", err);
    }
  }

  private writeQueue: Promise<any> = Promise.resolve();

  public async sendCommand(commandObj: Record<string, any>): Promise<boolean> {
    if (!this.ctrlCharacteristic || !this.state.isConnected) {
      console.warn("[Web BLE] Cannot send command — not connected.");
      return false;
    }

    // Queue commands sequentially to prevent GATT write collisions during rapid button taps
    return new Promise<boolean>((resolve) => {
      this.writeQueue = this.writeQueue
        .then(async () => {
          if (!this.ctrlCharacteristic || !this.state.isConnected) {
            resolve(false);
            return;
          }
          const encoder = new TextEncoder();
          const jsonStr = JSON.stringify(commandObj);
          const encoded = encoder.encode(jsonStr);

          // Try writeValueWithoutResponse if available for ultra-fast throughput
          if (typeof this.ctrlCharacteristic.writeValueWithoutResponse === "function") {
            try {
              await this.ctrlCharacteristic.writeValueWithoutResponse(encoded);
              console.log("[Web BLE Command Sent (NoResp)]:", jsonStr);
              resolve(true);
              return;
            } catch {
              // Fallback to standard writeValue
            }
          }

          await this.ctrlCharacteristic.writeValue(encoded);
          console.log("[Web BLE Command Sent]:", jsonStr);
          
          // 25ms micro-pause to allow ESP32 radio buffer to cycle cleanly
          await new Promise((r) => setTimeout(r, 25));
          resolve(true);
        })
        .catch((err) => {
          console.error("[Web BLE Command Error]:", err);
          resolve(false);
        });
    });
  }
}

export const sentryBle = new SentryWebBluetooth();
