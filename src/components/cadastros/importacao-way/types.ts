import type { ImportWayCsvResult } from "@/types/posto.types";

export type ImportFailureRow = {
  id: string;
  cnpjEc: string;
  motivo: string;
};

export type ImportWaySummary = Pick<
  ImportWayCsvResult,
  "totalCnpjsCsv" | "totalCnpjsValidos" | "importados" | "ignoradosDuplicados"
>;
