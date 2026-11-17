import path from "node:path";
import fs from "node:fs";
import QRCode from "qrcode";
import pino from "pino";
import { HttpsProxyAgent } from "https-proxy-agent";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidBroadcast,
  isJidGroup,
  isJidNewsletter,
  isPnUser,
  jidNormalizedUser,
  useMultiFileAuthState,
  type WAMessage,
  type WASocket,
} from "baileys";
import { config, phoneIn } from "./config.js";
import { reply } from "./agent.js";
import { makeLeadHandler } from "./leads.js";
import { isPaused, pauseConversation, rememberPhone } from "./store.js";
import { status } from "./status.js";
import { startPanel } from "./painel.js";

const logger = pino({ level: config.logLevel === "debug" ? "debug" : "warn" });
const authDir = path.join(config.dataDir, "whatsapp-auth");
const qrFile = path.join(config.dataDir, "qr.png");

/** Espera o cliente terminar de digitar (várias mensagens seguidas viram uma só). */
const DEBOUNCE_MS = 4000;

let sock: WASocket;
/** IDs das mensagens que o próprio bot enviou (para diferenciar de um humano usando o mesmo número). */
const sentByBot = new Set<string>();

async function sendText(jid: string, text: string): Promise<void> {
  const sent = await sock.sendMessage(jid, { text });
  if (sent?.key.id) sentByBot.add(sent.key.id);
}

const handleLead = makeLeadHandler((sellerPhone, text) => sendText(`${sellerPhone}@s.whatsapp.net`, text));

function extractText(msg: WAMessage): string | undefined {
  const m = msg.message;
  if (!m) return undefined;
  const text =
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.title;
  if (text) return text;
  if (m.audioMessage) return "[o cliente enviou um áudio, que você não consegue ouvir — peça para escrever]";
  if (m.imageMessage) return "[o cliente enviou uma imagem sem legenda, que você não consegue ver — peça para descrever]";
  if (m.documentMessage) return `[o cliente enviou um documento: ${m.documentMessage.fileName ?? "arquivo"} — você não consegue abrir; diga que o consultor vai analisar]`;
  if (m.stickerMessage || m.reactionMessage || m.protocolMessage) return undefined;
  return "[o cliente enviou um tipo de mensagem que você não consegue ler]";
}

/**
 * Número de telefone do cliente (só dígitos). No WhatsApp novo o chat pode vir como LID
 * (um identificador que não é o telefone); nesse caso busca o telefone no mapeamento LID -> número.
 */
async function phoneOf(msg: WAMessage): Promise<string> {
  let jid = [msg.key.remoteJid, msg.key.remoteJidAlt].find((j) => j && isPnUser(j));
  if (!jid && msg.key.remoteJid) {
    jid = (await sock.signalRepository.lidMapping.getPNForLID(msg.key.remoteJid).catch(() => null)) ?? undefined;
  }
  return jidNormalizedUser(jid ?? msg.key.remoteJid ?? "").split("@")[0].split(":")[0];
}

// --- fila por conversa, com debounce ---
const pending = new Map<string, { texts: string[]; phone: string; timer?: NodeJS.Timeout }>();
const chains = new Map<string, Promise<void>>();

function enqueue(chatId: string, phone: string, text: string): void {
  const entry = pending.get(chatId) ?? { texts: [], phone };
  entry.texts.push(text);
  clearTimeout(entry.timer);
  entry.timer = setTimeout(() => {
    pending.delete(chatId);
    const prev = chains.get(chatId) ?? Promise.resolve();
    const next = prev.then(() => processChat(chatId, entry.phone, entry.texts.join("\n"))).catch((err) => {
      console.error(`[chat ${chatId}] erro:`, err);
    });
    chains.set(chatId, next);
  }, DEBOUNCE_MS);
  pending.set(chatId, entry);
}

async function processChat(chatId: string, phone: string, text: string): Promise<void> {
  if (isPaused(chatId)) return;
  console.log(`[<- ${phone}] ${text}`);
  await sock.sendPresenceUpdate("composing", chatId).catch(() => {});
  const messages = await reply(chatId, phone, text, handleLead);
  await sock.sendPresenceUpdate("paused", chatId).catch(() => {});
  if (isPaused(chatId)) return; // um humano assumiu enquanto a IA pensava
  for (const m of messages) {
    console.log(`[-> ${phone}] ${m}`);
    await sendText(chatId, m);
  }
}

async function onMessage(msg: WAMessage): Promise<void> {
  const chatId = msg.key.remoteJid;
  if (!chatId || isJidGroup(chatId) || isJidBroadcast(chatId) || isJidNewsletter(chatId)) return;

  if (msg.key.fromMe) {
    // Mensagem enviada por uma pessoa da equipe direto pelo celular/WhatsApp Web: pausa a IA nessa conversa.
    if (msg.key.id && !sentByBot.has(msg.key.id) && msg.message && !msg.message.protocolMessage) {
      console.log(`[humano assumiu] ${chatId} — IA pausada por ${config.humanPauseHours}h`);
      pauseConversation(chatId, config.humanPauseHours);
    }
    return;
  }

  const phone = await phoneOf(msg);
  if (config.testNumbers.length && !phoneIn(phone, config.testNumbers)) {
    console.log(`[modo teste] ignorando ${phone} (não está em NUMEROS_TESTE)`);
    return;
  }
  if (phoneIn(phone, config.sellers) && !phoneIn(phone, config.testNumbers)) return; // não atende os vendedores
  const text = extractText(msg);
  if (!text) return;
  rememberPhone(chatId, phone);
  enqueue(chatId, phone, text);
}

async function connect(): Promise<void> {
  fs.mkdirSync(config.dataDir, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const agent = proxy ? new HttpsProxyAgent(proxy) : undefined;
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));

  sock = makeWASocket({
    auth: state,
    logger,
    browser: Browsers.ubuntu("InoveLabor IA"),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    ...(version ? { version } : {}),
    ...(agent ? { agent, fetchAgent: agent } : {}),
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      Object.assign(status, { state: "aguardando_qr", qr, since: Date.now() });
      await QRCode.toFile(qrFile, qr, { width: 400, margin: 2 });
      console.log(await QRCode.toString(qr, { type: "terminal", small: true }));
      console.log(`Escaneie o QR Code acima (ou abra ${qrFile}) em WhatsApp > Aparelhos conectados > Conectar aparelho.`);
    }
    if (connection === "open") {
      Object.assign(status, { state: "conectado", qr: undefined, me: sock.user?.id, since: Date.now() });
      fs.rmSync(qrFile, { force: true });
      console.log(`✅ WhatsApp conectado como ${sock.user?.id}. ${config.botName} está atendendo.`);
      const own = jidNormalizedUser(sock.user?.id).split("@")[0];
      if (config.testNumbers.length) {
        console.log(`🧪 MODO TESTE: só respondo ${config.testNumbers.join(", ")}. Para atender todos, esvazie NUMEROS_TESTE e reinicie.`);
      }
      if (phoneIn(own, config.sellers)) {
        console.warn(`⚠️  VENDEDORES_WHATSAPP contém o próprio número do bot (${own}): o aviso de lead não vai chegar. Use o WhatsApp pessoal do vendedor.`);
      }
    }
    if (connection === "close") {
      Object.assign(status, { state: "desconectado", qr: undefined, since: Date.now() });
      const code = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.error("Sessão desconectada pelo celular. Apague a pasta", authDir, "e rode de novo para ler um novo QR.");
        process.exit(1);
      }
      console.log(`Conexão caiu (código ${code}). Reconectando...`);
      setTimeout(connect, 3000);
    }
  });

  sock.ev.on("messages.upsert", ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) onMessage(msg).catch((err) => console.error("[mensagem] erro:", err));
  });
}

if (config.testNumbers.length) console.log(`🧪 Modo teste ativo: ${config.testNumbers.join(", ")}`);
if (!config.sellers.length) console.warn("⚠️  VENDEDORES_WHATSAPP vazio: os leads só serão salvos em data/leads.jsonl.");
startPanel();
connect().catch((err) => {
  console.error(err);
  process.exit(1);
});
