import "dotenv/config";
import path from "node:path";

function list(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((v) => v.replace(/\D/g, ""))
    .filter(Boolean);
}

export const config = {
  model: process.env.CLAUDE_MODEL || "claude-opus-5-5",
  effort: (process.env.CLAUDE_EFFORT || "low") as "low" | "medium" | "high" | "xhigh" | "max",
  botName: process.env.BOT_NAME || "Lia",
  sellers: list(process.env.VENDEDORES_WHATSAPP),
  allowSiteSearch: (process.env.PERMITIR_BUSCA_NO_SITE ?? "true") !== "false",
  humanPauseHours: Number(process.env.PAUSA_APOS_HUMANO_HORAS || 12),
  rdApiKey: process.env.RD_STATION_API_KEY || "",
  rdConversionIdentifier: process.env.RD_CONVERSION_IDENTIFIER || "lead-whatsapp-ia",
  dataDir: path.resolve(process.env.DATA_DIR || "./data"),
  logLevel: process.env.LOG_LEVEL || "info",
};
