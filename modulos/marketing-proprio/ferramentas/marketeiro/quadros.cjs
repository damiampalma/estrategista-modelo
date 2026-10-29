#!/usr/bin/env node
// Tira quadros de um vídeo de referência para o agente olhar (estilo, ritmo, composição).
//   node ferramentas/marketeiro/quadros.cjs --video <arquivo> --saida <pasta> [--n 6] [--largura 540]
// Os quadros saem espalhados pelo vídeo (quadro-01.jpg, quadro-02.jpg...). O resultado sai em JSON no stdout.
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('./lib/comum.cjs');

async function quadros(o) {
  const ff = await C.ffmpegOuErro();
  const video = path.resolve(String(o.video));
  if (!fs.existsSync(video)) throw C.erro('Não achei o vídeo ' + o.video + '.');
  const saida = C.mkdirp(path.resolve(String(o.saida)));
  const n = Math.max(1, Math.min(24, Number(o.n) || 6));
  const largura = Number(o.largura) || 540;
  const info = await C.rodar(ff, ['-hide_banner', '-i', video]);
  const m = /Duration:\s*(\d+):(\d+):([\d.]+)/.exec(info.stderr);
  if (!m) throw C.erro('Não consegui ler a duração desse vídeo.', info.stderr.slice(-400));
  const dur = (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
  const feitos = [];
  for (let i = 0; i < n; i++) {
    const t = +((dur * (i + 0.5)) / n).toFixed(2);
    const arq = path.join(saida, 'quadro-' + String(i + 1).padStart(2, '0') + '.jpg');
    const r = await C.rodar(ff, ['-y', '-v', 'error', '-ss', String(t), '-i', video, '-frames:v', '1', '-vf', `scale=${largura}:-2`, '-q:v', '3', arq]);
    if (r.code === 0 && fs.existsSync(arq)) feitos.push({ arquivo: C.relRaiz(process.cwd(), arq), t });
  }
  if (!feitos.length) throw C.erro('Não consegui tirar nenhum quadro desse vídeo.');
  return { ok: true, duracao: +dur.toFixed(2), quadros: feitos };
}

if (require.main === module) {
  const a = C.lerArgs();
  if (!a.video || !a.saida || a.video === true || a.saida === true) {
    C.falhar(C.erro('Uso: node ferramentas/marketeiro/quadros.cjs --video <arquivo> --saida <pasta> [--n 6]'));
  }
  quadros(a).then((r) => console.log(JSON.stringify(r, null, 2))).catch((e) => C.falhar(e));
}
module.exports = { quadros };
