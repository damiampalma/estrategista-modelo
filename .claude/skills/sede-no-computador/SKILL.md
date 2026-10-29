---
name: sede-no-computador
description: Instala o Estrategista também no computador dela, puxando a sede do GitHub (o caderno dela), e deixa as duas cópias iguais (o que ela fizer no celular aparece no computador e vice-versa). Use quando ela aceitar a oferta que você faz no fim da ativação (com os prós e contras), quando ela pedir ("quero você no notebook", "puxa a minha sede"), ou quando estiver numa pasta vazia no computador pedindo a sede.
---

# Sede no computador

O caderno dela mora no GitHub (privado) e funciona no celular e no navegador. Esta skill põe uma cópia no computador dela, que fica em dia
com o GitHub: no começo de cada conversa no computador você busca o que mudou, e no fim manda de volta. Nada de zip, nada de terminal para
ela: quem faz é você.

## Situação 1 · Ela aceitou (ou pediu) numa conversa na nuvem ou no celular

Você não alcança o computador dela daqui. Prepare o caminho, uma etapa por vez:
1. Descubra o endereço do caderno: `git remote get-url origin` (algo como `https://github.com/USUARIO/NOME`).
2. Diga: "No computador, instale o app do Claude (claude.ai/download) e entre com a mesma conta. Me avise quando estiver aberto." Se o motor
   dela for o Codex: o app do ChatGPT para computador, na parte do Codex.
3. Depois: "No app, abra a parte de código (Code), crie uma pasta vazia chamada Estrategista dentro de Documentos e comece uma conversa nela."
   Os nomes de menu mudam: descreva o que procurar e, se ela não achar, peça um print e guie pelo que aparece.
4. Entregue a mensagem pronta para ela colar lá, já com o endereço dela:
   > "Puxa a minha sede de https://github.com/USUARIO/NOME para esta pasta e continue de onde paramos."
5. Anote em `sede/ESTADO.md`: "Computador: instruções enviadas (data)". Quando ela voltar a esta conversa depois da instalação, diga em
   uma frase que as duas cópias ficam iguais sozinhas, desde que cada conversa termine com "Guardei."

## Situação 2 · Você está no computador, numa pasta sem a sede

1. **Git instalado?** `git --version`. Se não houver, explique em 2 frases que o computador precisa de um programa grátis chamado Git para
   copiar o caderno, peça o "sim" e mostre o caminho oficial (git-scm.com, botão de download para Windows, avançar até o fim com o que já
   vem marcado). No Mac, o próprio sistema oferece instalar quando o Git é chamado pela primeira vez. Depois, confira de novo.
2. **A pasta está vazia?** Se estiver: `git clone https://github.com/USUARIO/NOME.git .` (o ponto copia para a própria pasta). Se não
   estiver: não misture com o que já existe; peça uma pasta vazia nova e que ela abra a conversa lá.
3. **Login do GitHub:** o caderno é privado, então na primeira cópia o computador abre o navegador pedindo para entrar no GitHub. **Quem
   digita a senha é ela.** Avise antes: "Vai abrir uma janela do GitHub pedindo para entrar; é seguro, é para o computador poder ler o seu
   caderno." Se nada abrir e a cópia falhar por permissão, anote em `sede/SUPORTE.md` e aponte o suporte (seção 10 do `CLAUDE.md`).
4. **Confira:** `git log -1` e leia `sede/ESTADO.md`. Esta conversa começou antes de a sede existir na pasta: leia agora o `CLAUDE.md`
   inteiro e siga as regras dele dali em diante. Diga em 2 linhas quem você é e onde vocês pararam.
5. Anote em `sede/ESTADO.md` e `sede/FERRAMENTAS.md`: "Motores: nuvem + computador (sistema) desde (data)". Salve e mande para o GitHub.

## As duas cópias iguais (vale para sempre)

- **Começo de toda conversa no computador:** `git pull`. Se ela tiver mexido nos arquivos da pasta à mão, eles entram junto.
- **Fim de toda conversa no computador:** commit e push na `main`, como na nuvem (seção 3 do `CLAUDE.md`). Só diga "Guardei." depois de
  confirmar com `git log origin/main -1`.
- **Choque entre as cópias** (ela usou o celular e o computador ao mesmo tempo e os dois mexeram no mesmo arquivo): não descarte nada do que
  ela escreveu. Junte as duas versões, mostre em uma frase o que juntou e salve. Lembre, sem bronca: "Um aparelho por vez evita isso."
- **Sem internet no computador:** trabalhe normalmente e avise que vai mandar para o GitHub quando a internet voltar; na próxima conversa,
  mande antes de qualquer coisa.

## Limites
- Não instale nada além do Git sem explicar e pedir. Nunca peça senha nem token na conversa.
- Não apague a cópia do computador nem a do GitHub. Para "desinstalar", ela simplesmente apaga a pasta do computador; o caderno no GitHub continua.
