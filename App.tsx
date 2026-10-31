import "react-native-gesture-handler";
import React, { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { CarsProvider } from "./src/context/CarsContext";
import {
  connectWebSocket,
  onWebSocketMessage,
  sendWebSocket,
  isWebSocketConnected,
} from "./src/services/websocket";
import CrashAlertOverlay from "./src/components/CrashAlertOverlay";
import PopupNotification, { PopupVariant } from "./src/components/PopupNotification";
import FloatingHelpButton from "./src/components/FloatingHelpButton";
import AppNavigator, { navigationRef } from "./src/navigation/AppNavigator";

type PopupState = {
  id: number;
  variant: PopupVariant;
  title: string;
  message: string;
  crashLocation?: { latitude: number; longitude: number };
  crashUser?: string;
};

export default function App() {
  const [crashVisible, setCrashVisible] = useState(false);
  const [popup, setPopup] = useState<PopupState | null>(null);
  // Deadline after which we alert the emergency contact if still offline
  const [zoneDeadline, setZoneDeadline] = useState<number | null>(null);
  const popupIdRef = useRef(0);

  /** Each popup gets a unique id so the popup component remounts with fresh state. */
  function showPopup(state: Omit<PopupState, "id">) {
    popupIdRef.current += 1;
    setPopup({ id: popupIdRef.current, ...state });
  }

  useEffect(() => {
    connectWebSocket();
    const unsub = onWebSocketMessage((msg) => {
      const text = (msg?.message ?? msg?.text ?? "").toString().toLowerCase();
      const type = msg?.type;

      if (type === "crash_detected" || text === "crash detected") {
        setCrashVisible(true);
        return;
      }

      if (type === "emergency_response" || text === "ambulance is on the way") {
        showPopup({
          variant: "ambulance",
          title: "Ambulance dispatched",
          message: "The ambulance is on the way — stay where you are.",
        });
        return;
      }

      if (type === "first_aid_request" || text.includes("needs a first aid provider")) {
        showPopup({
          variant: "firstAid",
          title: "First aid needed",
          message: msg?.message ?? "There is a user in crash that needs a first aid provider",
          crashLocation:
            msg?.latitude && msg?.longitude
              ? { latitude: msg.latitude, longitude: msg.longitude }
              : undefined,
          crashUser: msg?.user,
        });
        return;
      }

      if (type === "isolated_area" || text.includes("isolated area")) {
        showPopup({
          variant: "isolated",
          title: "Isolated area",
          message: "You are about to enter an isolated area. Your signal may be lost.",
        });
        return;
      }
    });
    return () => unsub();
  }, []);

  // Check the isolated-area exit deadline; alert the emergency contact if still offline.
  useEffect(() => {
    if (zoneDeadline == null) return;
    const id = setInterval(() => {
      if (Date.now() >= zoneDeadline) {
        clearInterval(id);
        setZoneDeadline(null);
        if (!isWebSocketConnected()) {
          // Try to reach the server to forward the alert to the emergency contact
          connectWebSocket();
          setTimeout(() => {
            sendWebSocket({
              type: "emergency_contact_alert",
              message: "User is still offline after the estimated isolated-area exit time",
            });
          }, 1500);
          Alert.alert(
            "Still offline",
            "You are still offline after your estimated exit time. An alert has been sent to your emergency contact."
          );
        }
      }
    }, 2000);
    return () => clearInterval(id);
  }, [zoneDeadline]);

  function handleCanHelp() {
    // Open the map so the user can head to the crash; confirmation happens above the map.
    if (popup?.crashLocation) {
      navigationRef.current?.navigate("Map", {
        crashLocation: popup.crashLocation,
        crashUser: popup.crashUser,
      });
    } else {
      navigationRef.current?.navigate("Map");
    }
    setPopup(null);
  }

  function handleConfirmZone(minutes: number) {
    setZoneDeadline(Date.now() + minutes * 60_000);
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CarsProvider>
          <AppNavigator />
          <FloatingHelpButton />
          <PopupNotification
            key={popup?.id ?? "none"}
            visible={!!popup}
            variant={popup?.variant ?? "ambulance"}
            title={popup?.title ?? ""}
            message={popup?.message ?? ""}
            onCanHelp={handleCanHelp}
            onConfirmZone={handleConfirmZone}
            onDismiss={() => setPopup(null)}
          />
          <CrashAlertOverlay visible={crashVisible} onDismiss={() => setCrashVisible(false)} />
          <StatusBar style="auto" />
        </CarsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
