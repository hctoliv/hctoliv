/** Estado da conexão com o WhatsApp, compartilhado com o painel. */
export const status: {
  state: "iniciando" | "aguardando_qr" | "conectado" | "desconectado";
  qr?: string;
  me?: string;
  since: number;
} = { state: "iniciando", since: Date.now() };
