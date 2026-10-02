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

## Versão 2: visual "modernão" no estilo Halogenn

O layout reproduz a estrutura e as animações da Halogenn, com a **paleta da InoveLabor** (azul-petróleo `#0b2a3c`, verde-água `#0e7c86` / `#22b8a7`) e a fonte **DM Sans**, identificada pelos prints do site de referência.

| Seção da Halogenn | Na InoveLabor | Animações |
|---|---|---|
| Header escuro: Mensagem + Orçamento com contador | Header transparente sobre o hero, que fica sólido e encolhe ao rolar | Sublinhado deslizante no menu, dropdown de produtos, barra de progresso de rolagem |
| Hero com fundo "seda" escuro, slider e "Especialistas em atender" | Hero em tela cheia com 3 slides e lista de Universidades, Indústrias, Laboratórios e Escolas | Fundo fluido animado (gradiente girando e fitas desfocadas), títulos subindo linha a linha, autoplay com barra de tempo |
| Faixa de blocos (laranja + bege) com pontos em losango | 4 blocos: Equipamentos, Vidrarias, Reagentes e Kits | Losangos piscando; no hover, a cor sobe pelo bloco, os pontos giram em onda e o ícone se desenha |
| "Atender e Entender" + imagem com barra lateral | "Inovar e Transformar" + vidrarias ilustradas com a marca na vertical | Líquido ondulando, bolhas subindo, entrada lateral |
| "Conheça a Halogenn" + 3 cards com ícones | "Conheça a InoveLabor" + 3 cards | Cards sobem e o ícone se redesenha |
| Grade de segmentos com seta circular | 6 segmentos atendidos | Sublinhado colorido, seta gira 45°, ícone pulsa |
| Faixa de logos de clientes | Pronta no HTML (comentada), aguardando os logos reais | Letreiro infinito em tons de cinza |
| Botão flutuante de WhatsApp | Igual | Pulso de "radar" |

Também há contadores animados, revelação de seções ao rolar e respeito à preferência de "reduzir movimento" do sistema.

> **Antes de publicar:** confirme o número do WhatsApp em `js/main.js` (`CONTATO.whatsapp`; hoje está com o telefone fixo) e os números da seção "InoveLabor em números".

## Estrutura

```
index.html       Página inicial (hero, números, categorias, destaques, empresa, diferenciais, segmentos, contato)
produtos.html    Catálogo com filtros por categoria e busca
css/style.css    Estilos (variáveis de cor no topo)
js/produtos.js   Lista de categorias e produtos: edite aqui para atualizar o catálogo
js/main.js       Orçamento, filtros, busca, menu mobile e formulários
assets/          Logos (normal e branco) e favicon em SVG
```

## Como editar

- **Produtos:** edite `js/produtos.js`. Cada item tem `sku`, `nome`, `categoria`, `sub` e `desc`.
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
