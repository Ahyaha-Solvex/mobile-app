import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { TOKEN_KEY } from "../api/client";
import { getMe, login as apiLogin, register as apiRegister, User, RegisterPayload } from "../api/auth";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (emailOrPhone: string, password: string) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored) {
          setTokenState(stored);
          const me = await getMe();
          setUser(me);
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setTokenState(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function signIn(emailOrPhone: string, password: string) {
    const data = await apiLogin(emailOrPhone, password);
    await SecureStore.setItemAsync(TOKEN_KEY, data.access_token);
    setTokenState(data.access_token);
    const me = await getMe();
    setUser(me);
  }

  async function signUp(payload: RegisterPayload) {
    await apiRegister(payload);
    await signIn(payload.email_or_phone, payload.password);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setTokenState(null);
    setUser(null);
  }

  async function refreshUser() {
    if (token) {
      const me = await getMe();
      setUser(me);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, signIn, signUp, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
