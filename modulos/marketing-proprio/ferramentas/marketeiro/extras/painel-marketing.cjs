'use strict';
// Gera painel/marketing-dados.js a partir de sede/marketing/marketing.json (projeção só do que o corretor vê).
// Uso (na pasta do agente): node ferramentas/marketeiro/extras/painel-marketing.cjs
const fs = require('fs');
const path = require('path');

function acharRaiz() {
  let d = __dirname;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(d, 'ferramentas', 'marketeiro')) && fs.existsSync(path.join(d, 'sede'))) return d;
    d = path.dirname(d);
  }
  return process.cwd();
}

// Caminho de peça precisa ficar dentro de marketing/pecas/ (o painel abre como link relativo).
function caminhoPeca(raiz, pasta, arquivo) {
  if (!pasta || !arquivo) return null;
  const rel = path.posix.join(String(pasta).replace(/\\/g, '/'), String(arquivo).replace(/\\/g, '/'));
  const abs = path.resolve(raiz, rel);
  const base = path.resolve(raiz, 'marketing', 'pecas') + path.sep;
  if (!abs.startsWith(base) || !fs.existsSync(abs)) return null;
  return '../' + rel;
}

// Últimas melhorias que o agente fez sozinho (sede/marketing/MELHORIAS.md), da mais nova para a mais antiga.
function lerMelhorias(raiz, max = 5) {
  const arq = path.join(raiz, 'sede', 'marketing', 'MELHORIAS.md');
  if (!fs.existsSync(arq)) return [];
  const itens = [];
  for (const linha of fs.readFileSync(arq, 'utf8').split(/\r?\n/)) {
    const m = /^-\s*(\d{4}-\d{2}-\d{2})\s*·\s*(.+)$/.exec(linha.trim());
    if (!m) continue;
    const partes = m[2].split(/\s+·\s+/);
    itens.push({ data: m[1], mudou: partes[0] || '', porque: partes[2] || '' });
  }
  return itens.slice(-max).reverse();
}

// Estilos aprovados (sede/marketing/ESTILOS.md): o padrão e a tabela.
function lerEstilos(raiz) {
  const arq = path.join(raiz, 'sede', 'marketing', 'ESTILOS.md');
  if (!fs.existsSync(arq)) return { padrao: null, lista: [] };
  const txt = fs.readFileSync(arq, 'utf8');
  const pm = /\*\*Padr[aã]o hoje:\*\*\s*([^\r\n]+)/.exec(txt);
  const lista = [];
  for (const linha of txt.split(/\r?\n/)) {
    if (!/^\|/.test(linha.trim()) || /^\|\s*-/.test(linha.trim())) continue;
    const c = linha.split('|').slice(1, -1).map((s) => s.trim());
    if (!c[0] || /^estilo$/i.test(c[0])) continue;
    lista.push({ nome: c[0], origem: c[1] || '', quando: c[2] || '' });
  }
  return { padrao: pm ? pm[1].trim() : null, lista };
}

function gerar(raiz) {
  const arq = path.join(raiz, 'sede', 'marketing', 'marketing.json');
  const m = fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq, 'utf8')) : {};
  const pick = (o, ks) => Object.fromEntries(ks.map(k => [k, o[k] === undefined ? null : o[k]]));
  const pub = {
    gerado_em: new Date().toISOString(),
    fase: m.fase || 'instalado',
    proximo_passo: m.proximo_passo || null,
    regua: m.regua || {},
    plano: m.plano || {},
    kit: fs.existsSync(path.join(raiz, 'painel', 'marca', 'index.html')),
    grade: (m.grade || []).map(g => ({ ...pick(g, ['dia', 'pilar', 'formato', 'tema', 'status', 'versao']), previa: caminhoPeca(raiz, g.pasta, g.previa) })),
    pecas: (m.pecas || []).map(p => ({ ...pick(p, ['titulo', 'formato', 'data', 'status']), miniatura: caminhoPeca(raiz, p.pasta, p.miniatura), arquivo: caminhoPeca(raiz, p.pasta, p.arquivo) })),
    numeros: (m.numeros || []).map(n => pick(n, ['peca', 'metrica', 'valor', 'fonte', 'data'])),
    pautas: (m.pautas || []).slice(0, 5).map(p => (typeof p === 'string' ? { tema: p } : pick(p, ['tema', 'formato', 'publico', 'nota']))),
    aprendi: lerMelhorias(raiz),
    estilos: lerEstilos(raiz)
  };
  const js = '// Gerado por ferramentas/marketeiro/extras/painel-marketing.cjs. Não edite à mão.\nwindow.MARKETING = ' +
    JSON.stringify(pub, null, 1).replace(/</g, '\\u003c') + ';\n';
  fs.writeFileSync(path.join(raiz, 'painel', 'marketing-dados.js'), js, 'utf8');
  return { ok: true, painel: 'painel/marketing.html', pecas: pub.pecas.length, grade: pub.grade.length };
}

if (require.main === module) {
  try { console.log(JSON.stringify(gerar(acharRaiz()))); }
  catch (e) { console.log(JSON.stringify({ ok: false, erro: 'Falha ao gerar o painel de marketing: ' + e.message })); process.exitCode = 1; }
}
module.exports = { gerar, lerMelhorias, lerEstilos };
