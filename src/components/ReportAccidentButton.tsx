import React, { useMemo, useState } from "react";
import { Alert, Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { sendWebSocket, isWebSocketConnected } from "../services/websocket";
import { colors, spacing, radius, font, fontWeight, shadow } from "../theme";

/**
 * Prominent "Report accident" action at the top of the Home screen.
 * The user can optionally attach a photo (camera or gallery) to the report.
 * The report is broadcast over the WebSocket so responders see the incident live.
 */
export default function ReportAccidentButton({
  latitude,
  longitude,
}: {
  latitude?: number;
  longitude?: number;
}) {
  const [sent, setSent] = useState(false);
  const [photoAttached, setPhotoAttached] = useState(false);
  const [busy, setBusy] = useState(false);
  const press = useMemo(() => new Animated.Value(1), []);

  function pressTo(to: number) {
    Animated.spring(press, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  }

  /** Options sheet for the optional photo. */
  function openMenu() {
    if (busy) return;
    Alert.alert(
      "Report an accident",
      "Want to attach a photo of the scene? It helps responders assess the severity.",
      [
        { text: "📷 Take a photo", onPress: () => report("camera") },
        { text: "🖼️ Choose from gallery", onPress: () => report("gallery") },
        { text: "Report without photo", style: "destructive", onPress: () => report() },
        { text: "Cancel", style: "cancel" },
      ]
    );
  }

  /**
   * Picks a photo when a source is given, then broadcasts the accident report.
   * Photo is optional: `source` may be undefined (report without a photo).
   */
  async function report(source?: "camera" | "gallery") {
    if (!isWebSocketConnected()) {
      Alert.alert("Not connected", "You seem to be offline. Reconnect and try reporting again.");
      return;
    }
    setBusy(true);
    setPhotoAttached(false);
    try {
      let attached = false;
      if (source === "camera") {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) {
          Alert.alert(
            "Camera unavailable",
            "Allow camera access in Settings so you can attach a photo, or report without one."
          );
          return;
        }
        const res = await ImagePicker.launchCameraAsync({ quality: 0.4 });
        attached = !res.canceled && !!res.assets?.length;
      } else if (source === "gallery") {
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.4,
          allowsMultipleSelection: false,
        });
        attached = !res.canceled && !!res.assets?.length;
      }

      sendWebSocket({
        type: "accident_report",
        message: "Accident reported",
        has_photo: attached,
        ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
      });
      setPhotoAttached(attached);
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Animated.View style={[{ transform: [{ scale: press }] }, { marginBottom: spacing.xl }]}>
      <TouchableOpacity
        onPress={openMenu}
        onPressIn={() => pressTo(0.97)}
        onPressOut={() => pressTo(1)}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Report an accident"
        style={[
          styles.button,
          { backgroundColor: sent ? colors.success : colors.primary },
          shadow(3),
        ]}
      >
        {sent ? (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.label}>Reported{photoAttached ? " with photo" : ""}</Text>
          </>
        ) : (
          <>
            <Ionicons name="megaphone" size={20} color="#fff" />
            <Text style={styles.label}>{busy ? "Preparing report…" : "Report an accident"}</Text>
            <Text style={styles.optionalTag}>photo optional</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: radius.s,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.s,
    paddingHorizontal: spacing.l,
  },
  label: { color: "#fff", fontSize: font.body, fontWeight: fontWeight.bold },
  optionalTag: {
    color: "rgba(255,255,255,0.75)",
    fontSize: font.micro,
    fontWeight: fontWeight.semibold,
  },
});
