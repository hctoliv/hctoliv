/**
 * Assistente que pergunta as configurações e grava o arquivo .env: `npm run configurar`.
 */
import fs from "node:fs";
import readline from "node:readline/promises";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const current: Record<string, string> = {};
if (fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) current[m[1]] = m[2];
  }
}

async function ask(key: string, question: string, def = ""): Promise<string> {
  const existing = key in current ? current[key] : def;
  const shown = existing && /KEY/.test(key) ? `${existing.slice(0, 8)}…` : existing;
  const answer = (await rl.question(`${question}${shown ? ` [${shown}]` : ""}: `)).trim();
  return answer || existing;
}

console.log("\n=== Configuração do atendente IA da InoveLabor ===\n(Enter mantém o valor entre colchetes)\n");

const values: Record<string, string> = {
  ANTHROPIC_API_KEY: await ask("ANTHROPIC_API_KEY", "1) Chave da API do Claude (console.anthropic.com > API Keys)"),
  VENDEDORES_WHATSAPP: (await ask(
    "VENDEDORES_WHATSAPP",
    "2) WhatsApp do(s) vendedor(es) que recebem os leads, com 55+DDD (vários: separe por vírgula)",
  )).replace(/[^\d,]/g, ""),
  RD_STATION_API_KEY: await ask(
    "RD_STATION_API_KEY",
    "3) Chave de API PÚBLICA do RD Station (Perfil > Integrações > Chaves de API) — Enter para pular",
  ),
  NUMEROS_TESTE: (await ask(
    "NUMEROS_TESTE",
    "4) MODO TESTE: números que o bot pode atender (vírgula). Digite 'todos' para atender todo mundo",
    "5511987685469,5511926594857",
  )).replace(/^todos$/i, "").replace(/[^\d,]/g, ""),
  BOT_NAME: await ask("BOT_NAME", "5) Nome da atendente", "Lia"),
  CLAUDE_MODEL: current.CLAUDE_MODEL || "claude-opus-5-5",
  CLAUDE_EFFORT: current.CLAUDE_EFFORT || "low",
  PERMITIR_BUSCA_NO_SITE: current.PERMITIR_BUSCA_NO_SITE || "true",
  PAUSA_APOS_HUMANO_HORAS: current.PAUSA_APOS_HUMANO_HORAS || "12",
  RD_CONVERSION_IDENTIFIER: current.RD_CONVERSION_IDENTIFIER || "lead-whatsapp-ia",
  DATA_DIR: current.DATA_DIR || "./data",
  LOG_LEVEL: current.LOG_LEVEL || "info",
};
rl.close();

if (!values.ANTHROPIC_API_KEY) console.warn("\n⚠️  Sem a chave do Claude o bot não responde. Rode `npm run configurar` de novo depois.");
fs.writeFileSync(".env", Object.entries(values).map(([k, v]) => `${k}=${v}`).join("\n") + "\n", { mode: 0o600 });
console.log("\n✅ Arquivo .env salvo. Próximo passo: `npm run chat` para testar, depois `npm start` para ligar no WhatsApp.\n");
