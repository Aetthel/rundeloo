import { z } from "zod";

/** "system" is stored as null: follow the device (see docs/database.md). */
export const themeSchema = z.enum(["light", "dark", "system"]);

export type ThemeChoice = z.infer<typeof themeSchema>;
