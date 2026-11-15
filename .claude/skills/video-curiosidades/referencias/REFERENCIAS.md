# Referências de vídeo

Escrito por `/ref`. `video-curiosidades` lê **só a seção "Padrão atual"**, e um cartão inteiro só se o vídeo usar aquela referência. As imagens nesta pasta são só arquivo: não abra de novo, porque os cartões já trazem tudo o que importa.

Servem só como estilo. Nunca use nos vídeos personagens, marcas, logotipos, cenas ou textos de terceiros.

## Padrão atual

- **Gancho (frame 0):** a pergunta inteira na tela em serifa grande, branca e centralizada, com a palavra-chave em azul-gelo. Ao fundo, cena 3D com a câmera já em movimento. (R01)
- **HUD fixo de tensão:** fica no topo, entre y 280 e 600, durante o mesmo trecho. São três camadas:
  - um rótulo em caixa alta com letras espaçadas;
  - um número grande em serifa (contador ou cronômetro), com a unidade pequena ao lado;
  - uma linha de status em âmbar, que muda a cada cena. (R01)
- **Legenda:**
  - Tom sério ou cinematográfico: serifa itálica branca com sombra suave, 1 ou 2 linhas, centralizada em y ≈ 1100–1200. (R01)
  - Tom popular ou humor: sans condensada em caixa alta e negrito, branca com contorno ou sombra preta, na mesma altura. (R02)
- **3D:** cara de maquete de arquitetura, com geometria limpa e pouco detalhe, sem textura fotográfica. Paleta dessaturada, com um único elemento de cor forte (no R01, o vermelho). Efeitos (geada, rachaduras) aplicados por cena, como transformação do mesmo cenário. (R01)
- **2D flat:** personagens simples de cabeça redonda e roupas lisas, fundo escuro e dessaturado, com pontos de luz amarela. (R02)
- **Fontes (Google Fonts):**
  - Serifa: `EB Garamond` (ou `Cormorant Garamond`).
  - Caixa alta espaçada: `Montserrat` 600, letter-spacing 0,3em.
  - Legenda popular: `Anton`.
- **Cores-base:**

  | Uso | Hex |
  | --- | --- |
  | Texto | `#FFFFFF` |
  | Azul-gelo (destaque) | `#8FCBF2` |
  | Âmbar (status) | `#E8B24A` |
  | Cinza-frio (fundo) | `#8D96A2` |
  | Geada | `#EEF2F6` |
  | Acento | `#D8432F` |

## Cartões

### R01: "zero absoluto por 5 s" (3D, tom cinematográfico)

Arquivos: `R01-*.jpg`. Engajamento baixo (579 curtidas). Vale pelo visual, não como prova de viralidade.

- **Conceito:** o vídeo inteiro é uma contagem regressiva ("O CALOR VOLTA EM 4,53 s") e cada cena mostra um efeito: a umidade vira gelo, as folhas congelam, os vidros trincam.
- **HUD:**
  - Rótulo: Montserrat 600, cerca de 26 px, letter-spacing 0,35em, branco, em y ≈ 300.
  - Contador: EB Garamond, cerca de 150 px, branco, com o "s" pequeno ao lado, em y ≈ 400.
  - Linha secundária: "AR" pequeno, seguido de "−273" em serifa azul-gelo e "°C" pequeno, em y ≈ 520.
  - Status: âmbar, caixa alta espaçada, cerca de 22 px, em y ≈ 575.
- **Legenda:** EB Garamond itálica, cerca de 70 px, branca, com sombra de desfoque de 12 px, 1 a 2 linhas, em y ≈ 1120. Uma palavra isolada ("térmico") também funciona.
- **Gancho:** "E se" pequeno em itálico, depois a pergunta em 4 linhas de cerca de 90 px, com "zero absoluto" em azul-gelo.
- **Câmera:** drone sobre avenida (diagonal), close de árvore, contra-plongée de prédio. Corte a cada 1,5–3 s.
- **Cena:** cidade em maquete clara, de dia, que congela progressivamente (névoa fria, partículas de neve, geada branca nas superfícies, rachaduras brancas ramificadas nos vidros).

### R02: "emprego em 2050" (2D flat, tom popular)

Arquivo: `R02-2d-fila.jpg`. Engajamento alto (45,4 mil curtidas, 3,8 mil salvamentos).

- **Visual:** 2D flat com leve sombreado. Fila de personagens com capuz em cores sóbrias (cinza, vermelho, azul, marrom). Chuva em traços finos, fachada com janelas amarelas e placa grande com texto ("SEM VAGAS").
- **Legenda:** Anton ou similar, cerca de 80 px, caixa alta, branca com sombra preta dura, em y ≈ 1120. Frase curta com ponto final para dar impacto ("NÃO EXISTE.").
- **Paleta:**

  | Uso | Hex |
  | --- | --- |
  | Fundo | `#3B423F` |
  | Janelas | `#F2C94C` |
  | Pele | `#E8A86B` |
  | Chuva | `#C9C27A` |

### R03: formas abstratas 3D (tech, conceitos)

Arquivo: `R03-formas-abstratas.jpg`. Imagem solta, sem dados de engajamento.

- **Visual:** primitivas flutuando (toro, ovo, cilindro, cruz), poliedros em wireframe, pílula de vidro com uma onda dentro e fita translúcida atravessando a cena. Profundidade de campo rasa e bolinhas brilhantes.
- **Material:** fosco com grade fina tipo malha, vidro jateado e alguns objetos em espiral sulcada.
- **Paleta:**

  | Uso | Hex |
  | --- | --- |
  | Fundo | `#1E1A33` |
  | Violeta | `#7B3FE4` |
  | Lilás | `#B05CF0` |
  | Laranja | `#F07A3A` |
  | Azul | `#3E7BFA` |

- **Uso:** IA, internet, matemática, ideias abstratas, aberturas e transições. Leve no Three.js (vidro com `transmission` só em 1 ou 2 objetos).

### R04: diorama de massinha (geografia, lugares)

Arquivo: `R04-diorama-massinha.jpg`. Sem dados de engajamento.

- **Visual:** blocos isométricos de 3×3 com cantos arredondados e base em camadas, cada bloco com um mini-mundo (fazenda, farol, cidade, pista com avião, ilha, balão). Massinha, água com textura ondulada, fundo preto.
- **Paleta:**

  | Uso | Hex |
  | --- | --- |
  | Laranja | `#F08A3C` |
  | Turquesa | `#3FB6C8` |
  | Verde | `#7CC54A` |
  | Vermelho | `#E5463A` |
  | Creme | `#F3D9A4` |
  | Fundo | `#111111` |

- **Câmera:** isométrica de cima, zoom num bloco, troca de bloco por cena.
- **Uso:** países, cidades, economia, "como seria o mundo se...", comparar lugares, ciclos (água, energia).

### R05: personagem 3D estilo animação (reação, corpo humano)

Arquivo: `R05-personagem-3d.jpg`. Sem dados de engajamento.

- **Visual:** menino cartoon de cabeça grande, olhos enormes e boca aberta de espanto, camiseta amarela, rua com luz de fim de tarde e fundo desfocado.
- **Paleta:**

  | Uso | Hex |
  | --- | --- |
  | Pele | `#F2B48A` |
  | Camiseta | `#F2B53A` |
  | Tijolo | `#D9583B` |
  | Céu | `#8CC7D8` |

- **Uso:** narrador ou reação, corpo humano, cotidiano, humor.
- **Limite:** no Three.js à mão sai simplificado (esferas e cápsulas de massinha). Qualidade igual à imagem só com geração de imagem ou vídeo, que é paga.

### R06: 2D flat explicativo (sociedade, trabalho)

Arquivo: `R06-2d-explainer.jpg`. Imagem de anúncio, sem dados.

- **Visual:** pessoas em vetor flat com roupas monocromáticas roxas, cartões de interface com barras e check, plantas e pontos decorativos.
- **Paleta:**

  | Uso | Hex |
  | --- | --- |
  | Fundo | `#1B1747` |
  | Roxo | `#6C4BF0` |
  | Lilás | `#9B8CFF` |
  | Branco | `#FFFFFF` |

- **Título:** sans extra-negrito branca, mais um rótulo branco em caixa com texto roxo.
- **Uso:** trabalho, dinheiro, tecnologia, tutorial, dados sociais. Combina com a legenda do R02.

### R07: tipografia cinética (gancho, listas, números)

Arquivo: `R07-tipografia-cinetica.jpg`. Pacote de templates, sem dados.

- **Visual:** fundo preto, sans geométrica extra-negrito em caixa alta (`Montserrat` 800 ou `Anton`), palavras empilhadas em tamanhos diferentes, texto vertical, caixas chapadas atrás de palavras, deslocamento RGB (camadas vermelha e azul) e barras e pontos de exclamação gráficos.
- **Paleta:**

  | Uso | Hex |
  | --- | --- |
  | Amarelo | `#FFE600` |
  | Vermelho | `#E8312A` |
  | Branco | `#FFFFFF` |
  | Azul | `#4A90E2` |
  | Fundo | `#000000` |

- **Uso:** gancho em texto, "top N", números de impacto e transições. Também serve como camada sobre qualquer outro preset. Custo quase zero, porque é só HTML.

### R08: laboratório de vidro (química, biologia)

Arquivo: `R08-ciencia-vidro.jpg`. Sem dados de engajamento.

- **Visual:** frascos de vidro transparente sobre um pedestal escuro, moléculas laranja brilhantes, faíscas ciano, fumaça e cubos de vidro flutuando.
- **Paleta:**

  | Uso | Hex |
  | --- | --- |
  | Fundo | `#0E0E12` |
  | Laranja | `#FFB020` |
  | Ciano | `#3EC8FF` |
  | Vidro | `#DDEBF2` (claro, pouco opaco) |

- **Uso:** química, biologia, medicina, física de partículas.
- **Limite:** vidro com `transmission` é pesado sem placa de vídeo. Use em 1 a 3 objetos e bloom só nas moléculas.
