# InoveLabor — Site Institucional e Catálogo

Site estático (HTML, CSS e JavaScript puro) da **InoveLabor Produtos para Laboratórios**. Ele segue o modelo de "catálogo + orçamento" usado por distribuidores do setor, como a Halogenn Científica.

## Análise da referência: halogenn.com.br

| Aspecto | Halogenn | Como foi aplicado na InoveLabor |
|---|---|---|
| **Proposta** | Distribuidor de produtos químicos e acessórios para laboratório ("fonte confiável de produtos científicos, laboratoriais e químicos") | Hero com proposta clara: tudo para o laboratório, com atendimento técnico e entrega nacional |
| **Estrutura** | Home → Produtos (catálogo por categoria) → página de produto por código (ex.: `HL100.630`) → Contatos | Home → `produtos.html` (catálogo filtrável) → cada item com código (`IL-EQ-001`) → Contato |
| **Catálogo** | Categorias como Reagentes (solventes, ácidos, bases, sulfatos, álcoois…), Soluções (padrão, condutividade, Brix, redox, turbidez) e Meios de cultura | 5 linhas: Equipamentos, Vidrarias, Reagentes, Kits Didáticos e Acessórios, com subcategorias |
| **Conversão** | Venda B2B por cotação (telefone e e-mail de vendas) | **Lista de orçamento**: o cliente adiciona produtos e envia a lista pronta por e-mail para `vendas@` |
| **Confiança** | CNPJ, endereço e contatos visíveis | Barra superior com contatos, rodapé com CNPJ, endereço, horário e seção "A Empresa" |
| **Visual** | Visual técnico/científico e sóbrio | Paleta azul-petróleo e verde-água (ciência e confiança), tipografia Montserrat + Inter, ícones de laboratório |

**O que foi melhorado em relação à referência:**
- Carrinho de orçamento salvo no navegador, com quantidades e envio em um clique.
- Busca no topo e busca instantânea no catálogo, que ignora acentos.
- Seções de diferenciais, segmentos atendidos e missão/visão/valores.
- Layout responsivo (mobile first), metatags de SEO e Open Graph.
- Nenhuma dependência nem etapa de build: basta hospedar os arquivos.

> Observação: o ambiente de desenvolvimento não tinha acesso direto a halogenn.com.br. Por isso, a análise se baseou na estrutura pública do site (páginas, categorias e padrão de códigos de produto) e nas informações indexadas por buscadores.

## Versão atual: identidade própria "bancada de laboratório"

O visual deixou de seguir a Halogenn e ganhou identidade própria: papel milimetrado, **tabela periódica** com as linhas de produto (o número de cada elemento é a quantidade de itens), CTAs âmbar de etiqueta de segurança e as fontes Bricolage Grotesque, Instrument Sans e JetBrains Mono.

- **CTAs em toda a página:** busca com sugestões (foto e preço), "Cotar no WhatsApp", "Comprar" na loja, "+ Orçamento" e barra fixa no celular.
- **Performance:** a home carrega só `js/resumo.js` (≈8 KB). O catálogo completo (`js/produtos.js`) só é baixado no catálogo ou quando a pessoa usa a busca. As fotos são WebP de ≈10 KB com carregamento sob demanda, e as animações usam apenas transform e opacity.
- **Orçamento:** a lista é enviada pelo WhatsApp (ou por e-mail) já com os itens e as quantidades.

## Publicar no GitHub Pages
O site fica em `docs/`. No GitHub, abra **Settings → Pages**. Em *Build and deployment*, escolha **Deploy from a branch**, depois a branch `claude/inovelabor-website-analysis-t3qv52` e a pasta **/docs**, e clique em **Save**. O endereço será `https://hctoliv.github.io/hctoliv/`.

## Importar o catálogo lendo a loja pública (sem token)

`scripts/importar-loja.mjs` percorre o site da loja, primeiro pelo `sitemap.xml` e, sem ele, navegando pelos links. Em cada página de produto lê os dados estruturados (JSON-LD/og): nome, foto, preço, código, marca, descrição, disponibilidade, categoria (pelo breadcrumb ou pela URL) e link. O resultado vai para `js/produtos.js`.

Em ambientes com proxy (como o Claude Code na nuvem), o `fetch` do Node precisa de `NODE_USE_ENV_PROXY=1` (Node 22.21+).

```bash
node scripts/importar-loja.mjs                   # fotos ficam apontando para a loja
node scripts/importar-loja.mjs --baixar-imagens  # salva as fotos em assets/produtos/ e regenera js/resumo.js
LIMITE=50 node scripts/importar-loja.mjs         # importa só os 50 primeiros (teste rápido)
```
Com `--baixar-imagens` e o ImageMagick instalado, cada foto vira WebP de até 600px (≈10 KB). Use essa opção quando quiser que as fotos apareçam também na prévia em claude.ai ou em hospedagens que não permitem imagens externas. Com milhares de produtos a pasta fica grande, então para o site publicado o padrão (fotos da loja) é mais leve.

## Catálogo sincronizado com a loja Tray

O script `scripts/sync-tray.mjs` lê os produtos visíveis da loja pela API oficial da Tray e gera `js/produtos.js`. O resultado inclui nome, foto, preço (com promoção), categoria e subcategoria, descrição curta, disponibilidade, destaque e link para comprar na loja. Requer Node 18 ou mais novo e nenhuma dependência.

### 1. Criar o acesso (uma vez)
1. Crie uma conta em [developers.tray.com.br](https://developers.tray.com.br/) e cadastre um aplicativo. Você recebe `consumer_key` e `consumer_secret`.
2. Logado no painel da loja, abra:
   `https://www.inovelabor.com.br/auth.php?response_type=code&consumer_key=SUA_CONSUMER_KEY&callback=https://www.inovelabor.com.br/`
3. Autorize. O navegador volta para a loja com `code=...` e `api_address=...` no endereço. Copie os dois. O `code` vale só para um uso.

### 2. Rodar
```bash
export TRAY_API_ADDRESS="https://www.inovelabor.com.br/web_api"   # o api_address do passo 3
export TRAY_CONSUMER_KEY="..."  TRAY_CONSUMER_SECRET="..."  TRAY_CODE="..."
node scripts/sync-tray.mjs
```
Na primeira execução o script troca o `code` por tokens e os guarda em `.tray-tokens.json` (ignorado pelo git). Nas próximas ele reutiliza e renova sozinho: o token de acesso dura 3 horas e o de renovação, 30 dias. Se ficar mais de 30 dias sem rodar, repita o passo 1.3.

Alternativas: `TRAY_ACCESS_TOKEN` (token válido) ou `TRAY_REFRESH_TOKEN`.

### Depois da sincronização
- As categorias do site passam a ser as categorias principais da Tray. Os 4 blocos da home apontam para `produtos.html#equipamentos`, `#vidrarias`, `#reagentes` e `#kits`. Se o nome de alguma categoria na Tray for diferente, ajuste o link no `index.html`. Links desconhecidos abrem o catálogo em "Todas".
- Os "Produtos em destaque" da home usam os produtos marcados como **destaque** na Tray.
- Produtos sem estoque ou indisponíveis aparecem com o selo "Sob consulta" e continuam podendo entrar no orçamento.
- Na prévia em claude.ai as fotos da loja não carregam (o ambiente bloqueia imagens externas) e aparecem como ícone. No site publicado elas carregam normalmente.

## Estrutura

```
index.html       Página inicial (hero, números, categorias, destaques, empresa, diferenciais, segmentos, contato)
produtos.html    Catálogo com filtros por categoria e busca
css/style.css    Estilos (variáveis de cor no topo)
js/produtos.js   Lista de categorias e produtos: edite aqui para atualizar o catálogo
js/main.js       Orçamento, filtros, busca, menu mobile e formulários
scripts/         importar-loja.mjs: lê a loja pública · sync-tray.mjs: usa a API da Tray
assets/          Logos (normal e branco) e favicon em SVG
```

## Como editar

- **Produtos:** rode a sincronização com a Tray (acima). Sem ela, `js/produtos.js` traz 38 produtos de exemplo.
- **Contatos:** telefone, e-mail e endereço estão em `index.html` (topbar, contato e rodapé) e `js/main.js` (`CONTATO`).
- **Cores e fonte:** variáveis `--navy`, `--teal`, `--teal-2` e `--font` no início de `css/style.css`.
- **Números da home** (seção "InoveLabor em números"): revise para refletir dados reais da empresa.

## Rodar localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Publicar

Funciona em qualquer hospedagem estática: GitHub Pages (Settings → Pages → branch `main`), Netlify, Vercel ou a hospedagem atual do domínio `inovelabor.com.br`.

## Próximos passos sugeridos

- Trocar os ícones dos produtos por fotos reais (`produto-thumb`).
- Adicionar os logos de clientes (bloco comentado na seção "Quem confia na InoveLabor").
- Integrar o formulário a um serviço de envio (Formspree, EmailJS ou backend próprio) e/ou ao WhatsApp Business.
- Adicionar páginas individuais de produto com ficha técnica e PDF.
- Instalar Google Analytics / Meta Pixel para medir as solicitações de orçamento.
