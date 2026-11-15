---
name: skill-router
description: Mapa de todas as skills deste repositório, dizendo quais usar sempre, quais usar em situações frequentes e quais só de vez em quando. Use no início de qualquer tarefa com várias etapas, antes de escolher outra skill, quando houver dúvida entre duas skills parecidas, ou quando o usuário perguntar "qual skill usar", "que skill serve pra isso" ou "quais skills eu tenho".
---

# Skill Router

Este é o mapa das skills instaladas em `.claude/skills/`. Consulte-o para decidir **se** alguma skill se aplica e **qual** delas, antes de carregar outra skill.

## Regra de ouro: proporcionalidade

- **Pergunta simples, edição trivial ou consulta rápida:** não carregue skill nenhuma, só responda.
- **Tarefa com várias etapas:** aplique as skills constantes e no máximo uma ou duas situacionais.
- **Nunca encadeie skills de processo só por encadear.** Cada skill carregada custa contexto e tempo. Na dúvida entre duas, use a tabela de desempate abaixo e escolha uma.
- Este router substitui a regra do `using-superpowers` de "invocar uma skill antes de qualquer resposta". Use `using-superpowers` só se o usuário pedir.

## 1. Constantes: valem o tempo todo, no tipo de trabalho certo

Não precisam de pedido. Aplique sempre que a condição bater.

| Skill | Quando |
| --- | --- |
| `verification-before-completion` | Antes de dizer que algo está pronto, corrigido ou passando, e antes de commit ou PR. Sempre. |
| `systematic-debugging` | Qualquer bug, teste falhando ou comportamento inesperado, antes de propor correção. |
| `test-driven-development` | Ao implementar feature ou correção em código que tem (ou deveria ter) testes. |
| `ponytail` | Ao escrever, revisar ou projetar código: a solução mais simples que funciona, reaproveitando o que já existe. |
| `task-observer` | Em trabalho longo, com várias etapas, ou quando o usuário corrige a mesma coisa repetidas vezes. Fora disso, não. |

## 2. Frequentes: situações que aparecem a toda hora

| Situação | Skill |
| --- | --- |
| Ideia nova, feature, algo para criar do zero | `brainstorming` |
| Já existe um plano ou decisão e é preciso testá-lo, ou o usuário fala em "grill" | `grilling` |
| Requisitos claros, tarefa com várias etapas, antes de mexer no código | `writing-plans` |
| Executar um plano com subagentes disponíveis | `subagent-driven-development` |
| Executar um plano sem subagentes, ou quando o usuário quer execução inline | `executing-plans` |
| Duas ou mais tarefas independentes que podem rodar em paralelo | `dispatching-parallel-agents` |
| Delegar busca de código, edição de 1 ou 2 arquivos ou revisão de diff para economizar contexto | `cavecrew` |
| Feature que precisa de isolamento do workspace atual | `using-git-worktrees` |
| Implementação terminada, decidir como integrar (merge, PR, limpeza) | `finishing-a-development-branch` |
| Antes de fazer merge ou ao concluir uma feature grande | `requesting-code-review` |
| Recebeu feedback de code review | `receiving-code-review` |
| Usuário pede respostas curtas ("caveman", "seja breve", "menos tokens") | `caveman` |

## 3. De vez em quando: só quando o domínio aparece

Ignore estas até o assunto surgir de fato.

**Vídeo (HyperFrames).** Comece sempre por `hyperframes`.
- `hyperframes-cli`: scaffold, preview, render e timeline pela linha de comando.
- `hyperframes-registry`: antes de construir à mão qualquer efeito, transição ou título que tenha nome.
- `media-use`: música, voz, imagens, ícones ou color grading para o vídeo.
- `figma`: o usuário cola um link do Figma.
- `slideshow`: apresentação ao vivo, não vídeo renderizado.
- `reverse-any-video`: recriar um vídeo específico.
- `style-sampling`: novo episódio num estilo já conhecido.
- `remotion-to-hyperframes`: portar Remotion, Lottie, Motion Canvas ou similares.

**Voz e áudio (ElevenLabs).**
- `onboarding`: primeira vez usando ElevenLabs.
- `setup-api-key`: a chave parou de funcionar ou já existe.
- `text-to-speech`, `speech-to-text`, `dubbing`, `music`, `sound-effects`, `voice-changer`, `voice-isolator`: cada uma pelo nome da tarefa.
- `agents`: agentes de voz da ElevenLabs.
- `realtime`: modelos Realtime ou migração da OpenAI Realtime.
- `speech-engine`: voz em tempo real no seu próprio runtime.

**Marketing.** `marketing-psychology`: vieses, persuasão, ancoragem, prova social, escassez.

**Prompts.** `prompt-master`: só quando o usuário pede explicitamente para escrever ou melhorar um prompt para alguma ferramenta de IA.

**Skills.**
- `find-skills`: procurar uma skill que ainda não está instalada.
- `skill-creator`: criar, editar ou avaliar uma skill. É o padrão.
- `writing-skills`: ajustar o texto de uma skill com abordagem de testes. Só se `skill-creator` não bastar.
- `diagnosing-superpowers`: entender por que uma sessão com superpowers deu errado.

**Tokens e contexto.**
- `headroom`: reduzir tokens dentro de um app Python ou TypeScript que chama LLM.
- `caveman-compress`: comprimir um CLAUDE.md ou arquivo de memória.
- `caveman-stats`: ver o uso de tokens da sessão.

**OmniRoute.** Só se o projeto usa um servidor OmniRoute.
- `omni-*`: API REST e configuração, por assunto (auth, providers, cache, routing, compression...).
- `cli-*`: as mesmas operações pela linha de comando.
- `config-codex-cli`: apontar o Codex CLI para o OmniRoute.
- Fora de projetos com OmniRoute, nunca use estas.

## 4. Só quando o usuário chama

Estas skills não disparam sozinhas: só rodam se o usuário digitar o comando.
- `/chief-of-staff`: objetivo de longo prazo, coordenado com subagentes e uma wiki.
- `/megacave` e `/ultracave`: níveis extremos de compressão do caveman.
- `/using-superpowers`: modo "skill antes de tudo" do superpowers.

## Desempate entre skills parecidas

| Dúvida | Escolha |
| --- | --- |
| `brainstorming` ou `grilling` | Criar algo novo: `brainstorming`. Testar um plano que já existe: `grilling`. Nunca as duas em sequência sem pedido. |
| `executing-plans` ou `subagent-driven-development` | Há ferramenta de subagente: `subagent-driven-development`. Não há: `executing-plans`. |
| `skill-creator` ou `writing-skills` | `skill-creator`, a menos que o usuário peça a abordagem TDD. |
| `find-skills`, `omni-github-skills` ou `cli-skill-collector` | `find-skills`. As outras duas só dentro do OmniRoute. |
| `headroom`, `caveman-compress` ou `omni-compression` | Código de app: `headroom`. Arquivo de memória: `caveman-compress`. Proxy OmniRoute: `omni-compression`. |
| `onboarding` ou `setup-api-key` (ElevenLabs) | Primeira vez: `onboarding`. A chave já existe ou falhou: `setup-api-key`. |
| `reverse-any-video` ou `style-sampling` | Copiar um vídeo específico: `reverse-any-video`. Copiar um estilo com outro tema: `style-sampling`. |
| `caveman` ou `cavecrew` | Responder curto ao usuário: `caveman`. Delegar trabalho a subagentes: `cavecrew`. |

## Fluxo típico de uma feature

1. `brainstorming` (ou `grilling`, se o plano já existe).
2. `writing-plans`.
3. `using-git-worktrees`, se precisar isolar.
4. `subagent-driven-development` ou `executing-plans`, com `test-driven-development` e `ponytail` o tempo todo.
5. `systematic-debugging` sempre que algo quebrar.
6. `verification-before-completion`.
7. `requesting-code-review`, depois `finishing-a-development-branch`.

Pule as etapas que a tarefa não precisa: uma correção de uma linha vai direto para o passo 4.

## Manutenção

Ao instalar ou remover uma skill em `.claude/skills/`, atualize este arquivo e o `THIRD_PARTY.md`. Uma skill que não aparece aqui deve ser tratada como "de vez em quando".
