# ZERO GRAVITY — 5 segundos sem gravidade

Experiência cinematográfica 3D em tempo real (Three.js + WebGL) sobre a hipótese:
**“E se a gravidade da Terra desaparecesse por 5 segundos?”**

Tudo é procedural: nenhuma textura, modelo ou áudio externo.

## Executar

```bash
npm install
npm run dev      # abre em http://localhost:5173
npm run build    # gera dist/ para produção
```

Clique em **INICIAR** (necessário para liberar o áudio). Use fones de ouvido.

| Tecla | Ação |
|---|---|
| Espaço | pausa / continua |
| H | oculta HUD e legendas |
| R | reinicia |

Parâmetros de URL úteis: `?t=30` (salta para o segundo 30, simulação determinística),
`?q=1` (fixa a resolução), `?hq` (permite pixel ratio 2), `?debug`.

## Sequência (~51 s)

1. **O Planeta** — Terra procedural (continentes, oceanos com reflexo especular, nuvens, luzes noturnas, atmosfera com espalhamento), aproximação de câmera.
2. **O Desaparecimento** — linhas do campo gravitacional se estilhaçam, onda de choque percorre o globo, mergulho até a cidade.
3. **O Caos** — macro no asfalto (pedras, folhas, gotas da poça), carros e ônibus, silhuetas de pessoas, árvores arrancadas com raízes, esferas de água da fonte, café flutuando, plano aéreo.
4. **O Planeta em Colapso** — órbita baixa com glóbulos de água, spray oceânico se desprendendo (atmosfera e oceanos permanecem — a escala é declaradamente exagerada).
5. **O Retorno** — tudo cai: impactos, faíscas, rachaduras, ondas de choque, poeira volumétrica, fumaça e fogo; plano final da cidade destruída.

## Técnica

- `src/space/` — Terra assada na GPU (equiretangular 4096×2048), atmosfera por integração de espalhamento Rayleigh/Mie, campo gravitacional, spray oceânico (60k partículas), estrelas em 3 camadas + via láctea.
- `src/city/` — skyline instanciado (~3.700 prédios) com fachadas geradas em shader, chão procedural (faixas, faixas de pedestre, calçadas, praça), carros/ônibus/pessoas/árvores/mobiliário por geometria procedural, física de corpos rígidos com passo fixo, partículas billboard (poeira, fumaça, fogo, faíscas), anéis de choque, decalques de rachadura, fonte com jatos analíticos e esferas de água com transmissão.
- `src/core/post.js` — pipeline próprio: HDR + MSAA → god rays → bloom → profundidade de campo → motion blur por reprojeção de profundidade, distorção de onda de choque, aberração cromática, lens flare, ACES, color grading, vinheta e grão.
- `src/core/heightFog.js` — névoa exponencial por altura injetada nos shaders do Three.js.
- `src/core/audio.js` — trilha e efeitos sonoros sintetizados com Web Audio.
- `src/director.js` — linha do tempo, câmeras, legendas e HUD (tempo real decorrido em câmera lenta).
- Resolução adaptativa mantém a fluidez em computadores comuns.

> Hipótese cinematográfica — não é uma previsão científica.
