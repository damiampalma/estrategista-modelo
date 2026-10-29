# Módulo marketing-proprio · versão 1.1.1 (26/10/2026)

**Para quem:** quem faz o próprio marketing no Instagram para vender o próprio serviço: engenheiro, arquiteto, consultor, clínica, terapeuta,
contador, qualquer autônomo ou pequeno negócio. (Corretor e advogado também podem ligar este módulo por cima do deles.)

**O que ela passa a poder pedir:**

| Skill | O que faz | Depende de ferramenta? |
|---|---|---|
| `semana-de-conteudo` | Toda semana, 3 posts (tema, texto da arte, legenda) a partir das dúvidas reais do cliente dela, prontos para aprovar em 5 minutos | Não |
| `pecas-no-canva` | Preenche os templates dela no Canva com os textos aprovados e explica como agendar pelo próprio Canva | **Sim: Canva conectado.** Sem ele, entrega os textos prontos para ela colar |
| `roteiros-reels` | A cada 15 dias, 4 a 6 roteiros de Reels de 30 s para gravar em lote | Não |
| `animacao-e-carrossel` | Carrossel em PNG e animação em MP4 pelo motor de criação, no tema da marca dela | **Sim: motor instalado** (`ferramentas/marketeiro`, só no computador ou em nuvem com navegador). Gasta o modelo forte |
| `leads-do-diagnostico` | Lê a planilha ou o formulário por onde o lead chega e escreve a primeira mensagem de cada lead novo | **Sim: Google Drive conectado** (só leitura). Sem ele, ela cola as respostas |
| `numeros-da-semana` | Toda sexta, os números do Instagram e dos leads, o que funcionou e um ajuste | Não (ela manda o print) |

**Onde guarda:** `marketing/` na raiz (pautas, semanas, reels, peças, números, leads só em contagem) e `sede/marketing/marca.json` (o kit de
marca dela, preenchido no bloco E). O motor de criação fica em `ferramentas/marketeiro/` na raiz (copiado por `completar-profissao`; instalado
por `conectar-ferramentas` com o "sim" dela).

**Regras que são dela, não do módulo:** o que a categoria dela permite dizer em público (conselho profissional, empresa), se cita registro
profissional nas peças, se usa foto de cliente ou de obra. O módulo nunca promete resultado, prazo ou preço e marca [VERIFICAR] em qualquer
número ou regra sem fonte; o resto é o que ela trouxe no bloco A.
**Nada de regra de corretor aqui (lição de 26/10, caso de um engenheiro).** O motor de peças (`ferramentas/marketeiro`) nasceu para corretora
de imóveis, e os documentos dele falam em "corretora", "imóvel", "imobiliária" e "CRECI". Leia como "a pessoa", "o produto ou serviço dela",
"a empresa dela" e "registro profissional". **Nunca** fale de CRECI, autorização de venda, exclusividade ou imobiliária com quem não é
corretor; registro profissional (CREA, CAU, OAB, CRM, CRC, CRECI...) só aparece numa peça se ela pedir.

**O que o módulo não faz:** não publica, não agenda, não envia mensagem a lead, não grava nome ou telefone de lead na sede, não gera imagem
de pessoa real por IA, não faz tráfego pago.
