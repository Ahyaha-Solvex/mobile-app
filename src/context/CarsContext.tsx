import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { Care, getCars } from "../api/cars";

type CarsContextValue = {
  cars: Care[];
  loading: boolean;
  reload: () => Promise<void>;
};

const CarsContext = createContext<CarsContextValue | undefined>(undefined);

export function CarsProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [cars, setCars] = useState<Care[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!token) {
      setCars([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getCars();
      setCars(data);
    } catch {
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const data = token ? await getCars().catch(() => [] as Care[]) : [];
      if (cancelled) return;
      setCars(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reload, token]);

  return (
    <CarsContext.Provider value={{ cars, loading, reload }}>
      {children}
    </CarsContext.Provider>
  );
}

export function useCars() {
  const ctx = useContext(CarsContext);
  if (!ctx) throw new Error("useCars must be used within CarsProvider");
  return ctx;
}
