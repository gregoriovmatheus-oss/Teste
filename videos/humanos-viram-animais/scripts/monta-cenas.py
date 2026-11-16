# gera compositions/fNN.html a partir de cenas/fNN.js (corpo do render) + rótulos
import json, sys, os, re
os.chdir('/home/user/Teste/videos/humanos-viram-animais')
v = json.load(open('video.json'))
dur = {c['id']: round(c['fim'] - c['inicio'], 2) for c in v['cenas']}
CSS = """    #root { position: absolute; inset: 0; overflow: hidden; background: #8CC7D8; }
    #ID-canvas { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; }
    .rot { position: absolute; left: 100px; right: 260px; top: 700px; height: 280px; display: flex; align-items: center; justify-content: center; text-align: center; }
    .rot-t { display: block; font-family: "Anton", sans-serif; font-size: 92px; line-height: 1.0; color: #fff; text-transform: uppercase;
      -webkit-text-stroke: 4px #1a1410; paint-order: stroke fill; text-shadow: 7px 7px 0 #1a1410; }
    .rot-t .y { color: #F2B53A; }
    .rot-t .p { font-size: 70px; }
"""
def build(sid):
    src = open(f'cenas/{sid}.js').read()
    m = re.match(r'/\*META(.*?)\*/', src, re.S)
    meta = json.loads(m.group(1)) if m else {}
    body = src[m.end():] if m else src
    D = dur[sid]
    labels = meta.get('rotulos', [])
    extra_css = meta.get('css', '')
    html_l, tl_l = [], []
    for i, r in enumerate(labels):
        a, b, txt = r['de'], r['ate'], r['texto']
        top = r.get('top', 700)
        lid = f'{sid}-r{i+1}'
        html_l.append(f'    <div id="{lid}" class="clip rot" style="top: {top}px" data-start="{a}" data-duration="{round(b-a,2)}"><span id="{lid}-in" class="rot-t">{txt}</span></div>')
        if r.get('fixo'):
            tl_l.append(f'      tl.fromTo("#{lid}-in", {{ scale: 1 }}, {{ scale: 1.08, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out" }}, {r["pulso"]});' if 'pulso' in r else '')
        else:
            tl_l.append(f'      tl.fromTo("#{lid}-in", {{ opacity: 0, scale: 0.6 }}, {{ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }}, {a});')
        if r.get('sai', True) and not r.get('fixo'):
            tl_l.append(f'      tl.to("#{lid}-in", {{ opacity: 0, y: -20, duration: 0.25, ease: "power2.in" }}, {round(b-0.3,2)});')
    imports = meta.get('imports', [])
    imp = ''.join(f', import("./assets/lib/blocks/{x}.js")' for x in imports)
    names = ''.join(', ' + x.upper() for x in imports)
    out = f'''<!-- {sid}: cena 3D de massinha. Lógica em cenas/{sid}.js (gerado por scripts/monta-cenas.py). -->
<template>
  <style>
{CSS.replace("ID", sid)}{extra_css}
  </style>
  <div id="root" data-composition-id="{sid}" data-width="1080" data-height="1920">
    <canvas id="{sid}-canvas" width="1080" height="1920"></canvas>
{chr(10).join(html_l)}
  </div>
  <script>
    (function () {{
      const tl = gsap.timeline({{ paused: true }});
{chr(10).join(x for x in tl_l if x)}
      tl.set({{}}, {{}}, {D});
      window.__timelines = window.__timelines || {{}};
      window.__timelines["{sid}"] = tl;

      window.__hf = window.__hf || {{}};
      window.__hf.buildReady = window.__hf.buildReady || {{}};
      window.__hf.buildReady["{sid}"] = Promise.all([
        import("./assets/lib/kit.js"), import("./assets/lib/blocks/toy.js"), import("./assets/lib/blocks/animals.js"){imp}
      ]).then(async ([K, T, A{names}]) => {{
        const {{ THREE, ease, range, lerp, clamp, smoothstep, mulberry32 }} = K;
        const D = {D};
        const canvas = document.getElementById("{sid}-canvas");
{body}
        await K.bindSeek(canvas, render, {{ warm: [st.warm, ...(st.extraWarm || [])], duration: D }});
      }});
    }})();
  </script>
</template>
'''
    open(f'compositions/{sid}.html', 'w').write(out)
    print('ok', sid, D)
for sid in (sys.argv[1:] or sorted(dur)):
    if os.path.exists(f'cenas/{sid}.js'): build(sid)
