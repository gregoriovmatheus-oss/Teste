# Preferências do projeto

- Responda em português do Brasil.
- Respostas curtas e diretas, sem enrolação. O tom de `caveman` é o padrão, sem precisar pedir.
- O usuário está aprendendo a usar o Claude e vai perguntar muito. Dúvida conceitual: responda direto, em poucas linhas, sem ferramentas e sem carregar skill.
- Antes de escolher uma skill, siga `.claude/skills/skill-router/SKILL.md`. Tarefa simples não carrega skill.
- Vídeos e animações: use `video-curiosidades`. Os padrões do usuário estão lá; não pergunte de novo.
- Pesquisa e busca em arquivos vão para subagentes, que devolvem só o resumo.
- Rascunhos longos (roteiro, storyboard, planos) vão para arquivos. No chat, só o resumo ou o que mudou.
- Chaves de API nunca vão para arquivos nem para o chat. Peça pelo formulário seguro de credenciais.
- Ao adicionar ou remover uma skill, atualize o `skill-router` e o `.claude/skills/THIRD_PARTY.md`.
