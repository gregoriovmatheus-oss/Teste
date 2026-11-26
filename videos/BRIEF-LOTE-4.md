# Lote 4: 3 vídeos "E se…" (vulcões, regenerar membros, desertos viram florestas)

Leia antes, nesta ordem e rápido: `BRIEF-BUILD.md`, `BRIEF-ESTILO-DOC.md` `BRIEF-LOTE-2.md` e `BRIEF-LOTE-3.md`. O lote 3 é o estilo-base (o usuário aprovou); este lote só melhora os personagens. Leia também `../.claude/skills/video-curiosidades/AUTOCRITICA.md`, porque os erros listados lá não podem se repetir. Este arquivo só diz o que muda.

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
  - R11: `../teste-kit2/cenas/*.js` e as cenas R11 do lote 3 (`../terra-dois-sois`, `../sem-dor`, `../humanos-hibernam`).
  - **API nova dos personagens (v4):** leia `../../.claude/skills/video-curiosidades/SKILL.md` (seção R11) e a seção "Onde está cada coisa" de `GANHOS-3D.md`. Exemplo de uso de tudo: `../_previa-anima/previa.html` e `previa2.html`.
- **Não rode** `scripts/cenas.py`, `gera-hud-legendas.py` nem `doc.py`. Sem render final, commit nem push.

## Estilo: look do lote 3 + personagens R11 v4
- **Cenas de escala e dado (cerca de 7–8 das 13):** look do lote 2/3.
  - Cinema 3D R10: PBR, grão, vinheta, bloom e câmera sempre em movimento.
  - Tipografia doc nos rótulos: kicker azul `#7cc8ff`, palavra-chave `.y` e acento laranja `#ff8a4c` (copie o `css` do META das cenas do lote 3).
- **Toda cena com gente (cerca de 5–6): R11 v4** (`lowpoly.js` + `cinema.js`, META `"imports": ["lowpoly","cinema"]`).
  - É o foco deste lote: o usuário pediu personagens mais vivos. Use o novo: `vida`, expressões (`choro`, `nervoso`, `surpresa`, `alegre`...), `emocaoMix`, `alcancar`/`pontoCabeca`, `andar`/`correr`/`sentar`/`tremer`, `falarPalavras`, `figurante` para multidão, `luzPratica`, `clima`, `trilho`/`focar`/`camMao`, `poeira`/`chuva`/`fumaca`/`fogo`/`ceu` quando couber.
  - Em cada `render(t)`: `LP.ator(p, t, {...})` (já faz reset → poses → emoção → fala → vida) e `CINEMA.plano(st, rosto, t, t/D, "close")` para a câmera; IK (`alcancar`) vai entre o `ator` e o `st.draw()`. Escreva pouco código por cena.
  - Nada de silhueta (`animals.js → humano`): pessoas sempre R11.
  - A f01 é R11 (frame 0 = miniatura: rosto expressivo e premissa) e a f13 volta à mesma imagem.
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
