import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const TOKEN_KEY = "carcrash_token";

function candidateBaseUrls(): string[] {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return [process.env.EXPO_PUBLIC_API_URL];
  }
  if (Platform.OS === "android") {
    // 10.0.2.2 = Android Studio emulator, 10.0.3.2 = Genymotion
    return ["http://10.0.2.2:8000", "http://10.0.3.2:8000", "http://localhost:8000"];
  }
  return ["http://localhost:8000"];
}

export const API_BASE_URL = candidateBaseUrls()[0];

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

let resolvedBaseUrl: string | null = null;
let resolving: Promise<string> | null = null;

export async function resolveApiBaseUrl(): Promise<string> {
  if (resolvedBaseUrl) return resolvedBaseUrl;
  if (resolving) return resolving;
  resolving = (async () => {
    const candidates = candidateBaseUrls();
    for (const base of candidates) {
      try {
        await axios.get(base + "/health", { timeout: 3000 });
        resolvedBaseUrl = base;
        api.defaults.baseURL = base;
        return base;
      } catch {
        // try next
      }
    }
    resolvedBaseUrl = candidates[0];
    api.defaults.baseURL = resolvedBaseUrl;
    return resolvedBaseUrl;
  })();
  return resolving;
}

api.interceptors.request.use(async (config) => {
  const base = await resolveApiBaseUrl();
  config.baseURL = base;
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function setToken(token: string | null) {
  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}
