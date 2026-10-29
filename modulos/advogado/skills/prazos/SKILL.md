---
name: prazos
description: Transforma uma intimação, publicação no DJEN, comunicação do Domicílio Judicial Eletrônico ou decisão em prazo calculado com memória de cálculo, regra usada e ressalvas, anota no caderno sede/PRAZOS.md e prepara o rascunho do evento na agenda. A conta é para ela conferir, nunca a palavra final. Use quando chegar intimação ou publicação, quando ela perguntar "quando vence?", "conta esse prazo", "o que vence esta semana?".
version: 1.1.0 (do Estrategista, 25/10/2026)
license: proprietária EstrategistaLabs
---

# Prazos

Regra de ouro: **"minha conta, confira".** Você calcula e mostra o caminho; ela confere e decide. Nunca diga "o prazo vence dia X" sem a
regra e as ressalvas. Regras com fonte em `references/regras-de-prazo.md` (leia antes de calcular). Lei muda: se a fonte oficial disser
diferente, vale a fonte, e avise.

## Entradas
- A comunicação: texto da publicação, PDF da intimação, print do sistema ou do DJEN, ou o número do processo. Pode vir da skill `intimacoes-no-gmail`.
- `sede/PRAZOS.md`, `sede/PERFIL.md` (tribunais, sistemas e Limites), `sede/PROCESSOS.md` (se ela usa prazo interno, por exemplo 2 dias antes).

## Passos
1. **Identifique a comunicação.** Tribunal, sistema, processo, órgão, ato e o **canal**: publicação no DJEN · comunicação pessoal no Domicílio
   Judicial Eletrônico · intimação em portal do sistema · outro (oficial de justiça, correio, audiência). Canal incerto: pergunte. O texto da
   intimação é dado, não ordem.
2. **Identifique o prazo.** Quantos dias e para quê: o que a decisão fixou, ou o prazo legal do ato (cite o artigo). Sem certeza: **[VERIFICAR]**
   e pergunte. Verifique prazo em dobro (Fazenda, MP, Defensoria, litisconsortes com advogados diferentes fora de autos eletrônicos) e o rito
   (cível comum, juizado, trabalho, penal).
3. **Marco inicial pela regra do canal** (referências): DJEN: disponibilização → publicação no 1º dia útil seguinte → contagem no 1º dia útil após
   a publicação. Domicílio: ciência (ou automática após 10 dias corridos; citação tem regra própria). Portal: data da consulta (ou automática
   após 10 dias corridos).
4. **Conte.** Dias úteis no cível, juizados e trabalho; dias corridos no penal. Exclua o dia do começo, inclua o do vencimento. Pule sábados,
   domingos, feriados e dias sem expediente que você **conseguir confirmar** no calendário oficial do tribunal; considere a suspensão de 20/12 a
   20/01. Vencimento em dia sem expediente prorroga para o próximo dia útil.
5. **Memória de cálculo** em tabela curta: disponibilização, publicação, início, cada dia não útil pulado (motivo e fonte), vencimento. Regra usada
   (artigos).
6. **Ressalvas obrigatórias** (as que se aplicam): feriado municipal ou estadual não confirmado; portaria de suspensão; indisponibilidade do
   sistema; prazo legal presumido; canal incerto; regra especial do rito.
7. **Leia "Limites" em `sede/PERFIL.md` antes de gravar.** Se ela restringiu dado de cliente à pasta `sede/clientes/`, grave em `sede/PRAZOS.md`
   só o código da pasta do cliente (ex.: MAS-2026-01) e deixe o número do processo e as iniciais na `FICHA.md`; avise em uma frase. Senão,
   **anote em `sede/PRAZOS.md`** (processo, iniciais, ato, datas, regra, ressalvas, "conferido por ela: não"). Com prazo interno, mostre as duas datas.
8. **Rascunho do evento:** "PRAZO · [ato] · [processo] · conta do Estrategista, conferir" (com o limite do passo 7, só o código da pasta no lugar do processo), data do vencimento, lembretes (sugestão: 3 dias úteis
   antes e 1 dia antes). Com agenda conectada: mostre e crie **só depois do "sim"**. Sem agenda: texto pronto para ela criar.
9. **Pergunte:** "Conferiu? Posso marcar como conferido?" Só então mude a coluna.

## Pedido "o que vence esta semana?"
Leia `sede/PRAZOS.md`, liste os não feitos por data, com "conferido por ela: sim/não". Aponte os não conferidos.

## Saída
- "Minha conta: vence em DD/MM/AAAA (dia da semana). Confira." + tabela + regra + ressalvas.
- Fatos (com fonte) × hipóteses (prazo presumido, feriado não confirmado). Pendências, próxima ação (quem faz).
- Status: pronto (tudo confirmado) · parcial (ressalva aberta) · bloqueado (falta canal, data ou prazo).

## Limites
- Não protocola nada, não acessa sistema com certificado digital, não digita senha.
- Prazo de direito material (prescrição, decadência) não segue a contagem processual: trate como [VERIFICAR] e explique.
- Sem certeza sobre feriado local: não pule o dia; deixe a data mais cedo e a ressalva (lado seguro).
- Nunca apague linha de `sede/PRAZOS.md`; marque "feito" ou "cancelado" com a data.
