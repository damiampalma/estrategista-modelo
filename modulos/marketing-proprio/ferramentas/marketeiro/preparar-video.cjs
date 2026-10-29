#!/usr/bin/env node
// Prepara o vídeo da corretora para a animação.
//   node ferramentas/marketeiro/preparar-video.cjs --video <arquivo> --peca <pasta da peça> [--inicio 0] [--duracao 40] [--sem-transcricao]
//   node ferramentas/marketeiro/preparar-video.cjs --audio <locução mp3/m4a/wav/ogg> --peca <pasta da peça>   (vídeo só com animação: sem pessoa/)
// Gera em <peca>/trabalho/:
//   audio.wav (16 kHz mono, para o reconhecimento de voz) · audio.m4a (áudio original para o MP4 final)
//   palavras.json [{texto, inicio, fim}] em segundos · transcricao.txt · pessoa/000001.jpg... (30 fps, 1080 de largura)
//   meta.json {duracao, fps, largura, altura, quadros}
// Outras opções: --fim <s>, --fps 30, --largura 1080, --idioma pt, --modelo <ggml.bin>, --prompt "nomes próprios, bairros".
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const C = require('./lib/comum.cjs');

const log = (...a) => process.stderr.write(a.join(' ') + '\n');

function acharWhisper() {
  const cfg = C.lerConfig();
  const pasta = path.join(C.MOTOR, 'whisper');
  const exe = [cfg.whisper && cfg.whisper.exe, path.join(pasta, 'whisper-cli.exe'), path.join(pasta, 'main.exe'), path.join(pasta, 'Release', 'whisper-cli.exe'), path.join(pasta, 'Release', 'main.exe'), path.join(pasta, 'whisper-cli'), path.join(pasta, 'main')]
    .filter(Boolean).find((p) => fs.existsSync(p));
  const modelo = [cfg.whisper && cfg.whisper.modelo, path.join(pasta, 'ggml-small.bin')].filter(Boolean).find((p) => fs.existsSync(p));
  return { exe, modelo };
}

// Lê a saída JSON completa do whisper.cpp e junta os pedaços (tokens) em palavras com tempo.
// O arquivo é lido byte a byte (latin1) porque um acento pode vir partido entre dois tokens.
function palavrasDoWhisper(arqJson) {
  const bruto = fs.readFileSync(arqJson).toString('latin1');
  const j = JSON.parse(bruto);
  const utf8 = (s) => Buffer.from(s, 'latin1').toString('utf8');
  const palavras = [];
  let atual = null;
  const fechar = () => {
    if (atual) {
      const texto = utf8(atual.bytes).trim();
      if (texto) palavras.push({ texto, inicio: +(atual.inicio / 1000).toFixed(3), fim: +(atual.fim / 1000).toFixed(3) });
    }
    atual = null;
  };
  for (const seg of j.transcription || []) {
    for (const tk of seg.tokens || []) {
      const txt = tk.text || '';
      if (/^\[_|^<\|/.test(txt) || (tk.id !== undefined && tk.id >= 50257 && /^\[/.test(txt))) continue;
      const de = tk.offsets ? tk.offsets.from : 0, ate = tk.offsets ? tk.offsets.to : de;
      const novaPalavra = txt.startsWith(' ') || !atual;
      const soPontuacao = /^[.,!?;:…"')\]]+$/.test(utf8(txt).trim());
      if (novaPalavra && !(soPontuacao && atual)) { fechar(); atual = { bytes: txt, inicio: de, fim: ate }; }
      else { atual.bytes += txt; atual.fim = Math.max(atual.fim, ate); }
    }
    fechar();
  }
  // tempos sempre crescentes e com duração mínima
  for (let i = 0; i < palavras.length; i++) {
    const p = palavras[i];
    if (i && p.inicio < palavras[i - 1].inicio) p.inicio = palavras[i - 1].inicio;
    if (p.fim < p.inicio + 0.05) p.fim = +(p.inicio + 0.05).toFixed(3);
  }
  return palavras;
}

function lerTamanhoJpeg(arq) {
  const b = fs.readFileSync(arq);
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { altura: b.readUInt16BE(i + 5), largura: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

async function preparar(o) {
  const ff = await C.ffmpegOuErro();
  const entrada = (o.video && o.video !== true) ? o.video : o.audio;
  const video = path.resolve(String(entrada));
  if (!fs.existsSync(video)) throw C.erro('Não achei o arquivo ' + entrada + '.');
  const peca = C.mkdirp(path.resolve(o.peca));
  const trab = C.mkdirp(path.join(peca, 'trabalho'));
  const fps = Number(o.fps || 30), largura = Number(o.largura || 1080);
  const corte = [];
  if (o.inicio) corte.push('-ss', String(Number(o.inicio)));
  const durArg = o.duracao ? Number(o.duracao) : (o.fim ? Number(o.fim) - Number(o.inicio || 0) : null);
  const corteT = durArg ? ['-t', String(durArg)] : [];
  const t0 = Date.now();

  // informações do vídeo
  const info = await C.rodar(ff, ['-hide_banner', '-i', video]);
  const temAudio = /Stream #\d+:\d+.*Audio:/.test(info.stderr);
  // capa de mp3 aparece como "Video: ... (attached pic)": não conta como vídeo
  const temVideo = info.stderr.split('\n').some((l) => /Stream #\d+:\d+.*Video:/.test(l) && !/attached pic/i.test(l));
  const soAudio = !!(o.audio && o.audio !== true && !(o.video && o.video !== true)) || (!temVideo && temAudio);
  if (!temVideo && !temAudio) throw C.erro('Esse arquivo não parece um vídeo nem um áudio.', info.stderr.slice(-400));
  if (soAudio && !temAudio) throw C.erro('Esse arquivo não tem som. Para o vídeo só com locução, mande um áudio (mp3, m4a, wav, ogg).');

  // 1) quadros da pessoa (não existe no vídeo só com locução)
  const pastaQ = path.join(trab, 'pessoa');
  fs.rmSync(pastaQ, { recursive: true, force: true });
  let r, quadros = 0, tam = { largura: 1080, altura: 1920 };
  if (!soAudio) {
    log('1/3 Separando os quadros do vídeo...');
    C.mkdirp(pastaQ);
    r = await C.rodar(ff, ['-y', '-v', 'error', ...corte, '-i', video, ...corteT, '-vf', `fps=${fps},scale=${largura}:-2:flags=lanczos`, '-q:v', '3', '-start_number', '1', path.join(pastaQ, '%06d.jpg')]);
    if (r.code !== 0) throw C.erro('Não consegui separar os quadros do vídeo.', r.stderr.slice(-600));
    quadros = fs.readdirSync(pastaQ).filter((f) => /^\d{6}\.jpg$/.test(f)).length;
    if (!quadros) throw C.erro('O vídeo não gerou nenhum quadro. Ele pode estar corrompido.');
    tam = lerTamanhoJpeg(path.join(pastaQ, '000001.jpg')) || { largura, altura: Math.round(largura * 16 / 9) };
  } else log('1/3 Só locução: sem quadros de pessoa (a tela inteira fica para a animação).');

  // 2) áudio
  log('2/3 Separando o áudio...');
  const wav = path.join(trab, 'audio.wav'), m4a = path.join(trab, 'audio.m4a');
  if (temAudio) {
    r = await C.rodar(ff, ['-y', '-v', 'error', ...corte, '-i', video, ...corteT, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', wav]);
    if (r.code !== 0) throw C.erro('Não consegui separar o áudio.', r.stderr.slice(-600));
    r = await C.rodar(ff, ['-y', '-v', 'error', ...corte, '-i', video, ...corteT, '-vn', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', m4a]);
    if (r.code !== 0) throw C.erro('Não consegui separar o áudio original.', r.stderr.slice(-600));
  } else log('   (o vídeo não tem som; sigo sem legenda falada)');

  // duração: pelos quadros (vídeo) ou pelo tamanho do wav (16 kHz, 16 bits, mono = 32000 bytes por segundo)
  const duracao = soAudio ? +(Math.max(0, fs.statSync(wav).size - 44) / 32000).toFixed(3) : +(quadros / fps).toFixed(3);
  const meta = { duracao, fps, largura: tam.largura, altura: tam.altura, quadros, so_audio: soAudio, origem: path.basename(video), inicio: Number(o.inicio || 0), preparado_em: new Date().toISOString() };
  fs.writeFileSync(path.join(trab, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');

  // 3) transcrição palavra por palavra
  let palavras = [], aviso = null;
  if (temAudio && !o['sem-transcricao']) {
    const w = acharWhisper();
    if (o.modelo && o.modelo !== true) w.modelo = path.resolve(o.modelo);
    if (!w.exe || !w.modelo) {
      aviso = 'O reconhecimento de voz não está instalado (rode instalar-motor.cjs). Fiz tudo menos a legenda.';
    } else {
      log('3/3 Ouvindo a fala e marcando o tempo de cada palavra (leva ~1 a 2 min por minuto de vídeo)...');
      const base = path.join(trab, 'whisper');
      fs.rmSync(base + '.json', { force: true });
      // caminhos relativos à pasta trabalho/: o whisper.cpp no Windows pode falhar com acento no caminho (ex.: uma pasta de usuário com acento, como C:\Users\José)
      const ascii = (s) => /^[\x20-\x7e]*$/.test(s);
      const rel = (p) => { if (ascii(p)) return p; const r0 = path.relative(trab, p); return ascii(r0) ? r0 : p; };
      const args = ['-m', rel(w.modelo), '-f', 'audio.wav', '-l', o.idioma || 'pt', '-ojf', '-of', 'whisper', '-t', String(Math.max(1, Math.min(8, os.cpus().length))), '-np'];
      if (/small/i.test(path.basename(w.modelo))) args.push('--dtw', 'small');
      if (o.prompt && o.prompt !== true) args.push('--prompt', String(o.prompt));
      r = await C.rodar(w.exe, args, { cwd: trab });
      if (r.code !== 0 || !fs.existsSync(base + '.json')) {
        // tenta de novo sem o alinhamento fino (versões antigas não têm --dtw)
        const semDtw = args.filter((x, i) => x !== '--dtw' && args[i - 1] !== '--dtw');
        r = await C.rodar(w.exe, semDtw, { cwd: trab });
      }
      if (r.code === -1073741515 || r.code === 3221225781) {
        throw C.erro('O reconhecimento de voz precisa do "Microsoft Visual C++ Redistributable" no Windows. Instale com: winget install -e --id Microsoft.VCRedist.2015+.x64 e rode de novo.', 'código ' + r.code);
      }
      if (r.code !== 0 || !fs.existsSync(base + '.json')) throw C.erro('O reconhecimento de voz falhou.', (r.stderr || '').slice(-800));
      palavras = palavrasDoWhisper(base + '.json');
      // o --prompt às vezes desvia o reconhecimento (sai quase nada); nesse caso refaz sem ele e fica com o melhor
      if (o.prompt && o.prompt !== true && palavras.length < duracao * 0.6) {
        log('   a dica de nomes atrapalhou; ouvindo de novo sem ela...');
        const semPrompt = args.filter((x, i) => x !== '--prompt' && args[i - 1] !== '--prompt');
        fs.rmSync(base + '.json', { force: true });
        const r2 = await C.rodar(w.exe, semPrompt, { cwd: trab });
        if (r2.code === 0 && fs.existsSync(base + '.json')) {
          const p2 = palavrasDoWhisper(base + '.json');
          if (p2.length > palavras.length) { palavras = p2; aviso = 'A dica de nomes (--prompt) atrapalhou o reconhecimento; usei a transcrição sem ela. Corrija os nomes à mão em palavras.json ou com "correcoes" no roteiro.'; }
        }
      }
      fs.writeFileSync(path.join(trab, 'palavras.json'), JSON.stringify(palavras, null, 1), 'utf8');
      fs.writeFileSync(path.join(trab, 'transcricao.txt'), palavras.map((p) => p.texto).join(' ') + '\n', 'utf8');
    }
  }
  if (!palavras.length && !fs.existsSync(path.join(trab, 'palavras.json'))) fs.writeFileSync(path.join(trab, 'palavras.json'), '[]', 'utf8');

  return {
    ok: true, peca, duracao, quadros, so_audio: soAudio, fps, largura: tam.largura, altura: tam.altura, com_audio: temAudio, palavras: palavras.length,
    primeiras_palavras: palavras.slice(0, 12).map((p) => `${p.inicio.toFixed(2)}s ${p.texto}`),
    arquivos: ['trabalho/audio.wav', 'trabalho/audio.m4a', 'trabalho/palavras.json', ...(soAudio ? [] : ['trabalho/pessoa/']), 'trabalho/meta.json'],
    aviso, segundos: +((Date.now() - t0) / 1000).toFixed(1),
  };
}

if (require.main === module) {
  const a = C.lerArgs();
  const temEntrada = (a.video && a.video !== true) || (a.audio && a.audio !== true);
  if (!temEntrada || !a.peca || a.peca === true) {
    C.falhar(C.erro('Uso: node ferramentas/marketeiro/preparar-video.cjs --video <arquivo> --peca <pasta da peça>   (ou --audio <locução> para o vídeo só com animação)'));
  }
  preparar(a).then((r) => console.log(JSON.stringify(r, null, 2))).catch((e) => C.falhar(e));
}
module.exports = { preparar, palavrasDoWhisper };
