# Adendo de estilo: padrão "documentário espacial" (referência do usuário)

O usuário mandou um vídeo de exemplo, "E se a gravidade sumisse por 5 s", e quer pelo menos 75% de semelhança em qualidade, enredo e tipo de animação.

## Como é o exemplo
- **Abertura:** a Terra realista vista do espaço, com fotos de satélite, nuvens, atmosfera azul brilhando na borda, campo de estrelas e Via Láctea.
- **Título no centro:**
  - kicker em JetBrains Mono, espaçado e azul `#7cc8ff`, ex.: "UM EXPERIMENTO MENTAL";
  - pergunta em Inter Light (300), branca;
  - palavra-chave em Inter ExtraBold (800) com degradê do branco para `#9fd6ff`.
- **Capítulos:** "01 O PLANETA", "02 O DESAPARECIMENTO", "03 O CAOS", "04 O PLANETA EM COLAPSO", "05 O RETORNO". Ficam no canto superior esquerdo, com o número grande em azul. Isso agora é gerado por mim no `doc.html` a partir de `video.json` → `doc`.
- **HUD de instrumento:**
  - fica no topo, em fonte mono, com rótulo pequeno e valor à direita, ex.: "GRAVIDADE 9.81 m/s²";
  - barras finas de 2 px servem de medidor;
  - "T+0.52 / 5.00 s" marca o tempo do evento;
  - o valor fica laranja `#ff8a4c` quando o evento acontece;
  - "CÂMERA LENTA · 5.5×".
- **Cenas:**
  - órbita → mergulho até a cidade ao entardecer ("CIDADE · 18:42 · NÍVEL DA RUA");
  - o evento acontece em câmera lenta, com rastros radiais (streaks) e desfoque de movimento;
  - o caos é mostrado de perto;
  - o planeta é visto de longe;
  - o retorno;
  - frase final de reflexão.
- **Luz e acabamento:** iluminação de cinema, com bloom forte nos pontos claros (Sol, luzes, borda da atmosfera), tom ACES e contraste escuro e profundo.
- **Legenda documental:** frases curtas e precisas, números em mono.

## O que eu já preparei (shared lib de cada projeto). NÃO edite estes arquivos: `toy.js` (só bloom), `terra.js`, `monta-cenas.py`, `index.html`, `captions.html`, `doc.html`
- **`assets/lib/blocks/terra.js` (NOVO): use em TODA cena de espaço** no lugar do `globe.js`. O cabeçalho do arquivo explica a API. Ele traz:
  - a Terra real com textura NASA Blue Marble, luzes noturnas, máscara de água especular, nuvens e atmosfera;
  - o parâmetro `seco` (0–1), que transforma o oceano em fundo marinho exposto, derivado da batimetria da imagem;
  - `luzSol` (0–1), que regula a luz do Sol;
  - `luzes`, a intensidade das luzes das cidades;
  - estrelas e Via Láctea, a Lua com crateras e o Sol com halo.
- **`st.bloom`:** o bloom 2D fica no `st.draw` (padrão 0.35). Suba para 0.6–0.9 em cenas com Sol ou luzes.
- **Títulos `rotulos`:**
  - CSS novo, em Inter 300 e com caixa normal;
  - `<span class="y">` vira a palavra-chave em 800 com degradê azul;
  - `<span class="k">TEXTO</span><br>` é o kicker em mono azul, antes do título;
  - escreva em caixa normal (não tudo em maiúsculas).
- **Legendas e HUD:** são meus.

## O que muda nas suas cenas
- **Estrutura em 5 capítulos,** como no exemplo:
  - 01 o mundo normal;
  - 02 o evento;
  - 03 as consequências imediatas;
  - 04 a escala planetária/consequências maiores;
  - 05 o retorno/reflexão.
- Mande na sua resposta final os tempos de início de cada capítulo e o nome de cada um. Eu monto o HUD.
- **A abertura do vídeo** deve ter a mesma pegada do exemplo, adaptada ao seu tema:
  - gancho forte em 9:16;
  - câmera que se move devagar e com peso;
  - o momento do evento em câmera lenta, com rastros/partículas e desfoque.
- **Ritmo:** quanto à alternância espaço ↔ chão ↔ diagrama, a câmera sempre se move e nenhum enquadramento se repete.
- **Paleta:** noturna/espacial e profunda nas cenas de espaço; entardecer nas cenas de cidade. Use o acento azul `#7cc8ff` nos diagramas (setas, linhas de força) e o laranja `#ff8a4c` para o que é "anomalia".
