---
name: importar-contexto
description: Traz para a sede o que o Claude e o ChatGPT antigos sabem dela e do trabalho dela (memória, instruções personalizadas, projetos, jeito de escrever, prompts e tarefas que funcionam, correções repetidas, modelos de texto) e organiza, deixando dado de cliente de fora. Use quando ela quiser "trazer o que o Claude/ChatGPT sabe", colar um texto vindo deles, ou colocar uma exportação em IMPORTAR/.
---

# Importar contexto (Claude e ChatGPT antigos)

As conversas antigas não vêm sozinhas: não existe importação automática de conversa, memória ou projeto entre apps (e a memória do ChatGPT na
web é separada da do Codex). Ela pede um resumo a cada um e cola aqui. Três caminhos, do mais rápido ao mais completo; ela pode parar no primeiro.

## Passos
1. **Caminho rápido (10 min).** Dê a ela este prompt para colar **num chat normal** do Claude (claude.ai) e depois do ChatGPT (fora do Codex).
   Peça para colar cada resposta aqui.

   ```text
   Quero levar para um novo assistente tudo o que você sabe sobre mim e sobre como eu trabalho. Responda em um único bloco de texto, em
   português, com estes títulos:
   1. Quem eu sou e o que faço (profissão, cidade, para quem trabalho).
   2. Tudo o que você lembra de mim (memórias salvas e o que você usa do nosso histórico).
   3. Minhas instruções personalizadas e as de cada projeto que eu uso, copiadas como estão.
   4. Como eu gosto que você escreva (tom, tamanho, palavras que evito), com exemplos.
   5. Tarefas que eu peço com frequência e o passo a passo que funcionou (inclusive prompts).
   6. Correções que eu precisei fazer várias vezes (o que você errava e como eu queria).
   7. Tarefas em que eu desisti ou que você não fazia bem, e por quê.
   8. Modelos e estruturas de textos que eu te ensinei (cole o texto quando puder).
   9. Ferramentas e sistemas que eu uso.
   Regras: não invente nada; se não tiver certeza, escreva "não sei". Não inclua nome, telefone, documento ou dado de cliente, paciente
   ou aluno: troque por [CLIENTE], [PROCESSO], [DADO].
   ```
2. **Caminho manual (5 min).** No ChatGPT: Configurações > Personalização > Instruções personalizadas e Memória; e, para cada Projeto, as instruções
   dele. No Claude: Configurações > Perfil (preferências) e as instruções de cada Projeto. Ela copia e cola; salve em `IMPORTAR/do-claude.md` e
   `IMPORTAR/do-chatgpt.md`. Os nomes dos menus mudam: descreva o que procurar, não invente o caminho.
3. **Conversas importantes.** Você não abre as conversas antigas dela. Se houver uma em que ela ensinou algo, peça que copie o trecho e cole aqui.
4. **Caminho completo (opcional).** Exportação de dados do app (ChatGPT: Configurações > Controles de dados > Exportar dados; chega por e-mail).
   Ela descompacta em `IMPORTAR/exportacao/`. É arquivo-morto: **não processe tudo de uma vez** (gasta o limite dela). Leia por partes, quando
   precisar, só padrões de trabalho. Dado de cliente que estiver lá não sai de `IMPORTAR/`.
5. **Mostre antes de guardar,** em blocos curtos: "Do ChatGPT eu trouxe isto sobre o seu jeito de escrever: … Está certo?" Corrija o que ela
   disser e só grave o que ela confirmar.
6. **Organize o que ela confirmou:** quem ela é e ferramentas → `sede/PERFIL.md`, `sede/FERRAMENTAS.md`; jeito de escrever e correções repetidas → `sede/LICOES.md`
   (uma linha cada: "fazia X · ela quer Y"); tarefas com passo a passo → `sede/PROCESSOS.md`; modelos de texto → onde o módulo ligado guarda
   modelos (ou `sede/modelos/`, criando a pasta); o que ela desistiu de pedir → `sede/ESTADO.md`, em pendências, como prioridade.
7. Marque em `sede/ESTADO.md`: "Importação: feita (data)" ou "parcial (o que faltou)". Salve.

## Saída
- Arquivos da sede atualizados, lista curta do que foi aproveitado e do que ficou de fora.
- Fatos × hipóteses: o que veio é "segundo o Claude/ChatGPT" até ela confirmar.
- Status: pronto · parcial (qual caminho falta) · bloqueado (motivo).

## Limites
- O app antigo pode lembrar errado: nada importado vira regra sem a confirmação dela.
- Dado de cliente, paciente, documento ou saúde que vier por engano: não leve para a sede; avise e sugira apagar do texto.
- Não peça senha nem acesso à conta dela. Nada é apagado do app antigo: ela pode continuar usando o chat normal.
