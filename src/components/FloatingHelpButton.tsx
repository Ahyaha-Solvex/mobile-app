import React, { useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { sendWebSocket } from "../services/websocket";
import { colors, spacing, radius, font, fontWeight, shadow } from "../theme";

/**
 * Floating action button, available on every signed-in screen.
 * Sends a help request to the WebSocket server so nearby first-aid
 * providers / responders are notified that this user needs help.
 */
export default function FloatingHelpButton() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [sent, setSent] = useState(false);
  const pulse = useMemo(() => new Animated.Value(0), []);
  const press = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => setSent(false), 2500);
    return () => clearTimeout(t);
  }, [sent]);

  useEffect(() => {
    if (!user || sent) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [user, sent, pulse]);

  if (!user) return null;

  function handlePress() {
    Animated.sequence([
      Animated.timing(press, { toValue: 0.88, duration: 90, useNativeDriver: true }),
      Animated.spring(press, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
    sendWebSocket({ type: "help_request", message: "help" });
    setSent(true);
  }

  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });
  const bg = sent ? colors.success : colors.primary;
  const ring = sent ? colors.success : colors.primary;

  return (
    <View
      style={[
        styles.wrap,
        { bottom: (Platform.OS === "ios" ? 100 : 82) + insets.bottom },
      ]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.halo,
          { backgroundColor: ring, transform: [{ scale: haloScale }], opacity: sent ? 0 : haloOpacity },
        ]}
      />
      <Animated.View style={{ transform: [{ scale: press }] }}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: bg }, shadow(3)]}
          onPress={handlePress}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Ask for help"
        >
          <Ionicons name={sent ? "checkmark-circle" : "help-buoy"} size={28} color="#fff" />
          <Text style={styles.label}>{sent ? "Sent" : "Help"}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: spacing.l,
    bottom: Platform.select({ ios: 100, default: 82 }),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  halo: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    top: 0,
  },
  button: {
    minWidth: 64,
    height: 64,
    paddingHorizontal: spacing.m,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.65)",
  },
  label: {
    color: "#fff",
    fontSize: font.micro,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.4,
  },
});
