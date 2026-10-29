---
name: captacao-oferta-ativa
description: Monta a lista diária de oportunidades de captação (anúncios públicos no recorte dela), com ficha, motivo concreto e mensagem no método de oferta ativa dela, e cuida da cadência de follow-up (D0, D2, D6, D14). Use todo dia antes do bloco de ligações, quando ela pedir "monta a lista", "quem eu abordo hoje?", ou quando a rotina da manhã rodar.
version: 1.0.0 (do Estrategista, 24/10/2026; origem 0.6.0 do Agente do Corretor)
license: proprietária EstrategistaLabs; o método de oferta ativa é o dela ou da imobiliária dela, gravado na ativação; ideia de diagnóstico de exposição adaptada de miron-tech/realtor-claude-skills (prospector, MIT, commit 7ef6154)
---

# Captação por oferta ativa

## Uma vez: o método dela
Em `sede/captacao/metodo.md`: bairros, faixa de preço, tipologias, horário do bloco de ligações, tamanho da lista (padrão **10**), cadência
(padrão **D0, D2, D6, D14**), tom, e os **modelos de mensagem** D0, D2, D6, D14 com variáveis `{primeiro_nome}`, `{predio}`, `{motivo}`. Se ela
tem um método da imobiliária, ele entra aqui como ela ditar; se não tem, proponha um ponto de partida simples e peça o "ficou certo".
Em `sede/imoveis/regras-da-imobiliaria.md`: o que ela trouxe sobre uso das plataformas, exclusividade de outros corretores e a resposta a
"onde conseguiu meu contato?". Em `sede/captacao/nao-contatar.md`: quem pediu para não ser contatado (vale para sempre).

## Entradas
Anúncios públicos no recorte; `sede/captacao/contatos.md` (quem já foi abordado, em que dia, cadência); `sede/captacao/nao-contatar.md`;
`sede/imoveis/lista.md` (o que já é dela).

## Passos
0. **Portão:** sem `metodo.md` confirmado, monte a lista de imóveis mas **não** prepare mensagem: status `parcial: método ausente`. Sem
   `nao-contatar.md` legível: nenhuma mensagem (`bloqueado: lista de não contatar ausente`). Regras da imobiliária que ela trouxe valem como
   ela trouxe; nenhuma é presumida.
1. **Buscar** anúncios novos ou alterados no recorte desde a última lista (busca pública, uma consulta por imóvel; sem varredura nem exportação de base).
2. **Deduplicar:** mesmo endereço + unidade = mesmo imóvel (um registro com todas as fontes). Sem unidade, mesmo prédio + área ± 2 m² +
   dormitórios = **candidato**, marcado para ela decidir.
3. **Não contatar:** imóvel ou pessoa na lista → descarte sem registro; a lista mostra só "N descartados", sem identificar.
4. **Exclusividade:** anúncio que indique exclusividade de outro corretor fica **sinalizado** com a data provável do fim; o que fazer com ele é
   regra dela (`regras-da-imobiliaria.md`); sem regra, não recebe mensagem e você pergunta.
5. **Unidade:** proponha a unidade provável (vagas, fachada, fotos) com o grau de certeza. Unidade provável **nunca** vira identidade confirmada
   até ela confirmar.
6. **Dados do proprietário:** quem consulta a plataforma é **ela**; você recebe só o primeiro nome e o canal. Sem telefone nem e-mail:
   `bloqueado: identidade não conferível`. Você não abre essa tela e não tenta outro caminho.
7. **Ficha:** fatos do anúncio + motivo concreto (tempo anunciado, mudança de preço, estudo de mercado do prédio), marcado como fato ou hipótese.
8. **Não contatar de novo:** antes de cada rascunho (D0, D2, D6, D14), confira a lista outra vez.
9. **Mensagem D0** no modelo dela; característica do imóvel citada vem do anúncio (sem fonte, "imóvel"); se o modelo tiver afirmação fixa sem
   fonte ("preparei um estudo" sem estudo), **não** use: `parcial: modelo com afirmação sem fonte` e peça revisão do modelo.
10. **Cadência:** D0 = dia em que ela **confirmou o envio**; D2, D6, D14 contam a partir dele; dia sem horário comercial passa para o próximo dia
    útil. Agende em `contatos.md`; no dia, prepare o rascunho.
11. **Placar:** lista entregue; depois, "enviou? s/n" ao fim do bloco; respostas e visitas de avaliação quando ela contar.

## Saída
`sede/captacao/AAAA-MM-DD-lista.md`: até N oportunidades priorizadas (`id | endereço | unidade (certeza) | motivo | exclusividade | mensagem`),
pendências e status. Pode virar rotina da manhã (padrão 9h30) só com o "sim" dela.

## Limites
Mensagem só em horário comercial, nunca domingo (salvo se ela mandar diferente); nunca inventar comprador nem prometer preço acima do mercado;
pedido para não contatar → `nao-contatar.md` na hora, para sempre. Você não envia nada: ela envia.

## Aceite
Lista pronta na hora do bloco em 4 de 5 dias; zero contato de quem está no não contatar; zero imóvel em exclusividade abordado sem regra dela.
