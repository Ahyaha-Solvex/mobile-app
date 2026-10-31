import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { sendWebSocket } from "../services/websocket";
import { colors, spacing, radius, font, fontWeight, shadow } from "../theme";

/** Time (seconds) to wait for the user to pick before defaulting to "in crash". */
const CRASH_FALLBACK_SECONDS = 30;

/**
 * Floating action button, available on every signed-in screen.
 * Opens a quick choice: "I'm in a crash" or "I need a troubleshoot truck".
 * If no choice is made within 30s it defaults to the crash flow.
 */
export default function FloatingHelpButton({
  onTroubleshoot,
}: {
  onTroubleshoot?: () => void;
}) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [sent, setSent] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const pulse = useMemo(() => new Animated.Value(0), []);
  const press = useMemo(() => new Animated.Value(1), []);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (!choiceOpen) {
      if (autoTimer.current) {
        clearTimeout(autoTimer.current);
        autoTimer.current = null;
      }
      return;
    }
    autoTimer.current = setTimeout(() => {
      // Auto-select "I'm in a crash" after the timeout.
      setChoiceOpen(false);
      sendWebSocket({ type: "help_request", message: "help" });
      setSent(true);
    }, CRASH_FALLBACK_SECONDS * 1000);
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
  }, [choiceOpen]);

  if (!user) return null;

  function handleSendHelp() {
    Animated.sequence([
      Animated.timing(press, { toValue: 0.88, duration: 90, useNativeDriver: true }),
      Animated.spring(press, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
    sendWebSocket({ type: "help_request", message: "help" });
    setSent(true);
  }

  function handleSelectTroubleshoot() {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    setChoiceOpen(false);
    onTroubleshoot?.();
  }

  function handleSelectCrash() {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    setChoiceOpen(false);
    handleSendHelp();
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
          onPress={() => setChoiceOpen(true)}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Ask for help"
        >
          <Ionicons name={sent ? "checkmark-circle" : "help-buoy"} size={28} color="#fff" />
          <Text style={styles.label}>{sent ? "Sent" : "Help"}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Choice: crash vs troubleshoot truck */}
      <Modal visible={choiceOpen} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>How can we help?</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={handleSelectCrash} activeOpacity={0.85}>
              <Ionicons name="car-sport" size={18} color={colors.primary} />
              <Text style={styles.modalBtnText}>I&apos;m in a crash</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnAlt]} onPress={handleSelectTroubleshoot} activeOpacity={0.85}>
              <Ionicons name="construct" size={18} color={colors.info} />
              <Text style={styles.modalBtnText}>I need a troubleshoot truck</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setChoiceOpen(false)} activeOpacity={0.85}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(8, 20, 34, 0.6)",
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    width: "100%",
    maxWidth: 320,
    alignItems: "stretch",
    ...shadow(3),
  },
  modalTitle: { fontSize: font.body, fontWeight: fontWeight.bold, color: colors.navy, textAlign: "center", marginBottom: spacing.m },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.s,
    minHeight: 48,
    paddingHorizontal: spacing.l,
    marginBottom: spacing.s,
  },
  modalBtnAlt: { backgroundColor: colors.infoSoft, borderColor: colors.blueAccentSoft },
  modalBtnText: { fontSize: font.body - 1, fontWeight: fontWeight.bold, color: colors.text },
  modalCancel: { alignItems: "center", paddingVertical: spacing.s },
  modalCancelText: { fontSize: font.small, color: colors.textFaint, fontWeight: fontWeight.semibold },
});
