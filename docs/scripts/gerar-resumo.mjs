#!/usr/bin/env node
// Gera js/resumo.js (poucos KB) a partir de js/produtos.js, para a home carregar rápido:
// categorias com contagem, marcas, totais e uma seleção de produtos em destaque.
// O importador chama este script no final; rode à mão se editar js/produtos.js.
//
// Uso: node scripts/gerar-resumo.mjs

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function gerarResumo() {
  const ctx = { window: {} };
  vm.runInNewContext(await readFile(path.join(RAIZ, "js", "produtos.js"), "utf8"), ctx);
  const cats = ctx.window.CATEGORIAS || [];
  const prods = ctx.window.PRODUTOS || [];

  const categorias = cats.map((c) => {
    const itens = prods.filter((p) => p.categoria === c.id);
    const foto = itens.find((p) => p.imagem && p.disponivel !== false) || itens.find((p) => p.imagem);
    return { id: c.id, nome: c.nome, total: itens.length, imagem: foto ? foto.imagem : null };
  }).filter((c) => c.total > 0);

  const contagem = {};
  for (const p of prods) if (p.marca && !/^inovelabor$/i.test(p.marca)) contagem[p.marca] = (contagem[p.marca] || 0) + 1;
  const marcas = Object.keys(contagem).sort((a, b) => contagem[b] - contagem[a]);

  // Destaques: produtos marcados; completa com 1-2 por categoria (com foto, disponíveis, com preço)
  let destaques = prods.filter((p) => p.destaque && p.imagem && p.disponivel !== false);
  for (const c of categorias) {
    if (destaques.length >= 12) break;
    const extra = prods.find((p) => p.categoria === c.id && p.imagem && p.preco && p.disponivel !== false && !destaques.includes(p));
    if (extra) destaques.push(extra);
  }
  destaques = destaques.slice(0, 12);

  const resumo = {
    totalProdutos: prods.length,
    totalMarcas: marcas.length,
    categorias,
    marcas: marcas.slice(0, 18),
    destaques,
  };
  await writeFile(path.join(RAIZ, "js", "resumo.js"),
    `// Gerado por scripts/gerar-resumo.mjs a partir de js/produtos.js. Não edite à mão.\nwindow.RESUMO = ${JSON.stringify(resumo)};\n`);
  return resumo;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  gerarResumo().then((r) => console.log(`js/resumo.js: ${r.categorias.length} categorias, ${r.marcas.length} marcas, ${r.destaques.length} destaques`));
}
