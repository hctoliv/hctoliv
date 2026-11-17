import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import type { Lead } from "./agent.js";
import { sendLeadToRdStation } from "./rdstation.js";

let nextSeller = 0;

/** Escolhe o próximo vendedor em rodízio. */
export function pickSeller(): string | undefined {
  if (!config.sellers.length) return undefined;
  const seller = config.sellers[nextSeller % config.sellers.length];
  nextSeller++;
  return seller;
}

export function formatLeadForSeller(lead: Lead): string {
  const emoji = { quente: "🔥", morno: "🌤️", frio: "❄️" }[lead.temperatura] ?? "";
  const line = (label: string, value: string) => (value ? `*${label}:* ${value}\n` : "");
  return (
    `${emoji} *Novo lead do WhatsApp (atendimento IA)*\n\n` +
    line("Nome", lead.nome) +
    line("Empresa", lead.empresa) +
    line("CNPJ", lead.cnpj) +
    line("Cidade/UF", lead.cidade_uf) +
    line("E-mail", lead.email) +
    line("Produtos", lead.produtos) +
    line("Qtd./prazo", lead.quantidade_e_prazo) +
    line("Setor", lead.setor) +
    line("Tipo", lead.tipo) +
    line("Temperatura", lead.temperatura) +
    `\n*Resumo:* ${lead.resumo}\n\n` +
    `👉 Falar com o cliente: https://wa.me/${lead.telefone}`
  );
}

/** Guarda todo lead num arquivo (backup simples, independente do RD Station). */
export function appendLeadLog(lead: Lead): void {
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.appendFileSync(
    path.join(config.dataDir, "leads.jsonl"),
    JSON.stringify({ ...lead, registradoEm: new Date().toISOString() }) + "\n",
  );
}

/**
 * Cria o handler de lead: avisa o vendedor (via função de envio do WhatsApp) e manda ao RD.
 * Erro no RD não impede o aviso ao vendedor.
 */
export function makeLeadHandler(notifySeller: (sellerPhone: string, text: string) => Promise<void>) {
  return async (lead: Lead): Promise<string> => {
    appendLeadLog(lead);
    const status: string[] = [];

    const seller = pickSeller();
    if (seller) {
      await notifySeller(seller, formatLeadForSeller(lead));
      status.push("Vendedor avisado no WhatsApp.");
    } else {
      status.push("Nenhum vendedor configurado; lead salvo no arquivo.");
    }

    try {
      status.push(await sendLeadToRdStation(lead));
    } catch (err) {
      console.error("[rd] erro:", err);
      status.push("Falha ao enviar ao RD Station (o vendedor foi avisado mesmo assim).");
    }
    console.log(`[lead] ${lead.nome} (${lead.telefone}) — ${status.join(" ")}`);
    return status.join(" ");
  };
}
