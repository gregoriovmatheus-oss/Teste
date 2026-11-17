#!/usr/bin/env python3
"""doc.py: padrão "documentário" (ref. do usuário: gravidade some por 5 s). Rode de dentro de videos/<slug>/.

  python3 scripts/doc.py

Faz quatro coisas, todas idempotentes:
 1. compositions/doc.html: capítulos ("01 O PLANETA") e HUD de instrumentos (fonte mono, barras de 2 px,
    "T+"), lidos de video.json → "doc":
      {"capitulos": [[t, "NOME"], ...],
       "hud": [{"rotulo": "MARÉ", "unid": "%", "fmt": "int|f1|f2|dias|hhmm|mmss|bi|texto",
                "keys": [[t, v], ...], "max": 100, "alerta": [[t0, t1], ...], "de": t, "ate": t}, ...]}
    "texto" usa keys [[t, "PRESENTE"], ...] (degrau). Os outros interpolam linearmente.
 2. index.html: @font-face Inter/JetBrains Mono e host "doc" (faixa 4, z 4).
 3. compositions/captions.html: legenda Inter 600, números em mono azul.
 4. scripts/monta-cenas.py: rótulos em Inter 300 com palavra-chave .y em 800 degradê e kicker .k mono.
"""
import json, os, re, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
v = json.load(open("video.json")); D = v["duracao"]; doc = v.get("doc", {})
AZ, LA = "#7cc8ff", "#ff8a4c"

FONTS = ""
for fam, arq, peso in [("Inter", "inter-latin-300-normal", 300), ("Inter", "inter-latin-ext-300-normal", 300),
                       ("Inter", "inter-latin-600-normal", 600), ("Inter", "inter-latin-ext-600-normal", 600),
                       ("Inter", "inter-latin-800-normal", 800), ("Inter", "inter-latin-ext-800-normal", 800),
                       ("JetBrains Mono", "jetbrains-mono-latin-400-normal", 400), ("JetBrains Mono", "jetbrains-mono-latin-600-normal", 600)]:
    ur = "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1EFF" if "ext" in arq else "U+0000-00FF, U+2000-206F, U+2212"
    FONTS += f'      @font-face {{ font-family: "{fam}"; font-weight: {peso}; font-display: block; src: url("assets/fonts/{arq}.woff2") format("woff2"); unicode-range: {ur}; }}\n'

# ---------- 1. doc.html ----------
caps = doc.get("capitulos", []); hud = doc.get("hud", [])
rows = []
for i, h in enumerate(hud):
    rows.append(f'''    <div class="row" id="h{i}"><span class="lbl">{h["rotulo"]}</span><span class="val"><span id="h{i}v"></span> <span class="un">{h.get("unid", "")}</span></span></div>
    <div class="meter" id="h{i}m"><div id="h{i}b"></div></div>''')
html = f'''<template>
  <!-- Gerado por scripts/doc.py (padrão documentário). Não edite à mão: edite video.json → doc. -->
  <style>
    #root {{ position: absolute; inset: 0; pointer-events: none; }}
    #chap {{ position: absolute; left: 64px; top: 196px; display: flex; gap: 20px; align-items: baseline; font-family: "JetBrains Mono", monospace;
      font-weight: 600; font-size: 26px; letter-spacing: 0.3em; color: #f3efe8; text-shadow: 0 2px 14px rgba(0,0,0,0.8); opacity: 0; }}
    #chapN {{ color: {AZ}; font-size: 54px; letter-spacing: 0; }}
    #hud {{ position: absolute; left: 64px; right: 64px; top: 268px; font-family: "JetBrains Mono", monospace; opacity: 0; text-shadow: 0 1px 10px rgba(0,0,0,0.85); }}
    .row {{ display: flex; justify-content: space-between; align-items: baseline; margin-top: 16px; }}
    .lbl {{ font-size: 22px; letter-spacing: 0.22em; color: rgba(243,239,232,0.68); }}
    .val {{ font-size: 30px; letter-spacing: 0.06em; color: #f3efe8; white-space: nowrap; }}
    .un {{ font-size: 22px; color: rgba(243,239,232,0.7); }}
    .val.al {{ color: {LA}; }}
    .meter {{ height: 3px; background: rgba(255,255,255,0.16); margin-top: 10px; overflow: hidden; }}
    .meter > div {{ height: 100%; background: {AZ}; transform-origin: left; transform: scaleX(0); }}
    .meter.al > div {{ background: {LA}; }}
  </style>
  <div id="root" data-composition-id="doc" data-width="1080" data-height="1920">
    <div id="chap"><span id="chapN">01</span><span id="chapT"></span></div>
    <div id="hud">
{chr(10).join(rows)}
    </div>
  </div>
  <script>
    (function () {{
      const CAPS = {json.dumps(caps, ensure_ascii=False)}, HUD = {json.dumps(hud, ensure_ascii=False)}, D = {D};
      const $ = (id) => document.getElementById(id);
      const val = (h, t) => {{
        const k = h.keys; if (h.fmt === "texto") {{ let s = k[0][1]; for (const [a, b] of k) if (t >= a) s = b; return s; }}
        if (t <= k[0][0]) return k[0][1];
        for (let i = 1; i < k.length; i++) if (t <= k[i][0]) {{ const [a, x] = k[i - 1], [b, y] = k[i]; return x + (y - x) * (t - a) / Math.max(1e-6, b - a); }}
        return k[k.length - 1][1];
      }};
      const pad = (n) => String(Math.floor(n)).padStart(2, "0");
      const fmt = (h, x) => {{
        switch (h.fmt) {{
          case "f1": return x.toFixed(1).replace(".", ",");
          case "f2": return x.toFixed(2).replace(".", ",");
          case "dias": return x.toFixed(1).replace(".", ",") + " / 7";
          case "hhmm": return "T+" + pad(x) + ":" + pad((x % 1) * 60);
          case "mmss": return "T+" + pad(x / 60) + ":" + pad(x % 60);
          case "bi": return Math.round(x).toLocaleString("pt-BR");
          case "texto": return x;
          default: return Math.round(x).toLocaleString("pt-BR");
        }}
      }};
      const upd = (t) => {{
        let c = -1; CAPS.forEach(([a], i) => {{ if (t >= a) c = i; }});
        if (c >= 0) {{ $("chapN").textContent = String(c + 1).padStart(2, "0"); $("chapT").textContent = CAPS[c][1];
          const u = t - CAPS[c][0]; $("chap").style.opacity = Math.min(1, u / 0.4) * (u < 3.6 ? 1 : Math.max(0, 1 - (u - 3.6) / 0.6));
          $("chap").style.transform = `translateX(${{-14 * Math.max(0, 1 - u / 0.4)}}px)`; }}
        HUD.forEach((h, i) => {{
          const on = t >= (h.de ?? 0.4) && t < (h.ate ?? D - 0.2); const x = val(h, t);
          for (const id of [`h${{i}}`, `h${{i}}m`]) $(id).style.display = on ? "" : "none";
          $(`h${{i}}v`).textContent = fmt(h, x);
          const al = (h.alerta || []).some(([a, b]) => t >= a && t < b);
          $(`h${{i}}v`).parentElement.classList.toggle("al", al); $(`h${{i}}m`).classList.toggle("al", al);
          $(`h${{i}}b`).style.transform = `scaleX(${{h.fmt === "texto" ? (al ? 0 : 1) : Math.max(0, Math.min(1, x / (h.max || 1)))}})`;
        }});
        const ini = Math.min(...HUD.map((h) => h.de ?? 0.4)), fim = Math.max(...HUD.map((h) => h.ate ?? D - 0.2));
        $("hud").style.opacity = HUD.length ? Math.min(1, Math.max(0, (t - ini) / 0.6)) * Math.min(1, Math.max(0, (fim - t) / 0.6)) : 0;
      }};
      const tl = gsap.timeline({{ paused: true }}); const p = {{ t: 0 }};
      tl.to(p, {{ t: D, duration: D, ease: "none", onUpdate: () => upd(p.t) }}, 0);
      upd(0);
      window.__timelines = window.__timelines || {{}}; window.__timelines["doc"] = tl;
    }})();
  </script>
</template>
'''
open("compositions/doc.html", "w").write(html)

# ---------- 2. index.html ----------
ix = open("index.html").read()
if "inter-latin-300" not in ix:
    ix = ix.replace("    <style>\n", "    <style>\n" + FONTS, 1)
ix = re.sub(r'\n      <div id="doc"[^\n]*</div>', "", ix)
hostdoc = (f'      <div id="doc" data-composition-id="doc" data-composition-src="compositions/doc.html" data-start="0.0" '
           f'data-duration="{D}" data-track-index="4" data-track-kind="graphics" data-width="1080" data-height="1920" style="z-index: 4"></div>')
ix = ix.replace('      <div id="captions"', hostdoc + '\n      <div id="captions"', 1)
open("index.html", "w").write(ix)

# ---------- 3. legendas ----------
cp = open("compositions/captions.html").read()
cp = re.sub(r'\.cap-t \{[^}]*\}', '.cap-t { display: block; font-family: "Inter", sans-serif; font-weight: 600; font-size: 62px; line-height: 1.12; color: #FFFFFF; '
            'letter-spacing: -0.01em; text-shadow: 0 0 2px rgba(0,0,0,0.9), 0 2px 12px rgba(0,0,0,0.75), 0 4px 30px rgba(0,0,0,0.5); }', cp, count=1)
cp = re.sub(r'\.cap-t \.num \{[^}]*\}', f'.cap-t .num {{ font-family: "JetBrains Mono", monospace; color: {AZ}; letter-spacing: 0.02em; }}', cp)
open("compositions/captions.html", "w").write(cp)

# ---------- 4. rótulos das cenas ----------
mc = open("scripts/monta-cenas.py").read()
a = mc.index("    .rot-t {"); b = mc.index('"""', a)
mc = mc[:a] + '''    .rot-t { display: block; font-family: "Inter", sans-serif; font-weight: 300; font-size: 84px; line-height: 1.1; color: #fff; text-transform: none;
      letter-spacing: -0.01em; text-shadow: 0 2px 30px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6); opacity: 0; }
    .rot-t .y { font-weight: 800; background: linear-gradient(90deg, #ffffff, #9fd6ff); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: none; }
    .rot-t .p { font-size: 64px; }
    .rot-t .k { display: inline-block; font-family: "JetBrains Mono", monospace; font-weight: 600; font-size: 26px; letter-spacing: 0.32em; color: #7cc8ff; margin-bottom: 18px; }
    .rot-t .n { font-family: "JetBrains Mono", monospace; font-weight: 600; color: #7cc8ff; }
''' + mc[b:]
mc = mc.replace("cena 3D anime cel-shaded (R09)", "cena 3D padrão documentário (R10 + doc)")
open("scripts/monta-cenas.py", "w").write(mc)
print("doc.html:", len(caps), "capítulos,", len(hud), "medidores · index, legendas e rótulos atualizados")
