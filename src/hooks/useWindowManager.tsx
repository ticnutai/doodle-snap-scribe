import { createContext, useContext, useCallback, useRef, type ReactNode } from "react";

interface WindowManagerContextType {
  bringToFront: (id: string) => number;
  getZIndex: (id: string) => number;
  register: (id: string) => void;
  unregister: (id: string) => void;
}

const WindowManagerContext = createContext<WindowManagerContextType | null>(null);

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error("useWindowManager must be used within WindowManagerProvider");
  return ctx;
}

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const zMap = useRef<Map<string, number>>(new Map());
  const topZ = useRef(60);

  const register = useCallback((id: string) => {
    if (!zMap.current.has(id)) {
      topZ.current += 1;
      zMap.current.set(id, topZ.current);
    }
  }, []);

  const unregister = useCallback((id: string) => {
    zMap.current.delete(id);
  }, []);

  const bringToFront = useCallback((id: string): number => {
    topZ.current += 1;
    zMap.current.set(id, topZ.current);
    return topZ.current;
  }, []);

  const getZIndex = useCallback((id: string): number => {
    return zMap.current.get(id) ?? 60;
  }, []);

  return (
    <WindowManagerContext.Provider value={{ bringToFront, getZIndex, register, unregister }}>
      {children}
    </WindowManagerContext.Provider>
  );
}
