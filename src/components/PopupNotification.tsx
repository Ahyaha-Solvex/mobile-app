import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, spacing, radius, font, fontWeight, shadow } from "../theme";

export type PopupVariant = "ambulance" | "firstAid" | "isolated";
type Phase = "ask" | "timer" | "tracking";

/** Attention-cycling palette for the first-aid request popup (red → orange → yellow). */
const CYCLE = ["#DC2626", "#F97316", "#EAB308"];
const YELLOW = "#EAB308";

const AUTO_CLOSE: Record<PopupVariant, number> = {
  ambulance: 8,
  firstAid: 12,
  isolated: 0, // requires an explicit Confirm / Cancel
};

const ZONE_OPTIONS = [
  { minutes: 15, label: "15 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 hr" },
  { minutes: 120, label: "2 hr" },
];

type Props = {
  visible: boolean;
  variant: PopupVariant;
  title: string;
  message: string;
  /** User chose "I can help" — opens the map at the crash location (first-aid request). */
  onCanHelp?: () => void;
  /** User picked the estimated exit time (minutes) from the isolated-area popup. */
  onConfirmZone?: (minutes: number) => void;
  onDismiss: () => void;
};

export default function PopupNotification({
  visible,
  variant,
  title,
  message,
  onCanHelp,
  onConfirmZone,
  onDismiss,
}: Props) {
  const { width } = useWindowDimensions();

  const [phase, setPhase] = useState<Phase>("ask");
  const [zoneChoice, setZoneChoice] = useState(30);
  const [cycleIdx, setCycleIdx] = useState(0);
  const [seconds, setSeconds] = useState(AUTO_CLOSE[variant]);

  const scale = useMemo(() => new Animated.Value(0.85), []);
  const opacity = useMemo(() => new Animated.Value(0), []);
  const life = useMemo(() => new Animated.Value(1), []);
  const halo = useMemo(() => new Animated.Value(0), []);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function close() {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.92, duration: 160, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onDismiss();
    });
  }

  useEffect(() => {
    if (!visible) return;

    // NOTE: the parent remounts this component per popup (via `key`), so all
    // state above starts fresh — no resets needed here.
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    // Soft attention pulse behind the icon
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, { toValue: 1, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(halo, { toValue: 0, duration: 700, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ])
    );
    haloLoop.start();

    const auto = AUTO_CLOSE[variant];
    if (auto > 0) {
      Animated.timing(life, {
        toValue: 0,
        duration: auto * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      const interval = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(interval);
            close();
            return 0;
          }
          return s - 1;
        });
      }, 1000);

      return () => {
        clearInterval(interval);
        haloLoop.stop();
        if (dismissTimer.current) clearTimeout(dismissTimer.current);
      };
    }

    // First-aid popup cycles red → orange → yellow to attract attention
    const cycle =
      variant === "firstAid"
        ? setInterval(() => setCycleIdx((i) => (i + 1) % CYCLE.length), 1200)
        : null;

    return () => {
      if (cycle) clearInterval(cycle);
      haloLoop.stop();
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, variant]);

  if (!visible) return null;

  const accent =
    variant === "firstAid" ? CYCLE[cycleIdx] : variant === "ambulance" ? "#F97316" : YELLOW;
  const onAccent = accent === YELLOW ? "#713F12" : "#fff";
  const autoClose = AUTO_CLOSE[variant];

  function confirmZone() {
    onConfirmZone?.(zoneChoice);
    setPhase("tracking");
    dismissTimer.current = setTimeout(() => close(), 2600);
  }

  function accentIcon(size = 28) {
    if (variant === "ambulance") {
      return <MaterialCommunityIcons name="ambulance" size={size + 2} color={onAccent} />;
    }
    if (variant === "firstAid") {
      return <MaterialCommunityIcons name="medical-bag" size={size} color={onAccent} />;
    }
    return <Ionicons name="warning" size={size} color={onAccent} />;
  }

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              width: Math.min(width - spacing.xl * 2, 380),
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
          {/* Attention strip — cycles color for first-aid requests */}
          <View style={[styles.strip, { backgroundColor: accent }]} />

          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={close} hitSlop={6} accessibilityLabel="Close">
            <Ionicons name="close" size={15} color={colors.textFaint} />
          </TouchableOpacity>

          {/* Icon with pulsing halo */}
          <View style={styles.iconStage}>
            <Animated.View
              style={[
                styles.halo,
                {
                  backgroundColor: accent,
                  opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
                  transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
                },
              ]}
            />
            <View style={[styles.iconWrap, { backgroundColor: accent }]}>{accentIcon()}</View>
          </View>

          <Text style={styles.title}>{title}</Text>

          {phase === "tracking" ? (
            <View style={styles.stateWrap}>
              <View style={[styles.stateIcon, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="timer" size={32} color="#B45309" />
              </View>
              <Text style={styles.stateTitle}>Exit time tracked</Text>
              <Text style={styles.stateText}>
                We&apos;ll alert your emergency contact if you&apos;re still offline after{" "}
                {ZONE_OPTIONS.find((z) => z.minutes === zoneChoice)?.label ?? `${zoneChoice} min`}.
              </Text>
            </View>
          ) : phase === "timer" ? (
            <>
              <Text style={styles.message}>
                When do you expect to leave the isolated area?
              </Text>
              <View style={styles.chipRow}>
                {ZONE_OPTIONS.map((opt) => {
                  const selected = zoneChoice === opt.minutes;
                  return (
                    <TouchableOpacity
                      key={opt.minutes}
                      style={[styles.chip, selected && { backgroundColor: accent, borderColor: accent }]}
                      onPress={() => setZoneChoice(opt.minutes)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, selected && { color: onAccent, fontWeight: fontWeight.bold }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={() => setPhase("ask")}>
                  <Text style={[styles.secondaryText, { color: colors.textMuted }]}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: accent }]} onPress={confirmZone} activeOpacity={0.85}>
                  <Ionicons name="timer-outline" size={17} color={onAccent} />
                  <Text style={[styles.primaryText, { color: onAccent }]}>Start tracking</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.message}>{message}</Text>

              {variant === "ambulance" ? (
                <TouchableOpacity style={[styles.primaryBtn, styles.fullBtn, { backgroundColor: accent }]} onPress={close} activeOpacity={0.85}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={[styles.primaryText, { color: "#fff" }]}>Got it</Text>
                </TouchableOpacity>
              ) : variant === "firstAid" ? (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { borderColor: colors.border }]}
                    onPress={close}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="close" size={16} color={colors.textMuted} />
                    <Text style={[styles.secondaryText, { color: colors.textMuted }]}>I can&apos;t help</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: accent }]}
                    onPress={() => onCanHelp?.()}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="medical-bag" size={16} color={onAccent} />
                    <Text style={[styles.primaryText, { color: onAccent }]}>I can help</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={close} activeOpacity={0.85}>
                    <Text style={[styles.secondaryText, { color: colors.textMuted }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: accent }]} onPress={() => setPhase("timer")} activeOpacity={0.85}>
                    <Ionicons name="checkmark-circle" size={17} color={onAccent} />
                    <Text style={[styles.primaryText, { color: onAccent }]}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              )}

              {variant === "isolated" ? (
                <View style={styles.hintRow}>
                  <Ionicons name="information-circle-outline" size={13} color={colors.textFaint} />
                  <Text style={styles.hint}>
                    Confirming sets an exit timer. If you&apos;re still offline after it ends, your emergency contact is alerted.
                  </Text>
                </View>
              ) : null}
            </>
          )}

          {/* Life bar for auto-closing popups */}
          {autoClose > 0 && phase === "ask" ? (
            <>
              <View style={styles.lifeTrack}>
                <Animated.View
                  style={{
                    height: "100%",
                    borderTopRightRadius: 6,
                    borderBottomRightRadius: 6,
                    backgroundColor: accent,
                    width: life.interpolate({ inputRange: [0, 1], outputRange: ["2%", "100%"] }),
                  }}
                />
              </View>
              <Text style={styles.autoText}>Closing in {seconds}s</Text>
            </>
          ) : null}
        </Animated.View>
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
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingBottom: spacing.l,
    alignItems: "center",
    overflow: "hidden",
    ...shadow(3),
  },
  strip: { width: "100%", height: 6 },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
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
  iconStage: { alignItems: "center", justifyContent: "center", marginTop: spacing.xl },
  halo: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(2),
  },
  title: {
    fontSize: font.titleMd,
    fontWeight: fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.3,
    marginTop: spacing.m,
    textAlign: "center",
    paddingHorizontal: spacing.l,
  },
  message: {
    fontSize: font.body,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginTop: spacing.xs + 2,
    marginBottom: spacing.l,
    paddingHorizontal: spacing.l,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.s,
    width: "100%",
    paddingHorizontal: spacing.l,
    marginTop: spacing.xs,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.s,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...shadow(1),
  },
  primaryText: { fontSize: font.body - 1, fontWeight: fontWeight.bold },
  fullBtn: {
    marginHorizontal: spacing.l,
    marginTop: spacing.xs,
    marginBottom: spacing.s,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.s,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryText: { fontSize: font.body - 1, fontWeight: fontWeight.bold },
  hintRow: {
    flexDirection: "row",
    gap: 5,
    alignItems: "flex-start",
    paddingHorizontal: spacing.l,
    marginTop: spacing.m,
  },
  hint: { flex: 1, fontSize: font.micro, color: colors.textFaint, lineHeight: 15 },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s,
    justifyContent: "center",
    paddingHorizontal: spacing.l,
    marginBottom: spacing.m,
  },
  chip: {
    minWidth: 74,
    minHeight: 44,
    paddingHorizontal: spacing.m,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontSize: font.small, color: colors.textMuted, fontWeight: fontWeight.semibold },
  stateWrap: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginTop: spacing.s,
    marginBottom: spacing.m,
    gap: spacing.s,
  },
  stateIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  stateTitle: { fontSize: font.title, fontWeight: fontWeight.bold, color: colors.text },
  stateText: { fontSize: font.small, color: colors.textMuted, textAlign: "center", lineHeight: 19 },
  lifeTrack: { height: 5, width: "100%", backgroundColor: colors.divider, marginTop: spacing.m },
  autoText: {
    fontSize: 10,
    color: colors.textFaint,
    fontWeight: fontWeight.medium,
    alignSelf: "flex-end",
    paddingRight: spacing.m,
    paddingVertical: 5,
  },
});
