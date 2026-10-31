import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Platform-safe token storage.
 * Web: localStorage (SecureStore's native module isn't available in the web
 * bundle and can throw `getValueWithKeyAsync is not a function`).
 * Native: expo-secure-store.
 */
const isWeb = Platform.OS === "web";

export async function storageGet(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // storage disabled — ignore
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // storage unavailable — ignore
  }
}

export async function storageDelete(key: string): Promise<void> {
  if (isWeb) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}
