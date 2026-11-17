# Passo a passo: colocar a atendente IA no WhatsApp da InoveLabor

Tempo total: uns 40 minutos. Você vai precisar de:
- o **celular com o WhatsApp de atendimento** (o número que os clientes chamam);
- o **número do WhatsApp do vendedor** que vai receber os leads;
- um computador (Windows ou Mac) para o teste;
- acesso ao **RD Station** e um cartão de crédito para a **API do Claude** e a **AWS**.

---

## Parte 1: pegar as chaves (10 min)

### 1.1 Chave da API do Claude
1. Entre em https://console.anthropic.com e crie uma conta (ou faça login).
2. Em **Billing**, adicione um cartão e coloque crédito (US$ 20 dá para muitos atendimentos).
3. Em **API Keys**, clique em **Create Key**, dê o nome "whatsapp-inovelabor" e **copie a chave** (começa com `sk-ant-`).
   Guarde num lugar seguro: ela só aparece uma vez.

### 1.2 Chave do RD Station
1. No RD Station Marketing, clique no seu perfil (canto superior direito) > **Integrações** > **Chaves de API**.
2. Copie a **chave de API pública** (é ela que recebe as conversões).

> Já deixei pronto no RD Station o campo **"Pedido via WhatsApp (IA)"**. O bot também preenche os campos
> **Setor** e **Categoria de interesse** que vocês já tinham, e marca as tags `whatsapp` e `atendimento-ia`.
> A conversão aparece com o nome **lead-whatsapp-ia**: dá para criar uma automação ou segmentação a partir dela.

---

## Parte 2: testar no seu computador (15 min)

### 2.1 Instalar o Node.js
Baixe e instale a versão **LTS** em https://nodejs.org (só avançar, avançar, concluir).

### 2.2 Baixar o projeto
1. No GitHub, abra o repositório `hctoliv/hctoliv` e troque para a branch `claude/relaxed-noether-ca18rc`.
2. Clique em **Code > Download ZIP** e descompacte.
3. Abra o **Terminal** (Mac) ou o **Prompt de Comando** (Windows) dentro da pasta `inovelabor-whatsapp-bot`.
   No Windows: abra a pasta no Explorer, clique na barra de endereço, digite `cmd` e aperte Enter.

### 2.3 Instalar e configurar
```bash
npm install
```
```bash
npm run configurar
```
Ele vai pedir, uma de cada vez: a chave do Claude, o WhatsApp do vendedor (ex.: `5511991809701`) e a chave do RD.

### 2.4 Conversar com a atendente pelo terminal (sem WhatsApp ainda)
```bash
npm run chat
```
Finja ser um cliente: "Oi, preciso de 20 beckers de 250 ml para a minha empresa em Campinas".
Quando ela tiver os dados, vai aparecer na tela o aviso que iria para o vendedor. Aperte `Ctrl+C` para sair.

Não gostou de alguma resposta? Corrija a informação em `knowledge/inovelabor.md` (é um texto comum) e teste de novo.

### 2.5 Ligar no WhatsApp de verdade
```bash
npm start
```
1. Vai aparecer um **QR Code** no terminal.
2. No celular do número de atendimento: **WhatsApp > ⋮ (ou Configurações) > Aparelhos conectados > Conectar aparelho**,
   e aponte para o QR Code.
3. Quando aparecer "✅ WhatsApp conectado", mande uma mensagem **de outro celular** para o número de atendimento.
4. Confira se o vendedor recebeu o aviso no WhatsApp e se o contato apareceu no RD Station.

**Importante:**
- Se alguém da equipe responder manualmente uma conversa (pelo celular ou WhatsApp Web), a IA fica quieta
  **naquela conversa** por 12 horas. Assim o vendedor pode assumir sem atrapalhar.
- Enquanto o bot estiver ligado no seu computador, ele só atende com o computador ligado. Para atender 24h, faça a Parte 3.
- Antes da Parte 3, desligue o teste (`Ctrl+C`) e, no celular, desconecte o aparelho "InoveLabor IA" em
  **Aparelhos conectados**. Só pode haver um bot conectado por número.

---

## Parte 3: deixar ligado 24h na AWS (15 min)

### 3.1 Criar o servidor
1. Entre em https://console.aws.amazon.com e, lá no alto à direita, escolha a região **América do Sul (São Paulo)**.
2. Procure **EC2** > **Executar instância** (Launch instance).
3. Preencha:
   - **Nome:** `inovelabor-whatsapp-bot`
   - **Imagem:** Ubuntu Server 24.04 LTS
   - **Tipo:** `t3.small` (custa uns US$ 15–20/mês)
   - **Par de chaves:** "Prosseguir sem par de chaves" (vamos entrar pelo navegador)
   - **Rede:** deixe marcado **apenas** "Permitir tráfego SSH". O bot não precisa de nenhuma porta aberta.
   - **Armazenamento:** 20 GB
4. Clique em **Executar instância**.

### 3.2 Entrar no servidor pelo navegador
1. Em **Instâncias**, marque a instância nova > **Conectar** > aba **EC2 Instance Connect** > **Conectar**.
2. Abre uma tela preta (o terminal do servidor).

### 3.3 Instalar o bot
Cole os comandos abaixo, um de cada vez.

Baixar o projeto:
```bash
git clone -b claude/relaxed-noether-ca18rc https://github.com/hctoliv/hctoliv.git
```
> Se o repositório for privado, o GitHub pede usuário e senha. No lugar da senha, use um token criado em
> GitHub > Settings > Developer settings > Personal access tokens.

Entrar na pasta e instalar:
```bash
cd hctoliv/inovelabor-whatsapp-bot
```
```bash
bash deploy/instalar-aws.sh
```

O script instala tudo, pergunta as chaves (as mesmas da Parte 1) e mostra o **QR Code**. Escaneie com o celular
de atendimento, como na Parte 2.5. Depois que aparecer "✅ WhatsApp conectado", aperte `Ctrl+C` e feche a janela.
O bot continua rodando, e volta sozinho se o servidor reiniciar.

### 3.4 Comandos úteis (no terminal do servidor)
Ver o que está acontecendo (as conversas aparecem aqui):
```bash
sudo docker logs -f --tail 100 inovelabor-bot
```
Reiniciar o bot:
```bash
sudo docker restart inovelabor-bot
```
Atualizar o texto da base de conhecimento depois de editar `knowledge/inovelabor.md`:
```bash
bash deploy/instalar-aws.sh
```
Se o WhatsApp foi desconectado pelo celular, apague a sessão e leia o QR de novo:
```bash
sudo rm -rf data/whatsapp-auth && bash deploy/instalar-aws.sh
```

---

## Dúvidas comuns

**O WhatsApp pode bloquear o número?** A conexão por QR Code não é a API oficial. O risco é baixo porque o bot
só responde quem chama e nunca dispara mensagens em massa. Mesmo assim, use um número de WhatsApp Business dedicado
ao atendimento.

**Quanto custa a IA?** Cada mensagem respondida custa em média alguns centavos de real. Acompanhe em
console.anthropic.com > Usage, e coloque um limite de gasto mensal em Billing > Limits.

**Onde vejo os leads?** No WhatsApp do vendedor, no RD Station (conversão `lead-whatsapp-ia`) e no arquivo
`data/leads.jsonl` do servidor, que é um backup.
