import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { getFirstAidSkills } from "../../api/auth";
import { colors, spacing, radius, font, fontWeight, shadow } from "../../theme";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function Brand({ compact = false, style }: { compact?: boolean; style?: object }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: spacing.s }, style]}>
      <Ionicons name="medkit" size={compact ? 22 : 28} color={colors.primary} />
      <View>
        <Text style={[styles.brandName, compact && { fontSize: font.titleMd }]}>
          Crash<Text style={{ color: colors.primary }}>Care</Text>
        </Text>
        {!compact && <Text style={styles.brandTagline}>Driver safety</Text>}
      </View>
    </View>
  );
}

export default function RegisterScreen({ navigation }: any) {
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [bloodType, setBloodType] = useState<string | null>(null);
  const [emergencyContact, setEmergencyContact] = useState("");
  const [canAid, setCanAid] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const DEFAULT_SKILLS = [
    "CPR",
    "Wound care",
    "Bleeding control",
    "Burns treatment",
    "Fracture immobilization",
    "Choking relief",
    "Shock management",
    "AED use",
    "Basic life support",
  ];
  const [availableSkills, setAvailableSkills] = useState<string[]>(DEFAULT_SKILLS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFirstAidSkills()
      .then((s) => {
        if (Array.isArray(s) && s.length > 0) setAvailableSkills(s);
      })
      .catch(() => {
        // keep default list so skills still appear offline
      });
  }, []);

  function toggleSkill(skill: string) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  async function handleRegister() {
    if (!fullName.trim()) return setError("Full name is required.");
    if (!emailOrPhone.trim()) return setError("Email or phone is required.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setError(null);
    setSubmitting(true);
    try {
      await signUp({
        full_name: fullName.trim(),
        email_or_phone: emailOrPhone.trim(),
        password,
        password_confirmation: confirm,
        blood_type: bloodType,
        emergency_contact: emergencyContact.trim() || null,
        can_provide_first_aid: canAid,
        first_aid_skills: canAid ? skills : [],
      });
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail || e?.message || "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar: back + compact brand */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.iconButton} hitSlop={6}>
            <Ionicons name="arrow-forward" size={20} color={colors.navy} style={{ transform: [{ rotate: "180deg" }] }} />
          </TouchableOpacity>
          <Brand compact />
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.card}>
<Text style={styles.heading}>Create your safety account</Text>
          <Text style={styles.intro}>
            Set up the essentials we may need in an emergency.
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.primaryDark} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Section 1 — Account */}
          <View style={styles.formSection}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>1</Text></View>
              <View>
                <Text style={styles.sectionTitle}>Account</Text>
                <Text style={styles.sectionSub}>Your sign-in information</Text>
              </View>
            </View>

            <Text style={styles.label}>Full name</Text>
            <View style={[styles.field, styles.fieldStart]}>
              <Ionicons name="person-outline" size={19} color="#8B99A6" />
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor="#A3ADB7"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <Text style={styles.label}>Email or phone</Text>
            <View style={[styles.field, styles.fieldStart]}>
              <Ionicons name="mail-outline" size={19} color="#8B99A6" />
              <TextInput
                style={styles.input}
                placeholder="you@example.com or +1234…"
                placeholderTextColor="#A3ADB7"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={[styles.field, styles.fieldStart]}>
              <Ionicons name="lock-closed-outline" size={19} color="#8B99A6" />
              <TextInput
                style={styles.input}
                placeholder="Password · 6+ characters"
                placeholderTextColor="#A3ADB7"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Text style={styles.label}>Confirm password</Text>
            <View style={[styles.field, styles.fieldStart]}>
              <Ionicons name="shield-checkmark-outline" size={19} color="#8B99A6" />
              <TextInput
                style={styles.input}
                placeholder="Repeat password"
                placeholderTextColor="#A3ADB7"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
              />
            </View>
          </View>

          {/* Section 2 — Safety profile */}
          <View style={styles.formSection}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>2</Text></View>
              <View>
                <Text style={styles.sectionTitle}>Safety profile</Text>
                <Text style={styles.sectionSub}>Information for emergency response</Text>
              </View>
            </View>

            <Text style={styles.label}>Blood type</Text>
            <View style={styles.chipGrid}>
              {BLOOD_TYPES.map((bt) => {
                const selected = bloodType === bt;
                return (
                  <TouchableOpacity
                    key={bt}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setBloodType(selected ? null : bt)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{bt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: spacing.l }]}>Emergency contact</Text>
            <View style={[styles.field, styles.fieldStart]}>
              <Ionicons name="call-outline" size={19} color="#8B99A6" />
              <TextInput
                style={styles.input}
                placeholder="Name and phone number"
                placeholderTextColor="#A3ADB7"
                value={emergencyContact}
                onChangeText={setEmergencyContact}
              />
            </View>

            {/* First-aid switch row */}
            <View style={styles.switchRow}>
              <View style={styles.switchIconWrap}>
                <Ionicons name="medkit" size={17} color={colors.successDark} />
              </View>
              <View style={{ flex: 1, paddingRight: spacing.s }}>
                <Text style={styles.switchTitle}>I have first-aid training</Text>
                <Text style={styles.switchHint}>Let others know you may be able to help</Text>
              </View>
              <Switch
                value={canAid}
                onValueChange={setCanAid}
                trackColor={{ true: colors.successDark, false: "#CBD3D8" }}
                thumbColor="#fff"
                ios_backgroundColor="#CBD3D8"
              />
            </View>

            {canAid ? (
              <View style={{ marginTop: spacing.l }}>
                <Text style={styles.label}>Your skills</Text>
                <View style={styles.skillRow}>
                  {availableSkills.map((skill) => {
                    const selected = skills.includes(skill);
                    return (
                      <TouchableOpacity
                        key={skill}
                        style={[styles.skill, selected && styles.skillSelected]}
                        onPress={() => toggleSkill(skill)}
                        activeOpacity={0.8}
                      >
                        {selected ? <Ionicons name="checkmark" size={13} color={colors.primary} /> : null}
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{skill}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {submitting ? "Creating account…" : "Create account"}
            </Text>
            {!submitting && <Ionicons name="arrow-forward" size={18} color="#fff" />}
          </TouchableOpacity>

          <Text style={styles.terms}>By continuing, you agree to our Terms and Privacy Policy.</Text>

          <Text style={styles.footer}>
            Already have an account?{" "}
            <Text style={styles.footerLink} onPress={() => navigation.navigate("Login")}>
              Sign in
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFF5F7" },
  glow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "#DCECF1",
    top: -200,
    right: -130,
  },
  content: { padding: spacing.l, paddingTop: spacing.xl },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.l,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  brandName: { fontSize: 26, fontWeight: fontWeight.bold, color: colors.navy, letterSpacing: -1 },
  brandTagline: {
    fontSize: 10,
    color: "#81909D",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 1,
  },
  card: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E8ECEE",
    borderRadius: radius.xl,
    padding: spacing.xxl,
    ...shadow(3),
  },
  heading: { fontSize: font.titleLg, fontWeight: fontWeight.bold, color: colors.navy, letterSpacing: -0.8, marginTop: 6 },
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
  formSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.l,
    borderTopWidth: 1,
    borderTopColor: "#EDF0F2",
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.m, marginBottom: spacing.m },
  sectionBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#EDF4F7",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBadgeText: { color: colors.info, fontWeight: fontWeight.bold, fontSize: font.micro },
  sectionTitle: { fontSize: font.title - 1, fontWeight: fontWeight.bold, color: colors.navy, letterSpacing: -0.3 },
  sectionSub: { fontSize: font.micro, color: "#8B98A5", marginTop: 1 },
  label: { fontSize: 12, fontWeight: fontWeight.bold, color: "#536376", marginTop: spacing.m },
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
  fieldStart: { alignSelf: "stretch" },
  input: { flex: 1, color: colors.navy, fontSize: font.body - 1, paddingVertical: 0 },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s,
    marginTop: 7,
  },
  chip: {
    width: "23%",
    minWidth: 62,
    borderWidth: 1,
    borderColor: "#E0E5E8",
    borderRadius: 11,
    paddingVertical: 10,
    backgroundColor: "#FAFBFB",
    alignItems: "center",
  },
  chipSelected: { backgroundColor: colors.primarySoft, borderColor: "#EFADB2" },
  chipText: { fontSize: 12, fontWeight: fontWeight.bold, color: "#5F6E7D" },
  chipTextSelected: { color: colors.primary },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 7 },
  skill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#E0E5E8",
    borderRadius: 11,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#FAFBFB",
  },
  skillSelected: { backgroundColor: colors.primarySoft, borderColor: "#EFADB2" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.l,
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#F4F8F9",
  },
  switchIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#E3F1ED",
    alignItems: "center",
    justifyContent: "center",
  },
  switchTitle: { fontSize: 12, fontWeight: fontWeight.bold, color: colors.text },
  switchHint: { fontSize: 10, color: "#86939E", marginTop: 2 },
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
  primaryBtnText: { color: "#fff", fontSize: font.body - 1, fontWeight: fontWeight.bold },
  terms: { textAlign: "center", color: "#98A2AC", fontSize: font.micro, marginTop: spacing.m },
  footer: { textAlign: "center", color: "#8995A0", fontSize: font.small, marginTop: spacing.m },
  footerLink: { color: colors.primary, fontWeight: fontWeight.bold },
});
