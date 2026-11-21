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
- `using-superpowers` e `task-observer` estão desligadas do disparo automático para poupar tokens. Só rodam se o usuário chamar.

## 1. Constantes: valem o tempo todo, no tipo de trabalho certo

Não precisam de pedido. Aplique sempre que a condição bater.

| Skill | Quando |
| --- | --- |
| `verification-before-completion` | Antes de dizer que algo está pronto, corrigido ou passando, e antes de commit ou PR. Sempre. |
| `systematic-debugging` | Qualquer bug, teste falhando ou comportamento inesperado, antes de propor correção. |
| `test-driven-development` | Ao implementar feature ou correção em código que tem (ou deveria ter) testes. |
| `ponytail` | Ao escrever, revisar ou projetar código: a solução mais simples que funciona, reaproveitando o que já existe. |

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
| Respostas curtas. É o padrão deste projeto (ver `CLAUDE.md`), sem precisar pedir. | `caveman` |
| Vídeo, animação, roteiro ou storyboard no formato de curiosidades (9:16, PT-BR) | `video-curiosidades` |

## 3. De vez em quando: só quando o domínio aparece

Ignore estas até o assunto surgir de fato.

**Vídeo (HyperFrames).** Vídeo de curiosidades no formato do usuário: comece por `video-curiosidades`, que chama as outras na ordem certa. Qualquer outro vídeo: comece por `hyperframes`.
- `hyperframes-cli`: scaffold, preview, render e timeline pela linha de comando.
- `hyperframes-registry`: antes de construir à mão qualquer efeito, transição ou título que tenha nome.
- `media-use`: música, voz, imagens, ícones ou color grading para o vídeo.
- `figma`: o usuário cola um link do Figma.
- `slideshow`: apresentação ao vivo, não vídeo renderizado.
- `reverse-any-video`: recriar um vídeo específico.
- `style-sampling`: novo episódio num estilo já conhecido. É pago (HyperFrames Pro) e só sai em inglês ou chinês, então não serve para vídeo em português.
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
- `claude-mem:handoff`: conversa longa demais. Gera um `HANDOFF.md` para continuar numa sessão nova depois do `/clear`.
- `claude-mem:smart-explore`: entender a estrutura de código sem ler arquivos inteiros.

**Plugin claude-mem.** Só estas três valem no dia a dia:
- `claude-mem:mem-search`: "já resolvemos isso antes?", "como fizemos X da outra vez?".
- `claude-mem:handoff` e `claude-mem:smart-explore`, descritas acima.
- Ignore as demais (`version-bump`, `ccs-align`, `cloud-sync`, `screenpipe`, `oh-my-issues`, relatórios e afins), a menos que o usuário peça pelo nome. Para planejar e executar, prefira as skills do superpowers (ver desempate).

## 4. Só quando o usuário chama

Estas skills não disparam sozinhas: só rodam se o usuário digitar o comando.
- `/chief-of-staff`: objetivo de longo prazo, coordenado com subagentes e uma wiki.
- `/megacave` e `/ultracave`: níveis extremos de compressão do caveman.
- `/using-superpowers`: modo "skill antes de tudo" do superpowers.
- `/task-observer`: observa uma sessão longa e anota oportunidades de melhorar ou criar skills.
- `/ref`: guarda prints ou links de vídeos como padrão visual em `video-curiosidades/referencias/REFERENCIAS.md`.

## Desempate entre skills parecidas

| Dúvida | Escolha |
| --- | --- |
| `brainstorming` ou `video-curiosidades` | Vídeo no formato de curiosidades: `video-curiosidades`, que já traz os padrões. Não rode `brainstorming` antes. |
| `writing-plans` ou `claude-mem:make-plan` | `writing-plans`. |
| `subagent-driven-development` ou `claude-mem:do` | `subagent-driven-development`. |
| `/compact` ou `claude-mem:handoff` | Mesmo assunto, conversa longa: `/compact`. Vai pausar ou trocar de sessão: `handoff`. |
| `brainstorming` ou `grilling` | Criar algo novo: `brainstorming`. Testar um plano que já existe: `grilling`. Nunca as duas em sequência sem pedido. |
| `executing-plans` ou `subagent-driven-development` | Há ferramenta de subagente: `subagent-driven-development`. Não há: `executing-plans`. |
| `skill-creator` ou `writing-skills` | `skill-creator`, a menos que o usuário peça a abordagem TDD. |
| `headroom` ou `caveman-compress` | Código de app: `headroom`. Arquivo de memória: `caveman-compress`. |
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

## Fluxo típico de um vídeo

Siga `video-curiosidades` (fluxo 2.0): leia `AUTOCRITICA.md`, roteiro em `SCRIPT.md` com aprovação, narração local Kokoro (`scripts/narrar.sh`), cenas R11 com `lowpoly.js`, `monta-cenas.py` + `doc.py`, snapshot e `fila-render.sh`.

## Manutenção

Ao instalar ou remover uma skill em `.claude/skills/`, atualize este arquivo e o `THIRD_PARTY.md`. Uma skill que não aparece aqui deve ser tratada como "de vez em quando".
