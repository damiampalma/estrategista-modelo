---
name: animacao-e-carrossel
description: Cria peças com o motor de criação (ferramentas/marketeiro) e o modelo forte: carrossel em PNG 1080×1350 e animação gráfica em MP4 1080×1920 (texto animado, esquema, antes e depois), no tema da marca dela. Use quando ela pedir carrossel caprichado, post animado, ou quiser transformar um Reels gravado em peça com legenda animada.
version: 1.0.0 (do Estrategista, 24/10/2026)
license: proprietária EstrategistaLabs; motor de criação com fontes Cormorant Garamond e Inter (licença OFL, em ferramentas/marketeiro/fontes/)
---

# Animação e carrossel (motor de criação)

O motor desenha páginas HTML quadro a quadro e monta PNG ou MP4. Manual completo: `ferramentas/marketeiro/LEIA-ME.md` e
`ferramentas/marketeiro/blocos/BLOCOS.md` (eles falam em "corretora" e "imóvel", porque o motor nasceu para esse uso; a técnica é a mesma para
qualquer profissão). Não edite `ferramentas/marketeiro/`: estilos e blocos próprios dela ficam em `marketing/estilos/` e `marketing/blocos/`.

## Antes
- **Avise o custo:** "Animação gasta bastante do seu limite. Sigo?" Use o modelo forte (Opus no Claude) para criar; o resto com o leve.
- Motor instalado? (`sede/FERRAMENTAS.md`). Se não: `conectar-ferramentas`, seção do motor. Só roda no computador ou em nuvem com navegador e
  ffmpeg; se não der, diga isso em uma frase e entregue o conteúdo (textos das telas) para ela montar no Canva.
- Tema gerado? `node ferramentas/marketeiro/tema.cjs` (lê `sede/marketing/marca.json`, preenchido no bloco E).

## Carrossel
1. Crie `marketing/pecas/AAAA-MM-DD-nome/`, copie `ferramentas/marketeiro/modelos/carrossel.html` e escreva `conteudo.json` ao lado
   (5 a 8 telas: gancho, explicação em passos, chamada dela).
2. `node ferramentas/marketeiro/render.cjs --pagina marketing/pecas/AAAA-MM-DD-nome/carrossel.html --png`
3. Olhe cada PNG antes de mostrar: texto cortado, encostado ou pequeno volta para ajuste. Palavra de destaque sempre inteira.

## Animação gráfica (até 15 s na primeira vez)
1. Mesma pasta; página de vídeo a partir de `modelos/video-imovel.html` (troque o conteúdo) ou do zero, seguindo o contrato do LEIA-ME
   (`window.PRONTO`, `window.DURACAO`, `window.renderAt(t)`).
2. Ideias que servem a qualquer ofício: o antes e depois em 3 passos, a pergunta do seguidor em texto animado, o esquema do que ela olha primeiro.
3. Confira quadros: `--stills 2,5,9` e olhe as imagens. Depois: `--saida marketing/pecas/<pasta>/video.mp4 --celular`.
4. Só o `video-celular.mp4` (até ~25 MB) vai para o GitHub. Diga onde baixar.

## Regras
- Nenhum número sem fonte; nada de promessa de resultado, prazo ou preço; sem travessão longo; sem "a gente".
- Imagem gerada por IA só com o "sim" dela e com o rótulo de IA ao publicar. Nunca pessoa real gerada por IA.
- Primeira animação: anote em `sede/LICOES.md` quanto tempo levou e como ficou o limite dela depois, para combinar o ritmo.
