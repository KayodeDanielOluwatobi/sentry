# SENTRY: IoT-Enabled Real-Time BMS Telemetry Monitor and Intelligent Load-Shedding Controller

### B.Tech. Final Year Project
**Federal University of Technology, Akure (FUTA)**  
*Ondo State, Nigeria*  

---

## 📋 Project Abstract & Overview

In developing nations like Nigeria, electrical grid instability has driven a massive transition toward Solar Photovoltaic (PV) systems backed by Lithium-ion ($LiFePO_4$) energy storage. However, without granular cell-level telemetry and active load-shedding control, battery life cycles deteriorate rapidly under improper charge/discharge rates, and sudden blackouts remain poorly managed.

**Sentry** is an end-to-end, high-performance Internet of Things (IoT) monitoring and control system. It establishes direct Bluetooth Low Energy (BLE) communication with a Battery Management System (BMS), processes real-time cell parameters, and publishes live telemetry to a distributed web application. The system implements an **Intelligent Load Manager** that executes prioritized load-shedding commands back to the hardware, safeguarding critical domestic loads (such as security systems, networking gear, and medical devices) when battery capacity drops below predefined thresholds.

---

## ⚙️ System Architecture

The project is structured into three unified physical and cloud layers:

```
               ┌───────────────────────────────────────────────────────────┐
               │                     HARDWARE LAYER                        │
               │                                                           │
               │   ┌──────────────┐             ┌──────────────────────┐   │
               │   │    JK-BMS    │ ───[BLE]──▶ │ ESP32 #1: BLE Reader │   │
               │   └──────────────┘             └──────────────────────┘   │
               │                                           │               │
               │                                        [UART]             │
               │                                           ▼               │
               │   ┌──────────────┐             ┌──────────────────────┐   │
               │   │ Relays/Loads │ ◀──[GPIO]── │ ESP32 #2: Cloud Link │   │
               │   └──────────────┘             └──────────────────────┘   │
               └───────────────────────────────────┬───────────────────┘
                                                   │
                                     ┌─────────────┴─────────────┐
                                     ▼                           ▼
                       ┌───────────────────────────┐   ┌───────────────────────────┐
                       │        CLOUD LAYER        │   │        CLOUD LAYER        │
                       │   Firebase RTDB (Live)    │   │   Supabase DB (History)   │
                       └─────────────┬─────────────┘   └─────────────┬─────────────┘
                                     │                               │
                                     └─────────────┬─────────────────┘
                                                   │
                                                   ▼
               ┌───────────────────────────────────────────────────────────┐
               │                     APPLICATION LAYER                     │
               │                                                           │
               │               ┌───────────────────────────┐               │
               │               │   Next.js 15 Web App      │               │
               │               │   Glassmorphic PWA        │               │
               │               └───────────────────────────┘               │
               └───────────────────────────────────────────────────────────┘
```

### 1. Hardware Architecture
*   **Battery Management System**: JK-BMS (Model: `JK-B1A8S10P`) connected to a $LiFePO_4$ pack. It communicates via the proprietary `JK02_32S` hex protocol (frame headers: `55 AA EB 90`, offset = 16, 32S variant).
*   **Node 1 (BLE Gateway)**: ESP32 DevKit running custom C++ firmware. It connects as a BLE client to the BMS (Service ID: `FFE0`, Characteristic ID: `FFE1`), registers for notifications, decodes the raw byte packets in real-time, and formats them into a clean JSON string outputted over UART.
*   **Node 2 (Cloud Synchronization & Control)**: ESP32 DevKit connected to Node 1 via UART (`GPIO16` RX). It performs the following routines:
    *   Retrieves network time via NTP (Network Time Protocol) for precise timestamping.
    *   Uploads live telemetry payloads to Firebase Realtime Database (RTDB) to feed the live dashboard.
    *   Performs direct HTTPS POST queries to a Supabase database REST endpoint every 5 seconds to write archival metrics.
    *   Listens for load control states from the load manager and fires relay driver pins (GPIO) to connect/disconnect local appliance lines.

### 2. Cloud Infrastructure
*   **Firebase Realtime Database (RTDB)**: Serves as the high-rate, low-latency live telemetry stream handler.
*   **Supabase Database (PostgreSQL)**: Stores the historical telemetry logging archive. Protected with Row Level Security (RLS) policies.
*   **Supabase Auth v2**: Manages secure administrative sign-in using Google OAuth and email providers.

### 3. Progressive Web Application (PWA)
*   Built with Next.js 15, React, and Framer Motion.
*   **Glassmorphic Design System**: Uses curated HSL color variables, absolute linear charting timelines, and dynamic visual state indicators (such as paused orbital status indicators and frozen bubbles during offline periods).
*   **Offline Tracking**: Custom SVG line-charts detect and display clear line breaks for offline periods instead of misleading continuous interpolation curves.
*   **Accessibility features**: Speech warnings that announce critical BMS failures via the Web Speech API.

---

## 🗄️ Database Schema Setup (Supabase)

To support historical graph rendering and offline analysis, execute the following SQL script inside your Supabase SQL editor:

```sql
create table public.telemetry_history (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  timestamp bigint not null, -- Unix Epoch timestamp in milliseconds
  voltage double precision not null,
  current double precision not null,
  power double precision not null,
  temperatures double precision[] not null, -- Temp 1, Temp 2, MOSFET Temperature
  cell_voltages double precision[] not null, -- Real cell readings
  is_offline boolean not null default false
);

-- Enable Row Level Security (RLS)
alter table public.telemetry_history enable row level security;

-- Create policies for public access (or restrict to authenticated admin users)
create policy "Allow read access to anyone" on public.telemetry_history
  for select using (true);

create policy "Allow insert access to anonymous users" on public.telemetry_history
  for insert with check (true);
```

---

## 🚀 Setting Up the Application

### Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js (v18.x or newer)](https://nodejs.org)
*   [Arduino IDE (v2.x or newer)](https://www.arduino.cc/en/software) (for compiling firmware)
*   [Git](https://git-scm.com)

### 1. Web Dashboard Installation
Clone this repository to your local computer and navigate into the workspace:

```bash
git clone https://github.com/KayodeDanielOluwatobi/sentry.git
cd sentry
```

Install the dependencies:

```bash
npm install
```

Configure your environment variables by creating a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_DATABASE_URL="https://your-firebase-rtdb.firebaseio.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Auth bypass toggle (Set to "false" to enable active Supabase logins)
NEXT_PUBLIC_BYPASS_AUTH="false"
```

Start the development server:

```bash
npm run dev
```
Open `http://localhost:3000` inside your browser to view the active Sentry interface.

---

## 🔌 Firmware Compilation & Hardware Hookup

Open the Arduino IDE, install the **ArduinoJson** library, and flash the respective microcontrollers:

1.  **Flash ESP32 #1**: Upload the BLE parser firmware configured to communicate with the JK-BMS MAC Address `A4:C1:38:06:91:DC` via standard serial connection.
2.  **Flash ESP32 #2**: Open `firmware/esp32_wifi_uploader.ino` in your IDE, customize your WiFi Credentials (`WIFI_SSID` and `WIFI_PASSWORD`), configure your database URL endpoints, and flash the board.

### Physical Wiring Diagram:
```
[BMS BLE Interface]
        │
    (Wireless)
        ▼
 [ESP32 Node 1] (BLE Gateway)
    ┌──────────┐
    │ GPIO17   │ ──(TX to RX)──▶  [ESP32 Node 2] (Cloud Link)
    │ GND      │ ────────────────  ┌──────────┐
    └──────────┘                   │ GPIO16   │ (RX)
                                   │ GND      │
                                   └──────────┘
```

---

## 🛡️ Access Roles

Access permissions are enforced based on the Supabase authenticated Google account email:
*   **Grid Administrator / Key Owner**: Account configured with the email `dkayode61@gmail.com`. Has full read/write toggle privileges, priority load controls, and system configuration configurations.
*   **Sentry Observer / Read-Only**: Any other authenticated user account. Restricted to read-only access on telemetry views and disabled control elements.

---

## 🎓 Academic Disclaimer & Acknowledgements
This project is submitted in partial fulfillment of the requirements for the award of the Bachelor of Technology (B.Tech) degree from the **Federal University of Technology, Akure (FUTA)**. 

All designs, firmware libraries, database schemas, and application architectures were developed under the supervision of the Department of Electrical and Electronics Engineering, FUTA. 

---
*Developed by Kayode Daniel Oluwatobi.*  
*Copyright © 2026. All rights reserved.*
