#!/usr/bin/env node
// Sincroniza o catálogo do site com a loja Tray (API oficial) e gera js/produtos.js.
//
// Uso:  node scripts/sync-tray.mjs
//
// Variáveis de ambiente:
//   TRAY_API_ADDRESS     Endereço da API da loja, como veio no callback (ex.: https://www.inovelabor.com.br/web_api)
//   Autenticação (o script tenta nesta ordem):
//   TRAY_ACCESS_TOKEN    Token de acesso válido (expira em 3 h)
//   TRAY_REFRESH_TOKEN   Token de renovação (expira em 30 dias)
//   TRAY_CONSUMER_KEY + TRAY_CONSUMER_SECRET + TRAY_CODE   Primeira autorização (o code é de uso único)
//
// Os tokens obtidos ficam em .tray-tokens.json (fora do git) para as próximas execuções.
// Documentação: https://developers.tray.com.br/

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARQ_TOKENS = path.join(RAIZ, ".tray-tokens.json");
const ARQ_SAIDA = path.join(RAIZ, "js", "produtos.js");
const LIMITE = 50; // máximo da API por página
const PAUSA_MS = 400; // fica abaixo de 180 requisições/minuto

const env = process.env;
const api = normalizarApi(env.TRAY_API_ADDRESS);
if (!api) sair("Defina TRAY_API_ADDRESS (ex.: https://www.inovelabor.com.br/web_api).");

function normalizarApi(v) {
  if (!v) return "";
  v = v.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//.test(v)) v = "https://" + v;
  return v;
}
function sair(msg) { console.error("Erro: " + msg); process.exit(1); }
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function http(url, opcoes = {}, tentativa = 0) {
  const res = await fetch(url, opcoes);
  if (res.status === 429 && tentativa < 5) {
    await esperar(1000 * 2 ** tentativa);
    return http(url, opcoes, tentativa + 1);
  }
  const texto = await res.text();
  let json;
  try { json = JSON.parse(texto); } catch { json = null; }
  if (!res.ok) {
    const causa = json ? JSON.stringify(json.causes || json.message || json) : texto.slice(0, 200);
    const erro = new Error(`HTTP ${res.status} em ${url.split("?")[0]}: ${causa}`);
    erro.status = res.status;
    throw erro;
  }
  return json;
}

// ---------- Autenticação ----------
async function lerTokensSalvos() {
  try { return JSON.parse(await readFile(ARQ_TOKENS, "utf8")); } catch { return null; }
}
async function salvarTokens(t) {
  const dados = {
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    date_expiration_access_token: t.date_expiration_access_token,
    date_expiration_refresh_token: t.date_expiration_refresh_token,
  };
  await writeFile(ARQ_TOKENS, JSON.stringify(dados, null, 2), { mode: 0o600 });
}
function aindaValido(data) {
  // A Tray devolve "AAAA-MM-DD HH:MM:SS" no horário de Brasília (UTC-3).
  if (!data) return false;
  const t = Date.parse(data.replace(" ", "T") + "-03:00");
  return Number.isFinite(t) && t - Date.now() > 5 * 60 * 1000;
}
async function renovar(refresh) {
  const t = await http(`${api}/auth?refresh_token=${encodeURIComponent(refresh)}`);
  await salvarTokens(t);
  return t.access_token;
}
async function obterToken() {
  const salvos = await lerTokensSalvos();
  if (salvos && aindaValido(salvos.date_expiration_access_token)) return salvos.access_token;
  if (salvos?.refresh_token && aindaValido(salvos.date_expiration_refresh_token)) {
    console.log("Renovando token salvo...");
    return renovar(salvos.refresh_token);
  }
  if (env.TRAY_ACCESS_TOKEN) return env.TRAY_ACCESS_TOKEN;
  if (env.TRAY_REFRESH_TOKEN) {
    console.log("Renovando token a partir de TRAY_REFRESH_TOKEN...");
    return renovar(env.TRAY_REFRESH_TOKEN);
  }
  if (env.TRAY_CONSUMER_KEY && env.TRAY_CONSUMER_SECRET && env.TRAY_CODE) {
    console.log("Gerando tokens com o código de autorização...");
    const t = await http(`${api}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consumer_key: env.TRAY_CONSUMER_KEY,
        consumer_secret: env.TRAY_CONSUMER_SECRET,
        code: env.TRAY_CODE,
      }),
    });
    await salvarTokens(t);
    return t.access_token;
  }
  sair("Nenhuma credencial encontrada. Defina TRAY_ACCESS_TOKEN, TRAY_REFRESH_TOKEN ou TRAY_CONSUMER_KEY + TRAY_CONSUMER_SECRET + TRAY_CODE.");
}

// ---------- Utilidades de texto ----------
function semHtml(s) {
  return String(s || "")
    .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();
}
function resumir(s, max = 160) {
  s = semHtml(s);
  if (s.length <= max) return s;
  return s.slice(0, s.lastIndexOf(" ", max)).replace(/[,.;:\-–]+$/, "") + "…";
}
function slug(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function icone(nome) {
  const n = slug(nome);
  const mapa = [
    [/equip|aparelho|medidor|instrument/, "⚙️"], [/vidr|vidro/, "🧪"], [/reag|quimic|solu/, "⚗️"],
    [/kit|didat|ensino/, "🎒"], [/consum|descart/, "🧤"], [/inox|ferrag|metal/, "🔩"],
    [/porcel|ceram/, "🏺"], [/plast/, "🧴"], [/acess/, "🧰"], [/micro/, "🔬"],
  ];
  for (const [re, ic] of mapa) if (re.test(n)) return ic;
  return "🔬";
}
const num = (v) => (v === undefined || v === null || v === "" ? null : Number(v));

// ---------- Coleta ----------
async function buscarCategorias(token) {
  const json = await http(`${api}/categories?access_token=${token}`);
  const porId = new Map();
  function percorrer(lista, raiz) {
    for (const item of lista || []) {
      const c = item.Category || item;
      const id = String(c.id);
      const r = raiz || { id, nome: c.name };
      porId.set(id, { nome: c.name, raiz: r, descricao: c.description || c.small_description || "" });
      percorrer(c.children, r);
    }
  }
  percorrer(json.Categories || json.categories || []);
  return porId;
}

async function buscarProdutos(token) {
  const todos = [];
  for (let pagina = 1; ; pagina++) {
    const json = await http(`${api}/products?access_token=${token}&limit=${LIMITE}&page=${pagina}&available_in_store=1`);
    const lista = (json.Products || []).map((p) => p.Product || p);
    todos.push(...lista);
    const total = Number(json.paging?.total ?? json.total ?? 0);
    process.stdout.write(`\rProdutos lidos: ${todos.length}${total ? " de " + total : ""}`);
    if (!lista.length || lista.length < LIMITE || (total && todos.length >= total)) break;
    await esperar(PAUSA_MS);
  }
  process.stdout.write("\n");
  return todos;
}

function primeiraImagem(p) {
  const imgs = p.ProductImage || p.images || [];
  const img = Array.isArray(imgs) ? imgs[0] : imgs;
  if (!img) return null;
  return img.https || img.http || img.image_url || null;
}

async function completarImagens(token, produtos) {
  const faltando = produtos.filter((p) => !primeiraImagem(p));
  if (!faltando.length) return;
  console.log(`Buscando imagens de ${faltando.length} produtos...`);
  for (const p of faltando) {
    try {
      const json = await http(`${api}/products/${p.id}?access_token=${token}`);
      const d = json.Product || json;
      if (d.ProductImage) p.ProductImage = d.ProductImage;
      if (!p.url && d.url) p.url = d.url;
    } catch (e) {
      console.warn(`  Produto ${p.id}: ${e.message}`);
    }
    await esperar(PAUSA_MS);
  }
}

// ---------- Geração do arquivo ----------
function montar(categorias, produtos) {
  const usadas = new Map();
  const skus = new Set();
  const lista = [];
  for (const p of produtos) {
    if (String(p.available_in_store ?? "1") === "0") continue;
    const cat = categorias.get(String(p.category_id));
    const raiz = cat ? cat.raiz : { id: "outros", nome: "Outros" };
    const idCat = slug(raiz.nome) || "outros";
    if (!usadas.has(idCat)) usadas.set(idCat, { id: idCat, nome: raiz.nome, icone: icone(raiz.nome), total: 0, descricao: categorias.get(raiz.id)?.descricao });
    usadas.get(idCat).total++;

    let sku = String(p.reference || "").trim() || `TRAY-${p.id}`;
    if (skus.has(sku)) sku = `${sku}-${p.id}`;
    skus.add(sku);

    const preco = num(p.price);
    const promo = num(p.promotional_price);
    const emPromo = promo && promo > 0 && promo < preco;
    const url = typeof p.url === "object" ? (p.url.https || p.url.http) : p.url;

    lista.push({
      sku,
      nome: semHtml(p.name),
      categoria: idCat,
      sub: cat && cat.nome !== raiz.nome ? cat.nome : (p.brand || raiz.nome),
      desc: resumir(p.description_small || p.description) || "Consulte especificações na loja.",
      imagem: primeiraImagem(p),
      url: url || null,
      preco: emPromo ? promo : preco,
      precoDe: emPromo ? preco : null,
      disponivel: String(p.available ?? "1") === "1" && num(p.stock) !== 0,
      destaque: String(p.hot) === "1",
    });
  }
  const cats = [...usadas.values()]
    .sort((a, b) => b.total - a.total)
    .map((c) => ({ id: c.id, nome: c.nome, icone: c.icone, desc: resumir(c.descricao, 110) || `${c.total} produtos nesta linha.` }));
  return { cats, lista };
}

async function main() {
  const token = await obterToken();
  console.log("Lendo categorias...");
  const categorias = await buscarCategorias(token);
  console.log(`${categorias.size} categorias encontradas.`);
  const produtos = await buscarProdutos(token);
  await completarImagens(token, produtos);
  const { cats, lista } = montar(categorias, produtos);
  if (!lista.length) sair("A API não devolveu nenhum produto visível. O arquivo atual foi mantido.");

  const conteudo = `// Gerado automaticamente por scripts/sync-tray.mjs em ${new Date().toISOString()}.
// Não edite à mão: rode "node scripts/sync-tray.mjs" para atualizar a partir da loja Tray.
window.CATALOGO_ORIGEM = "tray";
window.CATEGORIAS = ${JSON.stringify(cats, null, 2)};

window.PRODUTOS = ${JSON.stringify(lista, null, 1)};
`;
  await writeFile(ARQ_SAIDA, conteudo);
  console.log(`Pronto: ${lista.length} produtos em ${cats.length} categorias → js/produtos.js`);
}

main().catch((e) => sair(e.message));
