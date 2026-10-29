#!/usr/bin/env node
// Confere e instala o que o motor precisa no computador da corretora. Pode rodar quantas vezes quiser.
//   node ferramentas/marketeiro/instalar-motor.cjs [--whisper-local <pasta com main.exe e ggml-small.bin>]
// Confere: navegador (Chrome; se não houver, Edge), ffmpeg (pacote ffmpeg-static), reconhecimento de voz
// (whisper.cpp + modelo "small" em ferramentas/marketeiro/whisper/). Imprime JSON {navegador, ffmpeg, whisper, ok, faltando}.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const C = require('./lib/comum.cjs');

const log = (...a) => process.stderr.write(a.join(' ') + '\n');
const PASTA_W = path.join(C.MOTOR, 'whisper');
// Release oficial com binário pronto para Windows x64 (o 1.5.5 não tem mais o zip publicado; conferido em 17/10/2026).
// O pacote traz whisper-cli.exe (o motor também aceita o main.exe das versões antigas).
const WHISPER_ZIPS = [
  'https://github.com/ggml-org/whisper.cpp/releases/download/v1.7.6/whisper-bin-x64.zip',
  'https://github.com/ggerganov/whisper.cpp/releases/download/v1.7.6/whisper-bin-x64.zip',
];
const MODELO_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin';
const MODELO_MIN = 400 * 1024 * 1024; // o small tem ~466 MB

async function baixar(url, destino, rotulo) {
  const tmp = destino + '.baixando';
  for (let tent = 1; tent <= 2; tent++) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const total = Number(res.headers.get('content-length')) || 0;
      let feito = 0, ultimo = -1;
      const corpo = Readable.fromWeb(res.body);
      corpo.on('data', (b) => {
        feito += b.length;
        const pc = total ? Math.floor((feito / total) * 10) : -1;
        if (pc !== ultimo && pc >= 0) { ultimo = pc; log(`   ${rotulo}: ${pc * 10}% (${(feito / 1048576).toFixed(0)} de ${(total / 1048576).toFixed(0)} MB)`); }
      });
      await pipeline(corpo, fs.createWriteStream(tmp));
      fs.renameSync(tmp, destino);
      return true;
    } catch (e) {
      try { fs.rmSync(tmp, { force: true }); } catch { /* */ }
      if (tent === 2) throw C.erro(`Não consegui baixar ${rotulo}. Confira a internet e tente de novo.`, url + ': ' + e.message);
      log(`   falhou (${e.message}); tentando de novo...`);
    }
  }
}

async function extrairZip(zip, pasta) {
  const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
  let r = await C.rodar(tar, ['-xf', zip, '-C', pasta]);
  if (r.code === 0) return;
  r = await C.rodar('powershell.exe', ['-NoProfile', '-Command', `Expand-Archive -Force -LiteralPath '${zip.replace(/'/g, "''")}' -DestinationPath '${pasta.replace(/'/g, "''")}'`]);
  if (r.code !== 0) throw C.erro('Não consegui descompactar o reconhecimento de voz.', r.stderr.slice(-400));
}

function acharExe(pasta) {
  const nomes = process.platform === 'win32' ? ['whisper-cli.exe', 'main.exe'] : ['whisper-cli', 'main'];
  const fila = [pasta];
  while (fila.length) {
    const d = fila.shift();
    let itens = [];
    try { itens = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const n of nomes) if (itens.find((i) => i.isFile() && i.name === n)) return path.join(d, n);
    for (const i of itens) if (i.isDirectory()) fila.push(path.join(d, i.name));
  }
  return null;
}

async function testarWhisper(exe) {
  const r = await C.rodar(exe, ['--help'], { cwd: path.dirname(exe) });
  return { ok: /usage|options/i.test(r.stdout + r.stderr), code: r.code };
}

async function garantirDependencias() {
  try { require.resolve('playwright-core'); require.resolve('ffmpeg-static'); return null; } catch { /* instala */ }
  log('Instalando as peças do motor (npm install)...');
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const r = await C.rodar(npm, ['install', '--omit=dev', '--no-audit', '--no-fund'], { cwd: C.MOTOR, shell: process.platform === 'win32' });
  if (r.code !== 0) return 'Não consegui instalar as peças do motor (npm install). Confira a internet e rode de novo.';
  return null;
}

async function conferirNavegador(cfg) {
  try {
    const b = await C.abrirNavegador();
    const nome = b._marketeiroNome;
    const page = await b.newPage();
    await page.setContent('<p>ok</p>');
    await b.close();
    cfg.navegador = { nome, canal: b._marketeiroCanal, caminho: b._marketeiroCaminho };
    return { ok: true, nome, mensagem: `${nome} pronto para desenhar as peças.` };
  } catch (e) {
    return { ok: false, mensagem: e.amigavel || 'Não consegui abrir o navegador.', detalhe: e.detalhe || String(e) };
  }
}

async function conferirFfmpeg(cfg) {
  let p = C.caminhoFfmpeg();
  if (!p) {
    // o binário do ffmpeg-static é baixado na instalação do pacote; tenta de novo
    try {
      const inst = path.join(path.dirname(require.resolve('ffmpeg-static/package.json')), 'install.js');
      if (fs.existsSync(inst)) { log('Baixando o ffmpeg...'); await C.rodar(process.execPath, [inst], { cwd: path.dirname(inst) }); }
      delete require.cache[require.resolve('ffmpeg-static')];
      p = require('ffmpeg-static');
      if (!p || !fs.existsSync(p)) p = null;
    } catch { p = null; }
  }
  if (!p) {
    const r = await C.rodar('ffmpeg', ['-version']);
    if (r.code === 0) p = 'ffmpeg';
  }
  if (!p) return { ok: false, mensagem: 'Falta o ffmpeg (o programa que monta o vídeo).' };
  const r = await C.rodar(p, ['-hide_banner', '-version']);
  if (r.code !== 0) return { ok: false, mensagem: 'O ffmpeg está instalado mas não abriu.', detalhe: r.stderr.slice(-300) };
  const x264 = /libx264/.test(r.stdout);
  if (!x264) return { ok: false, mensagem: 'O ffmpeg encontrado não grava MP4 em H.264.', detalhe: p };
  if (p !== 'ffmpeg') cfg.ffmpeg = p;
  return { ok: true, caminho: p, versao: (r.stdout.match(/ffmpeg version (\S+)/) || [])[1], mensagem: 'ffmpeg pronto para montar os vídeos.' };
}

async function conferirWhisper(cfg, local) {
  C.mkdirp(PASTA_W);
  let exe = acharExe(PASTA_W);
  let modelo = path.join(PASTA_W, 'ggml-small.bin');
  const modeloOk = () => fs.existsSync(modelo) && fs.statSync(modelo).size > MODELO_MIN;
  if ((!exe || !modeloOk()) && local && local !== true) {
    const origem = path.resolve(String(local));
    if (!fs.existsSync(origem)) return { ok: false, mensagem: 'A pasta indicada em --whisper-local não existe.', detalhe: origem };
    log('Copiando o reconhecimento de voz de ' + origem + '...');
    for (const f of fs.readdirSync(origem)) {
      if (/\.(exe|dll)$/i.test(f) && !/^(bench|command|lsp|quantize|server|stream|talk|talk-llama|wchess)\.exe$/i.test(f)) fs.copyFileSync(path.join(origem, f), path.join(PASTA_W, f));
      if (/^(main|whisper-cli)$/.test(f)) { fs.copyFileSync(path.join(origem, f), path.join(PASTA_W, f)); fs.chmodSync(path.join(PASTA_W, f), 0o755); }
    }
    const mod = path.join(origem, 'ggml-small.bin');
    if (fs.existsSync(mod) && !modeloOk()) fs.copyFileSync(mod, modelo);
    exe = acharExe(PASTA_W);
  }
  if (!exe) {
    if (process.platform !== 'win32') return { ok: false, mensagem: 'Neste sistema instale o whisper.cpp à parte (ex.: brew install whisper-cpp) e copie o executável para ferramentas/marketeiro/whisper/.' };
    if (os.arch() !== 'x64') return { ok: false, mensagem: 'O reconhecimento de voz pronto só existe para Windows de 64 bits (x64).' };
    log('Baixando o reconhecimento de voz (whisper.cpp)...');
    const zip = path.join(PASTA_W, 'whisper-bin-x64.zip');
    let ultimoErro = null;
    for (const u of WHISPER_ZIPS) {
      try { await baixar(u, zip, 'whisper.cpp'); ultimoErro = null; break; } catch (e) { ultimoErro = e; }
    }
    if (ultimoErro) throw ultimoErro;
    await extrairZip(zip, PASTA_W);
    fs.rmSync(zip, { force: true });
    exe = acharExe(PASTA_W);
    if (!exe) return { ok: false, mensagem: 'Baixei o reconhecimento de voz, mas não achei o programa dentro do pacote.' };
  }
  if (!modeloOk()) {
    log('Baixando o modelo de voz em português (~470 MB, só na primeira vez)...');
    await baixar(MODELO_URL, modelo, 'modelo de voz');
    if (!modeloOk()) return { ok: false, mensagem: 'O modelo de voz veio incompleto. Rode de novo.' };
  }
  const teste = await testarWhisper(exe);
  if (!teste.ok) {
    const faltaVC = teste.code === -1073741515 || teste.code === 3221225781;
    return {
      ok: false,
      mensagem: faltaVC
        ? 'O reconhecimento de voz precisa de um componente do Windows (Microsoft Visual C++ Redistributable). Instale com: winget install -e --id Microsoft.VCRedist.2015+.x64 e rode este instalador de novo.'
        : 'O reconhecimento de voz não abriu neste computador.',
      detalhe: exe + ' (código ' + teste.code + ')',
    };
  }
  cfg.whisper = { exe, modelo };
  return { ok: true, exe: C.relRaiz(C.MOTOR, exe), modelo: C.relRaiz(C.MOTOR, modelo), mensagem: 'Reconhecimento de voz pronto (legenda palavra por palavra).' };
}

async function principal() {
  const a = C.lerArgs();
  const faltando = [];
  const versaoNode = Number(process.versions.node.split('.')[0]);
  if (versaoNode < 20) faltando.push(`O Node.js está na versão ${process.versions.node}; o motor precisa da 20 ou mais nova.`);
  const errDep = await garantirDependencias();
  if (errDep) {
    console.log(JSON.stringify({ ok: false, faltando: [errDep] }, null, 2));
    process.exit(1);
  }
  const cfg = C.lerConfig();
  log('Conferindo o navegador...');
  const navegador = await conferirNavegador(cfg);
  log('Conferindo o ffmpeg...');
  const ffmpeg = await conferirFfmpeg(cfg);
  log('Conferindo o reconhecimento de voz...');
  let whisper;
  try { whisper = await conferirWhisper(cfg, a['whisper-local']); } catch (e) { whisper = { ok: false, mensagem: e.amigavel || 'Falha no reconhecimento de voz.', detalhe: e.detalhe || String(e) }; }
  cfg.atualizado_em = new Date().toISOString();
  C.salvarConfig(cfg);
  for (const [k, v] of [['navegador', navegador], ['ffmpeg', ffmpeg], ['whisper', whisper]]) if (!v.ok) faltando.push(v.mensagem);
  const ok = faltando.length === 0;
  const res = { ok, navegador, ffmpeg, whisper, faltando, resumo: ok ? 'Tudo pronto: dá para criar posts, carrosséis e vídeos neste computador.' : 'Falta: ' + faltando.join(' ') };
  console.log(JSON.stringify(res, null, 2));
  process.exit(ok ? 0 : 1);
}

principal().catch((e) => C.falhar(e));
