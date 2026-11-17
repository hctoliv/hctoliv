/**
 * Painel web do bot: QR Code ao vivo para conectar o WhatsApp + monitor das conversas e leads.
 * Abre em http://localhost:3000 (ou http://IP-DO-SERVIDOR:3000). Protegido pela senha PAINEL_SENHA.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { config } from "./config.js";
import { status } from "./status.js";
import { listConversations, isPaused } from "./store.js";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function fmtPhone(d: string): string {
  const m = d.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : d;
}

function fmtTime(ts: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(ts);
}

/** Só o texto visível da conversa (sem blocos internos de raciocínio e ferramentas). */
function visibleMessages(messages: { role: string; content: unknown }[]): { who: "cliente" | "ia"; text: string }[] {
  const out: { who: "cliente" | "ia"; text: string }[] = [];
  for (const m of messages) {
    if (typeof m.content === "string") {
      out.push({ who: m.role === "user" ? "cliente" : "ia", text: m.content.replace(/^\[[^\]]*\]\s*/, "") });
      continue;
    }
    if (m.role !== "assistant" || !Array.isArray(m.content)) continue;
    for (const b of m.content as { type: string; text?: string; name?: string }[]) {
      if (b.type === "text" && b.text?.trim()) out.push({ who: "ia", text: b.text });
      if (b.type === "tool_use" && b.name === "registrar_lead") out.push({ who: "ia", text: "✅ [lead registrado e vendedor avisado]" });
    }
  }
  return out;
}

function readLeads(limit = 20): Record<string, string>[] {
  try {
    return fs.readFileSync(path.join(config.dataDir, "leads.jsonl"), "utf8")
      .trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)).reverse().slice(0, limit);
  } catch {
    return [];
  }
}

async function page(): Promise<string> {
  let statusHtml: string;
  if (status.state === "conectado") {
    statusHtml = `<div class="ok">✅ WhatsApp conectado (${esc(fmtPhone((status.me ?? "").split(/[:@]/)[0]))}) — ${esc(config.botName)} está atendendo.</div>`;
  } else if (status.state === "aguardando_qr" && status.qr) {
    const img = await QRCode.toDataURL(status.qr, { width: 320, margin: 2 });
    statusHtml = `<div class="qr"><img src="${img}" alt="QR Code"><div>
      <h2>Escaneie para conectar</h2>
      <ol><li>Abra o WhatsApp do número de atendimento <b>(11) 2791-2239</b></li>
      <li>Toque em <b>⋮</b> ou <b>Configurações</b> &gt; <b>Aparelhos conectados</b></li>
      <li><b>Conectar aparelho</b> e aponte a câmera para este código</li></ol>
      <p class="muted">O código muda sozinho a cada ~20 segundos. Esta página se atualiza sozinha.</p></div></div>`;
  } else {
    statusHtml = `<div class="warn">⏳ ${status.state === "desconectado" ? "Reconectando ao WhatsApp…" : "Iniciando…"}</div>`;
  }

  const mode = config.testNumbers.length
    ? `<div class="test">🧪 <b>Modo teste:</b> a IA só responde ${config.testNumbers.map((n) => esc(fmtPhone(n))).join(" e ")}. Os demais clientes são atendidos pela equipe.</div>`
    : `<div class="live">🟢 Atendendo todos os clientes.</div>`;

  const sellers = config.sellers.length
    ? config.sellers.map((n) => esc(fmtPhone(n))).join(", ")
    : "nenhum (configure VENDEDORES_WHATSAPP)";

  const convs = listConversations(30).map(({ chatId, conv }) => {
    const msgs = visibleMessages(conv.messages as { role: string; content: unknown }[]).slice(-30);
    const badges = [
      conv.leadRegisteredAt ? `<span class="b lead">lead registrado</span>` : "",
      isPaused(chatId) ? `<span class="b pause">humano assumiu</span>` : "",
    ].join("");
    return `<details class="conv"><summary><b>${esc(fmtPhone(conv.phone ?? chatId.split("@")[0]))}</b> ${badges}
      <span class="muted">· ${fmtTime(conv.updatedAt)} · ${msgs.length} msgs</span></summary>
      ${msgs.map((m) => `<div class="msg ${m.who}">${esc(m.text).replace(/\n/g, "<br>")}</div>`).join("")}</details>`;
  }).join("") || `<p class="muted">Nenhuma conversa ainda.</p>`;

  const leads = readLeads().map((l) => `<tr><td>${esc(fmtTime(Date.parse(l.registradoEm)))}</td>
    <td>${esc(l.nome ?? "")}<br><span class="muted">${esc(l.empresa ?? "")}</span></td>
    <td><a href="https://wa.me/${esc(l.telefone ?? "")}" target="_blank">${esc(fmtPhone(l.telefone ?? ""))}</a></td>
    <td>${esc(l.produtos ?? "")}</td><td>${esc(l.temperatura ?? "")}</td></tr>`).join("");

  return `<!doctype html><html lang="pt-br"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="${status.state === "conectado" ? 15 : 5}">
<title>Painel do atendente IA — InoveLabor</title><style>
:root{--bg:#f5f8f8;--card:#fff;--text:#1f2a2a;--muted:#6b7b7b;--brand:#278787;--line:#dde6e6}
@media (prefers-color-scheme:dark){:root{--bg:#111818;--card:#1a2323;--text:#e6eeee;--muted:#93a5a5;--line:#2a3636}}
body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--text);margin:0;padding:16px}
main{max-width:900px;margin:auto}h1{color:var(--brand);font-size:1.4rem}
section{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin:12px 0}
.qr{display:flex;gap:20px;flex-wrap:wrap;align-items:center}.qr img{background:#fff;border-radius:8px;max-width:100%}
.ok,.live{color:#1e8e3e;font-weight:600}.warn{color:#b26a00;font-weight:600}.test{color:#8a5a00}
.muted{color:var(--muted);font-size:.9em}.conv{border-top:1px solid var(--line);padding:8px 0}
summary{cursor:pointer}.msg{margin:6px 0;padding:8px 10px;border-radius:10px;max-width:80%;white-space:normal}
.msg.cliente{background:var(--bg)}.msg.ia{background:#d9f2e6;color:#0f2e22;margin-left:auto}
.b{font-size:.75em;padding:2px 8px;border-radius:99px;margin-left:6px}.lead{background:#d9f2e6;color:#0f5132}.pause{background:#fff1cc;color:#7a5200}
table{width:100%;border-collapse:collapse;font-size:.9em}td{border-top:1px solid var(--line);padding:6px;vertical-align:top}
a{color:var(--brand)}</style></head><body><main>
<h1>Atendente IA — InoveLabor</h1>
<section>${statusHtml}</section>
<section>${mode}<p class="muted">Avisos de lead vão para: ${sellers}</p></section>
<section><h2>Leads</h2>${leads ? `<table>${leads}</table>` : `<p class="muted">Nenhum lead ainda.</p>`}</section>
<section><h2>Conversas</h2>${convs}</section>
</main></body></html>`;
}

export function startPanel(): void {
  const server = http.createServer(async (req, res) => {
    if (config.panelPassword) {
      const auth = req.headers.authorization ?? "";
      const given = Buffer.from(auth.replace(/^Basic /, ""), "base64").toString().split(":").slice(1).join(":");
      if (given !== config.panelPassword) {
        res.writeHead(401, { "WWW-Authenticate": 'Basic realm="Painel InoveLabor"' });
        res.end("Senha necessária");
        return;
      }
    }
    if (req.url === "/status.json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ state: status.state, me: status.me, since: status.since }));
      return;
    }
    try {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(await page());
    } catch (err) {
      console.error("[painel] erro:", err);
      res.writeHead(500);
      res.end("Erro no painel");
    }
  });
  server.listen(config.panelPort, () => {
    console.log(`🖥️  Painel (QR Code e conversas): http://localhost:${config.panelPort}${config.panelPassword ? "  (usuário: qualquer, senha: PAINEL_SENHA)" : ""}`);
  });
}
