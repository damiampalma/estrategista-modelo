---
name: semana-de-conteudo
description: Monta a semana de Instagram dela (3 posts com tema, texto da arte e legenda, mais a sugestão de Reels) a partir das dúvidas reais do cliente dela, mostra para aprovar e, depois do sim, chama pecas-no-canva. Use na segunda-feira, na rotina semanal, ou quando ela disser "monta a semana", "preciso de posts", "o que eu posto?".
version: 1.1.0 (do Estrategista, 25/10/2026)
license: proprietária EstrategistaLabs
---

# Semana de conteúdo

Objetivo: constância. 3 posts por semana que levam à chamada dela (a oferta gratuita, o contato, o link na bio), prontos para aprovar em 5 minutos.

## Entradas
- `marketing/pautas.md` (dúvidas reais primeiro), `marketing/semanas/` (não repetir tema em menos de 4 semanas), `marketing/numeros.md` (o que
  funcionou), `sede/LICOES.md`, `sede/marketing/marca.json` (voz e chamada padrão), `sede/PERFIL.md` (o que ela faz, cliente ideal, limites).

## Passos
0. Se `voz.chamada_padrao` em `sede/marketing/marca.json` ainda começa com "[", pergunte a chamada dela e grave antes de escrever.
1. **Escolha 3 temas** com mistura: 1 dúvida comum do cliente dela, 1 alerta ou erro frequente ("3 sinais de que…"), 1 bastidor ou autoridade
   (como ela trabalha, o que olha primeiro). Diga de onde veio cada tema.
2. **Para cada post:** formato (template do Canva ou carrossel do motor), texto da arte (curto, cabe no template), legenda (abre com a dor,
   explica em linguagem simples, termina com a chamada padrão dela), 3 a 5 hashtags do tema e da cidade, dia sugerido.
3. **Confira** cada texto: nenhuma promessa de resultado, prazo ou preço; regra, lei ou número só com fonte (senão [VERIFICAR]); sem travessão
   longo; sem "a gente"; sem dado de cliente; dentro do que a categoria dela permite (bloco A). Para cada regra ou número que o tema pedir,
   procure a fonte oficial (prefeitura, lei, conselho) e ponha o link na pauta; só marque [VERIFICAR] se não achar. No Codex a busca pede
   aprovação: avise em uma frase.
4. **Grave** em `marketing/semanas/AAAA-MM-DD.md` (data da segunda), com status "para aprovar" em cada post.
5. **Mostre a lista** curta e peça: "Aprova os 3, ou quer trocar algum?" Se a rotina rodou sozinha, deixe gravado e o resumo diz "semana pronta
   para você aprovar".
6. **Depois do sim:** chame `pecas-no-canva` (ou `animacao-e-carrossel` para carrossel do motor) e mude o status para "aprovado".
7. A cada 15 dias, lembre: "Quer o lote de roteiros de Reels?" (skill `roteiros-reels`).
8. Salve.

## Limites
- Nada é publicado: ela agenda. Você nunca diz que publicou.
- Caso real de cliente só com autorização e sem dado que identifique.
