#!/usr/bin/env node
// Render do Marketeiro: transforma uma página HTML (post, carrossel ou vídeo) em PNG ou MP4.
//
//   node ferramentas/marketeiro/render.cjs --pagina <peca>/video.html [--saida <arquivo.mp4>] [--audio <arquivo>] [--celular]
//   node ferramentas/marketeiro/render.cjs --pagina <peca>/video.html --stills 1,3.5,8      (só os quadros, para conferir)
//   node ferramentas/marketeiro/render.cjs --pagina <peca>/carrossel.html --png             (cada .slide vira slide-01.png...)
//   node ferramentas/marketeiro/render.cjs --pagina <peca>/video.html --capa 2.4             (capa.png a partir do instante 2,4 s)
//   node ferramentas/marketeiro/render.cjs --pagina <peca>/video.html --servir               (abre um endereço para ver no navegador)
//
// Outras opções: --de <s> --ate <s> (render de um trecho), --fps 30, --crf 18, --trabalhadores N, --sem-audio, --raiz <pasta>.
// Contrato da página de vídeo: window.PRONTO (Promise), window.DURACAO (s), async window.renderAt(t) desenha o quadro (1080x1920).
// Mensagens de andamento vão para o stderr; o resultado final sai em JSON no stdout.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const C = require('./lib/comum.cjs');

const log = (...a) => process.stderr.write(a.join(' ') + '\n');
const fmtT = (s) => { s = Math.round(s); return (s >= 60 ? Math.floor(s / 60) + 'min' : '') + String(s % 60).padStart(s >= 60 ? 2 : 1, '0') + 's'; };

function resolverPagina(raiz, p) {
  if (!p || p === true) throw C.erro('Diga qual página renderizar: --pagina marketing/pecas/<pasta>/video.html');
  const cands = [path.resolve(String(p)), path.resolve(raiz, String(p))];
  for (const c of cands) if (fs.existsSync(c)) return c;
  throw C.erro('Não achei a página ' + p + '. Confira o caminho (ele é relativo à pasta do agente).', cands.join(' | '));
}

// Abre a página e espera window.PRONTO
async function abrirPagina(browser, url, largura, altura) {
  const ctx = await browser.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => { erros.push(e.message); log('ERRO NA PÁGINA:', e.message); });
  page.on('console', (m) => { if (m.type() === 'error') log('console:', m.text()); if (m.type() === 'warning' && /marketeiro/i.test(m.text())) log('aviso:', m.text()); });
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  let relogio;
  const r = await Promise.race([
    page.evaluate(async () => { if (window.PRONTO) await window.PRONTO; return { ok: true }; })
      .catch((e) => ({ ok: false, e: String(e && e.message || e).split('\n')[0].replace(/^page\.evaluate:\s*/, '').replace(/^Error:\s*/, '') })),
    new Promise((res) => { relogio = setTimeout(() => res({ ok: false, e: 'a página demorou mais de 90 s para ficar pronta' }), 90000); }),
  ]);
  clearTimeout(relogio);
  if (!r.ok) throw C.erro('A página não carregou: ' + r.e + '. Confira o roteiro/conteúdo (nomes de arquivo, vírgulas do JSON).', erros.join(' | '));
  const cdp = await ctx.newCDPSession(page);
  return { ctx, page, cdp, erros };
}

async function infoPagina(page) {
  return page.evaluate(() => ({
    duracao: Number(window.DURACAO) || 0,
    fps: Number(window.FPS) || 30,
    largura: Number(window.LARGURA) || 1080,
    altura: Number(window.ALTURA) || 1920,
    chave: Array.isArray(window.QUADROS_CHAVE) ? window.QUADROS_CHAVE : null,
    temRender: typeof window.renderAt === 'function',
    temCapa: typeof window.renderCapa === 'function',
    capaT: Number(window.CAPA_T) || null,
  }));
}

async function quadro(cdp, page, t, largura, altura, formato = 'jpeg', qualidade = 92) {
  await page.evaluate(async (tt) => { await window.renderAt(tt); }, t);
  const opts = { format: formato, clip: { x: 0, y: 0, width: largura, height: altura, scale: 1 }, captureBeyondViewport: false, optimizeForSpeed: true };
  if (formato === 'jpeg') opts.quality = qualidade;
  const { data } = await cdp.send('Page.captureScreenshot', opts);
  return Buffer.from(data, 'base64');
}

function argsCor() {
  return ['-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv'];
}

// Renderiza os quadros [f0, f1) num segmento de vídeo (sem áudio)
async function renderSegmento({ browser, url, info, f0, f1, arquivo, ff, crf, rotulo, progresso }) {
  const { ctx, page, cdp } = await abrirPagina(browser, url, info.largura, info.altura);
  const proc = spawn(ff, ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(info.fps), '-c:v', 'mjpeg', '-i', '-',
    '-vf', 'scale=in_color_matrix=bt601:in_range=pc:out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-g', String(info.fps * 2), ...argsCor(), '-an', arquivo],
  { stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true });
  let errFF = '';
  proc.stderr.on('data', (d) => { errFF += d; });
  const fim = new Promise((res, rej) => proc.on('close', (c) => (c === 0 ? res() : rej(C.erro('O ffmpeg falhou ao montar o vídeo.', errFF.slice(-800))))));
  for (let f = f0; f < f1; f++) {
    const buf = await quadro(cdp, page, f / info.fps, info.largura, info.altura);
    if (!proc.stdin.write(buf)) await new Promise((r) => proc.stdin.once('drain', r));
    progresso(rotulo);
  }
  proc.stdin.end();
  await fim;
  await ctx.close();
}

async function renderizarVideo(o) {
  const ff = await C.ffmpegOuErro();
  const srv = await C.servidorEstatico(o.raiz);
  const browser = await C.abrirNavegador();
  const t0 = Date.now();
  try {
    const url = srv.url + C.urlDe(o.raiz, o.pagina);
    const { ctx, page } = await abrirPagina(browser, url, 1080, 1920);
    const info = await infoPagina(page);
    await ctx.close();
    if (!info.temRender) throw C.erro('A página não tem window.renderAt(t). Use um modelo de vídeo (modelos/video-imovel.html).');
    if (!(info.duracao > 0)) throw C.erro('A página não informou a duração (window.DURACAO).');
    if (o.fps) info.fps = Number(o.fps);
    const de = Math.max(0, Number(o.de || 0));
    const ate = Math.min(info.duracao, Number(o.ate || info.duracao));
    const f0 = Math.round(de * info.fps), f1 = Math.max(f0 + 1, Math.round(ate * info.fps));
    const total = f1 - f0;
    const pastaTrab = C.mkdirp(path.join(path.dirname(o.saida), 'trabalho', '_render'));
    const nTrab = Math.max(1, Math.min(Number(o.trabalhadores) || 1, Math.ceil(total / 30)));
    log(`Renderizando ${total} quadros (${(total / info.fps).toFixed(1)} s a ${info.fps} fps) com ${browser._marketeiroNome}, ${nTrab} trabalhador(es)...`);
    let feitos = 0, ultimo = 0;
    const progresso = () => {
      feitos++;
      const agora = Date.now();
      if (agora - ultimo > 4000 || feitos === total) {
        ultimo = agora;
        const dec = (agora - t0) / 1000;
        const resta = feitos ? dec / feitos * (total - feitos) : 0;
        log(`  quadro ${feitos}/${total} (${Math.round(feitos / total * 100)}%) · ${fmtT(dec)} · faltam ~${fmtT(resta)}`);
      }
    };
    const segs = [];
    const passo = Math.ceil(total / nTrab);
    const tarefas = [];
    for (let i = 0; i < nTrab; i++) {
      const a = f0 + i * passo, b = Math.min(f1, a + passo);
      if (a >= b) continue;
      const arq = path.join(pastaTrab, `seg-${String(i).padStart(2, '0')}.mp4`);
      segs.push(arq);
      tarefas.push(renderSegmento({ browser, url, info, f0: a, f1: b, arquivo: arq, ff, crf: o.crf || 18, rotulo: i, progresso }));
    }
    await Promise.all(tarefas);
    const segRender = (Date.now() - t0) / 1000;

    // junta os segmentos + áudio
    const lista = path.join(pastaTrab, 'lista.txt');
    fs.writeFileSync(lista, segs.map((s) => `file '${s.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'), 'utf8');
    const dur = total / info.fps;
    const args = ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lista];
    let comAudio = false;
    if (o.audio && fs.existsSync(o.audio)) {
      args.push('-ss', String(de), '-i', o.audio);
      comAudio = true;
    }
    args.push('-map', '0:v:0');
    if (comAudio) args.push('-map', '1:a:0?', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000');
    args.push('-c:v', 'copy', '-t', dur.toFixed(3), '-movflags', '+faststart', o.saida);
    const r = await C.rodar(ff, args);
    if (r.code !== 0) throw C.erro('O ffmpeg não conseguiu juntar o vídeo com o áudio.', r.stderr.slice(-800));

    const res = { ok: true, saida: o.saida, duracao: +dur.toFixed(2), quadros: total, fps: info.fps, com_audio: comAudio, tamanho_mb: C.tamanhoMB(o.saida), navegador: browser._marketeiroNome, segundos_render: +segRender.toFixed(1) };
    if (o.celular) {
      log('Gerando a versão de celular (até ~25 MB)...');
      res.celular = await versaoCelular(ff, o.saida, dur, comAudio);
      res.celular_mb = C.tamanhoMB(res.celular);
    }
    res.segundos_total = +((Date.now() - t0) / 1000).toFixed(1);
    try { fs.rmSync(pastaTrab, { recursive: true, force: true }); } catch { /* ignora */ }
    return res;
  } finally {
    await browser.close().catch(() => {});
    await srv.fechar();
  }
}

async function versaoCelular(ff, master, dur, comAudio) {
  const saida = master.replace(/\.mp4$/i, '') + '-celular.mp4';
  let fator = 0.92;
  for (let tent = 0; tent < 3; tent++) {
    const kbps = Math.max(800, Math.min(8000, Math.floor((25 * 8 * 1024 * fator) / Math.max(1, dur) - (comAudio ? 128 : 0))));
    const args = ['-y', '-v', 'error', '-i', master, '-c:v', 'libx264', '-preset', 'medium', '-b:v', kbps + 'k', '-maxrate', Math.round(kbps * 1.4) + 'k', '-bufsize', Math.round(kbps * 2) + 'k',
      '-pix_fmt', 'yuv420p', ...argsCor()];
    if (comAudio) args.push('-c:a', 'aac', '-b:a', '128k'); else args.push('-an');
    args.push('-movflags', '+faststart', saida);
    const r = await C.rodar(ff, args);
    if (r.code !== 0) throw C.erro('Não consegui gerar a versão de celular.', r.stderr.slice(-600));
    if (C.tamanhoMB(saida) <= 25) return saida;
    fator *= 0.85;
  }
  return saida;
}

async function renderizarStills(o) {
  const srv = await C.servidorEstatico(o.raiz);
  const browser = await C.abrirNavegador();
  try {
    const url = srv.url + C.urlDe(o.raiz, o.pagina);
    const { page, cdp } = await abrirPagina(browser, url, 1080, 1920);
    const info = await infoPagina(page);
    if (info.largura !== 1080 || info.altura !== 1920) await page.setViewportSize({ width: info.largura, height: info.altura });
    let ts;
    if (o.stills === true || o.stills === 'auto') {
      ts = info.chave && info.chave.length ? info.chave : Array.from({ length: 6 }, (_, i) => +((i + 0.5) * info.duracao / 6).toFixed(2));
    } else ts = String(o.stills).split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
    const pasta = C.mkdirp(path.join(path.dirname(o.pagina), 'stills'));
    const arquivos = [];
    for (const t of ts) {
      const buf = await quadro(cdp, page, Math.min(Math.max(0, t), Math.max(0, info.duracao - 1 / info.fps)), info.largura, info.altura, 'png');
      const arq = path.join(pasta, `still-${t.toFixed(2).padStart(6, '0')}s.png`);
      fs.writeFileSync(arq, buf);
      arquivos.push(arq);
    }
    return { ok: true, stills: arquivos, navegador: browser._marketeiroNome };
  } finally {
    await browser.close().catch(() => {});
    await srv.fechar();
  }
}

async function renderizarCapa(o) {
  const srv = await C.servidorEstatico(o.raiz);
  const browser = await C.abrirNavegador();
  try {
    const url = srv.url + C.urlDe(o.raiz, o.pagina);
    const { page, cdp } = await abrirPagina(browser, url, 1080, 1920);
    const info = await infoPagina(page);
    let buf;
    if (info.temCapa) {
      await page.evaluate(async () => { await window.renderCapa(); });
      ({ data: buf } = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: info.largura, height: info.altura, scale: 1 } }));
      buf = Buffer.from(buf, 'base64');
    } else {
      const t = o.capa !== true ? Number(o.capa) : (info.capaT || 0);
      buf = await quadro(cdp, page, t, info.largura, info.altura, 'png');
    }
    const arq = o.saida && /\.png$/i.test(o.saida) ? o.saida : path.join(path.dirname(o.pagina), 'capa.png');
    fs.writeFileSync(arq, buf);
    return { ok: true, capa: arq };
  } finally {
    await browser.close().catch(() => {});
    await srv.fechar();
  }
}

async function renderizarPngs(o) {
  const srv = await C.servidorEstatico(o.raiz);
  const browser = await C.abrirNavegador();
  try {
    const url = srv.url + C.urlDe(o.raiz, o.pagina);
    const { page } = await abrirPagina(browser, url, 1080, 1350);
    const tam = await page.evaluate(() => [...document.querySelectorAll('.slide')].map((el) => ({
      w: Number(el.dataset.w) || Math.round(el.getBoundingClientRect().width) || 1080,
      h: Number(el.dataset.h) || Math.round(el.getBoundingClientRect().height) || 1350,
    })));
    if (!tam.length) throw C.erro('A página não tem nenhum elemento .slide para virar PNG.');
    const maxW = Math.max(...tam.map((s) => s.w));
    await page.setViewportSize({ width: maxW, height: tam[0].h });
    await page.evaluate(async () => { if (window.PRONTO) await window.PRONTO; if (document.fonts) await document.fonts.ready; });
    const pasta = o.saida && !/\.png$/i.test(o.saida) ? C.mkdirp(path.resolve(o.saida)) : path.dirname(o.pagina);
    const prefixo = o.prefixo && o.prefixo !== true ? String(o.prefixo) : 'slide';
    for (const f of fs.readdirSync(pasta)) if (new RegExp('^' + prefixo + '-\\d+\\.png$').test(f)) fs.rmSync(path.join(pasta, f));
    const els = await page.$$('.slide');
    const arquivos = [];
    for (let i = 0; i < els.length; i++) {
      const arq = path.join(pasta, `${prefixo}-${String(i + 1).padStart(2, '0')}.png`);
      await els[i].screenshot({ path: arq, type: 'png', animations: 'disabled' });
      arquivos.push(arq);
    }
    return { ok: true, pngs: arquivos, tamanhos: tam, navegador: browser._marketeiroNome };
  } finally {
    await browser.close().catch(() => {});
    await srv.fechar();
  }
}

async function servir(o) {
  const srv = await C.servidorEstatico(o.raiz);
  const url = srv.url + C.urlDe(o.raiz, o.pagina);
  log('Página no ar só neste computador (feche com Ctrl+C):');
  log('  ' + url + '   (acrescente ?t=5 para ver o instante 5 s)');
  console.log(JSON.stringify({ ok: true, url }, null, 2));
  await new Promise(() => {});
}

async function principal() {
  const a = C.lerArgs();
  const raiz = C.acharRaiz(a);
  const pagina = resolverPagina(raiz, a.pagina);
  const o = Object.assign({}, a, { raiz, pagina });
  if (a.servir) return servir(o);
  if (a.png) return renderizarPngs(o);
  if (a.stills) return renderizarStills(o);
  if (a.capa !== undefined) return renderizarCapa(o);
  o.saida = a.saida && a.saida !== true ? path.resolve(String(a.saida)) : pagina.replace(/\.html?$/i, '') + '.mp4';
  if (!/\.mp4$/i.test(o.saida)) o.saida += '.mp4';
  C.mkdirp(path.dirname(o.saida));
  if (a['sem-audio']) o.audio = null;
  else if (a.audio && a.audio !== true) {
    o.audio = path.resolve(String(a.audio));
    if (!fs.existsSync(o.audio)) o.audio = path.resolve(raiz, String(a.audio));
    if (!fs.existsSync(o.audio)) throw C.erro('Não achei o áudio ' + a.audio + '.');
  } else {
    const auto = path.join(path.dirname(pagina), 'trabalho', 'audio.m4a');
    o.audio = fs.existsSync(auto) ? auto : null;
  }
  if (a.trabalhadores === undefined) o.trabalhadores = Math.max(1, Math.min(3, Math.floor(os.cpus().length / 2)));
  return renderizarVideo(o);
}

if (require.main === module) {
  principal().then((r) => { if (r) console.log(JSON.stringify(r, null, 2)); }).catch((e) => C.falhar(e));
}

module.exports = { renderizarVideo, renderizarStills, renderizarPngs, renderizarCapa };
