import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCars } from "../../context/CarsContext";
import { CareDevice } from "../../api/cars";
import { colors, spacing, radius, font, fontWeight, shadow } from "../../theme";
import { ProgressBar } from "../../components/ui";

const CAR_COLORS = ["#1C3857", "#CC323C", "#2E6E6A", "#7A4E2D", "#4A3F69", "#276F94"];

function timeAgo(ts: string | number): string {
  const diff = Math.max(0, Date.now() - new Date(ts).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  return `${Math.floor(hr / 24)} d ago`;
}

function batteryColor(level: number, connected: boolean): string {
  if (!connected) return "#909AA2";
  if (level > 50) return colors.success;
  if (level > 20) return colors.warning;
  return colors.primary;
}

export default function DevicesScreen() {
  const insets = useSafeAreaInsets();
  const { cars, loading, reload } = useCars();

  useEffect(() => {
    void reload();
  }, [reload]);

  const totalDevices = cars.reduce(
    (n, c) =>
      n +
      c.devices.reduce(
        (m, d) => m + (d.children && d.children.length ? d.children.length : 1),
        0
      ),
    0
  );
  const totalOnline = cars.reduce(
    (n, c) =>
      n +
      c.devices.reduce(
        (m, d) =>
          m +
          (d.children && d.children.length
            ? d.children.filter((x) => x.connected).length
            : d.connected
            ? 1
            : 0),
        0
      ),
    0
  );

  function addCar() {
    Alert.alert(
      "Add car",
      "Vehicle pairing is coming soon — new cars appear here automatically."
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>My cars</Text>
        <TouchableOpacity style={styles.refresh} activeOpacity={0.8} onPress={() => void reload()}>
          <Ionicons name="refresh" size={18} color={colors.navy} />
        </TouchableOpacity>
      </View>
      <Text style={styles.intro}>Cars and sensor health, all in one place.</Text>

      {/* Summary strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Ionicons name="car-sport-outline" size={19} color="#287295" />
          <View>
            <Text style={styles.summaryStrong}>{cars.length}</Text>
            <Text style={styles.summaryLabel}>vehicles</Text>
          </View>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="wifi" size={19} color="#287295" />
          <View>
            <Text style={styles.summaryStrong}>
              {totalOnline} of {totalDevices}
            </Text>
            <Text style={styles.summaryLabel}>sensors online</Text>
          </View>
        </View>
      </View>

      {loading && !cars.length ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.info} />
      ) : null}

      {/* Car cards — everything lives on the card */}
      <View style={{ gap: 13 }}>
        {cars.map((car, idx) => {
          const allLeaf = car.devices.flatMap((d) =>
            d.children && d.children.length ? d.children : [d]
          );
          const online = allLeaf.filter((d) => d.connected).length;
          const ratio = allLeaf.length
            ? Math.round((online / allLeaf.length) * 100)
            : 0;
          const allOk = car.devices.length > 0 && online === car.devices.length;
          const tint = CAR_COLORS[idx % CAR_COLORS.length];
          return (
            <View key={car.id} style={styles.carCard}>
              {/* Car identity */}
              <View style={styles.carHeader}>
                <View style={[styles.carThumb, { backgroundColor: tint }]}>
                  <Ionicons name="car-sport" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.carName} numberOfLines={1}>
                    {car.name}
                  </Text>
                  <Text style={styles.carModel} numberOfLines={1}>
                    {car.model || "—"}
                  </Text>
                </View>
                {/* Matriculation number */}
                <View style={styles.plate}>
                  <Text style={styles.plateText}>{car.plate}</Text>
                </View>
              </View>

              {/* Health line */}
              <View style={styles.healthRow}>
                <Text style={styles.healthText}>
                  {allOk
                    ? "All care devices online"
                    : `${car.devices.length - online} device${
                        car.devices.length - online === 1 ? "" : "s"
                      } disconnected`}
                </Text>
                <Text style={styles.healthPct}>{ratio}%</Text>
              </View>
              <ProgressBar
                progress={ratio / 100}
                color={allOk ? "#2A9A72" : colors.primary}
                height={4}
              />

              {/* Care device status list */}
              <View style={styles.deviceList}>
                {car.devices
                  .filter((d) => !d.parent_id)
                  .map((d) =>
                    d.children && d.children.length ? (
                      <BlackBoxBlock key={d.id} box={d} />
                    ) : (
                      <DeviceStatusRow key={d.id} d={d} />
                    )
                  )}
                {!car.devices.length ? (
                  <Text style={styles.noDevices}>No care devices paired yet.</Text>
                ) : null}
              </View>
            </View>
          );
        })}

        {!loading && !cars.length ? (
          <View style={styles.emptyCard}>
            <Ionicons name="car-sport-outline" size={34} color={colors.textFaint} />
            <Text style={styles.emptyTitle}>No cars yet</Text>
            <Text style={styles.emptySub}>Pair a vehicle to see its sensors here.</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.outlineButton} onPress={addCar} activeOpacity={0.8}>
        <Ionicons name="add" size={18} color="#6F7F8D" />
        <Text style={styles.outlineButtonText}>Add another car</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/** One compact row per care device: state, battery (external only), last update. */
function DeviceStatusRow({ d }: { d: CareDevice }) {
  const isExternal = d.power_source === "external";
  const online = d.connected;
  return (
    <View style={[styles.deviceRow, !online && styles.deviceRowOffline]}>
      <View
        style={[
          styles.deviceIcon,
          { backgroundColor: online ? "#E6F2EE" : "#F1F2F3" },
        ]}
      >
        <Ionicons
          name={d.icon as any}
          size={16}
          color={online ? "#267B61" : "#909AA2"}
        />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.deviceName} numberOfLines={1}>
          {d.name}
        </Text>
        <Text style={styles.deviceMeta} numberOfLines={1}>
          {online ? "Connected" : "Disconnected"} · Updated {timeAgo(d.last_update)}
        </Text>
      </View>

      {/* Charge: percentage only for external chargers */}
      {online ? (
        isExternal ? (
          <View style={styles.extCharge}>
            <Ionicons name="battery-half" size={14} color={batteryColor(d.battery, online)} />
            <Text style={[styles.deviceCharge, { color: batteryColor(d.battery, online) }]}>
              {d.battery}%
            </Text>
          </View>
        ) : (
          <View style={styles.carCharge}>
            <Ionicons name="car" size={12} color="#286D8D" />
            <Text style={styles.carChargeText}>Car</Text>
          </View>
        )
      ) : (
        <Ionicons name="close-circle" size={17} color="#B7C0C8" />
      )}
    </View>
  );
}

/** Black Box is the container of its child devices (accelerometer, gyroscope, GPS). */
function BlackBoxBlock({ box }: { box: CareDevice }) {
  const online = box.connected;
  return (
    <View style={styles.blackBox}>
      <View style={styles.blackBoxHeader}>
        <View
          style={[
            styles.deviceIcon,
            { backgroundColor: online ? "#E6F2EE" : "#F1F2F3" },
          ]}
        >
          <Ionicons
            name={box.icon as any}
            size={16}
            color={online ? "#267B61" : "#909AA2"}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.deviceName} numberOfLines={1}>
            {box.name}
          </Text>
          <Text style={styles.deviceMeta} numberOfLines={1}>
            {online ? "Connected" : "Disconnected"} · Updated{" "}
            {timeAgo(box.last_update)}
          </Text>
        </View>
        {online ? (
          box.power_source === "external" ? (
            <View style={styles.extCharge}>
              <Ionicons name="battery-half" size={14} color={batteryColor(box.battery, online)} />
              <Text
                style={[
                  styles.deviceCharge,
                  { color: batteryColor(box.battery, online) },
                ]}
              >
                {box.battery}%
              </Text>
            </View>
          ) : (
            <View style={styles.carCharge}>
              <Ionicons name="car" size={12} color="#286D8D" />
              <Text style={styles.carChargeText}>Car</Text>
            </View>
          )
        ) : (
          <Ionicons name="close-circle" size={17} color="#B7C0C8" />
        )}
      </View>

      {/* Contained devices */}
      <View style={styles.blackBoxChildren}>
        {box.children.map((child, i) => {
          const childOnline = child.connected;
          const isLast = i === box.children.length - 1;
          return (
            <View
              key={child.id}
              style={[
                styles.childRow,
                !isLast && styles.childRowDivider,
                !childOnline && styles.childRowOffline,
              ]}
            >
              <View
                style={[
                  styles.childIcon,
                  { backgroundColor: childOnline ? "#EAF4F1" : "#F1F2F3" },
                ]}
              >
                <Ionicons
                  name={child.icon as any}
                  size={13}
                  color={childOnline ? "#247E63" : "#909AA2"}
                />
              </View>
              <Text style={styles.childName} numberOfLines={1}>
                {child.name}
              </Text>
              <View style={styles.childStatus}>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: childOnline ? "#2C9A74" : "#DA9639",
                  }}
                />
                <Text
                  style={[
                    styles.childStatusText,
                    { color: childOnline ? "#278161" : "#A66524" },
                  ]}
                >
                  {childOnline ? "Online" : "Offline"}
                </Text>
              </View>
              {childOnline ? (
                child.power_source === "external" ? (
                  <View style={styles.extCharge}>
                    <Ionicons name="battery-half" size={12} color={batteryColor(child.battery, childOnline)} />
                    <Text
                      style={[
                        styles.childCharge,
                        { color: batteryColor(child.battery, childOnline) },
                      ]}
                    >
                      {child.battery}%
                    </Text>
                  </View>
                ) : (
                  <View style={styles.carCharge}>
                    <Ionicons name="car" size={11} color="#286D8D" />
                    <Text style={styles.childCarCharge}>Car</Text>
                  </View>
                )
              ) : (
                <Text style={styles.childOffline}>—</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSoft },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 28, fontWeight: fontWeight.bold, color: colors.navy, letterSpacing: -0.8 },
  refresh: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  intro: { color: "#748294", fontSize: font.body - 1, marginTop: 10 },
  summaryStrip: { flexDirection: "row", gap: spacing.m, marginTop: spacing.l, marginBottom: spacing.l },
  summaryItem: {
    flex: 1,
    backgroundColor: "#EAF2F5",
    borderRadius: 14,
    padding: spacing.m,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  summaryStrong: { fontSize: font.body - 2, fontWeight: fontWeight.bold, color: colors.navy },
  summaryLabel: { fontSize: 10, color: "#6C7B88", marginTop: 1 },
  carCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E1E7EA",
    borderRadius: 18,
    padding: spacing.m,
    ...shadow(2),
  },
  carHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  carThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  carName: { fontSize: font.title - 1, fontWeight: fontWeight.bold, color: colors.navy, letterSpacing: -0.3 },
  carModel: { fontSize: font.micro, color: "#8A96A0", marginTop: 1 },
  plate: {
    backgroundColor: colors.navySoft,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  plateText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.navy,
    letterSpacing: 1,
  },
  healthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 11,
  },
  healthText: { fontSize: 9, color: "#74828E" },
  healthPct: { fontSize: 9, fontWeight: fontWeight.bold, color: "#526473" },
  deviceList: { gap: 6, marginTop: 11 },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 46,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: "#F6F9F9",
    borderWidth: 1,
    borderColor: "#EDF1F2",
  },
  deviceRowOffline: { backgroundColor: "#FFF8F3", borderColor: "#F3E2D2" },
  deviceIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  deviceName: { fontSize: font.small - 1, fontWeight: fontWeight.bold, color: "#405164" },
  deviceMeta: { fontSize: 9, color: "#7E8D97", marginTop: 1 },
  deviceCharge: { fontSize: font.small - 1, fontWeight: fontWeight.bold },
  carCharge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#E9F1F6",
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  carChargeText: { fontSize: 9, fontWeight: fontWeight.bold, color: "#286D8D" },
  noDevices: { fontSize: font.small, color: colors.textMuted, textAlign: "center", paddingVertical: 10 },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.l,
    padding: spacing.xxl,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: { fontSize: font.title, fontWeight: fontWeight.bold, color: colors.text },
  emptySub: { fontSize: font.small, color: colors.textMuted, textAlign: "center" },
  outlineButton: {
    width: "100%",
    height: 49,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD4DA",
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 17,
    backgroundColor: "transparent",
  },
  outlineButtonText: { color: "#6F7F8D", fontSize: 12, fontWeight: fontWeight.bold },

  blackBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E3E8EB",
    borderRadius: 14,
    overflow: "hidden",
  },
  blackBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 11,
    backgroundColor: "#F4F8F9",
    borderBottomWidth: 1,
    borderBottomColor: "#E3E8EB",
  },
  blackBoxChildren: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    gap: 4,
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  childRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#EDF0F2",
  },
  childRowOffline: { opacity: 0.85 },
  childIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  childName: { flex: 1, fontSize: 11, fontWeight: fontWeight.bold, color: "#405164" },
  childStatus: { flexDirection: "row", alignItems: "center", gap: 3 },
  childStatusText: { fontSize: 9, fontWeight: fontWeight.bold },
  childCharge: { fontSize: 11, fontWeight: fontWeight.bold, minWidth: 34, textAlign: "right" },
  childCarCharge: { fontSize: 9, fontWeight: fontWeight.bold, color: "#286D8D", minWidth: 34, textAlign: "right" },
  childOffline: { fontSize: 11, color: "#B7C0C8", minWidth: 34, textAlign: "right" },

  extCharge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
});
