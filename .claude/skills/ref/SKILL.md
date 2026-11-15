---
name: ref
description: Guarda referências de vídeo (prints, links, fontes, cores) como padrão dos vídeos de curiosidades. Só roda com /ref.
disable-model-invocation: true
---

# /ref: guardar referências de vídeo

O objetivo é ver cada imagem **uma vez só** e transformá-la em texto curto. Depois disso, os vídeos usam só o texto, que custa poucos tokens.

O arquivo de destino é `.claude/skills/video-curiosidades/referencias/REFERENCIAS.md`.

## Uso

- **`/ref` com imagens, link ou texto:** adiciona uma referência.
- **`/ref` sozinho:** lista as referências, uma linha por ID, sem abrir nenhuma imagem.
- **`/ref remover R03`:** apaga o cartão, as imagens, a linha da tabela e o preset em `presets.js`.

## Passos para adicionar

1. **Imagens.** As imagens anexadas já estão visíveis. Não use `Read` para vê-las.
   - Copie cada uma para `referencias/` como `Rnn-<cena>.jpg`, reduzida para 540 px de largura: `convert in.png -resize 540x -quality 80 out.jpg`.
   - Mesmo vídeo, mesmo `Rnn`. Use o próximo número livre.
2. **Links.**
   - Mande um único subagente `web-fetch` buscar o link e pedir: título, criador, legenda e engajamento. Ele devolve 5 linhas no máximo.
   - TikTok e Instagram costumam bloquear o acesso. Se falhar, peça prints numa frase só.
3. **Cartão.** Escreva o cartão em `REFERENCIAS.md`, com no máximo 15 linhas, só com o que dá para medir:
   - tipo: 2D, 3D ou misto;
   - tom;
   - engajamento;
   - HUD e elementos fixos;
   - legenda: fonte, peso, caixa, tamanho em px e posição y em 1080×1920;
   - gancho;
   - câmera e ritmo;
   - cena;
   - paleta em hex.

   Para as fontes, indique o equivalente no Google Fonts. Para a posição y, converta da altura do print para 1920 e ignore a interface do app.
4. **Padrão atual.** Em "Padrão atual" (no máximo 20 linhas), adicione uma linha na tabela "Escolha por tema": `tema/tom | Rnn | preset e blocos`. Só mude as regras curtas abaixo da tabela se a ref trouxer algo que valha para todas. Não copie o cartão para lá.
4b. **Preset do kit.** Adicione `"Rnn"` em `.claude/skills/video-curiosidades/kit/template/assets/lib/presets.js`, copiando a estrutura de uma ref parecida (`modo` 3d ou 2d, `fundo`, `fontes`, `paleta`, `legenda`, `hud`, `titulo`, `blocos`). O trecho entre `PRESETS:INICIO` e `PRESETS:FIM` é JSON puro. Fontes: só as de `kit/template/assets/fonts/` (se precisar de outra, baixe o woff2 do Fontsource e registre em `kit/scripts/comum.py`). Confira com `node -e "import('<caminho>/presets.js').then(m=>console.log(Object.keys(m.PRESETS)))"`.
5. **Conflito com o estilo decidido.** Se a referência conflitar com o "Estilo visual" de `video-curiosidades`, ajuste o texto da skill para incluir a referência, sem apagar o que já estava decidido.
6. **Commit e push.** Faça commit e push no branch de trabalho e no `main`.
7. **Resposta no chat.** No máximo 4 linhas: o ID e o que virou padrão. Não repita o cartão.

## Regras

- Não abra de novo as imagens já guardadas. Os cartões substituem as imagens.
- Engajamento baixo: use a referência pelo visual, não como prova de que viraliza. Anote isso no cartão.
- Não guarde vídeo, áudio nem fonte paga. Imagens de terceiros servem só como estudo de estilo e nunca entram no vídeo final.
