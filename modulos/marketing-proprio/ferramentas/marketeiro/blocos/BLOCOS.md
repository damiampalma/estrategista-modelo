# Blocos de cena · guia para o agente

Biblioteca de cenas do vídeo de imóvel (Reels 1080×1920, 30 fps) e das peças estáticas (post e carrossel 1080×1350).
Tudo é **determinístico**: cada quadro é função do tempo `t`. Nada de `transition`, `animation`, `setTimeout` ou relógio na página;
o render pede `renderAt(t)` quadro a quadro.

Arquivos: `blocos.js` + `blocos.css` (vídeo), `pecas.js` + `pecas.css` (post e carrossel). Cores e fontes vêm do tema da
corretora (`/marketing/marca/tema.css`, gerado por `tema.cjs`); nunca escreva cor fixa numa peça, use as variáveis.

## O formato (referência que o Damiam escolheu)

- **No começo** a corretora aparece em tela cheia; logo depois do gancho o vídeo dela **encolhe para um cartão** na metade de baixo.
- **Metade de cima:** motion design no tema dela, entrando **na palavra exata** em que ela fala (nome do empreendimento, número que
  conta, planta que vira 3D, prédio subindo, mapa com rota, cômodos, preço, fotos, chamada).
- **Legenda falada** grande, palavra por palavra, na divisa entre o grafismo e o cartão.
- **Faixas livres:** nada importante nos 220 px de cima nem nos 380 px de baixo (interface do Instagram). O grafismo vive entre
  y 236 e y ~900; a legenda fica logo acima do cartão (y ~975); o cartão vai de y 1010 a 1880.

## Como montar um vídeo

1. `preparar-video.cjs` gera `trabalho/palavras.json`, `trabalho/meta.json`, `trabalho/pessoa/*.jpg` e o áudio.
2. Copie `modelos/video-imovel.html` para a pasta da peça como `video.html` e escreva `roteiro.json` (exemplo: `modelos/roteiro.exemplo.json`).
3. Quadros-chave para conferir: `render.cjs --pagina <peca>/video.html --stills 2,5,9,...` (ou só `--stills`, que usa o meio de cada cena).
4. Render final: `render.cjs --pagina <peca>/video.html --saida <peca>/video.mp4 --celular`.

### roteiro.json

```json
{
  "pessoa":  { "foco": [0.5, 0.4], "modos": [{ "t": 0, "modo": "cheia" }, { "t": 1.5, "modo": "cartao" }] },
  "legenda": { "correcoes": { "erre jota": "RJ" }, "maxPalavras": 3 },
  "cenas":   [ { "bloco": "fundo", "estilo": "liso", "inicio": 0, "fim": 40 }, { "bloco": "numero", "inicio": "@oitenta", "fim": 9, "valor": 84, "unidade": "m²" } ]
}
```

- `duracao` (opcional): sem ela, vale a duração do vídeo ou da locução da corretora (`meta.json`).
- `pessoa` (opcional: sem ela o vídeo não tem cartão). `legenda: false` desliga a legenda.
- **Só locução** (ela não aparece): prepare com `preparar-video.cjs --audio <arquivo>` e deixe o roteiro sem `pessoa`. A tela inteira é do
  grafismo (de y 236 a ~1380) e a legenda vai para baixo sozinha (base em y 1500).
- A ordem das cenas é a ordem de empilhamento dentro da mesma camada (a de baixo na lista fica por cima).

### Tempo preso à fala

Todo `inicio`, `fim`, `t`, `contarEm` etc. aceita segundos (`4.2`) ou uma palavra de `palavras.json`:

| Escrita | Significa |
|---|---|
| `"@dezoito"` | início da 1ª vez que ela fala "dezoito" (sem diferença de acento e maiúscula) |
| `"@dezoito#2"` | início da 2ª vez |
| `"@setenta e dois"` | início da sequência de palavras |
| `"@dezoito+0.3"` / `"@dezoito-0.2"` | com deslocamento em segundos |
| `"fim:dezoito"` | fim da palavra |

Se a palavra não existir na fala, a página para com a mensagem "Não achei a palavra…": corrija o roteiro (ou a palavra em `palavras.json`).

### Parâmetros comuns a todos os blocos

| Parâmetro | Padrão | O que faz |
|---|---|---|
| `inicio`, `fim` | 0, fim do vídeo | quando o bloco aparece e some |
| `entrada`, `saida` | 0,6 s · 0,45 s | duração da entrada e da saída (0 = corte seco) |
| `camada` | depende do bloco | `fundo`, `cena`, `pessoa`, `legenda`, `sobre` (de baixo para cima) |
| `opacidade` | 1 | transparência fixa do bloco (ex.: planta atrás do preço) |
| `classe` | | classe CSS extra, para estilizar livre |

## Blocos de vídeo

### `fundo`
`estilo`: `liso` (tema com luz suave e grade discreta) ou `cidade` (céu noturno com prédios e janelas acesas).
`cidade`: `horizonte` (960), `subida` (60 px de câmera subindo ao longo do bloco), `deriva` (40 px de lado), `semente`, `veu` (true: escurece topo e esquerda para o texto respirar).
`grao` (0,05), `grade` (true), `luz` (cor da luz do topo). Use um `fundo liso` do início ao fim e outros fundos por cima quando quiser.
**Troca de fundo sem pulo:** o fundo que sai termina ~0,7 s **depois** do início da cena seguinte (que entra esmaecendo por cima dele),
por exemplo `cidade` até 9,9 s com o `mapa` começando em 9,2 s.

### `pessoa` (o cartão; vem do bloco `pessoa` do roteiro)
`modos`: lista `{t, modo}` com `cheia`, `cartao` ou `oculta`; a troca leva `transicao` (0,75 s) com suavização.
`foco` [x, y] (0 a 1) = onde está o rosto no vídeo; `alvoY` (0,45) = altura do rosto dentro do cartão; `zoom` (1); `cartao` {x, y, w, h, raio}
(padrão 40, 1010, 1000, 870, 44); `deslocamento` (s, se o vídeo precisa começar mais adiante); `quadros` (pasta, padrão `trabalho/pessoa`).

### `legenda` (vem do bloco `legenda` do roteiro)
Lê `trabalho/palavras.json`. Grupos de até `maxPalavras` (3) e `maxLetras` (22); quebra em pontuação e em pausa maior que `pausa` (0,55 s).
Cada palavra entra quando é falada. `correcoes` {"errado": "certo"} (uma palavra por vez; para nomes compostos corrija `palavras.json`),
`ocultar` ["né", "tipo"], `tamanho` (68), `caixaAlta`, `y` (base da legenda, fixa; sem ele acompanha o cartão, e sem pessoa fica em 1500),
`segura` (0,7 s depois da última palavra).

### `cabecalho` (fica fixo no topo enquanto o imóvel está na tela)
`rotulo` ("RESIDENCIAL"), `titulo` (nome, aceita `*destaque*`), `selo` ("imóvel ilustrativo"), `direita` {valor, unidade, rotulo, inicio, fim}
(ex.: "84 m²" que aparece no canto quando a planta cresce), `x` (60), `y` (238).

### `titulo` (abertura)
`icone`, `antes` (frase pequena acima), `rotulo`, `titulo` (letra por letra), `sub`, `y` (300), `tamanho` (150), `caixaAlta` (dourado em gradiente),
`alinhamento` (`centro` | `esquerda`), `tamanhoIcone`, `entrada` (1,2 s).

### `numero` (número que conta)
`valor` e `de` (0), ou `marcos` [{t, valor}] para contar em degraus (03 → 13 → 18) presos à fala; `contarEm`, `contagem` (1,1 s),
`casas` (zeros à esquerda), `decimais`, `prefixo` ("R$"), `unidade` ("m²", "min"), `rotulo` ("POR DENTRO"), `icone` (antes do rótulo),
`local` + `localEm` (linha com pin: "Batel, Curitiba"), `linha` (régua dourada, true), `x` (60), `y` (430), `tamanho` (210),
`alinhamento` (`esquerda` | `direita` | `centro`).

### `planta` (nasce em linha, ganha cor, vira 3D isométrica)
`imagem`: planta do imóvel (PNG/JPG; planta humanizada colorida fica melhor; fundo transparente, melhor ainda).
O motor acha as **paredes** sozinho (traços escuros e grossos), recorta pela caixa das paredes e as levanta em 3D.
Fases: `linha` [a, b] (desenho técnico com varredura), `cor` [a, b] (planta colorida), `ergue` [a, b] (inclina e levanta as paredes);
sem elas, 0–1,3 s, 1,1–2,1 s e 1,5–2,9 s após o início. `modo: "pronta"` já entra em 3D.
`x`, `y`, `largura` (centro e largura na tela; padrão 710, 650, 560) e `poses` [{t, x, y, largura}] para mover (ex.: crescer para o centro).
`giro` (20°), `inclinacao` (50°), `alturaParede` (0,06 da largura), `espessura` (laje, 0,035), `deriva` (giro lento, 1,5°).
`etiquetas` [{nome, area, x, y, inicio, fim}] com x/y de 0 a 1 sobre a planta recortada.
Ajustes se as paredes saírem erradas: `limiar` (85: até que brilho é parede), `espessuraMinima` (0,0045), `paredes: false` (sem 3D),
`limiarBorda` (26: traços finos do desenho), `corParede`, `corPlaca`, `corLinha`.

### `predio` (prédio subindo andar por andar)
`andares`, `marcos` [{t, andar}] (combine com um `numero` de mesmos marcos), `x` (760), `base` (935), `topo` (300), `largura` (230),
`profundidade` (120), `acesas` (0,62 das janelas), `semente`, `coroa` (luz no topo), `contagem`.
Fica bonito sobre `fundo` `cidade`.

### `mapa` (mapa estilizado com rota)
Grade de quadras em unidades de quadra: ruas nas linhas inteiras (x = 0, 1, 2…; y = 0, 1, 2…), quadra (i, j) entre elas.
`ruas` [{nome, eixo: "h"|"v", em}] (largas e com nome), `pin` [x, y] (imóvel, ex.: [1.5, 1.5] = meio de uma quadra),
`destino` {em, nome, icone: metro|tubo|onibus|parque|mercado|escola}, `rota` [[x, y]…] (sem ela: sai do pin, vai pela rua e chega ao destino),
`pinEm`, `rotaEm` [a, b], `tempo` {valor, unidade, rotulo, icone} (o "4 min a pé" à esquerda), `giro` (-9°), `zoom` [1, 1.1],
`celula` (190 px), `enquadrar` (caixa onde pin, rota e destino devem caber; `false` desliga), `semente`.
O mapa é **ilustrativo** (não é o mapa real da cidade): confira o tempo de deslocamento num mapa de verdade antes de usar o número.

### `etiqueta`
Pílula avulsa: `nome`, `valor` (aceita `*destaque*`), `icone`, `x`, `y` (centro), `ancora` [x, y] (linha até um ponto).

### `preco`
Etiqueta de preço que conta: `valor`, `de` (início da contagem), `rotulo` ("A PARTIR DE"; "" esconde), `moeda` ("R$"), `nota`
("imóvel ilustrativo", condições), `contarEm`, `contagem` (1,4 s), `arredondar` (1000), `x`, `y` (centro), `largura` (640),
`fioX`, `fioAltura` (o fio dourado). Preço só com autorização da corretora para divulgar.

### `galeria`
Fotos reais com movimento lento e troca por cortina: `fotos` [{arquivo, legenda, foco}] ou só nomes de arquivo, `area` {x, y, w, h},
`porFoto` (padrão: divide o tempo), `contador` (01 / 03).

### `fecho`
Chamada final: `rotulo`, `chamada` (aceita `*destaque*`), `botao`, `iconeBotao`, `arroba`, `nome`, `imobiliaria`, `logo`, `y` (300).
`creci` existe só como campo opcional (serve para qualquer registro profissional: CRECI, CREA, OAB...): fica **vazio e escondido por
padrão** e só aparece se a pessoa pedir. Com quem não é corretor, nunca mencione CRECI.

### `faixa` e `selo`
`faixa`: tira com palavras correndo; `itens`, `y` (1470), `velocidade` (70 px/s). Cuidado com a legenda e com as faixas do Instagram.
`selo`: `estilo` `pilula` (padrão) ou `redondo` (texto girando em círculo, `graus` por segundo); `texto`, `icone`, `x`, `y`.

### `html` (criação livre)
`html` (qualquer HTML), `x`, `y`, `w`, `h`, `estiloCss`, `cascata` (cada filho entra em sequência), `deslocamento` (26 px de subida).
Use as classes `mk-rotulo`, `mk-serifa`, `mk-numeros`, `mk-d` e as variáveis `--cor-*` e `--fonte-*`.

## Criar um bloco novo

```js
class MeuBloco extends Blocos.Bloco {
  constructor(filme, p, tipo) { super(filme, p, tipo, 'cena'); this.caixa = Blocos.el('div', 'meu'); this.el.appendChild(this.caixa); }
  async preparar() { /* carregar imagens: await Blocos.carregarImagem(this.f.url(this.p.imagem)) */ }
  desenhar(t, v) { this.mover(this.caixa, v.pin, v.pout); /* v.local = segundos desde o início; v.vis = 0..1 */ }
}
Blocos.registrar('meuBloco', MeuBloco);
```
Registre antes de `montarDeRoteiro` (num `<script>` no `video.html`), ou depois use `await filme.adicionarPronto('meuBloco', {...})`.
**Bloco que deu certo e vale reusar:** salve em `marketing/blocos/<nome>.js` (e `.css`), com 3 linhas de uso no topo, e carregue com
`<script src="/marketing/blocos/<nome>.js"></script>`. Essa pasta é do corretor: a atualização do módulo não mexe nela (skill `marketeiro-evolucao`).
Estes blocos são o ponto de partida: qualquer cena que dê para desenhar em HTML ou Canvas vale (skill `marketeiro-estilo`).
Utilitários em `Blocos.util`: `prog`, `ease.sai|suave|saiForte|volta`, `lerp`, `mix`, `rgba`, `marcar` (destaque), `icone`, `aleatorio(semente)`.
Ícones: `pe, metro, onibus, tubo, parque, pin, sol, araucaria, predio, chave, casa, instagram, mensagem, carro, cama, area, mercado, escola, seta, calendario`.

## Post e carrossel (`pecas.js`)

`modelos/post.html` (1 tela) e `modelos/carrossel.html` (até 10) leem `conteudo.json` (exemplo: `modelos/conteudo.exemplo.json`).
Cada tela de `slides` tem um `tipo`:

| Tipo | Campos |
|---|---|
| `capa` | `rotulo`, `titulo`, `sub`, `foto` (opcional, ocupa a tela), `focoFoto`, `selo`, `arraste` |
| `texto` | `numero` ("01"), `rotulo`, `titulo`, `texto` |
| `lista` | `rotulo`, `titulo`, `itens` (até 6) |
| `numero` | `rotulo`, `valor`, `unidade`, `titulo`, `texto`, `fonte` (de onde veio o número) |
| `foto` | `foto`, `legendaFoto`, `rotulo`, `titulo`, `texto`, `estilo: "cheia"` (foto na tela toda) |
| `imovel` | `foto`, `rotulo`, `nome`, `selo`, `ficha` [[valor, rótulo, ícone]…] (até 4), `preco`, `precoRotulo` |
| `citacao` | `texto`, `autor` (só com autorização) |
| `fecho` | `rotulo`, `titulo`, `texto`, `botao`, `iconeBotao`, `arroba`, `linha` |

Comuns: `claro: true` (fundo marfim), `semPaginacao`. No topo do arquivo: `formato` ("1080x1350"), `assinatura` {arroba} (padrão: o @ do tema).
`*palavra*` = destaque em itálico na cor da marca, **sempre a palavra inteira** (se o asterisco cair no meio, o motor estende até a palavra
inteira). `**texto**` = negrito. O título se ajusta sozinho ao espaço. Margem de 96 px, texto principal de 44 px.
Tela livre: qualquer `<section class="slide" data-w="1080" data-h="1350">` na página vira PNG.

## Regras de qualidade (conferir nos stills)
- Texto fora dos 220 px de cima e dos 380 px de baixo; nada encostando nas bordas (60 px no vídeo, 96 px no post).
- Legenda legível no celular; o rosto da corretora visível no cartão (ajuste `foco` e `alvoY`).
- Todo número veio da ficha ou da fala; preço só autorizado; imagem 3D ou montada leva "imóvel ilustrativo".
- Movimento suave: nada pula; uma ideia por cena; troca de cena na palavra certa.
