import { z } from "zod";

const name = z.string().trim().min(1).max(120);
const playerId = z.string().regex(/^player_[a-z0-9]+$/);
const pin = z.string().regex(/^\d{6}$/);
export const clientIdSchema = z.string().regex(/^client_[a-f0-9]{32}$/);

export const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("create"), name: name.optional(), pin }),
  z.object({ type: z.literal("add"), name }),
  z.object({ type: z.literal("delete"), playerId }),
  z.object({ type: z.literal("chips"), playerId, chips: z.number() }),
  z.object({
    type: z.literal("hands"),
    playerId,
    change: z.union([z.object({ total: z.int() }), z.object({ delta: z.int() })]),
  }),
  z.object({
    type: z.literal("settings"),
    chipsPerHand: z.number().min(1),
  }),
  z.object({ type: z.literal("claim"), pin }),
  z.object({ type: z.literal("pin") }),
]);

export type RoomCommand = z.infer<typeof commandSchema>;
