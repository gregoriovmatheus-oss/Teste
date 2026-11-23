# Lote 3: 3 vídeos "E se…" (dois sóis, sem dor, hibernação)

Leia antes, nesta ordem e rápido: `BRIEF-BUILD.md`, `BRIEF-ESTILO-DOC.md` e `BRIEF-LOTE-2.md`. O lote 2 é o estilo-base. Leia também `../.claude/skills/video-curiosidades/AUTOCRITICA.md`, porque os erros listados lá não podem se repetir. Este arquivo só diz o que muda.

## Projeto
- **Kit 2.0:** o projeto foi criado com `novo-video.sh --ref R10`.
- **Já está pronto, não mude:**
  - narração (Kokoro), `audio/palavras.json`, `SCRIPT.md`;
  - `video.json` com as cenas e os tempos;
  - `compositions/fNN.html`, `index.html` e `captions.html`.
- **Você escreve:**
  - `cenas/fNN.js` (f01–f13), no formato META descrito no `SKILL.md` do `video-curiosidades`, seção "Cena";
  - `audio/sfx-local.py`, que gera `assets/audio/sfx.mp3`.
- **Monte e confira:** `python3 scripts/monta-cenas.py`.
- **Exemplos para copiar o formato:**
  - R10 / lote 2: `../pensamentos-de-todos/cenas/*.js` e os blocos de lá (`mente.js` etc.). Copie blocos que fizerem falta para `assets/lib/blocks/`.
  - R11: `../teste-kit2/cenas/*.js`, que usam `lowpoly.js`.
- **Não rode** `scripts/cenas.py`, `gera-hud-legendas.py` nem `doc.py`. Sem render final, commit nem push.

## Estilo: 80% lote 2 + 20% R11
- **Cerca de 10 das 13 cenas: look do lote 2.**
  - Cinema 3D R10: PBR, grão, vinheta, bloom e câmera sempre em movimento.
  - Tipografia doc nos rótulos: kicker azul `#7cc8ff`, palavra-chave `.y` e acento laranja `#ff8a4c`.
  - Pessoas em silhueta (`animals.js` → `humano`).
- **2 ou 3 cenas: R11** (`lowpoly.js`, `palco` + `pessoa`).
  - Close facetado no rosto, com emoção, nos momentos mais pessoais do roteiro.
  - Uma delas de preferência na f01, porque o frame 0 é a miniatura: rosto expressivo e premissa.
  - Use os dois renderizadores compartilhados (`toy.js` e `lowpoly.js`). Não crie outros contextos WebGL.
- **Regras de sempre:**
  - Cada número ou fato aparece na tela quando é dito (`palavras.json`).
  - Respeite as zonas em y: rótulos em 640–1000; nada em 1045–1215, onde fica a legenda; nada abaixo de 1330; nada em x > 960.
  - Determinismo: sem `Math.random`, `Date` ou `requestAnimationFrame`.
  - No máximo 40k triângulos visíveis.
  - Fechamento volta à imagem do começo.
- **Peças reutilizáveis:** crie um helper do vídeo em `assets/lib/blocks/<nome>.js`.

## Verificação
- `npx --yes hyperframes@0.9.52 check --json` sem erros.
- Snapshot de folha de contato:
  - comando: `npx --yes hyperframes@0.9.52 snapshot . --at <meio de cada cena> --no-end -o renders/snap`;
  - olhe as imagens e confirme que nenhum título cobre um rosto ou o objeto principal;
  - salve a folha em `renders/folha.jpg` (ffmpeg tile).
- Determinismo: confira com `--at X,0,X`.
- Confirme que existe `assets/audio/sfx.mp3`.

## Resposta final (até 180 palavras)
1. **Capítulos:** 5, cada um com `[início, "NOME"]`.
2. **HUD:** 1 a 3 medidores no formato `video.json → doc.hud`.
3. **Resumo:** o que ficou bom e o que ficou fraco.
