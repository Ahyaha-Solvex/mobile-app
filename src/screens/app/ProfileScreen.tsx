import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { colors, spacing, radius, font, fontWeight, shadow } from "../../theme";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  function confirmSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  }

  const initial = user?.full_name?.trim().charAt(0).toUpperCase() ?? "?";
  const firstName = user?.full_name?.split(" ")[0] ?? "Member";
  const memberSince = `Member since ${new Date().toLocaleDateString([], {
    month: "long",
    year: "numeric",
  })}`;

  const detailRows = [
    {
      bg: "#F8EBEC",
      fg: "#9E333B",
      icon: "water" as const,
      label: "Blood type",
      value: user?.blood_type || "Not provided",
    },
    {
      bg: "#E8F2F6",
      fg: "#276E8D",
      icon: "call" as const,
      label: "Emergency contact",
      value: user?.emergency_contact?.trim() ? user.emergency_contact.trim() : "Not provided",
    },
    {
      bg: "#E9F4F0",
      fg: "#28765F",
      icon: "medkit" as const,
      label: "First-aid skills",
      value: user?.first_aid_skills?.length
        ? user.first_aid_skills.join(" · ")
        : user?.can_provide_first_aid
        ? "Trained — no skills listed"
        : "Not a first-aid responder",
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.headerTitle}>Your profile</Text>

      {/* Identity */}
      <View style={styles.identity}>
        <View style={styles.largeAvatar}>
          <Text style={styles.largeAvatarText}>{initial}</Text>
          <View style={styles.avatarBadge}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        </View>
        <Text style={styles.name}>{firstName}</Text>
        <Text style={styles.email}>{user?.email_or_phone || "—"}</Text>
        {user?.can_provide_first_aid ? (
          <View style={styles.aidBadge}>
            <Ionicons name="medkit" size={14} color="#A13039" />
            <Text style={styles.aidBadgeText}>Trained first-aid responder</Text>
          </View>
        ) : null}
      </View>

      {/* Protected pill */}
      <View style={styles.protectedPill}>
        <View style={styles.protectedIcon}>
          <Ionicons name="shield" size={19} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.protectedTitle}>Protected with CrashCare</Text>
          <Text style={styles.protectedSub}>{memberSince}</Text>
        </View>
        <Ionicons name="checkmark" size={18} color="#fff" />
      </View>

      {/* Safety details */}
      <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Safety details</Text>
        <Text style={styles.editLink}>Edit</Text>
      </View>
      <View style={{ gap: 9 }}>
        {detailRows.map((row) => (
          <View key={row.label} style={[styles.detailRow, { backgroundColor: row.bg }]}>
            <View style={styles.detailRowIcon}>
              <Ionicons name={row.icon} size={18} color={row.fg} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailRowLabel}>{row.label}</Text>
              <Text style={[styles.detailRowValue, { color: row.fg }]}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={confirmSignOut} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={18} color={colors.primary} />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
      <Text style={styles.version}>CrashCare 1.0.0 · Built for safer roads</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSoft },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl + spacing.l },
  headerTitle: { fontSize: font.titleXl, fontWeight: fontWeight.bold, color: colors.navy, letterSpacing: -0.8 },
  identity: { alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.xl },
  largeAvatar: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(2),
  },
  largeAvatarText: { color: "#fff", fontSize: 29, fontWeight: fontWeight.bold },
  avatarBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2A9D75",
    borderWidth: 4,
    borderColor: colors.backgroundSoft,
  },
  name: { fontSize: font.titleMd, fontWeight: fontWeight.bold, color: colors.navy, letterSpacing: -0.4, marginTop: spacing.m },
  email: { fontSize: font.micro, color: "#84919C", marginTop: 2 },
  aidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F9E8E9",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    marginTop: 10,
  },
  aidBadgeText: { color: "#A13039", fontSize: 9, fontWeight: fontWeight.bold },
  protectedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.m,
    backgroundColor: colors.navy,
    borderRadius: 18,
    padding: 15,
  },
  protectedIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  protectedTitle: { color: "#fff", fontSize: 12, fontWeight: fontWeight.bold },
  protectedSub: { color: "#9EB1BF", fontSize: 9, marginTop: 2 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    marginBottom: spacing.m,
  },
  sectionTitle: { fontSize: 17, fontWeight: fontWeight.bold, color: colors.navy, letterSpacing: -0.4 },
  editLink: { fontSize: font.micro, color: colors.primary, fontWeight: fontWeight.bold },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.m,
    borderRadius: 15,
    padding: 13,
  },
  detailRowIcon: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailRowLabel: {
    fontSize: 8,
    color: "#73818D",
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  detailRowValue: { fontSize: font.body - 2, fontWeight: fontWeight.bold, marginTop: 3 },
  signOutBtn: {
    height: 48,
    width: "100%",
    borderWidth: 1,
    borderColor: "#EFC8CB",
    borderRadius: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: spacing.xxl,
  },
  signOutText: { color: colors.primary, fontSize: font.micro, fontWeight: fontWeight.bold },
  version: { textAlign: "center", color: "#A1A9AF", fontSize: 8, marginTop: spacing.l, fontWeight: fontWeight.semibold },
});
