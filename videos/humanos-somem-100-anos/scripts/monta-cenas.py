#!/usr/bin/env python3
"""monta-cenas.py — gera compositions/fNN.html a partir de cenas/fNN.js.

cenas/fNN.js começa com /*META {...} */ (rótulos, imports) e traz o corpo do 3D (cria `st` e `render(t)`).
Tempos do corpo e dos rótulos são escritos na duração em que a cena foi criada ("D0", guardada no META
ou, se faltar, a duração atual em video.json). Em tempo de execução a cena lê a duração real do host
(data-duration) e estica tudo na proporção: render(t * D0 / DR) e rótulos em t * DR / D0.
Assim, depois de trocar a narração e rodar scripts/cenas.py, as cenas se adaptam sem reescrever nada.

  python3 scripts/monta-cenas.py [f01 f02 ...]
"""
import json, sys, os, re
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
v = json.load(open('video.json'))
dur = {c['id']: round(c['fim'] - c['inicio'], 2) for c in v['cenas']}
CSS = """    #root { position: absolute; inset: 0; overflow: hidden; background: #0b0a12; }
    #ID-canvas { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }
    /* rótulos 2D: y 680-980, acima da faixa da legenda (1005-1235) */
    .rot { position: absolute; left: 100px; right: 260px; top: 700px; height: 280px; display: flex; align-items: center; justify-content: center; text-align: center; }
    .rot-t { display: block; font-family: "Anton", sans-serif; font-size: 92px; line-height: 1.0; color: #fff; text-transform: uppercase;
      letter-spacing: 0.02em; text-shadow: 0 4px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.6); opacity: 0; }
    .rot-t .y { color: #FFC56B; }
    .rot-t .p { font-size: 70px; }
"""
def build(sid):
    src = open(f'cenas/{sid}.js').read()
    m = re.match(r'/\*META(.*?)\*/', src, re.S)
    meta = json.loads(m.group(1)) if m else {}
    body = src[m.end():] if m else src
    D0 = meta.get('D0') or dur[sid]
    if 'D0' not in meta and m:  # grava a duração de autoria na primeira montagem
        meta['D0'] = D0
        src = '/*META ' + json.dumps(meta, ensure_ascii=False) + ' */' + body
        open(f'cenas/{sid}.js', 'w').write(src)
    labels = meta.get('rotulos', [])
    html_l, tl_l = [], []
    for i, r in enumerate(labels):
        a, b, txt = r['de'], r['ate'], r['texto']
        top = min(r.get('top', 700), 700)
        lid = f'{sid}-r{i+1}'
        vis = ' style="opacity: 1"' if r.get('fixo') else ''
        html_l.append(f'    <div id="{lid}" class="rot" style="top: {top}px"><span id="{lid}-in" class="rot-t"{vis}>{txt}</span></div>')
        if r.get('fixo'):
            tl_l.append(f'      tl.set("#{lid}-in", {{ opacity: 1 }}, 0);')
            if 'pulso' in r:
                tl_l.append(f'      tl.fromTo("#{lid}-in", {{ scale: 1 }}, {{ scale: 1.08, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" }}, {r["pulso"]} * K);')
        else:
            tl_l.append(f'      tl.fromTo("#{lid}-in", {{ opacity: 0, y: 24, filter: "blur(8px)" }}, {{ opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power3.out" }}, {a} * K);')
            if r.get('sai', True):
                tl_l.append(f'      tl.to("#{lid}-in", {{ opacity: 0, y: -12, filter: "blur(6px)", duration: 0.3, ease: "power2.in" }}, {round(b - 0.3, 2)} * K);')
    imports = meta.get('imports', [])
    imp = ''.join(f', import("./assets/lib/blocks/{x}.js")' for x in imports)
    names = ''.join(', ' + x.upper() for x in imports)
    out = f'''<!-- {sid}: cena 3D anime cel-shaded (R09). Lógica em cenas/{sid}.js (gerado por scripts/monta-cenas.py).
     Tempos escritos para {D0} s e esticados para a duração real do host (data-duration). -->
<template>
  <style>
{CSS.replace("ID", sid)}{meta.get('css', '')}
  </style>
  <div id="root" data-composition-id="{sid}" data-width="1080" data-height="1920">
    <canvas id="{sid}-canvas" width="1080" height="1920"></canvas>
{chr(10).join(html_l)}
  </div>
  <script>
    (function () {{
      const D0 = {D0};
      // duração real = data-duration do host da cena (muda quando a narração muda)
      const durReal = () => {{
        for (let n = document.getElementById("{sid}-canvas"); n; n = n.parentElement) {{
          if (n.getAttribute && n.getAttribute("data-composition-id") === "{sid}" && n.hasAttribute("data-duration")) return parseFloat(n.getAttribute("data-duration")) || D0;
        }}
        return D0;
      }};
      const DR = durReal(), K = DR / D0;
      const tl = gsap.timeline({{ paused: true }});
{chr(10).join(tl_l)}
      tl.set({{}}, {{}}, DR);
      window.__timelines = window.__timelines || {{}};
      window.__timelines["{sid}"] = tl;

      window.__hf = window.__hf || {{}};
      window.__hf.buildReady = window.__hf.buildReady || {{}};
      window.__hf.buildReady["{sid}"] = Promise.all([
        import("./assets/lib/kit.js"), import("./assets/lib/blocks/toy.js"), import("./assets/lib/blocks/animals.js"){imp}
      ]).then(async ([K_, T, A{names}]) => {{
        const K = K_;
        const {{ THREE, ease, range, lerp, clamp, smoothstep, mulberry32 }} = K;
        const D = D0;   // o corpo trabalha no tempo de autoria
        const canvas = document.getElementById("{sid}-canvas");
{body}
        // DR foi lido na hora em que o script rodou (depois do inline o host pode mudar de atributos)
        await K.bindSeek(canvas, (t) => {{ st.T = t * D / DR; st.D = D; render(st.T); }}, {{ warm: [st.warm, ...(st.extraWarm || [])], duration: DR }});
      }});
    }})();
  </script>
</template>
'''
    open(f'compositions/{sid}.html', 'w').write(out)
    print('ok', sid, D0)
for sid in (sys.argv[1:] or sorted(dur)):
    if os.path.exists(f'cenas/{sid}.js'): build(sid)
