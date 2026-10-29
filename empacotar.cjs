#!/usr/bin/env node
// empacotar.cjs · gera ../modelo.zip a partir desta pasta, (caminho antigo "baixar zip", aposentado em 26/10/2026: a sede no computador agora vem do GitHub pela skill sede-no-computador). Fica só para emergência.
// Uso (na pasta modelo/ ou de qualquer lugar): node empacotar.cjs [--saida <arquivo.zip>] [--listar]
// Fica de fora: .git, node_modules, whisper, _privado, config.json do motor, .env*, chaves, lixo do sistema e este script.
// Só Node (>= 18), sem dependência: escreve o zip à mão (deflate do zlib + CRC32). Resultado em JSON no stdout.
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const RAIZ = __dirname;
const args = process.argv.slice(2);
const LISTAR = args.includes('--listar');
const iSaida = args.indexOf('--saida');
const SAIDA = path.resolve(iSaida >= 0 && args[iSaida + 1] ? args[iSaida + 1] : path.join(RAIZ, '..', 'modelo.zip'));

const DIRS_FORA = new Set(['.git', 'node_modules', 'whisper', '_privado', '__pycache__']);
const ARQS_FORA = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini', 'empacotar.cjs']);

function fica_fora(rel, nome, ehDir) {
  if (ehDir) return DIRS_FORA.has(nome);
  if (ARQS_FORA.has(nome)) return true;
  if (nome === '.env' || nome.startsWith('.env.')) return true;
  if (/\.(key|pem|zip)$/i.test(nome)) return true;
  if (/(^|\/)ferramentas\/marketeiro\/config\.json$/.test(rel)) return true;
  if (/\.(mp4|mov|wav|m4a)$/i.test(nome) && !/-celular\.mp4$/i.test(nome)) return true;
  return false;
}

function listar(dir, base, saida) {
  const itens = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'));
  for (const it of itens) {
    const abs = path.join(dir, it.name);
    const rel = (base ? base + '/' : '') + it.name;
    if (it.isSymbolicLink()) continue;
    if (it.isDirectory()) {
      if (fica_fora(rel, it.name, true)) continue;
      listar(abs, rel, saida);
    } else if (it.isFile()) {
      if (fica_fora(rel, it.name, false)) continue;
      saida.push({ rel, abs });
    }
  }
  return saida;
}

// ---------- CRC32 ----------
const TABELA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = TABELA[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ---------- data e hora no formato do zip (MS-DOS) ----------
function dosDataHora(d) {
  const ano = Math.max(1980, d.getFullYear());
  const data = ((ano - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  return { data, hora };
}

function u16(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n & 0xFFFF, 0); return b; }
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0, 0); return b; }

function zipar(arquivos, destino) {
  const partes = [];
  const centrais = [];
  let offset = 0;
  const FLAG_UTF8 = 0x0800;

  for (const a of arquivos) {
    const dados = fs.readFileSync(a.abs);
    const st = fs.statSync(a.abs);
    const nome = Buffer.from(a.rel, 'utf8');
    const crc = crc32(dados);
    let metodo = 8;
    let corpo = zlib.deflateRawSync(dados, { level: 9 });
    if (corpo.length >= dados.length) { metodo = 0; corpo = dados; } // guardar sem comprimir quando não compensa
    const { data, hora } = dosDataHora(st.mtime);

    const local = Buffer.concat([
      u32(0x04034b50), u16(20), u16(FLAG_UTF8), u16(metodo), u16(hora), u16(data),
      u32(crc), u32(corpo.length), u32(dados.length), u16(nome.length), u16(0), nome,
    ]);
    partes.push(local, corpo);

    centrais.push(Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(FLAG_UTF8), u16(metodo), u16(hora), u16(data),
      u32(crc), u32(corpo.length), u32(dados.length), u16(nome.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset), nome,
    ]));
    offset += local.length + corpo.length;
  }

  const central = Buffer.concat(centrais);
  const fim = Buffer.concat([
    u32(0x06054b50), u16(0), u16(0), u16(arquivos.length), u16(arquivos.length),
    u32(central.length), u32(offset), u16(0),
  ]);
  fs.writeFileSync(destino, Buffer.concat([...partes, central, fim]));
}

try {
  const arquivos = listar(RAIZ, '', []);
  if (LISTAR) {
    for (const a of arquivos) process.stdout.write(a.rel + '\n');
    process.exit(0);
  }
  if (arquivos.length > 65000) throw new Error('mais de 65.000 arquivos: este empacotador simples não usa zip64');
  zipar(arquivos, SAIDA);
  const bytes = fs.statSync(SAIDA).size;
  const mb = Math.round((bytes / 1048576) * 100) / 100;
  const ok = mb < 50;
  process.stdout.write(JSON.stringify({
    ok,
    arquivo: SAIDA,
    arquivos: arquivos.length,
    bytes,
    mb,
    mensagem: ok ? 'Zip pronto.' : 'Zip acima de 50 MB: tire ferramentas/marketeiro do pacote ou revise o que entrou.',
  }, null, 2) + '\n');
  process.exit(ok ? 0 : 2);
} catch (e) {
  process.stdout.write(JSON.stringify({ ok: false, mensagem: 'Não consegui gerar o zip.', detalhe: String(e && e.message || e) }, null, 2) + '\n');
  process.exit(1);
}
