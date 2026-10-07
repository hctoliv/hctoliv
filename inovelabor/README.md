# InoveLabor — Central de marketing

Sistema de marketing da InoveLabor (produtos para laboratórios), baseado na central de marketing da WE MIRROR e adaptado ao negócio da InoveLabor.

**Demonstração:** abra `sistema/index.html` no navegador (ou publique a pasta pelo GitHub Pages) e entre com
`demo@inovelabor.com.br` / `demo2026` e quaisquer 6 números no 2FA. Todos os dados são fictícios e ficam só na aba aberta.

## O que mudou em relação ao sistema original

- **Sem Mercado Livre.** Canais de palavras-chave, anúncios, copys e trends foram trocados por Google, Google Shopping e a busca da loja.
- **Integração Tray** (`#/loja`): pedidos com itens, UF, forma de pagamento e PF/PJ; produtos com preço e estoque; carrinhos abandonados; mais vendidos. Produtos com o mesmo SKU atualizam o preço e o estoque no mapa de vidrarias.
- **Integração RD Station Marketing** (`#/rd`): funil (visitantes → leads → qualificados → oportunidades → vendas), resultados de e-mails e conversões de landing pages, formulários e pop-ups.
- **Mapa de concorrentes de vidrarias** (`#/vidrarias`):
  - matriz de preços por produto (nosso preço, menor preço e quem pratica, média, índice, posição, variação do mercado em 30 dias);
  - mapa de posicionamento dos concorrentes (cobertura do portfólio × preço vs. InoveLabor);
  - perfil de cada concorrente (tipo, UF, marcas, itens mais baratos que os nossos, disponibilidade);
  - marcas e posicionamento de preço;
  - oportunidades: preço acima do mercado, lacunas de portfólio, margem na mesa e risco de ruptura;
  - segmentos de clientes (universidades, indústria, escolas, análises clínicas, alimentos, saneamento);
  - coleta de preços em lote por concorrente e importação por CSV.
- Gerador de copys com voz técnica e formatos novos: anúncio Google Ads, SEO de produto na Tray, ficha técnica, e-mail para o RD Station e resposta de orçamento B2B.

Instagram e Meta Ads continuam disponíveis como integrações.
