# Briefing de montagem (4 vídeos científicos "E se…")

Leia este arquivo inteiro antes de começar. Responda e escreva em PT-BR.

## O que já existe no seu projeto `videos/<slug>/`
- `SCRIPT.md`: a narração (1 linha = 1 cena). **Não mude o texto.**
- `assets/audio/narracao.mp3` (Kokoro), `audio/palavras.json` (tempo de cada palavra) e `video.json` (cenas f01… com início e fim, já fechados).
- `index.html` (gerado), `compositions/captions.html` (legendas prontas, faixa y 1045–1215).
- `assets/lib/` com a lib R10 "cinema 3D realista". Leia os **cabeçalhos** de `assets/lib/blocks/toy.js`, `globe.js`, `animals.js`, `particles.js` e `kit.js`. Não precisa ler as funções inteiras.
- `scripts/monta-cenas.py`: gera `compositions/fNN.html` a partir de `cenas/fNN.js`.
- **Exemplo do formato `cenas/fNN.js`:** veja `../humanos-viram-animais/cenas/` (ex.: `f16.js`, `f06.js`, `f12.js`). Leia 2 ou 3 delas para pegar o padrão:
  - o cabeçalho `/*META {...} */` traz `imports` e `rotulos` (títulos 2D);
  - em seguida vem o corpo, que cria `st` e `function render(t)`.

## O que você entrega
1. **`STORYBOARD.md`** curto:
   - bíblia de estilo de 5 linhas;
   - uma tabela `cena | tempo | plano/movimento de câmera | ação | elemento científico na tela`.
2. **`cenas/fNN.js`** para TODAS as cenas do `video.json`, depois `python3 scripts/monta-cenas.py`.
3. **Som:**
   - adapte `audio/sfx-local.py`: whoosh em cada corte (mantém) e efeitos nas ações visíveis do SEU vídeo. Apague os de outro vídeo, como os "puf" de f01 e as batidas de f02/f03;
   - rode a partir da pasta do projeto: `python3 audio/sfx-local.py && ffmpeg -y -loglevel error -i assets/audio/sfx.wav -b:a 128k assets/audio/sfx.mp3 && rm assets/audio/sfx.wav`;
   - adicione ao `index.html`, logo após a linha da trilha, a tag `<audio id="sfx" class="clip" src="assets/audio/sfx.mp3" data-start="0.0" data-duration="<duracao>" data-track-index="12" data-volume="0.5"></audio>`. Ela some se `scripts/cenas.py` rodar de novo, então não rode `cenas.py`.
4. **Verificação:**
   - `npx --yes hyperframes@0.9.52 check --json` sem erros;
   - `PREVIA_SEM_VIDEO=1 bash scripts/previa.sh`: abra `renders/previa-folha.jpg` com Read e corrija o que estiver feio, vazio, preto, cortado ou ilegível;
   - para olhar cenas específicas, use `npx --yes hyperframes@0.9.52 snapshot . --at <t1>,<t2> --no-end -o renders/snap` e abra os PNG;
   - confira determinismo: `--at X,0,X` dá dois quadros idênticos.
   - **Não** renderize o vídeo final, **não** faça commit nem push. Isso é comigo.
5. **Resposta final** (até 150 palavras): o que cada cena mostra, o que conferiu e o que ficou fraco.

## Nível exigido (o usuário quer cinematográfico, "nível vídeo viral 'e se a gravidade sumisse por 5 s'")
- **Estilo único R10 em todas as cenas:** PBR, céu e iluminação reais, grão, vinheta, "câmera na mão" e dip escuro entre cenas. Tudo isso já vem pronto em `st.draw` do `toy.js`. Use `createToyStage` em todas as cenas 3D, inclusive no espaço (fundo preto, estrelas, ambiente fraco). Para o espaço, crie o céu à mão:
  - estrelas como `Points` com seed;
  - Sol emissivo com halo em sprite aditivo;
  - Terra via `globe.js`, com lado noturno escuro e luz direcional do Sol.
- **Câmera SEMPRE em movimento** (dolly, grua, órbita, travelling ou zoom) e nenhum enquadramento repetido. Alterne: terra (chão) → espaço → explicação científica visual (diagrama 3D com setas e rótulos 2D) → terra…
- **Transformações acontecendo diante do espectador**, não estados parados. Exemplos: a água recuando em tempo real, a Lua sumindo, a vegetação crescendo, o prédio rachando e caindo.
- **Cada informação falada aparece na tela no momento em que é dita.** Use os tempos de `audio/palavras.json` (subtraia o `inicio` da cena) para sincronizar.
  - **Números:** use os `rotulos` (Anton, destaque `<span class="y">` âmbar), em y 640–1000. Nunca sobre a legenda (1045–1215) e nunca acima de 168 px.
- **Ciência correta.** Os diagramas (forças, marés, luz viajando, órbita) precisam estar fisicamente coerentes:
  - setas de força apontando para a Lua;
  - os dois bojos de maré;
  - a maré solar menor;
  - a órbita circular com o Sol no centro.
- **Gancho no frame 0:** a imagem já é forte e já há movimento.
- **Desempenho:**
  - o render é WebGL por software;
  - no máximo ~40k triângulos visíveis e 1 luz com sombra;
  - partículas como `Points`/`InstancedMesh`;
  - nada de `requestAnimationFrame`, `Math.random` nem `Date`: tudo vem de `t` e de `mulberry32(seed)`.
- **Animais e pessoas:** use `animals.js` (veja `TIPOS`). Se faltar algum, como peixe, baleia, coral, besouro, caranguejo ou lobo, construa com primitivas arredondadas no mesmo estilo realista-animado e silhueta clara.
- Não use nada de terceiros: nenhum personagem, marca ou logotipo.
