import { create } from "zustand";
import type { Mechanic } from "@workspace/api-client-react";

interface AuthState {
  role: "admin" | "mechanic" | null;
  mechanic: Mechanic | null;
  setAdmin: () => void;
  setMechanic: (mechanic: Mechanic) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  role: null,
  mechanic: null,
  setAdmin: () => set({ role: "admin", mechanic: null }),
  setMechanic: (mechanic) => set({ role: "mechanic", mechanic }),
  logout: () => set({ role: null, mechanic: null }),
}));
