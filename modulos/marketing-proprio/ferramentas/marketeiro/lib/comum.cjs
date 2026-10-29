// Funções comuns dos scripts do motor (Marketeiro). CommonJS, Node 20+.
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const MOTOR = path.resolve(__dirname, '..');

// ---------- argumentos ----------
// --chave valor | --chave (vira true). Valores que começam com "--" não são consumidos.
function lerArgs(argv = process.argv.slice(2)) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const s = argv[i];
    if (s.startsWith('--')) {
      const k = s.slice(2);
      const prox = argv[i + 1];
      if (prox !== undefined && !prox.startsWith('--')) { a[k] = prox; i++; } else a[k] = true;
    } else a._.push(s);
  }
  return a;
}

// ---------- RAIZ ----------
// RAIZ = pasta do agente da corretora (tem ferramentas/marketeiro). Sobe a partir do motor até achar.
function acharRaiz(args = {}) {
  if (args.raiz && args.raiz !== true) return path.resolve(String(args.raiz));
  if (process.env.MARKETEIRO_RAIZ) return path.resolve(process.env.MARKETEIRO_RAIZ);
  let d = MOTOR;
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(d, 'ferramentas', 'marketeiro'))) return d;
    const p = path.dirname(d);
    if (p === d) break;
    d = p;
  }
  throw erro('Não achei a pasta do agente (a que tem ferramentas/marketeiro). O motor precisa estar em <pasta do agente>/ferramentas/marketeiro.',
    'RAIZ não encontrada subindo de ' + MOTOR);
}

// ---------- erros amigáveis ----------
function erro(mensagem, detalhe) {
  const e = new Error(mensagem);
  e.amigavel = mensagem;
  e.detalhe = detalhe || '';
  return e;
}
function falhar(e, extra = {}) {
  const saida = Object.assign({ ok: false, mensagem: e.amigavel || 'Algo deu errado no motor.', detalhe: e.detalhe || String(e && e.stack || e) }, extra);
  console.log(JSON.stringify(saida, null, 2));
  process.exit(1);
}

// ---------- config.json (escrito pelo instalar-motor) ----------
const CONFIG = path.join(MOTOR, 'config.json');
function lerConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG, 'utf8')); } catch { return {}; }
}
function salvarConfig(c) { fs.writeFileSync(CONFIG, JSON.stringify(c, null, 2), 'utf8'); }

// ---------- processos ----------
function rodar(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    let out = '', err = '';
    let p;
    try { p = spawn(cmd, args, Object.assign({ windowsHide: true }, opts)); } catch (e) { return resolve({ code: -1, stdout: '', stderr: String(e) }); }
    if (p.stdout) p.stdout.on('data', (d) => { out += d; if (opts.eco) process.stdout.write(d); });
    if (p.stderr) p.stderr.on('data', (d) => { err += d; if (opts.ecoErro) process.stderr.write(d); });
    p.on('error', (e) => resolve({ code: -1, stdout: out, stderr: err + String(e) }));
    p.on('close', (code) => resolve({ code, stdout: out, stderr: err }));
  });
}

// ---------- ffmpeg ----------
function caminhoFfmpeg() {
  const c = lerConfig();
  if (c.ffmpeg && fs.existsSync(c.ffmpeg)) return c.ffmpeg;
  try {
    const p = require('ffmpeg-static');
    if (p && fs.existsSync(p)) return p;
  } catch { /* sem o pacote */ }
  return null; // quem chama decide se tenta o "ffmpeg" do sistema
}
async function ffmpegOuErro() {
  const p = caminhoFfmpeg();
  if (p) return p;
  const r = await rodar('ffmpeg', ['-version']);
  if (r.code === 0) return 'ffmpeg';
  throw erro('O ffmpeg (programa que monta o vídeo) não está instalado. Rode: node ferramentas/marketeiro/instalar-motor.cjs', 'ffmpeg-static ausente e ffmpeg fora do PATH');
}

// ---------- navegador ----------
function candidatosNavegador() {
  const env = process.env;
  const l = [];
  const add = (p) => { if (p && !l.includes(p)) l.push(p); };
  if (process.platform === 'win32') {
    for (const base of [env['ProgramFiles'], env['ProgramFiles(x86)'], env['LOCALAPPDATA']]) {
      if (base) add(path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    }
    for (const base of [env['ProgramFiles(x86)'], env['ProgramFiles'], env['LOCALAPPDATA']]) {
      if (base) add(path.join(base, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
    }
  } else if (process.platform === 'darwin') {
    add('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
    add('/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge');
  } else {
    ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'].forEach(add);
  }
  return l.filter((p) => fs.existsSync(p));
}

const ARGS_NAVEGADOR = [
  '--force-color-profile=srgb',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--hide-scrollbars',
  '--mute-audio',
  '--disable-lcd-text',
  '--autoplay-policy=no-user-gesture-required',
];

// Abre o navegador sem janela. Ordem: o que o instalar-motor salvou, Chrome, Edge, caminhos conhecidos.
async function abrirNavegador() {
  let chromium;
  try { ({ chromium } = require('playwright-core')); } catch (e) {
    throw erro('Faltam as peças do motor. Rode: npm --prefix ferramentas/marketeiro install', 'playwright-core não instalado: ' + e.message);
  }
  const c = lerConfig();
  const tentativas = [];
  if (c.navegador && c.navegador.caminho && fs.existsSync(c.navegador.caminho)) tentativas.push({ executablePath: c.navegador.caminho, nome: c.navegador.nome || 'salvo' });
  if (c.navegador && c.navegador.canal) tentativas.push({ channel: c.navegador.canal, nome: c.navegador.nome || c.navegador.canal });
  tentativas.push({ channel: 'chrome', nome: 'Google Chrome' });
  tentativas.push({ channel: 'msedge', nome: 'Microsoft Edge' });
  for (const p of candidatosNavegador()) tentativas.push({ executablePath: p, nome: /edge/i.test(p) ? 'Microsoft Edge' : 'Google Chrome' });
  const erros = [];
  for (const t of tentativas) {
    try {
      const opts = { headless: true, args: ARGS_NAVEGADOR };
      if (t.channel) opts.channel = t.channel; else opts.executablePath = t.executablePath;
      const browser = await chromium.launch(opts);
      browser._marketeiroNome = t.nome;
      browser._marketeiroCaminho = t.executablePath || null;
      browser._marketeiroCanal = t.channel || null;
      return browser;
    } catch (e) { erros.push((t.channel || t.executablePath) + ': ' + String(e.message).split('\n')[0]); }
  }
  throw erro('Não consegui abrir o Google Chrome nem o Microsoft Edge. Instale o Google Chrome (google.com/chrome) e tente de novo.', erros.join(' | '));
}

// ---------- servidor estático com raiz na RAIZ ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
};
function servidorEstatico(raiz) {
  const base = path.resolve(raiz);
  const srv = http.createServer((req, res) => {
    let rel;
    try { rel = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); return res.end(); }
    if (rel === '/favicon.ico') { res.writeHead(204); return res.end(); }
    const p = path.resolve(base, '.' + rel);
    if (p !== base && !p.startsWith(base + path.sep)) { res.writeHead(403); return res.end(); }
    fs.stat(p, (e, st) => {
      if (e || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('não encontrado: ' + rel); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': 'no-store' });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(p).pipe(res);
    });
  });
  return new Promise((resolve) => {
    srv.listen(0, '127.0.0.1', () => {
      resolve({ url: `http://127.0.0.1:${srv.address().port}`, fechar: () => new Promise((r) => srv.close(() => r())), srv });
    });
  });
}

// caminho do disco -> URL do servidor (relativa à RAIZ)
function urlDe(raiz, arquivo) {
  const rel = path.relative(raiz, path.resolve(arquivo));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw erro('O arquivo precisa estar dentro da pasta do agente: ' + arquivo, 'fora da RAIZ ' + raiz);
  return '/' + rel.split(path.sep).map(encodeURIComponent).join('/');
}

function tamanhoMB(arq) { try { return +(fs.statSync(arq).size / 1048576).toFixed(2); } catch { return 0; } }
function mkdirp(d) { fs.mkdirSync(d, { recursive: true }); return d; }
function relRaiz(raiz, p) { return path.relative(raiz, p).split(path.sep).join('/'); }

module.exports = {
  MOTOR, lerArgs, acharRaiz, erro, falhar, lerConfig, salvarConfig, rodar, caminhoFfmpeg, ffmpegOuErro,
  candidatosNavegador, abrirNavegador, servidorEstatico, urlDe, tamanhoMB, mkdirp, relRaiz, ARGS_NAVEGADOR,
};
