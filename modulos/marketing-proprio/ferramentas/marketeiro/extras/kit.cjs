'use strict';
// Gera o kit de marca do corretor em HTML (painel/marca/) a partir de sede/marketing/marca.json.
// Mesmo esquema e mesmo visual do kit de marca da EstrategistaLabs (molde de marketing v1.2), portado para Node, sem dependências.
// Uso (na pasta do agente): node ferramentas/marketeiro/extras/kit.cjs
const fs = require('fs');
const path = require('path');

const IMAGENS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);
const HEX = /^#[0-9A-Fa-f]{6}$/;
const SECOES = [['conceito', 'Conceito de criação'], ['essencia', 'Essência'], ['logo', 'Logo'], ['cor', 'Cor'],
  ['tipografia', 'Tipografia'], ['elementos', 'Elementos'], ['voz', 'Voz e tom'], ['imagem', 'Foto e vídeo'],
  ['movimento', 'Movimento e som'], ['pecas', 'Peças-modelo'], ['checklist', 'Checklist de aprovação'], ['uso', 'Regras de uso']];

class ErroKit extends Error {}

function acharRaiz() {
  let d = __dirname;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(d, 'ferramentas', 'marketeiro')) && fs.existsSync(path.join(d, 'sede'))) return d;
    d = path.dirname(d);
  }
  return process.cwd();
}

const esc = v => String(v === undefined || v === null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const rico = v => esc(v).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em class="d">$1</em>');
const slug = v => String(v).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';

function lum(h) {
  const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(x => x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contraste(a, b) { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); }
function selo(r) {
  const nota = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'só texto grande' : 'não usar para texto';
  return `${r.toFixed(1).replace('.', ',')}:1 · ${nota}`;
}

function dentro(raiz, rel) {
  const p = path.resolve(raiz, rel);
  if (!p.startsWith(path.resolve(raiz) + path.sep)) throw new ErroKit('Arquivo fora da pasta do agente: ' + rel);
  if (!fs.existsSync(p) || !fs.statSync(p).isFile()) throw new ErroKit('Arquivo do kit não encontrado: ' + rel);
  if (fs.lstatSync(p).isSymbolicLink()) throw new ErroKit('Link simbólico recusado: ' + rel);
  return p;
}
function copiarImagem(raiz, rel, pasta, nome) {
  const src = dentro(raiz, rel);
  const ext = path.extname(src).toLowerCase();
  if (!IMAGENS.has(ext)) throw new ErroKit('Tipo de imagem não aceito: ' + ext);
  fs.mkdirSync(pasta, { recursive: true });
  fs.copyFileSync(src, path.join(pasta, nome + ext));
  return 'assets/' + nome + ext;
}
function copiarFonte(raiz, rel, pasta) {
  const src = dentro(raiz, rel);
  if (path.extname(src).toLowerCase() !== '.ttf') throw new ErroKit('Fonte aceita só em .ttf: ' + rel);
  fs.mkdirSync(pasta, { recursive: true });
  fs.copyFileSync(src, path.join(pasta, path.basename(src)));
  for (const f of fs.readdirSync(path.dirname(src))) if (/^OFL-.*\.txt$/.test(f)) fs.copyFileSync(path.join(path.dirname(src), f), path.join(pasta, f));
  return 'fontes/' + path.basename(src);
}

function validar(m) {
  for (const k of ['cliente', 'tema', 'cores', 'fontes', 'logo']) if (!(k in m)) throw new ErroKit('marca.json sem o campo: ' + k);
  for (const k of ['fundo', 'superficie', 'texto', 'suave', 'linha', 'destaque', 'apoio']) if (!HEX.test(String(m.tema[k] || ''))) throw new ErroKit('Cor inválida em tema.' + k);
  for (const c of m.cores) if (!HEX.test(String(c.hex || ''))) throw new ErroKit('Cor inválida: ' + c.nome);
  if (!['proposta', 'confirmado'].includes(m.status || 'proposta')) throw new ErroKit('status deve ser proposta ou confirmado');
}

const lista = (itens, cls = '') => !itens || !itens.length ? '<p class="muted">A definir.</p>'
  : `<ul class="list ${cls}">` + itens.map(i => `<li>${rico(i)}</li>`).join('') + '</ul>';
const secao = (id, n, titulo, intro, corpo) => `<section id="${id}" aria-labelledby="h-${id}"><header class="sec-head"><span class="rot">${String(n).padStart(2, '0')}</span>` +
  `<h2 id="h-${id}">${esc(titulo)}</h2></header>${intro ? `<p class="intro">${rico(intro)}</p>` : ''}${corpo}</section>`;

function demo(tipo, m) {
  const t = m.tema;
  if (tipo === 'selo') return `<div class="demo"><span class="selo">${esc(m.selo_texto || '')}</span></div>`;
  if (tipo === 'botao') return `<div class="demo"><span class="botao">${esc(m.botao_texto || '')}</span></div>`;
  if (tipo === 'faixa') { const w = (m.faixa_palavras || []).join(' · '); return `<div class="demo faixa" aria-hidden="true"><span>${esc(w)} · ${esc(w)}</span></div>`; }
  if (tipo === 'fio') return '<div class="demo"><div class="fio">' + (m.fio_cores || [t.destaque]).map(c => `<i style="background:${c}"></i>`).join('') + '</div></div>';
  if (tipo === 'numeracao') return '<div class="demo"><span class="numeracao">01 <i>/</i> 04</span></div>';
  if (tipo === 'grao') return '<div class="demo grao-demo"><span>Textura de grão de filme</span></div>';
  if (tipo === 'palco') return '<div class="demo palco-demo"><span class="halo"></span></div>';
  return '';
}

function montar(m, raiz, saida) {
  const t = m.tema;
  const fontesCss = [], familias = {}, cartoesFonte = [];
  const papeis = { titulo: ['--f-titulo', 'Georgia,serif'], texto: ['--f-texto', 'system-ui,sans-serif'], rotulo: ['--f-rotulo', 'ui-monospace,monospace'],
    assinatura: ['--f-assinatura', 'cursive'], numeros: ['--f-numeros', 'Georgia,serif'] };
  m.fontes.forEach((f, i) => {
    const fam = 'Kit' + slug(f.familia).replace(/-/g, '') + i;
    familias[f.papel] = fam;
    for (const [rel, estilo] of [[f.arquivo, 'normal'], [f.arquivo_italico, 'italic']]) {
      if (rel) fontesCss.push(`@font-face{font-family:'${fam}';src:url(${copiarFonte(raiz, rel, path.join(saida, 'fontes'))}) format('truetype');font-weight:100 900;font-style:${estilo};font-display:swap}`);
    }
  });
  let vars = '';
  for (const f of m.fontes) if (papeis[f.chave]) vars += `${papeis[f.chave][0]}:'${familias[f.papel]}',${papeis[f.chave][1]};`;
  for (const f of m.fontes) {
    cartoesFonte.push(`<article class="card font ${esc(f.chave || '')}"><span class="rot">${esc(f.papel)}</span><p class="spec" style="font-family:'${familias[f.papel]}',serif">${rico(f.amostra || f.familia)}</p>` +
      `<h3>${esc(f.familia)}</h3><p>${esc(f.uso || '')}</p><small>${esc(f.pesos || '')}</small></article>`);
  }
  const c = m.conceito || {};
  const conceito = `<div class="concept"><p class="big">${rico(c.frase || '')}</p>${lista(c.principios)}</div>`;
  const e = m.essencia || {};
  const essencia = `<div class="grid three">${(e.palavras || []).map(w => `<article class="card"><h3>${esc(w.palavra)}</h3><p>${rico(w.texto)}</p></article>`).join('')}</div>` +
    (e.posicionamento ? `<p class="pull">${rico(e.posicionamento)}</p>` : '');
  const lg = m.logo;
  let capaLogo = '';
  const cartoesLogo = (lg.versoes || []).map((v, i) => {
    const img = copiarImagem(raiz, v.arquivo, path.join(saida, 'assets'), 'logo-' + slug(v.nome));
    if (i === 0) capaLogo = `<img class="cover-logo" src="${img}" alt="Logo ${esc(m.cliente)}">`;
    const bg = (v.fundo || 'escuro') === 'escuro' ? t.fundo : '#FFFFFF';
    return `<article class="card"><div class="logo-box" style="background:${bg}"><img src="${img}" alt="${esc(v.nome)}"></div><h3>${esc(v.nome)}</h3><p>${esc(v.uso || '')}</p></article>`;
  });
  const logo = `<div class="grid three">${cartoesLogo.join('')}</div><div class="split"><div><h3>Regras</h3>${lista(lg.regras)}</div><div><h3>Não fazer</h3>${lista(lg.nao_fazer, 'no')}</div></div>`;
  const amostras = [], barra = [];
  for (const col of m.cores) {
    const sobre = contraste(col.hex, '#000000') > contraste(col.hex, '#FFFFFF') ? '#000000' : '#FFFFFF';
    amostras.push(`<button class="swatch" data-hex="${col.hex.toUpperCase()}" style="--c:${col.hex};--on:${sobre}" aria-label="Copiar ${esc(col.nome)} ${col.hex.toUpperCase()}"><span class="chip"></span><strong>${esc(col.nome)}</strong><code>${col.hex.toUpperCase()}</code><small>${esc(col.uso || '')}</small></button>`);
    if (col.proporcao) barra.push(`<i style="flex:${col.proporcao};background:${col.hex}" title="${esc(col.nome)} ${col.proporcao}%"></i>`);
  }
  const pares = [['Texto sobre fundo', t.texto, t.fundo], ['Texto suave sobre fundo', t.suave, t.fundo], ['Destaque sobre fundo', t.destaque, t.fundo],
    ['Fundo sobre destaque (botão)', t.fundo, t.destaque], ['Texto sobre superfície', t.texto, t.superficie]];
  const cor = `<div class="swatches">${amostras.join('')}</div><p class="hint">Clique em uma cor para copiar o código.</p>` +
    (barra.length ? `<div class="propbar" role="img" aria-label="Proporção de uso das cores">${barra.join('')}</div>` : '') +
    `<table class="table"><caption>Contraste (WCAG 2.1)</caption><tbody>${pares.map(([n, a, b]) => `<tr><th scope="row">${n}</th><td><span class="dot" style="background:${a}"></span><span class="dot" style="background:${b}"></span></td><td>${selo(contraste(a, b))}</td></tr>`).join('')}</tbody></table>`;
  const r = m.destaque_regra || {};
  const tipografia = `<div class="grid two">${cartoesFonte.join('')}</div><div class="rule"><h3>${esc(r.titulo || 'Destaque')}</h3><p>${rico(r.texto || '')}</p><div class="grid two">` +
    (r.certo || []).map(x => `<p class="ex ok"><b>Certo</b><span>${rico(x)}</span></p>`).join('') + (r.errado || []).map(x => `<p class="ex no"><b>Errado</b><span>${rico(x)}</span></p>`).join('') + '</div></div>';
  const els = (m.elementos || []).map(x => `<article class="card">${demo(x.demo || '', m)}<h3>${esc(x.nome)}</h3><p>${rico(x.descricao || '')}</p></article>`).join('');
  const elementos = els ? `<div class="grid auto">${els}</div>` : '<p class="muted">A definir.</p>';
  const v = m.voz || {};
  const voz = `<div class="split"><div><h3>A voz faz</h3>${lista(v.faz)}</div><div><h3>A voz não faz</h3>${lista(v.nao_faz, 'no')}</div></div><div class="grid two">` +
    (v.exemplos || []).map(x => `<figure class="quote"><blockquote>${rico(x.texto)}</blockquote><figcaption>${esc(x.contexto || '')}</figcaption></figure>`).join('') + '</div>' +
    (v.chamada_padrao ? `<p class="pull">${rico(v.chamada_padrao)}</p>` : '');
  const im = m.imagem || {};
  const imagem = `<div class="split"><div><h3>Faz</h3>${lista(im.faz)}</div><div><h3>Evitar</h3>${lista(im.evitar, 'no')}</div></div>` + (im.origem_material ? `<p class="note">${rico(im.origem_material)}</p>` : '');
  const mv = m.movimento || {};
  const fmts = (mv.formatos || []).map(x => `<tr><th scope="row">${esc(x.nome)}</th><td>${esc(x.medida || '')}</td><td>${rico(x.nota || '')}</td></tr>`).join('');
  const movimento = `<div class="split"><div><h3>Imagem em movimento</h3>${lista(mv.principios)}</div><div><h3>Som</h3>${lista(mv.som)}</div></div>` + (fmts ? `<table class="table"><caption>Formatos</caption><tbody>${fmts}</tbody></table>` : '');
  const figs = (m.pecas || []).map(p => {
    const img = copiarImagem(raiz, p.imagem, path.join(saida, 'assets'), 'peca-' + slug(p.titulo));
    return `<figure class="piece"><img src="${img}" alt="${esc(p.titulo)}"><figcaption><strong>${esc(p.titulo)}</strong><span>${esc(p.status || '')}</span><small>${rico(p.descricao || '')}</small></figcaption></figure>`;
  });
  const pecas = figs.length ? `<div class="pieces">${figs.join('')}</div>` : '<p class="muted">As peças aprovadas aparecem aqui.</p>';
  const ck = (m.checklist || []).map(x => `<li><label><input type="checkbox"><span>${rico(x)}</span></label></li>`).join('');
  const checklist = ck ? `<ul class="check">${ck}</ul>` : '<p class="muted">A definir.</p>';
  const confirmado = (m.status || 'proposta') === 'confirmado';
  const uso = `<div class="split"><div><h3>Regras</h3>${lista(m.regras_de_uso)}</div><div><h3>${confirmado ? 'Confirmado' : 'A confirmar'}</h3>${lista(confirmado ? ['Kit confirmado.'] : m.pendencias_cliente)}</div></div>`;
  const corpos = { conceito: [conceito, c.intro], essencia: [essencia, e.intro], logo: [logo, lg.intro], cor: [cor, m.cores_intro], tipografia: [tipografia, m.tipografia_intro],
    elementos: [elementos, m.elementos_intro], voz: [voz, v.intro], imagem: [imagem, im.intro], movimento: [movimento, mv.intro], pecas: [pecas, m.pecas_intro],
    checklist: [checklist, 'Antes de qualquer peça ir para aprovação, confira cada item.'], uso: [uso, null] };
  const secoes = SECOES.map(([id, titulo], n) => secao(id, n + 1, titulo, corpos[id][1], corpos[id][0])).join('');
  const nav = SECOES.map(([id, titulo]) => `<a href="#${id}">${titulo}</a>`).join('');
  const faixa = confirmado ? 'Kit confirmado' + (m.confirmado_em ? ` em ${esc(m.confirmado_em)}` : '') : 'Proposta do seu agente · aguarda a sua confirmação';
  const tema = Object.entries(t).map(([k, val]) => `--${k}:${val};`).join('');
  const data = esc(m.atualizado_em || new Date().toISOString().slice(0, 10));
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><link rel="icon" href="data:,"><meta name="color-scheme" content="dark light">
<title>Kit de marca · ${esc(m.cliente)}</title>
<style>${fontesCss.join('')}:root{${tema}${vars}}</style>
<link rel="stylesheet" href="kit.css"></head>
<body>
<a class="skip" href="#conceito">Ir para o conteúdo</a>
<div class="status ${confirmado ? 'ok' : 'prop'}" role="status">${faixa}</div>
<header class="cover-wrap"><div class="cover"><div><a class="back" href="../marketing.html">← Painel de marketing</a><span class="rot">Kit de marca · versão ${esc(m.versao || '1.0')}</span>
<h1>${rico(m.titulo || m.cliente)}</h1><p class="lead">${rico(m.resumo || '')}</p>
<p class="meta">${esc(m.cliente)} · atualizado em ${data}</p></div>${capaLogo}</div></header>
<div class="shell"><nav class="toc" aria-label="Seções do kit"><strong class="rot">Seções</strong>${nav}</nav>
<main>${secoes}
<footer><span>${esc(m.cliente)} · kit de marca</span><span>Atualizado em ${data}</span></footer></main></div>
<div class="toast" role="status" aria-live="polite"></div>
<script src="kit.js"></script></body></html>
`;
}

function gerar(raiz) {
  const arq = path.join(raiz, 'sede', 'marketing', 'marca.json');
  if (!fs.existsSync(arq)) throw new ErroKit('Falta sede/marketing/marca.json. Copie ferramentas/marketeiro/extras/marca.modelo.json e preencha.');
  const m = JSON.parse(fs.readFileSync(arq, 'utf8'));
  validar(m);
  const saida = path.join(raiz, 'painel', 'marca');
  fs.rmSync(saida, { recursive: true, force: true });
  fs.mkdirSync(saida, { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'kit.css'), path.join(saida, 'kit.css'));
  fs.copyFileSync(path.join(__dirname, 'kit.js'), path.join(saida, 'kit.js'));
  fs.writeFileSync(path.join(saida, 'index.html'), montar(m, raiz, saida), 'utf8');
  return { ok: true, kit: 'painel/marca/index.html', status: m.status || 'proposta' };
}

if (require.main === module) {
  try { console.log(JSON.stringify(gerar(acharRaiz()))); }
  catch (e) { console.log(JSON.stringify({ ok: false, erro: e instanceof ErroKit ? e.message : 'Falha ao gerar o kit: ' + e.message })); process.exitCode = 1; }
}
module.exports = { gerar, montar, ErroKit };
