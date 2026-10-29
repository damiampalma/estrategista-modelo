# Módulo corretor · versão 1.2.0 (29/10/2026)

**Para quem:** corretor ou corretora de imóveis, autônomo ou de imobiliária, qualquer cidade.

**O que ela passa a poder pedir:**

| Skill | O que faz | Depende de ferramenta? |
|---|---|---|
| `cadastro-de-imovel` | Transforma o material da captação (fotos, áudio, anotações, documentos) numa ficha completa no padrão do **sistema da imobiliária dela**, perguntando só o que falta, e escreve o texto do anúncio em duas versões (factual e no jeito dela) | Não. Precisa do **mapa de campos** do sistema dela, feito uma vez (`sede/imoveis/campos-do-sistema.md`). Salvar no sistema: ela, ou o navegador com ela olhando |
| `captacao-oferta-ativa` | Lista diária de oportunidades de captação no recorte dela, com ficha, motivo concreto e mensagem no método de oferta ativa, e a cadência de follow-up | Não. Precisa do método dela gravado (`sede/captacao/metodo.md`) e da lista "não contatar" |
| `estudo-de-mercado` | Comparáveis com fonte e memória de cálculo para ela decidir o preço de anúncio com o proprietário. Não é PTAM | Não. Fontes que ela pode usar (portais, base da imobiliária) |
| `cliente-lembrado` | Acompanhamento de compradores e proprietários: quem está esperando resposta, próximo contato, rascunho da mensagem de retomada | Não. Agenda e Gmail opcionais; CRM da imobiliária só se houver conector oficial |
| `video-de-imovel` | Vídeo de imóvel com animação premium, palavra a palavra (metragem que conta, planta, mapa com rota, preço, fotos, chamada), com ela falando num cartão, só com a voz dela ou com fotos | **Sim: o motor de criação** do módulo `marketing-proprio` (computador, ou nuvem com navegador). Gasta o modelo forte. No celular ela recebe o roteiro; o render acontece no computador |

**Onde guarda:** `sede/imoveis/` (ficha por imóvel, mapa de campos, regras da imobiliária), `sede/captacao/` (método, listas do dia, não
contatar), `sede/clientes/acompanhamento.md` (follow-up, com primeiro nome e canal; dados completos ficam no CRM dela). Nada disso vai para
post, anúncio ou conversa com terceiros.

**Regras que são dela, não do módulo:** CRECI, autorização de venda, exclusividade, uso das plataformas da imobiliária, texto de resposta a
"onde conseguiu meu contato?". O módulo **pergunta uma vez** o que vale (bloco A da ativação ou na primeira tarefa), grava em
`sede/imoveis/regras-da-imobiliaria.md` e segue o que ela trouxe. Nenhuma regra é imposta por aqui.

**O que o módulo não faz:** não publica em portal, não salva no sistema sem o "sim", não envia mensagem a proprietário ou comprador, não
inventa preço, metragem ou comparável, não consulta dado de proprietário em plataforma (isso é ela).
