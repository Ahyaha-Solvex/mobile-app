# CrashCare Mobile App

**CrashCare** is a car-crash emergency-response app. Every car carries care devices (GPS, accelerometer, speed sensor, etc.); when a crash happens, the app takes over immediately: it asks if you're okay, and if you can't respond it alerts an ambulance and everyone around you who can give first aid.

Built with **Expo / React Native + TypeScript**, React Navigation, and a WebSocket link for live incident updates.

---

## Screens

### 🏠 Home: the protection dashboard

The main tab. It greets you by name, shows the current state of your cars' care devices, and shares safe-driving tips. A floating **Help** button is always available in the corner of every screen.

![Home](docs/screenshots/01-home.png)

- **Ayah card**: Surat Al-Ma'idah 32, *"...if anyone saved a life, it would be as if he saved all mankind."*
- **Protection active**: live status of your care devices (e.g. *12 of 14 devices connected*, with a green dot).
- **Devices**: device health at a glance, how many are online out of your paired cars, shown as a progress bar. **View all** opens the cars tab.

### 🚗 My cars

A simple list of your paired cars and their care devices. Tap a car to see device details. Use **＋ Add another car** to pair a new one.

![My cars](docs/screenshots/02-my-cars.png)

### 👤 Profile

Your safety profile: name, **blood type**, first-aid skills (e.g. CPR, wound care) and emergency contacts, the data responders rely on if a crash happens. Sign out from here too.

![Profile](docs/screenshots/03-profile.png)

---

## 🚨 The emergency flow

### 1. Crash detected → full-screen countdown

The moment a crash is confirmed, the app takes over the whole screen with a pulsing **SOS** alert, vibration, and a **30-second countdown** with a draining time bar:

> **"Were you in a crash?"** *Respond within 30 seconds.*

![Crash alert](docs/screenshots/04-crash-alert.png)

- At **10 seconds left** the alert turns urgent.
- **"I'm okay"** dismisses the alert and tells everyone the crash was acknowledged.

### 2. "I need help" → alert is sent

Tapping **I need help** (or not responding before the countdown ends) sends an emergency alert with your location:

**Sending:**
![Sending](docs/screenshots/05-crash-sending.png)

**Sent, help is on the way:**
![Success](docs/screenshots/06-crash-success.png)

### 3. Ambulance dispatched

Ambulance updates arrive as a toast popup:

![Ambulance popup](docs/screenshots/07-ambulance-popup.png)

---

## 🩹 Helping someone else

Crashes are broadcast live to **every user** in range. When a first-aid request comes in, a popup appears:

![First aid popup](docs/screenshots/08-firstaid-popup.png)

- **I can help** → the app opens the **Safety map**: your position, the crash site, and your car, with the **driving route to the victim** (real map + real route).

![Safety map](docs/screenshots/09-map.png)

Confirming from the map notifies the victim that help is coming:

![Help confirmed](docs/screenshots/10-help-confirmed.png)

- **I can't help** → dismisses the popup so it doesn't get in your way.

### The floating Help button

Couldn't find emergency info? The red **Help** button (always visible, gently pulsing) sends your own first-aid request. It turns into a green **✓ Sent** when delivered:

![Help sent](docs/screenshots/11-help-sent.png)

---

## Project layout (mobile)

| Path | What it is |
|---|---|
| `mobile/app.json` | Expo config |
| `mobile/src/screens/auth/` | Login, Register |
| `mobile/src/screens/app/` | Home, Devices (My cars), Profile, Map, Messages |
| `mobile/src/navigation/AppNavigator.tsx` | Auth stack + bottom tabs (Home / My cars / Profile) + Map & Messages stack screens |
| `mobile/src/components/` | `CrashAlertOverlay`, `PopupNotification`, `FloatingHelpButton`, shared UI kit (`ui.tsx`) |
| `mobile/src/services/websocket.ts` | Live incident updates (routes handlers to the right screen, e.g. opens the Map when you tap **I can help**) |
| `mobile/src/theme.ts` | Design tokens (colors, spacing, typography, shadows) |

## Run it

```bash
cd mobile
npx expo start
# press `a` for an Android emulator, or scan the QR with Expo Go
```

- The app discovers the backend automatically (`localhost` in dev, `10.0.2.2`/`10.0.3.2` on emulators), or set it explicitly:

  ```bash
  EXPO_PUBLIC_API_URL=http://<host>:8000 npx expo start
  ```

- Demo account: **`ahmed@gmail.com`** / **`Ahmed123!`**
- Dev dependencies quality gates: `npx tsc --noEmit` and `npx eslint . --ext .ts,.tsx` (from `mobile/`).

## Limitations

- Crash detection and ambulance flow are **simulated** through the incident service (no real sensor integration or SMS/push yet).
- The WebSocket has no auto-reconnect after a dropped connection (it re-establishes on app launch).
- Map tiles & routes need internet access at runtime.

---

Hackathon project, built for safety. Drive carefully. 🚗💨
