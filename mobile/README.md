# JalDrishti Mobile Companion App (React Native + Expo)

Companion mobile application for field officers, district collectors, and water resource managers. Built with **React Native**, **Expo Router**, and **TypeScript**.

---

## 📱 Mobile Capabilities

- **Real-Time Telemetry Feed**: Live monitoring of 6,400+ DWLR stations with CGWB risk badges (Safe, Semi-Critical, Critical, Over-Exploited).
- **Dual-Mode CGWB Evaluation**: Side-by-side comparison of statutory block Stage of Development (%) vs high-frequency depth proxy.
- **Active Alert & Dispatch Feed**: Immediate notifications when telemetry observations breach statutory risk boundaries.
- **AI-Powered Stakeholder Advisories**: Plain-language situation summaries and recommended interventions powered by Google Gemini 3.5 Flash with deterministic rule-engine fallback.
- **District Aggregates**: High-level drilldown into district groundwater categories.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js 18+**
- **Expo Go App** (iOS / Android) or simulator

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Configure Backend Host
Edit `mobile/services/api.ts` to point to your backend IP:
- **Android Emulator**: `http://10.0.2.2:8000/api/v1`
- **iOS Simulator / Localhost**: `http://127.0.0.1:8000/api/v1`
- **Physical Device (Expo Go)**: `http://<YOUR_LAN_IP>:8000/api/v1`

### 3. Launch the Expo Development Server
```bash
npx expo start
```
- Scan the QR code using **Expo Go** on your Android or iOS device.
- Press `a` for Android Emulator, `i` for iOS Simulator, or `w` for Web preview.

---

## 📁 Directory Structure
```
mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Dashboard & Telemetry Screen
│   │   ├── alerts.tsx         # Real-time Alert & Dispatch Feed
│   │   └── districts.tsx      # District Resource Directory
│   ├── station/
│   │   └── [id].tsx           # Station Detail, Dual Matrix & Advisory
│   └── _layout.tsx            # Expo Router root layout with dark theme
├── components/
│   └── RiskBadge.tsx          # Reusable CGWB risk badge component
├── services/
│   └── api.ts                 # Axios API client connecting to FastAPI backend
└── types/
    └── station.ts             # Shared domain TypeScript types
```
