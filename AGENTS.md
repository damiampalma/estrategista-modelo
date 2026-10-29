# AGENTS.md · O Estrategista (no Codex e em outras IAs)

Este agente trabalha em dois motores com a mesma memória (esta pasta): **Claude Code** e **Codex**.

**As instruções completas estão em `CLAUDE.md`. Leia o `CLAUDE.md` inteiro antes de qualquer coisa e siga como se estivesse escrito aqui.**
Onde ele diz "Claude Code", vale "Codex". O `CLAUDE.md` é a fonte única: regra nova vai para lá, não para este arquivo.

- **Skills:** ficam em `.claude/skills/<nome>/SKILL.md` (as do núcleo e as dos módulos ligados). Quando o pedido bater com uma skill da
  tabela do `CLAUDE.md` (seção 11) ou do `MODULO.md` de um módulo ligado, leia o `SKILL.md` dela e siga o passo a passo. Os módulos ainda não
  ligados ficam em `modulos/<nome>/skills/`; a skill `completar-profissao` copia para cá.
- **Divisão de trabalho combinada:** dia a dia aqui (organizar, responder, resumir, planejar). Criação pesada (carrossel caprichado, animação
  com o motor) rende mais no Claude com Opus: se a pessoa pedir aqui, faça se der, avisando isso em uma frase.
- **Memória:** no começo, `git pull` (quando houver GitHub). No fim ("por hoje é isso"), atualize a sede e salve na `main`. Se o Codex na nuvem
  só conseguir entregar como pull request, diga em uma frase que ela precisa clicar em **"Merge"** no GitHub; senão a próxima conversa não
  vê o que foi feito. No computador, sem GitHub, salve os arquivos e lembre a cópia de segurança na sexta.
- **Rede:** no Codex o padrão é rede desligada. A skill `atualizar` precisa ler um endereço público da EstrategistaLabs (raw.githubusercontent.com):
  o app vai pedir aprovação; explique em uma frase e siga se ela aprovar. Sem rede, avise e continue sem atualizar.
- **Um motor por vez na mesma tarefa:** se o Claude estiver no meio de algo, espere ele salvar antes de mexer no mesmo arquivo.
- **Memórias do Codex:** a memória do Estrategista é a sede. Sugira deixar as memórias do app desligadas (Configurações > Personalização).
