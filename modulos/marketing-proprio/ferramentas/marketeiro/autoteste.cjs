#!/usr/bin/env node
// Autoteste do motor: prova que este computador consegue criar as peças.
//   node ferramentas/marketeiro/autoteste.cjs
// Cria marketing/pecas/_autoteste/ com 1 post (PNG 1080x1350) e 1 vídeo de 3 s (MP4 1080x1920, sem pessoa),
// usando o tema da corretora (ou o padrão, se a marca ainda não existe). Imprime JSON {ok, arquivos, ...}.
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('./lib/comum.cjs');
const { gerar: gerarTema } = require('./tema.cjs');
const { renderizarPngs, renderizarVideo } = require('./render.cjs');

const log = (...a) => process.stderr.write(a.join(' ') + '\n');

const VIDEO = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Autoteste</title>
<link rel="stylesheet" href="/ferramentas/marketeiro/blocos/blocos.css">
<link rel="stylesheet" href="/marketing/marca/tema.css">
<script src="/ferramentas/marketeiro/blocos/blocos.js"></script></head>
<body><div id="palco"></div>
<script>
window.PRONTO = (async () => {
  const palavras = [
    { texto: 'Seu', inicio: 0.35, fim: 0.6 }, { texto: 'motor', inicio: 0.6, fim: 1.0 }, { texto: 'de', inicio: 1.0, fim: 1.1 },
    { texto: 'vídeo', inicio: 1.1, fim: 1.5 }, { texto: 'está', inicio: 1.6, fim: 1.9 }, { texto: 'pronto.', inicio: 1.9, fim: 2.5 } ];
  const f = new Blocos.Filme({ duracao: 3, palavras });
  f.adicionar('fundo', { estilo: 'liso' });
  f.adicionar('titulo', { inicio: 0, fim: 3, icone: 'casa', rotulo: 'Autoteste', titulo: 'Tudo *pronto*', sub: 'Marketeiro', y: 360 });
  f.adicionar('numero', { inicio: 0.4, fim: 3, valor: 100, unidade: '%', rotulo: 'funcionando', alinhamento: 'centro', y: 900, tamanho: 180, contarEm: 0.6, contagem: 1.6 });
  f.adicionar('legenda', { y: 1500 });
  await f.preparar();
  await Blocos.publicar(f);
})().catch(Blocos.mostrarErro);
</script></body></html>
`;

async function principal() {
  const t0 = Date.now();
  const a = C.lerArgs();
  const raiz = C.acharRaiz(a);
  if (!fs.existsSync(path.join(raiz, 'marketing', 'marca', 'tema.css'))) {
    log('Gerando o tema da marca...');
    gerarTema(raiz);
  }
  const pasta = path.join(raiz, 'marketing', 'pecas', '_autoteste');
  fs.rmSync(pasta, { recursive: true, force: true });
  C.mkdirp(pasta);
  fs.copyFileSync(path.join(C.MOTOR, 'modelos', 'post.html'), path.join(pasta, 'post.html'));
  fs.writeFileSync(path.join(pasta, 'conteudo.json'), JSON.stringify({
    slides: [{ tipo: 'capa', rotulo: 'Autoteste', titulo: 'Seu Marketeiro está *pronto*.', sub: 'Este post foi criado neste computador, agora mesmo.' }],
  }, null, 2), 'utf8');
  fs.writeFileSync(path.join(pasta, 'video.html'), VIDEO, 'utf8');

  log('1/2 Criando o post de teste...');
  const png = await renderizarPngs({ raiz, pagina: path.join(pasta, 'post.html') });
  log('2/2 Criando o vídeo de teste (3 s)...');
  const mp4 = await renderizarVideo({ raiz, pagina: path.join(pasta, 'video.html'), saida: path.join(pasta, 'video-teste.mp4'), audio: null, trabalhadores: 1 });

  // conferência: arquivos existem, têm tamanho e o vídeo tem ~3 s
  const arquivos = [...png.pngs, mp4.saida];
  const problemas = [];
  for (const f of arquivos) if (!fs.existsSync(f) || fs.statSync(f).size < 5000) problemas.push('arquivo vazio ou ausente: ' + path.basename(f));
  const ff = await C.ffmpegOuErro();
  const info = await C.rodar(ff, ['-hide_banner', '-i', mp4.saida]);
  const m = info.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const dur = m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
  if (Math.abs(dur - 3) > 0.2) problemas.push('duração inesperada do vídeo: ' + dur + ' s');
  if (!/1080x1920/.test(info.stderr)) problemas.push('o vídeo não saiu em 1080x1920');
  const ok = problemas.length === 0;
  return {
    ok,
    mensagem: ok ? 'Autoteste aprovado: este computador cria posts e vídeos.' : 'O autoteste encontrou problema: ' + problemas.join('; '),
    arquivos: arquivos.map((f) => C.relRaiz(raiz, f)),
    pasta: C.relRaiz(raiz, pasta),
    navegador: png.navegador,
    duracao_video: +dur.toFixed(2),
    segundos: +((Date.now() - t0) / 1000).toFixed(1),
    problemas,
  };
}

principal().then((r) => { console.log(JSON.stringify(r, null, 2)); process.exit(r.ok ? 0 : 1); }).catch((e) => C.falhar(e));
