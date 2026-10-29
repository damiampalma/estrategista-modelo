# Motor de criação do Marketeiro · LEIA-ME (para o agente)

O motor transforma páginas HTML em **post e carrossel (PNG 1080×1350)** e em **vídeo de imóvel (MP4 1080×1920, 30 fps)**, no
computador da corretora, sem serviço externo. Navegador sem janela (Chrome ou Edge, via `playwright-core`) desenha cada quadro;
`ffmpeg` (pacote `ffmpeg-static`) monta o MP4; `whisper.cpp` (modelo `small`, local) marca o tempo de cada palavra falada.
Nada é publicado nem enviado para fora. Toda peça nasce rascunho e a corretora aprova antes de postar.

**Onde fica:** `<RAIZ>/ferramentas/marketeiro/` (RAIZ = pasta do agente, com `sede/`, `painel/`, `.claude/`).
Os scripts acham a RAIZ sozinhos (sobem a partir da própria pasta). Todos os comandos abaixo rodam **na RAIZ**.
Andamento sai no stderr; o resultado sai em **JSON no stdout** (`ok`, arquivos, `mensagem` simples quando falha).

```
ferramentas/marketeiro/
  instalar-motor.cjs   confere/instala navegador, ffmpeg e reconhecimento de voz
  tema.cjs             marca da corretora -> marketing/marca/tema.css + tema.json
  preparar-video.cjs   vídeo (ou só a locução) da corretora -> áudio, quadros, palavras com tempo
  quadros.cjs          tira quadros de um vídeo de referência para olhar o estilo
  render.cjs           página -> MP4, versão de celular, quadros-chave, PNGs, capa
  autoteste.cjs        1 post + 1 vídeo de 3 s (prova de que funciona)
  blocos/              blocos.js/css (cenas de vídeo), pecas.js/css (post e carrossel), BLOCOS.md (guia completo)
  modelos/             video-imovel.html + roteiro.exemplo.json, post.html, carrossel.html + conteudo.exemplo.json
  fontes/              Cormorant Garamond e Inter (licença OFL), usadas quando a marca não traz fonte
  lib/comum.cjs        funções comuns · config.json (escrito pelo instalar-motor) · whisper/ (baixado)
```

## 1. Instalar (uma vez; pode repetir)
```
npm --prefix ferramentas/marketeiro install --omit=dev
node ferramentas/marketeiro/instalar-motor.cjs
```
- Navegador: tenta Google Chrome, depois Microsoft Edge (todo Windows tem). Não baixa navegador.
- ffmpeg: vem no `npm install` (pacote `ffmpeg-static`; o `package.json` já autoriza o script de instalação dele). Se o binário faltar,
  o instalador roda o download do pacote de novo; por último aceita um `ffmpeg` do sistema.
- Reconhecimento de voz: baixa o whisper.cpp 1.7.6 oficial para Windows x64 (GitHub `ggml-org/whisper.cpp`, `whisper-bin-x64.zip`) e o modelo
  `ggml-small.bin` (~470 MB, Hugging Face `ggerganov/whisper.cpp`) para `ferramentas/marketeiro/whisper/`. Leva alguns minutos.
  Com uma cópia já existente: `--whisper-local <pasta com main.exe e ggml-small.bin>`.
- Saída: `{ ok, navegador, ffmpeg, whisper, faltando: [...] , resumo }`. `faltando` vem em frases simples para a corretora.

## 2. Tema da marca
```
node ferramentas/marketeiro/tema.cjs
```
Lê `sede/marketing/marca.json` (mesmo esquema do kit de marca: `tema` {fundo, superficie, texto, suave, linha, destaque, apoio} e
`fontes` [{chave: titulo|texto|rotulo|assinatura|numeros, arquivo, arquivo_italico}] com caminhos relativos à RAIZ) e gera
`marketing/marca/tema.css` (variáveis `--cor-*` e `--fonte-*` + `@font-face`) e `marketing/marca/tema.json`.
Campos opcionais lidos para assinatura: `corretor` {nome, arroba, imobiliaria}. (`creci` existe como opcional, vazio por padrão, e nenhuma
peça mostra CRECI sozinha.) Sem `marca.json`: tema padrão grafite azulado e dourado. Fonte: arquivo da marca → fonte do motor →
Google Fonts (só se a marca citar uma família sem arquivo). **Rode de novo sempre que a marca mudar.**

## 3. Post e carrossel
```
copie modelos/post.html (ou carrossel.html) para marketing/pecas/AAAA-MM-DD-nome/ e escreva conteudo.json ao lado
node ferramentas/marketeiro/render.cjs --pagina marketing/pecas/AAAA-MM-DD-nome/carrossel.html --png
```
Sai `slide-01.png`, `slide-02.png`… na pasta da peça (os antigos com o mesmo nome são apagados antes). Tipos de tela e campos:
`blocos/BLOCOS.md`, seção "Post e carrossel". Qualquer `<section class="slide" data-w=".." data-h="..">` vira PNG, então dá para criar livre.

## 4. Vídeo de imóvel
```
node ferramentas/marketeiro/preparar-video.cjs --video marketing/pecas/<pasta>/entrada/<video> --peca marketing/pecas/<pasta> [--inicio 0 --duracao 45] [--prompt "nomes próprios do seu negócio, bairros"]
copie modelos/video-imovel.html para a pasta como video.html e escreva roteiro.json (modelos/roteiro.exemplo.json)
node ferramentas/marketeiro/render.cjs --pagina marketing/pecas/<pasta>/video.html --stills 2,5,9,13      (quadros para conferir, em <pasta>/stills/)
node ferramentas/marketeiro/render.cjs --pagina marketing/pecas/<pasta>/video.html --saida marketing/pecas/<pasta>/video.mp4 --celular
```
- **Só locução** (ela não aparece): `preparar-video.cjs --audio <mp3/m4a/wav/ogg> --peca <pasta>`. Não gera `pessoa/`; `meta.json` traz a
  duração do áudio e `so_audio: true`. O roteiro fica sem `pessoa` e a legenda vai para baixo sozinha.
- `preparar-video` gera em `trabalho/`: `audio.wav`, `audio.m4a`, `palavras.json` [{texto, inicio, fim}], `transcricao.txt`,
  `pessoa/000001.jpg…` (30 fps, 1080 de largura) e `meta.json`. **Leia `palavras.json` e corrija nomes** (ou use `correcoes` no roteiro).
  `--prompt` é uma dica de nomes próprios para o reconhecimento; às vezes ela atrapalha (sai quase nada) e então o script refaz sem ela
  sozinho e avisa em `aviso`. Na dúvida, rode sem `--prompt` e corrija os nomes depois. Tempo medido: 38 s de vídeo ≈ 2 min no total
  (quadros, áudio e reconhecimento de voz).
  O vídeo pode ter acento no caminho da pasta; o script contorna o limite do whisper.cpp com caminhos relativos.
- `render` (vídeo): usa o `trabalho/audio.m4a` da peça automaticamente (`--audio <arquivo>` para outro, `--sem-audio` para nenhum).
  MP4 H.264 yuv420p BT.709 + AAC, `-movflags +faststart`. `--celular` gera também `<saida>-celular.mp4` com até ~25 MB.
  Opções: `--de 10 --ate 15` (só um trecho, para testar), `--trabalhadores N` (padrão: metade dos núcleos, até 3), `--crf 18`.
- `--stills` sem números usa o meio de cada cena. `--capa 2.4` grava `capa.png` daquele instante (ou usa `window.renderCapa`, se a página tiver).
- `--servir` abre um endereço local para ver a página no navegador (`?t=5` mostra o instante 5 s). Ctrl+C fecha.
- Medido nesta máquina de teste (Intel i3 de 7ª geração, 2 núcleos): render de 38 s ≈ 3,5 min, versão de celular ≈ 1 min.

Contrato de uma página de vídeo (se for criar do zero): `window.PRONTO` (Promise), `window.DURACAO` (s), `async window.renderAt(t)`
desenha o quadro 1080×1920 (`window.FPS`, `window.QUADROS_CHAVE` opcionais). Os modelos fazem isso com `Blocos.publicar(filme)`.
A página é servida com raiz na RAIZ: use `/ferramentas/marketeiro/blocos/blocos.js` e `/marketing/marca/tema.css`; arquivos da peça
com caminho relativo (`roteiro.json`, `trabalho/...`, `fotos/...`).

## 4b. Referência de vídeo
```
node ferramentas/marketeiro/quadros.cjs --video <arquivo> --saida marketing/entrada/quadros-<nome> --n 6
```
Tira quadros espalhados pelo vídeo (`quadro-01.jpg`...) para o agente ler o estilo (skill `marketeiro-estilo`).

## 4c. O que é do corretor e o que é do módulo
Esta pasta (`ferramentas/marketeiro/`) é do módulo e é trocada a cada versão: não edite. Estilos e blocos criados para o corretor ficam em
`marketing/estilos/` e `marketing/blocos/` (servidos em `/marketing/...`), e a atualização não mexe neles.

## 5. Autoteste
```
node ferramentas/marketeiro/autoteste.cjs
```
Cria `marketing/pecas/_autoteste/` com `slide-01.png` e `video-teste.mp4` (3 s, sem pessoa, no tema) e confere tamanho, resolução e
duração. Saída `{ ok, mensagem, arquivos }`. Leva ~15 s. Gera o tema antes, se ainda não existir.

## Quando algo falha (o que dizer à corretora)
Use a `mensagem` do JSON; o `detalhe` é para você e para o suporte (anote em `sede/SUPORTE.md`, sem dado pessoal).

| Mensagem | O que fazer |
|---|---|
| "Não consegui abrir o Google Chrome nem o Microsoft Edge" | Peça para instalar o Chrome (google.com/chrome) e rode `instalar-motor.cjs` de novo. |
| "O ffmpeg … não está instalado" | `npm --prefix ferramentas/marketeiro install --omit=dev` e `instalar-motor.cjs`. Se o antivírus bloqueou o `ffmpeg.exe`, peça para liberar. |
| "Não consegui baixar …" | Internet instável ou bloqueada (rede da imobiliária). Tente de novo em outra rede. Posts e carrosséis funcionam sem o reconhecimento de voz. |
| "… precisa de um componente do Windows (Microsoft Visual C++ Redistributable)" | Rode `winget install -e --id Microsoft.VCRedist.2015+.x64` (o Windows pede permissão; explique à corretora) e `instalar-motor.cjs` de novo. |
| "O reconhecimento de voz não está instalado" | `instalar-motor.cjs`. Enquanto isso, dá para fazer o vídeo sem legenda (`"legenda": false`) ou escrever `palavras.json` à mão. |
| "Não achei a palavra … na fala" | O roteiro cita uma palavra que não está em `palavras.json`: troque por outra ou por segundos. |
| "A página não carregou: …" | Erro no `roteiro.json`/`conteudo.json` (vírgula, aspas, nome de arquivo). A mensagem diz qual arquivo. Abra com `--servir` para ver. |
| "Imagem não encontrada: …" | O arquivo não está na pasta da peça ou o nome está diferente (acento, maiúscula, extensão). |
| "O arquivo precisa estar dentro da pasta do agente" | Mova o material para `marketing/pecas/<pasta>/`. |
| Render muito lento | Feche programas pesados; teste um trecho com `--de/--ate`; `--trabalhadores 1` em computador com pouca memória. |

## Regras que o motor ajuda a cumprir (e que o agente confere)
- Nada vai ao ar sem o "sim" da corretora. O motor só grava arquivos na pasta da peça.
- Nenhum número inventado: metragem, preço, andares e distância vêm da ficha ou da fala; o mapa é ilustrativo.
- Imagem 3D, montada ou gerada leva "imóvel ilustrativo".
- Destaque sempre na **palavra inteira**.
- Sem registro profissional por padrão (CRECI, CREA, OAB...): só se a pessoa pedir. Com quem não é corretor, nunca fale de CRECI nem de imobiliária.
