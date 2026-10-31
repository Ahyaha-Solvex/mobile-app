import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  ViewStyle,
  StyleProp,
  KeyboardTypeOptions,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, font, fontWeight, shadow } from "../theme";

/* ---------------- Button ---------------- */

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "info" | "success" | "outline" | "ghost";
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled,
  loading,
  style,
}: ButtonProps) {
  const palette: Record<string, { bg: string; fg: string; border?: string; filled: boolean }> = {
    primary: { bg: colors.primary, fg: "#fff", filled: true },
    info: { bg: colors.info, fg: "#fff", filled: true },
    success: { bg: colors.success, fg: "#fff", filled: true },
    outline: { bg: "transparent", fg: colors.primary, border: colors.primary, filled: false },
    ghost: { bg: colors.primarySoft, fg: colors.primaryDark, filled: false },
  };
  const p = palette[variant];
  const isDisabled = disabled || loading;

  // Tactile press feedback (motion as trust signal)
  const scale = React.useMemo(() => new Animated.Value(1), []);
  const pressTo = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => pressTo(0.97)}
        onPressOut={() => pressTo(1)}
        disabled={isDisabled}
        activeOpacity={0.9}
        style={[
          styles.button,
          { backgroundColor: p.bg },
          p.border ? { borderWidth: 2, borderColor: p.border } : null,
          p.filled ? styles.buttonFilled : null,
          isDisabled && { opacity: 0.55 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={p.fg} size="small" />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={19} color={p.fg} /> : null}
            <Text style={[styles.buttonLabel, { color: p.fg }]}>{label}</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ---------------- Form field (input with icon) ---------------- */

type FormFieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words";
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function FormField({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize = "none",
  keyboardType,
  multiline,
  style,
}: FormFieldProps) {
  const [focused, setFocused] = React.useState(false);
  const [show, setShow] = React.useState(!secureTextEntry);
  return (
    <View style={[styles.field, focused && styles.fieldFocused, style]}>
      <Ionicons name={icon} size={19} color={focused ? colors.info : colors.textFaint} />
      <TextInput
        style={styles.fieldInput}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!show}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {secureTextEntry ? (
        <TouchableOpacity onPress={() => setShow((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={19} color={colors.textFaint} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/* ---------------- Label above fields ---------------- */

export function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {children}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

/* ---------------- Selectable chip ---------------- */

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  tone?: "primary" | "info";
};

export function Chip({ label, selected, onPress, tone = "primary" }: ChipProps) {
  const bg = tone === "primary" ? colors.primary : colors.info;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.chip, selected && { backgroundColor: bg, borderColor: bg }]}>
      {selected ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
      <Text style={[styles.chipText, selected && { color: "#fff" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ---------------- Stat tile ---------------- */

export function StatTile({
  value,
  label,
  color = colors.text,
  icon,
  style,
}: {
  value: string | number;
  label: string;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.statTile, style]}>
      {icon ? (
        <View style={styles.statIcon}>
          <Ionicons name={icon} size={13} color={color} />
        </View>
      ) : null}
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/* ---------------- Empty state ---------------- */

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={colors.textFaint} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          variant="ghost"
          onPress={onAction}
          style={{
            marginTop: spacing.m,
            height: 44,
            paddingHorizontal: spacing.xl,
            alignSelf: "center",
          }}
        />
      ) : null}
    </View>
  );
}

/* ---------------- Determinate progress bar ---------------- */

export function ProgressBar({
  progress,
  color = colors.info,
  trackColor = colors.divider,
  height = 8,
}: {
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }]}>
      <View
        style={[
          styles.trackFill,
          { width: `${clamped * 100}%`, backgroundColor: color, height: "100%" },
        ]}
      />
    </View>
  );
}

/* ---------------- Status pill ---------------- */

export function StatusPill({ connected }: { connected: boolean }) {
  const color = connected ? colors.success : colors.primary;
  return (
    <View style={[styles.pill, { backgroundColor: connected ? colors.successSoft : colors.primarySoft }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color: connected ? colors.successDark : colors.primaryDark }]}>
        {connected ? "Connected" : "Offline"}
      </Text>
    </View>
  );
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text style={styles.screenTitle}>{title}</Text>
      {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.s,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.s,
    ...shadow(3),
  },
  /** Subtle inner highlight that gives filled buttons a tactile edge. */
  buttonFilled: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.28)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  buttonLabel: { fontSize: font.body, fontWeight: fontWeight.bold },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s,
    backgroundColor: colors.surface,
    borderRadius: radius.s,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.m,
    paddingVertical: 2,
  },
  fieldFocused: { borderColor: colors.info, ...shadow(1) },
  fieldInput: { flex: 1, fontSize: font.body, color: colors.text, paddingVertical: 13, fontWeight: fontWeight.medium },
  fieldLabel: { fontSize: font.small, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: spacing.xs + 2, marginTop: spacing.m },
  required: { color: colors.primary },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.surface,
    marginBottom: spacing.s,
  },
  chipText: { fontSize: font.small, color: colors.textMuted, fontWeight: fontWeight.semibold },
  statTile: { flex: 1, alignItems: "center", gap: 2 },
  statIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  statValue: { fontSize: 18, fontWeight: fontWeight.bold },
  statLabel: { fontSize: font.micro, color: colors.textFaint, fontWeight: fontWeight.medium },
  emptyWrap: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.divider,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyTitle: { fontSize: font.body, fontWeight: fontWeight.semibold, color: colors.textMuted },
  emptySubtitle: { fontSize: font.small, color: colors.textFaint, textAlign: "center" },
  track: { borderRadius: radius.full, overflow: "hidden", flex: 1 },
  trackFill: { borderRadius: radius.full },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: font.micro, fontWeight: fontWeight.bold },
  screenTitle: { fontSize: font.titleLg, fontWeight: fontWeight.bold, color: colors.text },
  screenSubtitle: { fontSize: font.small, color: colors.textMuted, marginTop: 3 },
});
