#!/usr/bin/env node
// Gera o tema visual das peças a partir da marca da corretora.
//   node ferramentas/marketeiro/tema.cjs
// Lê  <RAIZ>/sede/marketing/marca.json  (mesmo esquema do kit de marca: "tema" e "fontes")
// Gera <RAIZ>/marketing/marca/tema.css   (variáveis de cor e fonte + @font-face)
//      <RAIZ>/marketing/marca/tema.json  (o mesmo, para scripts, + nome, @, CRECI, logo, chamada)
// Sem marca.json: tema padrão premium (grafite azulado e dourado). Fontes: .ttf local da marca -> fontes que
// acompanham o motor -> Google Fonts (só se a marca citar uma família sem arquivo local).
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('./lib/comum.cjs');

const PADRAO = {
  fundo: '#141821', superficie: '#1E2430', texto: '#F2ECE2', suave: '#A7ADB9',
  linha: '#2F3646', destaque: '#CDAA6E', apoio: '#8E7650', no: '#E5604D',
};

// fontes que acompanham o motor (OFL)
const MOTOR_FONTES = [
  { familia: 'Motor Serifa', arquivo: 'ferramentas/marketeiro/fontes/CormorantGaramond.ttf', estilo: 'normal', pesos: '300 700' },
  { familia: 'Motor Serifa', arquivo: 'ferramentas/marketeiro/fontes/CormorantGaramond-Italic.ttf', estilo: 'italic', pesos: '300 700' },
  { familia: 'Motor Sans', arquivo: 'ferramentas/marketeiro/fontes/Inter.ttf', estilo: 'normal', pesos: '100 900' },
];
const PILHA = {
  titulo: ['Motor Serifa', 'Georgia', 'serif'],
  numeros: ['Motor Serifa', 'Georgia', 'serif'],
  texto: ['Motor Sans', 'Segoe UI', 'Arial', 'sans-serif'],
  rotulo: ['Motor Sans', 'Segoe UI', 'Arial', 'sans-serif'],
  legenda: ['Motor Sans', 'Segoe UI', 'Arial', 'sans-serif'],
  assinatura: ['Motor Serifa', 'Georgia', 'serif'],
};
const NOME_CSS = { titulo: 'Marca Titulo', texto: 'Marca Texto', rotulo: 'Marca Rotulo', assinatura: 'Marca Assinatura', numeros: 'Marca Numeros' };

const hexOk = (h) => typeof h === 'string' && /^#[0-9a-fA-F]{6}$/.test(h.trim());
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`; };
const q = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ') + '"';
const pesosDe = (s) => { const m = String(s || '').match(/(\d{3})\D+(\d{3})/); return m ? `${m[1]} ${m[2]}` : '100 900'; };
const fmt = (arq) => ({ '.woff2': 'woff2', '.woff': 'woff', '.otf': 'opentype' }[path.extname(arq).toLowerCase()] || 'truetype');
const url = (rel) => '/' + rel.replace(/\\/g, '/').replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');

function acharMarca(raiz) {
  for (const rel of ['sede/marketing/marca.json', 'dados/marca.json']) {
    const p = path.join(raiz, rel);
    if (fs.existsSync(p)) return { arquivo: p, rel };
  }
  return null;
}

function gerar(raiz) {
  const avisos = [];
  const achada = acharMarca(raiz);
  let marca = {};
  if (achada) {
    try { marca = JSON.parse(fs.readFileSync(achada.arquivo, 'utf8')); } catch (e) {
      throw C.erro('O arquivo da marca (' + achada.rel + ') tem um erro de digitação e não pôde ser lido.', e.message);
    }
  } else avisos.push('Sem sede/marketing/marca.json: usei o tema padrão (grafite e dourado).');

  const cores = Object.assign({}, PADRAO);
  for (const k of Object.keys(PADRAO)) {
    const v = marca.tema && marca.tema[k];
    if (v !== undefined) { if (hexOk(v)) cores[k] = v.trim().toUpperCase(); else avisos.push(`Cor "${k}" inválida na marca (${v}); usei a padrão.`); }
  }

  const faces = [];
  const imports = [];
  const pilhas = JSON.parse(JSON.stringify(PILHA));
  const fontesUsadas = {};
  for (const f of (Array.isArray(marca.fontes) ? marca.fontes : [])) {
    const chave = f.chave;
    if (!NOME_CSS[chave]) continue;
    const nome = NOME_CSS[chave];
    let local = false;
    for (const [arqRel, estilo] of [[f.arquivo, 'normal'], [f.arquivo_italico, 'italic']]) {
      if (!arqRel) continue;
      const abs = path.join(raiz, arqRel);
      if (fs.existsSync(abs)) {
        faces.push(`@font-face { font-family: ${q(nome)}; src: url(${q(url(arqRel))}) format(${q(fmt(arqRel))}); font-weight: ${pesosDe(f.pesos)}; font-style: ${estilo}; font-display: block; }`);
        if (estilo === 'normal') local = true;
      } else avisos.push(`Fonte "${f.familia || chave}" não encontrada em ${arqRel}.`);
    }
    if (local) {
      pilhas[chave].unshift(nome);
      fontesUsadas[chave] = { familia: f.familia || nome, origem: 'arquivo da marca' };
    } else if (f.familia && !/[\[\]]/.test(f.familia)) {
      // família citada sem arquivo: tenta o Google Fonts (precisa de internet; se falhar, cai na fonte do motor).
      // Pedido simples (só o nome) para não dar erro em família sem itálico ou sem algum peso.
      const fam = String(f.familia).split('·')[0].trim();
      const imp = `@import url("https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam).replace(/%20/g, '+')}&display=block");`;
      if (!imports.includes(imp)) imports.push(imp);
      pilhas[chave].unshift(fam);
      fontesUsadas[chave] = { familia: fam, origem: 'Google Fonts (sem arquivo local; sem internet vale a fonte do motor)' };
      avisos.push(`"${fam}" vai pelo Google Fonts: para não depender de internet, coloque o .ttf em marketing/marca/fontes/ e aponte em marca.json.`);
    } else avisos.push(`Fonte de "${chave}" sem arquivo: usei a fonte do motor.`);
  }
  if (fontesUsadas.texto && !fontesUsadas.legenda) pilhas.legenda = pilhas.texto.slice();
  if (fontesUsadas.titulo && !fontesUsadas.numeros) pilhas.numeros = pilhas.titulo.slice();

  for (const m of MOTOR_FONTES) {
    faces.push(`@font-face { font-family: ${q(m.familia)}; src: url(${q(url(m.arquivo))}) format("truetype"); font-weight: ${m.pesos}; font-style: ${m.estilo}; font-display: block; }`);
  }

  const corretor = marca.corretor || {};

  // Texto-modelo ainda não trocado (valor que começa com "["): avisa, para a peça não sair com "[@perfil]" ou chamada de exemplo.
  // Não muda o resultado (ok continua true); quem lê os avisos pergunta a ela e grava em sede/marketing/marca.json.
  if (achada) {
    const ehModelo = (v) => typeof v === 'string' && v.trim().startsWith('[');
    const naPeca = [
      ['corretor.nome', corretor.nome, 'nome nas peças'],
      ['corretor.arroba', corretor.arroba, '@ do Instagram'],
      ['corretor.imobiliaria', corretor.imobiliaria, 'nome do negócio'],
      ['voz.chamada_padrao', marca.voz && marca.voz.chamada_padrao, 'chamada padrão'],
      ['selo_texto', marca.selo_texto, 'texto do selo'],
      ['botao_texto', marca.botao_texto, 'texto do botão'],
    ];
    const pendentes = naPeca.filter(([, v]) => ehModelo(v)).map(([k, , rotulo]) => `${rotulo} (${k})`);
    if (pendentes.length) {
      avisos.push(`Kit de marca com texto-modelo entre colchetes no que aparece nas peças: ${pendentes.join(', ')}. Pergunte a ela e grave em ${achada.rel} antes de gerar peça.`);
    }
    const jaAvisados = new Set(naPeca.map(([k]) => k));
    const outros = [];
    const varrer = (v, caminho) => {
      if (Array.isArray(v)) v.forEach((x, i) => varrer(x, `${caminho}[${i}]`));
      else if (v && typeof v === 'object') {
        for (const [k, x] of Object.entries(v)) if (!k.startsWith('_')) varrer(x, caminho ? `${caminho}.${k}` : k);
      } else if (ehModelo(v) && !jaAvisados.has(caminho)) outros.push(caminho);
    };
    varrer(marca, '');
    if (outros.length) {
      avisos.push(`Mais ${outros.length} campo(s) do kit ainda com texto-modelo entre colchetes (ex.: ${outros.slice(0, 5).join(', ')}).`);
    }
  }

  const logoArq = marca.logo && Array.isArray(marca.logo.versoes) && marca.logo.versoes[0] && marca.logo.versoes[0].arquivo;
  const info = {
    gerado_em: new Date().toISOString(),
    origem: achada ? achada.rel : 'padrão do motor',
    status_marca: marca.status || (achada ? 'sem status' : 'padrão'),
    cores,
    fontes: Object.fromEntries(Object.entries(pilhas).map(([k, v]) => [k, v.map((x) => (/\s|^[A-Z]/.test(x) && !['serif', 'sans-serif'].includes(x) ? q(x) : x)).join(', ')])),
    fontes_usadas: fontesUsadas,
    marca: {
      nome: corretor.nome || marca.cliente || '',
      arroba: corretor.arroba || corretor.instagram || marca.instagram || '',
      creci: corretor.creci || marca.creci || '',
      imobiliaria: corretor.imobiliaria || marca.imobiliaria || '',
      logo: logoArq && fs.existsSync(path.join(raiz, logoArq)) ? url(logoArq) : '',
      selo: marca.selo_texto && !/^\[/.test(marca.selo_texto) ? marca.selo_texto : '',
      botao: marca.botao_texto && !/^\[/.test(marca.botao_texto) ? marca.botao_texto : '',
      chamada: marca.voz && marca.voz.chamada_padrao && !/^\[/.test(marca.voz.chamada_padrao) ? marca.voz.chamada_padrao : '',
    },
    avisos,
  };

  const linhas = [];
  linhas.push(`/* Tema das peças · gerado por tema.cjs em ${info.gerado_em} a partir de ${info.origem}. Não edite à mão: mude a marca e rode de novo. */`);
  linhas.push(...imports);
  linhas.push(...faces);
  linhas.push(':root {');
  for (const [k, v] of Object.entries(cores)) linhas.push(`  --cor-${k}: ${v};\n  --cor-${k}-rgb: ${rgb(v)};`);
  for (const [k, v] of Object.entries(info.fontes)) linhas.push(`  --fonte-${k}: ${v};`);
  linhas.push(`  --marca-nome: ${q(info.marca.nome)};`);
  linhas.push(`  --marca-arroba: ${q(info.marca.arroba)};`);
  linhas.push('}');

  const pasta = C.mkdirp(path.join(raiz, 'marketing', 'marca'));
  fs.writeFileSync(path.join(pasta, 'tema.css'), linhas.join('\n') + '\n', 'utf8');
  fs.writeFileSync(path.join(pasta, 'tema.json'), JSON.stringify(info, null, 2), 'utf8');
  return { ok: true, tema_css: path.join(pasta, 'tema.css'), tema_json: path.join(pasta, 'tema.json'), origem: info.origem, cores, fontes_usadas: fontesUsadas, avisos };
}

if (require.main === module) {
  try {
    const a = C.lerArgs();
    const r = gerar(C.acharRaiz(a));
    console.log(JSON.stringify(r, null, 2));
  } catch (e) { C.falhar(e); }
}
module.exports = { gerar, PADRAO };
