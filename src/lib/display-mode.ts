import type { DisplayMode } from "./types";

export const resolveDisplayMode = (
  storedValue: string | null | undefined
): DisplayMode => (storedValue === "cash" ? "cash" : "chip");
