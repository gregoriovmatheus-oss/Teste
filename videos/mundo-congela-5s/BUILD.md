# BUILD: guia de montagem para os subagentes

O projeto HyperFrames fica nesta pasta, `videos/mundo-congela-5s/`. Leia antes:
- `STORYBOARD.md`: as cenas.
- `.claude/skills/hyperframes/SKILL.md`: o contrato de render.
- `.claude/skills/hyperframes/references/runtimes.md`, `types/3d.md`, `types/vertical.md` e `captions.md`.
- `.claude/skills/video-curiosidades/referencias/REFERENCIAS.md`: só a seção "Padrão atual".

## Formato

- 1080×1920 a 30 fps, com duração total de 64,5 s.
- O texto fica dentro da faixa de y 168 a 1330 e fora dos ~140 px da direita (coluna de botões).

## Áudio (já gerado, em `audio/`)

| Arquivo | Uso |
| --- | --- |
| `narracao-60s.mp3` | Narração, de 0 s até 63,6 s, volume 1.0 |
| `palavras.json` | Tempo de cada palavra: `[{id,text,start,end}]`, já no tempo de 60 s |
| `sfx/drone.mp3` | Loop de 20 s, em loop o vídeo inteiro, volume ~0.25. Abaixa para ~0.1 entre 5,3 s e 13,4 s (silêncio). |
| `sfx/*.mp3` | Os demais efeitos, um por ação visível. A cena de cada um está abaixo. |

## Cenas (tempos absolutos)

| Cena | Início | Fim | Efeitos (início absoluto) |
| --- | --- | --- | --- |
| F1 gancho, espaço → Brasil → cidade congela | 0 | 5.3 | whoosh 0.3, cidade 2.4, congela 4.6 |
| F2 silêncio e coração | 5.3 | 13.47 | coracao 8.8 e 11.5 |
| F3 o ar congela e cai | 13.47 | 18.07 | cristais 14.6 |
| F4 aviões e pássaros, 122 m | 18.07 | 24.6 | turbina 18.3 |
| F5 o fogo apaga, os carros seguem | 24.6 | 30.8 | fogo 26.3 |
| F6 você no vácuo, saliva ferve | 30.8 | 36.67 | bolhas 33.3 |
| F7 solte o ar | 36.67 | 40.8 | expira 37.8 |
| F8 você não congela, −0,02 °C | 40.8 | 46.2 | tique 43.6 e 45.0 |
| F9 oceano ferve e congela | 46.2 | 49.87 | mar 46.4 |
| F10 o calor volta | 49.87 | 52.53 | riser 49.9 |
| F11 estrondo (HIPÓTESE) | 52.53 | 57.67 | boom 55.8 |
| F12 revelação e pergunta, zoom-out até a Terra | 57.67 | 64.5 | resolve 57.8 |

Dentro de cada cena, um corte ou movimento de câmera a cada 2 a 3 s.

## Camadas do root `index.html`

As camadas ficam empilhadas por `z-index`:
1. Hosts das cenas, de F1 a F12.
2. HUD global, `compositions/hud.html`, de 2.6 s até 52.53 s.
   - Rótulo "O CALOR VOLTA EM".
   - Contador de 5,00 até 0,00, linear entre 2.6 s e 49.87 s.
   - "AR −273 °C".
   - Status âmbar que muda conforme o `status` de cada cena no storyboard.
   - Em 49.87 s o contador fica âmbar em 0,00.
3. Legendas, `compositions/captions.html`, com `data-track-kind="captions"`.
   - Fonte EB Garamond itálica branca com sombra suave, grupos de 2 a 4 palavras, centralizadas em y ≈ 1120.
   - Números em azul-gelo `#8FCBF2`.
4. Áudio.

## Estilo

- **3D:** Three.js no estilo maquete, com geometria low-poly limpa, material fosco (roughness ≥ 0,5), luz principal quente, contorno frio e sombra de contato.
- **Paleta:** cinza-frio `#8D96A2`, geada `#EEF2F6`, gelo `#8FCBF2`, âmbar `#E8B24A`, acento `#D8432F`.
- **Rótulos, números e setas:** em 2D HTML por cima do 3D, nunca inclinados.
- **Fontes:** coloque em `assets/fonts/` e declare com `@font-face`: EB Garamond (normal e itálica), Montserrat 600 e Anton.
- **Three.js:** cópia local em `assets/lib/three.module.js`, sem CDN na hora do render. O helper compartilhado `assets/lib/kit.js` cria o renderer, a cena, as luzes, a câmera, o PRNG mulberry32 e as funções de easing.
- **Cada cena** desenha a partir de `e.detail.time` no evento `hf-seek`. Use o tempo local da cena e não use `requestAnimationFrame`.
