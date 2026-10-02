#!/usr/bin/env node
// Lê a loja pública (sem token) e gera js/produtos.js com nome, foto, preço, código,
// descrição, categoria e link de cada produto.
//
// Uso:
//   node scripts/importar-loja.mjs                    # lê https://www.inovelabor.com.br
//   node scripts/importar-loja.mjs --baixar-imagens   # também salva as fotos em assets/produtos/
//
// Opções por variável de ambiente:
//   LOJA_URL        Endereço da loja (padrão https://www.inovelabor.com.br)
//   LIMITE          Máximo de produtos a importar (padrão: todos)
//   MAX_PAGINAS     Máximo de páginas visitadas quando não há sitemap (padrão 3000)
//
// Como encontra os produtos: primeiro o sitemap.xml; se não houver, navega pelos links do site.
// Uma página é tratada como produto quando tem dados estruturados de Produto (JSON-LD,
// microdados ou og:type=product). As categorias vêm do breadcrumb ou do 1º trecho da URL.

import { mkdir, writeFile, access, unlink } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = path.join(RAIZ, "js", "produtos.js");
const PASTA_IMG = path.join(RAIZ, "assets", "produtos");
const BASE = (process.env.LOJA_URL || "https://www.inovelabor.com.br").replace(/\/+$/, "");
const ORIGEM = new URL(BASE).origin;
const LIMITE = Number(process.env.LIMITE) || Infinity;
const MAX_PAGINAS = Number(process.env.MAX_PAGINAS) || 3000;
const BAIXAR = process.argv.includes("--baixar-imagens");
const PARALELO = 3;
const PAUSA_MS = 250;
const UA = "Mozilla/5.0 (compatible; InoveLaborCatalogo/1.0; +" + BASE + ")";

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function baixar(url, tipo = "text", tentativa = 0) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: tipo === "text" ? "text/html,application/xml;q=0.9,*/*;q=0.8" : "*/*" }, redirect: "follow" });
    if (res.status === 429 || res.status >= 500) throw Object.assign(new Error("HTTP " + res.status), { tentar: true });
    if (!res.ok) return null;
    if (tipo === "text") {
      const bytes = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get("content-type") || "";
      let cs = (ct.match(/charset=([\w-]+)/i) || [])[1];
      if (!cs) cs = (bytes.subarray(0, 4096).toString("latin1").match(/<meta[^>]+charset=["']?([\w-]+)/i) || [])[1];
      let dec;
      try { dec = new TextDecoder(cs || "utf-8"); } catch { dec = new TextDecoder("utf-8"); }
      return { url: res.url, corpo: dec.decode(bytes), tipo: ct };
    }
    return tipo === "text" ? null
      : { url: res.url, corpo: Buffer.from(await res.arrayBuffer()), tipo: res.headers.get("content-type") || "" };
  } catch (e) {
    if (tentativa < 3) { await esperar(1000 * 2 ** tentativa); return baixar(url, tipo, tentativa + 1); }
    console.warn(`  falhou: ${url} (${e.message})`);
    return null;
  }
}

// Executa tarefas com concorrência limitada.
async function emLotes(itens, fn) {
  const resultados = new Array(itens.length);
  let i = 0;
  async function trabalhador() {
    while (i < itens.length) {
      const k = i++;
      resultados[k] = await fn(itens[k], k);
      await esperar(PAUSA_MS);
    }
  }
  await Promise.all(Array.from({ length: PARALELO }, trabalhador));
  return resultados;
}

// ---------- Texto ----------
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ordm: "º", ordf: "ª", deg: "°", micro: "µ",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…", bull: "•", middot: "·", times: "×",
  plusmn: "±", sup2: "²", sup3: "³", frac12: "½", reg: "®", copy: "©", trade: "™", ccedil: "ç", Ccedil: "Ç",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", atilde: "ã", otilde: "õ", acirc: "â", ecirc: "ê", ocirc: "ô",
  agrave: "à", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú", Atilde: "Ã", Otilde: "Õ", Acirc: "Â", Ecirc: "Ê", Ocirc: "Ô", uuml: "ü" };
function decodificar(s) {
  return String(s || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z0-9]+);/gi, (m, n) => ENT[n] ?? ENT[n.toLowerCase()] ?? m);
}
function semHtml(s) {
  return decodificar(String(s || "").replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, " ").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ").trim();
}
function resumir(s, max = 170) {
  s = semHtml(s);
  if (s.length <= max) return s;
  const corte = s.lastIndexOf(" ", max);
  return s.slice(0, corte > 60 ? corte : max).replace(/[,.;:\-–]+$/, "") + "…";
}
function descricao(og, alternativa) {
  let t = semHtml(og);
  if (/\.{2,}\s*$/.test(t)) t = t.replace(/\.{2,}\s*$/, "").replace(/\s+\S*$/, "") + "…"; // a loja corta no meio da palavra
  if (!t) t = semHtml(alternativa);
  t = t.replace(/^[\s.;,:•\-–]+/, "").replace(/\s*([;:])\s*\.\s*/g, "$1 ").replace(/\s+\.\s+/g, ". ");
  return resumir(t);
}
function slug(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function tituloDeSlug(s) {
  return decodeURIComponent(s).replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function icone(nome) {
  const n = slug(nome);
  const mapa = [[/equip|aparelho|medidor/, "⚙️"], [/vidr|vidro/, "🧪"], [/reag|quimic|solu/, "⚗️"], [/kit|didat|ensino/, "🎒"],
    [/consum|descart/, "🧤"], [/inox|ferrag|metal/, "🔩"], [/porcel|ceram/, "🏺"], [/plast/, "🧴"], [/acess/, "🧰"], [/micro/, "🔬"]];
  for (const [re, ic] of mapa) if (re.test(n)) return ic;
  return "🔬";
}
function absoluta(href, base) {
  try { const u = new URL(decodificar(href), base); u.hash = ""; return u.href; } catch { return null; }
}
function preco(v) {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "number") return v;
  let s = String(v).replace(/[^\d.,]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function meta(html, chave) {
  const re = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${chave}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  return tag ? decodificar(tag.match(/content=["']([^"']*)["']/i)?.[1] || "") : "";
}

// ---------- Descoberta de URLs ----------
async function lerSitemap(url, vistos = new Set()) {
  if (vistos.has(url) || vistos.size > 50) return [];
  vistos.add(url);
  const r = await baixar(url);
  if (!r || !/<(urlset|sitemapindex)/i.test(r.corpo)) return [];
  const locs = [...r.corpo.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decodificar(m[1]));
  if (/<sitemapindex/i.test(r.corpo)) {
    const todas = [];
    for (const s of locs) todas.push(...(await lerSitemap(s, vistos)));
    return todas;
  }
  return locs;
}

function linksInternos(html, base) {
  const out = new Set();
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)) {
    const u = absoluta(m[1], base);
    if (!u || !u.startsWith(ORIGEM)) continue;
    if (/\.(jpe?g|png|gif|webp|svg|pdf|zip|css|js|xml)(\?|$)/i.test(u)) continue;
    if (/\/(carrinho|checkout|cart|login|cadastro|minha-conta|central-do-cliente|busca|search|logout)(\/|\?|$)/i.test(u)) continue;
    out.add(u.replace(/\?(?!.*\bpag(e|ina)?=).*$/i, "")); // mantém só paginação nos parâmetros
  }
  return [...out];
}

// ---------- Extração de produto ----------
function blocosJsonLd(html) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(m[1].trim());
      const fila = Array.isArray(j) ? [...j] : [j];
      while (fila.length) {
        const o = fila.shift();
        if (!o || typeof o !== "object") continue;
        out.push(o);
        if (Array.isArray(o["@graph"])) fila.push(...o["@graph"]);
      }
    } catch { /* JSON-LD inválido: ignora */ }
  }
  return out;
}
const ehTipo = (o, t) => [].concat(o["@type"] || []).some((x) => String(x).toLowerCase() === t);

function extrairProduto(html, url) {
  const ld = blocosJsonLd(html);
  const p = ld.find((o) => ehTipo(o, "product"));
  const ogProduto = /og:type["'][^>]*content=["']product/i.test(html) || /content=["']product["'][^>]*og:type/i.test(html);
  const micro = /itemtype=["']https?:\/\/schema\.org\/Product["']/i.test(html);
  if (!p && !ogProduto && !micro) return null;

  const oferta = p ? [].concat(p.offers || [])[0] || {} : {};
  const ofertaItem = oferta.offers ? [].concat(oferta.offers)[0] : oferta;
  const imgsLd = p ? [].concat(p.image || []).map((i) => (typeof i === "object" ? i.url || i.contentUrl : i)) : [];
  const imagem = absoluta(imgsLd[0] || meta(html, "og:image") || meta(html, "image") || "", url);

  const nome = semHtml(p?.name || meta(html, "og:title").replace(/\s+-\s+[^-]+$/, "") || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "");
  if (!nome) return null;
  const valor = preco(ofertaItem.price ?? ofertaItem.lowPrice ?? meta(html, "product:price:amount") ?? meta(html, "price"));
  const disp = String(ofertaItem.availability || meta(html, "product:availability") || "").toLowerCase();

  // Categoria: breadcrumb (JSON-LD) > 1º trecho da URL
  let catNome = "", subNome = "";
  const bc = ld.find((o) => ehTipo(o, "breadcrumblist"));
  if (bc?.itemListElement) {
    const nomes = [].concat(bc.itemListElement)
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map((e) => semHtml(e.name || e.item?.name || ""))
      .filter((n) => n && !/^(home|in[ií]cio|p[aá]gina inicial)$/i.test(n) && n !== nome);
    catNome = nomes[0] || "";
    subNome = nomes.length > 1 ? nomes[nomes.length - 1] : "";
  }
  const bd = html.match(/"breadcrumbDetails"\s*:\s*(\[[^\]]*\])/);
  if (bd) {
    try {
      const niveis = JSON.parse(bd[1]).sort((a, b) => a.level - b.level);
      if (niveis.length) { catNome = niveis[0].name; subNome = niveis.length > 1 ? niveis[niveis.length - 1].name : ""; }
    } catch { /* formato inesperado */ }
  }
  const partes = new URL(url).pathname.split("/").filter(Boolean);
  if (!catNome && partes.length > 1) catNome = tituloDeSlug(partes[0]);
  if (!catNome && p?.category) catNome = semHtml(String(p.category).split(/[>/]/)[0]);
  if (!catNome) catNome = "Outros";

  return {
    nome,
    sku: semHtml(p?.sku || p?.mpn || meta(html, "product:retailer_item_id") || ""),
    marca: semHtml(typeof p?.brand === "object" ? p.brand.name : p?.brand || ""),
    desc: descricao(meta(html, "og:description"), p?.description || meta(html, "description")),
    imagem,
    url,
    preco: valor,
    disponivel: !/outofstock|out of stock|soldout|discontinued/.test(disp),
    catNome,
    subNome,
  };
}

// ---------- Imagens ----------
// Com ImageMagick instalado, as fotos viram WebP de até 600px (≈10 KB cada); sem ele, ficam no formato original.
const exec = promisify(execFile);
let conversor;
async function acharConversor() {
  if (conversor !== undefined) return conversor;
  for (const c of ["magick", "convert"]) {
    try { await exec(c, ["-version"]); conversor = c; return c; } catch { /* tenta o próximo */ }
  }
  console.warn("  ImageMagick não encontrado: fotos ficarão no tamanho original.");
  return (conversor = null);
}
async function existe(f) { try { await access(f); return true; } catch { return false; } }

async function salvarImagem(urlImg, nomeBase) {
  if (!urlImg) return null;
  const webp = path.join(PASTA_IMG, `${nomeBase}.webp`);
  if (await existe(webp)) return `assets/produtos/${nomeBase}.webp`;
  const ext = (urlImg.match(/\.(jpe?g|png|webp|gif)(\?|$)/i)?.[1] || "jpg").toLowerCase().replace("jpeg", "jpg");
  const original = path.join(PASTA_IMG, `${nomeBase}.${ext}`);
  if (ext !== "webp" && await existe(original)) return `assets/produtos/${nomeBase}.${ext}`;
  const r = await baixar(urlImg, "bin");
  if (!r || !/^image\//.test(r.tipo)) return null;
  const c = await acharConversor();
  if (c) {
    const temp = original + ".tmp";
    await writeFile(temp, r.corpo);
    try {
      await exec(c, [temp + "[0]", "-resize", "600x600>", "-background", "white", "-alpha", "remove", "-quality", "80", webp]);
      await unlink(temp);
      return `assets/produtos/${nomeBase}.webp`;
    } catch { await unlink(temp).catch(() => {}); }
  }
  await writeFile(original, r.corpo);
  return `assets/produtos/${nomeBase}.${ext}`;
}

// ---------- Principal ----------
async function main() {
  console.log(`Lendo ${BASE} ...`);
  const inicial = await baixar(BASE + "/");
  if (!inicial) throw new Error(`Não foi possível abrir ${BASE}. Verifique o endereço e o acesso à rede.`);

  let candidatas = (await lerSitemap(BASE + "/sitemap.xml")).filter((u) => u.startsWith(ORIGEM));
  const robots = await baixar(BASE + "/robots.txt");
  for (const m of robots?.corpo.matchAll(/^sitemap:\s*(\S+)/gim) || []) {
    candidatas.push(...(await lerSitemap(m[1])).filter((u) => u.startsWith(ORIGEM)));
  }
  candidatas = [...new Set(candidatas)];

  const produtos = new Map();
  const registrar = (prod) => {
    if (!prod || produtos.size >= LIMITE) return;
    const chave = prod.url.replace(/[?#].*$/, "");
    if (!produtos.has(chave)) produtos.set(chave, prod);
  };

  if (candidatas.length) {
    console.log(`Sitemap: ${candidatas.length} páginas. Lendo produtos...`);
    let feitas = 0;
    await emLotes(candidatas, async (u) => {
      if (produtos.size >= LIMITE) return;
      const r = await baixar(u);
      if (r && /html/i.test(r.tipo)) registrar(extrairProduto(r.corpo, r.url));
      if (++feitas % 25 === 0) process.stdout.write(`\r  ${feitas}/${candidatas.length} páginas · ${produtos.size} produtos`);
    });
    process.stdout.write("\n");
  }

  if (!produtos.size) {
    console.log("Sem sitemap útil. Navegando pelos links do site...");
    const fila = [inicial.url];
    const visitadas = new Set();
    while (fila.length && visitadas.size < MAX_PAGINAS && produtos.size < LIMITE) {
      const lote = fila.splice(0, PARALELO).filter((u) => !visitadas.has(u));
      lote.forEach((u) => visitadas.add(u));
      const paginas = await emLotes(lote, (u) => baixar(u));
      for (const r of paginas) {
        if (!r || !/html/i.test(r.tipo)) continue;
        registrar(extrairProduto(r.corpo, r.url));
        for (const l of linksInternos(r.corpo, r.url)) if (!visitadas.has(l) && !fila.includes(l)) fila.push(l);
      }
      process.stdout.write(`\r  ${visitadas.size} páginas visitadas · ${produtos.size} produtos`);
    }
    process.stdout.write("\n");
  }

  if (!produtos.size) throw new Error("Nenhum produto encontrado. O arquivo atual foi mantido.");

  if (BAIXAR) {
    await mkdir(PASTA_IMG, { recursive: true });
    console.log("Baixando fotos...");
    let n = 0;
    await emLotes([...produtos.values()], async (p) => {
      const local = await salvarImagem(p.imagem, slug(new URL(p.url).pathname.split("/").filter(Boolean).pop() || p.nome).slice(0, 80));
      if (local) { p.imagemOriginal = p.imagem; p.imagem = local; }
      if (++n % 25 === 0) process.stdout.write(`\r  ${n}/${produtos.size}`);
    });
    process.stdout.write("\n");
  }

  // Monta categorias e códigos únicos
  const cats = new Map();
  const skus = new Set();
  const lista = [];
  for (const p of produtos.values()) {
    const idCat = slug(p.catNome) || "outros";
    if (!cats.has(idCat)) cats.set(idCat, { id: idCat, nome: p.catNome, icone: icone(p.catNome), total: 0 });
    cats.get(idCat).total++;
    let sku = p.sku || "IL-" + slug(new URL(p.url).pathname.split("/").filter(Boolean).pop() || p.nome).slice(0, 40);
    if (skus.has(sku)) { let i = 2; while (skus.has(`${sku}-${i}`)) i++; sku = `${sku}-${i}`; }
    skus.add(sku);
    lista.push({
      sku, nome: p.nome, categoria: idCat, marca: p.marca || null,
      sub: p.subNome && p.subNome !== p.catNome ? p.subNome : (p.marca || p.catNome),
      desc: p.desc || "Consulte especificações na loja.",
      imagem: p.imagem || null, url: p.url, preco: p.preco, precoDe: null,
      disponivel: p.disponivel, destaque: false,
    });
  }
  const categorias = [...cats.values()].sort((a, b) => b.total - a.total)
    .map((c) => ({ id: c.id, nome: c.nome, icone: c.icone, desc: `${c.total} ${c.total === 1 ? "produto" : "produtos"} nesta linha.` }));
  // Destaque: os primeiros com foto de cada categoria
  for (const c of categorias) {
    lista.filter((p) => p.categoria === c.id && p.imagem).slice(0, 2).forEach((p) => { p.destaque = true; });
  }

  await writeFile(SAIDA, `// Gerado automaticamente por scripts/importar-loja.mjs a partir de ${BASE} em ${new Date().toISOString()}.
// Não edite à mão: rode "node scripts/importar-loja.mjs" para atualizar.
window.CATALOGO_ORIGEM = "site";
window.CATEGORIAS = ${JSON.stringify(categorias, null, 2)};

window.PRODUTOS = ${JSON.stringify(lista, null, 1)};
`);
  const comFoto = lista.filter((p) => p.imagem).length;
  const comPreco = lista.filter((p) => p.preco).length;
  console.log(`Pronto: ${lista.length} produtos (${comFoto} com foto, ${comPreco} com preço) em ${categorias.length} categorias → js/produtos.js`);
}

main().catch((e) => { console.error("Erro: " + e.message); process.exit(1); });
