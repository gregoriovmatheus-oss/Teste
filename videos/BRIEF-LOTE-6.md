# Lote 6: 3 vídeos "E se…" (sonhos lúcidos, encontros restantes, relógio da vida)

Leia antes, nesta ordem e rápido: `BRIEF-BUILD.md`, `BRIEF-ESTILO-DOC.md` `BRIEF-LOTE-2.md` e `BRIEF-LOTE-3.md`. O lote 3/4 é o estilo-base (o usuário aprovou). Exemplos R11 mais recentes: `../quatro-bracos`, `../terra-aneis`, `../parar-envelhecer` (lote 5, mais recente). Leia também `../.claude/skills/video-curiosidades/AUTOCRITICA.md`, porque os erros listados lá não podem se repetir. Este arquivo só diz o que muda.

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

## Estilo: look do lote 3/4 + personagens R11 v12
- **Cenas de escala e dado (cerca de 7–8 das 13):** look do lote 2/3.
  - Cinema 3D R10: PBR, grão, vinheta, bloom e câmera sempre em movimento.
  - Tipografia doc nos rótulos: kicker azul `#7cc8ff`, palavra-chave `.y` e acento laranja `#ff8a4c` (copie o `css` do META das cenas do lote 3).
- **Toda cena com gente (cerca de 5–6): R11 v13** (kit CONGELADO: NÃO mude `lowpoly.js` nem `cinema.js`; o usuário pausou melhorias) (`lowpoly.js` + `cinema.js`, META `"imports": ["lowpoly","cinema"]`).
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

## Tom deste lote
- **85% lúdico, 15% ciência**: cenas mágicas, oníricas, emocionantes; o dado científico aparece rápido e limpo (1 número por vez). Mais cenas R11 com gente do que no lote 5 (≈ 8–9 de 13), porque os temas são sobre pessoas.
- Os números "flutuando sobre a cabeça" (encontros, relógio) ficam **acima da cabeça, mas dentro da zona 640–1000 ou acima de 640** e nunca cobrem o rosto. Use contador que gira/muda (`palavras.json` para sincronizar).

## Específico de cada vídeo
- **sonhos-lucidos:** pessoa dormindo (`pose "deitado"`, `emocao "dormindo"`) que abre os olhos dentro do sonho (f01 = rosto surpreso/maravilhado, céu onírico roxo-azul). Lugares: praia em Marte (chão vermelho, 2 luas), cidade nas nuvens, casa de infância (cores quentes, desfoque). Ciência: "metade" (barra/pizza ~55%), sono REM (gráfico de ciclos do sono, cérebro brilhando R10), "duas horas". Voar sobre o oceano, reencontro (abraço suave, luz quente), ensaio de conversa. Músico com notas flutuando, atleta na cama. "Bom demais": cama gigante brilhante, pessoa que não quer acordar. Dúvida ao acordar (quarto que tremula/ondula). Truque: mãos em close (dedos mudando de número, texto que embaralha). f12 gente contando dedos na rua. f13 volta à f01: a pessoa olha as próprias mãos, olhar para câmera.
- **encontros-restantes:** número flutuando acima da cabeça de cada pessoa (amigo 3.000, colega do ônibus 27, mãe = número borrado). Conta 10 × 20 = 200 (contas/pontinhos que somem). Gráfico de "tempo com os pais" com a maior parte na infância (barra preenchida que fica para trás). Viés de escassez (ampulheta/objeto raro brilhando). Café não cancelado, despedidas, abraço longo (`alcancar`), ligação. Número 1 sobre alguém amado (emoção triste, luz fria). Tentar marcar mais encontros (agenda/calendário). "Terça qualquer" (rua comum, número 1→0 discreto, sem morte explícita). f12 números somem: "já existe". f13 volta à f01 e termina num abraço.
- **relogio-da-vida:** relógio digital acima da cabeça (bebê 84 anos, senhor 6 anos, motoboy 3h — moto estilizada low-poly, nada de acidente explícito). Tom leve e sem gore: nunca mostrar morte ou corpo. "Cuidado hoje!" (pessoa gritando, outros ignorando). 170 mil/dia (mapa-múndi R10 com pontos piscando ou contador). Expectativa 76 anos (curva/sino de probabilidade R10). Paradoxo (relógio que glitcha/muda ao avisar). Herói secreto correndo pela cidade (`correr`). Peso sozinho (pessoa sentada, triste, chuva). Empresas/governos (prédios frios, olhos de câmera). Espelho com o próprio relógio borrado. Contraste décadas desperdiçadas vs horas intensas (split). f13 volta à f01, relógios somem, sol nascendo.
