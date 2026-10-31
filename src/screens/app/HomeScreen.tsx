import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { useCars } from "../../context/CarsContext";
import { colors, spacing, font, fontWeight, shadow } from "../../theme";
import { ProgressBar } from "../../components/ui";
import ReportAccidentButton from "../../components/ReportAccidentButton";

const SAFE_TIPS = [
  { icon: "speedometer-outline", title: "Keep a safe distance", body: "Follow the 3-second rule and increase it in rain or fog." },
  { icon: "phone-portrait-outline", title: "Stay off the phone", body: "Put it on Do Not Disturb while driving — every second counts." },
  { icon: "shield-checkmark-outline", title: "Buckle up, everyone", body: "Seatbelts for all passengers, front and rear, every trip." },
  { icon: "construct-outline", title: "Check your car", body: "Tires, brakes and lights — inspect before every long drive." },
  { icon: "speedometer", title: "Respect speed limits", body: "Speed is the #1 factor in crash severity. Slow down." },
  { icon: "medkit-outline", title: "Know your care devices", body: "Confirm your Black Box and sensors are online before driving." },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { cars, loading } = useCars();

  const allDevices = cars.flatMap((c) =>
    c.devices.flatMap((d) => (d.children && d.children.length ? d.children : [d]))
  );
  const connected = allDevices.filter((d) => d.connected).length;
  const ratio = allDevices.length ? Math.round((connected / allDevices.length) * 100) : 0;
  const firstName = user?.full_name?.split(" ")[0] ?? "there";
  const initial = firstName.charAt(0).toUpperCase();

  function go(screen: string) {
    (navigation as any).navigate(screen);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: spacing.m }}>
          <Text style={styles.greeting}>Assalamu alaikum,</Text>
          <Text style={styles.greetingName}>{firstName}</Text>
        </View>
        <TouchableOpacity style={styles.avatar} activeOpacity={0.8} onPress={() => go("Profile")}>
          <Text style={styles.avatarText}>{initial}</Text>
        </TouchableOpacity>
      </View>

      {/* Report an accident (at the top, always one tap away) */}
      <ReportAccidentButton
        latitude={cars[0]?.latitude}
        longitude={cars[0]?.longitude}
      />

      {/* Quran verse */}
      <View style={styles.ayahCard}>
        <View style={{ flexDirection: "row" , alignItems: "center", gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ayahText}>
              وَمَنْ <Text style={styles.ayahHighlight}>أحياها</Text> فَكَأَنَّمَا أَحْيَا النَّاسَ جَمِيعًا
            </Text>
            <Text style={styles.ayahRef}>سورة المائدة · الآية ٣٢</Text>
          </View>
          <View style={styles.ayahMark} />
        </View>
      </View>

      {/* Status card */}
      <View style={styles.heroCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
          <View style={styles.heroIcon}>
            <Ionicons name="shield" size={24} color="#fff" />
            <View style={styles.heroIconBadge}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Protection active</Text>
            <Text style={styles.heroSub}>
              {loading ? "Checking devices…" : `${connected} of ${allDevices.length} devices connected`}
            </Text>
          </View>
          <View style={styles.statusDot} />
        </View>
      </View>

      {/* Devices summary */}
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Devices</Text>
        <TouchableOpacity onPress={() => go("Cars")} hitSlop={6}>
          <Text style={styles.viewAllLink}>View all</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.overviewCard}>
        <View style={styles.overviewTop}>
          <View style={styles.carThumb}>
            <Ionicons name="car-sport-outline" size={26} color={colors.navy} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.overviewTitle}>
              {connected} of {allDevices.length} online
            </Text>
            <Text style={styles.overviewSub}>{cars.length} {cars.length === 1 ? "car" : "cars"} paired</Text>
          </View>
          <Text style={[styles.overviewPct, { color: colors.info }]}>{ratio}%</Text>
        </View>
        <ProgressBar progress={ratio / 100} color={colors.info} height={6} />
        <View style={styles.overviewFooter}>
          <View style={styles.footerDot}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={styles.footerDotText}>{connected} connected</Text>
          </View>
          <View style={styles.footerDot}>
            <View style={[styles.dot, { backgroundColor: "#9DA7AD" }]} />
            <Text style={styles.footerDotText}>{allDevices.length - connected} offline</Text>
          </View>
        </View>
      </View>

      {/* Safe driving tips */}
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Safe driving tips</Text>
      </View>
      <View style={{ gap: 12 }}>
        {SAFE_TIPS.map((tip) => (
          <View key={tip.title} style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons name={tip.icon as any} size={19} color={colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <Text style={styles.tipBody}>{tip.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSoft },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl + spacing.l },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl },
  greeting: { fontSize: font.small, color: colors.textMuted },
  greetingName: { fontSize: 22, fontWeight: fontWeight.bold, color: colors.navy, marginTop: 2, letterSpacing: -0.5 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(1),
  },
  avatarText: { color: "#fff", fontSize: 17, fontWeight: fontWeight.bold },
  ayahCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E7EBEE",
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: spacing.xl,
    ...shadow(1),
  },
  ayahMark: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginVertical: 4,
  },
  ayahText: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    color: colors.navy,
    lineHeight: 40,
    textAlign: "right",
  },
  ayahHighlight: { color: colors.primary },
  ayahRef: {
    fontSize: font.micro,
    color: colors.textFaint,
    marginTop: 8,
    textAlign: "right",
  },
  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: 18,
    padding: 20,
    ...shadow(2),
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroIconBadge: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#2AB17F",
    borderWidth: 2,
    borderColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: font.body, fontWeight: fontWeight.bold, color: "#fff" },
  heroSub: { fontSize: font.small, color: "#9EB0BD", marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#39C68E" },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xxl,
    marginBottom: spacing.m,
  },
  sectionTitle: { fontSize: 17, fontWeight: fontWeight.bold, color: colors.navy, letterSpacing: -0.4 },
  viewAllLink: { fontSize: font.small, color: colors.primary, fontWeight: fontWeight.semibold },
  overviewCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E7EBEE",
    borderRadius: 16,
    padding: 16,
  },
  overviewTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  carThumb: {
    width: 48,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.navySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  overviewTitle: { fontSize: font.body, fontWeight: fontWeight.bold, color: colors.navy },
  overviewSub: { fontSize: font.micro, color: "#8B96A0", marginTop: 1 },
  overviewPct: { fontSize: font.body, fontWeight: fontWeight.bold },
  overviewFooter: { flexDirection: "row", gap: 16, marginTop: 12 },
  footerDot: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  footerDotText: { fontSize: font.micro, color: "#75828E" },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E7EBEE",
    borderRadius: 14,
    padding: 14,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.infoSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: { fontSize: font.body - 1, fontWeight: fontWeight.bold, color: colors.navy },
  tipBody: { fontSize: font.small, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
});
