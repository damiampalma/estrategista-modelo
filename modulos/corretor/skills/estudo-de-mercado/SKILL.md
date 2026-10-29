---
name: estudo-de-mercado
description: Organiza comparáveis com fonte, data e memória de cálculo para ela decidir o preço de anúncio com o proprietário, em versão técnica e versão de conversa. Não é PTAM. Use quando ela pedir "avalia esse imóvel", "quanto vale", "faz o comparativo do prédio" ou quando um imóvel da carteira parou de receber contato.
version: 1.0.0 (do Estrategista, 24/10/2026; origem 0.6.0 do Agente do Corretor)
license: proprietária EstrategistaLabs; estrutura adaptada de hoangtng/real-estate-agents (cma-generator, MIT, commit b35e143), miron-tech/realtor-claude-skills (comp-crusher, MIT, commit 7ef6154) e TheProsperityAgent/prosperity-real-estate-skills (connect-mls-to-claude, MIT, commit b262bb9)
---

# Estudo de mercado (comparativo de anúncios e vendas)

## Entradas
Ficha do imóvel (`sede/imoveis/<id>/ficha.md`); recorte (padrão: mesmo bairro, mesma tipologia, área privativa ± 20%, configurável);
comparáveis só de fontes que ela pode usar, cada um com **fonte, data de coleta e status**: `anúncio ativo` · `anúncio retirado` ·
`venda comprovada` (documento ou registro interno da imobiliária).

## Passos
1. Definir o recorte e escrever no topo.
2. Coletar comparáveis; descartar o que não tem fonte e data. Comparável sem bairro, tipologia ou sem dizer se a área é privativa entra como
   **provisório** (aparece na tabela, não conta nas estatísticas até ser confirmado).
3. Separar **preço pedido** (anúncio) de **venda comprovada**. Os dois nunca entram na mesma conta.
4. Deduplicar (mesmo imóvel em portais diferentes = 1 comparável, com todas as fontes).
5. Justificar cada inclusão e exclusão em 1 linha.
6. **Amostra mínima:** menos de 5 comparáveis válidos no grupo → `parcial: amostra insuficiente`: só estatística descritiva (R$/m² de cada um,
   mínimo, mediana, máximo), sem faixa nem ponto central. Zero válidos: "não calculável".
7. R$/m² privativo: mediana, mínimo e máximo, com a conta visível. **Sem coeficiente de ajuste** (andar, vista, vaga): as diferenças vão numa
   tabela qualitativa.
8. Faixa = (R$/m² mínimo × área) até (R$/m² máximo × área), ponto central (R$/m² mediano × área), por grupo, rotulada "referência de preço
   pedido" ou "referência de venda". Área = privativa do imóvel avaliado; sem ela confirmada: `bloqueado: área ausente`.
9. Duas versões: técnica (para ela) e de conversa (para o proprietário, sem dado pessoal de terceiros, sem travessão longo).

## Saída
`sede/imoveis/<id>/estudo-de-mercado.md`: recorte, tabela (`# | endereço ou prédio | área | preço | R$/m² | status | fonte | data | incluído?
motivo`), memória de cálculo, diferenças qualitativas, faixa (ou "amostra insuficiente"), limitações, status.

## Limites
- **Não se chama PTAM** e não declara habilitação. O PTAM segue norma própria e é assinado por quem é habilitado [VERIFICAR a regra vigente
  em fonte oficial antes de afirmar qualquer coisa sobre isso para um cliente]. A saída aqui é só "estudo de mercado / comparativo".
- Sem comparável fictício, sem prazo de venda prometido, sem previsão de valorização.

## Aceite
100% dos comparáveis com fonte e data; nenhuma mistura de preço pedido com venda; ela usou o estudo numa conversa real.
