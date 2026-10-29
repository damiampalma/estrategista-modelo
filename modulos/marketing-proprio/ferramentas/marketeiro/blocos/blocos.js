/* Blocos do Marketeiro · biblioteca de cenas determinística para vídeo 1080x1920 (e peças estáticas).
 * Tudo é função do tempo t (segundos): nada de animação por relógio, CSS transition ou requestAnimationFrame.
 * Uso rápido (ver BLOCOS.md):
 *   const filme = await Blocos.montarDeRoteiro(await Blocos.carregarJSON('roteiro.json'));
 *   Blocos.publicar(filme);   // define window.DURACAO, window.renderAt(t), window.QUADROS_CHAVE
 * Ou à mão:
 *   const filme = new Blocos.Filme({ duracao: 12, palavras });
 *   filme.adicionar('fundo', { estilo: 'liso' });
 *   filme.adicionar('numero', { inicio: 1, fim: 5, valor: 84, unidade: 'm²', rotulo: 'POR DENTRO' });
 *   await filme.preparar(); Blocos.publicar(filme);
 */
(function () {
  'use strict';
  const W = 1080, H = 1920;

  // ---------------------------------------------------------------- utilidades
  const U = {};
  U.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  U.lerp = (a, b, p) => a + (b - a) * p;
  U.prog = (t, a, b) => (b <= a ? (t >= a ? 1 : 0) : U.clamp((t - a) / (b - a)));
  U.rad = (g) => (g * Math.PI) / 180;
  U.ease = {
    linear: (p) => p,
    sai: (p) => 1 - Math.pow(1 - p, 3),
    saiForte: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
    saiQuint: (p) => 1 - Math.pow(1 - p, 5),
    entra: (p) => p * p * p,
    suave: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    volta: (p) => { const c1 = 1.4, c3 = c1 + 1; return p >= 1 ? 1 : 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  };
  U.aleatorio = (semente) => { // mulberry32: sequência fixa para a mesma semente
    let a = (typeof semente === 'string' ? [...semente].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) : semente | 0) >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  U.hexRgb = (h) => {
    h = String(h || '').trim();
    if (h.startsWith('rgb')) { const m = h.match(/[\d.]+/g).map(Number); return m.slice(0, 3); }
    if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    const n = parseInt(h.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.mix = (c1, c2, p) => { const a = U.hexRgb(c1), b = U.hexRgb(c2); return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * p)).join(',')})`; };
  U.rgba = (c, al) => `rgba(${U.hexRgb(c).join(',')},${al})`;
  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  U.fmtNum = (n, casas = 0) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  U.norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  // *palavra* = destaque (sempre a PALAVRA INTEIRA, mesmo que o asterisco caia no meio dela); **texto** = negrito
  U.marcar = (texto) => {
    let s = String(texto == null ? '' : texto);
    const letra = /[\p{L}\p{N}'’-]/u;
    // expande cada *...* até as bordas da palavra
    let saida = '', i = 0;
    while (i < s.length) {
      if (s[i] === '*' && s[i + 1] === '*') {
        const j = s.indexOf('**', i + 2);
        if (j > 0) { saida += '\u0001' + s.slice(i + 2, j) + '\u0002'; i = j + 2; continue; }
      }
      if (s[i] === '*') {
        const j = s.indexOf('*', i + 1);
        if (j > 0) {
          let ini = saida.length, dentro = s.slice(i + 1, j), fim = j + 1;
          let antes = '';
          while (ini > 0 && letra.test(saida[ini - 1])) { antes = saida[ini - 1] + antes; ini--; }
          let depois = '';
          while (fim < s.length && letra.test(s[fim])) { depois += s[fim]; fim++; }
          saida = saida.slice(0, ini) + '\u0003' + antes + dentro + depois + '\u0004';
          i = fim; continue;
        }
      }
      saida += s[i]; i++;
    }
    return U.esc(saida).replace(/\u0001/g, '<strong>').replace(/\u0002/g, '</strong>').replace(/\u0003/g, '<em class="mk-d">').replace(/\u0004/g, '</em>');
  };

  // ícones de linha (viewBox 24, traço) — servem para SVG e para canvas (Path2D)
  const ICONES = {
    pe: 'M14.6 4a1.6 1.6 0 1 1-3.2 0a1.6 1.6 0 1 1 3.2 0Z M12.5 7L11 13 M12.4 8.6L9.6 10.6L8.6 13.2 M12.3 8.6L15 10.2L17 11.6 M11 13L9.1 16.8L7 20.6 M11 13L13.6 16.4L14.2 21',
    metro: 'M7 3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z M4 10h16 M8 13.6h.01 M16 13.6h.01 M8 17l-2 4 M16 17l2 4 M9 6.5h6',
    onibus: 'M6 3h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z M4 11h16 M7 18v2.5 M17 18v2.5 M7.6 14.5h.01 M16.4 14.5h.01 M8 6.5h8',
    tubo: 'M8 6h8a5 5 0 0 1 0 10H8A5 5 0 0 1 8 6Z M8 6v10 M12 6v10 M16 6v10 M3 20h18',
    parque: 'M12 21v-6 M12 15c-4 0-6.5-2.6-6.5-5.6S8.2 3 12 3s6.5 3.4 6.5 6.4S16 15 12 15Z M9 21h6',
    pin: 'M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21Z M14.5 9.8a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0Z',
    sol: 'M3 17h18 M6.5 17a5.5 5.5 0 0 1 11 0 M12 6.5V9 M5.6 9.6l1.7 1.7 M18.4 9.6l-1.7 1.7 M2.5 13.5h2.3 M19.2 13.5h2.3 M7 20.5h10',
    araucaria: 'M12 22V3.5 M12 7.5C10 7.5 8.4 6.6 7.5 5.2 M12 7.5c2 0 3.6-.9 4.5-2.3 M12 12C9 12 6.4 10.7 5 8.6 M12 12c3 0 5.6-1.3 7-3.4 M12 16.5c-3.8 0-7-1.5-8.6-4 M12 16.5c3.8 0 7-1.5 8.6-4 M9 22h6',
    predio: 'M5 21V5l7-2v18 M12 8h7v13 M3 21h18 M8 7.5v.01 M8 11v.01 M8 14.5v.01 M15.5 11.5v.01 M15.5 15v.01',
    chave: 'M8 15a5 5 0 1 1 0-10a5 5 0 0 1 0 10Z M12.5 10H21 M18 10v3 M21 10v2.5',
    casa: 'M3 11l9-7 9 7 M5.5 9.5V20h13V9.5 M10 20v-5h4v5',
    instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z M16 12a4 4 0 1 1-8 0a4 4 0 1 1 8 0Z M17.3 6.7h.01',
    mensagem: 'M4 5h16v11H9l-5 4Z M8 10h8 M8 13h5',
    carro: 'M5 16v3 M19 16v3 M3.5 16h17v-4l-2-5h-13l-2 5Z M3.5 12h17 M7 14h.01 M17 14h.01',
    cama: 'M3 18V7 M3 14h18v4 M21 14v-2a3 3 0 0 0-3-3h-7v5 M9 11.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 1 1 3 0Z',
    area: 'M4 4h16v16H4Z M4 9h3 M4 14h2 M9 4v3 M14 4v2',
    mercado: 'M3 4h2l2.4 11h10.8l2-8H6.3 M10.7 19.5a1.2 1.2 0 1 1-2.4 0a1.2 1.2 0 1 1 2.4 0Z M18.2 19.5a1.2 1.2 0 1 1-2.4 0a1.2 1.2 0 1 1 2.4 0Z',
    escola: 'M2 9l10-5 10 5-10 5Z M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5 M22 9v6',
    seta: 'M5 12h14 M13 6l6 6-6 6',
    calendario: 'M5 5h14v15H5Z M5 10h14 M9 3v4 M15 3v4',
  };
  U.icone = (nome, tam = 28, extra = '') => {
    const d = ICONES[nome]; if (!d) return '';
    return `<svg class="mk-ic ${extra}" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  };

  // ---------------------------------------------------------------- tema e arquivos
  function lerTema() {
    const cs = getComputedStyle(document.documentElement);
    const g = (k, pad) => (cs.getPropertyValue(k) || '').trim() || pad;
    return {
      fundo: g('--cor-fundo', '#141821'), superficie: g('--cor-superficie', '#1E2430'), texto: g('--cor-texto', '#F2ECE2'),
      suave: g('--cor-suave', '#A7ADB9'), linha: g('--cor-linha', '#2F3646'), destaque: g('--cor-destaque', '#CDAA6E'), apoio: g('--cor-apoio', '#8E7650'),
      fTitulo: g('--fonte-titulo', 'Georgia, serif'), fTexto: g('--fonte-texto', 'Arial, sans-serif'), fRotulo: g('--fonte-rotulo', 'Arial, sans-serif'),
      fNumeros: g('--fonte-numeros', 'Georgia, serif'), fLegenda: g('--fonte-legenda', 'Arial, sans-serif'),
    };
  }
  async function fontesProntas(limiteMs = 8000) {
    if (!document.fonts) return;
    const t = lerTema();
    const pedidos = [];
    for (const fam of [t.fTitulo, t.fNumeros]) for (const v of ['400', '500', '600', 'italic 500']) pedidos.push(`${v} 60px ${fam}`);
    for (const fam of [t.fTexto, t.fRotulo, t.fLegenda]) for (const v of ['400', '500', '600', '700', '800']) pedidos.push(`${v} 40px ${fam}`);
    const tudo = Promise.all(pedidos.map((f) => document.fonts.load(f, 'Aá0').catch(() => null))).then(() => document.fonts.ready);
    await Promise.race([tudo, new Promise((r) => setTimeout(r, limiteMs))]);
  }
  const cacheImg = new Map();
  function carregarImagem(src) {
    if (!cacheImg.has(src)) {
      cacheImg.set(src, new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()).then(() => res(i));
        i.onerror = () => rej(new Error('Imagem não encontrada: ' + src));
        i.src = src;
      }));
    }
    return cacheImg.get(src);
  }
  async function carregarJSON(url) {
    let r;
    try { r = await fetch(url, { cache: 'no-store' }); } catch (e) { throw new Error('Não consegui ler ' + url); }
    if (!r.ok) throw new Error('Arquivo não encontrado: ' + url);
    const txt = await r.text();
    try { return JSON.parse(txt); } catch (e) { throw new Error('Erro de digitação no arquivo ' + url + ': ' + e.message); }
  }
  function criarCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  // ---------------------------------------------------------------- layout padrão (Reels 1080x1920)
  const LAYOUT = {
    topoSeguro: 220, baseSegura: 380, margem: 60,
    cartao: { x: 40, y: 1010, w: 1000, h: 870, raio: 44 },
    zona: { x: 60, y: 236, w: 960, h: 700 }, // área do grafismo, acima do cartão e da legenda
  };

  // ---------------------------------------------------------------- Filme
  class Filme {
    constructor(o = {}) {
      this.largura = o.largura || W; this.altura = o.altura || H; this.fps = o.fps || 30; this.duracao = o.duracao || 10;
      this.base = o.base || '';
      this.palavras = (o.palavras || []).map((p) => ({ texto: String(p.texto ?? p.text ?? '').trim(), inicio: +p.inicio, fim: +p.fim }));
      this._norm = this.palavras.map((p) => U.norm(p.texto));
      this.layout = Object.assign({}, LAYOUT, o.layout || {});
      this.palco = (o.palco && document.querySelector(o.palco)) || document.getElementById('palco');
      if (!this.palco) { this.palco = el('div'); this.palco.id = 'palco'; document.body.appendChild(this.palco); }
      this.palco.classList.add('mk-palco');
      this.palco.style.width = this.largura + 'px'; this.palco.style.height = this.altura + 'px';
      this.camadas = {};
      for (const [nome, z] of [['fundo', 0], ['cena', 10], ['pessoa', 20], ['legenda', 30], ['sobre', 40]]) {
        const c = el('div', 'mk-camada mk-camada-' + nome); c.style.zIndex = z; this.palco.appendChild(c); this.camadas[nome] = c;
      }
      this.blocos = [];
      this.tema = lerTema();
      this.pessoa = null;
    }
    // "@palavra", "@palavra#2", "@palavra+0.3", "@setenta e dois", "fim:palavra" ou número em segundos
    tempo(v, rotulo = '') {
      if (v === undefined || v === null || v === '') return null;
      if (typeof v === 'number') return v;
      const s = String(v).trim();
      if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
      let m = s.match(/^(@|inicio:|início:|fim:)\s*(.+?)(?:#(\d+))?\s*([+-]\s*\d+(?:\.\d+)?)?$/i);
      if (!m) throw new Error(`Tempo inválido "${s}"${rotulo ? ' em ' + rotulo : ''}. Use segundos (ex.: 4.2) ou "@palavra".`);
      const fim = /^fim/i.test(m[1]);
      const alvo = U.norm(m[2]).split(' ').filter(Boolean);
      const ocorr = Number(m[3] || 1);
      const desloc = m[4] ? Number(m[4].replace(/\s/g, '')) : 0;
      let achou = 0;
      for (let i = 0; i + alvo.length <= this._norm.length; i++) {
        let ok = true;
        for (let k = 0; k < alvo.length; k++) if (this._norm[i + k] !== alvo[k]) { ok = false; break; }
        if (ok && ++achou === ocorr) return (fim ? this.palavras[i + alvo.length - 1].fim : this.palavras[i].inicio) + desloc;
      }
      throw new Error(`Não achei a palavra "${m[2]}"${ocorr > 1 ? ' (vez ' + ocorr + ')' : ''} na fala${rotulo ? ' (' + rotulo + ')' : ''}. Confira palavras.json.`);
    }
    adicionar(tipo, params = {}) {
      const Cls = REGISTRO[tipo];
      if (!Cls) throw new Error(`Bloco desconhecido: "${tipo}". Blocos: ${Object.keys(REGISTRO).join(', ')}.`);
      const b = new Cls(this, params, tipo);
      this.blocos.push(b);
      if (tipo === 'pessoa') this.pessoa = b;
      return b;
    }
    // para criar livre depois do montarDeRoteiro: já adiciona e prepara (carrega imagens etc.)
    async adicionarPronto(tipo, params = {}) { const b = this.adicionar(tipo, params); await b.preparar(); b.el.style.display = 'none'; return b; }
    url(rel) { if (!rel) return rel; if (/^(https?:|data:|\/)/.test(rel)) return rel; return this.base + rel; }
    async preparar() {
      await fontesProntas();
      for (const b of this.blocos) await b.preparar();
      for (const b of this.blocos) b.el.style.display = 'none';
    }
    async renderAt(t) {
      this.t = t;
      const pend = [];
      for (const b of this.blocos) { const r = b._desenhar(t); if (r && r.then) pend.push(r); }
      if (pend.length) await Promise.all(pend);
    }
    quadrosChave() {
      const l = [];
      for (const b of this.blocos) {
        if (['fundo', 'legenda', 'pessoa', 'cabecalho', 'faixa', 'selo'].includes(b.tipo)) continue;
        const d = b.fim - b.inicio; if (!(d > 0)) continue;
        l.push(+(b.inicio + Math.min(2.2, d * 0.7)).toFixed(2));
      }
      return [...new Set(l)].sort((a, b) => a - b);
    }
  }

  // ---------------------------------------------------------------- Bloco base
  class Bloco {
    constructor(filme, p, tipo, camada = 'cena') {
      this.f = filme; this.p = p || {}; this.tipo = tipo; this.t = filme.tema;
      const rot = `bloco ${tipo}`;
      this.inicio = filme.tempo(this.p.inicio ?? 0, rot) ?? 0;
      this.fim = filme.tempo(this.p.fim ?? filme.duracao, rot) ?? filme.duracao;
      if (this.fim > filme.duracao) this.fim = filme.duracao;
      this.entrada = this.p.entrada ?? 0.6;
      this.saida = this.p.saida ?? (this.fim >= filme.duracao - 0.01 ? 0 : 0.45);
      this.el = el('div', 'mk-bloco mk-b-' + tipo + (this.p.classe ? ' ' + this.p.classe : ''));
      this.el.style.display = 'none';
      if (this.p.opacidade != null) this.el.style.opacity = this.p.opacidade;
      (filme.camadas[this.p.camada || camada] || filme.camadas.cena).appendChild(this.el);
      this.visivel = false;
    }
    T(v, rot) { return this.f.tempo(v, rot || 'bloco ' + this.tipo); }
    async preparar() {}
    ativo(t) { return t >= this.inicio && t < this.fim; }
    _desenhar(t) {
      const a = this.ativo(t);
      if (a !== this.visivel) { this.el.style.display = a ? '' : 'none'; this.visivel = a; }
      if (!a) return null;
      const pin = this.entrada > 0 ? U.prog(t, this.inicio, this.inicio + this.entrada) : 1;
      const pout = this.saida > 0 ? U.prog(t, this.fim - this.saida, this.fim) : 0;
      return this.desenhar(t, { pin, pout, local: t - this.inicio, dur: this.fim - this.inicio, vis: U.ease.sai(pin) * (1 - U.ease.entra(pout)) });
    }
    desenhar() {}
    // entrada/saída padrão: sobe e aparece
    mover(e, p, pout, dy = 34, atraso = 0) {
      const q = U.ease.saiQuint(U.clamp(p - atraso));
      const o = q * (1 - U.ease.entra(pout));
      e.style.opacity = o.toFixed(3);
      e.style.transform = `translate3d(0,${((1 - q) * dy - U.ease.entra(pout) * dy * 0.4).toFixed(2)}px,0)`;
    }
  }
  const REGISTRO = {};
  function registrar(nome, Cls) { REGISTRO[nome] = Cls; }

  // ================================================================ fundo
  class Fundo extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'fundo');
      this.entrada = p.entrada ?? 0; this.saida = p.saida ?? 0;
      this.estilo = p.estilo || 'liso';
      const t = this.t;
      if (this.estilo === 'cidade') {
        this.cv = criarCanvas(W, H); this.cx = this.cv.getContext('2d'); this.el.appendChild(this.cv);
      } else {
        const luz = p.luz || U.mix(t.superficie, t.fundo, 0.15);
        this.el.style.background = `radial-gradient(120% 70% at 50% 18%, ${luz} 0%, ${t.fundo} 62%, ${U.mix(t.fundo, '#000', 0.35)} 100%)`;
        if (p.grade !== false) {
          const g = el('div', 'mk-fundo-grade'); this.el.appendChild(g);
          g.style.backgroundImage = `linear-gradient(${U.rgba(t.texto, 0.035)} 1px, transparent 1px), linear-gradient(90deg, ${U.rgba(t.texto, 0.035)} 1px, transparent 1px)`;
        }
      }
      const grao = el('div', 'mk-grao'); this.el.appendChild(grao); this.grao = grao;
    }
    async preparar() {
      // grão fixo (mesmo em todos os quadros)
      const c = criarCanvas(256, 256), x = c.getContext('2d'), d = x.createImageData(256, 256), r = U.aleatorio(11);
      for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      x.putImageData(d, 0, 0);
      this.grao.style.backgroundImage = `url(${c.toDataURL()})`;
      this.grao.style.opacity = this.p.grao ?? 0.05;
      if (this.estilo === 'cidade') this.prepararCidade();
    }
    prepararCidade() {
      const t = this.t, p = this.p;
      this.horizonte = p.horizonte ?? 960;
      const ceu = criarCanvas(W, H), c = ceu.getContext('2d');
      const g = c.createLinearGradient(0, 0, 0, this.horizonte);
      g.addColorStop(0, U.mix(t.fundo, '#05070b', 0.45)); g.addColorStop(0.55, U.mix(t.fundo, t.superficie, 0.5)); g.addColorStop(1, U.mix(t.superficie, '#6a6178', 0.32));
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      const brilho = c.createRadialGradient(W * 0.55, this.horizonte, 10, W * 0.55, this.horizonte, 700);
      brilho.addColorStop(0, U.rgba(t.destaque, 0.20)); brilho.addColorStop(1, U.rgba(t.destaque, 0));
      c.fillStyle = brilho; c.fillRect(0, 0, W, H);
      c.fillStyle = U.mix(t.fundo, '#000', 0.45); c.fillRect(0, this.horizonte, W, H - this.horizonte);
      this.ceu = ceu;
      const rnd = U.aleatorio(p.semente ?? 42);
      const camadas = [
        { alt: [130, 340], larg: [40, 95], cor: U.mix(t.fundo, '#5d6886', 0.36), janela: 0.16, jw: 2, jh: 3, fator: 0.2, nevoa: 0.6 },
        { alt: [150, 420], larg: [55, 120], cor: U.mix(t.fundo, '#3a4358', 0.5), janela: 0.22, jw: 3, jh: 4, fator: 0.45, nevoa: 0.36 },
        { alt: [170, 470], larg: [70, 150], cor: U.mix(t.fundo, '#252b3a', 0.55), janela: 0.28, jw: 4, jh: 5, fator: 0.7, nevoa: 0.14 },
        { alt: [100, 290], larg: [110, 210], cor: U.mix(t.fundo, '#0b0d13', 0.6), janela: 0.32, jw: 6, jh: 7, fator: 1, nevoa: 0.0 },
      ];
      this.camadasCidade = camadas.map((cm, k) => {
        const lw = W + 420, lh = 700, cv = criarCanvas(lw, lh), x = cv.getContext('2d');
        let px = -10;
        while (px < lw) {
          const w = cm.larg[0] + rnd() * (cm.larg[1] - cm.larg[0]);
          const h = cm.alt[0] + Math.pow(rnd(), 1.4) * (cm.alt[1] - cm.alt[0]);
          const y0 = lh - h;
          const gc = x.createLinearGradient(0, y0, 0, lh);
          gc.addColorStop(0, U.mix(cm.cor, '#8d8aa0', 0.10)); gc.addColorStop(1, cm.cor);
          x.fillStyle = gc; x.fillRect(px, y0, w, h);
          if (rnd() < 0.3) { const w2 = w * (0.4 + rnd() * 0.3); x.fillRect(px + (w - w2) / 2, y0 - h * 0.1, w2, h * 0.1 + 1); }
          const antena = rnd() < 0.22;
          if (antena) { x.fillStyle = cm.cor; x.fillRect(px + w * 0.5, y0 - 30 - rnd() * 40, 2, 72); }
          // janelas em faixas (andares), com variação de brilho
          const gx = cm.jw * 2.2, gy = cm.jh * 2.0;
          const quenteB = rnd() < 0.8;
          for (let yy = y0 + 8; yy < lh - 6; yy += gy) {
            const faixa = rnd() < 0.12 ? 2.2 : 1;
            for (let xx = px + 5; xx < px + w - 5 - cm.jw; xx += gx) {
              if (rnd() < cm.janela * faixa) {
                const quente = rnd() < (quenteB ? 0.85 : 0.35);
                x.fillStyle = quente ? `rgba(255,${185 + Math.floor(rnd() * 45)},${105 + Math.floor(rnd() * 60)},${0.4 + rnd() * 0.55})` : `rgba(200,218,240,${0.3 + rnd() * 0.4})`;
                x.fillRect(xx, yy, cm.jw, cm.jh);
              }
            }
          }
          if (k >= 2) { x.fillStyle = U.rgba(t.texto, 0.05); x.fillRect(px, y0, w, 2); x.fillStyle = 'rgba(255,255,255,0.03)'; x.fillRect(px + w - 3, y0, 3, h); }
          if (antena || rnd() < 0.06) { x.fillStyle = 'rgba(255,70,60,0.85)'; x.beginPath(); x.arc(px + w * 0.5 + 1, y0 - (antena ? 30 : 4), k >= 2 ? 2.2 : 1.4, 0, Math.PI * 2); x.fill(); }
          px += w + (rnd() * 16 - 9);
        }
        if (cm.nevoa > 0) {
          x.globalCompositeOperation = 'source-atop';
          const g2 = x.createLinearGradient(0, 0, 0, lh);
          g2.addColorStop(0, U.rgba(U.mix(t.superficie, '#6a6178', 0.3), cm.nevoa * 0.4)); g2.addColorStop(1, U.rgba(U.mix(t.superficie, '#6a6178', 0.3), cm.nevoa));
          x.fillStyle = g2; x.fillRect(0, 0, lw, lh); x.globalCompositeOperation = 'source-over';
        }
        return { cv, fator: cm.fator, k };
      });
      // brilho da cidade no horizonte
      const halo = criarCanvas(W, 400), hx = halo.getContext('2d');
      const gh = hx.createLinearGradient(0, 0, 0, 400); gh.addColorStop(0, 'rgba(255,190,120,0)'); gh.addColorStop(0.75, 'rgba(255,190,120,0.10)'); gh.addColorStop(1, 'rgba(255,190,120,0)');
      hx.fillStyle = gh; hx.fillRect(0, 0, W, 400);
      this.halo = halo;
      // luzes do chão
      const chao = criarCanvas(W, 700), x = chao.getContext('2d');
      for (let i = 0; i < 260; i++) {
        const prof = Math.pow(rnd(), 2); const y = 4 + prof * 680; const s = 0.6 + prof * 2.4;
        x.fillStyle = `rgba(255,${200 + Math.floor(rnd() * 40)},${130 + Math.floor(rnd() * 60)},${0.25 + rnd() * 0.5})`;
        x.beginPath(); x.arc(rnd() * W, y, s, 0, Math.PI * 2); x.fill();
      }
      this.chao = chao;
    }
    desenhar(t, v) {
      if (this.estilo !== 'cidade') return;
      const c = this.cx, p = this.p;
      const pr = U.ease.suave(U.prog(t, this.inicio, this.fim));
      const subida = (p.subida ?? 60) * pr, deriva = (p.deriva ?? 40) * pr;
      c.drawImage(this.ceu, 0, 0);
      c.drawImage(this.chao, 0, this.horizonte + subida * 1.2);
      for (const cm of this.camadasCidade) {
        c.drawImage(cm.cv, -210 - deriva * cm.fator, this.horizonte + subida * cm.fator - cm.cv.height + 2);
        if (cm.k === 1) c.drawImage(this.halo, 0, this.horizonte + subida * 0.5 - 400);
      }
      // véus para o texto respirar: no topo (cabeçalho) e à esquerda (números), a menos que p.veu === false
      if (p.veu !== false) {
        if (!this.veus) {
          const v1 = criarCanvas(W, H), x = v1.getContext('2d');
          const gt = x.createLinearGradient(0, 200, 0, 560); gt.addColorStop(0, U.rgba(this.t.fundo, 0.85)); gt.addColorStop(1, U.rgba(this.t.fundo, 0));
          x.fillStyle = gt; x.fillRect(0, 0, W, 560); x.fillStyle = U.rgba(this.t.fundo, 0.85); x.fillRect(0, 0, W, 200);
          const ge = x.createLinearGradient(0, 0, 640, 0); ge.addColorStop(0, U.rgba(this.t.fundo, 0.7)); ge.addColorStop(1, U.rgba(this.t.fundo, 0));
          x.fillStyle = ge; x.fillRect(0, 380, 640, 600);
          this.veus = v1;
        }
        c.drawImage(this.veus, 0, 0);
      }
    }
  }
  registrar('fundo', Fundo);

  // ================================================================ pessoa (cartão)
  class Pessoa extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'pessoa');
      this.entrada = 0; this.saida = 0;
      this.pasta = f.url((p.quadros || 'trabalho/pessoa').replace(/\/?$/, '/'));
      this.total = p.total || 1; this.fpsSrc = p.fps || f.fps;
      this.srcW = p.srcW || 1080; this.srcH = p.srcH || 1920;
      this.foco = p.foco || [0.5, 0.4];
      this.alvoY = p.alvoY ?? 0.45;
      this.zoom = p.zoom || 1;
      this.desloc = p.deslocamento || 0;
      this.trans = p.transicao ?? 0.75;
      this.cartao = Object.assign({}, f.layout.cartao, p.cartao || {});
      const modos = p.modos || [{ t: 0, modo: 'cheia' }, { t: 1.5, modo: 'cartao' }];
      this.modos = modos.map((m) => ({ t: this.T(m.t ?? m.inicio ?? 0, 'pessoa.modos'), modo: m.modo || 'cartao' })).sort((a, b) => a.t - b.t);
      this.caixa = el('div', 'mk-pessoa'); this.img = el('img'); this.img.alt = ''; this.caixa.appendChild(this.img);
      this.borda = el('div', 'mk-pessoa-borda');
      this.el.appendChild(this.caixa); this.el.appendChild(this.borda);
      this.src = '';
    }
    async preparar() { await this.trocar(1); }
    retModo(modo) {
      const c = this.cartao;
      if (modo === 'cheia') {
        const s = Math.max(W / this.srcW, H / this.srcH) * (this.p.zoomCheia || 1);
        const iw = this.srcW * s, ih = this.srcH * s;
        return { x: 0, y: 0, w: W, h: H, r: 0, ix: U.clamp(W / 2 - this.foco[0] * iw, W - iw, 0), iy: U.clamp(H * 0.5 - this.foco[1] * ih, H - ih, 0), iw, ih, o: 1 };
      }
      const s = Math.max(c.w / this.srcW, c.h / this.srcH) * this.zoom;
      const iw = this.srcW * s, ih = this.srcH * s;
      const ix = U.clamp(c.x + c.w / 2 - this.foco[0] * iw, c.x + c.w - iw, c.x);
      const iy = U.clamp(c.y + c.h * this.alvoY - this.foco[1] * ih, c.y + c.h - ih, c.y);
      const r = { x: c.x, y: c.y, w: c.w, h: c.h, r: c.raio, ix, iy, iw, ih, o: 1 };
      if (modo === 'oculta') { r.o = 0; r.y += 80; r.iy += 80; }
      return r;
    }
    // retângulo do cartão no instante t (a legenda usa para se posicionar)
    retangulo(t) {
      let i = 0; while (i + 1 < this.modos.length && this.modos[i + 1].t <= t) i++;
      const atual = this.modos[i];
      if (t < atual.t || i === 0) { const r = this.retModo(atual.modo); r.fracCartao = atual.modo === 'cheia' ? 0 : 1; return r; }
      const ant = this.modos[i - 1];
      const p = U.ease.suave(U.prog(t, atual.t, atual.t + this.trans));
      const a = this.retModo(ant.modo), b = this.retModo(atual.modo), r = {};
      for (const k of Object.keys(a)) r[k] = U.lerp(a[k], b[k], p);
      r.fracCartao = U.lerp(ant.modo === 'cheia' ? 0 : 1, atual.modo === 'cheia' ? 0 : 1, p);
      return r;
    }
    async trocar(n) {
      const src = this.pasta + String(n).padStart(6, '0') + '.jpg';
      if (src === this.src) return;
      this.src = src;
      this.img.src = src;
      try { await this.img.decode(); } catch (e) { if (n === 1) throw new Error('Não achei os quadros da pessoa em ' + this.pasta + ' (rode preparar-video.cjs).'); }
    }
    desenhar(t) {
      const r = this.retangulo(t);
      const s = this.caixa.style, b = this.borda.style;
      s.left = b.left = r.x.toFixed(2) + 'px'; s.top = b.top = r.y.toFixed(2) + 'px';
      s.width = b.width = r.w.toFixed(2) + 'px'; s.height = b.height = r.h.toFixed(2) + 'px';
      s.borderRadius = b.borderRadius = r.r.toFixed(2) + 'px';
      s.opacity = b.opacity = r.o.toFixed(3);
      b.opacity = (r.o * U.clamp(r.fracCartao)).toFixed(3);
      const is = this.img.style;
      is.left = (r.ix - r.x).toFixed(2) + 'px'; is.top = (r.iy - r.y).toFixed(2) + 'px'; is.width = r.iw.toFixed(2) + 'px'; is.height = r.ih.toFixed(2) + 'px';
      const n = Math.min(this.total, Math.max(1, Math.floor((t + this.desloc) * this.fpsSrc + 1e-6) + 1));
      return this.trocar(n);
    }
  }
  registrar('pessoa', Pessoa);

  // ================================================================ legenda falada
  class Legenda extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'legenda');
      this.entrada = 0; this.saida = 0;
      const corr = {};
      for (const [k, v] of Object.entries(p.correcoes || {})) corr[U.norm(k)] = v;
      const ocultar = new Set((p.ocultar || []).map(U.norm));
      const maxP = p.maxPalavras || 3, maxL = p.maxLetras || 22, pausa = p.pausa ?? 0.55;
      const pal = [];
      for (const w of f.palavras) {
        const n = U.norm(w.texto);
        if (!n && !/[\p{L}\p{N}]/u.test(w.texto)) { if (pal.length) pal[pal.length - 1].texto += w.texto.trim(); continue; }
        if (ocultar.has(n)) continue;
        let txt = w.texto;
        if (corr[n] !== undefined) { const pont = (w.texto.match(/[.,!?;:…]+$/) || [''])[0]; txt = corr[n] + pont; }
        if (!txt) continue;
        pal.push({ texto: txt, inicio: w.inicio, fim: w.fim });
      }
      const grupos = [];
      let g = null;
      for (const w of pal) {
        const len = g ? g.palavras.reduce((s, x) => s + x.texto.length + 1, 0) + w.texto.length : 0;
        const ult = g && g.palavras[g.palavras.length - 1];
        const quebra = !g || g.palavras.length >= maxP || len > maxL || (ult && /[.,!?;:…]$/.test(ult.texto)) || (ult && w.inicio - ult.fim > pausa);
        if (quebra) { g = { palavras: [] }; grupos.push(g); }
        g.palavras.push(w);
      }
      for (const gg of grupos) gg.inicio = gg.palavras[0].inicio;
      for (let i = 0; i < grupos.length; i++) {
        const gg = grupos[i];
        const ultimo = gg.palavras[gg.palavras.length - 1].fim;
        const prox = grupos[i + 1] ? grupos[i + 1].inicio : Infinity;
        gg.fim = Math.min(prox, ultimo + (p.segura ?? 0.7));
      }
      this.grupos = grupos;
      this.caixa = el('div', 'mk-legenda-caixa'); this.el.appendChild(this.caixa);
      if (p.tamanho) this.caixa.style.fontSize = p.tamanho + 'px';
      if (p.caixaAlta) this.caixa.style.textTransform = 'uppercase';
      this.atual = -1;
    }
    desenhar(t) {
      let gi = -1;
      for (let i = 0; i < this.grupos.length; i++) { const g = this.grupos[i]; if (t >= g.inicio && t < g.fim) { gi = i; break; } if (g.inicio > t) break; }
      if (gi !== this.atual) {
        this.atual = gi;
        this.caixa.innerHTML = gi < 0 ? '' : this.grupos[gi].palavras.map((w) => `<span class="mk-leg-p">${U.esc(w.texto)}</span>`).join(' ');
        this.spans = [...this.caixa.querySelectorAll('.mk-leg-p')];
      }
      if (gi < 0) return;
      const g = this.grupos[gi];
      g.palavras.forEach((w, i) => {
        const q = U.prog(t, w.inicio - 0.02, w.inicio + 0.12);
        const s = this.spans[i].style;
        s.opacity = q > 0 ? U.ease.sai(q).toFixed(3) : '0';
        s.transform = `translateY(${((1 - U.ease.sai(q)) * 10).toFixed(2)}px) scale(${(0.88 + 0.12 * U.ease.volta(q)).toFixed(4)})`;
      });
      // posição: logo acima do cartão; com a pessoa em tela cheia, no terço de baixo; sem pessoa (só locução), embaixo, acima da faixa do Instagram
      let y = this.p.y;
      if (y == null) {
        const pe = this.f.pessoa;
        if (pe) { const r = pe.retangulo(t); y = U.lerp(1290, r.y - 14, U.clamp(r.fracCartao)); } else y = 1500;
      }
      this.caixa.style.top = (y - this.caixa.offsetHeight).toFixed(1) + 'px';
    }
  }
  registrar('legenda', Legenda);

  // ================================================================ cabeçalho (rótulo + nome + selo)
  class Cabecalho extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'cena');
      const x = p.x ?? 60, y = p.y ?? 238;
      this.caixa = el('div', 'mk-cab');
      this.caixa.style.left = x + 'px'; this.caixa.style.top = y + 'px';
      this.rot = el('div', 'mk-cab-rot', U.esc(p.rotulo || ''));
      this.tit = el('div', 'mk-cab-tit', U.marcar(p.titulo || ''));
      this.caixa.appendChild(this.rot); this.caixa.appendChild(this.tit);
      this.el.appendChild(this.caixa);
      if (p.selo) { this.selo = el('div', 'mk-cab-selo', '<i></i>' + U.esc(p.selo)); this.selo.style.top = (y + 8) + 'px'; this.el.appendChild(this.selo); }
      if (p.direita) {
        const d = p.direita;
        this.dir = el('div', 'mk-cab-dir', `<b>${U.esc(d.valor ?? '')}</b>${d.unidade ? `<small>${U.esc(d.unidade)}</small>` : ''}${d.rotulo ? `<span>${U.esc(d.rotulo)}</span>` : ''}`);
        this.dir.style.top = (y + 52) + 'px';
        this.dirIni = this.T(d.inicio ?? this.inicio); this.dirFim = this.T(d.fim ?? this.fim);
        this.el.appendChild(this.dir);
      }
    }
    desenhar(t, v) {
      const q = U.ease.saiQuint(v.pin), o = 1 - U.ease.entra(v.pout);
      this.rot.style.opacity = (q * o).toFixed(3);
      this.rot.style.letterSpacing = (0.42 + (1 - q) * 0.25).toFixed(3) + 'em';
      this.mover(this.tit, v.pin, v.pout, 30, 0.1);
      if (this.selo) { this.selo.style.opacity = (U.ease.sai(U.clamp(v.pin * 1.4 - 0.4)) * o).toFixed(3); }
      if (this.dir) {
        const a = U.prog(t, this.dirIni, this.dirIni + 0.5), b = U.prog(t, this.dirFim - 0.4, this.dirFim);
        this.mover(this.dir, a, b, 20);
      }
    }
  }
  registrar('cabecalho', Cabecalho);

  // ================================================================ título de abertura
  class Titulo extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'cena');
      this.entrada = p.entrada ?? 1.2;
      const caixa = el('div', 'mk-tit'); caixa.style.top = (p.y ?? 300) + 'px';
      if (p.alinhamento === 'esquerda') caixa.classList.add('mk-tit-esq');
      if (p.icone) { this.ic = el('div', 'mk-tit-ic', U.icone(p.icone, p.tamanhoIcone || 86)); caixa.appendChild(this.ic); }
      if (p.antes) { this.antes = el('div', 'mk-tit-antes', U.marcar(p.antes)); caixa.appendChild(this.antes); }
      if (p.rotulo) { this.rot = el('div', 'mk-tit-rot', U.esc(p.rotulo)); caixa.appendChild(this.rot); }
      this.tit = el('div', 'mk-tit-nome'); if (p.tamanho) this.tit.style.fontSize = p.tamanho + 'px';
      if (p.caixaAlta) this.tit.classList.add('mk-tit-alta');
      // letra por letra, sem quebrar palavras
      const html = U.marcar(p.titulo || '');
      const tmp = el('div', null, html);
      let idx = 0;
      const partir = (no) => {
        if (no.nodeType === 3) {
          const frag = document.createDocumentFragment();
          no.textContent.split(/(\s+)/).forEach((pal) => {
            if (!pal) return;
            if (/^\s+$/.test(pal)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = el('span', 'mk-palavra');
            for (const ch of pal) { const s = el('span', 'mk-letra'); s.textContent = ch; s.dataset.i = idx++; w.appendChild(s); }
            frag.appendChild(w);
          });
          no.replaceWith(frag);
        } else [...no.childNodes].forEach(partir);
      };
      [...tmp.childNodes].forEach(partir);
      while (tmp.firstChild) this.tit.appendChild(tmp.firstChild);
      caixa.appendChild(this.tit);
      this.letras = [...this.tit.querySelectorAll('.mk-letra')];
      if (p.sub) { this.sub = el('div', 'mk-tit-sub', U.esc(p.sub)); caixa.appendChild(this.sub); }
      this.el.appendChild(caixa);
      this.path = this.ic && this.ic.querySelector('path');
    }
    desenhar(t, v) {
      const l = v.local, o = 1 - U.ease.entra(v.pout);
      if (this.path) {
        const len = 80; this.path.style.strokeDasharray = len; this.path.style.strokeDashoffset = (len * (1 - U.ease.suave(U.prog(l, 0, 1.1)))).toFixed(2);
        this.ic.style.opacity = (U.ease.sai(U.prog(l, 0, 0.3)) * o).toFixed(3);
      }
      if (this.antes) this.mover(this.antes, U.prog(l, 0.05, 0.65), v.pout, 20);
      if (this.rot) { const q = U.ease.saiQuint(U.prog(l, 0.15, 0.95)); this.rot.style.opacity = (q * o).toFixed(3); this.rot.style.letterSpacing = (0.5 + (1 - q) * 0.35).toFixed(3) + 'em'; }
      const n = this.letras.length, base = this.rot ? 0.3 : 0.15, passo = Math.min(0.045, 0.7 / Math.max(1, n));
      for (const s of this.letras) {
        const i = +s.dataset.i, q = U.ease.saiQuint(U.prog(l, base + i * passo, base + i * passo + 0.6));
        s.style.opacity = (q * o).toFixed(3);
        s.style.transform = `translateY(${((1 - q) * 0.42).toFixed(3)}em)`;
      }
      if (this.sub) { const q = U.ease.saiQuint(U.prog(l, base + n * passo + 0.1, base + n * passo + 0.8)); this.sub.style.opacity = (q * o).toFixed(3); this.sub.style.letterSpacing = (0.38 + (1 - q) * 0.2).toFixed(3) + 'em'; }
    }
  }
  registrar('titulo', Titulo);

  // ================================================================ número que conta
  class Numero extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'cena');
      this.caixa = el('div', 'mk-num');
      const al = p.alinhamento || 'esquerda';
      this.caixa.classList.add('mk-num-' + al);
      const x = p.x ?? 60, y = p.y ?? 430;
      if (al === 'direita') this.caixa.style.right = (W - x) + 'px'; else this.caixa.style.left = x + 'px';
      if (al === 'centro') { this.caixa.style.left = '0'; this.caixa.style.width = W + 'px'; }
      this.caixa.style.top = y + 'px';
      if (p.tamanho) this.caixa.style.fontSize = p.tamanho + 'px';
      this.l1 = el('div', 'mk-num-l1');
      this.l1.innerHTML = (p.prefixo ? `<span class="mk-num-pre">${U.esc(p.prefixo)}</span>` : '') + '<span class="mk-num-v"></span>' + (p.unidade ? `<span class="mk-num-un">${U.esc(p.unidade)}</span>` : '');
      this.v = this.l1.querySelector('.mk-num-v');
      this.caixa.appendChild(this.l1);
      if (p.linha !== false) { this.regua = el('div', 'mk-num-regua'); this.caixa.appendChild(this.regua); }
      if (p.rotulo) { this.rot = el('div', 'mk-num-rot', (p.icone ? U.icone(p.icone, 30) : '') + `<span>${U.esc(p.rotulo)}</span>`); this.caixa.appendChild(this.rot); }
      if (p.local) { this.loc = el('div', 'mk-num-loc', U.icone('pin', 28) + `<span>${U.esc(p.local)}</span>`); this.caixa.appendChild(this.loc); }
      this.el.appendChild(this.caixa);
      this.casas = p.casas || 0; this.dec = p.decimais || 0;
      this.contagem = p.contagem ?? 1.1;
      if (Array.isArray(p.marcos) && p.marcos.length) {
        this.marcos = p.marcos.map((m) => ({ t: this.T(m.t ?? m.inicio, 'numero.marcos'), valor: Number(m.valor) })).sort((a, b) => a.t - b.t);
      } else {
        const t0 = this.T(p.contarEm ?? this.inicio + (p.atraso ?? 0));
        this.marcos = [{ t: t0, valor: Number(p.valor ?? 0) }];
      }
      this.de = Number(p.de ?? 0);
      this.locIni = p.localEm != null ? this.T(p.localEm) : null;
    }
    valor(t) {
      let atual = this.de;
      for (const m of this.marcos) {
        if (t < m.t) break;
        const dur = Math.min(this.contagem, 0.35 + Math.abs(m.valor - atual) * 0.02 + 0.4);
        const q = U.ease.saiForte(U.prog(t, m.t, m.t + dur));
        atual = U.lerp(atual, m.valor, q);
      }
      return atual;
    }
    desenhar(t, v) {
      this.mover(this.l1, v.pin, v.pout, 40);
      const val = this.valor(t);
      let txt = this.dec ? U.fmtNum(val, this.dec) : U.fmtNum(Math.round(val), 0);
      if (this.casas && !this.dec) txt = String(Math.round(val)).padStart(this.casas, '0');
      this.v.textContent = txt;
      if (this.regua) { const q = U.ease.suave(U.prog(v.local, 0.2, 0.9)); this.regua.style.transform = `scaleX(${q.toFixed(4)})`; this.regua.style.opacity = (1 - U.ease.entra(v.pout)).toFixed(3); }
      if (this.rot) this.mover(this.rot, U.prog(v.local, 0.25, 0.95), v.pout, 16);
      if (this.loc) this.mover(this.loc, this.locIni != null ? U.prog(t, this.locIni, this.locIni + 0.6) : U.prog(v.local, 0.45, 1.1), v.pout, 16);
    }
  }
  registrar('numero', Numero);

  // ================================================================ planta (linha -> cor -> 3D isométrica)
  // Morfologia binária rápida (janela quadrada) com somas acumuladas
  function morf(m, w, h, r, dilatar) {
    const out = new Uint8Array(w * h), tmp = new Uint8Array(w * h), P = new Int32Array(Math.max(w, h) + 1);
    const passo = (src, dst, horizontal) => {
      const n = horizontal ? h : w, len = horizontal ? w : h;
      for (let a = 0; a < n; a++) {
        P[0] = 0;
        for (let b = 0; b < len; b++) P[b + 1] = P[b] + src[horizontal ? a * w + b : b * w + a];
        for (let b = 0; b < len; b++) {
          const i0 = Math.max(0, b - r), i1 = Math.min(len - 1, b + r);
          const s = P[i1 + 1] - P[i0];
          const v = dilatar ? (s > 0 ? 1 : 0) : (s === 2 * r + 1 ? 1 : 0);
          dst[horizontal ? a * w + b : b * w + a] = v;
        }
      }
    };
    passo(m, tmp, true); passo(tmp, out, false);
    return out;
  }
  class Planta extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'cena');
      this.cv = criarCanvas(W, H); this.cx = this.cv.getContext('2d'); this.el.appendChild(this.cv);
      this.of = criarCanvas(W, H); this.ox = this.of.getContext('2d');
      this.rotulos = el('div', 'mk-planta-rotulos'); this.el.appendChild(this.rotulos);
      const i = this.inicio;
      const fase = (k, a, b) => { const v = p[k]; return v ? [this.T(v[0]), this.T(v[1])] : [i + a, i + b]; };
      if (p.modo === 'pronta') { this.fL = [i - 1, i - 0.5]; this.fC = [i - 1, i - 0.5]; this.fE = [i - 1, i - 0.5]; }
      else { this.fL = fase('linha', 0.0, 1.3); this.fC = fase('cor', 1.1, 2.1); this.fE = fase('ergue', 1.5, 2.9); }
      this.giro = p.giro ?? 20; this.incl = p.inclinacao ?? 50;
      this.giro0 = p.giroInicial ?? 4; this.incl0 = p.inclinacaoInicial ?? 16;
      this.altParede = p.alturaParede ?? 0.06; this.esp = p.espessura ?? 0.035;
      const pose0 = { x: p.x ?? 710, y: p.y ?? 650, largura: p.largura ?? 560 };
      this.poses = [Object.assign({ t: -1 }, pose0)].concat((p.poses || []).map((q) => Object.assign({}, pose0, q, { t: this.T(q.t ?? q.inicio, 'planta.poses') }))).sort((a, b) => a.t - b.t);
      this.etiquetas = (p.etiquetas || []).map((e, k) => {
        const d = el('div', 'mk-etq mk-etq-planta', `<span class="mk-etq-n">${U.esc(e.nome || '')}</span>${e.area ? `<span class="mk-etq-v">${U.marcar(e.area)}</span>` : ''}`);
        const ponto = el('div', 'mk-etq-ponto');
        this.rotulos.appendChild(ponto); this.rotulos.appendChild(d);
        return { d, ponto, x: e.x ?? 0.5, y: e.y ?? 0.5, ini: e.inicio != null ? this.T(e.inicio, 'planta.etiquetas') : this.fE[1] + 0.2 + k * 0.45, fim: e.fim != null ? this.T(e.fim) : this.fim };
      });
    }
    async preparar() {
      if (!this.p.imagem) throw new Error('O bloco planta precisa de "imagem" (arquivo da planta na pasta da peça).');
      const img = await carregarImagem(this.f.url(this.p.imagem));
      this.processar(img);
    }
    processar(img) {
      const t = this.t, p = this.p;
      const nw = img.naturalWidth, nh = img.naturalHeight, mx = Math.max(nw, nh);
      const s = mx > 1100 ? 1100 / mx : (mx < 700 ? 700 / mx : 1);
      const w0 = Math.round(nw * s), h0 = Math.round(nh * s);
      const c0 = criarCanvas(w0, h0), x0 = c0.getContext('2d', { willReadFrequently: true });
      x0.drawImage(img, 0, 0, w0, h0);
      const d = x0.getImageData(0, 0, w0, h0).data, N = w0 * h0;
      const m0 = new Uint8Array(N), alfa = new Uint8Array(N);
      const lim = p.limiar ?? 85;
      for (let i = 0, j = 0; i < N; i++, j += 4) {
        const lum = 0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2];
        alfa[i] = d[j + 3] > 40 ? 1 : 0;
        m0[i] = d[j + 3] > 128 && lum < lim ? 1 : 0;
      }
      const r = Math.max(2, Math.round(Math.min(w0, h0) * (p.espessuraMinima ?? 0.0045)));
      let mask = p.paredes === false ? new Uint8Array(N) : morf(morf(m0, w0, h0, r, false), w0, h0, r, true);
      let cont = 0; for (let i = 0; i < N; i++) cont += mask[i];
      this.temParedes = cont > N * 0.004 && cont < N * 0.4;
      if (!this.temParedes) mask = new Uint8Array(N);
      // recorte: caixa das paredes (ou da parte não transparente)
      const ref = this.temParedes ? mask : alfa;
      let x1 = w0, y1 = h0, x2 = 0, y2 = 0;
      for (let y = 0; y < h0; y++) for (let x = 0; x < w0; x++) if (ref[y * w0 + x]) { if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y; }
      if (x2 <= x1) { x1 = 0; y1 = 0; x2 = w0 - 1; y2 = h0 - 1; }
      const pad = this.temParedes ? 1 : 0;
      x1 = Math.max(0, x1 - pad); y1 = Math.max(0, y1 - pad); x2 = Math.min(w0 - 1, x2 + pad); y2 = Math.min(h0 - 1, y2 + pad);
      const wp = x2 - x1 + 1, hp = y2 - y1 + 1;
      this.wp = wp; this.hp = hp;
      const mk = (fn) => { const c = criarCanvas(wp, hp), x = c.getContext('2d'); fn(c, x); return c; };
      this.cCor = mk((c, x) => x.drawImage(c0, x1, y1, wp, hp, 0, 0, wp, hp));
      const bandaR = Math.max(1, Math.round(Math.min(w0, h0) / 420));
      const ero = this.temParedes ? morf(mask, w0, h0, bandaR, false) : null;
      const tingir = (cor, fnAlfa) => mk((c, x) => {
        const id = x.createImageData(wp, hp), rgb = U.hexRgb(cor);
        for (let y = 0; y < hp; y++) for (let xx = 0; xx < wp; xx++) {
          const i = (y + y1) * w0 + (xx + x1), j = (y * wp + xx) * 4, a = fnAlfa(i);
          if (a) { id.data[j] = rgb[0]; id.data[j + 1] = rgb[1]; id.data[j + 2] = rgb[2]; id.data[j + 3] = a; }
        }
        x.putImageData(id, 0, 0);
      });
      const corParede = p.corParede || '#ECE7DF';
      this.cLado = tingir(U.mix(corParede, '#7d776e', 0.32), (i) => (mask[i] ? 255 : 0));
      this.cTopo = tingir(corParede, (i) => (mask[i] ? 255 : 0));
      this.cAresta = this.temParedes ? tingir('#6f695f', (i) => (mask[i] && !ero[i] ? 200 : 0)) : null;
      // desenho em linha (fase 1): contorno das paredes forte + traços finos da planta fracos
      const corLinha = p.corLinha || t.texto;
      // bordas de móveis e pisos (contraste local) entram fracas, como num desenho técnico
      const lumA = new Float32Array(N);
      for (let i = 0, j = 0; i < N; i++, j += 4) lumA[i] = 0.2126 * d[j] + 0.7152 * d[j + 1] + 0.0722 * d[j + 2];
      const borda = new Uint8Array(N);
      const limB = p.limiarBorda ?? 26;
      for (let y = 1; y < h0 - 1; y++) for (let x = 1; x < w0 - 1; x++) {
        const i = y * w0 + x;
        const g = Math.abs(lumA[i + 1] - lumA[i - 1]) + Math.abs(lumA[i + w0] - lumA[i - w0]);
        if (g > limB && alfa[i]) borda[i] = Math.min(255, (g - limB) * 3);
      }
      this.cLinha = tingir(corLinha, (i) => (this.temParedes && mask[i] && !ero[i] ? 255 : (m0[i] && !mask[i] ? 110 : (!this.temParedes && m0[i] ? 220 : (mask[i] ? 0 : Math.min(80, borda[i] >> 1))))));
      // sombra de contato das paredes no piso
      if (this.temParedes) {
        const sb = tingir('#000000', (i) => (mask[i] ? 255 : 0));
        this.cSombra = mk((c, x) => { x.filter = `blur(${Math.round(r * 2.2)}px)`; x.drawImage(sb, 0, 0); });
      }
      this.corPlaca = p.corPlaca || U.mix(t.superficie, '#2f3f62', 0.55);
    }
    pose(t) {
      let i = 0; while (i + 1 < this.poses.length && this.poses[i + 1].t <= t) i++;
      const a = this.poses[Math.max(0, i - 1)], b = this.poses[i];
      if (i === 0) return b;
      const q = U.ease.suave(U.prog(t, b.t, b.t + (this.p.transicaoPose ?? 0.9)));
      return { x: U.lerp(a.x, b.x, q), y: U.lerp(a.y, b.y, q), largura: U.lerp(a.largura, b.largura, q) };
    }
    desenhar(t, v) {
      const c = this.cx, wp = this.wp, hp = this.hp;
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.clearRect(0, 0, W, H);
      const ps = this.pose(t);
      const pl = U.ease.suave(U.prog(t, this.fL[0], this.fL[1]));
      const pc = U.ease.suave(U.prog(t, this.fC[0], this.fC[1]));
      const pe = U.ease.suave(U.prog(t, this.fE[0], this.fE[1]));
      // desenha opaco e esmaece o canvas inteiro (as camadas não escurecem umas pelas outras na entrada/saída)
      this.cv.style.opacity = v.vis.toFixed(3);
      if (v.vis <= 0.001) return;
      const vis = 1;
      const deriva = (this.p.deriva ?? 1.5) * U.prog(t, this.inicio, this.fim);
      const th = U.rad(U.lerp(this.giro0, this.giro, pe) + deriva), ph = U.rad(U.lerp(this.incl0, this.incl, pe));
      const sy = Math.cos(ph), hz = Math.sin(ph);
      const s = (ps.largura / wp) * (0.94 + 0.06 * U.ease.sai(v.pin));
      const a = s * Math.cos(th), b = s * sy * Math.sin(th), cc = -s * Math.sin(th), d = s * sy * Math.cos(th);
      const zP = this.altParede * wp * pe, T = this.esp * wp * (0.35 + 0.65 * pe);
      const e = ps.x - (a * wp / 2 + cc * hp / 2), f = ps.y - (b * wp / 2 + d * hp / 2) + (zP * s * hz) * 0.35;
      const proj = (u, vv, z = 0) => [a * u + cc * vv + e, b * u + d * vv + f - z * s * hz];
      c.globalAlpha = vis;
      // laje: sombra, laterais e tampo
      const cant = [[0, 0], [wp, 0], [wp, hp], [0, hp]];
      const topo = cant.map(([u, w]) => proj(u, w, 0)), baixo = cant.map(([u, w]) => proj(u, w, -T));
      c.save();
      c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 60; c.shadowOffsetY = 34;
      c.fillStyle = U.mix(this.t.fundo, '#000', 0.4);
      c.beginPath(); baixo.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill();
      c.restore();
      const corLado = U.mix(this.corPlaca, '#ffffff', 0.12 + 0.55 * pc);
      for (let k = 0; k < 4; k++) {
        const k2 = (k + 1) % 4;
        const nx = topo[k2][1] - topo[k][1], ny = -(topo[k2][0] - topo[k][0]);
        const luz = U.clamp(0.55 + 0.35 * (nx / Math.hypot(nx, ny || 1)));
        c.fillStyle = U.mix(corLado, '#000', 0.55 - luz * 0.45);
        c.beginPath(); c.moveTo(...topo[k]); c.lineTo(...topo[k2]); c.lineTo(...baixo[k2]); c.lineTo(...baixo[k]); c.closePath(); c.fill();
      }
      c.setTransform(a, b, cc, d, e, f);
      c.fillStyle = this.corPlaca; c.fillRect(0, 0, wp, hp);
      // fase linha: varredura de cima para baixo
      const aLinha = vis * (1 - 0.85 * pc);
      if (aLinha > 0.01 && pl > 0) {
        c.save(); c.beginPath(); c.rect(0, 0, wp, hp * pl); c.clip();
        c.globalAlpha = aLinha; c.drawImage(this.cLinha, 0, 0); c.restore();
        if (pl < 1) {
          const yv = hp * pl, g = c.createLinearGradient(0, yv - 26, 0, yv + 4);
          g.addColorStop(0, U.rgba(this.t.destaque, 0)); g.addColorStop(0.85, U.rgba(this.t.destaque, 0.55)); g.addColorStop(1, U.rgba(this.t.destaque, 0));
          c.globalAlpha = vis; c.fillStyle = g; c.fillRect(0, yv - 26, wp, 30);
        }
      }
      if (pc > 0) { c.globalAlpha = vis * pc; c.drawImage(this.cCor, 0, 0); }
      if (this.cSombra && pe > 0) { c.globalAlpha = vis * 0.42 * pe; c.drawImage(this.cSombra, 0, 0); }
      c.globalAlpha = vis * (0.35 + 0.4 * (1 - pc));
      c.strokeStyle = U.rgba(this.t.texto, 0.6); c.lineWidth = 1.4 / s; c.strokeRect(0, 0, wp, hp);
      // paredes levantando (fatias empilhadas)
      if (this.temParedes && pe > 0.002) {
        const Hs = zP * s * hz;
        const xs = topo.map((q) => q[0]), ys = topo.map((q) => q[1]);
        const bx = Math.max(0, Math.floor(Math.min(...xs)) - 4), by = Math.max(0, Math.floor(Math.min(...ys) - Hs) - 4);
        const bw = Math.min(W, Math.ceil(Math.max(...xs)) + 4) - bx, bh = Math.min(H, Math.ceil(Math.max(...ys)) + 4) - by;
        const o = this.ox;
        o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, W, H);
        o.setTransform(a, b, cc, d, e, f); o.drawImage(this.cLado, 0, 0);
        c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = vis * U.clamp(pe * 3);
        const nF = Math.max(2, Math.ceil(Hs / 1.1));
        for (let k = 1; k <= nF; k++) { const dy = (Hs * k) / nF; c.drawImage(this.of, bx, by, bw, bh, bx, by - dy, bw, bh); }
        c.setTransform(a, b, cc, d, e, f - Hs);
        c.drawImage(this.cTopo, 0, 0);
        if (this.cAresta) { c.globalAlpha = vis * 0.8 * U.clamp(pe * 3); c.drawImage(this.cAresta, 0, 0); }
      }
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
      // etiquetas de cômodo
      const o2 = 1 - U.ease.entra(v.pout);
      for (const et of this.etiquetas) {
        const q = U.prog(t, et.ini, et.ini + 0.45), qo = U.prog(t, et.fim - 0.35, et.fim);
        const al = U.ease.sai(q) * (1 - U.ease.entra(qo)) * o2;
        et.d.style.display = et.ponto.style.display = al > 0.001 ? '' : 'none';
        if (al <= 0.001) continue;
        const [px, py] = proj(et.x * wp, et.y * hp, this.altParede * wp * pe * 0.5);
        et.ponto.style.transform = `translate(${(px - 6).toFixed(1)}px,${(py - 6).toFixed(1)}px) scale(${(0.4 + 0.6 * U.ease.volta(q)).toFixed(3)})`;
        et.ponto.style.opacity = al.toFixed(3);
        et.d.style.transform = `translate(-50%, -100%) translate(${px.toFixed(1)}px,${(py - 16 - 10 * (1 - U.ease.sai(q))).toFixed(1)}px) scale(${(0.86 + 0.14 * U.ease.volta(q)).toFixed(3)})`;
        et.d.style.opacity = al.toFixed(3);
      }
    }
  }
  registrar('planta', Planta);

  // ================================================================ prédio subindo
  class Predio extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'cena');
      this.cv = criarCanvas(W, H); this.cx = this.cv.getContext('2d'); this.el.appendChild(this.cv);
      this.andares = p.andares || 18;
      this.x = p.x ?? 760; this.base = p.base ?? 935; this.topoMin = p.topo ?? 300;
      this.larg = p.largura ?? 230; this.prof = p.profundidade ?? 120;
      this.fh = (this.base - this.topoMin - 40) / this.andares;
      this.contagem = p.contagem ?? 0.9;
      if (Array.isArray(p.marcos) && p.marcos.length) this.marcos = p.marcos.map((m) => ({ t: this.T(m.t ?? m.inicio, 'predio.marcos'), andar: Number(m.andar ?? m.valor) })).sort((a, b) => a.t - b.t);
      else this.marcos = [{ t: this.inicio + 0.3, andar: this.andares, dur: Math.max(1.2, (this.fim - this.inicio) * 0.55) }];
      const rnd = U.aleatorio(p.semente ?? 7);
      this.janelas = [];
      for (let a = 0; a < this.andares; a++) { const l = []; for (let k = 0; k < 12; k++) { const r = rnd(); l.push(r < (p.acesas ?? 0.62) ? 0.55 + rnd() * 0.45 : 0); } this.janelas.push(l); }
    }
    contar(t) {
      let atual = 0;
      for (const m of this.marcos) {
        if (t < m.t) break;
        const dur = m.dur || Math.max(0.5, Math.min(this.contagem * 1.6, Math.abs(m.andar - atual) * 0.08 + 0.3));
        atual = U.lerp(atual, m.andar, U.ease.sai(U.prog(t, m.t, m.t + dur)));
      }
      return atual;
    }
    desenhar(t, v) {
      const c = this.cx, tm = this.t;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
      this.cv.style.opacity = v.vis.toFixed(3);
      v = Object.assign({}, v, { vis: 1 });
      c.globalAlpha = 1;
      const n = this.contar(t), cheio = Math.floor(n + 1e-6), frac = n - cheio;
      const L = this.larg, P = this.prof, x0 = this.x - L / 2, fh = this.fh;
      const dx = P * 0.62, dy = P * 0.36; // lateral recuando para a direita e para cima
      const yb = this.base;
      // sombra e base
      c.save(); const gs = c.createRadialGradient(this.x + dx * 0.5, yb + 6, 10, this.x + dx * 0.5, yb + 6, L * 1.1);
      gs.addColorStop(0, 'rgba(0,0,0,0.55)'); gs.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gs; c.fillRect(this.x - L * 1.2, yb - 40, L * 2.6, 90); c.restore();
      c.fillStyle = U.mix(tm.fundo, '#000', 0.2);
      c.beginPath(); c.moveTo(x0 - 26, yb + 8); c.lineTo(x0 + L + 26, yb + 8); c.lineTo(x0 + L + 26 + dx, yb + 8 - dy); c.lineTo(x0 - 26 + dx, yb + 8 - dy); c.closePath(); c.fill();
      // fantasma (estrutura que ainda vai subir)
      const alturaTotal = this.andares * fh;
      const fant = (1 - U.prog(n, this.andares - 0.5, this.andares)) * U.ease.sai(U.prog(v.local, 0, 0.6));
      if (fant > 0.01) {
        c.save(); c.globalAlpha = v.vis * 0.35 * fant; c.strokeStyle = tm.texto; c.lineWidth = 1;
        c.strokeRect(x0 + 0.5, yb - alturaTotal + 0.5, L, alturaTotal);
        c.beginPath(); c.moveTo(x0 + L, yb - alturaTotal); c.lineTo(x0 + L + dx, yb - alturaTotal - dy); c.lineTo(x0 + L + dx, yb - dy); c.moveTo(x0, yb - alturaTotal); c.lineTo(x0 + dx, yb - alturaTotal - dy); c.lineTo(x0 + L + dx, yb - alturaTotal - dy);
        for (let a = 1; a < this.andares; a++) { const y = yb - a * fh; c.moveTo(x0, y); c.lineTo(x0 + L, y); c.lineTo(x0 + L + dx, y - dy); }
        c.stroke(); c.restore();
      }
      const corLaje = U.mix('#e9e3d8', tm.fundo, 0.12), corLajeLado = U.mix('#e9e3d8', tm.fundo, 0.45);
      const vidro = U.mix(tm.fundo, '#2b3446', 0.6), vidroLado = U.mix(tm.fundo, '#1c2230', 0.6);
      const quad = (pts) => { c.beginPath(); pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); };
      const desenharAndar = (a, al, desl) => {
        const yB = yb - a * fh + desl, yT = yB - fh;
        c.globalAlpha = v.vis * al;
        const laje = Math.max(3, fh * 0.17), guarda = fh * 0.3;
        // frente: vidro com reflexo + janelas
        const gv = c.createLinearGradient(0, yT, 0, yB); gv.addColorStop(0, U.mix(vidro, '#000', 0.25)); gv.addColorStop(1, U.mix(vidro, '#7c8aa6', 0.12));
        c.fillStyle = gv; c.fillRect(x0, yT, L, fh);
        const cols = 6, cw = L / cols, hJ = fh - laje - 3;
        for (let k = 0; k < cols; k++) {
          const luz = this.janelas[a][k], xj = x0 + k * cw + 1.5, wj = cw - 3, yj = yT + 2;
          if (luz) {
            const g = c.createLinearGradient(0, yj, 0, yj + hJ);
            g.addColorStop(0, `rgba(255,224,170,${0.98 * luz})`); g.addColorStop(0.7, `rgba(236,170,96,${0.92 * luz})`); g.addColorStop(1, `rgba(170,105,55,${0.9 * luz})`);
            c.fillStyle = g; c.fillRect(xj, yj, wj, hJ);
            if ((a * 7 + k * 3) % 5 === 0) { c.fillStyle = `rgba(60,38,24,${0.35 * luz})`; c.fillRect(xj + wj * 0.55, yj + hJ * 0.45, wj * 0.3, hJ * 0.55); }
          } else {
            const g = c.createLinearGradient(xj, yj, xj + wj, yj + hJ);
            g.addColorStop(0, U.mix(vidro, '#8a98b4', 0.22)); g.addColorStop(1, U.mix(vidro, '#000', 0.2));
            c.fillStyle = g; c.fillRect(xj, yj, wj, hJ);
          }
        }
        // guarda-corpo de vidro e laje da varanda
        c.fillStyle = 'rgba(205,220,235,0.10)'; c.fillRect(x0 - 4, yB - laje - guarda, L + 8, guarda);
        c.fillStyle = 'rgba(235,240,245,0.35)'; c.fillRect(x0 - 4, yB - laje - guarda, L + 8, 1);
        c.fillStyle = corLaje; c.fillRect(x0 - 4, yB - laje, L + 8, laje);
        c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(x0 - 4, yB - laje, L + 8, 1);
        // lateral
        c.fillStyle = vidroLado;
        quad([[x0 + L, yT], [x0 + L + dx, yT - dy], [x0 + L + dx, yB - dy], [x0 + L, yB]]);
        const cl = 3;
        for (let k = 0; k < cl; k++) {
          const luz = this.janelas[a][6 + k];
          const u0 = (k + 0.1) / cl, u1 = (k + 0.9) / cl;
          c.fillStyle = luz ? `rgba(228,165,95,${0.62 * luz})` : U.mix(vidroLado, '#56627c', 0.18);
          quad([[x0 + L + dx * u0, yT + 2 - dy * u0], [x0 + L + dx * u1, yT + 2 - dy * u1], [x0 + L + dx * u1, yB - laje - 1 - dy * u1], [x0 + L + dx * u0, yB - laje - 1 - dy * u0]]);
        }
        c.fillStyle = corLajeLado;
        quad([[x0 + L + 4, yB - laje], [x0 + L + 4 + dx, yB - laje - dy], [x0 + L + 4 + dx, yB - dy], [x0 + L + 4, yB]]);
        // pilares de canto
        c.fillStyle = U.mix(corLaje, tm.fundo, 0.25); c.fillRect(x0 - 2, yT, 5, fh); c.fillRect(x0 + L - 3, yT, 5, fh);
      };
      for (let a = 0; a < Math.min(cheio, this.andares); a++) desenharAndar(a, 1, 0);
      if (cheio < this.andares && frac > 0.01) desenharAndar(cheio, U.ease.sai(frac), -(1 - U.ease.sai(frac)) * fh * 0.9);
      // cobertura quando completo
      const yTopo = yb - Math.min(n, this.andares) * fh;
      c.globalAlpha = v.vis;
      if (n > 0.5) {
        c.fillStyle = U.mix('#e9e3d8', tm.fundo, 0.25);
        c.beginPath(); c.moveTo(x0 - 3, yTopo); c.lineTo(x0 + L + 3, yTopo); c.lineTo(x0 + L + 3 + dx, yTopo - dy); c.lineTo(x0 - 3 + dx, yTopo - dy); c.closePath(); c.fill();
        // linha de luz no topo enquanto sobe
        const brilho = (1 - U.prog(n, this.andares - 0.3, this.andares)) * 0.9;
        if (brilho > 0.02) {
          c.save(); c.globalAlpha = v.vis * brilho; c.strokeStyle = tm.destaque; c.lineWidth = 2; c.shadowColor = tm.destaque; c.shadowBlur = 18;
          c.beginPath(); c.moveTo(x0 - 40, yTopo); c.lineTo(x0 + L, yTopo); c.lineTo(x0 + L + dx, yTopo - dy); c.lineTo(x0 + L + dx + 40, yTopo - dy); c.stroke(); c.restore();
        }
      }
      if (n >= this.andares - 0.02 && this.p.coroa !== false) {
        const q = U.ease.sai(U.prog(n, this.andares - 0.02, this.andares));
        c.globalAlpha = v.vis * q; c.fillStyle = U.rgba(tm.destaque, 0.9); c.fillRect(x0 + L * 0.1, yTopo - 6, L * 0.8, 3);
      }
      // árvores na base
      c.globalAlpha = v.vis;
      const arv = [[-56, 10, 26], [-20, 18, 18], [L + 30, 14, 22], [L + 62, 4, 16]];
      for (const [ox, oy, r] of arv) {
        const g = c.createRadialGradient(x0 + ox - r * 0.3, yb + oy - r * 0.4, 2, x0 + ox, yb + oy, r);
        g.addColorStop(0, U.mix('#3f5a45', '#ffffff', 0.08)); g.addColorStop(1, U.mix('#1c2a21', tm.fundo, 0.3));
        c.fillStyle = g; c.beginPath(); c.arc(x0 + ox, yb + oy - r * 0.5, r, 0, Math.PI * 2); c.fill();
      }
      c.globalAlpha = 1;
    }
  }
  registrar('predio', Predio);

  // ================================================================ mapa estilizado com rota
  class Mapa extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'fundo'); // o mapa é um fundo: o cabeçalho e as etiquetas ficam por cima
      this.cv = criarCanvas(W, H); this.cx = this.cv.getContext('2d'); this.el.appendChild(this.cv);
      this.cel = p.celula ?? 190; this.giro = U.rad(p.giro ?? -9);
      this.zoom = p.zoom || [1, 1.1];
      this.centro = p.centro || [690, 660];
      this.ruas = (p.ruas || []).map((r) => ({ nome: r.nome || '', eixo: r.eixo === 'v' ? 'v' : 'h', em: Number(r.em ?? 0), larga: r.larga !== false, rotuloEm: r.rotuloEm }));
      this.pin = p.pin || [1.5, 2.5];
      this.dest = p.destino ? Object.assign({ icone: 'metro', nome: '' }, p.destino) : null;
      if (this.dest && !this.dest.em) this.dest.em = [4, 0];
      this.rota = p.rota || (this.dest ? this.rotaAuto(this.pin, this.dest.em) : []);
      const i = this.inicio;
      this.tPin = this.T(p.pinEm ?? i + 0.25);
      this.tRota = p.rotaEm ? [this.T(p.rotaEm[0]), this.T(p.rotaEm[1])] : [i + 0.9, i + 2.4];
      this.foco = p.foco || (this.dest ? [(this.pin[0] + this.dest.em[0]) / 2, (this.pin[1] + this.dest.em[1]) / 2] : this.pin);
      const rnd = U.aleatorio(p.semente ?? 3);
      this.quadras = [];
      for (let qx = -7; qx <= 12; qx++) for (let qy = -9; qy <= 13; qy++) {
        const tipoQ = rnd() < 0.06 ? 'parque' : (rnd() < 0.04 ? 'praca' : 'lotes');
        const lotes = [];
        const nx = 1 + Math.floor(rnd() * 3), ny = 1 + Math.floor(rnd() * 2);
        for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) lotes.push({ a, b, nx, ny, tom: rnd() });
        this.quadras.push({ qx, qy, tipo: tipoQ, lotes });
      }
      if (p.tempo) {
        this.num = new Numero(f, Object.assign({ inicio: this.inicio, fim: this.fim, entrada: this.entrada, saida: this.saida, x: 60, y: 430, linha: true, contarEm: this.inicio + 0.15, contagem: 1.0 },
          typeof p.tempo === 'object' ? p.tempo : { valor: p.tempo }), 'numero');
        f.camadas.cena.removeChild(this.num.el);
        this.el.appendChild(this.num.el);
        this.num.el.style.display = '';
      }
      this.paths = Object.fromEntries(Object.entries(ICONES).map(([k, d]) => [k, new Path2D(d)]));
      // enquadramento: desloca o centro para que pin, rota e destino caibam à direita do texto e dentro da tela
      const pts = [this.pin].concat(this.rota).concat(this.dest ? [this.dest.em] : []);
      const caixa = Object.assign({ x1: 440, x2: W - 200, y1: 540, y2: 800 }, p.enquadrar || {});
      if (p.enquadrar !== false) {
        let sc = this.projetor(this.zoom[1], this.centro);
        let sx = pts.map((q) => sc(...q)[0]), syy = pts.map((q) => sc(...q)[1]);
        const fator = Math.min(1, (caixa.x2 - caixa.x1) / Math.max(1, Math.max(...sx) - Math.min(...sx)), (caixa.y2 - caixa.y1) / Math.max(1, Math.max(...syy) - Math.min(...syy)));
        if (fator < 1) {
          this.cel *= Math.max(0.55, fator);
          sc = this.projetor(this.zoom[1], this.centro);
          sx = pts.map((q) => sc(...q)[0]); syy = pts.map((q) => sc(...q)[1]);
        }
        let dx = 0, dy = 0;
        if (Math.max(...sx) > caixa.x2) dx = caixa.x2 - Math.max(...sx);
        if (Math.min(...sx) + dx < caixa.x1) dx = caixa.x1 - Math.min(...sx);
        if (Math.max(...syy) > caixa.y2) dy = caixa.y2 - Math.max(...syy);
        if (Math.min(...syy) + dy < caixa.y1) dy = caixa.y1 - Math.min(...syy);
        this.centro = [this.centro[0] + dx, this.centro[1] + dy];
      }
      // nome de cada rua no trecho visível mais longe da rota (para a linha não passar por cima)
      const sc0 = this.projetor(this.zoom[0], this.centro);
      for (const r of this.ruas) {
        if (r.rotuloEm != null) continue;
        let melhor = null, nota = -1;
        const base = r.eixo === 'h' ? this.foco[0] : this.foco[1];
        for (let k = -4; k <= 4; k += 0.25) {
          const pos = base + k, ponto = r.eixo === 'h' ? [pos, r.em] : [r.em, pos];
          const [x, y] = sc0(...ponto);
          if (x < 170 || x > W - 170 || y < 420 || y > 900) continue;
          if (this.p.tempo && x < 560 && y > 380 && y < 780) continue; // não passa por cima do "5 min"
          // distância do nome inteiro (não só do centro) até a rota, o pin e o destino
          const meio = r.nome.length * 0.042 + 0.12;
          let dmin = 99;
          for (const s of [-1, -0.5, 0, 0.5, 1]) {
            const pp = r.eixo === 'h' ? [ponto[0] + s * meio, ponto[1]] : [ponto[0], ponto[1] + s * meio];
            for (const q of pts) dmin = Math.min(dmin, Math.hypot(q[0] - pp[0], q[1] - pp[1]));
            for (let a = 1; a < this.rota.length; a++) {
              const [x1, y1] = this.rota[a - 1], [x2, y2] = this.rota[a];
              const L2 = (x2 - x1) ** 2 + (y2 - y1) ** 2 || 1, tt = U.clamp(((pp[0] - x1) * (x2 - x1) + (pp[1] - y1) * (y2 - y1)) / L2);
              dmin = Math.min(dmin, Math.hypot(pp[0] - (x1 + tt * (x2 - x1)), pp[1] - (y1 + tt * (y2 - y1))));
            }
          }
          const n = Math.min(dmin, 1.6) - Math.abs(k) * 0.05;
          if (n > nota) { nota = n; melhor = pos; r._dmin = dmin; }
        }
        r.rotuloEm = melhor ?? base;
        // a rota usa esta rua: o nome vai ao lado da rua, do lado mais longe da linha
        if (r.desvio == null && (r._dmin ?? 9) < 0.35) {
          const lado = (sgn) => { const q = r.eixo === 'h' ? [r.rotuloEm, r.em + sgn * 0.3] : [r.em + sgn * 0.3, r.rotuloEm]; return Math.min(...this.rota.map((o) => Math.hypot(o[0] - q[0], o[1] - q[1]))); };
          r.desvio = lado(-1) >= lado(1) ? -0.29 : 0.29;
        }
      }
    }
    projetor(z, centro) {
      const k = this.cel * z, cs = Math.cos(this.giro), sn = Math.sin(this.giro), [fx, fy] = this.foco;
      return (x, y) => [centro[0] + k * (cs * (x - fx) - sn * (y - fy)), centro[1] + k * (sn * (x - fx) + cs * (y - fy))];
    }
    rotaAuto(a, b) {
      const sy = Math.round(a[1] + 0.5);
      return [[a[0], a[1]], [a[0], sy], [Math.round(b[0]), sy], [Math.round(b[0]), b[1]], [b[0], b[1]]];
    }
    larguraRua(eixo, k) { const r = this.ruas.find((x) => x.eixo === eixo && x.em === k); return r && r.larga ? 0.27 : 0.15; }
    desenhar(t, v) {
      const c = this.cx, tm = this.t, cel = this.cel;
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
      const z = U.lerp(this.zoom[0], this.zoom[1], U.ease.suave(U.prog(t, this.inicio, this.fim))) * (0.96 + 0.04 * U.ease.sai(v.pin));
      const k = cel * z, cs = Math.cos(this.giro), sn = Math.sin(this.giro);
      const [cxS, cyS] = this.centro, [fx, fy] = this.foco;
      const M = [k * cs, k * sn, -k * sn, k * cs, cxS - k * (cs * fx - sn * fy), cyS - k * (sn * fx + cs * fy)];
      const P = (x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
      const rua = U.mix(tm.fundo, '#05070b', 0.35), quad = U.mix(tm.superficie, '#43517a', 0.36);
      c.fillStyle = rua; c.fillRect(0, 0, W, H);
      // o mapa é opaco: entra e sai esmaecendo o canvas inteiro (dissolve sobre a cena anterior, sem "pulo")
      this.cv.style.opacity = v.vis.toFixed(3);
      const vNum = v;
      v = Object.assign({}, v, { vis: 1 });
      c.globalAlpha = 1;
      c.setTransform(...M);
      for (const q of this.quadras) {
        const [sx, sy2] = P(q.qx + 0.5, q.qy + 0.5);
        if (sx < -k || sx > W + k || sy2 < -k || sy2 > H + k) continue;
        const l0 = this.larguraRua('v', q.qx) / 2, l1 = this.larguraRua('v', q.qx + 1) / 2, t0 = this.larguraRua('h', q.qy) / 2, t1 = this.larguraRua('h', q.qy + 1) / 2;
        const x1 = q.qx + l0, y1 = q.qy + t0, w = 1 - l0 - l1, h = 1 - t0 - t1;
        if (q.tipo === 'parque') {
          c.fillStyle = U.mix(quad, '#3e5f4b', 0.42); c.beginPath(); c.roundRect(x1, y1, w, h, 0.05); c.fill();
          c.fillStyle = U.mix(quad, '#5b7d62', 0.35);
          for (let a = 0; a < 7; a++) { c.beginPath(); c.arc(x1 + w * (0.15 + 0.7 * ((a * 37) % 10) / 10), y1 + h * (0.2 + 0.6 * ((a * 53) % 10) / 10), 0.05, 0, Math.PI * 2); c.fill(); }
          continue;
        }
        if (q.tipo === 'praca') {
          c.fillStyle = U.mix(quad, rua, 0.35); c.beginPath(); c.roundRect(x1, y1, w, h, 0.05); c.fill();
          c.strokeStyle = U.rgba(tm.texto, 0.12); c.lineWidth = 0.012; c.beginPath(); c.arc(x1 + w / 2, y1 + h / 2, Math.min(w, h) * 0.3, 0, Math.PI * 2); c.stroke();
          continue;
        }
        const gap = 0.022;
        for (const lt of q.lotes) {
          const lw = (w - gap * (lt.nx - 1)) / lt.nx, lh = (h - gap * (lt.ny - 1)) / lt.ny;
          const lx = x1 + lt.a * (lw + gap), ly = y1 + lt.b * (lh + gap);
          c.fillStyle = 'rgba(0,0,0,0.35)';
          c.beginPath(); c.roundRect(lx + 0.01, ly + 0.016, lw, lh, 0.025); c.fill();
          c.fillStyle = U.mix(quad, lt.tom > 0.5 ? '#000000' : '#ffffff', Math.abs(lt.tom - 0.5) * 0.18);
          c.beginPath(); c.roundRect(lx, ly, lw, lh, 0.025); c.fill();
          c.fillStyle = U.rgba(tm.texto, 0.07); c.fillRect(lx + 0.02, ly + 0.004, lw - 0.04, 0.007);
        }
      }
      // faixa central das avenidas nomeadas
      c.strokeStyle = U.rgba(tm.texto, 0.10); c.lineWidth = 0.008; c.setLineDash([0.06, 0.06]);
      for (const r of this.ruas) { c.beginPath(); if (r.eixo === 'h') { c.moveTo(-7, r.em); c.lineTo(13, r.em); } else { c.moveTo(r.em, -9); c.lineTo(r.em, 14); } c.stroke(); }
      c.setLineDash([]);
      // nomes das ruas
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.font = `600 ${Math.round(21 * z)}px ${tm.fRotulo}`; c.letterSpacing = '0.22em'; c.fillStyle = U.rgba(tm.texto, 0.78); c.textAlign = 'center'; c.textBaseline = 'middle';
      for (const r of this.ruas) {
        if (!r.nome) continue;
        const ao = r.rotuloEm, em = r.em + (r.desvio || 0);
        const [x, y] = r.eixo === 'h' ? P(ao, em) : P(em, ao);
        c.save(); c.translate(x, y); c.rotate(this.giro + (r.eixo === 'v' ? Math.PI / 2 : 0));
        if (r.desvio) { c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 8; }
        c.fillText(r.nome.toUpperCase(), 0, 1); c.restore();
      }
      c.letterSpacing = '0px';
      // rota
      const pr = U.ease.suave(U.prog(t, this.tRota[0], this.tRota[1]));
      if (pr > 0 && this.rota.length > 1) {
        const pts = this.rota.map(([x, y]) => P(x, y));
        const segs = []; let tot = 0;
        for (let a = 1; a < pts.length; a++) { const l = Math.hypot(pts[a][0] - pts[a - 1][0], pts[a][1] - pts[a - 1][1]); segs.push(l); tot += l; }
        let resta = tot * pr; const parc = [pts[0]];
        for (let a = 1; a < pts.length && resta > 0; a++) { const l = segs[a - 1]; const q = Math.min(1, resta / l); parc.push([U.lerp(pts[a - 1][0], pts[a][0], q), U.lerp(pts[a - 1][1], pts[a][1], q)]); resta -= l; }
        const linha = () => { c.beginPath(); parc.forEach(([x, y], a) => (a ? c.lineTo(x, y) : c.moveTo(x, y))); };
        c.lineCap = 'round'; c.lineJoin = 'round';
        c.save(); c.shadowColor = tm.destaque; c.shadowBlur = 22; c.strokeStyle = U.rgba(tm.destaque, 0.45); c.lineWidth = 14 * z; linha(); c.stroke(); c.restore();
        c.strokeStyle = U.mix(tm.texto, tm.destaque, 0.25); c.lineWidth = 6 * z; linha(); c.stroke();
        const [hx, hy] = parc[parc.length - 1];
        c.fillStyle = tm.texto; c.beginPath(); c.arc(hx, hy, 8 * z, 0, Math.PI * 2); c.fill();
      }
      // destino
      if (this.dest) {
        const q = U.ease.volta(U.prog(t, this.tRota[0] - 0.2, this.tRota[0] + 0.35));
        if (q > 0) {
          const [x, y] = P(...this.dest.em);
          c.save(); c.translate(x, y); c.scale(q, q);
          c.fillStyle = U.rgba(tm.fundo, 0.94); c.strokeStyle = tm.destaque; c.lineWidth = 3;
          c.beginPath(); c.arc(0, 0, 38, 0, Math.PI * 2); c.fill(); c.stroke();
          const ic = this.paths[this.dest.icone] || this.paths.metro;
          c.translate(-19, -19); c.scale(1.6, 1.6); c.strokeStyle = tm.texto; c.lineWidth = 1.5; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(ic);
          c.restore();
          if (this.dest.nome) {
            c.save(); c.globalAlpha = v.vis * U.clamp(q); c.font = `700 ${23}px ${tm.fRotulo}`; c.letterSpacing = '0.24em'; c.textAlign = 'center'; c.textBaseline = 'top';
            const txt = this.dest.nome.toUpperCase(), lw = c.measureText(txt).width;
            const xt = U.clamp(x, 60 + lw / 2, W - 60 - lw / 2);
            c.shadowColor = 'rgba(0,0,0,0.85)'; c.shadowBlur = 12; c.fillStyle = tm.texto; c.fillText(txt, xt, y + 52); c.restore();
          }
        }
      }
      // pin do imóvel
      const qp = U.prog(t, this.tPin, this.tPin + 0.6);
      if (qp > 0) {
        const [x, y] = P(...this.pin);
        const cai = (1 - U.ease.volta(qp)) * -110;
        // pulso no chão
        const ciclo = ((t - this.tPin) % 1.8) / 1.8;
        c.save(); c.globalAlpha = v.vis * (1 - ciclo) * 0.6 * U.clamp(qp * 2); c.strokeStyle = tm.destaque; c.lineWidth = 2.5;
        c.beginPath(); c.ellipse(x, y, 30 + ciclo * 70, (30 + ciclo * 70) * 0.5, 0, 0, Math.PI * 2); c.stroke(); c.restore();
        c.save(); c.globalAlpha = v.vis * U.clamp(qp * 1.5);
        c.fillStyle = 'rgba(0,0,0,0.45)'; c.beginPath(); c.ellipse(x, y, 24, 9, 0, 0, Math.PI * 2); c.fill();
        const yh = y - 74 + cai;
        const gh = c.createLinearGradient(x - 6, 0, x + 6, 0); gh.addColorStop(0, '#9aa0aa'); gh.addColorStop(0.5, '#e8e6e1'); gh.addColorStop(1, '#7d838d');
        c.fillStyle = gh; c.fillRect(x - 5, yh + 20, 10, y - yh - 20);
        const gd = c.createRadialGradient(x - 12, yh - 12, 4, x, yh, 40);
        gd.addColorStop(0, U.mix(tm.destaque, '#ffffff', 0.45)); gd.addColorStop(0.6, tm.destaque); gd.addColorStop(1, U.mix(tm.destaque, '#000', 0.35));
        c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 16; c.shadowOffsetY = 6;
        c.fillStyle = gd; c.beginPath(); c.arc(x, yh, 34, 0, Math.PI * 2); c.fill();
        c.shadowColor = 'transparent';
        c.fillStyle = U.mix(tm.fundo, '#000', 0.2); c.beginPath(); c.arc(x, yh, 13, 0, Math.PI * 2); c.fill();
        c.strokeStyle = U.rgba('#ffffff', 0.35); c.lineWidth = 2; c.beginPath(); c.arc(x, yh, 30, U.rad(200), U.rad(300)); c.stroke();
        c.restore();
      }
      // escurece as bordas para o texto respirar
      c.globalAlpha = 1;
      const vg = c.createLinearGradient(0, 0, 620, 0); vg.addColorStop(0, U.rgba(tm.fundo, 0.72)); vg.addColorStop(1, U.rgba(tm.fundo, 0));
      c.fillStyle = vg; c.fillRect(0, 0, 620, 1000);
      const vt = c.createLinearGradient(0, 0, 0, 420); vt.addColorStop(0, U.rgba(tm.fundo, 0.85)); vt.addColorStop(1, U.rgba(tm.fundo, 0));
      c.fillStyle = vt; c.fillRect(0, 0, W, 420);
      if (this.num) this.num.desenhar(t, vNum);
    }
  }
  registrar('mapa', Mapa);

  // ================================================================ etiqueta avulsa
  class Etiqueta extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'cena');
      this.entrada = p.entrada ?? 0.45;
      this.d = el('div', 'mk-etq', (p.icone ? U.icone(p.icone, 26) : '') + `<span class="mk-etq-n">${U.esc(p.nome || p.texto || '')}</span>${p.valor ? `<span class="mk-etq-v">${U.marcar(p.valor)}</span>` : ''}`);
      this.d.style.left = (p.x ?? 540) + 'px'; this.d.style.top = (p.y ?? 600) + 'px';
      if (p.ancora) {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('class', 'mk-etq-fio'); this.svg.setAttribute('width', W); this.svg.setAttribute('height', H);
        this.svg.innerHTML = `<line x1="${p.ancora[0]}" y1="${p.ancora[1]}" x2="${p.x ?? 540}" y2="${p.y ?? 600}" /><circle cx="${p.ancora[0]}" cy="${p.ancora[1]}" r="6"/>`;
        this.el.appendChild(this.svg); this.linha = this.svg.querySelector('line');
      }
      this.el.appendChild(this.d);
    }
    desenhar(t, v) {
      const q = U.ease.volta(v.pin), o = 1 - U.ease.entra(v.pout);
      this.d.style.opacity = (U.ease.sai(v.pin) * o).toFixed(3);
      this.d.style.transform = `translate(-50%,-50%) scale(${(0.8 + 0.2 * q).toFixed(4)})`;
      if (this.linha) { const L = 600; this.linha.style.strokeDasharray = L; this.linha.style.strokeDashoffset = (L * (1 - U.ease.sai(v.pin))).toFixed(1); this.svg.style.opacity = o.toFixed(3); }
    }
  }
  registrar('etiqueta', Etiqueta);

  // ================================================================ preço que conta
  class Preco extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'cena');
      this.entrada = p.entrada ?? 0.8;
      const x = p.x ?? 540, y = p.y ?? 640;
      this.valorFinal = Number(p.valor || 0);
      this.de = Number(p.de ?? Math.round(this.valorFinal * 0.17 / 10000) * 10000);
      this.arred = p.arredondar ?? (this.valorFinal >= 100000 ? 1000 : 1);
      this.tConta = this.T(p.contarEm ?? this.inicio + 0.35);
      this.contagem = p.contagem ?? 1.4;
      this.caixa = el('div', 'mk-preco');
      this.caixa.style.left = x + 'px'; this.caixa.style.top = y + 'px';
      const L = p.largura ?? 640, A = 210;
      this.caixa.style.width = L + 'px'; this.caixa.style.height = A + 'px';
      const pt = 46;
      const d = `M${pt} 1 H${L - 14} Q${L - 1} 1 ${L - 1} 14 V${A - 14} Q${L - 1} ${A - 1} ${L - 14} ${A - 1} H${pt} L1 ${A / 2} Z`;
      this.caixa.innerHTML = `<svg class="mk-preco-fundo" width="${L}" height="${A}" viewBox="0 0 ${L} ${A}"><path d="${d}"/><circle cx="${pt - 8}" cy="${A / 2}" r="9"/></svg>
        <div class="mk-preco-in">${p.rotulo !== '' ? `<div class="mk-preco-rot">${U.esc(p.rotulo ?? 'A PARTIR DE')}</div>` : ''}
        <div class="mk-preco-v"><span class="mk-preco-moeda">${U.esc(p.moeda ?? 'R$')}</span><span class="mk-preco-n"></span></div>
        ${p.nota ? `<div class="mk-preco-nota">${U.esc(p.nota)}</div>` : ''}</div>`;
      this.n = this.caixa.querySelector('.mk-preco-n');
      this.fio = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.fio.setAttribute('class', 'mk-preco-fio'); this.fio.setAttribute('width', W); this.fio.setAttribute('height', H);
      const hx = x - L / 2 + pt - 8, hy = y;
      const fx = hx - (p.fioX ?? 70), fy = hy - (p.fioAltura ?? 190);
      this.fio.innerHTML = `<defs><linearGradient id="mk-fio-${Math.round(hx)}" gradientUnits="userSpaceOnUse" x1="${hx}" y1="${hy}" x2="${fx}" y2="${fy}"><stop offset="0" stop-color="var(--cor-destaque)" stop-opacity=".8"/><stop offset="1" stop-color="var(--cor-destaque)" stop-opacity="0"/></linearGradient></defs>` +
        `<path d="M${hx} ${hy} C ${hx - 30} ${hy - 60}, ${fx + 10} ${fy + 90}, ${fx} ${fy}" stroke="url(#mk-fio-${Math.round(hx)})" />`;
      this.el.appendChild(this.fio); this.el.appendChild(this.caixa);
      this.fioPath = this.fio.querySelector('path');
      this.hx = hx; this.hy = hy;
    }
    desenhar(t, v) {
      const o = 1 - U.ease.entra(v.pout), l = v.local;
      const qf = U.ease.suave(U.prog(l, 0, 0.6));
      if (!this.lenFio) this.lenFio = Math.ceil(this.fioPath.getTotalLength() || 300) + 2;
      this.fioPath.style.strokeDasharray = this.lenFio; this.fioPath.style.strokeDashoffset = (this.lenFio * (1 - qf)).toFixed(1);
      this.fio.style.opacity = o.toFixed(3);
      const q = U.prog(l, 0.15, 0.95);
      const giro = -9 * Math.exp(-4.5 * q) * Math.cos(9 * q);
      this.caixa.style.opacity = (U.ease.sai(U.clamp(q * 2)) * o).toFixed(3);
      this.caixa.style.transform = `translate(-50%,-50%) translate(0,${((1 - U.ease.sai(q)) * 30).toFixed(1)}px) rotate(${giro.toFixed(3)}deg)`;
      this.caixa.style.transformOrigin = `46px 50%`;
      const qc = U.ease.saiForte(U.prog(t, this.tConta, this.tConta + this.contagem));
      const val = Math.round(U.lerp(this.de, this.valorFinal, qc) / this.arred) * this.arred;
      this.n.textContent = U.fmtNum(qc >= 1 ? this.valorFinal : val, 0);
    }
  }
  registrar('preco', Preco);

  // ================================================================ galeria de fotos
  class Galeria extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'cena');
      this.entrada = p.entrada ?? 0.8;
      const a = Object.assign({ x: 60, y: 420, w: 960, h: 500 }, p.area || {});
      this.caixa = el('div', 'mk-gal'); Object.assign(this.caixa.style, { left: a.x + 'px', top: a.y + 'px', width: a.w + 'px', height: a.h + 'px' });
      this.fotos = (p.fotos || []).map((ft) => (typeof ft === 'string' ? { arquivo: ft } : ft));
      const dur = this.fim - this.inicio, n = Math.max(1, this.fotos.length);
      this.porFoto = p.porFoto || dur / n;
      this.items = this.fotos.map((ft, i) => {
        const d = el('div', 'mk-gal-item'); const img = el('img'); img.alt = ''; d.appendChild(img);
        if (ft.legenda) d.appendChild(el('div', 'mk-gal-leg', U.marcar(ft.legenda)));
        this.caixa.appendChild(d);
        return { d, img, ft, t0: this.inicio + i * this.porFoto };
      });
      if (p.contador !== false && n > 1) { this.cont = el('div', 'mk-gal-cont'); this.caixa.appendChild(this.cont); }
      this.el.appendChild(this.caixa);
    }
    async preparar() {
      for (const it of this.items) { const im = await carregarImagem(this.f.url(it.ft.arquivo)); it.img.src = im.src; it.foco = it.ft.foco || [0.5, 0.5]; }
    }
    desenhar(t, v) {
      const o = 1 - U.ease.entra(v.pout), qe = U.ease.saiQuint(v.pin);
      this.caixa.style.opacity = o.toFixed(3);
      this.caixa.style.clipPath = `inset(${((1 - qe) * 50).toFixed(2)}% 0 ${((1 - qe) * 50).toFixed(2)}% 0 round 28px)`;
      let atual = 0;
      this.items.forEach((it, i) => {
        const ini = it.t0, fim = ini + this.porFoto + 0.7;
        const ativo = t >= ini - (i ? 0.01 : 999) && t < fim;
        it.d.style.display = ativo ? '' : 'none';
        if (!ativo) return;
        if (t >= ini) atual = i;
        const q = i === 0 ? 1 : U.ease.suave(U.prog(t, ini, ini + 0.7));
        it.d.style.clipPath = `inset(0 0 0 ${((1 - q) * 100).toFixed(2)}%)`;
        it.d.style.zIndex = i;
        const kb = U.prog(t, ini - 0.7, ini + this.porFoto + 0.7);
        const dir = i % 2 ? -1 : 1;
        it.img.style.transform = `scale(${(1.06 + 0.08 * kb).toFixed(4)}) translate(${(dir * (kb - 0.5) * 2.2).toFixed(3)}%, ${((0.5 - kb) * 1.2).toFixed(3)}%)`;
        const lg = it.d.querySelector('.mk-gal-leg');
        if (lg) this.mover(lg, U.prog(t, ini + 0.35, ini + 0.95), 0, 16);
      });
      if (this.cont) this.cont.textContent = `${String(atual + 1).padStart(2, '0')} / ${String(this.items.length).padStart(2, '0')}`;
    }
  }
  registrar('galeria', Galeria);

  // ================================================================ fecho com chamada e @
  class Fecho extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'cena');
      this.entrada = p.entrada ?? 1.2;
      const c = el('div', 'mk-fecho'); c.style.top = (p.y ?? 300) + 'px';
      const partes = [];
      if (p.logo) partes.push(`<img class="mk-fecho-logo" src="${U.esc(f.url(p.logo))}" alt="">`);
      if (p.rotulo) partes.push(`<div class="mk-fecho-rot">${U.esc(p.rotulo)}</div>`);
      partes.push(`<div class="mk-fecho-tit">${U.marcar(p.chamada || 'Agende sua *visita*.')}</div>`);
      if (p.botao) partes.push(`<div class="mk-fecho-bot">${p.iconeBotao ? U.icone(p.iconeBotao, 30) : ''}<span>${U.esc(p.botao)}</span></div>`);
      if (p.arroba) partes.push(`<div class="mk-fecho-arroba">${U.icone('instagram', 34)}<span>${U.esc(p.arroba)}</span></div>`);
      const linha = [p.nome, p.imobiliaria, p.creci ? 'CRECI ' + String(p.creci).replace(/^creci\s*/i, '') : ''].filter(Boolean).join('  ·  ');
      if (linha) partes.push(`<div class="mk-fecho-linha">${U.esc(linha)}</div>`);
      c.innerHTML = partes.join('');
      this.el.appendChild(c);
      this.partes = [...c.children];
    }
    desenhar(t, v) {
      this.partes.forEach((e, i) => this.mover(e, U.prog(v.local, i * 0.14, i * 0.14 + 0.7), v.pout, 26));
      const bot = this.partes.find((e) => e.classList.contains('mk-fecho-bot'));
      if (bot) { const pul = 1 + 0.025 * Math.max(0, Math.sin((v.local - 1.2) * 3.2)) * U.prog(v.local, 1.2, 1.6); bot.style.transform += ` scale(${pul.toFixed(4)})`; }
    }
  }
  registrar('fecho', Fecho);

  // ================================================================ faixa corrida
  class Faixa extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'sobre');
      this.caixa = el('div', 'mk-faixa'); this.caixa.style.top = (p.y ?? 1470) + 'px';
      const itens = (p.itens || ['imóvel ilustrativo']).map((x) => `<span>${U.esc(x)}</span><i>✦</i>`).join('');
      this.trilho = el('div', 'mk-faixa-trilho', itens + itens + itens + itens);
      this.caixa.appendChild(this.trilho); this.el.appendChild(this.caixa);
      this.vel = p.velocidade ?? 70;
    }
    desenhar(t, v) {
      this.caixa.style.opacity = v.vis.toFixed(3);
      if (!this.larg) this.larg = this.trilho.scrollWidth / 4 || 1000;
      this.trilho.style.transform = `translateX(${(-((v.local * this.vel) % this.larg)).toFixed(2)}px)`;
    }
  }
  registrar('faixa', Faixa);

  // ================================================================ selo
  class Selo extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'sobre');
      const x = p.x ?? 1020, y = p.y ?? 246;
      this.estilo = p.estilo || 'pilula';
      if (this.estilo === 'redondo') {
        const txt = U.esc((p.texto || 'imóvel ilustrativo').toUpperCase() + ' · ');
        const id = 'mk-selo-' + (++Selo.n);
        this.caixa = el('div', 'mk-selo-redondo', `<svg width="170" height="170" viewBox="0 0 170 170"><defs><path id="${id}" d="M85 85 m-62 0 a62 62 0 1 1 124 0 a62 62 0 1 1 -124 0"/></defs><circle cx="85" cy="85" r="80"/><text><textPath href="#${id}">${txt + txt}</textPath></text></svg><div class="mk-selo-centro">${U.icone(p.icone || 'casa', 40)}</div>`);
        this.svg = this.caixa.querySelector('svg');
      } else this.caixa = el('div', 'mk-selo', '<i></i>' + U.esc(p.texto || 'imóvel ilustrativo'));
      this.caixa.style.left = x + 'px'; this.caixa.style.top = y + 'px';
      if (this.estilo !== 'redondo' && (p.alinhamento || 'direita') === 'direita') this.caixa.style.transform = 'translateX(-100%)';
      this.el.appendChild(this.caixa);
    }
    desenhar(t, v) {
      this.caixa.style.opacity = v.vis.toFixed(3);
      if (this.svg) this.svg.style.transform = `rotate(${(v.local * (this.p.graus ?? 18)).toFixed(2)}deg)`;
    }
  }
  Selo.n = 0;
  registrar('selo', Selo);

  // ================================================================ html livre (para o agente criar por cima)
  class Html extends Bloco {
    constructor(f, p, tipo) {
      super(f, p, tipo, 'cena');
      this.caixa = el('div', 'mk-html', p.html || '');
      Object.assign(this.caixa.style, { left: (p.x ?? 0) + 'px', top: (p.y ?? 0) + 'px' });
      if (p.w) this.caixa.style.width = p.w + 'px';
      if (p.h) this.caixa.style.height = p.h + 'px';
      if (p.estiloCss) this.caixa.setAttribute('style', this.caixa.getAttribute('style') + ';' + p.estiloCss);
      this.el.appendChild(this.caixa);
      this.filhos = p.cascata ? [...this.caixa.children] : [this.caixa];
    }
    desenhar(t, v) {
      this.filhos.forEach((e, i) => this.mover(e, U.prog(v.local, i * 0.12, i * 0.12 + this.entrada), v.pout, this.p.deslocamento ?? 26));
      if (typeof this.p.aoDesenhar === 'function') this.p.aoDesenhar(t, v, this.caixa);
    }
  }
  registrar('html', Html);

  // ---------------------------------------------------------------- roteiro.json -> filme
  async function montarDeRoteiro(roteiro, opcoes = {}) {
    const base = opcoes.base ?? '';
    const r = roteiro || {};
    let meta = null, palavras = [];
    if (r.pessoa) {
      try { meta = await carregarJSON(base + (r.pessoa.meta || 'trabalho/meta.json')); } catch (e) { throw new Error('Faltam os quadros da pessoa: rode preparar-video.cjs para esta peça (' + e.message + ').'); }
      if (!meta.quadros) throw new Error('Esta peça foi preparada só com áudio (sem vídeo da pessoa): tire o bloco "pessoa" do roteiro, ou prepare com --video');
    } else if (typeof r.duracao !== 'number') {
      // só locução: a duração vem do áudio preparado (se houver)
      try { meta = await carregarJSON(base + 'trabalho/meta.json'); } catch (e) { meta = null; }
    }
    if (r.legenda !== false) {
      const arq = (r.legenda && r.legenda.palavras) || 'trabalho/palavras.json';
      try { palavras = await carregarJSON(base + arq); } catch (e) { if (r.legenda) throw e; palavras = []; }
    }
    if (Array.isArray(r.palavras)) palavras = r.palavras;
    const duracao = typeof r.duracao === 'number' ? r.duracao : (meta ? meta.duracao : 10);
    const filme = new Filme({ duracao, fps: r.fps || 30, palavras, base, layout: r.layout });
    if (r.pessoa) filme.adicionar('pessoa', Object.assign({ total: meta.quadros, srcW: meta.largura, srcH: meta.altura, fps: meta.fps }, r.pessoa));    (r.cenas || []).forEach((c, i) => {
      if (!c || !c.bloco) throw new Error(`A cena ${i + 1} do roteiro não diz qual bloco usar ("bloco").`);
      try { filme.adicionar(c.bloco, c); } catch (e) { throw new Error(`Cena ${i + 1} (${c.bloco}): ${e.message}`); }
    });
    if (r.legenda !== false && palavras.length) filme.adicionar('legenda', r.legenda || {});
    await filme.preparar();
    return filme;
  }

  function publicar(filme) {
    window.FILME = filme;
    window.DURACAO = filme.duracao;
    window.FPS = filme.fps;
    window.LARGURA = filme.largura; window.ALTURA = filme.altura;
    window.renderAt = (t) => filme.renderAt(t);
    window.QUADROS_CHAVE = filme.quadrosChave();
    const q = new URLSearchParams(location.search).get('t');
    return filme.renderAt(q !== null ? Number(q) : 0);
  }

  function mostrarErro(e) {
    const d = el('div', 'mk-erro', '<b>Não deu para montar a peça</b><br>' + U.esc(e && e.message || e));
    document.body.appendChild(d);
    throw e;
  }

  window.Blocos = { versao: '1.1.0', Filme, Bloco, registrar, blocos: REGISTRO, montarDeRoteiro, publicar, mostrarErro, carregarJSON, carregarImagem, criarCanvas, el, lerTema, fontesProntas, util: U, icones: ICONES, LAYOUT };
})();
