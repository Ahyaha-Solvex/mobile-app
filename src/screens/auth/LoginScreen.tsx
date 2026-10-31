import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { colors, spacing, radius, font, fontWeight, shadow } from "../../theme";

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.brandWrap, compact && styles.brandCompact]}>
      <Ionicons name="medkit" size={compact ? 24 : 30} color={colors.primary} />
      <View>
        <Text style={[styles.brandName, compact && { fontSize: font.titleMd }]}>
          Crash<Text style={{ color: colors.primary }}>Care</Text>
        </Text>
        {!compact && <Text style={styles.brandTagline}>Driver safety</Text>}
      </View>
    </View>
  );
}

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!emailOrPhone.trim() || !password) {
      setError("Please enter your email/phone and password.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn(emailOrPhone.trim(), password);
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail || e?.message || "Login failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Decorative glow (as in the reference: soft teal circle top-right) */}
      <View style={styles.glow} pointerEvents="none" />
      <View style={[styles.glowAlt, { bottom: -160, left: -120 }]} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", default: undefined })}
        style={{ flex: 1 }}
      >
        <View style={[styles.inner, { paddingTop: insets.top + spacing.xxl }]}>
          <Brand />

          <View style={styles.card}>
    <Text style={styles.heading}>Sign in to stay protected</Text>
            <Text style={styles.intro}>
              Your cars, contacts and safety profile are waiting.
            </Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.primaryDark} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email / phone */}
            <Text style={styles.label}>Email or phone</Text>
            <View style={styles.field}>
              <Ionicons name="mail-outline" size={19} color="#8B99A6" />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#A3ADB7"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password */}
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <Text style={styles.forgot}>Forgot password?</Text>
            </View>
            <View style={styles.field}>
              <Ionicons name="lock-closed-outline" size={19} color="#8B99A6" />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#A3ADB7"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.fieldAction}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={19}
                  color="#8B99A6"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {submitting ? "Signing in…" : "Sign in"}
              </Text>
              {!submitting && <Ionicons name="arrow-forward" size={18} color="#fff" />}
            </TouchableOpacity>

            <Text style={styles.authLink}>
              New to CrashCare?{" "}
              <Text
                style={styles.authLinkAction}
                onPress={() => navigation.navigate("Register")}
              >
                Create one
              </Text>
            </Text>
          </View>

          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={15} color="#82909C" />
            <Text style={styles.securityNoteText}>
              Your data is encrypted and securely stored
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFF5F7" },
  glow: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 999,
    backgroundColor: "#DCECF1",
    top: -210,
    right: -140,
  },
  glowAlt: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: "#F3EEE6",
  },
  inner: {
    flex: 1,
    padding: spacing.l,
    justifyContent: "center",
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.m,
    alignSelf: "center",
    marginBottom: spacing.xxxl,
  },
  brandCompact: { marginBottom: 0 },
  brandName: {
    fontSize: 26,
    fontWeight: fontWeight.bold,
    color: colors.navy,
    letterSpacing: -1,
  },
  brandTagline: {
    fontSize: 10,
    color: "#81909D",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 1,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E8ECEE",
    borderRadius: radius.xl,
    padding: spacing.xxl,
    ...shadow(3),
  },
  heading: {
    fontSize: font.titleLg,
    fontWeight: fontWeight.bold,
    color: colors.navy,
    letterSpacing: -0.8,
    marginTop: 6,
  },
  intro: { color: "#7B8794", fontSize: font.small, lineHeight: 19, marginTop: 5 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#FFF1F1",
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.s,
    padding: spacing.m,
    marginTop: spacing.l,
  },
  errorText: { flex: 1, color: "#A92934", fontSize: font.micro, lineHeight: 17 },
  label: { fontSize: 12, fontWeight: fontWeight.bold, color: "#536376", marginTop: spacing.l },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  forgot: { fontSize: font.micro, color: colors.primary, fontWeight: fontWeight.bold },
  field: {
    height: 52,
    borderWidth: 1,
    borderColor: "#DFE5E9",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 14,
    backgroundColor: "#FBFCFC",
    marginTop: 7,
  },
  input: { flex: 1, color: colors.navy, fontSize: font.body - 1, paddingVertical: 0 },
  fieldAction: { padding: 5 },
  primaryBtn: {
    width: "100%",
    height: 53,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: spacing.xl,
    ...shadow(3),
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: font.body - 1,
    fontWeight: fontWeight.bold,
  },
  authLink: {
    textAlign: "center",
    color: "#8995A0",
    fontSize: font.small,
    marginTop: spacing.xl,
  },
  authLinkAction: { color: colors.primary, fontWeight: fontWeight.bold },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    marginTop: spacing.xl,
    marginBottom: 8,
  },
  securityNoteText: { color: "#82909C", fontSize: font.micro },
});
