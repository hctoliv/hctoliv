# Atendente IA da InoveLabor no WhatsApp

Bot que conecta no WhatsApp **por QR Code** (como o WhatsApp Web) e usa o Claude para:

1. **Atender** quem chama: responde dúvidas sobre a InoveLabor e os produtos (base em `knowledge/inovelabor.md` + busca no site inovelabor.com.br).
2. **Qualificar o lead:** nome, empresa/CNPJ, cidade/UF, produtos, quantidade, prazo, e-mail.
3. **Avisar o vendedor** no WhatsApp dele, com o resumo e o link `wa.me` para falar com o cliente (rodízio se houver vários vendedores).
4. **Cadastrar no RD Station** como conversão `lead-whatsapp-ia` (precisa do e-mail do lead).

Também:
- Junta mensagens picadas (espera 4s o cliente terminar de digitar).
- Se alguém da equipe responder manualmente pelo mesmo número, **a IA se cala naquela conversa** por 12h (configurável).
- Ignora grupos, status e mensagens dos próprios vendedores.
- Salva todo lead em `data/leads.jsonl`, como backup.

> 👉 **Guia completo para não técnicos: [PASSO-A-PASSO.md](PASSO-A-PASSO.md)**

## Rodando localmente

Precisa do Node 20 ou mais novo e de uma chave da API do Claude (console.anthropic.com).

```bash
cd inovelabor-whatsapp-bot
npm install
npm run configurar    # pergunta as chaves e cria o .env
```

**1) Teste a conversa no terminal (sem WhatsApp):**

```bash
npm run chat
```

**2) Conecte no WhatsApp:**

```bash
npm start
```

Aparece um QR Code no terminal (e é salvo em `data/qr.png`). No celular do número de atendimento, abra
**WhatsApp > Aparelhos conectados > Conectar aparelho** e escaneie. A sessão fica salva em `data/whatsapp-auth/`;
nas próximas vezes não precisa escanear de novo.

> ⚠️ A conexão por QR Code não é a API oficial do WhatsApp. Funciona bem para atendimento normal, mas o WhatsApp
> pode bloquear números que mandam mensagens em massa ou não solicitadas. O bot só **responde** quem chama, que é o
> uso mais seguro. Prefira um número de WhatsApp Business dedicado ao atendimento.

## Ajustando o que a IA sabe

Edite `knowledge/inovelabor.md` (preencha os itens marcados com `[PREENCHER]`: frete, faturamento para CNPJ,
garantia etc.) e reinicie o bot. O tom e as regras do atendimento ficam em `SYSTEM_PROMPT`, em `src/agent.ts`.

## Subindo na AWS

O jeito mais simples é uma instância **EC2** pequena (t3.small) com Docker. O script `deploy/instalar-aws.sh` faz tudo
(instala o Docker, cria o `.env`, sobe o container e mostra o QR Code). Ou, manualmente:

```bash
docker build -t inovelabor-bot .
docker run -d --name inovelabor-bot --restart unless-stopped --env-file .env -e DATA_DIR=/app/data -v $(pwd)/data:/app/data inovelabor-bot
docker logs -f inovelabor-bot   # o QR Code aparece aqui na primeira vez
```

O volume `data/` guarda a sessão do WhatsApp e o histórico. **Não perca essa pasta**, senão é preciso escanear de novo.
Rode **uma única instância** (duas conexões no mesmo número derrubam uma à outra), então nada de Lambda nem autoscaling.

## Configuração (`.env`)

| Variável | O que é |
|---|---|
| `ANTHROPIC_API_KEY` | Chave da API do Claude |
| `CLAUDE_MODEL` / `CLAUDE_EFFORT` | Modelo (padrão `claude-opus-5-5`) e esforço (`low` = rápido e barato) |
| `BOT_NAME` | Nome da atendente (padrão "Lia") |
| `VENDEDORES_WHATSAPP` | Números dos vendedores com DDI+DDD, separados por vírgula |
| `PERMITIR_BUSCA_NO_SITE` | `true` deixa a IA consultar inovelabor.com.br para achar produtos |
| `PAUSA_APOS_HUMANO_HORAS` | Quanto tempo a IA fica quieta depois que um humano responde |
| `RD_STATION_API_KEY` | Chave pública da API do RD Station Marketing |
| `RD_CONVERSION_IDENTIFIER` | Nome da conversão no RD (padrão `lead-whatsapp-ia`) |

No RD Station, o lead chega com nome, e-mail, celular, empresa, cidade/UF, os campos `cf_setor`, `cf_categoria_interesse`
e `cf_pedido_whatsapp` (este último criado para o bot) e as tags `whatsapp`, `atendimento-ia`, o tipo e a temperatura.
