/**
 * Testa o atendente no terminal, sem WhatsApp: `npm run chat`.
 * O aviso ao vendedor é impresso na tela em vez de enviado.
 */
import readline from "node:readline/promises";
import { reply } from "./agent.js";
import { makeLeadHandler } from "./leads.js";

const chatId = `cli-${Date.now()}`;
const phone = "5511900000000";
const handleLead = makeLeadHandler(async (seller, text) => {
  console.log(`\n----- aviso que iria para o vendedor ${seller} -----\n${text}\n---------------------------------------\n`);
});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log("Converse como se fosse um cliente (Ctrl+C para sair).\n");
for (;;) {
  const text = (await rl.question("Cliente: ")).trim();
  if (!text) continue;
  for (const m of await reply(chatId, phone, text, handleLead)) console.log(`\nBot: ${m}\n`);
}
