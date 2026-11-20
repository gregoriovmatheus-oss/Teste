# Lote 2: 5 vídeos "E se…" (temas humanos e mentais)

Leia antes `BRIEF-BUILD.md` e `BRIEF-ESTILO-DOC.md`. Este arquivo só diz o que muda.

## O que já existe no seu projeto
- **Base:** o projeto foi clonado de `../humanos-somem-100-anos/`. Tem as mesmas libs: `toy.js` com bloom, `terra.js`, `animals.js` e o resto. Use as cenas de lá como exemplo do formato `cenas/fNN.js`, ex. `f01.js`, `f06.js`, `f12.js`.
- **Áudio, tempos e legendas:** a narração, `audio/palavras.json`, `video.json` (cenas com início e fim) e `compositions/captions.html` já estão prontos. Não mude o `SCRIPT.md`.
- **SFX:** `index.html` já tem a tag `<audio id="sfx">`. Você gera `assets/audio/sfx.mp3`.
- **`audio/sfx-local.py`** ainda é o do vídeo dos humanos. Reescreva a parte dos efeitos para as suas cenas e mantenha os whooshes nos cortes.
- **Não rode `scripts/cenas.py`, `gera-hud-legendas.py` nem `doc.py`.** O HUD e os capítulos são meus.

## Estilo (mesmo nível dos 4 vídeos anteriores)
- **Look:** cinema 3D R10, com PBR, grão, vinheta, dip e bloom; tipografia doc (Inter e JetBrains Mono, kicker azul, palavra-chave `.y` em degradê); acento azul `#7cc8ff` e laranja `#ff8a4c` para a "anomalia".
- **Os temas são de pessoas, mente e corpo, não de espaço.** Use a Terra (`terra.js`) no máximo numa cena, e só se fizer sentido.
  - **Cenários:** metrô, rua, quarto, laboratório, fazenda, oceano.
  - **Visuais abstratos de "dentro da mente":** neurônios, ondas sonoras, partículas e diagramas 3D.
- **Pessoas:** use `animals.js` → `humano`, com silhueta clara, sem rosto realista e roupas variadas. Multidão é `InstancedMesh` ou poucas dezenas de humanos baratos.
- **Cada fato narrado aparece na tela no momento em que é dito,** sincronizado por `palavras.json`. Isso vale para números, contadores e rótulos 2D no canvas.
- **Câmera:** sempre em movimento, sem enquadramento repetido, gancho forte no frame 0 e fechamento voltando à imagem do começo.
- **Peças reutilizáveis:** crie um helper do vídeo em `assets/lib/blocks/<nome>.js`, como o `avenida.js`/`solkit.js` dos outros, e importe-o nas cenas.
- **Limites:** ≤ 40k triângulos visíveis, nada de `Math.random`/`Date`/`requestAnimationFrame`, e o determinismo `--at X,0,X` precisa dar quadros idênticos.

## Entrega
Siga a seção "Verificação" do `BRIEF-BUILD.md`:
- `check` sem erros;
- prévia com folha de contato;
- snapshots;
- conferir que a tag do sfx está no `index.html`.

**Sem render final, commit nem push.**

Na resposta final, com até 180 palavras:
1. **Capítulos:** 5, cada um com `[tempo de início, "NOME"]`.
2. **Medidores do HUD:** 1 a 3 no formato de `video.json` → `doc.hud`, ex.: `{"rotulo": "MENTES OUVIDAS", "fmt": "int", "keys": [[t, v], ...], "max": N, "alerta": [[t0, t1]], "de": t}`. O `fmt` pode ser int, f1, f2, mmss, hhmm, bi ou texto.
3. **Resumo:** o que conferiu e o que ficou fraco.
