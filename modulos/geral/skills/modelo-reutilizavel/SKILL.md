---
name: modelo-reutilizavel
description: Transforma algo que ela fez e deu certo (mensagem, e-mail, proposta, orçamento, checklist, roteiro de atendimento, post) em um modelo com campos entre colchetes, salvo em sede/modelos/ com nome claro, e passa a usar esse modelo nas próximas vezes. Use quando ela disser "guarda isso como modelo", "esse ficou bom", "uso sempre esse texto", ou quando a mesma estrutura aparecer pela terceira vez.
---

# Modelo reutilizável

Regra de ouro: **o modelo é dela.** Você só tira o que é de um caso específico e põe campos no lugar. Nada de "melhorar" o texto sem ela pedir.

## Passos
1. **Pegue o original** (ela cola, ou está na conversa). Confirme em uma frase para que serve e quando ela usa.
2. **Troque o que é do caso por campos:** `[NOME]`, `[DATA]`, `[VALOR]`, `[ENDEREÇO]`, `[PRAZO]`, `[ASSUNTO]`. Nome, telefone, documento ou
   situação de um cliente real **nunca** ficam no modelo.
3. **Marque o que varia por situação** com uma nota curta entre parênteses, se ela quiser (ex.: "(se for primeira conversa, trocar por …)").
4. **Salve** em `sede/modelos/<tipo>-<uso>.md` (ex.: `mensagem-primeiro-contato.md`, `proposta-consultoria.md`, `email-cobranca-gentil.md`),
   com um cabeçalho de 2 linhas: para que serve e quando usar. Crie a pasta na primeira vez.
5. **Registre** em `sede/LICOES.md`: "para [situação], usar `sede/modelos/<arquivo>`". E em `sede/PROCESSOS.md`, se o modelo for parte de um
   processo que se repete.
6. Diga em uma frase: "Guardei como modelo. Da próxima vez que você pedir [situação], eu já parto dele."

## Usar o modelo depois
- Antes de escrever qualquer texto, olhe `sede/modelos/`. Se houver modelo para a situação, parta dele e preencha os campos com o que a
  conversa trouxe; campo sem informação fica `[A DEFINIR]`, nunca preenchido no chute.
- Se ela corrigir o resultado duas vezes do mesmo jeito, proponha atualizar o modelo (só com o "sim").

## Saída
- O arquivo em `sede/modelos/` e a linha em `LICOES.md`. Status: pronto.

## Limites
- Modelo de documento com valor legal (contrato, procuração, peça, laudo) segue o módulo da profissão e a revisão dela; aqui é só a estrutura.
- Não apague modelo antigo sem ela pedir; versione (`-v2`) e anote qual é o atual.
