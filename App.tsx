import "react-native-gesture-handler";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
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
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, font, fontWeight, shadow } from "./src/theme";

type PopupState = {
  id: number;
  variant: PopupVariant;
  title: string;
  message: string;
  crashLocation?: { latitude: number; longitude: number };
  crashUser?: string;
};

type TruckInfo = {
  name?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
};

export default function App() {
  const [crashVisible, setCrashVisible] = useState(false);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [troubleWaiting, setTroubleWaiting] = useState(false);
  const [truck, setTruck] = useState<TruckInfo | null>(null);
  // Set once the truck card is closed — keeps the truck alive and pins the app-bar
  // "follow on map" notification until the user opens the Map.
  const [truckAck, setTruckAck] = useState(false);
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

      if (type === "troubleshoot_request") {
        setTroubleWaiting(true);
        return;
      }

      if (type === "troubleshoot_assigned") {
        // A truck accepted: show the truck card (and re-arm the map bar after it closes).
        setTruck((msg?.truck ?? null) as TruckInfo | null);
        setTruckAck(false);
        setTroubleWaiting(false);
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

  function handleTroubleshoot() {
    // Notify troubleshoot trucks nearby that this user needs help.
    sendWebSocket({
      type: "troubleshoot_request",
      message: "user needs a troubleshoot truck",
      user: "driver",
      latitude: 37.7749,
      longitude: -122.4194,
    });
    setTroubleWaiting(true);
  }

  function openTruckCall() {
    if (truck?.phone) {
      Linking.openURL(`tel:${truck.phone}`).catch(() => {});
    }
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CarsProvider>
          <AppNavigator />
          <FloatingHelpButton onTroubleshoot={handleTroubleshoot} />
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
          {troubleWaiting && !truck ? (
            <Modal visible transparent animationType="fade" statusBarTranslucent>
              <View style={styles.backdrop}>
                <View style={styles.waitCard}>
                  <TouchableOpacity onPress={() => setTroubleWaiting(false)} hitSlop={6} style={styles.closeBtn} accessibilityLabel="Close">
                    <Ionicons name="close" size={15} color={colors.textFaint} />
                  </TouchableOpacity>
                  <View style={styles.waitIcon}>
                    <Ionicons name="construct" size={26} color={colors.primary} />
                  </View>
                  <Text style={styles.waitTitle}>Troubleshoot truck requested</Text>
                  <Text style={styles.waitSub}>
                    A troubleshoot truck near you has been notified. We&apos;ll update you as soon as one accepts to come.
                  </Text>
                </View>
              </View>
            </Modal>
          ) : null}
          {truck && !truckAck ? (
            <Modal visible transparent animationType="fade" statusBarTranslucent>
              <View style={styles.backdrop}>
                <View style={styles.waitCard}>
                  <TouchableOpacity
                    onPress={() => {
                      // Keep the truck active — close the card and pin the map bar instead.
                      setTruckAck(true);
                    }}
                    hitSlop={6}
                    style={styles.closeBtn}
                    accessibilityLabel="Close"
                  >
                    <Ionicons name="close" size={15} color={colors.textFaint} />
                  </TouchableOpacity>
                  <View style={styles.waitIcon}>
                    <Ionicons name="construct" size={26} color={colors.successDark} />
                  </View>
                  <Text style={styles.waitTitle}>Troubleshoot truck is on the way</Text>
                  <Text style={styles.waitSub}>
                    {truck.name ? `${truck.name} is on the way to you.` : "A troubleshoot truck is on the way to you."}
                  </Text>
                  {truck.phone ? (
                    <TouchableOpacity style={styles.callBtn} onPress={openTruckCall} activeOpacity={0.85}>
                      <Ionicons name="call" size={16} color="#fff" />
                      <Text style={styles.callBtnText}>Call {truck.name ?? "the troubleshoot truck"}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </Modal>
          ) : null}
          {truck && truckAck ? (
            <TruckFollowBar truck={truck} onPress={() => navigationRef.current?.navigate("Map", { truck })} />
          ) : null}
          <CrashAlertOverlay visible={crashVisible} onDismiss={() => setCrashVisible(false)} />
          <StatusBar style="auto" />
        </CarsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/** Floating app-bar notification pinned while a troubleshoot truck is coming.
 *  Tapping it opens the Map screen, which follows the truck as it moves in.
 *  Must be rendered under SafeAreaProvider (it reads insets). */
function TruckFollowBar({ truck, onPress }: { truck: TruckInfo; onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const [hidden, setHidden] = useState(false);

  // Hide the bar on the Map screen itself (it's redundant there).
  useEffect(() => {
    const update = () => setHidden(navigationRef.current?.getCurrentRoute()?.name === "Map");
    update();
    const unsub = navigationRef.current?.addListener("state", update);
    return unsub;
  }, []);

  if (hidden) return null;
  return (
    <TouchableOpacity
      style={[styles.trackBar, { top: insets.top + spacing.s }]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel="Open map to follow the troubleshoot truck"
    >
      <View style={styles.trackBarIcon}>
        <Ionicons name="construct" size={15} color="#fff" />
      </View>
      <View style={styles.trackBarTextWrap}>
        <Text style={styles.trackBarTitle} numberOfLines={1}>
          {truck.name ? `${truck.name} is on the way` : "Troubleshoot truck is on the way"}
        </Text>
        <Text style={styles.trackBarSub}>Tap to follow it on the map</Text>
      </View>
      <Ionicons name="map" size={17} color={colors.textFaint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  waitCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    ...shadow(3),
  },
  closeBtn: {
    position: "absolute",
    top: spacing.m,
    right: spacing.m,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  waitIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  waitTitle: { fontSize: font.body, fontWeight: fontWeight.bold, color: colors.text, marginTop: 12, textAlign: "center" },
  waitSub: { fontSize: font.small, color: colors.textMuted, textAlign: "center", marginTop: 6, lineHeight: 19 },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.s,
    minHeight: 48,
    paddingHorizontal: spacing.l,
    marginTop: 16,
    ...shadow(1),
  },
  callBtnText: { color: "#fff", fontSize: font.body - 1, fontWeight: fontWeight.bold },
  // Floating app-bar notification for the incoming troubleshoot truck
  trackBar: {
    position: "absolute",
    left: spacing.l,
    right: spacing.l,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    paddingVertical: 10,
    paddingHorizontal: 12,
    ...shadow(3),
  },
  trackBarIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.successDark,
    alignItems: "center",
    justifyContent: "center",
  },
  trackBarTextWrap: { flex: 1 },
  trackBarTitle: { fontSize: font.small, fontWeight: fontWeight.bold, color: colors.navy },
  trackBarSub: { fontSize: font.micro, color: colors.textMuted, marginTop: 1 },
});
