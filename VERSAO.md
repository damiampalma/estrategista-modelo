versao: 1.3.0
data: 2026-10-29
nucleo: 1.3.0
modulos: geral 1.1.0 · corretor 1.2.0 · advogado 1.1.1 · marketing-proprio 1.1.1

## O que mudou
- corretor 1.2.0: skill nova `video-de-imovel` (vídeo de imóvel animado, com ela falando, só com a voz dela ou com fotos; usa o motor de criação do `marketing-proprio`, renderiza no computador).
- núcleo 1.3.0: a equipe. Skill nova `modos`: o Estrategista entende "ativa o modo marqueteiro" (e memória, arquivista, secretária, designer, diretor de animação, navegador, plantão), liga o que falta e faz uma primeira tarefa; responde "o que mais você pode fazer por mim?" com 3 sugestões feitas para ela; sugere um modo novo por semana.
- núcleo 1.3.0: conectar-ferramentas ensina o navegador (Chrome), a ElevenLabs (voz e imagem, plano à parte) e confere o Node.js 20 antes do motor de criação; o Gmail consegue enviar, mas nada sai sem o "sim".
- núcleo 1.2.0: a ativação começa no primeiro "oi" (sem questionário antes), confere se o caderno é privado e faz uma primeira tarefa logo no começo.
- núcleo 1.2.0: skill nova sede-no-computador (no fim da ativação o Estrategista oferece, com prós e contras, morar também no computador; ele se copia do GitHub e as duas cópias ficam iguais).
- núcleo 1.2.0: suporte pelo WhatsApp da EstrategistaLabs; regra de dado de paciente (saúde) explícita.
- marketing-proprio 1.1.1: sem regra de corretor (CRECI, imobiliária) para quem não é corretor; registro profissional só se a pessoa pedir.

## Arquivos
- modulos/corretor/MODULO.md
- modulos/corretor/skills/video-de-imovel/SKILL.md
- CLAUDE.md
- LEIA-ME.md
- .claude/skills/ativacao/SKILL.md
- .claude/skills/modos/SKILL.md
- .claude/skills/modos/MODOS.md
- .claude/skills/sede-no-computador/SKILL.md
- .claude/skills/atualizar/SKILL.md
- .claude/skills/completar-profissao/SKILL.md
- .claude/skills/como-me-treinar/SKILL.md
- .claude/skills/conectar-ferramentas/SKILL.md
- .claude/skills/oportunidades/SKILL.md
- .claude/skills/rotina-semanal/SKILL.md
- modulos/LEIA-ME.md
- modulos/advogado/skills/intimacoes-no-gmail/SKILL.md
- modulos/marketing-proprio/MODULO.md
- modulos/marketing-proprio/ferramentas/marketeiro/LEIA-ME.md
- modulos/marketing-proprio/ferramentas/marketeiro/blocos/BLOCOS.md
