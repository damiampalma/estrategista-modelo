/* Peças estáticas do Marketeiro (post 1080x1350 e carrossel até 10 telas), no tema da corretora.
 * Usa Blocos.util (marcação *destaque* com a PALAVRA INTEIRA, ícones) de blocos.js.
 *   await Pecas.montar(conteudo, { max: 10 })  -> cria um .slide por tela dentro de #pecas
 * Tipos de tela: capa, texto, lista, numero, foto, imovel, citacao, fecho. Ver BLOCOS.md (seção "Post e carrossel").
 */
(function () {
  'use strict';
  const U = () => window.Blocos.util;
  const m = (s) => U().marcar(s);
  const e = (s) => U().esc(s);
  const ic = (n, t) => U().icone(n, t);

  function rodape(c, i, n, ass) {
    const pag = n > 1 ? `<span class="pc-pag">${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}</span>` : '';
    const arroba = ass.arroba ? `<span class="pc-arroba">${ic('instagram', 30)}${e(ass.arroba)}</span>` : '<span></span>';
    return `<div class="pc-rodape">${arroba}${c.semPaginacao ? '' : pag}</div>`;
  }

  const TIPOS = {
    capa(c, ctx) {
      const foto = c.foto ? `<div class="pc-foto-cheia"><img src="${e(c.foto)}" alt="" style="object-position:${e(c.focoFoto || '50% 50%')}"></div><div class="pc-veu"></div>` : '<div class="pc-luz"></div>';
      return `${foto}<div class="pc-miolo pc-capa ${c.foto ? 'pc-sobre-foto' : ''}">
        ${c.selo ? `<div class="pc-selo"><i></i>${e(c.selo)}</div>` : ''}
        <div class="pc-espaco"></div>
        ${c.rotulo ? `<div class="pc-rotulo"><b></b>${e(c.rotulo)}</div>` : ''}
        <h1 class="pc-titulo pc-ajusta" data-max="150" data-min="72">${m(c.titulo)}</h1>
        ${c.sub ? `<p class="pc-sub">${m(c.sub)}</p>` : ''}
        ${ctx.n > 1 && ctx.i === 0 ? `<div class="pc-arraste">${e(c.arraste || 'arraste')} ${ic('seta', 34)}</div>` : ''}
      </div>`;
    },
    texto(c) {
      return `<div class="pc-luz"></div><div class="pc-miolo pc-centro-v">
        ${c.numero ? `<div class="pc-num-tela">${e(c.numero)}</div>` : ''}
        ${c.rotulo ? `<div class="pc-rotulo"><b></b>${e(c.rotulo)}</div>` : ''}
        <h2 class="pc-titulo pc-medio pc-ajusta" data-max="96" data-min="56">${m(c.titulo)}</h2>
        ${c.texto ? `<p class="pc-texto">${m(c.texto)}</p>` : ''}
      </div>`;
    },
    lista(c) {
      const itens = (c.itens || []).slice(0, 6).map((it, k) => `<li><span class="pc-li-n">${String(k + 1).padStart(2, '0')}</span><span>${m(it)}</span></li>`).join('');
      return `<div class="pc-luz"></div><div class="pc-miolo pc-centro-v">
        ${c.rotulo ? `<div class="pc-rotulo"><b></b>${e(c.rotulo)}</div>` : ''}
        <h2 class="pc-titulo pc-medio pc-ajusta" data-max="88" data-min="54">${m(c.titulo)}</h2>
        <ol class="pc-lista">${itens}</ol>
      </div>`;
    },
    numero(c) {
      return `<div class="pc-luz"></div><div class="pc-miolo pc-centro-v">
        ${c.rotulo ? `<div class="pc-rotulo"><b></b>${e(c.rotulo)}</div>` : ''}
        <div class="pc-grande">${e(c.valor)}${c.unidade ? `<small>${e(c.unidade)}</small>` : ''}</div>
        <div class="pc-regua"></div>
        <h2 class="pc-titulo pc-medio pc-ajusta" data-max="80" data-min="50">${m(c.titulo || '')}</h2>
        ${c.texto ? `<p class="pc-texto">${m(c.texto)}</p>` : ''}
        ${c.fonte ? `<p class="pc-fonte">${e(c.fonte)}</p>` : ''}
      </div>`;
    },
    foto(c) {
      if (c.estilo === 'cheia') {
        return `<div class="pc-foto-cheia"><img src="${e(c.foto)}" alt="" style="object-position:${e(c.focoFoto || '50% 50%')}"></div><div class="pc-veu"></div>
          <div class="pc-miolo pc-sobre-foto"><div class="pc-espaco"></div>
          ${c.rotulo ? `<div class="pc-rotulo"><b></b>${e(c.rotulo)}</div>` : ''}
          <h2 class="pc-titulo pc-medio pc-ajusta" data-max="96" data-min="56">${m(c.titulo || '')}</h2>
          ${c.texto ? `<p class="pc-texto">${m(c.texto)}</p>` : ''}</div>`;
      }
      return `<div class="pc-luz"></div><div class="pc-miolo">
        <div class="pc-quadro"><img src="${e(c.foto)}" alt="" style="object-position:${e(c.focoFoto || '50% 50%')}">${c.legendaFoto ? `<span class="pc-tag">${m(c.legendaFoto)}</span>` : ''}</div>
        ${c.rotulo ? `<div class="pc-rotulo"><b></b>${e(c.rotulo)}</div>` : ''}
        <h2 class="pc-titulo pc-pequeno pc-ajusta" data-max="76" data-min="48">${m(c.titulo || '')}</h2>
        ${c.texto ? `<p class="pc-texto">${m(c.texto)}</p>` : ''}
      </div>`;
    },
    imovel(c) {
      const ficha = (c.ficha || []).slice(0, 4).map((f) => {
        const [v, r, icone] = Array.isArray(f) ? f : [f.valor, f.rotulo, f.icone];
        return `<div class="pc-ficha-i">${icone ? ic(icone, 34) : ''}<b>${m(v)}</b><span>${e(r)}</span></div>`;
      }).join('');
      return `<div class="pc-luz"></div><div class="pc-miolo">
        <div class="pc-quadro pc-quadro-alto">${c.foto ? `<img src="${e(c.foto)}" alt="" style="object-position:${e(c.focoFoto || '50% 50%')}">` : ''}${c.selo ? `<span class="pc-selo pc-selo-foto"><i></i>${e(c.selo)}</span>` : ''}</div>
        ${c.rotulo ? `<div class="pc-rotulo"><b></b>${e(c.rotulo)}</div>` : ''}
        <h2 class="pc-titulo pc-pequeno pc-ajusta" data-max="84" data-min="52">${m(c.nome || c.titulo || '')}</h2>
        ${ficha ? `<div class="pc-ficha">${ficha}</div>` : ''}
        ${c.preco ? `<div class="pc-preco"><span>${e(c.precoRotulo || 'a partir de')}</span><b>${e(c.preco)}</b></div>` : ''}
      </div>`;
    },
    citacao(c) {
      return `<div class="pc-luz"></div><div class="pc-miolo pc-centro-v">
        <div class="pc-aspas">“</div>
        <blockquote class="pc-cit pc-ajusta" data-max="74" data-min="46">${m(c.texto || '')}</blockquote>
        ${c.autor ? `<div class="pc-rotulo pc-autor"><b></b>${e(c.autor)}</div>` : ''}
      </div>`;
    },
    fecho(c, ctx) {
      const ass = ctx.ass;
      return `<div class="pc-luz pc-luz-forte"></div><div class="pc-miolo pc-centro-v pc-centro-h">
        ${c.rotulo ? `<div class="pc-rotulo"><b></b>${e(c.rotulo)}<b></b></div>` : ''}
        <h2 class="pc-titulo pc-ajusta" data-max="120" data-min="64">${m(c.titulo || 'Quer conhecer de *perto*?')}</h2>
        ${c.texto ? `<p class="pc-texto">${m(c.texto)}</p>` : ''}
        ${c.botao ? `<div class="pc-botao">${c.iconeBotao ? ic(c.iconeBotao, 34) : ''}${e(c.botao)}</div>` : ''}
        ${(c.arroba || ass.arroba) ? `<div class="pc-fecho-arroba">${ic('instagram', 40)}${e(c.arroba || ass.arroba)}</div>` : ''}
        ${c.linha ? `<div class="pc-fecho-linha">${e(c.linha)}</div>` : ''}
      </div>`;
    },
  };

  function ajustar(el) {
    const max = Number(el.dataset.max) || 120, min = Number(el.dataset.min) || 40;
    const caixa = el.closest('.pc-miolo');
    let tam = max;
    el.style.fontSize = tam + 'px';
    const cabe = () => caixa.scrollHeight <= caixa.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1;
    while (!cabe() && tam > min) { tam -= 2; el.style.fontSize = tam + 'px'; }
  }

  async function montar(conteudo, opcoes = {}) {
    const max = opcoes.max || 10;
    const raiz = document.getElementById('pecas') || document.body;
    let marca = {};
    try { marca = (await window.Blocos.carregarJSON('/marketing/marca/tema.json')).marca || {}; } catch (er) { /* sem tema.json */ }
    const ass = Object.assign({ arroba: marca.arroba || '', nome: marca.nome || '' }, conteudo.assinatura || {});
    const telas = (conteudo.slides || conteudo.telas || []).slice(0, max);
    if (!telas.length) throw new Error('O conteudo.json não tem nenhuma tela em "slides".');
    const [w, h] = String(conteudo.formato || '1080x1350').split('x').map(Number);
    telas.forEach((c, i) => {
      const f = TIPOS[c.tipo || 'texto'];
      if (!f) throw new Error(`Tipo de tela desconhecido: "${c.tipo}". Use: ${Object.keys(TIPOS).join(', ')}.`);
      const s = document.createElement('section');
      s.className = 'slide pc-slide pc-' + (c.tipo || 'texto') + (c.claro ? ' pc-claro' : '');
      s.dataset.w = w; s.dataset.h = h; s.style.width = w + 'px'; s.style.height = h + 'px';
      s.innerHTML = f(c, { i, n: telas.length, ass }) + rodape(c, i, telas.length, ass);
      raiz.appendChild(s);
    });
    await window.Blocos.fontesProntas();
    await Promise.all([...document.images].map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.onload = im.onerror = r; })).then(() => im.decode && im.decode().catch(() => {}))));
    const quebradas = [...document.images].filter((im) => !im.naturalWidth).map((im) => im.getAttribute('src'));
    if (quebradas.length) throw new Error('Imagem não encontrada: ' + quebradas.join(', '));
    document.querySelectorAll('.pc-ajusta').forEach(ajustar);
  }

  window.Pecas = { montar, tipos: TIPOS };
})();
