---
name: video-de-imovel
description: Cria o vídeo de imóvel com animação premium, sincronizado palavra a palavra (nome do empreendimento, metragem que conta, planta, mapa com rota, cômodos, preço, fotos, chamada), com a corretora falando num cartão, só com a voz dela (locução, sem aparecer) ou com fotos. Use quando ela mandar um vídeo, áudio ou link de imóvel, pedir "faz aquele vídeo animado" ou quando a semana de conteúdo tiver um vídeo de imóvel.
version: 1.0.0 (do Estrategista, 29/10/2026; vem do Módulo Marketeiro)
license: proprietária EstrategistaLabs
---

# Vídeo de imóvel com animação

**Precisa do motor de criação** (`ferramentas/marketeiro`, que vem com o módulo `marketing-proprio`) e de computador, ou de nuvem com
navegador e ffmpeg. Motor não instalado: `conectar-ferramentas`, seção do motor. Se não der para renderizar onde ela está (celular), faça
os passos 0 a 4 e diga em uma frase que o render acontece quando ela abrir você no computador.

Antes de começar: leia `sede/LICOES.md` (o jeito dela e o que ela já corrigiu) e os estilos e blocos dela em `marketing/estilos/` e
`marketing/blocos/`. Referência de todos os blocos de cena: `ferramentas/marketeiro/blocos/BLOCOS.md`. Modelo:
`ferramentas/marketeiro/modelos/video-imovel.html`. Não edite `ferramentas/marketeiro/`.
**Avise o custo:** "Vídeo animado gasta bastante do seu limite. Sigo?" Use o modelo forte (Opus no Claude) para criar.

## 0. Escolha o formato (pergunte se ela não disse; o que ela preferiu antes está em `sede/LICOES.md`)
| Formato | Quando | O que ela manda |
|---|---|---|
| **A. Ela falando** (padrão) | Gosta de aparecer | Vídeo vertical de 30 a 60 s falando do imóvel. Começa em tela cheia; depois do gancho vira cartão embaixo e o grafismo ocupa a metade de cima |
| **B. Só locução** | Não quer aparecer, ou é lançamento sem visita | Um áudio (celular, WhatsApp, mp3) lendo o roteiro. A tela inteira é do grafismo; a legenda fica embaixo |
| **C. Fotos e tour** | Imóvel pronto com fotos boas | Fotos (e locução, ou só a música que ela escolher no Instagram) |
| **D. Livre** | Ela trouxe uma referência de vídeo | Estude a referência primeiro (ritmo, tipografia, transições), guarde o estilo em `marketing/estilos/` e siga este passo a passo |

Voz sintética (clonada) só se ela já tiver a voz dela numa ferramenta e pedir; nunca a voz de outra pessoa.

## 1. Receber o material
Peça de uma vez só (ou em `marketing/entrada/`): o vídeo ou áudio do formato escolhido, as **fotos** (as melhores primeiro), a **planta**
(imagem ou PDF) e a **ficha**: metragem privativa, suítes, vagas, andar, diferenciais, preço que pode divulgar, bairro e 1 a 3 pontos
próximos com o tempo. Use a ficha que já está em `sede/imoveis/`, se existir.
**Se ela mandar um link** (página do empreendimento, anúncio): leia a página e monte a ficha com a fonte e a data; o que divergir entre
fontes (preço, entrega, metragem) vai numa lista "a confirmar" para ela, antes do vídeo ir ao ar.
Crie `marketing/pecas/AAAA-MM-DD-imovel-<nome>/` e mova o material para `entrada/` dentro dela.

## 2. Roteiro de fala (formatos B e C, ou se ela ainda não gravou)
Escreva com a skill `roteiros-reels`: gancho, 3 a 5 fatos fortes ditos em voz alta, para quem é, chamada. 35 a 45 s (umas 100 palavras).
Para voz sintética, escreva os números por extenso ("quatrocentos e cinquenta e cinco metros quadrados") para a voz ler certo.

## 3. Preparar
- Formato A: `node ferramentas/marketeiro/preparar-video.cjs --video marketing/pecas/<pasta>/entrada/<video> --peca marketing/pecas/<pasta>`
- Formato B ou C com locução: `node ferramentas/marketeiro/preparar-video.cjs --audio marketing/pecas/<pasta>/entrada/<audio> --peca marketing/pecas/<pasta>`

Gera `trabalho/palavras.json` (cada palavra com o tempo), o áudio e, no formato A, os quadros dela. Leia `palavras.json` inteiro e corrija
nomes que o reconhecimento de voz errou (tabela `correcoes` do roteiro).

## 4. Roteiro de cenas (mostrar a ela antes de animar)
Uma tabela curta: tempo · o que ela fala · o que aparece (bloco) · a palavra exata em que entra. Regras:
- Cada número dito vira um bloco que conta (m², suítes, vagas, andares, preço). Localização vira mapa com rota. Planta vira o bloco da
  planta. Diferencial vira foto real com etiqueta.
- Movimento já no primeiro quadro. No formato A, o cartão dela encolhe depois do gancho.
- Formatos B e C: sem `pessoa` no roteiro; o grafismo usa a tela toda (de y 236 a ~1380) e a legenda vai sozinha para baixo (base em
  y 1500, acima da faixa do Instagram).
- Termine com a chamada e o @ dela (e o que ela quiser no fecho, como telefone ou "me chama no direct").
- Só dado da ficha ou da fala dela. Imagem 3D ou montada a partir da planta leva "imóvel ilustrativo".
- Pode criar cena nova livre (`html`, bloco próprio em `marketing/blocos/`): os blocos do motor são o começo, não o limite.

Peça um "pode" para a tabela (ou ajuste o que ela pedir).

## 5. Montar e conferir
1. Copie `ferramentas/marketeiro/modelos/video-imovel.html` para a pasta como `video.html` e escreva o `roteiro.json` (exemplo em
   `ferramentas/marketeiro/modelos/roteiro.exemplo.json`). Estilo salvo: carregue o CSS dela depois do tema; bloco próprio:
   `<script src="/marketing/blocos/<nome>.js"></script>`.
2. Rode `node ferramentas/marketeiro/tema.cjs` (marca dela, de `sede/marketing/marca.json`) e gere os quadros-chave:
   `node ferramentas/marketeiro/render.cjs --pagina marketing/pecas/<pasta>/video.html --stills 1,4,8,12,...` (um por cena).
3. **Olhe cada quadro com seus próprios olhos**: texto dentro das faixas do Instagram (topo 220 px, base 380 px livres), nada encostando,
   número certo, legenda legível, rosto dela visível (formato A). Corrija antes do render.
4. Render final: `node ferramentas/marketeiro/render.cjs --pagina marketing/pecas/<pasta>/video.html --saida marketing/pecas/<pasta>/video.mp4 --celular`
   (o áudio de `trabalho/audio.m4a` entra sozinho).
5. Capa (PNG com a skill `animacao-e-carrossel`) e legenda (skill `roteiros-reels`).

## 6. Entregar
Mande a versão de celular (`video-celular.mp4`), a capa, a legenda e a lista "a confirmar", se houver. Nada é publicado por você: quem posta
é ela. Correção dela = nova versão; mantenha a anterior em `v1/`, `v2/`... No primeiro vídeo, diga em uma linha que ela pode pedir outro
estilo trazendo uma referência.

## 7. Depois
Anote em `sede/LICOES.md` o que ela corrigiu e o que aprovou (formato preferido, ritmo, fecho). Cena ou bloco que vale repetir vai para
`marketing/blocos/`.
