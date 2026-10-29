---
name: cliente-lembrado
description: Acompanhamento de compradores, proprietários e indicações: quem está esperando resposta, quem ficou sem contato há mais de X dias, qual o próximo passo de cada um, e o rascunho da mensagem de retomada no tom dela. Use todo dia em 5 minutos, quando ela disser "quem eu preciso responder?", "faz tempo que não falo com fulano", "atualiza o acompanhamento", ou quando a rotina da manhã rodar.
version: 1.0.0 (do Estrategista, 24/10/2026)
license: proprietária EstrategistaLabs
---

# Cliente lembrado (follow-up)

Regra de ouro: **ninguém esperando sem ela saber.** O CRM completo é o da imobiliária (ou o dela); aqui fica só o mínimo para lembrar:
primeiro nome, canal, interesse, último contato, próximo passo, data.

## Entradas
- `sede/clientes/acompanhamento.md` (a tabela). Se o CRM dela tiver conector oficial e ela ligou, leia de lá e grave aqui só o resumo.
- O que ela conta ("falei com a Ana ontem, ela quer ver mais dois apartamentos") ou cola (mensagem recebida).
- Tom dela em `sede/PERFIL.md` e `sede/LICOES.md`; modelos em `sede/modelos/`.

## Passos
1. **Atualize** a tabela com o que ela trouxe: novo contato, último contato, o que ficou combinado, próximo passo e data.
2. **Quem precisa de atenção hoje:** (a) prometeu retorno e a data passou; (b) sem contato há mais de 7 dias (ou o prazo que ela definir);
   (c) etapa parada (visita feita sem proposta, proposta sem resposta, documento pendente). Até 5, os mais quentes primeiro.
3. **Para cada um, o rascunho de retomada** (WhatsApp, até 5 linhas, no tom dela): lembra o contexto em meia frase, traz algo útil (um imóvel
   novo no recorte, uma resposta pendente, um próximo passo), faz **uma** pergunta. Sem pressão, sem "só passando para lembrar".
4. Mostre a lista e os rascunhos prontos para copiar. Quando ela disser que enviou, registre o contato de hoje e o próximo passo.
5. **Toda sexta:** quem esfriou (sem resposta a 3 retomadas) vai para "em espera" com a data; ela decide se volta a tentar. Nunca apague ninguém.

## Com agenda conectada
- Visita ou reunião marcada pode virar evento **só com o "sim"**; a véspera entra no `organizar-semana` e no `preparar-reuniao`.

## Saída
- A lista de atenção do dia + rascunhos; `acompanhamento.md` atualizado. Status: pronto · parcial (falta data ou canal) · bloqueado (sem tabela).

## Limites
- Dados completos (telefone, documento, renda, proposta) ficam no CRM dela; aqui só primeiro nome e canal. Se o bloco A proibiu nome, use iniciais.
- Você não envia nada: ela envia. Quem pediu para não ser contatado sai da lista para sempre (`sede/captacao/nao-contatar.md`).
- Não prometa imóvel, desconto, prazo ou aprovação de financiamento em nenhum rascunho.
