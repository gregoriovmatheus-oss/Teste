---
name: video-curiosidades
description: Fluxo enxuto para vídeos curtos animados de curiosidades e explicações em português, no formato vertical 9:16 de 60 a 80 segundos (TikTok, Reels, Shorts). Use quando o usuário pedir um vídeo, animação, storyboard ou roteiro do tipo "e se...", "curiosidades sobre...", "explica em vídeo...", ou quiser ajustar um vídeo desse tipo já em andamento.
---

# Vídeo de curiosidades (9:16, PT-BR) — versão 2.0 (21/11)

Fixa o que o usuário já decidiu, para não perguntar de novo. O fluxo abaixo é o que de fato produziu os 11 vídeos (`videos/`); o kit em `kit/template` é cópia dele. Antes de planejar um vídeo novo, leia `AUTOCRITICA.md` (1 min): lista os erros que já cometi e não posso repetir.

## Padrões (não pergunte de novo)

| Item | Padrão |
| --- | --- |
| Formato | 1080×1920, 30 fps, 60–80 s (alvo ~75 s) |
| Idioma | PT-BR na narração e nas legendas |
| Arco | Gancho → escala → mergulho pessoal → consequências **humanas e do cotidiano** → contraste → fechamento que volta à imagem do começo |
| Estilo | **R11 em ≥ 85% das cenas** (ver `referencias/REFERENCIAS.md`, "Padrão atual"). R10/R01/R08/R03 só em cenas de dado, escala ou "dentro da mente" |
| Narração | Kokoro local e grátis (voz `pm_alex`), velocidade **1.08** (~200 palavras ≈ 75 s). ElevenLabs só se o usuário pedir; clonagem de voz foi abandonada |
| Legendas | Palavra por palavra (`palavras.json`). R11: Anton caixa alta, contorno preto, números em amarelo |
| Som | Trilha em loop + `sfx.mp3` único gerado local (whoosh nos cortes, efeitos nas ações) |
| Entrega | MP4 crf23 com `git add -f`, commit e push no branch e no `main` |

O usuário pode mudar qualquer padrão para um vídeo; se disser que é permanente, atualize esta tabela.

## Como o usuário trabalha (aprendido)

- Quer **ver imagens antes** (personagens, animais, zooms) e aprovar; mande **uma folha de contato**, nunca cada rodada.
- Pede **rapidez e pouco gasto de tokens**: rodadas grandes, prévias pequenas, sem repetir texto no chat.
- Referências dele são **só estilo**: nunca personagem, marca, logo ou cena de terceiros.
- Gosta de consequências **concretas para pessoas** (energia, comida, GPS, trabalho), não só física.
- Quando pede "só a legenda", é o texto corrido, sem cena nem tempo.
- Se o limite de uso acabar, **volte ao trabalho sozinho** quando liberar.

## Fluxo 2.0 (comandos)

```bash
bash .claude/skills/video-curiosidades/kit/scripts/novo-video.sh <slug>          # ref padrão R11
cd videos/<slug>
# 1. SCRIPT.md: uma linha por cena depois do "---" (12–13 cenas, ~200 palavras). Mostre tabela tempo|visual|fala e espere aprovação.
bash scripts/narrar.sh                     # instala o Kokoro na 1ª vez (~350 MB em ~/.cache/kokoro)
python3 scripts/cenas.py "<2 primeiras palavras de cada linha>"... --cauda 1.4 --criar
python3 scripts/gera-hud-legendas.py --sem-hud
# 2. cenas/fNN.js (ver abaixo) + audio/sfx-local.py reescrito para as cenas -> assets/audio/sfx.mp3
python3 scripts/monta-cenas.py && python3 scripts/doc.py && python3 scripts/cenas.py <mesmas palavras> --cauda 1.4   # cenas.py repõe a tag do sfx
npx --yes hyperframes@0.9.52 check --json
npx --yes hyperframes@0.9.52 snapshot . --at <t1,t2,...> --no-end -o renders/snap    # folha de contato; NUNCA durante um render
setsid nohup bash ../../.claude/skills/video-curiosidades/kit/scripts/fila-render.sh <slug> > /tmp/fila.out 2>&1 &   # ~35–47 min/vídeo
```

- **`video.json → doc`:** `capitulos [[t,"NOME"]]` + `hud [{rotulo, unid, fmt, keys, max, alerta, de, ate}]`. Sem `ate`, o medidor some no fim do capítulo; `"ate": "fim"` mantém.
- **Cena (`cenas/fNN.js`):** cabeçalho `/*META {"imports": ["lowpoly"], "rotulos": [{de, ate, top, texto, sai}], "D0": dur} */`, depois o corpo, que cria `st` e `render(t)`. O tempo é local à cena; use `D`, `range`, `ease` e `lerp` do kit.
- **R11 (`assets/lib/blocks/lowpoly.js`):**
  - `palco(canvas, {foco, faixa, desfoque})` usa o renderizador compartilhado: um contexto WebGL só para o vídeo inteiro.
  - Personagens e cenário: `pessoa({seed, longo, barba, pele, cabelo, jaqueta, camisa, iris})` com `.emocao("calmo|medo|panico|triste|foco", [olharX, olharY])`; `corvo()`, `polvo()`, `molecula("N2"|"O2")`, `bokeh(S)`.
  - **Animação (23/11):** a `pessoa` tem esqueleto (`quadril`, `coluna`, `pescoco`, `cab`, `bracos[i].om/cot/pulso/dedos`, `pernas[i].q/j/pe`). Em cada `render(t)`, chame `p.reset()`, depois `pose(p, "sentado|maoRosto|maosCabeca|apontar|susto|espreguicar|encolhido|pensativo|comemorar|deitado", k)` e/ou `andar(p, t)` (devolve a distância), depois `p.emocao(...)` e por último `vida(p, t, {seed})`, que faz a respiração, o balanço e as piscadas.
    - Expressões: calmo, medo, panico, triste, foco, alegre, surpresa, grito, dor, sono, dormindo, raiva. `p.emocaoMix(a, b, k)` faz a transição entre duas.
    - Mão num ponto exato: `alcancar(p, lado, vec3, k, {polo, maoGira})` (IK de 2 ossos) + `pontoCabeca(p, "boca|bochecha|testa|topo|nuca", lado)`. Use para mão no rosto, mãos na cabeça, segurar objeto e tocar algo. Para as mãos na cabeça, passe `polo: (s, 0.3, -0.2)`, que leva o cotovelo para fora.
    - Diálogo: `falar(p, t, {seed})`, chamado depois de `emocao`. As bochechas sobem no sorriso e na dor, e as rugas aparecem na raiva e na dor.
    - Outros: `olharPara(p, vec3, k)`, `punho(p, k)`, que fecha as 2 falanges.
    - Cinema (pós e luz): `palco(...)` agora traz oclusão de ambiente, névoa, raios, bloom, aberração, bokeh oval, split-tone e curva S. Para ligar, use `luz(st, "noite|por-do-sol|interior|dramatica|dia|frio")`, `st.sol(vec3, força)` para os raios, `focar(st, vec3)`, `camMao(cam, t)` e `poeira(S, {...}).update(t)` (poeira ou neve).
    - Lip-sync: `falarPalavras(p, t, palavras, t0)`, onde `t0` é o início da cena.
    - **Atalhos (26/11, use por padrão: menos código e menos tokens por cena, render igual):**
      - `LP.ator(p, t, {seed, pose, andar, correr, gestos, tremer, olharPara, emocao: "medo"|["calmo","alegre",k], olhar, fala: [palavras, t0]|true})` faz `reset`, poses, olhar, emoção, fala e `vida` na ordem certa, numa linha. Devolve a distância andada.
      - `CINEMA.plano(st, rosto, t, t/D, "close|extremo|medio|aberto|ombro|baixo|alto|orbita", {lado, de})` dá o enquadramento pronto, com push-in lento, câmera na mão e foco. O rosto fica acima da zona do título. Prévia: `videos/_previa-anima/folha-anima-v5-ator.jpg`.
      - Já automático no `vida`/`andar`: mão relaxada (dedos em leque), peso alternando nos joelhos, ombros na respiração, olhos que chegam antes da cabeça no `olharPara`, antebraço atrasado no andar e cabeça estável.
    - **`cinema.js`** (META `"imports": ["lowpoly", "cinema"]`, global `CINEMA`): câmera (`trilho`, `dollyZoom`, `focoEntre`), luz prática (abajur, celular, vela, TV, poste), `piscar`, `gobo`, `chaoMolhado`, `clima` (sépia, pesadelo, sonho, memória, hospital, alerta), `ceu`, `chuva`, `fumaca`, `fogo`, `agua`, `vento`, `cenario(...)` e bichos.
    - Lista completa dos 100 ganhos e da API: `GANHOS-3D.md`. Leia só a seção "Onde está cada coisa". Prévia: `videos/_previa-anima/folha-anima-v3-cinema.jpg`.
    - Multidão: `figurante({seed, roupa, pele})`, com o mesmo esqueleto e as mesmas animações e cerca de 10× menos triângulos. Não use mais o `humano` de `animals.js`.
    - Bichos: `urso()` (`respira`, `dormir(k)`, `andar(t)`) e `lemure()` (`respira`, `enrolar(k, t)`, `cauda(t)`).
    - Prévia: `videos/_previa-anima/folha-anima.jpg`.
  - Texto: `etiqueta(ctx, txt, pos3d, cam, alfa)` já fica dentro da área segura.
  - Foco: `foco` é a distância da câmera ao rosto, e o fundo desfoca sozinho.
- **Delegar a montagem:** um agente por vídeo, no máximo 2 ao mesmo tempo (5 juntos estouraram o limite). O brief tem que dizer: sem render, sem commit, sem rodar `cenas.py`/`doc.py`, e devolver os capítulos e o HUD.

## Regras de cena (9:16)

- **Frame 0** é a miniatura: rosto expressivo e premissa na legenda. Nunca tela preta.
- **Ritmo:** corte a cada 1,5–3 s e câmera sempre em movimento. A R11 alterna close extremo (rosto, mão, objeto), corte lateral e plano aberto.
- **Zonas, em y:**
  - HUD: 190–520.
  - Títulos e rótulos: 640–1000.
  - Legenda: 1045–1215.
  - Nada abaixo de 1330 e nada sob a coluna de botões à direita (x > 960).
  - **Confira no snapshot se o título cobre o rosto ou o objeto principal.** Isso já aconteceu três vezes.
- **Números:** cada número narrado aparece na tela na hora em que é dito.
- **Determinismo:** sem `Math.random`, `Date` nem `requestAnimationFrame` (use `mulberry32`). Os quadros em `--at X,…,X` precisam ser idênticos.
- **Limite:** ≤ 40 mil triângulos visíveis por cena (WebGL por software).

## Ajustes depois da 1ª versão

- Edite só a cena afetada e rode `monta-cenas.py fNN` e um snapshot dessa cena. No chat, diga só o que mudou.
- Mudou o texto: rode `narrar.sh` de novo e depois `cenas.py` com as mesmas palavras. As cenas se esticam sozinhas, porque o `D0` fica guardado no META.
- Junte vários ajustes num único render.
