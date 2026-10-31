import React, { useMemo, useState, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useCars } from "../../context/CarsContext";
import { sendWebSocket } from "../../services/websocket";
import MapFrame from "../../components/MapFrame";
import { colors, spacing, radius, font, fontWeight, shadow } from "../../theme";

type Coord = { latitude: number; longitude: number };
type TruckParam = { name?: string; phone?: string; latitude: number; longitude: number };

export default function MapScreen() {
  const { cars, loading: carsLoading } = useCars();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const crashLocation: Coord | undefined = route.params?.crashLocation;
  const crashUser: string | undefined = route.params?.crashUser;
  const truck: TruckParam | undefined = route.params?.truck;

  const [userLocation, setUserLocation] = useState<Coord | null>(null);
  const [locLoading, setLocLoading] = useState(true);
  const [helping, setHelping] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") throw new Error("permission denied");
        const pos = await Location.getCurrentPositionAsync({});
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch {
        // Emulator fallback
        setUserLocation({ latitude: 37.7649, longitude: -122.4294 });
      } finally {
        setLocLoading(false);
      }
    })();
  }, []);

  function handleConfirmHelp() {
    sendWebSocket({ type: "first_aid_accept", message: "A first aid provider is going to help" });
    setHelping(true);
  }

  const html = useMemo(() => {
    const config = encodeURIComponent(JSON.stringify({ cars, crashLocation, userLocation, crashUser, truck }));
    return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <style>
    html,body,#map{height:100%;margin:0}
    .marker{width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:grid;place-items:center;border:3px solid white;box-shadow:0 3px 10px #15283f55}
    .marker i{transform:rotate(45deg);color:#fff;font:700 12px Arial}
    .car{background:#1C3857}
    .crash{background:#D8343F}
    .user{background:#287AA8}
    .truck{background:#2A9A72;border-radius:50%}
    .truck i{font-size:11px}
    .leaflet-control-attribution{font-size:8px}
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var config = JSON.parse(decodeURIComponent("${config}"));
    var cars = config.cars || [];
    var crash = config.crashLocation || null;
    var user = config.userLocation || null;
    var truck = config.truck || null;

    var center = crash ? [crash.latitude, crash.longitude]
      : user ? [user.latitude, user.longitude]
      : truck ? [truck.latitude, truck.longitude]
      : cars[0] ? [cars[0].latitude, cars[0].longitude]
      : [40.741, -73.99];

    var map = L.map('map',{zoomControl:false}).setView(center,13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'\\u00a9 OpenStreetMap'}).addTo(map);
    var icon = function(c, label){
      return L.divIcon({className:'',html:'<div class="marker '+c+'"><i>'+label+'</i></div>',iconSize:[34,34],iconAnchor:[17,34]});
    };
    cars.forEach(function(car){
      L.marker([car.latitude, car.longitude],{icon:icon('car','C')}).addTo(map);
    });
    if (user) L.marker([user.latitude, user.longitude],{icon:icon('user','●')}).addTo(map);
    if (crash) L.marker([crash.latitude, crash.longitude],{icon:icon('crash','!')}).addTo(map).openPopup();

    // Truck marker (followed live as it approaches)
    var truckMarker = null, truckName = 'Troubleshoot truck';
    if (truck){
      truckName = truck.name || truckName;
      truckMarker = L.marker([truck.latitude, truck.longitude],{icon:icon('truck','T'),zIndexOffset:1000}).addTo(map);
      truckMarker.bindTooltip(truckName + ' — on the way',{direction:'top',offset:[0,-36]});
    }

    // Route endpoints (real roads via OSRM, dashed fallback).
    // Truck route (green) takes precedence when a truck is assigned to this user.
    var start = null, end = null, routeColor = '#247DA8';
    if (truck && user){ start = {latitude:truck.latitude, longitude:truck.longitude}; end = user; routeColor = '#2A9A72'; }
    else if (user && crash){ start = user; end = crash; routeColor = '#D8343F'; }
    else if (crash && cars[0]){ start = {latitude:cars[0].latitude, longitude:cars[0].longitude}; end = crash; routeColor = '#D8343F'; }
    else if (cars.length >= 2){ start = {latitude:cars[0].latitude, longitude:cars[0].longitude}; end = {latitude:cars[1].latitude, longitude:cars[1].longitude}; }
    var fallbackLine = start && end
      ? L.polyline([[start.latitude,start.longitude],[end.latitude,end.longitude]],{color:'#9CA3AF',weight:3,opacity:.55,dashArray:'7 7'}).addTo(map)
      : null;

    if (start && end){
      fetch('https://router.project-osrm.org/route/v1/driving/'+start.longitude+','+start.latitude+';'+end.longitude+','+end.latitude+'?overview=full&geometries=geojson')
        .then(function(r){ return r.json(); })
        .then(function(j){
          if (j.routes && j.routes[0]){
            var coords = j.routes[0].geometry.coordinates.map(function(c){ return [c[1], c[0]]; });
            if (fallbackLine) fallbackLine.remove();
            L.polyline(coords,{color:routeColor,weight:5,opacity:.9,dashArray:'10 8',lineCap:'round'}).addTo(map);

            // Animate the truck along the route as it approaches, keeping the map centered on it
            if (truckMarker && coords.length > 1){
              var totalTicks = 90, segs = coords.length - 1, tick = 0;
              truckMarker.setLatLng(coords[0]);
              var timer = setInterval(function(){
                tick += 1;
                var p = Math.min(tick / totalTicks, 1);
                var target = p * segs;
                var i = Math.min(Math.floor(target), segs - 1);
                var frac = target - i;
                var lat = coords[i][0] + (coords[i+1][0] - coords[i][0]) * frac;
                var lng = coords[i][1] + (coords[i+1][1] - coords[i][1]) * frac;
                truckMarker.setLatLng([lat, lng]);
                map.panTo([lat, lng], {animate: false});
                if (p >= 1){
                  clearInterval(timer);
                  truckMarker.getTooltip().setContent(truckName + ' — arrived');
                }
              }, 500);
            }
          }
        })
        .catch(function(){ /* dashed fallback stays */ });
    }
  </script>
</body>
</html>`;
  }, [cars, crashLocation, crashUser, userLocation, truck]);

  if (carsLoading || locLoading) {
    return (
      <View style={styles.center}>
        <View style={loadingStyles.spinnerWrap}>
          <Ionicons name="location" size={24} color={colors.primary} />
        </View>
        <Text style={loadingStyles.title}>Finding your location</Text>
        <Text style={loadingStyles.subtitle}>Connecting to nearby vehicles…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* White header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.l }]}>
        <Text style={styles.headerTitle}>Safety map</Text>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapWrap}>
        <MapFrame html={html} />

        {/* Legend (colored dots like the reference) */}
        <View style={styles.legend}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: "#287AA8" }]} />
            <Text style={styles.legendText}>You</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.navy }]} />
            <Text style={styles.legendText}>Car</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Incident</Text>
          </View>
          {truck ? (
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: "#2A9A72" }]} />
              <Text style={styles.legendText}>Truck</Text>
            </View>
          ) : null}
        </View>

        {/* Confirm help CTA above the map when heading to a crash */}
        {crashLocation ? (
          helping ? (
            <View style={[styles.helpBar, styles.helpBarDone, { bottom: 86 }]}>
              <Ionicons name="checkmark-circle" size={17} color={colors.success} />
              <Text style={[styles.helpBarText, { color: colors.successDark }]}>
                You&apos;re helping — the crash user was notified
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.helpBar, { bottom: 86 }]}
              onPress={handleConfirmHelp}
              activeOpacity={0.85}
            >
              <Ionicons name="medkit" size={17} color="#fff" />
              <Text style={[styles.helpBarText, { color: "#fff" }]}>Confirm I&apos;m going to help</Text>
            </TouchableOpacity>
          )
        ) : null}

        {/* Bottom incident info card */}
        {!crashLocation ? (
          <View style={[styles.mapInfo, { bottom: insets.bottom + 14 }]}>
            <View style={[styles.incidentIcon, { backgroundColor: "#EAF2F5" }]}>
              <Ionicons name="map" size={20} color={colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoEyebrow}>{cars.length} VEHICLES TRACKED</Text>
              <Text style={styles.infoTitle}>Live map</Text>
              <Text style={styles.infoSub}>
                {cars.reduce((n, c) => n + c.devices.filter((d) => d.connected).length, 0)} care devices report their position live
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF3F1", gap: 3 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: font.titleXl, fontWeight: fontWeight.bold, color: colors.navy, letterSpacing: -0.8 },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5EF",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: radius.full,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#28A677" },
  liveText: { fontSize: 9, fontWeight: fontWeight.bold, color: "#277A5E" },
  mapWrap: { flex: 1, backgroundColor: "#DFE8E4", overflow: "hidden" },
  legend: {
    position: "absolute",
    top: 15,
    left: 15,
    flexDirection: "row",
    gap: 11,
    backgroundColor: "#fff",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    ...shadow(2),
  },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 9, fontWeight: fontWeight.bold, color: "#627483" },
  helpBar: {
    position: "absolute",
    left: 15,
    right: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 44,
    backgroundColor: colors.primary,
    borderRadius: 14,
    ...shadow(3),
  },
  helpBarDone: { backgroundColor: colors.successSoft },
  helpBarText: { fontSize: font.body - 2, fontWeight: fontWeight.bold },
  mapInfo: {
    position: "absolute",
    left: 15,
    right: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    ...shadow(3),
  },
  incidentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FAE8E9",
    alignItems: "center",
    justifyContent: "center",
  },
  infoEyebrow: { fontSize: 8, color: colors.primary, fontWeight: fontWeight.bold, letterSpacing: 1 },
  infoTitle: { fontSize: font.body - 3, fontWeight: fontWeight.bold, color: colors.navy, marginTop: 2 },
  infoSub: { fontSize: 9, color: "#7F8B95", marginTop: 2 },
  infoChevron: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#EDF2F4",
    alignItems: "center",
    justifyContent: "center",
  },
});

const loadingStyles = StyleSheet.create({
  spinnerWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.m,
    ...shadow(2),
  },
  title: { fontSize: font.body, fontWeight: fontWeight.bold, color: colors.navy },
  subtitle: { fontSize: font.micro, color: "#84919A" },
});
