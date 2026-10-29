---
name: completar-profissao
description: Liga o módulo da profissão dela dentro desta sede. Identifica a profissão (do passo 3 da ativação ou do bloco B), mapeia para o módulo certo em modulos/, copia as skills para .claude/skills/, acrescenta os processos do módulo a sede/PROCESSOS.md, copia os arquivos de apoio e registra em sede/ESTADO.md. Use no passo 3 da ativação (depois de "o que você faz?"), quando a profissão mudar no bloco B, quando ela pedir outro módulo ("liga o de marketing") ou quando a skill atualizar trouxer um módulo novo.
---

# Completar profissão (ligar um módulo)

Um módulo é uma pasta em `modulos/<slug>/` com `MODULO.md` (o que faz, versão, o que depende de ferramenta conectada), `skills/`,
`PROCESSOS.md` e, às vezes, `arquivos/` (cadernos de apoio que vão para `sede/`). Ligar é copiar para onde você lê. Nada sai da pasta.

## 1. Identificar a profissão e o módulo

| Ela disse (na ativação ou depois) | Módulos a ligar |
|---|---|
| `corretor`, corretor ou corretora de imóveis | `geral` + `corretor` |
| `advogado`, advogado ou advogada | `geral` + `advogado` |
| `marketing-proprio`, engenheiro ou engenheira, arquiteto, consultor, clínica ou qualquer um que diga "faço meu próprio marketing no Instagram" | `geral` + `marketing-proprio` |
| `geral`, médico, nutricionista, contador, psicólogo, qualquer outra | `geral` e anotar "módulo pedido: <profissão>" |

O `geral` liga sempre: é a base para qualquer profissão. Um módulo já ligado não liga de novo (confira em `sede/ESTADO.md`). Ela pode pedir
mais de um ("sou corretora e faço meu próprio marketing"): ligue os dois.
Corretora que grava vídeo ou quer vídeo de imóvel animado (skill `video-de-imovel`): ligue também o `marketing-proprio`, que traz o motor
de criação.

Se a profissão não estiver clara, pergunte em uma frase: "Para eu ligar o módulo certo: como você descreve a sua profissão em 2 ou 3 palavras?"

## 2. Ligar (para cada módulo, nesta ordem)

1. Leia `modulos/<slug>/MODULO.md`. Anote a versão.
2. **Skills:** copie cada pasta de `modulos/<slug>/skills/` para `.claude/skills/` (`.claude/skills/<nome-da-skill>/SKILL.md`, com as
   subpastas `references/` quando houver). Se já existir uma skill com o mesmo nome em `.claude/skills/`, não sobrescreva: avise em uma linha e
   mantenha a que está.
3. **Processos:** acrescente o conteúdo de `modulos/<slug>/PROCESSOS.md` ao **fim** de `sede/PROCESSOS.md` (o arquivo do módulo já traz o
   título; não repita). Essas linhas são propostas: só valem como rotina dela depois de ela confirmar.
4. **Arquivos de apoio:** se existir `modulos/<slug>/arquivos/`, copie o conteúdo para `sede/` respeitando as subpastas, **sem sobrescrever** o que
   já existir (um caderno que ela já preencheu nunca é apagado).
5. **Só para `marketing-proprio`:** copie `modulos/marketing-proprio/marketing/` para `marketing/` (na raiz) e
   `modulos/marketing-proprio/ferramentas/marketeiro/` para `ferramentas/marketeiro/` (na raiz). O motor de criação só funciona na raiz, por
   causa de como ele acha a pasta. Não instale nada agora: a instalação é da skill `conectar-ferramentas`, no computador dela.
6. Registre em `sede/ESTADO.md`, com a versão de cada `MODULO.md`: "Módulos ligados: geral 1.1.0, corretor 1.1.0 (data)". Profissão sem módulo: "Módulo pedido: nutricionista (data)".
7. Salve (seção 3 do `CLAUDE.md`).

## 3. Avisar (uma frase)

- Com módulo: "Liguei o módulo de corretor de imóveis: agora eu sei cadastrar imóvel, montar a lista de captação, fazer estudo de mercado,
  lembrar você dos clientes e montar vídeo de imóvel animado." (use o resumo do `MODULO.md`).
- Sem módulo: "Ainda não tenho um módulo de nutricionista. Trabalho com o geral (organizar a semana, responder cliente, preparar reunião, criar
  modelos). Anotei o seu pedido; se quiser que a EstrategistaLabs saiba, eu preparo a mensagem para o suporte." Repita o "módulo pedido" na próxima
  entrega de trabalho, uma vez, e nunca mais insista.
- Se o `MODULO.md` disser que alguma skill depende de ferramenta conectada (Gmail, Canva, Drive), diga isso agora em meia frase e deixe para
  conectar quando a tarefa pedir (skill `conectar-ferramentas`).

## Limites
- Não edite as skills dentro de `modulos/`: elas são o original e a skill `atualizar` as troca de versão. Ajuste fino do jeito dela vai para
  `sede/LICOES.md`.
- Não ligue módulo que ela não pediu nem que a profissão não indica. Pedir módulo é com ela.
- Se a cópia falhar por permissão ou caminho, tente uma vez; depois anote em `sede/SUPORTE.md` e siga com as skills do núcleo.
