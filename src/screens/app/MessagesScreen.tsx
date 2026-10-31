import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { connectWebSocket, sendWebSocket, onWebSocketMessage, isWebSocketConnected } from "../../services/websocket";
import { colors, spacing, radius, font, fontWeight, shadow } from "../../theme";

type Msg = {
  type?: string;
  message?: string;
  text?: string;
  from?: string;
  latitude?: number;
  longitude?: number;
  user?: string;
  ts?: number;
};

function initials(name?: string): string {
  if (!name) return "CC";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function clock(ts?: number): string {
  if (!ts) return "Just now";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function MessagesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(isWebSocketConnected());

  useEffect(() => {
    connectWebSocket();
    const unsub = onWebSocketMessage((msg) => {
      setMessages((prev) => [...prev, { ...msg, ts: Date.now() }]);
      setConnected(true);
    });
    const interval = setInterval(() => setConnected(isWebSocketConnected()), 1000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  function send() {
    if (!input.trim()) return;
    const payload = { type: "message", message: input.trim(), from: "mobile" };
    sendWebSocket(payload);
    setMessages((prev) => [...prev, { ...payload, from: "me", ts: Date.now() }]);
    setInput("");
  }

  function openOnMap(msg: Msg) {
    (navigation as any).navigate("Map", {
      crashLocation: { latitude: msg.latitude, longitude: msg.longitude },
      crashUser: msg.user,
    });
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", default: undefined })}
        keyboardVerticalOffset={Platform.OS === "ios" ? 78 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.l }]}>
          <TouchableOpacity
            style={styles.backButton}
            hitSlop={6}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={colors.navy} />
          </TouchableOpacity>
            <Text style={styles.headerTitle}>Incident feed</Text>
          <View style={[styles.connection, connected ? {} : styles.connectionOff]}>
            <View style={[styles.connectionDot, { backgroundColor: connected ? "#2AA176" : "#D79B43" }]} />
            <Text style={[styles.connectionText, !connected && { color: "#A06620" }]}>
              {connected ? "Connected" : "Connecting…"}
            </Text>
          </View>
        </View>

        <FlatList
          style={{ flex: 1 }}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            messages.length ? (
              <View style={styles.feedDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Today</Text>
                <View style={styles.dividerLine} />
              </View>
            ) : undefined
          }
          renderItem={({ item }: { item: Msg; index: number }) => {
            const isRequest = item.type === "first_aid_request";
            const isMine = item.from === "me";
            const body = item.message ?? item.text ?? JSON.stringify(item);

            // First-aid request → event card
            if (isRequest) {
              return (
                <TouchableOpacity style={styles.eventCard} activeOpacity={0.85} onPress={() => openOnMap(item)}>
                  <View style={styles.eventTop}>
                    <View style={styles.eventIcon}>
                      <Ionicons name="medkit" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventEyebrow}>First-aid request</Text>
                      <Text style={styles.eventTitle}>Help needed nearby{item.user ? ` · ${item.user}` : ""}</Text>
                    </View>
                    <Text style={styles.eventTime}>{clock(item.ts)}</Text>
                  </View>
                  <Text style={styles.eventBody}>{body}</Text>
                  <View style={styles.eventPlace}>
                    <Ionicons name="location" size={15} color="#6B7985" />
                    <Text style={styles.eventPlaceText}>
                      {item.latitude ? `${item.latitude.toFixed(3)}, ${item.longitude?.toFixed(3)}` : "Tap to open"}
                    </Text>
                    <Text style={styles.eventPlaceAction}>View on map ▸</Text>
                  </View>
                </TouchableOpacity>
              );
            }

            // Crash detection → broadcast-style sender
            const isSystem = !isMine && !item.from;

            if (isMine) {
              return (
                <View style={[styles.row, styles.rowMine]}>
                  <View style={{ maxWidth: "85%" }}>
                    <View style={styles.bubbleMine}>
                      <Text style={styles.bubbleMineText}>{body}</Text>
                    </View>
                    <Text style={[styles.bubbleTime, { textAlign: "right" }]}>
                      {clock(item.ts)} · Delivered
                    </Text>
                  </View>
                </View>
              );
            }

            return (
              <View style={styles.row}>
                <View style={[styles.miniAvatar, isSystem ? { backgroundColor: colors.navy } : { backgroundColor: "#2B876B" }]}>
                  <Text style={styles.miniAvatarText}>{isSystem ? "CC" : initials(item.user ?? "Responder")}</Text>
                </View>
                <View style={{ maxWidth: "80%" }}>
                  <Text style={styles.sender}>
                    {isSystem ? "CrashCare response" : `${initials(item.user ?? "Responder")} · Responder`}
                  </Text>
                  <View style={styles.bubbleIncoming}>
                    <Text style={styles.bubbleIncomingText}>{body}</Text>
                  </View>
                  <Text style={styles.bubbleTime}>{clock(item.ts)}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="airplane" size={34} color="#A8B4BF" />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySub}>
                Send a message or wait for incident broadcasts from the channel.
              </Text>
            </View>
          }
        />

        {/* Composer */}
        <View style={[styles.composerRow, { paddingBottom: insets.bottom + spacing.m }]}>
          <View style={styles.composer}>
            <TextInput
              style={styles.composerInput}
              placeholder="Message the response group…"
              placeholderTextColor="#9AA3AC"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.composerSend, !input.trim() && { opacity: 0.5 }]}
              onPress={send}
              disabled={!input.trim()}
              activeOpacity={0.85}
            >
              <Ionicons name="paper-plane" size={17} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSoft },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: font.titleXl, fontWeight: fontWeight.bold, color: colors.navy, letterSpacing: -0.8 },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5EAED",
    alignItems: "center",
    justifyContent: "center",
  },
  connection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E9F5F0",
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: radius.full,
  },
  connectionOff: { backgroundColor: "#FCF0DF" },
  connectionDot: { width: 5, height: 5, borderRadius: 3 },
  connectionText: { fontSize: 9, fontWeight: fontWeight.bold, color: "#267D60" },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.l },
  feedDivider: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6, marginBottom: spacing.l },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E9EB" },
  dividerText: { fontSize: 11, color: "#768390", fontWeight: fontWeight.semibold },
  eventCard: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderWidth: 1,
    borderColor: "#F0D4D6",
    borderRadius: 17,
    padding: 15,
    marginBottom: spacing.s,
    ...shadow(2),
  },
  eventTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FAE8E9",
    alignItems: "center",
    justifyContent: "center",
  },
  eventEyebrow: { fontSize: 10, fontWeight: fontWeight.semibold, color: colors.primary },
  eventTitle: { fontSize: font.body - 2, fontWeight: fontWeight.bold, color: colors.navy, marginTop: 1 },
  eventTime: { fontSize: 8, color: "#939DA5" },
  eventBody: { fontSize: font.micro, color: "#6F7D89", lineHeight: 16, marginTop: 10 },
  eventPlace: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F7F8F8",
    padding: 9,
    borderRadius: 10,
    marginTop: 10,
  },
  eventPlaceText: { fontSize: 10, color: "#6B7985", flex: 1 },
  eventPlaceAction: { fontSize: 9, color: colors.primary, fontWeight: fontWeight.bold },
  row: { flexDirection: "row", gap: 8, marginBottom: 14, alignItems: "flex-end" },
  rowMine: { justifyContent: "flex-end", flexDirection: "row" },
  miniAvatar: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  miniAvatarText: {
    color: "#fff",
    fontSize: 7,
    fontWeight: fontWeight.bold,
  },
  sender: { fontSize: 8, color: "#71808D", fontWeight: fontWeight.bold, marginBottom: 3 },
  bubbleIncoming: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E7EA",
    borderBottomLeftRadius: 4,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bubbleIncomingText: { color: "#405164", fontSize: font.small - 1, lineHeight: 18 },
  bubbleMine: {
    backgroundColor: colors.navy,
    borderBottomRightRadius: 4,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bubbleMineText: { color: "#fff", fontSize: font.small - 1, lineHeight: 18 },
  bubbleTime: { fontSize: 8, color: "#9AA3AA", marginTop: 4 },
  emptyWrap: { alignItems: "center", gap: 5, paddingTop: 60 },
  emptyTitle: { fontSize: font.title, fontWeight: fontWeight.bold, color: colors.text },
  emptySub: { fontSize: font.small, color: colors.textMuted, textAlign: "center", maxWidth: 240, lineHeight: 18 },
  composerRow: { paddingHorizontal: spacing.l },
  composer: {
    height: 52,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DFE5E9",
    borderRadius: 27,
    paddingLeft: 17,
    paddingRight: 6,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    ...shadow(2),
  },
  composerInput: { flex: 1, fontSize: font.small, color: colors.navy },
  composerSend: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
