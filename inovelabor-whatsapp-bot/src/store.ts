import fs from "node:fs";
import path from "node:path";
import type Anthropic from "@anthropic-ai/sdk";
import { config } from "./config.js";

export interface Conversation {
  /** Histórico enviado ao Claude (inclui blocos de thinking/tool_use, que devem voltar intactos). */
  messages: Anthropic.Beta.BetaMessageParam[];
  /** Lead já registrado nesta conversa (evita avisar o vendedor duas vezes). */
  leadRegisteredAt?: number;
  /** IA pausada até este timestamp (um humano assumiu a conversa). */
  pausedUntil?: number;
  updatedAt: number;
}

/** Depois de 24h sem mensagens, a próxima mensagem começa um atendimento novo. */
const NEW_CONVERSATION_AFTER_MS = 24 * 60 * 60 * 1000;
/** Conversas muito longas recomeçam para não crescer sem limite. */
const MAX_MESSAGES = 120;

const file = path.join(config.dataDir, "conversations.json");
let conversations: Record<string, Conversation> = {};

try {
  conversations = JSON.parse(fs.readFileSync(file, "utf8"));
} catch {
  conversations = {};
}

let saveTimer: NodeJS.Timeout | undefined;
export function save(): void {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.mkdirSync(config.dataDir, { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(conversations));
    fs.renameSync(tmp, file);
  }, 500);
}

export function getConversation(chatId: string): Conversation {
  const now = Date.now();
  let conv = conversations[chatId];
  const stale =
    conv && (now - conv.updatedAt > NEW_CONVERSATION_AFTER_MS || conv.messages.length > MAX_MESSAGES);
  if (!conv || stale) {
    conv = { messages: [], updatedAt: now, pausedUntil: conv?.pausedUntil };
    conversations[chatId] = conv;
  }
  return conv;
}

export function pauseConversation(chatId: string, hours: number): void {
  const conv = getConversation(chatId);
  conv.pausedUntil = Date.now() + hours * 60 * 60 * 1000;
  save();
}

export function isPaused(chatId: string): boolean {
  const until = conversations[chatId]?.pausedUntil;
  return !!until && until > Date.now();
}
