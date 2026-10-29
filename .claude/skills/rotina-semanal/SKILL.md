---
name: rotina-semanal
description: Fecha a semana com a pessoa: 3 linhas no diário, "o que dá para melhorar?" nas lições, pendências que ficaram, o que entra na próxima semana, conferência de versão do modelo (skill atualizar), a cópia de segurança quando a sede não está no GitHub e, se ela aceitou, um aviso de oportunidade. Use na sexta (ou no último dia de trabalho da semana dela), quando ela disser "fecha a semana", "o que dá para melhorar?", ou quando a rotina semanal agendada rodar.
---

# Rotina semanal (sexta)

Regra de ouro: **15 minutos, no máximo 12 linhas.** Primeiro o que ficou pendente, depois o que aprender, depois o que vem.

## Entradas
- `sede/ESTADO.md`, `sede/DIARIO.md` (a semana), `sede/LICOES.md`, `sede/PROCESSOS.md`, `sede/ROTINA.md`, `sede/OPORTUNIDADES.md`.
- O caderno do módulo que mede algo (ex.: `marketing/numeros.md`, `sede/PRAZOS.md`, placar do corretor), se existir.

## Passos
1. **A semana em 3 linhas** (feito · ficou · uma coisa boa), a partir do `DIARIO.md`. Grave as 3 linhas no `DIARIO.md` com a data.
2. **Pendências:** o que ficou aberto em `ESTADO.md` e nos cadernos do módulo (prazo não conferido, lead sem resposta, peça sem aprovação). Até 3,
   as mais urgentes primeiro.
3. **"O que dá para melhorar?"** Pergunte e espere. A resposta vira linha em `sede/LICOES.md`. Antes, mostre em até 4 linhas o que **você**
   aprendeu na semana (as lições novas) e o que vai fazer diferente. Lição repetida (a mesma correção 2 vezes) vira regra em `PERFIL.md` ou
   mudança no processo em `PROCESSOS.md`: proponha e grave só com o "ficou certo".
4. **Régua:** algum bloco da ativação ficou desatualizado (mudou ferramenta, rotina, prioridade)? Atualize `ESTADO.md`.
5. **Próxima semana:** 1 a 3 coisas, ligadas à prioridade dos 30 dias. Pergunte se concorda.
5b. **Um modo novo** (skill `modos`): se houver um modo ainda não ligado que resolva uma trava dela, sugira **um**, em uma frase, com o pedido
   pronto. Se ela recusar, anote em "Modos recusados" no `ESTADO.md` e não repita. Sem trava que case, pule.
6. **Versão:** rode a skill `atualizar` (confere em silêncio; só fala se houver novidade ou se a rede não alcançar).
6b. **Computador** (só se `ESTADO.md` disser "Computador: outro dia"): ofereça uma vez, com os prós e contras do passo 6 do fechamento da
   skill `ativacao`, e grave a resposta. Se ela disser não, mude para "não" e não ofereça de novo.
7. **Cópia de segurança** (só quando a sede não está no GitHub): "Copie a pasta inteira para o pendrive ou HD externo." Anote a data no `ESTADO.md`.
   Se a última cópia tiver mais de 14 dias, repita em uma frase.
8. **30 dias:** se a data de início em `ESTADO.md` já passou de 30 dias e você ainda não perguntou: "Seus 30 dias de ajuste acabaram. O que mudou
   no seu trabalho?" Grave em `DIARIO.md`, ofereça preparar a frase para contar à EstrategistaLabs (link do suporte, seção 10 do `CLAUDE.md`) e marque no `ESTADO.md` que perguntou.
9. **Oportunidade** (só se `OPORTUNIDADES.md` disser "ligado" e houver trava dela com solução no catálogo ainda não oferecida): uma frase, pela
   skill `oportunidades`. Senão, nada.
10. Atualize `ESTADO.md` e salve (seção 3 do `CLAUDE.md`).

## Quando roda sozinha (rotina agendada)
- Só lê, resume e deixa as perguntas 3 e 5 escritas para ela responder quando abrir. Não envia nada, não cria evento, não baixa atualização
  (a skill `atualizar` só avisa).

## Saída
- Resumo de até 12 linhas na conversa; `DIARIO.md`, `LICOES.md` e `ESTADO.md` atualizados e salvos.
- Status: pronto · parcial (o que não foi possível ler) · bloqueado (motivo).

## Limites
- Não invente número nem pendência que não esteja na sede ou nas ferramentas conectadas.
- Sem bronca por semana sem uso: retome em 2 linhas e siga.
