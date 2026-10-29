# Módulos (a profissão entra por aqui)

O núcleo do Estrategista (`CLAUDE.md` e as skills de `.claude/skills/`) é um só e serve a qualquer profissão. O que muda de uma profissão
para outra fica em um **módulo**: uma pasta aqui dentro, que já vem no modelo e é ligada pela skill `completar-profissao` (no passo 3
da ativação, logo depois de ela dizer o que faz). Nada é baixado para ligar um módulo; é cópia dentro da própria pasta.

## O que é um módulo

```
modulos/<slug>/
  MODULO.md       o que o módulo faz, versão, para quem, o que depende de ferramenta conectada, as skills (uma linha cada)
  skills/         uma pasta por skill (SKILL.md com frontmatter name e description; references/ quando houver)
  PROCESSOS.md    os processos típicos da profissão, acrescentados ao fim de sede/PROCESSOS.md
  arquivos/       (opcional) cadernos de apoio copiados para sede/ sem sobrescrever (ex.: caderno de prazos, ficha de cliente)
  marketing/, ferramentas/   (só o marketing-proprio) copiados para a raiz, porque o motor de criação só roda de lá
```

## Como é ligado (resumo da skill `completar-profissao`)
1. `skills/*` → `.claude/skills/` (sem sobrescrever skill que já exista com o mesmo nome).
2. `PROCESSOS.md` → fim de `sede/PROCESSOS.md` (o arquivo do módulo já traz o título "## Módulo <slug>"; são propostas até ela confirmar).
3. `arquivos/*` → `sede/` (sem sobrescrever).
4. `sede/ESTADO.md` recebe "Módulos ligados: geral <versão>, <slug> <versão> (data)", com a versão de cada `MODULO.md`.

## Os módulos desta versão (1.1.0)

| Slug | Para quem | Skills |
|---|---|---|
| `geral` | qualquer profissão (liga sempre) | organizar-semana · responder-cliente · modelo-reutilizavel · preparar-reuniao |
| `corretor` | corretor ou corretora de imóveis | cadastro-de-imovel · captacao-oferta-ativa · estudo-de-mercado · cliente-lembrado |
| `advogado` | advogado ou advogada | prazos · clientes-e-processos · modelos-de-pecas · intimacoes-no-gmail |
| `marketing-proprio` | quem faz o próprio marketing no Instagram | semana-de-conteudo · pecas-no-canva · roteiros-reels · animacao-e-carrossel · leads-do-diagnostico · numeros-da-semana |

Profissão sem módulo: liga o `geral` e anota "módulo pedido" em `sede/ESTADO.md`. O pedido chega à EstrategistaLabs quando ela conta no
suporte (o Estrategista prepara a mensagem); quando o módulo sair, a skill `atualizar` avisa.

## Regras para quem escreve um módulo (EstrategistaLabs)
- Nome de skill único em todo o modelo (núcleo + módulos), para a cópia nunca colidir.
- Skill que só funciona com ferramenta conectada (Gmail, Canva, Drive) diz isso no `MODULO.md` e no próprio `SKILL.md`, e tem um caminho sem a
  ferramenta (ela cola, ela exporta).
- Nenhuma regra de categoria profissional imposta: o módulo oferece o caminho; o que vale é o que a pessoa trouxe no bloco A.
- Nada de nome, número ou caso de cliente real da casa dentro do módulo. Créditos de licença de material de terceiros ficam no frontmatter
  (`license`) da skill.
- Versão no `MODULO.md` (`versao: x.y.z`), e toda mudança publicada no `VERSAO.md` do repositório público da casa.
