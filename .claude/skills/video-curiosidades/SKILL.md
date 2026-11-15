---
name: video-curiosidades
description: Fluxo enxuto para vídeos curtos animados de curiosidades e explicações em português, no formato vertical 9:16 de 60 a 80 segundos (TikTok, Reels, Shorts). Use quando o usuário pedir um vídeo, animação, storyboard ou roteiro do tipo "e se...", "curiosidades sobre...", "explica em vídeo...", ou quiser ajustar um vídeo desse tipo já em andamento.
---

# Vídeo de curiosidades (9:16, PT-BR)

Esta skill fixa as decisões que o usuário já tomou, para não perguntar de novo, e organiza as outras skills na ordem certa, gastando o mínimo de tokens. Os detalhes técnicos continuam nas skills do HyperFrames e da ElevenLabs: aqui só fica o que é específico deste formato.

## Padrões (não pergunte de novo)

| Item | Padrão |
| --- | --- |
| Formato | 1080×1920, 30 fps |
| Duração | 60 a 80 s. O alvo é cerca de 72 s. |
| Idioma | Português do Brasil, na narração e nas legendas |
| Público | Geral, redes sociais, muitas pessoas assistindo sem som |
| Tom | Curioso e envolvente, com tensão crescente e um fechamento que gera reflexão |
| Narração | ElevenLabs `text-to-speech`, modelo `eleven_v4`, voz grave estilo documentário |
| Legendas | Palavra por palavra, grandes e centralizadas, com destaque nos números |
| Som | Trilha crescente mais efeitos sonoros nas ações visíveis |
| Arco | Gancho → escala → mergulho pessoal → consequências → contraste → fechamento |

O usuário pode mudar qualquer padrão. A mudança vale para aquele vídeo; se ele disser que é permanente, atualize esta tabela.

**Ainda não decidido pelo usuário:** o estilo visual (2D flat ou 3D realista). Pergunte uma vez, na primeira rodada, junto com o tema. Se ele não responder, use 2D vetorial com cores saturadas e formas simples.

## Fluxo

1. **Briefing (1 rodada no máximo).** Pergunte só o que não está nos padrões: tema, estilo visual se ainda não houver, e algum dado obrigatório. Se o pedido já trouxer tudo, pule. Não carregue `brainstorming` nem `grilling` para este formato.
2. **Pesquisa e checagem.** Mande um único subagente levantar 10 a 15 curiosidades com fonte e grau de confiança. Ele devolve só uma tabela no formato `fato | número | fonte | confiança`. Descarte o que for fraco ou viral sem fonte. Hipóteses entram como "alguns cientistas acham que...".
3. **Roteiro e storyboard.** Escreva em arquivos, não no chat:
   - `SCRIPT.md`: a narração. O orçamento é de cerca de 2,5 palavras por segundo, então 150 palavras para 60 s e 200 para 80 s.
   - `STORYBOARD.md`: no formato de `hyperframes/references/storyboard-format.md`, com `format: 1080x1920`.
   - No chat, mostre só uma tabela resumida: `tempo | visual | fala` com no máximo uma linha por cena.
4. **Aprovação.** Espere o usuário aprovar o roteiro antes de gerar áudio, porque cada geração gasta créditos da ElevenLabs.
5. **Áudio.** Narração com `text-to-speech`. Trilha com `music` e efeitos com `sound-effects`, só depois que a narração estiver aprovada, para que a duração já esteja fechada.
6. **Montagem.** Siga `hyperframes` (contrato de render e fluxo de trabalho) e `hyperframes/references/types/vertical.md`. Antes de criar à mão qualquer efeito, título ou transição com nome, procure no `hyperframes-registry`. A mixagem segue `media-use`.
7. **Legendas.** Use o tempo de cada palavra. Se transcrever com o HyperFrames, passe sempre `--model small --language pt`. O padrão `small.en` **traduz para o inglês**.
8. **Revisão e render.** Rode `npx hyperframes check --json` e o snapshot de revisão, abra o preview e só renderize quando o usuário aprovar ou pedir o arquivo. Aplique `verification-before-completion` antes de dizer que está pronto.

## Regras de cena (9:16)

- **Gancho no frame 0:** uma imagem forte ou uma pergunta já na tela. O frame 0 é a miniatura. Nunca uma tela preta.
- **O gancho funciona sem som.**
- **Ritmo:** um corte ou movimento a cada 2 a 3 s, e uma ideia nova a cada 4 a 8 s.
- **Áreas seguras:** nada importante acima de 168 px nem abaixo de 1330 px, e nenhum texto sob a coluna de botões à direita.
- **Texto:** no máximo 5 palavras por linha numa afirmação, e nada menor que 28 px. Corte palavras em vez de diminuir a fonte.
- **Números:** cada número citado na narração aparece na tela como contador ou destaque.
- **Fechamento:** volte ao começo do vídeo (por exemplo, o mesmo objeto do gancho) com uma frase curta.

## Ajustes depois da primeira versão (economia de tokens)

- Edite só a cena afetada, no `STORYBOARD.md` ou na composição dela. Não reescreva o storyboard inteiro.
- No chat, mostre só as linhas que mudaram, nunca o storyboard completo de novo.
- Use `snapshot --range` na cena alterada, não no vídeo todo.
- Uma mudança no texto da narração exige regerar só aquele trecho de áudio e reajustar as legendas daquela cena.
- Junte vários ajustes num único pedido antes de rodar ferramentas.
- Carregue só as referências do HyperFrames que a etapa atual precisa. `story.md`, `film.md` e `look.md` só quando for montar do zero.

## Templates de estilo

Os templates do `style-sampling` são recurso pago (HyperFrames Pro) e saem em inglês ou chinês. Para vídeo em português, não use. Monte com `hyperframes` direto, usando a gramática visual escolhida, sem copiar personagens, logotipos ou identidade de nenhum canal.
