# Módulo advogado · versão 1.1.1 (26/10/2026)

**Para quem:** advogado ou advogada, sozinho ou em escritório, qualquer área e tribunal.

**O que ela passa a poder pedir:**

| Skill | O que faz | Depende de ferramenta? |
|---|---|---|
| `prazos` | Transforma intimação, publicação ou decisão em prazo calculado com memória de cálculo, regra usada e ressalvas, anota no caderno `sede/PRAZOS.md` e prepara o rascunho do evento. **Conta para conferir, nunca a palavra final** | Não. Agenda opcional (evento só com o "sim") |
| `clientes-e-processos` | Uma pasta por cliente com ficha, casos, combinados e histórico curto; triagem de novo contato; atualização em linguagem simples; checklist de documentos. **Sigilo: tudo fica em `sede/clientes/`** | Não |
| `modelos-de-pecas` | Guarda os modelos dela (peças, contratos, e-mails) e redige ou revisa no estilo dela, com citação só de fonte oficial ou [VERIFICAR] | Não. Navegador opcional para conferir jurisprudência nas bases oficiais |
| `intimacoes-no-gmail` | Procura no e-mail as intimações, publicações e alertas de recorte, resume e entrega para a skill `prazos` | **Sim: Gmail (ou Outlook) conectado.** Sem conector, ela cola a publicação e a skill `prazos` segue igual |

**Onde guarda:** `sede/PRAZOS.md` (só número do processo, iniciais do cliente, prazo e status; ou só o código da pasta do cliente, se o
limite dela pedir), `sede/clientes/<código>/` (ficha, documentos, peças, comunicações: **sigiloso**, nunca em post, link ou fora da sede),
`sede/modelos/` (os modelos dela, com campos no lugar de nomes).

**Regras que são dela, não do módulo:** se os clientes assinam termo de uso de IA, o que entra ou não na sede, como ela cita OAB em texto
público, se usa prazo interno de segurança. O módulo traz um modelo de termo (`sede/modelos/termo-uso-ia.md`) e as regras de contagem de prazo
com fonte oficial; o que vale é o que ela trouxer no bloco A.

**O que o módulo não faz:** não protocola, não assina, não acessa sistema de tribunal com certificado digital, não inventa lei, súmula,
julgado, número de processo ou data, não decide estratégia (mostra as opções), não envia nada a cliente sem o "sim".
