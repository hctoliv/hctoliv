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
  /** Modo de teste: se tiver números aqui, o bot SÓ responde esses números. Vazio = atende todo mundo. */
  testNumbers: list(process.env.NUMEROS_TESTE),
  allowSiteSearch: (process.env.PERMITIR_BUSCA_NO_SITE ?? "true") !== "false",
  humanPauseHours: Number(process.env.PAUSA_APOS_HUMANO_HORAS || 12),
  rdApiKey: process.env.RD_STATION_API_KEY || "",
  rdConversionIdentifier: process.env.RD_CONVERSION_IDENTIFIER || "lead-whatsapp-ia",
  dataDir: path.resolve(process.env.DATA_DIR || "./data"),
  logLevel: process.env.LOG_LEVEL || "info",
  panelPort: Number(process.env.PAINEL_PORTA || 3000),
  panelPassword: process.env.PAINEL_SENHA || "",
};

/**
 * Compara telefones de forma tolerante: ignora o 55 e o 9º dígito de celular
 * (no WhatsApp, números antigos do Brasil às vezes aparecem sem o 9).
 */
export function phoneKey(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2);
  if (d.length === 10 || d.length === 11) return d.slice(0, 2) + d.slice(-8);
  return d;
}

export function phoneIn(phone: string, list: string[]): boolean {
  const k = phoneKey(phone);
  return list.some((p) => phoneKey(p) === k);
}
