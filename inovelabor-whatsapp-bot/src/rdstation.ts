import { config } from "./config.js";
import type { Lead } from "./agent.js";

/**
 * Envia o lead para o RD Station Marketing como um evento de conversão.
 * Docs: https://developers.rdstation.com/reference/conversao
 * O RD exige e-mail para criar/atualizar o contato; sem e-mail o envio é pulado.
 */
export async function sendLeadToRdStation(lead: Lead): Promise<string> {
  if (!config.rdApiKey) return "RD Station não configurado (RD_STATION_API_KEY vazio).";
  if (!lead.email) return "Lead sem e-mail: não enviado ao RD Station.";

  const [city, state] = lead.cidade_uf.split(/\s*[\/-]\s*/);
  const body = {
    event_type: "CONVERSION",
    event_family: "CDP",
    payload: {
      conversion_identifier: config.rdConversionIdentifier,
      email: lead.email,
      name: lead.nome || undefined,
      mobile_phone: `+${lead.telefone}`,
      personal_phone: `+${lead.telefone}`,
      company_name: lead.empresa || undefined,
      city: city || undefined,
      state: state || undefined,
      cf_setor: lead.setor || undefined,
      cf_categoria_interesse: lead.categorias?.length ? lead.categorias : undefined,
      cf_pedido_whatsapp:
        `${lead.produtos}${lead.quantidade_e_prazo ? ` | ${lead.quantidade_e_prazo}` : ""}\n${lead.resumo}`.slice(0, 1000),
      tags: ["whatsapp", "atendimento-ia", lead.tipo, lead.temperatura].filter(Boolean),
      traffic_source: "WhatsApp",
      available_for_mailing: true,
    },
  };

  const res = await fetch(
    `https://api.rd.services/platform/conversions?api_key=${encodeURIComponent(config.rdApiKey)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`RD Station respondeu ${res.status}: ${await res.text()}`);
  return "Lead enviado ao RD Station.";
}
