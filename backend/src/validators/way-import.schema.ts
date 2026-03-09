import { z } from "zod";

export const importWayCsvSchema = z.object({
  csvContent: z.string().min(1, "csvContent is required"),
});
