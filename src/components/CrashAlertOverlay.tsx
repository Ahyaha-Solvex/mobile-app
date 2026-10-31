import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
  Easing,
  Vibration,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendWebSocket } from "../services/websocket";
import { colors, spacing, radius, font, fontWeight, shadow } from "../theme";

const TOTAL_SECONDS = 30;
const VIBRATION_PATTERN = [0, 400, 180, 400, 180, 400, 180, 800];

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export default function CrashAlertOverlay({ visible, onDismiss }: Props) {
  const [seconds, setSeconds] = useState(TOTAL_SECONDS);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Pulsing "SOS" halo around the icon
  const pulse = useMemo(() => new Animated.Value(0), []);
  // Depleting time bar
  const timeLeft = useMemo(() => new Animated.Value(1), []);
  // Small kick on the countdown number every tick
  const tickScale = useMemo(() => new Animated.Value(1), []);
  // Bouncing green check for the "help is on the way" end state
  const checkScale = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (sent) {
      Animated.spring(checkScale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }).start();
    } else {
      checkScale.setValue(0);
    }
  }, [sent, checkScale]);

  useEffect(() => {
    if (!visible) return;

    Vibration.vibrate(VIBRATION_PATTERN, true);
    timeLeft.setValue(1);
    pulse.setValue(0);

    // Continuous soft pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    // Linear drain of the time bar
    Animated.timing(timeLeft, {
      toValue: 0,
      duration: TOTAL_SECONDS * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          Vibration.cancel();
          triggerEmergency();
          return 0;
        }
        // bump the number each tick
        tickScale.setValue(1.25);
        Animated.spring(tickScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();
        return s - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      pulseLoop.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  /** Reset transient state; called on every close path so the next alert starts fresh. */
  function resetForNextAlert() {
    setSeconds(TOTAL_SECONDS);
    setSending(false);
    setSent(false);
    timeLeft.setValue(1);
    pulse.setValue(0);
    tickScale.setValue(1);
    Vibration.cancel();
  }

  function triggerEmergency() {
    setSending(true);
    Vibration.vibrate([0, 600, 120, 600, 120, 1200]);
    sendWebSocket({ type: "emergency_alert", message: "Emergency alert sent" });
    // Brief "sending" beat, then a reassuring closure state before dismissing.
    setTimeout(() => {
      setSending(false);
      setSent(true);
      Vibration.cancel();
      setTimeout(() => {
        resetForNextAlert();
        onDismiss();
      }, 2000);
    }, 700);
  }

  function handleOkay() {
    resetForNextAlert();
    sendWebSocket({ type: "crash_ack", message: "User is okay" });
    onDismiss();
  }

  function handleClose() {
    // Close without acknowledging — treat like "no response yet", no alert is sent.
    resetForNextAlert();
    onDismiss();
  }

  function handleHelp() {
    triggerEmergency();
  }

  if (!visible) return null;

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  const urgent = seconds <= 10;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Close button (only while the user can still respond) */}
          {!sending && !sent ? (
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={6} accessibilityLabel="Close">
              <Ionicons name="close" size={15} color={colors.textFaint} />
            </TouchableOpacity>
          ) : null}
          {/* Pulsing emergency icon */}
          <View style={styles.iconStage}>
            <Animated.View
              style={[
                styles.halo,
                { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
              ]}
            />
            <View style={styles.iconWrap}>
              <Ionicons name="warning" size={44} color="#fff" />
            </View>
          </View>

          <Text style={styles.title}>Crash detected</Text>
          <Text style={styles.question}>Are you okay?</Text>

          {sent ? (
            <View style={styles.sentWrap}>
              <Animated.View style={[styles.sentIcon, { transform: [{ scale: checkScale }] }]}>
                <Ionicons name="checkmark" size={40} color="#fff" />
              </Animated.View>
              <Text style={styles.sentTitle}>Emergency alert sent</Text>
              <Text style={styles.sentText}>
                Help is on the way. Stay calm — your location was shared with responders.
              </Text>
            </View>
          ) : sending ? (
            <View style={styles.sendingWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.sendingText}>Sending emergency alert…</Text>
              <Text style={styles.sendingHint}>Your location is being shared with responders</Text>
            </View>
          ) : (
            <>
              {/* Countdown number + drain bar */}
              <View style={styles.countdownRow}>
                <Animated.Text style={[styles.countdownNumber, { transform: [{ scale: tickScale }] }]}>
                  {seconds}
                </Animated.Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.countdownLabel}>
                    seconds to respond
                  </Text>
                  <View
                    style={{
                      height: 8,
                      borderRadius: radius.full,
                      backgroundColor: colors.divider,
                      overflow: "hidden",
                      marginTop: 6,
                    }}
                  >
                    <Animated.View
                      style={{
                        height: "100%",
                        borderRadius: radius.full,
                        backgroundColor: urgent ? colors.primary : colors.info,
                        width: timeLeft.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["2%", "100%"],
                        }),
                      }}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.okayBtn, shadow(2)]} onPress={handleOkay} activeOpacity={0.85}>
                  <Ionicons name="checkmark-circle" size={21} color="#fff" />
                  <Text style={styles.btnText}>I&apos;m okay</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.helpBtn, shadow(3)]} onPress={handleHelp} activeOpacity={0.85}>
                  <Ionicons name="alert-circle" size={21} color="#fff" />
                  <Text style={styles.btnText}>I need help</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {!sending && !sent ? (
            <View style={styles.hintRow}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textFaint} />
              <Text style={styles.hint}>
                No response — an emergency alert is sent automatically.
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
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
  card: {
    width: Math.min(Dimensions.get("window").width - 32, 400),
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: "center",
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
  iconStage: { alignItems: "center", justifyContent: "center", marginBottom: spacing.l },
  halo: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(3),
  },
  title: { fontSize: font.titleXl, fontWeight: fontWeight.bold, color: colors.text, letterSpacing: -0.5 },
  question: { fontSize: font.body, color: colors.textMuted, marginTop: spacing.xs + 2, marginBottom: spacing.l },
  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.l,
    width: "100%",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.m,
    padding: spacing.l,
    marginBottom: spacing.l,
  },
  countdownNumber: {
    fontSize: 44,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    minWidth: 62,
    textAlign: "center",
    includeFontPadding: false,
  },
  countdownLabel: { fontSize: font.small, color: colors.textMuted, fontWeight: fontWeight.semibold },
  actions: { flexDirection: "row", gap: spacing.m, width: "100%" },
  okayBtn: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 15,
    borderRadius: radius.s,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  helpBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: radius.s,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnText: { color: "#fff", fontSize: font.body - 1, fontWeight: fontWeight.bold },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.l },
  hint: { flex: 1, fontSize: font.micro, color: colors.textFaint, lineHeight: 16 },
  sendingWrap: { alignItems: "center", gap: spacing.m, paddingVertical: spacing.xl },
  sendingText: { fontSize: font.title, fontWeight: fontWeight.bold, color: colors.text },
  sendingHint: { fontSize: font.small, color: colors.textMuted, textAlign: "center" },
  sentWrap: { alignItems: "center", gap: spacing.m, paddingVertical: spacing.l },
  sentIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(3),
  },
  sentTitle: { fontSize: font.titleMd, fontWeight: fontWeight.bold, color: colors.text, letterSpacing: -0.3 },
  sentText: {
    fontSize: font.small,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
  },
});
