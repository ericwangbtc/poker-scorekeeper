import { HistoryEntry } from "../types";
import { generateHistoryId } from "./id";

export const createHistoryEntry = (message: string, timestamp = Date.now()): HistoryEntry => ({
  id: generateHistoryId(timestamp),
  message,
  timestamp
});
