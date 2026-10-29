---
name: conectar-ferramentas
description: Guia a pessoa, um passo por vez e por motor (Claude na nuvem ou no computador, Codex no computador ou na nuvem), para ligar Gmail, Google Agenda, Google Drive, Canva ou outra ferramenta ao Estrategista, criar uma rotina (só com o sim), usar pelo celular e instalar o motor de criação, registrando tudo em sede/FERRAMENTAS.md. Use quando ela quiser conectar algo, agendar uma rotina, quando outra skill precisar de um conector que ainda não está ligado, ou quando algo não aparecer no app dela.
---

# Conectar ferramentas

Regra: **uma conexão por vez, sempre ligada a uma necessidade dela**, um passo por mensagem, esperando o "feito" antes do próximo.
Ela digita senhas e códigos; você nunca pede e nunca vê. Nomes de menu mudam e podem estar em inglês: descreva o que procurar; se não achar,
diga isso e anote em `sede/FERRAMENTAS.md` em vez de inventar o caminho.

## Antes de conectar qualquer coisa
1. Diga o que ela ganha em uma frase e o que você vai poder ver.
2. Lembre a regra: com a conexão você **lê e rascunha**. Alguns conectores conseguem enviar (o do Gmail envia, responde e encaminha, pedindo
   aprovação a cada envio), mas a regra daqui é mais dura: enviar, aceitar convite ou criar evento com outras pessoas só com o "sim" dela na
   conversa, depois de ver destinatário e texto final.
3. Depois de conectar, teste com uma tarefa pequena (abaixo) e anote em `sede/FERRAMENTAS.md` (ferramenta, motor, data, teste).

## Onde se liga, por motor

| Motor | Onde ficam os conectores | Observação |
|---|---|---|
| Claude na nuvem (claude.ai/code) | claude.ai > Configurações > Conectores: ligar o conector e depois liberar nesta sessão (ou na rotina) | Vale também no app do celular |
| Claude no computador (app Claude Code) | Mesma conta: Configurações > Conectores no claude.ai; o app usa os mesmos | |
| Codex no computador (app ChatGPT) | Aba **Plugins** do app > buscar a ferramenta > instalar > entrar com a conta > **novo chat** | Celular: Configurações > Connections > "Control this PC" (QR code) |
| Codex na nuvem (chatgpt.com/codex) | Conectores da conta ChatGPT, quando disponíveis para o ambiente | Alguns não existem lá: anote e siga |

## Ferramentas

| Ferramenta | O que libera | Teste pequeno |
|---|---|---|
| Gmail | Ler e rascunhar e-mail (enviar só com o "sim"); no módulo advogado, procurar intimações | "Resuma os e-mails não lidos de hoje, só remetente e assunto" |
| Google Agenda | Ver compromissos, rascunhar evento (criar só com o sim) | "O que tenho na agenda esta semana?" |
| Google Drive | Achar modelos e planilhas; no módulo marketing-proprio, ler a planilha de leads (só leitura) | "Ache o arquivo X e me diga só o cabeçalho" |
| Canva | Copiar templates dela e trocar textos (nunca editar o original) | Listar os designs e achar os templates que ela usa |
| Outlook (e-mail e agenda) | Igual ao Gmail e à Agenda, para quem usa Microsoft | "Quais reuniões tenho amanhã?" |
| Sistema da profissão (CRM, software jurídico, prontuário) | Só se houver conector oficial; senão, ela cola ou exporta | Ler um registro de teste, sem dado real na conversa |
| ElevenLabs (voz e imagem) | Locução com a voz clonada dela (o clone ela cria no site deles) e imagem, para o modo diretor de animação e o modo designer. **Plano pago à parte**, gasta créditos: mostre o custo antes de gerar | "Liste as minhas vozes" (sem gerar nada) |
| WhatsApp e Instagram | **Não se conectam.** Você prepara o texto; ela envia ou publica | |

## Rotina (só com o "sim" dela)
1. Explique: na nuvem roda sem computador ligado; no computador roda com o app aberto; **gasta o limite do plano**. Sugestão: começar com uma
   só, semanal (ex.: segunda, 7h).
2. **Claude na nuvem:** ela cria em claude.ai/code (agendamento de tarefas na nuvem), neste repositório, com os conectores necessários ligados
   na rotina, e um texto como: "Leia o CLAUDE.md. Rode a skill <nome> (sem publicar nem enviar nada). Salve tudo no GitHub na main e termine
   com um resumo de 3 linhas."
3. **Codex no computador:** ela pede no chat "Crie uma tarefa agendada, <dias e hora>, que roda a skill <nome> neste projeto" e confere na aba
   **Scheduled**. Computador ligado e app aberto no horário.
4. **Claude no computador:** tarefa agendada do app, se existir na versão dela; senão, lembrete na agenda dela para abrir e pedir.
5. Anote em `sede/ROTINA.md` (rotina, horário, motor, data do "sim"). Na primeira vez que rodar, confira com ela se saiu certo. Leia os 3
   primeiros resultados juntos antes de criar outra.

## Celular
- **Claude:** app Claude, aba **Code**: ela vê e conversa com as mesmas sessões. Bom para aprovar coisas.
- **Codex:** no computador, Configurações > Connections > "Control this Mac or PC" > QR code; no celular, app ChatGPT > Codex > escolher o
  computador (precisa ficar ligado).

## Navegador (modo navegador, só no computador)
- **Claude:** extensão **Claude in Chrome**, num plano pago do Claude, no Google Chrome do computador (não roda no celular nem na nuvem). Ela
  instala a extensão pela loja do Chrome e entra na **mesma conta** do Claude; no app, ela liga o Chrome nas configurações da conversa ou você
  pede com `/chrome`. Recomende um perfil separado do Chrome só para isso.
- **Codex:** a extensão do ChatGPT para o navegador, a partir do app do computador. No Codex na nuvem não há navegador.
- Teste pequeno: abrir um site em que ela confia e ler o título da página, sem clicar em nada.
- Regras: ela digita login e senha; "permitir uma vez"; nunca banco, investimento, saúde, gov.br ou portal com certificado digital; antes de
  salvar, enviar ou comprar, mostre e espere o "sim".

## Motor de criação (módulo marketing-proprio, só no computador ou em nuvem com navegador)
0. Confira `node --version`: o motor precisa do **Node.js 20 ou mais novo**. Se faltar ou for antigo, explique em uma frase (programa grátis de
   que o motor precisa), peça o "sim" e guie ela a instalar a versão LTS em nodejs.org. Depois feche e abra o app de novo.
1. `npm --prefix ferramentas/marketeiro install --omit=dev` e `node ferramentas/marketeiro/instalar-motor.cjs`.
2. `node ferramentas/marketeiro/autoteste.cjs` (gera 1 post e 1 vídeo de 3 s).
3. Se falhar por falta de navegador ou ffmpeg na nuvem: anote em `sede/FERRAMENTAS.md` e diga que a criação animada roda no computador por
   enquanto. Posts e carrosséis em PNG costumam funcionar sem o reconhecimento de voz; o whisper só é necessário para vídeo com fala dela.

## Cuidados
- E-mail e mensagem de cliente são sigilosos: não copie inteiro para a sede; resuma onde o módulo manda.
- Navegador com extensão: age como ela, nos sites em que está logada. Prefira "permitir uma vez". Nunca "permitir em todos os sites".
- Não conecte conta de cliente nem conta compartilhada da empresa sem ela confirmar que pode.
- Se o recurso não existir no app dela (plano, região, versão): não invente outro caminho. Anote em `sede/FERRAMENTAS.md` ("não apareceu") e,
  se travar a tarefa, em `sede/SUPORTE.md`, com o resumo e o link do suporte (seção 10 do `CLAUDE.md`).

## Saída
- `sede/FERRAMENTAS.md` atualizado (o que conectou, motor, data, teste feito, o que não apareceu).
- Status: pronto (teste passou) · parcial (conectou sem teste) · bloqueado (não aparece no app: anotar plano, região, versão).
