# Mobile App — Screens (brief)

All screens: `mobile/src/screens/`. Shared tokens in `mobile/src/theme.ts`, widgets in `mobile/src/components/ui.tsx`. Light theme; red `#DC2626` = emergency, blue `#2563EB` = info.

## Screens

- **Login** (`auth/LoginScreen.tsx`) — centered brand (car-sport logo "CrashCare"), white card with icon inputs (mail/lock), password toggle, inline error banner, red "Sign in", "Create one" link.
- **Register** (`auth/RegisterScreen.tsx`) — two sections (Account, Safety profile): icon inputs, 8 blood-type chips, emergency contact, first-aid switch revealing skills chips, inline validation, "Create account".
- **Home** (`app/HomeScreen.tsx`) — time-aware greeting, initial avatar (→ Profile), 3 quick-action tiles (map/devices/inbox), safety-profile row, device overview with connected/total progress bar.
- **My cars** (`app/DevicesScreen.tsx`) — car cards: name/plate, online-count badge, battery color, connected-ratio bar; loading + empty states.
- **Car details** (`app/CareDetailsScreen.tsx`) — dark-blue hero with status pill, 4 stat tiles (devices/online/offline/battery), `DeviceCard` list.
- **Live map** (`app/MapScreen.tsx`) — Leaflet in WebView (OSM tiles, car/crash/user markers, OSRM route), floating info card, legend, location loading state.
- **Incident feed** (`app/MessagesScreen.tsx`) — connection status header, first-aid request event cards (tap → map), chat bubbles, pill composer with circular send.
- **Profile** (`app/ProfileScreen.tsx`) — avatar + initial, first-aid badge, "Protected with CrashCare" pill, tinted detail rows, ghost red sign-out.

## Global overlays

- **Crash alert** (`components/CrashAlertOverlay.tsx`) — full-screen dark modal: pulsing red SOS icon, "Are you okay?", 30s countdown (number kick + draining bar), "I'm okay" (green) / "I need help" (red), vibration, auto `emergency_alert` on timeout.
- **Popup notification** (`components/PopupNotification.tsx`) — top toast banner (slide-in, life bar, close, optional "View on map" action).
- **Device card** (`components/DeviceCard.tsx`) — icon, status pill, battery & signal bars, updated/firmware footer.

## Navigation (`navigation/AppNavigator.tsx`)

Auth stack (Login↔Register) → App tabs (Home / Map / Messages / Profile, icons + active pill). HomeStack: Home → DeviceDetails → CareDetails. `navigationRef` routes popups to Map.
